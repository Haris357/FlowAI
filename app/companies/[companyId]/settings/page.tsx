'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Input,
  Select,
  Option,
  Button,
  Divider,
  Switch,
  FormControl,
  FormLabel,
  FormHelperText,
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
  Autocomplete,
  Grid,
  Tooltip,
} from '@mui/joy';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { countries } from '@/lib/countries';
import { LoadingSpinner, ConfirmDialog, DangerousConfirmDialog, PageBreadcrumbs } from '@/components/common';
import {
  Building2,
  Save,
  Settings2,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  ChevronDown,
  FileText,
  AlertTriangle,
  Globe,
  Layers,
  Calendar,
  Hash,
  ChevronLeft,
  ChevronRight,
  Palette,
} from 'lucide-react';
import toast from 'react-hot-toast';
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

// ─── Derived constants ───
const BUSINESS_TYPES = ALL_SETTINGS.find(s => s.code === 'business_type')?.options.map(o => o.label) || [
  'Freelancer', 'Consulting', 'Retail', 'Manufacturing', 'Services',
  'Technology', 'Construction', 'Healthcare', 'Education', 'Hospitality',
  'Real Estate', 'Restaurant', 'E-Commerce', 'Agency', 'Other',
];

const CURRENCY_OPTIONS = Array.from(
  new Map(
    countries.map(c => [c.currency, { code: c.currency, name: c.currencyName, symbol: c.currencySymbol }])
  ).values()
).sort((a, b) => a.code.localeCompare(b.code));

const FISCAL_YEAR_STARTS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

const PAYMENT_TERMS = [
  { value: 0, label: 'Due on Receipt' }, { value: 7, label: 'Net 7' }, { value: 15, label: 'Net 15' },
  { value: 30, label: 'Net 30' }, { value: 45, label: 'Net 45' }, { value: 60, label: 'Net 60' },
  { value: 90, label: 'Net 90' },
];

// ─── Sidebar nav config (same pattern as ReportsSidebar) ───
type SettingsSection = 'general' | 'documents' | 'accounts' | 'customization' | 'danger';

interface SettingsNavItem {
  id: SettingsSection;
  name: string;
  icon: React.ElementType;
}

interface SettingsNavCategory {
  name: string;
  items: SettingsNavItem[];
}

const settingsCategories: SettingsNavCategory[] = [
  {
    name: 'Company',
    items: [
      { id: 'general', name: 'General', icon: Building2 },
      { id: 'documents', name: 'Documents', icon: FileText },
      { id: 'accounts', name: 'Account Defaults', icon: Layers },
    ],
  },
  {
    name: 'Advanced',
    items: [
      { id: 'customization', name: 'Customization', icon: Settings2 },
      { id: 'danger', name: 'Danger Zone', icon: AlertTriangle },
    ],
  },
];

// ─── Section header card ───
function SectionCard({ icon, title, description, children }: {
  icon: React.ReactNode; title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 'lg' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 'md', display: 'flex', alignItems: 'center',
            justifyContent: 'center', bgcolor: 'primary.softBg', color: 'primary.500', flexShrink: 0,
          }}>
            {icon}
          </Box>
          <Box>
            <Typography level="title-md" fontWeight={600}>{title}</Typography>
            {description && (
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{description}</Typography>
            )}
          </Box>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { company, loading: companyLoading } = useCompany();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ─── General settings state ───
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [country, setCountry] = useState('US');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [fiscalYearStart, setFiscalYearStart] = useState(1);
  const [hasInventory, setHasInventory] = useState(false);
  const [hasEmployees, setHasEmployees] = useState(false);
  const [enableTax, setEnableTax] = useState(true);
  const [showDecimalPlaces, setShowDecimalPlaces] = useState(2);
  const [dateFormat, setDateFormat] = useState('MM/dd/yyyy');

  // ─── Document settings state ───
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [invoiceNextNumber, setInvoiceNextNumber] = useState(1);
  const [invoiceDefaultTerms, setInvoiceDefaultTerms] = useState(30);
  const [invoiceDefaultTaxRate, setInvoiceDefaultTaxRate] = useState(0);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceFooter, setInvoiceFooter] = useState('');
  const [billPrefix, setBillPrefix] = useState('BILL');
  const [billNextNumber, setBillNextNumber] = useState(1);
  const [billDefaultTerms, setBillDefaultTerms] = useState(30);

  // ─── Invoice appearance state ───
  const [invoiceTemplate, setInvoiceTemplate] = useState<'classic' | 'modern' | 'minimal'>('classic');
  const [invoiceColorTheme, setInvoiceColorTheme] = useState('#D97757');
  const [invoiceShowCompanyName, setInvoiceShowCompanyName] = useState(true);
  const [invoiceShowCompanyAddress, setInvoiceShowCompanyAddress] = useState(true);
  const [invoiceShowCompanyEmail, setInvoiceShowCompanyEmail] = useState(true);
  const [invoiceShowCompanyPhone, setInvoiceShowCompanyPhone] = useState(true);
  const [invoiceShowTaxId, setInvoiceShowTaxId] = useState(true);
  const [invoiceShowFooter, setInvoiceShowFooter] = useState(true);
  const [invoiceShowPoweredBy, setInvoiceShowPoweredBy] = useState(true);

  // ─── Custom options state ───
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

  // ─── Confirm dialog state ───
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [pendingDeleteOption, setPendingDeleteOption] = useState<{ categoryCode: string; optionCode: string } | null>(null);
  const [pendingResetCategory, setPendingResetCategory] = useState<string | null>(null);

  // ─── Validation state ───
  const [labelError, setLabelError] = useState('');
  const [codeError, setCodeError] = useState('');

  // ─── Account preferences state ───
  const [accountPreferences, setAccountPreferences] = useState<AccountPreferences>({});
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // ─── Delete company data state ───
  const [deleteDataConfirmOpen, setDeleteDataConfirmOpen] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [dataCounts, setDataCounts] = useState<Record<string, number> | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);

  // ─── Auth redirect ───
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // ─── Load company data into state ───
  useEffect(() => {
    if (company) {
      setCompanyName(company.name || '');
      setBusinessType(company.businessType || '');
      setCountry(company.country || 'US');
      setCurrency(company.currency || 'USD');
      setDescription(company.description || '');
      setFiscalYearStart(company.fiscalYearStart || 1);
      setHasInventory(company.hasInventory || false);
      setHasEmployees(company.hasEmployees || false);
      setEnableTax(company.enableTax ?? true);
      setShowDecimalPlaces(company.showDecimalPlaces ?? 2);
      setDateFormat(company.dateFormat || 'MM/dd/yyyy');
      setInvoicePrefix(company.invoicePrefix || 'INV');
      setInvoiceNextNumber(company.invoiceNextNumber || 1);
      setInvoiceDefaultTerms(company.invoiceDefaultTerms ?? 30);
      setInvoiceDefaultTaxRate(company.invoiceDefaultTaxRate ?? 0);
      setInvoiceNotes(company.invoiceNotes || '');
      setInvoiceFooter(company.invoiceFooter || '');
      setBillPrefix(company.billPrefix || 'BILL');
      setBillNextNumber(company.billNextNumber || 1);
      setBillDefaultTerms(company.billDefaultTerms ?? 30);
      setInvoiceTemplate(company.invoiceTemplate || 'classic');
      setInvoiceColorTheme(company.invoiceColorTheme || '#D97757');
      setInvoiceShowCompanyName(company.invoiceShowCompanyName ?? true);
      setInvoiceShowCompanyAddress(company.invoiceShowCompanyAddress ?? true);
      setInvoiceShowCompanyEmail(company.invoiceShowCompanyEmail ?? true);
      setInvoiceShowCompanyPhone(company.invoiceShowCompanyPhone ?? true);
      setInvoiceShowTaxId(company.invoiceShowTaxId ?? true);
      setInvoiceShowFooter(company.invoiceShowFooter ?? true);
      setInvoiceShowPoweredBy(company.invoiceShowPoweredBy ?? true);
    }
  }, [company]);

  // ─── Load account preferences ───
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

  // ─── Load custom settings ───
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

  // ─── Validation ───
  const validateLabel = (label: string): string => {
    if (!label.trim()) return 'Label is required';
    if (label.trim().length < 2) return 'Label must be at least 2 characters';
    if (label.trim().length > 50) return 'Label must be less than 50 characters';
    return '';
  };

  const validateCode = (code: string, categoryCode: string | null): string => {
    if (!code.trim()) return 'Code is required';
    const codeRegex = /^[a-z][a-z0-9_]*$/;
    if (!codeRegex.test(code)) return 'Code must start with a letter and contain only lowercase letters, numbers, and underscores';
    if (code.length < 2) return 'Code must be at least 2 characters';
    if (code.length > 30) return 'Code must be less than 30 characters';
    if (categoryCode) {
      const category = customSettings.find(s => s.categoryCode === categoryCode);
      if (category?.options?.some(opt => opt.code === code)) return 'This code already exists in this category';
    }
    return '';
  };

  const handleLabelChange = (value: string) => {
    setNewOptionLabel(value);
    setLabelError(validateLabel(value));
  };

  const handleCodeChange = (value: string) => {
    const formattedValue = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    setNewOptionCode(formattedValue);
    setCodeError(validateCode(formattedValue, selectedCategory));
  };

  // ─── Custom option CRUD ───
  const handleAddOption = async () => {
    const labelErr = validateLabel(newOptionLabel);
    const codeErr = validateCode(newOptionCode, selectedCategory);
    setLabelError(labelErr);
    setCodeError(codeErr);
    if (labelErr || codeErr || !company?.id || !selectedCategory) return;

    setSavingOption(true);
    try {
      await addSettingOption(company.id, selectedCategory, {
        code: newOptionCode, label: newOptionLabel.trim(),
        color: newOptionColor || undefined, isActive: true, isDefault: false,
      });
      toast.success('Option added successfully');
      setAddModalOpen(false);
      setNewOptionLabel(''); setNewOptionCode(''); setNewOptionColor('');
      setLabelError(''); setCodeError('');
      await refreshSettings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add option');
    } finally {
      setSavingOption(false);
    }
  };

  const handleUpdateOption = async () => {
    if (!company?.id || !selectedCategory || !selectedOption) return;
    const labelErr = validateLabel(newOptionLabel);
    setLabelError(labelErr);
    if (labelErr) return;

    setSavingOption(true);
    try {
      await updateSettingOption(company.id, selectedCategory, selectedOption.code, {
        label: newOptionLabel.trim(), color: newOptionColor || selectedOption.color,
      });
      toast.success('Option updated successfully');
      setEditModalOpen(false); setSelectedOption(null); setLabelError('');
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

  const openAddModal = (categoryCode: string) => {
    setSelectedCategory(categoryCode);
    setNewOptionLabel(''); setNewOptionCode(''); setNewOptionColor('');
    setLabelError(''); setCodeError('');
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

  // ─── Save handlers ───
  const handleSaveGeneral = async () => {
    if (!company?.id) return;
    if (!companyName.trim()) { toast.error('Company name is required'); return; }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'companies', company.id), {
        name: companyName.trim(),
        businessType,
        country,
        currency,
        description: description.trim(),
        fiscalYearStart,
        enableTax,
        showDecimalPlaces,
        dateFormat,
        hasInventory,
        hasEmployees,
        updatedAt: new Date(),
      });
      toast.success('General settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDocuments = async () => {
    if (!company?.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'companies', company.id), {
        invoicePrefix, invoiceNextNumber, invoiceDefaultTerms,
        invoiceDefaultTaxRate, invoiceNotes, invoiceFooter,
        invoiceTemplate, invoiceColorTheme,
        invoiceShowCompanyName, invoiceShowCompanyAddress,
        invoiceShowCompanyEmail, invoiceShowCompanyPhone,
        invoiceShowTaxId, invoiceShowFooter, invoiceShowPoweredBy,
        billPrefix, billNextNumber, billDefaultTerms,
        updatedAt: new Date(),
      });
      toast.success('Document settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
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

  const getAccountsByType = (typeCode: string) => allAccounts.filter(a => a.isActive && a.typeCode === typeCode);

  // ─── Delete company data ───
  const handleOpenDeleteDataConfirm = async () => {
    if (!company?.id) return;
    setLoadingCounts(true);
    try {
      const counts = await getCompanyDataCounts(company.id);
      setDataCounts(counts);
    } catch (error) {
      console.error('Error loading data counts:', error);
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
        await refreshSettings();
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
      if (dataCounts.invoices > 0) items.push(`${dataCounts.invoices} invoice(s)`);
      if (dataCounts.bills > 0) items.push(`${dataCounts.bills} bill(s)`);
      if (dataCounts.customers > 0) items.push(`${dataCounts.customers} customer(s)`);
      if (dataCounts.vendors > 0) items.push(`${dataCounts.vendors} vendor(s)`);
      if (dataCounts.employees > 0) items.push(`${dataCounts.employees} employee(s)`);
      if (dataCounts.transactions > 0) items.push(`${dataCounts.transactions} transaction(s)`);
      if (dataCounts.journalEntries > 0) items.push(`${dataCounts.journalEntries} journal entry(ies)`);
      if (dataCounts.salarySlips > 0) items.push(`${dataCounts.salarySlips} salary slip(s)`);
      if (dataCounts.customAccounts && dataCounts.customAccounts > 0) items.push(`${dataCounts.customAccounts} custom account(s)`);
      if (dataCounts.customSubtypes && dataCounts.customSubtypes > 0) items.push(`${dataCounts.customSubtypes} custom subtype(s)`);
    } else {
      items.push('All invoices', 'All bills', 'All customers', 'All vendors',
        'All employees', 'All transactions', 'All journal entries', 'All salary slips');
    }
    items.push('Chart of Accounts (will be reset to defaults with proper mappings)');
    items.push('All custom settings (will be reset to defaults)');
    items.push('Invoice/Bill numbering counters (will reset to 1)');
    return items;
  };

  // ─── Loading / auth guards ───
  if (authLoading || companyLoading) {
    return (
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
        <LoadingSpinner message="Loading settings..." />
      </Box>
    );
  }
  if (!user) return null;

  const selectedCountry = countries.find(c => c.code === country);

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ─── Sidebar (matches ReportsSidebar pattern) ─── */}
      <Box
        sx={{
          width: sidebarCollapsed ? 60 : 280,
          minWidth: sidebarCollapsed ? 60 : 280,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.surface',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.2s ease, min-width 0.2s ease',
          overflow: 'hidden',
          position: 'sticky',
          top: 0,
        }}
      >
            {/* Header */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent={sidebarCollapsed ? 'center' : 'space-between'}
              sx={{ px: sidebarCollapsed ? 1 : 2, py: 2, minHeight: 64 }}
            >
              {!sidebarCollapsed && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: 'sm',
                    bgcolor: 'primary.softBg', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Settings2 size={18} style={{ color: 'var(--joy-palette-primary-600)' }} />
                  </Box>
                  <Typography level="title-md" fontWeight="lg">Settings</Typography>
                </Stack>
              )}
              <Tooltip title={sidebarCollapsed ? 'Expand' : 'Collapse'} placement="right">
                <IconButton size="sm" variant="plain" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} sx={{ borderRadius: 'sm' }}>
                  {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Nav items */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: sidebarCollapsed ? 1 : 1.5, pb: 2 }}>
              <Stack spacing={2.5}>
                {settingsCategories.map((category) => (
                  <Box key={category.name}>
                    {!sidebarCollapsed && (
                      <Typography
                        level="body-xs"
                        sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: 1, mb: 1, px: 1 }}
                      >
                        {category.name}
                      </Typography>
                    )}
                    <Stack spacing={0.5}>
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        const isDanger = item.id === 'danger';

                        return (
                          <Tooltip key={item.id} title={sidebarCollapsed ? item.name : ''} placement="right">
                            <Box
                              onClick={() => setActiveSection(item.id)}
                              sx={{
                                p: sidebarCollapsed ? 1 : 1.5,
                                borderRadius: 'md',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                bgcolor: isActive
                                  ? (isDanger ? 'danger.softBg' : 'primary.softBg')
                                  : 'transparent',
                                color: isActive
                                  ? (isDanger ? 'danger.600' : 'primary.600')
                                  : (isDanger ? 'danger.500' : 'text.primary'),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                gap: 1.5,
                                '&:hover': {
                                  bgcolor: isActive
                                    ? (isDanger ? 'danger.softHoverBg' : 'primary.softHoverBg')
                                    : 'neutral.softBg',
                                },
                              }}
                            >
                              <Icon size={sidebarCollapsed ? 20 : 18} />
                              {!sidebarCollapsed && (
                                <>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                      level="body-sm"
                                      fontWeight={isActive ? 600 : 400}
                                      sx={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        color: isDanger && !isActive ? 'danger.500' : undefined,
                                      }}
                                    >
                                      {item.name}
                                    </Typography>
                                  </Box>
                                  {isActive && <ChevronRight size={16} />}
                                </>
                              )}
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* Footer count */}
            {!sidebarCollapsed && (
              <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Total Sections</Typography>
                  <Chip size="sm" variant="soft" color="primary">
                    {settingsCategories.reduce((sum, cat) => sum + cat.items.length, 0)}
                  </Chip>
                </Stack>
              </Box>
            )}
          </Box>

      {/* ─── Content area ─── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header bar */}
        <Box sx={{ px: 4, pt: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <PageBreadcrumbs items={[{ label: 'Company Settings', icon: <Settings2 size={14} /> }]} />
        </Box>

        {/* Scrollable content */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 4, py: 3 }}>

            {/* ═══════════════════════════════════════ */}
            {/* GENERAL                                */}
            {/* ═══════════════════════════════════════ */}
            {activeSection === 'general' && (
              <Stack spacing={3}>
                {/* Company Profile */}
                <SectionCard icon={<Building2 size={18} />} title="Company Profile" description="Basic information about your company">
                  <Stack spacing={2}>
                    <FormControl>
                      <FormLabel>Company Name</FormLabel>
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc." size="sm" />
                    </FormControl>

                    <Grid container spacing={2}>
                      <Grid xs={12} md={6}>
                        <FormControl>
                          <FormLabel>Business Type</FormLabel>
                          <Autocomplete
                            value={businessType}
                            onChange={(_, v) => setBusinessType(v || '')}
                            options={BUSINESS_TYPES}
                            placeholder="Select type"
                            size="sm"
                            freeSolo
                          />
                        </FormControl>
                      </Grid>
                      <Grid xs={12} md={6}>
                        <FormControl>
                          <FormLabel>Country</FormLabel>
                          <Autocomplete
                            value={selectedCountry || null}
                            onChange={(_, v) => {
                              if (v) { setCountry(v.code); setCurrency(v.currency); }
                            }}
                            options={countries}
                            getOptionLabel={(o) => `${o.flag} ${o.name}`}
                            placeholder="Select country"
                            size="sm"
                            isOptionEqualToValue={(option, value) => option.code === value.code}
                          />
                        </FormControl>
                      </Grid>
                    </Grid>

                    <FormControl>
                      <FormLabel>Currency</FormLabel>
                      <Select value={currency} onChange={(_, v) => setCurrency(v || 'USD')} size="sm">
                        {CURRENCY_OPTIONS.map(c => (
                          <Option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</Option>
                        ))}
                      </Select>
                      <FormHelperText>Auto-set when you change country. Override if needed.</FormHelperText>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Business Description</FormLabel>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Briefly describe what your company does..."
                        minRows={2} maxRows={4} size="sm"
                      />
                      <FormHelperText>Used by AI to better understand your business context.</FormHelperText>
                    </FormControl>
                  </Stack>
                </SectionCard>

                {/* Financial Settings */}
                <SectionCard icon={<Calendar size={18} />} title="Financial Settings" description="Configure fiscal year, dates, and number formatting">
                  <Stack spacing={2}>
                    <Grid container spacing={2}>
                      <Grid xs={12} md={6}>
                        <FormControl>
                          <FormLabel>Fiscal Year Starts</FormLabel>
                          <Select value={fiscalYearStart} onChange={(_, v) => setFiscalYearStart(v || 1)} size="sm">
                            {FISCAL_YEAR_STARTS.map(f => (
                              <Option key={f.value} value={f.value}>{f.label}</Option>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid xs={12} md={6}>
                        <FormControl>
                          <FormLabel>Date Format</FormLabel>
                          <Select value={dateFormat} onChange={(_, v) => setDateFormat(v || 'MM/dd/yyyy')} size="sm">
                            <Option value="MM/dd/yyyy">MM/DD/YYYY (01/31/2024)</Option>
                            <Option value="dd/MM/yyyy">DD/MM/YYYY (31/01/2024)</Option>
                            <Option value="yyyy-MM-dd">YYYY-MM-DD (2024-01-31)</Option>
                            <Option value="dd MMM yyyy">DD MMM YYYY (31 Jan 2024)</Option>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      <Grid xs={12} md={6}>
                        <FormControl>
                          <FormLabel>Decimal Places</FormLabel>
                          <Select value={showDecimalPlaces} onChange={(_, v) => setShowDecimalPlaces(v ?? 2)} size="sm">
                            <Option value={0}>0 (100)</Option>
                            <Option value={2}>2 (100.00)</Option>
                            <Option value={3}>3 (100.000)</Option>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Divider />

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography level="body-sm" fontWeight={600}>Enable Tax Calculation</Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Show tax fields on invoices and bills</Typography>
                      </Box>
                      <Switch checked={enableTax} onChange={(e) => setEnableTax(e.target.checked)} />
                    </Stack>
                  </Stack>
                </SectionCard>

                {/* Features */}
                <SectionCard icon={<Layers size={18} />} title="Features" description="Enable or disable optional modules">
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography level="body-sm" fontWeight={600}>Inventory Management</Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Track stock levels and manage inventory</Typography>
                      </Box>
                      <Switch checked={hasInventory} onChange={(e) => setHasInventory(e.target.checked)} />
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography level="body-sm" fontWeight={600}>Employee Management</Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Manage employees and payroll</Typography>
                      </Box>
                      <Switch checked={hasEmployees} onChange={(e) => setHasEmployees(e.target.checked)} />
                    </Stack>
                  </Stack>
                </SectionCard>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button onClick={handleSaveGeneral} loading={saving} startDecorator={<Save size={16} />}>
                    Save General Settings
                  </Button>
                </Box>
              </Stack>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* DOCUMENTS                              */}
            {/* ═══════════════════════════════════════ */}
            {activeSection === 'documents' && (
              <Stack spacing={3}>
                <SectionCard icon={<FileText size={18} />} title="Invoice Settings" description="Configure invoice numbering and defaults">
                  <Stack spacing={2}>
                    <Grid container spacing={2}>
                      <Grid xs={12} md={6}>
                        <FormControl>
                          <FormLabel>Invoice Prefix</FormLabel>
                          <Input value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())} placeholder="INV" size="sm" />
                          <FormHelperText>Preview: {invoicePrefix}-{String(invoiceNextNumber).padStart(4, '0')}</FormHelperText>
                        </FormControl>
                      </Grid>
                      <Grid xs={12} md={6}>
                        <FormControl>
                          <FormLabel>Next Invoice Number</FormLabel>
                          <Input type="number" value={invoiceNextNumber} onChange={(e) => setInvoiceNextNumber(parseInt(e.target.value) || 1)} size="sm" />
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      <Grid xs={12} md={6}>
                        <FormControl>
                          <FormLabel>Default Payment Terms</FormLabel>
                          <Select value={invoiceDefaultTerms} onChange={(_, v) => setInvoiceDefaultTerms(v ?? 30)} size="sm">
                            {PAYMENT_TERMS.map(t => (<Option key={t.value} value={t.value}>{t.label}</Option>))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid xs={12} md={6}>
                        <FormControl>
                          <FormLabel>Default Tax Rate</FormLabel>
                          <Input type="number" value={invoiceDefaultTaxRate} onChange={(e) => setInvoiceDefaultTaxRate(parseFloat(e.target.value) || 0)} endDecorator="%" size="sm" />
                        </FormControl>
                      </Grid>
                    </Grid>

                    <FormControl>
                      <FormLabel>Default Invoice Notes</FormLabel>
                      <Textarea value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)} placeholder="Thank you for your business!" minRows={2} size="sm" />
                      <FormHelperText>These notes will appear on every invoice</FormHelperText>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Invoice Footer</FormLabel>
                      <Textarea value={invoiceFooter} onChange={(e) => setInvoiceFooter(e.target.value)} placeholder="Payment terms and conditions..." minRows={2} size="sm" />
                      <FormHelperText>Footer text for printed/PDF invoices</FormHelperText>
                    </FormControl>
                  </Stack>
                </SectionCard>

                <SectionCard icon={<Hash size={18} />} title="Bill Settings" description="Configure bill numbering and defaults">
                  <Stack spacing={2}>
                    <Grid container spacing={2}>
                      <Grid xs={12} md={6}>
                        <FormControl>
                          <FormLabel>Bill Prefix</FormLabel>
                          <Input value={billPrefix} onChange={(e) => setBillPrefix(e.target.value.toUpperCase())} placeholder="BILL" size="sm" />
                          <FormHelperText>Preview: {billPrefix}-{String(billNextNumber).padStart(4, '0')}</FormHelperText>
                        </FormControl>
                      </Grid>
                      <Grid xs={12} md={6}>
                        <FormControl>
                          <FormLabel>Next Bill Number</FormLabel>
                          <Input type="number" value={billNextNumber} onChange={(e) => setBillNextNumber(parseInt(e.target.value) || 1)} size="sm" />
                        </FormControl>
                      </Grid>
                    </Grid>
                    <FormControl sx={{ maxWidth: { sm: '50%' } }}>
                      <FormLabel>Default Payment Terms</FormLabel>
                      <Select value={billDefaultTerms} onChange={(_, v) => setBillDefaultTerms(v ?? 30)} size="sm">
                        {PAYMENT_TERMS.map(t => (<Option key={t.value} value={t.value}>{t.label}</Option>))}
                      </Select>
                    </FormControl>
                  </Stack>
                </SectionCard>

                {/* Invoice Appearance */}
                <SectionCard icon={<Palette size={18} />} title="Invoice Appearance" description="Customize how your invoices look when printed or exported as PDF">
                  <Stack spacing={2.5}>
                    <Grid container spacing={2}>
                      <Grid xs={12} md={6}>
                        <FormControl>
                          <FormLabel>Template</FormLabel>
                          <Select value={invoiceTemplate} onChange={(_, v) => setInvoiceTemplate(v as any || 'classic')} size="sm">
                            <Option value="classic">Classic — Accent bars, grid table</Option>
                            <Option value="modern">Modern — Color stripe, card-style totals</Option>
                            <Option value="minimal">Minimal — Black & white, clean lines</Option>
                          </Select>
                          <FormHelperText>Choose the overall look of your invoice PDF</FormHelperText>
                        </FormControl>
                      </Grid>
                      <Grid xs={12} md={6}>
                        <FormControl>
                          <FormLabel>Color Theme</FormLabel>
                          <Select
                            value={invoiceColorTheme}
                            onChange={(_, v) => setInvoiceColorTheme(v || '#D97757')}
                            size="sm"
                            renderValue={(option) => {
                              if (!option) return null;
                              return (
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: option.value, border: '1px solid', borderColor: 'divider' }} />
                                  <Typography level="body-sm">{option.label}</Typography>
                                </Stack>
                              );
                            }}
                          >
                            {[
                              { color: '#D97757', label: 'Terracotta' },
                              { color: '#4A90D9', label: 'Ocean Blue' },
                              { color: '#4AA86E', label: 'Forest Green' },
                              { color: '#7B68D9', label: 'Royal Purple' },
                              { color: '#5C6B7A', label: 'Slate Gray' },
                              { color: '#2D2D2D', label: 'Midnight Black' },
                            ].map(c => (
                              <Option key={c.color} value={c.color}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: c.color, flexShrink: 0 }} />
                                  <span>{c.label}</span>
                                </Stack>
                              </Option>
                            ))}
                          </Select>
                          <FormHelperText>Primary color used in the invoice template</FormHelperText>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Divider />
                    <Typography level="body-sm" fontWeight={600}>Visibility Options</Typography>

                    <Grid container spacing={2}>
                      <Grid xs={12} md={6}>
                        <Stack spacing={1.5}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography level="body-sm">Show Company Name</Typography>
                            <Switch size="sm" checked={invoiceShowCompanyName} onChange={(e) => setInvoiceShowCompanyName(e.target.checked)} />
                          </Stack>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography level="body-sm">Show Company Address</Typography>
                            <Switch size="sm" checked={invoiceShowCompanyAddress} onChange={(e) => setInvoiceShowCompanyAddress(e.target.checked)} />
                          </Stack>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography level="body-sm">Show Company Email</Typography>
                            <Switch size="sm" checked={invoiceShowCompanyEmail} onChange={(e) => setInvoiceShowCompanyEmail(e.target.checked)} />
                          </Stack>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography level="body-sm">Show Company Phone</Typography>
                            <Switch size="sm" checked={invoiceShowCompanyPhone} onChange={(e) => setInvoiceShowCompanyPhone(e.target.checked)} />
                          </Stack>
                        </Stack>
                      </Grid>
                      <Grid xs={12} md={6}>
                        <Stack spacing={1.5}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography level="body-sm">Show Tax ID</Typography>
                            <Switch size="sm" checked={invoiceShowTaxId} onChange={(e) => setInvoiceShowTaxId(e.target.checked)} />
                          </Stack>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography level="body-sm">Show Invoice Footer</Typography>
                            <Switch size="sm" checked={invoiceShowFooter} onChange={(e) => setInvoiceShowFooter(e.target.checked)} />
                          </Stack>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography level="body-sm">Show &quot;Powered by Flowbooks&quot;</Typography>
                            <Switch size="sm" checked={invoiceShowPoweredBy} onChange={(e) => setInvoiceShowPoweredBy(e.target.checked)} />
                          </Stack>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Stack>
                </SectionCard>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button onClick={handleSaveDocuments} loading={saving} startDecorator={<Save size={16} />}>
                    Save Document Settings
                  </Button>
                </Box>
              </Stack>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* ACCOUNT DEFAULTS                       */}
            {/* ═══════════════════════════════════════ */}
            {activeSection === 'accounts' && (
              <Stack spacing={3}>
                <Box>
                  <Typography level="title-lg" fontWeight={600}>Account Defaults</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                    Set default accounts used across forms and the AI assistant.
                  </Typography>
                </Box>

                {loadingPreferences ? (
                  <Stack spacing={2}>
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} variant="rectangular" height={56} sx={{ borderRadius: 'md' }} />
                    ))}
                  </Stack>
                ) : (
                  <>
                    <SectionCard icon={<Layers size={18} />} title="Transaction Defaults">
                      <Stack spacing={2}>
                        <FormControl size="sm">
                          <FormLabel>Default Cash / Bank Account</FormLabel>
                          <Select value={accountPreferences.defaultCashAccountId || ''} onChange={(_, v) => handleAccountPrefChange('defaultCashAccountId', v || '')} placeholder="Select account..." size="sm">
                            <Option value="">Not set (auto-detect)</Option>
                            {getAccountsByType('asset').map(a => (<Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>))}
                          </Select>
                          <FormHelperText>Used for expenses, payments received, and payments made</FormHelperText>
                        </FormControl>
                        <FormControl size="sm">
                          <FormLabel>Default Revenue Account</FormLabel>
                          <Select value={accountPreferences.defaultRevenueAccountId || ''} onChange={(_, v) => handleAccountPrefChange('defaultRevenueAccountId', v || '')} placeholder="Select account..." size="sm">
                            <Option value="">Not set (auto-detect)</Option>
                            {getAccountsByType('revenue').map(a => (<Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>))}
                          </Select>
                          <FormHelperText>Used for income transactions and payments received</FormHelperText>
                        </FormControl>
                        <FormControl size="sm">
                          <FormLabel>Default Expense Account</FormLabel>
                          <Select value={accountPreferences.defaultExpenseAccountId || ''} onChange={(_, v) => handleAccountPrefChange('defaultExpenseAccountId', v || '')} placeholder="Select account..." size="sm">
                            <Option value="">Not set (auto-detect)</Option>
                            {getAccountsByType('expense').map(a => (<Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>))}
                          </Select>
                          <FormHelperText>Used for expense transactions and recurring expenses</FormHelperText>
                        </FormControl>
                      </Stack>
                    </SectionCard>

                    <SectionCard icon={<FileText size={18} />} title="Invoice & Bill Defaults">
                      <Stack spacing={2}>
                        <FormControl size="sm">
                          <FormLabel>Default Accounts Receivable</FormLabel>
                          <Select value={accountPreferences.defaultReceivableAccountId || ''} onChange={(_, v) => handleAccountPrefChange('defaultReceivableAccountId', v || '')} placeholder="Select account..." size="sm">
                            <Option value="">Not set (auto-detect)</Option>
                            {getAccountsByType('asset').map(a => (<Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>))}
                          </Select>
                          <FormHelperText>Used when sending invoices (Debit AR)</FormHelperText>
                        </FormControl>
                        <FormControl size="sm">
                          <FormLabel>Default Accounts Payable</FormLabel>
                          <Select value={accountPreferences.defaultPayableAccountId || ''} onChange={(_, v) => handleAccountPrefChange('defaultPayableAccountId', v || '')} placeholder="Select account..." size="sm">
                            <Option value="">Not set (auto-detect)</Option>
                            {getAccountsByType('liability').map(a => (<Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>))}
                          </Select>
                          <FormHelperText>Used when creating bills (Credit AP)</FormHelperText>
                        </FormControl>
                      </Stack>
                    </SectionCard>

                    <SectionCard icon={<Layers size={18} />} title="Payroll Defaults">
                      <Stack spacing={2}>
                        <FormControl size="sm">
                          <FormLabel>Default Salary Expense Account</FormLabel>
                          <Select value={accountPreferences.defaultSalaryExpenseAccountId || ''} onChange={(_, v) => handleAccountPrefChange('defaultSalaryExpenseAccountId', v || '')} placeholder="Select account..." size="sm">
                            <Option value="">Not set (auto-detect)</Option>
                            {getAccountsByType('expense').map(a => (<Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>))}
                          </Select>
                          <FormHelperText>Debited when marking salary slips as paid</FormHelperText>
                        </FormControl>
                        <FormControl size="sm">
                          <FormLabel>Default Tax Payable Account</FormLabel>
                          <Select value={accountPreferences.defaultTaxPayableAccountId || ''} onChange={(_, v) => handleAccountPrefChange('defaultTaxPayableAccountId', v || '')} placeholder="Select account..." size="sm">
                            <Option value="">Not set (auto-detect)</Option>
                            {getAccountsByType('liability').map(a => (<Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>))}
                          </Select>
                          <FormHelperText>Credited for tax withheld from salary</FormHelperText>
                        </FormControl>
                        <FormControl size="sm">
                          <FormLabel>Default Provident Fund Payable</FormLabel>
                          <Select value={accountPreferences.defaultPFPayableAccountId || ''} onChange={(_, v) => handleAccountPrefChange('defaultPFPayableAccountId', v || '')} placeholder="Select account..." size="sm">
                            <Option value="">Not set (auto-detect)</Option>
                            {getAccountsByType('liability').map(a => (<Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>))}
                          </Select>
                          <FormHelperText>Credited for provident fund withheld from salary</FormHelperText>
                        </FormControl>
                        <FormControl size="sm">
                          <FormLabel>Default Salary Bank Account</FormLabel>
                          <Select value={accountPreferences.defaultSalaryBankAccountId || ''} onChange={(_, v) => handleAccountPrefChange('defaultSalaryBankAccountId', v || '')} placeholder="Select account..." size="sm">
                            <Option value="">Not set (auto-detect)</Option>
                            {getAccountsByType('asset').map(a => (<Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>))}
                          </Select>
                          <FormHelperText>Credited when paying net salary</FormHelperText>
                        </FormControl>
                      </Stack>
                    </SectionCard>

                    <SectionCard icon={<Globe size={18} />} title="Bank Account Defaults">
                      <Stack spacing={2}>
                        <FormControl size="sm">
                          <FormLabel>Default Linked Asset Account</FormLabel>
                          <Select value={accountPreferences.defaultLinkedAssetAccountId || ''} onChange={(_, v) => handleAccountPrefChange('defaultLinkedAssetAccountId', v || '')} placeholder="Select account..." size="sm">
                            <Option value="">Not set (auto-detect)</Option>
                            {getAccountsByType('asset').map(a => (<Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>))}
                          </Select>
                          <FormHelperText>Linked GL account when creating new bank accounts</FormHelperText>
                        </FormControl>
                        <FormControl size="sm">
                          <FormLabel>Default Equity Account</FormLabel>
                          <Select value={accountPreferences.defaultEquityAccountId || ''} onChange={(_, v) => handleAccountPrefChange('defaultEquityAccountId', v || '')} placeholder="Select account..." size="sm">
                            <Option value="">Not set (auto-detect)</Option>
                            {getAccountsByType('equity').map(a => (<Option key={a.id} value={a.id}>{a.code} - {a.name}</Option>))}
                          </Select>
                          <FormHelperText>Used for opening balance journal entries</FormHelperText>
                        </FormControl>
                      </Stack>
                    </SectionCard>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button onClick={handleSaveAccountPreferences} loading={savingPreferences} startDecorator={<Save size={16} />}>
                        Save Account Defaults
                      </Button>
                    </Box>
                  </>
                )}
              </Stack>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* CUSTOMIZATION                          */}
            {/* ═══════════════════════════════════════ */}
            {activeSection === 'customization' && (
              <Stack spacing={3}>
                <Box>
                  <Typography level="title-lg" fontWeight={600}>Customize Options</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                    Manage statuses, categories, and other dropdown options used throughout the app.
                  </Typography>
                </Box>

                {loadingSettings ? (
                  <Stack spacing={2}>
                    {[...Array(5)].map((_, i) => (
                      <Card key={i} variant="outlined">
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
                        <AccordionSummary
                          indicator={<ChevronDown />}
                          slotProps={{ button: { component: 'div' } as any }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography level="title-sm">{setting.categoryName}</Typography>
                              <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                                {setting.options?.length || 0} options
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm" variant="soft" color="primary"
                                startDecorator={<Plus size={14} />}
                                onClick={(e) => { e.stopPropagation(); openAddModal(setting.categoryCode); }}
                              >
                                Add
                              </Button>
                              <IconButton
                                size="sm" variant="soft" color="neutral"
                                onClick={(e) => { e.stopPropagation(); setPendingResetCategory(setting.categoryCode); setResetConfirmOpen(true); }}
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
                                    <td><Typography level="body-xs" fontFamily="monospace">{option.code}</Typography></td>
                                    <td>{option.label}</td>
                                    <td>
                                      {option.color && (
                                        <Chip size="sm" variant="soft" sx={{
                                          bgcolor: option.color === 'green' ? 'success.softBg' :
                                            option.color === 'red' ? 'danger.softBg' :
                                            option.color === 'yellow' ? 'warning.softBg' :
                                            option.color === 'blue' ? 'primary.softBg' : 'neutral.softBg'
                                        }}>
                                          {option.color}
                                        </Chip>
                                      )}
                                    </td>
                                    <td>{option.isDefault && <Chip size="sm" color="success">Yes</Chip>}</td>
                                    <td style={{ textAlign: 'right' }}>
                                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        <IconButton size="sm" variant="plain" onClick={() => openEditModal(setting.categoryCode, option)}>
                                          <Pencil size={14} />
                                        </IconButton>
                                        {!option.isSystem && (
                                          <IconButton size="sm" variant="plain" color="danger"
                                            onClick={() => { setPendingDeleteOption({ categoryCode: setting.categoryCode, optionCode: option.code }); setDeleteConfirmOpen(true); }}
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
            )}

            {/* ═══════════════════════════════════════ */}
            {/* DANGER ZONE                            */}
            {/* ═══════════════════════════════════════ */}
            {activeSection === 'danger' && (
              <Stack spacing={3}>
                <Box sx={{ border: '2px solid', borderColor: 'danger.300', borderRadius: 'lg', p: 3, bgcolor: 'danger.50' }}>
                  <Stack spacing={3}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box sx={{ p: 1.5, borderRadius: 'md', bgcolor: 'danger.100', color: 'danger.600' }}>
                        <AlertTriangle size={24} />
                      </Box>
                      <Box>
                        <Typography level="title-lg" sx={{ color: 'danger.700' }}>Danger Zone</Typography>
                        <Typography level="body-sm" sx={{ color: 'danger.600' }}>
                          Actions in this section are destructive and cannot be undone.
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                      <Box>
                        <Typography level="title-md" sx={{ color: 'danger.700' }}>Delete All Company Data</Typography>
                        <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                          Permanently delete all invoices, bills, customers, vendors, employees, transactions,
                          and journal entries. The Chart of Accounts will be reset to defaults.
                        </Typography>
                      </Box>
                      <Button
                        color="danger" variant="solid"
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

                <Box sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200', borderRadius: 'md', p: 2 }}>
                  <Typography level="body-sm" sx={{ color: 'warning.700' }}>
                    <strong>Important:</strong> Before deleting data, consider exporting first. Once deleted, the data
                    cannot be recovered. This action requires a two-step confirmation to prevent accidental deletion.
                  </Typography>
                </Box>
              </Stack>
            )}
        </Box>
      </Box>

      {/* ═══════════════ Modals ═══════════════ */}

      {/* Add Option Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)}>
        <ModalDialog sx={{ width: 400, minWidth: 400 }}>
          <ModalClose />
          <Typography level="title-lg">Add New Option</Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl required error={!!labelError} sx={{ minHeight: 80 }}>
              <FormLabel>Label</FormLabel>
              <Input value={newOptionLabel} onChange={(e) => handleLabelChange(e.target.value)} placeholder="e.g., Custom Status" color={labelError ? 'danger' : undefined} />
              <FormHelperText sx={{ color: labelError ? 'danger.500' : 'text.tertiary', minHeight: 20 }}>{labelError || ' '}</FormHelperText>
            </FormControl>
            <FormControl required error={!!codeError} sx={{ minHeight: 80 }}>
              <FormLabel>Code</FormLabel>
              <Input value={newOptionCode} onChange={(e) => handleCodeChange(e.target.value)} placeholder="e.g., custom_status" color={codeError ? 'danger' : undefined} />
              <FormHelperText sx={{ color: codeError ? 'danger.500' : 'text.tertiary', minHeight: 20 }}>{codeError || 'Lowercase letters, numbers, underscores only'}</FormHelperText>
            </FormControl>
            <FormControl sx={{ minHeight: 70 }}>
              <FormLabel>Color (Optional)</FormLabel>
              <Select value={newOptionColor} onChange={(_, v) => setNewOptionColor(v || '')} placeholder="Select a color">
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
              <Button variant="plain" color="neutral" onClick={() => setAddModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddOption} loading={savingOption} disabled={!!labelError || !!codeError || !newOptionLabel || !newOptionCode}>Add Option</Button>
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
              <Input value={selectedOption?.code || ''} disabled sx={{ bgcolor: 'neutral.100' }} />
              <FormHelperText sx={{ minHeight: 20 }}>Code cannot be changed</FormHelperText>
            </FormControl>
            <FormControl required error={!!labelError} sx={{ minHeight: 80 }}>
              <FormLabel>Label</FormLabel>
              <Input value={newOptionLabel} onChange={(e) => handleLabelChange(e.target.value)} placeholder="Option label" color={labelError ? 'danger' : undefined} />
              <FormHelperText sx={{ color: labelError ? 'danger.500' : 'text.tertiary', minHeight: 20 }}>{labelError || ' '}</FormHelperText>
            </FormControl>
            <FormControl sx={{ minHeight: 70 }}>
              <FormLabel>Color (Optional)</FormLabel>
              <Select value={newOptionColor} onChange={(_, v) => setNewOptionColor(v || '')} placeholder="Select a color">
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
              <Button variant="plain" color="neutral" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateOption} loading={savingOption} disabled={!!labelError || !newOptionLabel}>Save Changes</Button>
            </Stack>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setPendingDeleteOption(null); }}
        onConfirm={handleDeleteOption}
        title="Delete Option"
        description="Are you sure you want to delete this option? This action cannot be undone."
        confirmText="Delete" cancelText="Cancel" variant="danger" loading={savingOption}
      />
      <ConfirmDialog
        open={resetConfirmOpen}
        onClose={() => { setResetConfirmOpen(false); setPendingResetCategory(null); }}
        onConfirm={handleResetCategory}
        title="Reset to Defaults"
        description="Are you sure you want to reset this category to defaults? All custom options will be removed and replaced with the default options."
        confirmText="Reset" cancelText="Cancel" variant="warning" loading={savingOption}
      />
      <DangerousConfirmDialog
        open={deleteDataConfirmOpen}
        onClose={() => setDeleteDataConfirmOpen(false)}
        onConfirm={handleDeleteCompanyData}
        title="Delete All Company Data"
        description="This action will permanently delete all your business data. This cannot be undone."
        confirmPhrase="DELETE ALL DATA" confirmText="Delete Everything" cancelText="Cancel"
        loading={deletingData} warningItems={getWarningItems()}
      />
    </Box>
  );
}
