import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import {
  ALL_SETTINGS,
  SettingOption,
  SettingsCategory,
  getDefaultOption,
  getOptionByCode,
  getOptionLabel,
  getOptionColor,
} from '@/lib/settings-seed-data';

export interface CompanySetting {
  id: string;
  categoryCode: string;
  categoryName: string;
  options: SettingOption[];
  updatedAt?: any;
}

// Initialize settings for a company with defaults
export async function initializeCompanySettings(companyId: string): Promise<void> {
  const settingsRef = collection(db, `companies/${companyId}/settings`);
  const existingSnapshot = await getDocs(settingsRef);

  // Skip if settings already exist
  if (!existingSnapshot.empty) {
    console.log(`Settings already exist for company ${companyId}`);
    return;
  }

  // Create settings for each category
  for (const category of ALL_SETTINGS) {
    await setDoc(doc(settingsRef, category.code), {
      categoryCode: category.code,
      categoryName: category.name,
      description: category.description,
      options: category.options,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  console.log(`Settings initialized for company ${companyId}`);
}

// Get all settings for a company.
// The `settings` subcollection is shared with non-category docs like
// `account_preferences`, `dashboard_preferences`, and `exchangeRates`.
// Filter strictly to known category codes so they don't render as empty rows
// in the Customize Options UI.
export async function getCompanySettings(companyId: string): Promise<CompanySetting[]> {
  const settingsRef = collection(db, `companies/${companyId}/settings`);
  const knownCodes = new Set(ALL_SETTINGS.map(c => c.code));
  const snapshot = await getDocs(settingsRef);

  const docsToReturn = snapshot.empty
    ? (await (async () => {
        await initializeCompanySettings(companyId);
        return (await getDocs(settingsRef)).docs;
      })())
    : snapshot.docs;

  return docsToReturn
    .filter(d => knownCodes.has(d.id))
    .map(d => ({ id: d.id, ...d.data() } as CompanySetting));
}

// Get settings for a specific category
export async function getCategorySettings(
  companyId: string,
  categoryCode: string
): Promise<SettingOption[]> {
  const settingRef = doc(db, `companies/${companyId}/settings`, categoryCode);
  const snapshot = await getDoc(settingRef);

  if (!snapshot.exists()) {
    // Return default options if not found
    const category = ALL_SETTINGS.find(c => c.code === categoryCode);
    return category?.options || [];
  }

  const data = snapshot.data();
  return data.options || [];
}

// Get specific setting options (shorthand functions)
export async function getInvoiceStatuses(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'invoice_status');
}

export async function getBillStatuses(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'bill_status');
}

export async function getQuoteStatuses(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'quote_status');
}

export async function getPurchaseOrderStatuses(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'purchase_order_status');
}

export async function getCreditNoteStatuses(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'credit_note_status');
}

export async function getDebitNoteStatuses(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'debit_note_status');
}

export async function getSalarySlipStatuses(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'salary_slip_status');
}

export async function getPaymentMethods(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'payment_method');
}

export async function getExpenseCategories(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'expense_category');
}

export async function getIncomeCategories(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'income_category');
}

export async function getBusinessTypes(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'business_type');
}

export async function getEmployeeStatuses(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'employee_status');
}

export async function getSalaryTypes(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'salary_type');
}

export async function getEmploymentTypes(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'employment_type');
}

export async function getCustomerTypes(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'customer_type');
}

export async function getVendorTypes(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'vendor_type');
}

export async function getTransactionTypes(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'transaction_type');
}

export async function getTaxTypes(companyId: string): Promise<SettingOption[]> {
  return getCategorySettings(companyId, 'tax_type');
}

// Add a custom option to a category
export async function addSettingOption(
  companyId: string,
  categoryCode: string,
  option: Omit<SettingOption, 'order' | 'isSystem'>
): Promise<void> {
  const settingRef = doc(db, `companies/${companyId}/settings`, categoryCode);
  const snapshot = await getDoc(settingRef);

  if (!snapshot.exists()) {
    throw new Error(`Category ${categoryCode} not found`);
  }

  const data = snapshot.data();
  const options = data.options || [];

  // Calculate next order
  const maxOrder = Math.max(0, ...options.map((o: SettingOption) => o.order));

  // Add new option
  options.push({
    ...option,
    order: maxOrder + 1,
    isSystem: false,
  });

  await updateDoc(settingRef, {
    options,
    updatedAt: serverTimestamp(),
  });
}

// Update an option in a category
export async function updateSettingOption(
  companyId: string,
  categoryCode: string,
  optionCode: string,
  updates: Partial<SettingOption>
): Promise<void> {
  const settingRef = doc(db, `companies/${companyId}/settings`, categoryCode);
  const snapshot = await getDoc(settingRef);

  if (!snapshot.exists()) {
    throw new Error(`Category ${categoryCode} not found`);
  }

  const data = snapshot.data();
  const options = data.options || [];

  const optionIndex = options.findIndex((o: SettingOption) => o.code === optionCode);
  if (optionIndex === -1) {
    throw new Error(`Option ${optionCode} not found`);
  }

  // Prevent updating system options' code
  if (options[optionIndex].isSystem && updates.code) {
    throw new Error('Cannot change code of system options');
  }

  // Update option
  options[optionIndex] = {
    ...options[optionIndex],
    ...updates,
  };

  await updateDoc(settingRef, {
    options,
    updatedAt: serverTimestamp(),
  });
}

// Delete a custom option from a category
export async function deleteSettingOption(
  companyId: string,
  categoryCode: string,
  optionCode: string
): Promise<void> {
  const settingRef = doc(db, `companies/${companyId}/settings`, categoryCode);
  const snapshot = await getDoc(settingRef);

  if (!snapshot.exists()) {
    throw new Error(`Category ${categoryCode} not found`);
  }

  const data = snapshot.data();
  const options = data.options || [];

  const option = options.find((o: SettingOption) => o.code === optionCode);
  if (!option) {
    throw new Error(`Option ${optionCode} not found`);
  }

  if (option.isSystem) {
    throw new Error('Cannot delete system options');
  }

  const filteredOptions = options.filter((o: SettingOption) => o.code !== optionCode);

  await updateDoc(settingRef, {
    options: filteredOptions,
    updatedAt: serverTimestamp(),
  });
}

// Reset category to defaults
export async function resetCategoryToDefaults(
  companyId: string,
  categoryCode: string
): Promise<void> {
  const category = ALL_SETTINGS.find(c => c.code === categoryCode);
  if (!category) {
    throw new Error(`Category ${categoryCode} not found in defaults`);
  }

  const settingRef = doc(db, `companies/${companyId}/settings`, categoryCode);
  await setDoc(settingRef, {
    categoryCode: category.code,
    categoryName: category.name,
    description: category.description,
    options: category.options,
    updatedAt: serverTimestamp(),
  });
}

// Export helper functions from seed data
export { getDefaultOption, getOptionByCode, getOptionLabel, getOptionColor };
