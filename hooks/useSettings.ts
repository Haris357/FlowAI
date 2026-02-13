import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SettingOption, ALL_SETTINGS } from '@/lib/settings-seed-data';
import { initializeCompanySettings, CompanySetting } from '@/services/settings';

interface UseSettingsOptions {
  companyId?: string;
  autoInitialize?: boolean;
}

interface SettingsData {
  // All settings keyed by category code
  invoiceStatuses: SettingOption[];
  billStatuses: SettingOption[];
  quoteStatuses: SettingOption[];
  purchaseOrderStatuses: SettingOption[];
  creditNoteStatuses: SettingOption[];
  debitNoteStatuses: SettingOption[];
  salarySlipStatuses: SettingOption[];
  paymentMethods: SettingOption[];
  expenseCategories: SettingOption[];
  incomeCategories: SettingOption[];
  businessTypes: SettingOption[];
  employeeStatuses: SettingOption[];
  salaryTypes: SettingOption[];
  employmentTypes: SettingOption[];
  customerTypes: SettingOption[];
  vendorTypes: SettingOption[];
  transactionTypes: SettingOption[];
  taxTypes: SettingOption[];
}

// Map category codes to state keys
const CATEGORY_MAP: Record<string, keyof SettingsData> = {
  invoice_status: 'invoiceStatuses',
  bill_status: 'billStatuses',
  quote_status: 'quoteStatuses',
  purchase_order_status: 'purchaseOrderStatuses',
  credit_note_status: 'creditNoteStatuses',
  debit_note_status: 'debitNoteStatuses',
  salary_slip_status: 'salarySlipStatuses',
  payment_method: 'paymentMethods',
  expense_category: 'expenseCategories',
  income_category: 'incomeCategories',
  business_type: 'businessTypes',
  employee_status: 'employeeStatuses',
  salary_type: 'salaryTypes',
  employment_type: 'employmentTypes',
  customer_type: 'customerTypes',
  vendor_type: 'vendorTypes',
  transaction_type: 'transactionTypes',
  tax_type: 'taxTypes',
};

// Get default options from seed data
function getDefaultSettings(): SettingsData {
  const defaults: SettingsData = {
    invoiceStatuses: [],
    billStatuses: [],
    quoteStatuses: [],
    purchaseOrderStatuses: [],
    creditNoteStatuses: [],
    debitNoteStatuses: [],
    salarySlipStatuses: [],
    paymentMethods: [],
    expenseCategories: [],
    incomeCategories: [],
    businessTypes: [],
    employeeStatuses: [],
    salaryTypes: [],
    employmentTypes: [],
    customerTypes: [],
    vendorTypes: [],
    transactionTypes: [],
    taxTypes: [],
  };

  for (const category of ALL_SETTINGS) {
    const key = CATEGORY_MAP[category.code];
    if (key) {
      defaults[key] = category.options;
    }
  }

  return defaults;
}

export function useSettings(options: UseSettingsOptions = {}) {
  const { companyId, autoInitialize = true } = options;
  const [settings, setSettings] = useState<SettingsData>(getDefaultSettings());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize settings if needed
  useEffect(() => {
    if (!companyId || !autoInitialize || initialized) return;

    const initSettings = async () => {
      try {
        await initializeCompanySettings(companyId);
        setInitialized(true);
      } catch (err) {
        console.error('Error initializing settings:', err);
      }
    };

    initSettings();
  }, [companyId, autoInitialize, initialized]);

  // Subscribe to settings changes
  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const settingsRef = collection(db, `companies/${companyId}/settings`);

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.empty) {
          // Use defaults if no settings exist
          setSettings(getDefaultSettings());
        } else {
          const newSettings = { ...getDefaultSettings() };

          snapshot.docs.forEach((doc) => {
            const data = doc.data() as CompanySetting;
            const key = CATEGORY_MAP[data.categoryCode];
            if (key && data.options) {
              newSettings[key] = data.options;
            }
          });

          setSettings(newSettings);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Settings error:', err);
        setError(err);
        setLoading(false);
        // Fall back to defaults on error
        setSettings(getDefaultSettings());
      }
    );

    return () => unsubscribe();
  }, [companyId]);

  // Helper functions
  const getOptionLabel = useCallback((categoryKey: keyof SettingsData, code: string): string => {
    const options = settings[categoryKey];
    const option = options.find(o => o.code === code);
    return option?.label || code;
  }, [settings]);

  const getOptionColor = useCallback((categoryKey: keyof SettingsData, code: string): string | undefined => {
    const options = settings[categoryKey];
    const option = options.find(o => o.code === code);
    return option?.color;
  }, [settings]);

  const getDefaultOption = useCallback((categoryKey: keyof SettingsData): SettingOption | undefined => {
    const options = settings[categoryKey];
    return options.find(o => o.isDefault);
  }, [settings]);

  const getActiveOptions = useCallback((categoryKey: keyof SettingsData): SettingOption[] => {
    const options = settings[categoryKey];
    return options.filter(o => o.isActive !== false);
  }, [settings]);

  // Transform options for select dropdowns
  const getSelectOptions = useCallback((categoryKey: keyof SettingsData): { value: string; label: string }[] => {
    return getActiveOptions(categoryKey).map(o => ({
      value: o.code,
      label: o.label,
    }));
  }, [getActiveOptions]);

  return {
    ...settings,
    loading,
    error,
    // Helpers
    getOptionLabel,
    getOptionColor,
    getDefaultOption,
    getActiveOptions,
    getSelectOptions,
  };
}

// Hook for a specific settings category
export function useSettingsCategory(companyId: string | undefined, categoryCode: string) {
  const [options, setOptions] = useState<SettingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!companyId) {
      // Use defaults
      const category = ALL_SETTINGS.find(c => c.code === categoryCode);
      setOptions(category?.options || []);
      setLoading(false);
      return;
    }

    setLoading(true);

    const settingRef = doc(db, `companies/${companyId}/settings`, categoryCode);

    const unsubscribe = onSnapshot(
      settingRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setOptions(data.options || []);
        } else {
          // Fall back to defaults
          const category = ALL_SETTINGS.find(c => c.code === categoryCode);
          setOptions(category?.options || []);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Settings category error:', err);
        setError(err);
        setLoading(false);
        // Fall back to defaults
        const category = ALL_SETTINGS.find(c => c.code === categoryCode);
        setOptions(category?.options || []);
      }
    );

    return () => unsubscribe();
  }, [companyId, categoryCode]);

  const getLabel = useCallback((code: string): string => {
    const option = options.find(o => o.code === code);
    return option?.label || code;
  }, [options]);

  const getColor = useCallback((code: string): string | undefined => {
    const option = options.find(o => o.code === code);
    return option?.color;
  }, [options]);

  const activeOptions = useMemo(() => {
    return options.filter(o => o.isActive !== false);
  }, [options]);

  const selectOptions = useMemo(() => {
    return activeOptions.map(o => ({
      value: o.code,
      label: o.label,
    }));
  }, [activeOptions]);

  return {
    options,
    activeOptions,
    selectOptions,
    loading,
    error,
    getLabel,
    getColor,
  };
}
