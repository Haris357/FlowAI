'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Container,
  Table,
  Sheet,
  Chip,
  Input,
  Select,
  Option,
  Button,
  Modal,
  ModalDialog,
  ModalClose,
  Divider,
  IconButton,
  Skeleton,
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
  ListItemDecorator,
  FormControl,
  FormLabel,
  FormHelperText,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Textarea,
  Switch,
  AccordionGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/joy';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getAccounts } from '@/services/accounts';
import {
  getMasterAccountTypes,
  getCompanySubtypes,
  addAccountSubtype,
  addAccount
} from '@/services/account-init';
import { Account, AccountTypeMaster, AccountSubtype } from '@/types';
import { LoadingSpinner, EmptyState, ConfirmDialog, PageBreadcrumbs, FormTableSkeleton } from '@/components/common';
import {
  Search, Wallet, TrendingUp, TrendingDown, Scale, Plus,
  ChevronLeft, ChevronRight, FolderPlus, Edit2, Trash2, Layers, MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default function AccountsPage() {
  const { user, loading: authLoading } = useAuth();
  const { company } = useCompany();
  const router = useRouter();

  // Data states
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountTypeMaster[]>([]);
  const [accountSubtypes, setAccountSubtypes] = useState<AccountSubtype[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Filter states - Accounts
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSubtype, setFilterSubtype] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter states - Subtypes
  const [subtypeSearch, setSubtypeSearch] = useState('');
  const [subtypeFilterType, setSubtypeFilterType] = useState<string>('all');
  const [subtypePage, setSubtypePage] = useState(1);

  // Modal states - Add Account
  const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountCode, setNewAccountCode] = useState('');
  const [newAccountSubtype, setNewAccountSubtype] = useState('');
  const [newAccountDescription, setNewAccountDescription] = useState('');
  const [newAccountIsActive, setNewAccountIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states - Add Subtype
  const [addSubtypeModalOpen, setAddSubtypeModalOpen] = useState(false);
  const [newSubtypeName, setNewSubtypeName] = useState('');
  const [newSubtypeType, setNewSubtypeType] = useState('');
  const [newSubtypeDescription, setNewSubtypeDescription] = useState('');

  // Modal states - Edit Account
  const [editAccountModalOpen, setEditAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Modal states - Edit Subtype
  const [editSubtypeModalOpen, setEditSubtypeModalOpen] = useState(false);
  const [editingSubtype, setEditingSubtype] = useState<AccountSubtype | null>(null);

  // Confirm dialog states
  const [deleteAccountConfirmOpen, setDeleteAccountConfirmOpen] = useState(false);
  const [deleteSubtypeConfirmOpen, setDeleteSubtypeConfirmOpen] = useState(false);
  const [pendingDeleteAccount, setPendingDeleteAccount] = useState<Account | null>(null);
  const [pendingDeleteSubtype, setPendingDeleteSubtype] = useState<AccountSubtype | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Validation state - Add Account
  const [accountNameError, setAccountNameError] = useState('');
  const [accountCodeError, setAccountCodeError] = useState('');
  const [accountSubtypeError, setAccountSubtypeError] = useState('');

  // Validation state - Add Subtype
  const [subtypeNameError, setSubtypeNameError] = useState('');
  const [subtypeTypeError, setSubtypeTypeError] = useState('');

  // Validation state - Edit Account
  const [editAccountNameError, setEditAccountNameError] = useState('');

  // Validation state - Edit Subtype
  const [editSubtypeNameError, setEditSubtypeNameError] = useState('');

  // Validation functions
  const validateAccountName = (name: string, isEdit = false): boolean => {
    const setError = isEdit ? setEditAccountNameError : setAccountNameError;
    if (!name.trim()) {
      setError('Account name is required');
      return false;
    }
    if (name.trim().length < 2) {
      setError('Account name must be at least 2 characters');
      return false;
    }
    if (name.trim().length > 100) {
      setError('Account name must be less than 100 characters');
      return false;
    }
    // Check for duplicate names (excluding current account when editing)
    const duplicate = accounts.find(a =>
      a.name.toLowerCase() === name.trim().toLowerCase() &&
      (!isEdit || a.id !== editingAccount?.id)
    );
    if (duplicate) {
      setError('An account with this name already exists');
      return false;
    }
    setError('');
    return true;
  };

  const validateAccountCode = (code: string): boolean => {
    if (!code) {
      setAccountCodeError('');
      return true; // Code is optional
    }
    if (!/^[a-zA-Z0-9-_]+$/.test(code)) {
      setAccountCodeError('Code can only contain letters, numbers, hyphens, and underscores');
      return false;
    }
    if (code.length > 20) {
      setAccountCodeError('Code must be less than 20 characters');
      return false;
    }
    // Check for duplicate codes
    const duplicate = accounts.find(a => a.code.toLowerCase() === code.toLowerCase());
    if (duplicate) {
      setAccountCodeError('An account with this code already exists');
      return false;
    }
    setAccountCodeError('');
    return true;
  };

  const validateAccountSubtype = (subtypeId: string): boolean => {
    if (!subtypeId) {
      setAccountSubtypeError('Please select an account subtype');
      return false;
    }
    setAccountSubtypeError('');
    return true;
  };

  const validateSubtypeName = (name: string, isEdit = false): boolean => {
    const setError = isEdit ? setEditSubtypeNameError : setSubtypeNameError;
    if (!name.trim()) {
      setError('Subtype name is required');
      return false;
    }
    if (name.trim().length < 2) {
      setError('Subtype name must be at least 2 characters');
      return false;
    }
    if (name.trim().length > 100) {
      setError('Subtype name must be less than 100 characters');
      return false;
    }
    // Check for duplicate names (excluding current subtype when editing)
    const duplicate = accountSubtypes.find(s =>
      s.name.toLowerCase() === name.trim().toLowerCase() &&
      (!isEdit || s.id !== editingSubtype?.id)
    );
    if (duplicate) {
      setError('A subtype with this name already exists');
      return false;
    }
    setError('');
    return true;
  };

  const validateSubtypeType = (typeCode: string): boolean => {
    if (!typeCode) {
      setSubtypeTypeError('Please select an account type');
      return false;
    }
    setSubtypeTypeError('');
    return true;
  };

  // Reset validation errors when modals close
  const resetAccountValidation = () => {
    setAccountNameError('');
    setAccountCodeError('');
    setAccountSubtypeError('');
  };

  const resetSubtypeValidation = () => {
    setSubtypeNameError('');
    setSubtypeTypeError('');
  };

  const resetEditAccountValidation = () => {
    setEditAccountNameError('');
  };

  const resetEditSubtypeValidation = () => {
    setEditSubtypeNameError('');
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchData() {
      if (!company?.id) return;

      try {
        // Fetch account types (master)
        const types = await getMasterAccountTypes();
        setAccountTypes(types.sort((a, b) => a.order - b.order));

        // Fetch account subtypes (per company)
        const subtypes = await getCompanySubtypes(company.id);
        setAccountSubtypes(subtypes);

        // Fetch accounts
        const data = await getAccounts(company.id);
        setAccounts(data);
      } catch (error) {
        console.error('Error fetching accounts:', error);
        toast.error('Failed to load accounts');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [company?.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: company?.currency || 'USD',
    }).format(amount);
  };

  // Filter subtypes based on selected type for accounts filter
  const filteredSubtypesForFilter = useMemo(() => {
    if (filterType === 'all') return accountSubtypes;
    return accountSubtypes.filter(s => s.typeCode === filterType);
  }, [accountSubtypes, filterType]);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || a.typeCode === filterType;
      const matchesSubtype = filterSubtype === 'all' || a.subtypeId === filterSubtype;
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && a.isActive) ||
        (filterStatus === 'inactive' && !a.isActive);
      return matchesSearch && matchesType && matchesSubtype && matchesStatus;
    });
  }, [accounts, searchTerm, filterType, filterSubtype, filterStatus]);

  // Filter subtypes for subtypes tab
  const filteredSubtypes = useMemo(() => {
    return accountSubtypes.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(subtypeSearch.toLowerCase());
      const matchesType = subtypeFilterType === 'all' || s.typeCode === subtypeFilterType;
      return matchesSearch && matchesType;
    });
  }, [accountSubtypes, subtypeSearch, subtypeFilterType]);

  // Pagination calculations - Accounts
  const totalPages = Math.ceil(filteredAccounts.length / rowsPerPage);
  const paginatedAccounts = filteredAccounts.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Pagination calculations - Subtypes
  const subtypeTotalPages = Math.ceil(filteredSubtypes.length / rowsPerPage);
  const paginatedSubtypes = filteredSubtypes.slice(
    (subtypePage - 1) * rowsPerPage,
    subtypePage * rowsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterType, filterSubtype, filterStatus]);

  useEffect(() => {
    setSubtypePage(1);
  }, [subtypeSearch, subtypeFilterType]);

  // Reset subtype filter when type changes
  useEffect(() => {
    setFilterSubtype('all');
  }, [filterType]);

  const getTypeIcon = (typeCode: string) => {
    switch (typeCode) {
      case 'asset':
        return <Wallet size={16} />;
      case 'liability':
        return <TrendingDown size={16} />;
      case 'equity':
        return <Scale size={16} />;
      case 'revenue':
        return <TrendingUp size={16} />;
      case 'expense':
        return <TrendingDown size={16} />;
      default:
        return <Wallet size={16} />;
    }
  };

  const getTypeColor = (typeCode: string): 'primary' | 'danger' | 'success' | 'warning' | 'neutral' => {
    switch (typeCode) {
      case 'asset':
        return 'primary';
      case 'liability':
        return 'danger';
      case 'equity':
        return 'success';
      case 'revenue':
        return 'success';
      case 'expense':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  // Calculate totals from DB
  const totalAssets = accounts.filter(a => a.typeCode === 'asset').reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalLiabilities = accounts.filter(a => a.typeCode === 'liability').reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalEquity = accounts.filter(a => a.typeCode === 'equity').reduce((sum, a) => sum + (a.balance || 0), 0);

  const refreshData = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const [types, subtypes, accts] = await Promise.all([
        getMasterAccountTypes(),
        getCompanySubtypes(company.id),
        getAccounts(company.id)
      ]);
      setAccountTypes(types.sort((a, b) => a.order - b.order));
      setAccountSubtypes(subtypes);
      setAccounts(accts);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!company?.id) return;

    // Validate all fields
    const isNameValid = validateAccountName(newAccountName);
    const isCodeValid = validateAccountCode(newAccountCode);
    const isSubtypeValid = validateAccountSubtype(newAccountSubtype);

    if (!isNameValid || !isCodeValid || !isSubtypeValid) {
      return;
    }

    setSaving(true);
    try {
      await addAccount(
        company.id,
        newAccountName.trim(),
        newAccountSubtype,
        newAccountCode || undefined,
        newAccountDescription || undefined
      );

      await refreshData();

      // Reset form
      setNewAccountName('');
      setNewAccountCode('');
      setNewAccountSubtype('');
      setNewAccountDescription('');
      setNewAccountIsActive(true);
      resetAccountValidation();
      setAddAccountModalOpen(false);
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubtype = async () => {
    if (!company?.id) return;

    // Validate all fields
    const isNameValid = validateSubtypeName(newSubtypeName);
    const isTypeValid = validateSubtypeType(newSubtypeType);

    if (!isNameValid || !isTypeValid) {
      return;
    }

    setSaving(true);
    try {
      await addAccountSubtype(company.id, newSubtypeName.trim(), newSubtypeType);
      await refreshData();

      // Reset form
      setNewSubtypeName('');
      setNewSubtypeType('');
      setNewSubtypeDescription('');
      resetSubtypeValidation();
      setAddSubtypeModalOpen(false);
      toast.success('Account subtype created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create subtype');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAccount = async () => {
    if (!company?.id || !editingAccount) return;

    // Validate name
    if (!validateAccountName(editingAccount.name, true)) {
      return;
    }

    setSaving(true);
    try {
      const accountRef = doc(db, `companies/${company.id}/chartOfAccounts`, editingAccount.id);
      await updateDoc(accountRef, {
        name: editingAccount.name.trim(),
        description: editingAccount.description || '',
        isActive: editingAccount.isActive,
        updatedAt: serverTimestamp()
      });

      await refreshData();
      resetEditAccountValidation();
      setEditAccountModalOpen(false);
      setEditingAccount(null);
      toast.success('Account updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update account');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubtype = async () => {
    if (!company?.id || !editingSubtype) return;

    // Validate name
    if (!validateSubtypeName(editingSubtype.name, true)) {
      return;
    }

    setSaving(true);
    try {
      const subtypeRef = doc(db, `companies/${company.id}/accountSubtypes`, editingSubtype.id);
      await updateDoc(subtypeRef, {
        name: editingSubtype.name.trim(),
        description: editingSubtype.description || '',
      });

      await refreshData();
      resetEditSubtypeValidation();
      setEditSubtypeModalOpen(false);
      setEditingSubtype(null);
      toast.success('Subtype updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update subtype');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteAccountConfirm = (account: Account) => {
    if (account.isSystem) {
      toast.error('Cannot delete system accounts');
      return;
    }

    if (account.balance !== 0) {
      toast.error('Cannot delete account with non-zero balance');
      return;
    }

    setPendingDeleteAccount(account);
    setDeleteAccountConfirmOpen(true);
  };

  const handleDeleteAccount = async () => {
    if (!pendingDeleteAccount) return;

    setDeleting(true);
    try {
      const accountRef = doc(db, `companies/${company?.id}/chartOfAccounts`, pendingDeleteAccount.id);
      await deleteDoc(accountRef);
      await refreshData();
      toast.success('Account deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
      setDeleteAccountConfirmOpen(false);
      setPendingDeleteAccount(null);
    }
  };

  const openDeleteSubtypeConfirm = (subtype: AccountSubtype) => {
    if (subtype.isSystem) {
      toast.error('Cannot delete system subtypes');
      return;
    }

    // Check if any accounts use this subtype
    const accountsUsingSubtype = accounts.filter(a => a.subtypeId === subtype.id);
    if (accountsUsingSubtype.length > 0) {
      toast.error(`Cannot delete subtype - ${accountsUsingSubtype.length} account(s) are using it`);
      return;
    }

    setPendingDeleteSubtype(subtype);
    setDeleteSubtypeConfirmOpen(true);
  };

  const handleDeleteSubtype = async () => {
    if (!pendingDeleteSubtype) return;

    setDeleting(true);
    try {
      const subtypeRef = doc(db, `companies/${company?.id}/accountSubtypes`, pendingDeleteSubtype.id);
      await deleteDoc(subtypeRef);
      await refreshData();
      toast.success('Subtype deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete subtype');
    } finally {
      setDeleting(false);
      setDeleteSubtypeConfirmOpen(false);
      setPendingDeleteSubtype(null);
    }
  };

  if (authLoading || !user) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Breadcrumbs */}
        <PageBreadcrumbs
          items={[
            { label: 'Accounts', icon: <Wallet size={14} /> },
          ]}
        />

        {/* Header */}
        <Box>
          <Typography level="h2" sx={{ mb: 0.5 }}>
            Chart of Accounts
          </Typography>
          <Typography level="body-md" sx={{ color: 'text.secondary' }}>
            Manage your accounts, subtypes, and balances
          </Typography>
        </Box>

        {/* Stats Cards - Collapsible */}
        <AccordionGroup>
          <Accordion defaultExpanded={false}>
            <AccordionSummary>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <Wallet size={18} />
                <Typography level="body-sm" fontWeight={500}>
                  Total Accounts: {loading ? '...' : accounts.length}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: 'primary.600' }}>
                  Assets: {loading ? '...' : formatCurrency(totalAssets)}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: 'danger.600' }}>
                  Liabilities: {loading ? '...' : formatCurrency(totalLiabilities)}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: 'primary.600' }}>
                  Equity: {loading ? '...' : formatCurrency(totalEquity)}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                {/* Total Assets */}
                <Grid xs={6} md={3}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)',
                      borderColor: 'primary.200',
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Total Assets
                        </Typography>
                        <Box sx={{ p: 0.75, borderRadius: 'sm', bgcolor: 'primary.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Wallet size={16} style={{ color: 'var(--joy-palette-primary-600)' }} />
                        </Box>
                      </Stack>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                        {loading ? <Skeleton width={80} /> : formatCurrency(totalAssets)}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        {accounts.filter(a => a.typeCode === 'asset').length} accounts
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Total Liabilities */}
                <Grid xs={6} md={3}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.08) 0%, rgba(211, 47, 47, 0.02) 100%)',
                      borderColor: 'danger.200',
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Total Liabilities
                        </Typography>
                        <Box sx={{ p: 0.75, borderRadius: 'sm', bgcolor: 'danger.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TrendingDown size={16} style={{ color: 'var(--joy-palette-danger-600)' }} />
                        </Box>
                      </Stack>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'danger.700' }}>
                        {loading ? <Skeleton width={80} /> : formatCurrency(totalLiabilities)}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        {accounts.filter(a => a.typeCode === 'liability').length} accounts
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Total Equity */}
                <Grid xs={6} md={3}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(46, 125, 50, 0.02) 100%)',
                      borderColor: 'primary.200',
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Total Equity
                        </Typography>
                        <Box sx={{ p: 0.75, borderRadius: 'sm', bgcolor: 'primary.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Scale size={16} style={{ color: 'var(--joy-palette-success-600)' }} />
                        </Box>
                      </Stack>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                        {loading ? <Skeleton width={80} /> : formatCurrency(totalEquity)}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        {accounts.filter(a => a.typeCode === 'equity').length} accounts
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Total Accounts */}
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>
                        Total Accounts
                      </Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={60} /> : accounts.length}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        {accountSubtypes.length} subtypes
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Revenue */}
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Revenue
                        </Typography>
                        <Box sx={{ p: 0.75, borderRadius: 'sm', bgcolor: 'primary.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TrendingUp size={16} style={{ color: 'var(--joy-palette-success-600)' }} />
                        </Box>
                      </Stack>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                        {loading ? <Skeleton width={80} /> : formatCurrency(accounts.filter(a => a.typeCode === 'revenue').reduce((sum, a) => sum + (a.balance || 0), 0))}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        {accounts.filter(a => a.typeCode === 'revenue').length} accounts
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Expenses */}
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Expenses
                        </Typography>
                        <Box sx={{ p: 0.75, borderRadius: 'sm', bgcolor: 'warning.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TrendingDown size={16} style={{ color: 'var(--joy-palette-warning-600)' }} />
                        </Box>
                      </Stack>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'warning.700' }}>
                        {loading ? <Skeleton width={80} /> : formatCurrency(accounts.filter(a => a.typeCode === 'expense').reduce((sum, a) => sum + (a.balance || 0), 0))}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        {accounts.filter(a => a.typeCode === 'expense').length} accounts
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Active Accounts */}
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>
                        Active Accounts
                      </Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.600' }}>
                        {loading ? <Skeleton width={60} /> : accounts.filter(a => a.isActive).length}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        {accounts.length > 0 ? ((accounts.filter(a => a.isActive).length / accounts.length) * 100).toFixed(0) : 0}% of total
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* System Accounts */}
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>
                        System Accounts
                      </Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={60} /> : accounts.filter(a => a.isSystem).length}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        Protected
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </AccordionGroup>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value as number)}>
          <TabList>
            <Tab>
              <Stack direction="row" spacing={1} alignItems="center">
                <Wallet size={16} />
                <span>Accounts ({accounts.length})</span>
              </Stack>
            </Tab>
            <Tab>
              <Stack direction="row" spacing={1} alignItems="center">
                <Layers size={16} />
                <span>Subtypes ({accountSubtypes.length})</span>
              </Stack>
            </Tab>
          </TabList>

          {/* Accounts Tab */}
          <TabPanel value={0} sx={{ p: 0, pt: 2 }}>
            {/* Filters */}
            <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
              <Input
                placeholder="Search accounts..."
                startDecorator={<Search size={18} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: 1, minWidth: 200 }}
              />
              <Select
                value={filterType}
                onChange={(_, value) => setFilterType(value || 'all')}
                sx={{ minWidth: 140 }}
              >
                <Option value="all">All Types</Option>
                {accountTypes.map(type => (
                  <Option key={type.code} value={type.code}>
                    {type.name}
                  </Option>
                ))}
              </Select>
              <Select
                value={filterSubtype}
                onChange={(_, value) => setFilterSubtype(value || 'all')}
                sx={{ minWidth: 160 }}
              >
                <Option value="all">All Subtypes</Option>
                {filteredSubtypesForFilter.map(subtype => (
                  <Option key={subtype.id} value={subtype.id}>
                    {subtype.name}
                  </Option>
                ))}
              </Select>
              <Select
                value={filterStatus}
                onChange={(_, value) => setFilterStatus(value || 'all')}
                sx={{ minWidth: 120 }}
              >
                <Option value="all">All Status</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
              <Button
                variant="solid"
                color="primary"
                startDecorator={<Plus size={18} />}
                onClick={() => setAddAccountModalOpen(true)}
              >
                Add Account
              </Button>
            </Stack>

            {/* Accounts Table */}
            <Card>
              <CardContent sx={{ p: 0 }}>
                {loading ? (
                  <FormTableSkeleton columns={7} rows={8} />
                ) : filteredAccounts.length === 0 ? (
                  <EmptyState type="accounts" />
                ) : (
                  <Sheet sx={{ overflow: 'auto' }}>
                    <Table stickyHeader>
                      <thead>
                        <tr>
                          <th style={{ width: 100 }}>Code</th>
                          <th>Account Name</th>
                          <th style={{ width: 120 }}>Type</th>
                          <th style={{ width: 160 }}>Subtype</th>
                          <th style={{ width: 80 }}>Status</th>
                          <th style={{ width: 130, textAlign: 'right' }}>Balance</th>
                          <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAccounts.map((account) => (
                          <tr key={account.id}>
                            <td>
                              <Typography
                                level="body-sm"
                                fontFamily="monospace"
                                sx={{
                                  maxWidth: 100,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block',
                                }}
                                title={account.code}
                              >
                                {account.code}
                              </Typography>
                            </td>
                            <td>
                              <Typography level="body-sm" fontWeight={500}>
                                {account.name}
                              </Typography>
                              {account.description && (
                                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                  {account.description}
                                </Typography>
                              )}
                            </td>
                            <td>
                              <Chip
                                size="sm"
                                variant="soft"
                                color={getTypeColor(account.typeCode)}
                                startDecorator={getTypeIcon(account.typeCode)}
                              >
                                {account.typeName}
                              </Chip>
                            </td>
                            <td>
                              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                                {account.subtypeName || '-'}
                              </Typography>
                            </td>
                            <td>
                              <Chip
                                size="sm"
                                variant="soft"
                                color={account.isActive ? 'success' : 'neutral'}
                              >
                                {account.isActive ? 'Active' : 'Inactive'}
                              </Chip>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <Typography
                                level="body-sm"
                                fontWeight="bold"
                                sx={{
                                  color: (account.balance || 0) >= 0 ? 'primary.600' : 'danger.600',
                                }}
                              >
                                {formatCurrency(account.balance || 0)}
                              </Typography>
                            </td>
                            <td>
                              <Stack direction="row" spacing={0.5} justifyContent="center">
                                <Dropdown>
                                  <MenuButton
                                    slots={{ root: IconButton }}
                                    slotProps={{ root: { variant: 'plain', size: 'sm', color: 'neutral' } }}
                                  >
                                    <MoreVertical size={18} />
                                  </MenuButton>
                                  <Menu placement="bottom-end" sx={{ zIndex: 1300, minWidth: 160 }}>
                                    <MenuItem onClick={() => {
                                      setEditingAccount({ ...account });
                                      setEditAccountModalOpen(true);
                                    }}>
                                      <ListItemDecorator><Edit2 size={16} /></ListItemDecorator>
                                      Edit
                                    </MenuItem>
                                    {!account.isSystem && (
                                      <>
                                        <Divider />
                                        <MenuItem color="danger" onClick={() => openDeleteAccountConfirm(account)}>
                                          <ListItemDecorator sx={{ color: 'inherit' }}><Trash2 size={16} /></ListItemDecorator>
                                          Delete
                                        </MenuItem>
                                      </>
                                    )}
                                  </Menu>
                                </Dropdown>
                              </Stack>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Sheet>
                )}
                {!loading && filteredAccounts.length > 0 && (
                  <Box sx={{ px: 2, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                          Rows per page:
                        </Typography>
                        <Select
                          size="sm"
                          value={rowsPerPage}
                          onChange={(_, value) => {
                            setRowsPerPage(value || 10);
                            setPage(1);
                          }}
                          sx={{ width: 80 }}
                        >
                          <Option value={10}>10</Option>
                          <Option value={25}>25</Option>
                          <Option value={50}>50</Option>
                          <Option value={100}>100</Option>
                        </Select>
                        <Typography level="body-sm" sx={{ color: 'text.secondary', ml: 2 }}>
                          {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filteredAccounts.length)} of {filteredAccounts.length}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton
                          size="sm"
                          variant="outlined"
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}
                        >
                          <ChevronLeft size={18} />
                        </IconButton>
                        <Typography level="body-sm" sx={{ minWidth: 100, textAlign: 'center' }}>
                          Page {page} of {totalPages || 1}
                        </Typography>
                        <IconButton
                          size="sm"
                          variant="outlined"
                          disabled={page >= totalPages}
                          onClick={() => setPage(page + 1)}
                        >
                          <ChevronRight size={18} />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          {/* Subtypes Tab */}
          <TabPanel value={1} sx={{ p: 0, pt: 2 }}>
            {/* Filters */}
            <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
              <Input
                placeholder="Search subtypes..."
                startDecorator={<Search size={18} />}
                value={subtypeSearch}
                onChange={(e) => setSubtypeSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 200 }}
              />
              <Select
                value={subtypeFilterType}
                onChange={(_, value) => setSubtypeFilterType(value || 'all')}
                sx={{ minWidth: 140 }}
              >
                <Option value="all">All Types</Option>
                {accountTypes.map(type => (
                  <Option key={type.code} value={type.code}>
                    {type.name}
                  </Option>
                ))}
              </Select>
              <Button
                variant="solid"
                color="primary"
                startDecorator={<FolderPlus size={18} />}
                onClick={() => setAddSubtypeModalOpen(true)}
              >
                Add Subtype
              </Button>
            </Stack>

            {/* Subtypes Table */}
            <Card>
              <CardContent sx={{ p: 0 }}>
                {loading ? (
                  <FormTableSkeleton columns={6} rows={8} />
                ) : filteredSubtypes.length === 0 ? (
                  <Box sx={{ p: 6, textAlign: 'center' }}>
                    <Layers size={48} style={{ color: 'var(--joy-palette-neutral-400)', marginBottom: 16 }} />
                    <Typography level="h4" sx={{ mb: 1 }}>No subtypes found</Typography>
                    <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 2 }}>
                      Create subtypes to organize your accounts
                    </Typography>
                    <Button
                      variant="solid"
                      color="primary"
                      startDecorator={<FolderPlus size={18} />}
                      onClick={() => setAddSubtypeModalOpen(true)}
                    >
                      Add Subtype
                    </Button>
                  </Box>
                ) : (
                  <Sheet sx={{ overflow: 'auto' }}>
                    <Table stickyHeader>
                      <thead>
                        <tr>
                          <th style={{ width: 100 }}>Code</th>
                          <th>Subtype Name</th>
                          <th style={{ width: 120 }}>Account Type</th>
                          <th style={{ width: 100 }}>Accounts</th>
                          <th style={{ width: 80 }}>System</th>
                          <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSubtypes.map((subtype) => {
                          const accountCount = accounts.filter(a => a.subtypeId === subtype.id).length;
                          return (
                            <tr key={subtype.id}>
                              <td>
                                <Typography
                                  level="body-sm"
                                  fontFamily="monospace"
                                  sx={{
                                    maxWidth: 100,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'block',
                                  }}
                                  title={subtype.code}
                                >
                                  {subtype.code}
                                </Typography>
                              </td>
                              <td>
                                <Typography level="body-sm" fontWeight={500}>
                                  {subtype.name}
                                </Typography>
                                {subtype.description && (
                                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                    {subtype.description}
                                  </Typography>
                                )}
                              </td>
                              <td>
                                <Chip
                                  size="sm"
                                  variant="soft"
                                  color={getTypeColor(subtype.typeCode)}
                                  startDecorator={getTypeIcon(subtype.typeCode)}
                                >
                                  {subtype.typeName}
                                </Chip>
                              </td>
                              <td>
                                <Typography level="body-sm">
                                  {accountCount}
                                </Typography>
                              </td>
                              <td>
                                {subtype.isSystem && (
                                  <Chip size="sm" variant="soft" color="neutral">
                                    System
                                  </Chip>
                                )}
                              </td>
                              <td>
                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                  <Dropdown>
                                    <MenuButton
                                      slots={{ root: IconButton }}
                                      slotProps={{ root: { variant: 'plain', size: 'sm', color: 'neutral' } }}
                                    >
                                      <MoreVertical size={18} />
                                    </MenuButton>
                                    <Menu placement="bottom-end" sx={{ zIndex: 1300, minWidth: 160 }}>
                                      <MenuItem onClick={() => {
                                        setEditingSubtype({ ...subtype });
                                        setEditSubtypeModalOpen(true);
                                      }}>
                                        <ListItemDecorator><Edit2 size={16} /></ListItemDecorator>
                                        Edit
                                      </MenuItem>
                                      {!subtype.isSystem && (
                                        <>
                                          <Divider />
                                          <MenuItem color="danger" onClick={() => openDeleteSubtypeConfirm(subtype)}>
                                            <ListItemDecorator sx={{ color: 'inherit' }}><Trash2 size={16} /></ListItemDecorator>
                                            Delete
                                          </MenuItem>
                                        </>
                                      )}
                                    </Menu>
                                  </Dropdown>
                                </Stack>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </Sheet>
                )}
                {!loading && filteredSubtypes.length > 0 && (
                  <Box sx={{ px: 2, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                      <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                        {(subtypePage - 1) * rowsPerPage + 1}-{Math.min(subtypePage * rowsPerPage, filteredSubtypes.length)} of {filteredSubtypes.length}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton
                          size="sm"
                          variant="outlined"
                          disabled={subtypePage === 1}
                          onClick={() => setSubtypePage(subtypePage - 1)}
                        >
                          <ChevronLeft size={18} />
                        </IconButton>
                        <Typography level="body-sm" sx={{ minWidth: 100, textAlign: 'center' }}>
                          Page {subtypePage} of {subtypeTotalPages || 1}
                        </Typography>
                        <IconButton
                          size="sm"
                          variant="outlined"
                          disabled={subtypePage >= subtypeTotalPages}
                          onClick={() => setSubtypePage(subtypePage + 1)}
                        >
                          <ChevronRight size={18} />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          </TabPanel>
        </Tabs>
      </Stack>

      {/* Add Account Modal */}
      <Modal open={addAccountModalOpen} onClose={() => { setAddAccountModalOpen(false); resetAccountValidation(); }}>
        <ModalDialog sx={{ maxWidth: 500, width: '90%' }}>
          <ModalClose />
          <Typography level="h4" sx={{ mb: 2 }}>
            Add New Account
          </Typography>

          <Stack spacing={2}>
            <FormControl required error={!!accountNameError}>
              <FormLabel>Account Name</FormLabel>
              <Input
                placeholder="e.g., Office Rent"
                value={newAccountName}
                onChange={(e) => {
                  setNewAccountName(e.target.value);
                  if (accountNameError) validateAccountName(e.target.value);
                }}
                onBlur={() => newAccountName && validateAccountName(newAccountName)}
                color={accountNameError ? 'danger' : undefined}
              />
              {accountNameError && (
                <FormHelperText sx={{ color: 'danger.500' }}>{accountNameError}</FormHelperText>
              )}
            </FormControl>

            <FormControl error={!!accountCodeError}>
              <FormLabel>Account Code (Optional)</FormLabel>
              <Input
                placeholder="e.g., 5095"
                value={newAccountCode}
                onChange={(e) => {
                  setNewAccountCode(e.target.value);
                  if (accountCodeError) validateAccountCode(e.target.value);
                }}
                onBlur={() => newAccountCode && validateAccountCode(newAccountCode)}
                color={accountCodeError ? 'danger' : undefined}
              />
              {accountCodeError ? (
                <FormHelperText sx={{ color: 'danger.500' }}>{accountCodeError}</FormHelperText>
              ) : (
                <FormHelperText>Leave empty to auto-generate</FormHelperText>
              )}
            </FormControl>

            <FormControl required error={!!accountSubtypeError}>
              <FormLabel>Account Subtype</FormLabel>
              <Select
                placeholder="Select subtype"
                value={newAccountSubtype}
                onChange={(_, value) => {
                  setNewAccountSubtype(value || '');
                  if (accountSubtypeError) validateAccountSubtype(value || '');
                }}
                color={accountSubtypeError ? 'danger' : undefined}
              >
                {accountTypes.map(type => (
                  <React.Fragment key={type.code}>
                    <Option value="" disabled sx={{ fontWeight: 'bold', bgcolor: 'background.level1' }}>
                      {type.name}
                    </Option>
                    {accountSubtypes
                      .filter(s => s.typeCode === type.code)
                      .map(subtype => (
                        <Option key={subtype.id} value={subtype.id} sx={{ pl: 3 }}>
                          {subtype.name}
                        </Option>
                      ))}
                  </React.Fragment>
                ))}
              </Select>
              {accountSubtypeError && (
                <FormHelperText sx={{ color: 'danger.500' }}>{accountSubtypeError}</FormHelperText>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Description (Optional)</FormLabel>
              <Textarea
                placeholder="Brief description of this account"
                value={newAccountDescription}
                onChange={(e) => setNewAccountDescription(e.target.value)}
                minRows={2}
              />
            </FormControl>

            <FormControl>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <FormLabel sx={{ m: 0 }}>Active</FormLabel>
                <Switch
                  checked={newAccountIsActive}
                  onChange={(e) => setNewAccountIsActive(e.target.checked)}
                />
              </Stack>
            </FormControl>

            <Divider sx={{ my: 1 }} />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="neutral"
                onClick={() => { setAddAccountModalOpen(false); resetAccountValidation(); }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                color="primary"
                onClick={handleAddAccount}
                loading={saving}
                disabled={!newAccountName.trim() || !newAccountSubtype || !!accountNameError || !!accountCodeError || !!accountSubtypeError}
              >
                Create Account
              </Button>
            </Stack>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Add Subtype Modal */}
      <Modal open={addSubtypeModalOpen} onClose={() => { setAddSubtypeModalOpen(false); resetSubtypeValidation(); }}>
        <ModalDialog sx={{ maxWidth: 450, width: '90%' }}>
          <ModalClose />
          <Typography level="h4" sx={{ mb: 2 }}>
            Add New Subtype
          </Typography>

          <Stack spacing={2}>
            <FormControl required error={!!subtypeNameError}>
              <FormLabel>Subtype Name</FormLabel>
              <Input
                placeholder="e.g., Short-term Investments"
                value={newSubtypeName}
                onChange={(e) => {
                  setNewSubtypeName(e.target.value);
                  if (subtypeNameError) validateSubtypeName(e.target.value);
                }}
                onBlur={() => newSubtypeName && validateSubtypeName(newSubtypeName)}
                color={subtypeNameError ? 'danger' : undefined}
              />
              {subtypeNameError && (
                <FormHelperText sx={{ color: 'danger.500' }}>{subtypeNameError}</FormHelperText>
              )}
            </FormControl>

            <FormControl required error={!!subtypeTypeError}>
              <FormLabel>Account Type</FormLabel>
              <Select
                placeholder="Select type"
                value={newSubtypeType}
                onChange={(_, value) => {
                  setNewSubtypeType(value || '');
                  if (subtypeTypeError) validateSubtypeType(value || '');
                }}
                color={subtypeTypeError ? 'danger' : undefined}
              >
                {accountTypes.map(type => (
                  <Option key={type.code} value={type.code}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getTypeIcon(type.code)}
                      <span>{type.name}</span>
                    </Stack>
                  </Option>
                ))}
              </Select>
              {subtypeTypeError && (
                <FormHelperText sx={{ color: 'danger.500' }}>{subtypeTypeError}</FormHelperText>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Description (Optional)</FormLabel>
              <Textarea
                placeholder="Brief description of this subtype"
                value={newSubtypeDescription}
                onChange={(e) => setNewSubtypeDescription(e.target.value)}
                minRows={2}
              />
            </FormControl>

            <Divider sx={{ my: 1 }} />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="neutral"
                onClick={() => { setAddSubtypeModalOpen(false); resetSubtypeValidation(); }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                color="primary"
                onClick={handleAddSubtype}
                loading={saving}
                disabled={!newSubtypeName.trim() || !newSubtypeType || !!subtypeNameError || !!subtypeTypeError}
              >
                Create Subtype
              </Button>
            </Stack>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Edit Account Modal */}
      <Modal open={editAccountModalOpen} onClose={() => { setEditAccountModalOpen(false); resetEditAccountValidation(); }}>
        <ModalDialog sx={{ maxWidth: 500, width: '90%' }}>
          <ModalClose />
          <Typography level="h4" sx={{ mb: 2 }}>
            Edit Account
          </Typography>

          {editingAccount && (
            <Stack spacing={2}>
              <FormControl>
                <FormLabel>Account Code</FormLabel>
                <Input value={editingAccount.code} disabled />
              </FormControl>

              <FormControl required error={!!editAccountNameError}>
                <FormLabel>Account Name</FormLabel>
                <Input
                  value={editingAccount.name}
                  onChange={(e) => {
                    setEditingAccount({ ...editingAccount, name: e.target.value });
                    if (editAccountNameError) validateAccountName(e.target.value, true);
                  }}
                  onBlur={() => editingAccount.name && validateAccountName(editingAccount.name, true)}
                  color={editAccountNameError ? 'danger' : undefined}
                />
                {editAccountNameError && (
                  <FormHelperText sx={{ color: 'danger.500' }}>{editAccountNameError}</FormHelperText>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Type / Subtype</FormLabel>
                <Input value={`${editingAccount.typeName} / ${editingAccount.subtypeName}`} disabled />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={editingAccount.description || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, description: e.target.value })}
                  minRows={2}
                />
              </FormControl>

              <FormControl>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <FormLabel sx={{ m: 0 }}>Active</FormLabel>
                  <Switch
                    checked={editingAccount.isActive}
                    onChange={(e) => setEditingAccount({ ...editingAccount, isActive: e.target.checked })}
                    disabled={editingAccount.isSystem}
                  />
                </Stack>
              </FormControl>

              <Divider sx={{ my: 1 }} />

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  color="neutral"
                  onClick={() => { setEditAccountModalOpen(false); resetEditAccountValidation(); }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="solid"
                  color="primary"
                  onClick={handleEditAccount}
                  loading={saving}
                  disabled={!editingAccount.name.trim() || !!editAccountNameError}
                >
                  Save Changes
                </Button>
              </Stack>
            </Stack>
          )}
        </ModalDialog>
      </Modal>

      {/* Edit Subtype Modal */}
      <Modal open={editSubtypeModalOpen} onClose={() => { setEditSubtypeModalOpen(false); resetEditSubtypeValidation(); }}>
        <ModalDialog sx={{ maxWidth: 450, width: '90%' }}>
          <ModalClose />
          <Typography level="h4" sx={{ mb: 2 }}>
            Edit Subtype
          </Typography>

          {editingSubtype && (
            <Stack spacing={2}>
              <FormControl>
                <FormLabel>Subtype Code</FormLabel>
                <Input value={editingSubtype.code} disabled />
              </FormControl>

              <FormControl required error={!!editSubtypeNameError}>
                <FormLabel>Subtype Name</FormLabel>
                <Input
                  value={editingSubtype.name}
                  onChange={(e) => {
                    setEditingSubtype({ ...editingSubtype, name: e.target.value });
                    if (editSubtypeNameError) validateSubtypeName(e.target.value, true);
                  }}
                  onBlur={() => editingSubtype.name && validateSubtypeName(editingSubtype.name, true)}
                  color={editSubtypeNameError ? 'danger' : undefined}
                />
                {editSubtypeNameError && (
                  <FormHelperText sx={{ color: 'danger.500' }}>{editSubtypeNameError}</FormHelperText>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Account Type</FormLabel>
                <Input value={editingSubtype.typeName} disabled />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={editingSubtype.description || ''}
                  onChange={(e) => setEditingSubtype({ ...editingSubtype, description: e.target.value })}
                  minRows={2}
                />
              </FormControl>

              <Divider sx={{ my: 1 }} />

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  color="neutral"
                  onClick={() => { setEditSubtypeModalOpen(false); resetEditSubtypeValidation(); }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="solid"
                  color="primary"
                  onClick={handleEditSubtype}
                  loading={saving}
                  disabled={!editingSubtype.name.trim() || !!editSubtypeNameError}
                >
                  Save Changes
                </Button>
              </Stack>
            </Stack>
          )}
        </ModalDialog>
      </Modal>

      {/* Delete Account Confirmation Dialog */}
      <ConfirmDialog
        open={deleteAccountConfirmOpen}
        onClose={() => {
          setDeleteAccountConfirmOpen(false);
          setPendingDeleteAccount(null);
        }}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description={`Are you sure you want to delete "${pendingDeleteAccount?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />

      {/* Delete Subtype Confirmation Dialog */}
      <ConfirmDialog
        open={deleteSubtypeConfirmOpen}
        onClose={() => {
          setDeleteSubtypeConfirmOpen(false);
          setPendingDeleteSubtype(null);
        }}
        onConfirm={handleDeleteSubtype}
        title="Delete Subtype"
        description={`Are you sure you want to delete "${pendingDeleteSubtype?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </Container>
  );
}
