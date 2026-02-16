'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Container,
  Input,
  Select,
  Option,
  Button,
  Divider,
  Switch,
  FormControl,
  FormLabel,
  FormHelperText,
  Avatar,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  IconButton,
  Modal,
  ModalDialog,
  ModalClose,
  Chip,
  Table,
  Sheet,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionGroup,
  Textarea,
  Skeleton,
} from '@mui/joy';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoadingSpinner, ConfirmDialog, DangerousConfirmDialog, PageBreadcrumbs } from '@/components/common';
import {
  Building2,
  User,
  CreditCard,
  Bell,
  Shield,
  Save,
  LogOut,
  Settings2,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  ChevronDown,
  FileText,
  Receipt,
  AlertTriangle,
  Sliders,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '@/hooks';
import {
  getCompanySettings,
  addSettingOption,
  updateSettingOption,
  deleteSettingOption,
  resetCategoryToDefaults,
  CompanySetting,
} from '@/services/settings';
import { SettingOption, ALL_SETTINGS } from '@/lib/settings-seed-data';
import { deleteCompanyData, getCompanyDataCounts } from '@/services/company';
import { getAccountPreferences, updateAccountPreferences } from '@/services/preferences';
import { getAccounts } from '@/services/accounts';
import { Account, AccountPreferences } from '@/types';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
];

const FISCAL_YEAR_STARTS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const PAYMENT_TERMS = [
  { value: 0, label: 'Due on Receipt' },
  { value: 7, label: 'Net 7' },
  { value: 15, label: 'Net 15' },
  { value: 30, label: 'Net 30' },
  { value: 45, label: 'Net 45' },
  { value: 60, label: 'Net 60' },
  { value: 90, label: 'Net 90' },
];

export default function SettingsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { company, loading: companyLoading } = useCompany();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Company settings state
  const [companyName, setCompanyName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [fiscalYearStart, setFiscalYearStart] = useState(1);
  const [hasInventory, setHasInventory] = useState(false);
  const [hasEmployees, setHasEmployees] = useState(false);

  // Invoice settings state
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [invoiceNextNumber, setInvoiceNextNumber] = useState(1);
  const [invoiceDefaultTerms, setInvoiceDefaultTerms] = useState(30);
  const [invoiceDefaultTaxRate, setInvoiceDefaultTaxRate] = useState(0);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceFooter, setInvoiceFooter] = useState('');

  // Bill settings state
  const [billPrefix, setBillPrefix] = useState('BILL');
  const [billNextNumber, setBillNextNumber] = useState(1);
  const [billDefaultTerms, setBillDefaultTerms] = useState(30);

  // Preferences state
  const [enableTax, setEnableTax] = useState(true);
  const [showDecimalPlaces, setShowDecimalPlaces] = useState(2);
  const [dateFormat, setDateFormat] = useState('MM/dd/yyyy');

  // Custom options state
  const [customSettings, setCustomSettings] = useState<CompanySetting[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<SettingOption | null>(null);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionCode, setNewOptionCode] = useState('');
  const [newOptionColor, setNewOptionColor] = useState('');
  const [savingOption, setSavingOption] = useState(false);

  // Confirm dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [pendingDeleteOption, setPendingDeleteOption] = useState<{ categoryCode: string; optionCode: string } | null>(null);
  const [pendingResetCategory, setPendingResetCategory] = useState<string | null>(null);

  // Validation state
  const [labelError, setLabelError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);

  // Account preferences state
  const [accountPreferences, setAccountPreferences] = useState<AccountPreferences>({});
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Delete company data state
  const [deleteDataConfirmOpen, setDeleteDataConfirmOpen] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [dataCounts, setDataCounts] = useState<Record<string, number> | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (company) {
      setCompanyName(company.name || '');
      setCurrency(company.currency || 'USD');
      setFiscalYearStart(company.fiscalYearStart || 1);
      setHasInventory(company.hasInventory || false);
      setHasEmployees(company.hasEmployees || false);

      // Invoice settings
      setInvoicePrefix(company.invoicePrefix || 'INV');
      setInvoiceNextNumber(company.invoiceNextNumber || 1);
      setInvoiceDefaultTerms(company.invoiceDefaultTerms ?? 30);
      setInvoiceDefaultTaxRate(company.invoiceDefaultTaxRate ?? 0);
      setInvoiceNotes(company.invoiceNotes || '');
      setInvoiceFooter(company.invoiceFooter || '');

      // Bill settings
      setBillPrefix(company.billPrefix || 'BILL');
      setBillNextNumber(company.billNextNumber || 1);
      setBillDefaultTerms(company.billDefaultTerms ?? 30);

      // Preferences
      setEnableTax(company.enableTax ?? true);
      setShowDecimalPlaces(company.showDecimalPlaces ?? 2);
      setDateFormat(company.dateFormat || 'MM/dd/yyyy');
    }
  }, [company]);

  // Load account preferences and accounts
  useEffect(() => {
    async function loadPreferences() {
      if (!company?.id) return;
      try {
        const [prefs, accounts] = await Promise.all([
          getAccountPreferences(company.id),
          getAccounts(company.id),
        ]);
        setAccountPreferences(prefs);
        setAllAccounts(accounts);
      } catch (error) {
        console.error('Error loading account preferences:', error);
      } finally {
        setLoadingPreferences(false);
      }
    }
    loadPreferences();
  }, [company?.id]);

  // Load custom settings
  useEffect(() => {
    async function loadCustomSettings() {
      if (!company?.id) return;
      try {
        const settings = await getCompanySettings(company.id);
        setCustomSettings(settings);
      } catch (error) {
        console.error('Error loading custom settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    }
    loadCustomSettings();
  }, [company?.id]);

  const refreshSettings = async () => {
    if (!company?.id) return;
    setLoadingSettings(true);
    try {
      const settings = await getCompanySettings(company.id);
      setCustomSettings(settings);
    } catch (error) {
      console.error('Error refreshing settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Validation functions
  const validateLabel = (label: string): string => {
    if (!label.trim()) {
      return 'Label is required';
    }
    if (label.trim().length < 2) {
      return 'Label must be at least 2 characters';
    }
    if (label.trim().length > 50) {
      return 'Label must be less than 50 characters';
    }
    return '';
  };

  const validateCode = (code: string, categoryCode: string | null): string => {
    if (!code.trim()) {
      return 'Code is required';
    }

    // Only allow lowercase letters, numbers, and underscores
    const codeRegex = /^[a-z][a-z0-9_]*$/;
    if (!codeRegex.test(code)) {
      return 'Code must start with a letter and contain only lowercase letters, numbers, and underscores';
    }

    if (code.length < 2) {
      return 'Code must be at least 2 characters';
    }

    if (code.length > 30) {
      return 'Code must be less than 30 characters';
    }

    // Check for uniqueness within the category
    if (categoryCode) {
      const category = customSettings.find(s => s.categoryCode === categoryCode);
      if (category?.options?.some(opt => opt.code === code)) {
        return 'This code already exists in this category';
      }
    }

    return '';
  };

  const handleLabelChange = (value: string) => {
    setNewOptionLabel(value);
    const error = validateLabel(value);
    setLabelError(error);
  };

  const handleCodeChange = (value: string) => {
    // Auto-format: convert to lowercase and replace spaces with underscores
    const formattedValue = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    setNewOptionCode(formattedValue);
    const error = validateCode(formattedValue, selectedCategory);
    setCodeError(error);
  };

  const handleAddOption = async () => {
    // Validate all fields
    const labelErr = validateLabel(newOptionLabel);
    const codeErr = validateCode(newOptionCode, selectedCategory);

    setLabelError(labelErr);
    setCodeError(codeErr);

    if (labelErr || codeErr) {
      return;
    }

    if (!company?.id || !selectedCategory) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSavingOption(true);
    try {
      await addSettingOption(company.id, selectedCategory, {
        code: newOptionCode,
        label: newOptionLabel.trim(),
        color: newOptionColor || undefined,
        isActive: true,
        isDefault: false,
      });
      toast.success('Option added successfully');
      setAddModalOpen(false);
      setNewOptionLabel('');
      setNewOptionCode('');
      setNewOptionColor('');
      setLabelError('');
      setCodeError('');
      await refreshSettings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add option');
    } finally {
      setSavingOption(false);
    }
  };

  const handleUpdateOption = async () => {
    if (!company?.id || !selectedCategory || !selectedOption) return;

    // Validate label
    const labelErr = validateLabel(newOptionLabel);
    setLabelError(labelErr);

    if (labelErr) {
      return;
    }

    setSavingOption(true);
    try {
      await updateSettingOption(company.id, selectedCategory, selectedOption.code, {
        label: newOptionLabel.trim(),
        color: newOptionColor || selectedOption.color,
      });
      toast.success('Option updated successfully');
      setEditModalOpen(false);
      setSelectedOption(null);
      setLabelError('');
      await refreshSettings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update option');
    } finally {
      setSavingOption(false);
    }
  };

  const handleDeleteOption = async () => {
    if (!company?.id || !pendingDeleteOption) return;

    setSavingOption(true);
    try {
      await deleteSettingOption(company.id, pendingDeleteOption.categoryCode, pendingDeleteOption.optionCode);
      toast.success('Option deleted successfully');
      await refreshSettings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete option');
    } finally {
      setSavingOption(false);
      setDeleteConfirmOpen(false);
      setPendingDeleteOption(null);
    }
  };

  const handleResetCategory = async () => {
    if (!company?.id || !pendingResetCategory) return;

    setSavingOption(true);
    try {
      await resetCategoryToDefaults(company.id, pendingResetCategory);
      toast.success('Category reset to defaults');
      await refreshSettings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset category');
    } finally {
      setSavingOption(false);
      setResetConfirmOpen(false);
      setPendingResetCategory(null);
    }
  };

  const openDeleteConfirm = (categoryCode: string, optionCode: string) => {
    setPendingDeleteOption({ categoryCode, optionCode });
    setDeleteConfirmOpen(true);
  };

  const openResetConfirm = (categoryCode: string) => {
    setPendingResetCategory(categoryCode);
    setResetConfirmOpen(true);
  };

  const openAddModal = (categoryCode: string) => {
    setSelectedCategory(categoryCode);
    setNewOptionLabel('');
    setNewOptionCode('');
    setNewOptionColor('');
    setLabelError('');
    setCodeError('');
    setAddModalOpen(true);
  };

  const openEditModal = (categoryCode: string, option: SettingOption) => {
    setSelectedCategory(categoryCode);
    setSelectedOption(option);
    setNewOptionLabel(option.label);
    setNewOptionColor(option.color || '');
    setLabelError('');
    setEditModalOpen(true);
  };

  const handleSaveCompanySettings = async () => {
    if (!company?.id) return;

    setSaving(true);
    try {
      const companyRef = doc(db, 'companies', company.id);
      await updateDoc(companyRef, {
        name: companyName,
        currency,
        fiscalYearStart,
        hasInventory,
        hasEmployees,
        updatedAt: new Date(),
      });
      toast.success('Company settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInvoiceSettings = async () => {
    if (!company?.id) return;

    setSaving(true);
    try {
      const companyRef = doc(db, 'companies', company.id);
      await updateDoc(companyRef, {
        invoicePrefix,
        invoiceNextNumber,
        invoiceDefaultTerms,
        invoiceDefaultTaxRate,
        invoiceNotes,
        invoiceFooter,
        updatedAt: new Date(),
      });
      toast.success('Invoice settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBillSettings = async () => {
    if (!company?.id) return;

    setSaving(true);
    try {
      const companyRef = doc(db, 'companies', company.id);
      await updateDoc(companyRef, {
        billPrefix,
        billNextNumber,
        billDefaultTerms,
        updatedAt: new Date(),
      });
      toast.success('Bill settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!company?.id) return;

    setSaving(true);
    try {
      const companyRef = doc(db, 'companies', company.id);
      await updateDoc(companyRef, {
        enableTax,
        showDecimalPlaces,
        dateFormat,
        updatedAt: new Date(),
      });
      toast.success('Preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccountPreferences = async () => {
    if (!company?.id) return;

    setSavingPreferences(true);
    try {
      await updateAccountPreferences(company.id, accountPreferences);
      toast.success('Account preferences saved');
    } catch (error) {
      console.error('Error saving account preferences:', error);
      toast.error('Failed to save account preferences');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleAccountPrefChange = (key: string, accountId: string) => {
    const account = allAccounts.find(a => a.id === accountId);
    const nameKey = key.replace('Id', 'Name');
    setAccountPreferences(prev => ({
      ...prev,
      [key]: accountId || undefined,
      [nameKey]: account?.name || undefined,
    }));
  };

  const getAccountsByType = (typeCode: string) => {
    return allAccounts.filter(a => a.isActive && a.typeCode === typeCode);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleOpenDeleteDataConfirm = async () => {
    if (!company?.id) return;

    setLoadingCounts(true);
    try {
      const counts = await getCompanyDataCounts(company.id);
      setDataCounts(counts);
    } catch (error) {
      console.error('Error loading data counts:', error);
      // Still open dialog even if counts fail - show generic warning
      setDataCounts(null);
    } finally {
      setLoadingCounts(false);
      setDeleteDataConfirmOpen(true);
    }
  };

  const handleDeleteCompanyData = async () => {
    if (!company?.id) return;

    setDeletingData(true);
    try {
      const result = await deleteCompanyData(company.id);
      if (result.success) {
        toast.success('All company data has been deleted successfully');
        setDeleteDataConfirmOpen(false);
        // Refresh settings after deletion
        await refreshSettings();
        // Force reload the page to refresh all data
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error deleting company data:', error);
      toast.error(error.message || 'Failed to delete company data');
    } finally {
      setDeletingData(false);
    }
  };

  const getWarningItems = (): string[] => {
    const items: string[] = [];

    if (dataCounts) {
      // Show actual counts if available
      if (dataCounts.invoices > 0) items.push(`${dataCounts.invoices} invoice(s)`);
      if (dataCounts.bills > 0) items.push(`${dataCounts.bills} bill(s)`);
      if (dataCounts.customers > 0) items.push(`${dataCounts.customers} customer(s)`);
      if (dataCounts.vendors > 0) items.push(`${dataCounts.vendors} vendor(s)`);
      if (dataCounts.employees > 0) items.push(`${dataCounts.employees} employee(s)`);
      if (dataCounts.transactions > 0) items.push(`${dataCounts.transactions} transaction(s)`);
      if (dataCounts.journalEntries > 0) items.push(`${dataCounts.journalEntries} journal entry(ies)`);
      if (dataCounts.salarySlips > 0) items.push(`${dataCounts.salarySlips} salary slip(s)`);
      if (dataCounts.customAccounts && dataCounts.customAccounts > 0) {
        items.push(`${dataCounts.customAccounts} custom account(s)`);
      }
      if (dataCounts.customSubtypes && dataCounts.customSubtypes > 0) {
        items.push(`${dataCounts.customSubtypes} custom subtype(s)`);
      }
    } else {
      // Show generic warnings if counts couldn't be loaded
      items.push('All invoices');
      items.push('All bills');
      items.push('All customers');
      items.push('All vendors');
      items.push('All employees');
      items.push('All transactions');
      items.push('All journal entries');
      items.push('All salary slips');
    }

    items.push('Chart of Accounts (will be reset to defaults with proper mappings)');
    items.push('All custom settings (will be reset to defaults)');
    items.push('Invoice/Bill numbering counters (will reset to 1)');

    return items;
  };

  if (authLoading || companyLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LoadingSpinner message="Loading settings..." />
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Breadcrumbs */}
        <PageBreadcrumbs
          items={[
            { label: 'Company Settings', icon: <Settings2 size={14} /> },
          ]}
        />

        {/* Header */}
        <Box>
          <Typography level="h2" sx={{ mb: 0.5 }}>
            Company Settings
          </Typography>
          <Typography level="body-md" sx={{ color: 'text.secondary' }}>
            Manage your company settings and preferences.
          </Typography>
        </Box>

        {/* Settings Tabs */}
        <Card>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value as number)}
            sx={{ bgcolor: 'transparent' }}
          >
            <TabList>
              <Tab>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Building2 size={16} />
                  <span>Company</span>
                </Stack>
              </Tab>
              <Tab>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FileText size={16} />
                  <span>Invoices</span>
                </Stack>
              </Tab>
              <Tab>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Receipt size={16} />
                  <span>Bills</span>
                </Stack>
              </Tab>
              <Tab>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Sliders size={16} />
                  <span>Preferences</span>
                </Stack>
              </Tab>
              <Tab>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Settings2 size={16} />
                  <span>Customization</span>
                </Stack>
              </Tab>
              <Tab>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AlertTriangle size={16} style={{ color: 'var(--joy-palette-danger-500)' }} />
                  <span style={{ color: 'var(--joy-palette-danger-500)' }}>Danger Zone</span>
                </Stack>
              </Tab>
            </TabList>

            {/* Company Settings */}
            <TabPanel value={0}>
              <Stack spacing={3} sx={{ pt: 2 }}>
                <Typography level="title-lg">Company Information</Typography>

                <FormControl>
                  <FormLabel>Company Name</FormLabel>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                  />
                </FormControl>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      value={currency}
                      onChange={(_, value) => setCurrency(value || 'USD')}
                    >
                      {CURRENCIES.map((c) => (
                        <Option key={c.code} value={c.code}>
                          {c.symbol} {c.code} - {c.name}
                        </Option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Fiscal Year Starts</FormLabel>
                    <Select
                      value={fiscalYearStart}
                      onChange={(_, value) => setFiscalYearStart(value || 1)}
                    >
                      {FISCAL_YEAR_STARTS.map((f) => (
                        <Option key={f.value} value={f.value}>
                          {f.label}
                        </Option>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <Divider />

                <Typography level="title-lg">Preferences</Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Date Format</FormLabel>
                    <Select
                      value={dateFormat}
                      onChange={(_, value) => setDateFormat(value || 'MM/dd/yyyy')}
                    >
                      <Option value="MM/dd/yyyy">MM/DD/YYYY (01/31/2024)</Option>
                      <Option value="dd/MM/yyyy">DD/MM/YYYY (31/01/2024)</Option>
                      <Option value="yyyy-MM-dd">YYYY-MM-DD (2024-01-31)</Option>
                      <Option value="dd MMM yyyy">DD MMM YYYY (31 Jan 2024)</Option>
                    </Select>
                  </FormControl>

                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Decimal Places</FormLabel>
                    <Select
                      value={showDecimalPlaces}
                      onChange={(_, value) => setShowDecimalPlaces(value ?? 2)}
                    >
                      <Option value={0}>0 (100)</Option>
                      <Option value={2}>2 (100.00)</Option>
                      <Option value={3}>3 (100.000)</Option>
                    </Select>
                  </FormControl>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography level="body-md">Enable Tax Calculation</Typography>
                    <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                      Show tax fields on invoices and bills
                    </Typography>
                  </Box>
                  <Switch
                    checked={enableTax}
                    onChange={(e) => setEnableTax(e.target.checked)}
                  />
                </Stack>

                <Divider />

                <Typography level="title-lg">Features</Typography>

                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography level="body-md">Inventory Management</Typography>
                      <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                        Track stock levels and manage inventory
                      </Typography>
                    </Box>
                    <Switch
                      checked={hasInventory}
                      onChange={(e) => setHasInventory(e.target.checked)}
                    />
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography level="body-md">Employee Management</Typography>
                      <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                        Manage employees and payroll
                      </Typography>
                    </Box>
                    <Switch
                      checked={hasEmployees}
                      onChange={(e) => setHasEmployees(e.target.checked)}
                    />
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                  <Button
                    onClick={handleSaveCompanySettings}
                    loading={saving}
                    startDecorator={<Save size={16} />}
                  >
                    Save Company Settings
                  </Button>
                  <Button
                    variant="outlined"
                    color="neutral"
                    onClick={handleSavePreferences}
                    loading={saving}
                  >
                    Save Preferences
                  </Button>
                </Stack>
              </Stack>
            </TabPanel>

            {/* Invoice Settings */}
            <TabPanel value={1}>
              <Stack spacing={3} sx={{ pt: 2 }}>
                <Typography level="title-lg">Invoice Numbering</Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Invoice Prefix</FormLabel>
                    <Input
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                      placeholder="INV"
                    />
                    <FormHelperText>Example: {invoicePrefix}-{String(invoiceNextNumber).padStart(4, '0')}</FormHelperText>
                  </FormControl>

                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Next Invoice Number</FormLabel>
                    <Input
                      type="number"
                      value={invoiceNextNumber}
                      onChange={(e) => setInvoiceNextNumber(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                </Stack>

                <Divider />

                <Typography level="title-lg">Invoice Defaults</Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Default Payment Terms</FormLabel>
                    <Select
                      value={invoiceDefaultTerms}
                      onChange={(_, value) => setInvoiceDefaultTerms(value ?? 30)}
                    >
                      {PAYMENT_TERMS.map((t) => (
                        <Option key={t.value} value={t.value}>
                          {t.label}
                        </Option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Default Tax Rate (%)</FormLabel>
                    <Input
                      type="number"
                      value={invoiceDefaultTaxRate}
                      onChange={(e) => setInvoiceDefaultTaxRate(parseFloat(e.target.value) || 0)}
                      endDecorator="%"
                    />
                  </FormControl>
                </Stack>

                <FormControl>
                  <FormLabel>Default Invoice Notes</FormLabel>
                  <Textarea
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    placeholder="Thank you for your business!"
                    minRows={2}
                  />
                  <FormHelperText>These notes will appear on every invoice</FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>Invoice Footer</FormLabel>
                  <Textarea
                    value={invoiceFooter}
                    onChange={(e) => setInvoiceFooter(e.target.value)}
                    placeholder="Payment terms and conditions..."
                    minRows={2}
                  />
                  <FormHelperText>Footer text for printed/PDF invoices</FormHelperText>
                </FormControl>

                <Box sx={{ pt: 2 }}>
                  <Button
                    onClick={handleSaveInvoiceSettings}
                    loading={saving}
                    startDecorator={<Save size={16} />}
                  >
                    Save Invoice Settings
                  </Button>
                </Box>
              </Stack>
            </TabPanel>

            {/* Bill Settings */}
            <TabPanel value={2}>
              <Stack spacing={3} sx={{ pt: 2 }}>
                <Typography level="title-lg">Bill Numbering</Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Bill Prefix</FormLabel>
                    <Input
                      value={billPrefix}
                      onChange={(e) => setBillPrefix(e.target.value.toUpperCase())}
                      placeholder="BILL"
                    />
                    <FormHelperText>Example: {billPrefix}-{String(billNextNumber).padStart(4, '0')}</FormHelperText>
                  </FormControl>

                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Next Bill Number</FormLabel>
                    <Input
                      type="number"
                      value={billNextNumber}
                      onChange={(e) => setBillNextNumber(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                </Stack>

                <Divider />

                <Typography level="title-lg">Bill Defaults</Typography>

                <FormControl sx={{ maxWidth: 300 }}>
                  <FormLabel>Default Payment Terms</FormLabel>
                  <Select
                    value={billDefaultTerms}
                    onChange={(_, value) => setBillDefaultTerms(value ?? 30)}
                  >
                    {PAYMENT_TERMS.map((t) => (
                      <Option key={t.value} value={t.value}>
                        {t.label}
                      </Option>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ pt: 2 }}>
                  <Button
                    onClick={handleSaveBillSettings}
                    loading={saving}
                    startDecorator={<Save size={16} />}
                  >
                    Save Bill Settings
                  </Button>
                </Box>
              </Stack>
            </TabPanel>

            {/* Account Preferences */}
            <TabPanel value={3}>
              <Stack spacing={3} sx={{ pt: 2 }}>
                <Box>
                  <Typography level="title-lg">Account Preferences</Typography>
                  <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                    Set default accounts used across forms and AI assistant. These are used when creating transactions, invoices, bills, and salary payments.
                  </Typography>
                </Box>

                {loadingPreferences ? (
                  <Stack spacing={2}>
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} variant="rectangular" height={56} />
                    ))}
                  </Stack>
                ) : (
                  <>
                    {/* Transaction Defaults */}
                    <Card variant="outlined">
                      <CardContent>
                        <Typography level="title-md" sx={{ mb: 2 }}>Transaction Defaults</Typography>
                        <Stack spacing={2}>
                          <FormControl>
                            <FormLabel>Default Cash / Bank Account</FormLabel>
                            <Select
                              value={accountPreferences.defaultCashAccountId || ''}
                              onChange={(_, value) => handleAccountPrefChange('defaultCashAccountId', value || '')}
                              placeholder="Select account..."
                            >
                              <Option value="">Not set (auto-detect)</Option>
                              {getAccountsByType('asset').map(a => (
                                <Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>
                              ))}
                            </Select>
                            <FormHelperText>Used for expenses, payments received, and payments made</FormHelperText>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Default Revenue Account</FormLabel>
                            <Select
                              value={accountPreferences.defaultRevenueAccountId || ''}
                              onChange={(_, value) => handleAccountPrefChange('defaultRevenueAccountId', value || '')}
                              placeholder="Select account..."
                            >
                              <Option value="">Not set (auto-detect)</Option>
                              {getAccountsByType('revenue').map(a => (
                                <Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>
                              ))}
                            </Select>
                            <FormHelperText>Used for income transactions and payments received</FormHelperText>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Default Expense Account</FormLabel>
                            <Select
                              value={accountPreferences.defaultExpenseAccountId || ''}
                              onChange={(_, value) => handleAccountPrefChange('defaultExpenseAccountId', value || '')}
                              placeholder="Select account..."
                            >
                              <Option value="">Not set (auto-detect)</Option>
                              {getAccountsByType('expense').map(a => (
                                <Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>
                              ))}
                            </Select>
                            <FormHelperText>Used for expense transactions and recurring expenses</FormHelperText>
                          </FormControl>
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Invoice & Bill Defaults */}
                    <Card variant="outlined">
                      <CardContent>
                        <Typography level="title-md" sx={{ mb: 2 }}>Invoice & Bill Defaults</Typography>
                        <Stack spacing={2}>
                          <FormControl>
                            <FormLabel>Default Accounts Receivable</FormLabel>
                            <Select
                              value={accountPreferences.defaultReceivableAccountId || ''}
                              onChange={(_, value) => handleAccountPrefChange('defaultReceivableAccountId', value || '')}
                              placeholder="Select account..."
                            >
                              <Option value="">Not set (auto-detect)</Option>
                              {getAccountsByType('asset').map(a => (
                                <Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>
                              ))}
                            </Select>
                            <FormHelperText>Used when sending invoices (Debit AR)</FormHelperText>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Default Accounts Payable</FormLabel>
                            <Select
                              value={accountPreferences.defaultPayableAccountId || ''}
                              onChange={(_, value) => handleAccountPrefChange('defaultPayableAccountId', value || '')}
                              placeholder="Select account..."
                            >
                              <Option value="">Not set (auto-detect)</Option>
                              {getAccountsByType('liability').map(a => (
                                <Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>
                              ))}
                            </Select>
                            <FormHelperText>Used when creating bills (Credit AP)</FormHelperText>
                          </FormControl>
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Payroll Defaults */}
                    <Card variant="outlined">
                      <CardContent>
                        <Typography level="title-md" sx={{ mb: 2 }}>Payroll Defaults</Typography>
                        <Stack spacing={2}>
                          <FormControl>
                            <FormLabel>Default Salary Expense Account</FormLabel>
                            <Select
                              value={accountPreferences.defaultSalaryExpenseAccountId || ''}
                              onChange={(_, value) => handleAccountPrefChange('defaultSalaryExpenseAccountId', value || '')}
                              placeholder="Select account..."
                            >
                              <Option value="">Not set (auto-detect)</Option>
                              {getAccountsByType('expense').map(a => (
                                <Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>
                              ))}
                            </Select>
                            <FormHelperText>Debited when marking salary slips as paid</FormHelperText>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Default Tax Payable Account</FormLabel>
                            <Select
                              value={accountPreferences.defaultTaxPayableAccountId || ''}
                              onChange={(_, value) => handleAccountPrefChange('defaultTaxPayableAccountId', value || '')}
                              placeholder="Select account..."
                            >
                              <Option value="">Not set (auto-detect)</Option>
                              {getAccountsByType('liability').map(a => (
                                <Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>
                              ))}
                            </Select>
                            <FormHelperText>Credited for tax withheld from salary</FormHelperText>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Default Provident Fund Payable Account</FormLabel>
                            <Select
                              value={accountPreferences.defaultPFPayableAccountId || ''}
                              onChange={(_, value) => handleAccountPrefChange('defaultPFPayableAccountId', value || '')}
                              placeholder="Select account..."
                            >
                              <Option value="">Not set (auto-detect)</Option>
                              {getAccountsByType('liability').map(a => (
                                <Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>
                              ))}
                            </Select>
                            <FormHelperText>Credited for provident fund withheld from salary</FormHelperText>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Default Salary Bank Account</FormLabel>
                            <Select
                              value={accountPreferences.defaultSalaryBankAccountId || ''}
                              onChange={(_, value) => handleAccountPrefChange('defaultSalaryBankAccountId', value || '')}
                              placeholder="Select account..."
                            >
                              <Option value="">Not set (auto-detect)</Option>
                              {getAccountsByType('asset').map(a => (
                                <Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>
                              ))}
                            </Select>
                            <FormHelperText>Credited when paying net salary</FormHelperText>
                          </FormControl>
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Bank Account Defaults */}
                    <Card variant="outlined">
                      <CardContent>
                        <Typography level="title-md" sx={{ mb: 2 }}>Bank Account Defaults</Typography>
                        <Stack spacing={2}>
                          <FormControl>
                            <FormLabel>Default Linked Asset Account</FormLabel>
                            <Select
                              value={accountPreferences.defaultLinkedAssetAccountId || ''}
                              onChange={(_, value) => handleAccountPrefChange('defaultLinkedAssetAccountId', value || '')}
                              placeholder="Select account..."
                            >
                              <Option value="">Not set (auto-detect)</Option>
                              {getAccountsByType('asset').map(a => (
                                <Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>
                              ))}
                            </Select>
                            <FormHelperText>Linked GL account when creating new bank accounts</FormHelperText>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Default Equity Account</FormLabel>
                            <Select
                              value={accountPreferences.defaultEquityAccountId || ''}
                              onChange={(_, value) => handleAccountPrefChange('defaultEquityAccountId', value || '')}
                              placeholder="Select account..."
                            >
                              <Option value="">Not set (auto-detect)</Option>
                              {getAccountsByType('equity').map(a => (
                                <Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>
                              ))}
                            </Select>
                            <FormHelperText>Used for opening balance journal entries</FormHelperText>
                          </FormControl>
                        </Stack>
                      </CardContent>
                    </Card>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="solid"
                        color="primary"
                        startDecorator={<Save size={16} />}
                        onClick={handleSaveAccountPreferences}
                        loading={savingPreferences}
                      >
                        Save Preferences
                      </Button>
                    </Box>
                  </>
                )}
              </Stack>
            </TabPanel>

            {/* Customization Settings */}
            <TabPanel value={4}>
              <Stack spacing={3} sx={{ pt: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography level="title-lg">Customize Options</Typography>
                    <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                      Manage statuses, categories, and other dropdown options used throughout the app.
                    </Typography>
                  </Box>
                </Stack>

                {loadingSettings ? (
                  <Stack spacing={2}>
                    {[...Array(5)].map((_, index) => (
                      <Card key={index} variant="outlined">
                        <CardContent sx={{ py: 2 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Skeleton width={150} height={20} sx={{ mb: 0.5 }} />
                              <Skeleton width={80} height={16} />
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <Skeleton width={60} height={28} />
                              <Skeleton width={28} height={28} />
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <AccordionGroup sx={{ maxWidth: '100%' }}>
                    {customSettings.map((setting) => (
                      <Accordion key={setting.id}>
                        <AccordionSummary indicator={<ChevronDown />}>
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography level="title-sm">{setting.categoryName}</Typography>
                              <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                                {setting.options?.length || 0} options
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="soft"
                                color="primary"
                                startDecorator={<Plus size={14} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAddModal(setting.categoryCode);
                                }}
                              >
                                Add
                              </Button>
                              <IconButton
                                size="sm"
                                variant="soft"
                                color="neutral"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openResetConfirm(setting.categoryCode);
                                }}
                              >
                                <RotateCcw size={14} />
                              </IconButton>
                            </Stack>
                          </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Sheet variant="outlined" sx={{ borderRadius: 'sm', overflow: 'hidden' }}>
                            <Table size="sm">
                              <thead>
                                <tr>
                                  <th style={{ width: '30%' }}>Code</th>
                                  <th style={{ width: '30%' }}>Label</th>
                                  <th style={{ width: '15%' }}>Color</th>
                                  <th style={{ width: '10%' }}>Default</th>
                                  <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {setting.options?.map((option) => (
                                  <tr key={option.code}>
                                    <td>
                                      <Typography level="body-xs" fontFamily="monospace">
                                        {option.code}
                                      </Typography>
                                    </td>
                                    <td>{option.label}</td>
                                    <td>
                                      {option.color && (
                                        <Chip
                                          size="sm"
                                          variant="soft"
                                          sx={{
                                            bgcolor: option.color === 'green' ? 'success.softBg' :
                                                     option.color === 'red' ? 'danger.softBg' :
                                                     option.color === 'yellow' ? 'warning.softBg' :
                                                     option.color === 'blue' ? 'primary.softBg' : 'neutral.softBg'
                                          }}
                                        >
                                          {option.color}
                                        </Chip>
                                      )}
                                    </td>
                                    <td>
                                      {option.isDefault && <Chip size="sm" color="success">Yes</Chip>}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        <IconButton
                                          size="sm"
                                          variant="plain"
                                          onClick={() => openEditModal(setting.categoryCode, option)}
                                        >
                                          <Pencil size={14} />
                                        </IconButton>
                                        {!option.isSystem && (
                                          <IconButton
                                            size="sm"
                                            variant="plain"
                                            color="danger"
                                            onClick={() => openDeleteConfirm(setting.categoryCode, option.code)}
                                          >
                                            <Trash2 size={14} />
                                          </IconButton>
                                        )}
                                      </Stack>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </Sheet>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </AccordionGroup>
                )}
              </Stack>
            </TabPanel>

            {/* Danger Zone */}
            <TabPanel value={5}>
              <Stack spacing={3} sx={{ pt: 2 }}>
                <Box
                  sx={{
                    border: '2px solid',
                    borderColor: 'danger.300',
                    borderRadius: 'md',
                    p: 3,
                    bgcolor: 'danger.50',
                  }}
                >
                  <Stack spacing={3}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 'sm',
                          bgcolor: 'danger.100',
                          color: 'danger.600',
                        }}
                      >
                        <AlertTriangle size={24} />
                      </Box>
                      <Box>
                        <Typography level="title-lg" sx={{ color: 'danger.700' }}>
                          Danger Zone
                        </Typography>
                        <Typography level="body-sm" sx={{ color: 'danger.600' }}>
                          Actions in this section are destructive and cannot be undone.
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider />

                    {/* Delete Company Data */}
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={2}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                      <Box>
                        <Typography level="title-md" sx={{ color: 'danger.700' }}>
                          Delete All Company Data
                        </Typography>
                        <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                          This will permanently delete all your invoices, bills, customers, vendors,
                          employees, transactions, and journal entries. The Chart of Accounts will be
                          reset and reinitialized with default accounts properly mapped to types and subtypes.
                        </Typography>
                      </Box>
                      <Button
                        color="danger"
                        variant="solid"
                        startDecorator={<Trash2 size={16} />}
                        onClick={handleOpenDeleteDataConfirm}
                        loading={loadingCounts}
                        sx={{ flexShrink: 0 }}
                      >
                        Delete All Data
                      </Button>
                    </Stack>
                  </Stack>
                </Box>

                <Box
                  sx={{
                    bgcolor: 'warning.50',
                    border: '1px solid',
                    borderColor: 'warning.200',
                    borderRadius: 'sm',
                    p: 2,
                  }}
                >
                  <Typography level="body-sm" sx={{ color: 'warning.700' }}>
                    <strong>Important:</strong> Before deleting data, consider exporting your
                    data first. Once deleted, the data cannot be recovered. This action requires
                    a two-step confirmation to prevent accidental deletion.
                  </Typography>
                </Box>
              </Stack>
            </TabPanel>
          </Tabs>
        </Card>
      </Stack>

      {/* Add Option Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)}>
        <ModalDialog sx={{ width: 400, minWidth: 400 }}>
          <ModalClose />
          <Typography level="title-lg">Add New Option</Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl required error={!!labelError} sx={{ minHeight: 80 }}>
              <FormLabel>Label</FormLabel>
              <Input
                value={newOptionLabel}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g., Custom Status"
                color={labelError ? 'danger' : undefined}
              />
              <FormHelperText sx={{ color: labelError ? 'danger.500' : 'text.tertiary', minHeight: 20 }}>
                {labelError || ' '}
              </FormHelperText>
            </FormControl>
            <FormControl required error={!!codeError} sx={{ minHeight: 80 }}>
              <FormLabel>Code</FormLabel>
              <Input
                value={newOptionCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="e.g., custom_status"
                color={codeError ? 'danger' : undefined}
              />
              <FormHelperText sx={{ color: codeError ? 'danger.500' : 'text.tertiary', minHeight: 20 }}>
                {codeError || 'Lowercase letters, numbers, underscores only'}
              </FormHelperText>
            </FormControl>
            <FormControl sx={{ minHeight: 70 }}>
              <FormLabel>Color (Optional)</FormLabel>
              <Select
                value={newOptionColor}
                onChange={(_, value) => setNewOptionColor(value || '')}
                placeholder="Select a color"
              >
                <Option value="">None</Option>
                <Option value="green">Green</Option>
                <Option value="blue">Blue</Option>
                <Option value="yellow">Yellow</Option>
                <Option value="red">Red</Option>
                <Option value="gray">Gray</Option>
                <Option value="orange">Orange</Option>
                <Option value="purple">Purple</Option>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button variant="plain" color="neutral" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddOption}
                loading={savingOption}
                disabled={!!labelError || !!codeError || !newOptionLabel || !newOptionCode}
              >
                Add Option
              </Button>
            </Stack>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Edit Option Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <ModalDialog sx={{ width: 400, minWidth: 400 }}>
          <ModalClose />
          <Typography level="title-lg">Edit Option</Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl sx={{ minHeight: 80 }}>
              <FormLabel>Code</FormLabel>
              <Input
                value={selectedOption?.code || ''}
                disabled
                sx={{ bgcolor: 'neutral.100' }}
              />
              <FormHelperText sx={{ minHeight: 20 }}>Code cannot be changed</FormHelperText>
            </FormControl>
            <FormControl required error={!!labelError} sx={{ minHeight: 80 }}>
              <FormLabel>Label</FormLabel>
              <Input
                value={newOptionLabel}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="Option label"
                color={labelError ? 'danger' : undefined}
              />
              <FormHelperText sx={{ color: labelError ? 'danger.500' : 'text.tertiary', minHeight: 20 }}>
                {labelError || ' '}
              </FormHelperText>
            </FormControl>
            <FormControl sx={{ minHeight: 70 }}>
              <FormLabel>Color (Optional)</FormLabel>
              <Select
                value={newOptionColor}
                onChange={(_, value) => setNewOptionColor(value || '')}
                placeholder="Select a color"
              >
                <Option value="">None</Option>
                <Option value="green">Green</Option>
                <Option value="blue">Blue</Option>
                <Option value="yellow">Yellow</Option>
                <Option value="red">Red</Option>
                <Option value="gray">Gray</Option>
                <Option value="orange">Orange</Option>
                <Option value="purple">Purple</Option>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button variant="plain" color="neutral" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateOption}
                loading={savingOption}
                disabled={!!labelError || !newOptionLabel}
              >
                Save Changes
              </Button>
            </Stack>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Delete Option Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setPendingDeleteOption(null);
        }}
        onConfirm={handleDeleteOption}
        title="Delete Option"
        description="Are you sure you want to delete this option? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={savingOption}
      />

      {/* Reset Category Confirmation Dialog */}
      <ConfirmDialog
        open={resetConfirmOpen}
        onClose={() => {
          setResetConfirmOpen(false);
          setPendingResetCategory(null);
        }}
        onConfirm={handleResetCategory}
        title="Reset to Defaults"
        description="Are you sure you want to reset this category to defaults? All custom options will be removed and replaced with the default options."
        confirmText="Reset"
        cancelText="Cancel"
        variant="warning"
        loading={savingOption}
      />

      {/* Delete Company Data Confirmation Dialog */}
      <DangerousConfirmDialog
        open={deleteDataConfirmOpen}
        onClose={() => setDeleteDataConfirmOpen(false)}
        onConfirm={handleDeleteCompanyData}
        title="Delete All Company Data"
        description="This action will permanently delete all your business data. This cannot be undone."
        confirmPhrase="DELETE ALL DATA"
        confirmText="Delete Everything"
        cancelText="Cancel"
        loading={deletingData}
        warningItems={getWarningItems()}
      />
    </Container>
  );
}
