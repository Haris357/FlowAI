'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Container,
  Button,
  Table,
  IconButton,
  Chip,
  Modal,
  ModalDialog,
  ModalClose,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Textarea,
  Select,
  Option,
  Grid,
  Autocomplete,
  Divider,
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
  ListItemDecorator,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Skeleton,
  Sheet,
  AccordionGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/joy';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getBankTransactions,
  createBankTransaction,
  deleteBankTransaction,
  getBankStats,
} from '@/services/bankAccounts';
import { getAccounts } from '@/services/accounts';
import { LoadingSpinner, PageBreadcrumbs, ConfirmDialog, FormTableSkeleton } from '@/components/common';
import { BankAccount, BankAccountType, BankTransaction, BankTransactionType, Account } from '@/types';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  RefreshCw,
  CreditCard,
  Wallet,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';

const ACCOUNT_TYPES: { value: BankAccountType; label: string }[] = [
  { value: 'checking', label: 'Checking Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];

const TXN_TYPES: { value: BankTransactionType; label: string }[] = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'fee', label: 'Bank Fee' },
  { value: 'interest', label: 'Interest' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];

export default function BankAccountsPage() {
  const { user, loading: authLoading } = useAuth();
  const { company } = useCompany();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [chartAccounts, setChartAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);
  const [accountFormErrors, setAccountFormErrors] = useState<Record<string, string>>({});
  const [txnFormErrors, setTxnFormErrors] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);

  const [accountFormData, setAccountFormData] = useState({
    name: '',
    accountType: 'checking' as BankAccountType,
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    currency: 'USD',
    openingBalance: 0,
    linkedAccountId: '',
    linkedAccountCode: '',
    linkedAccountName: '',
    openingBalanceAccountId: '',
    openingBalanceAccountCode: '',
    openingBalanceAccountName: '',
    isDefault: false,
    notes: '',
  });

  const [txnFormData, setTxnFormData] = useState({
    bankAccountId: '',
    bankAccountName: '',
    linkedAccountId: '',
    linkedAccountCode: '',
    linkedAccountName: '',
    type: 'deposit' as BankTransactionType,
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: 0,
    description: '',
    payee: '',
    checkNumber: '',
    reference: '',
    category: '',
    categoryAccountId: '',
    categoryAccountCode: '',
    categoryAccountName: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Separate state for different account categories
  const [equityAccounts, setEquityAccounts] = useState<Account[]>([]);
  const [categoryAccounts, setCategoryAccounts] = useState<Account[]>([]);

  const loadData = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const [accountsData, txnsData, chartData, statsData] = await Promise.all([
        getBankAccounts(company.id),
        getBankTransactions(company.id),
        getAccounts(company.id),
        getBankStats(company.id),
      ]);
      setBankAccounts(accountsData);
      setTransactions(txnsData);
      // Asset accounts for linking bank accounts
      setChartAccounts(chartData.filter(a => a.typeCode === 'asset'));
      // Equity accounts for opening balance
      setEquityAccounts(chartData.filter(a => a.typeCode === 'equity'));
      // Expense and Income accounts for transaction categorization
      setCategoryAccounts(chartData.filter(a => ['expense', 'income', 'asset', 'liability'].includes(a.typeCode)));
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (company?.id) {
      loadData();
    }
  }, [company?.id]);

  const handleAccountFieldChange = (field: string, value: any) => {
    setAccountFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTxnFieldChange = (field: string, value: any) => {
    setTxnFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLinkedAccountChange = (account: Account | null) => {
    if (account) {
      setAccountFormData((prev) => ({
        ...prev,
        linkedAccountId: account.id,
        linkedAccountCode: account.code,
        linkedAccountName: account.name,
      }));
    } else {
      setAccountFormData((prev) => ({
        ...prev,
        linkedAccountId: '',
        linkedAccountCode: '',
        linkedAccountName: '',
      }));
    }
  };

  const handleOpeningBalanceAccountChange = (account: Account | null) => {
    if (account) {
      setAccountFormData((prev) => ({
        ...prev,
        openingBalanceAccountId: account.id,
        openingBalanceAccountCode: account.code,
        openingBalanceAccountName: account.name,
      }));
    } else {
      setAccountFormData((prev) => ({
        ...prev,
        openingBalanceAccountId: '',
        openingBalanceAccountCode: '',
        openingBalanceAccountName: '',
      }));
    }
  };

  const handleBankAccountSelect = (account: BankAccount | null) => {
    if (account) {
      setTxnFormData((prev) => ({
        ...prev,
        bankAccountId: account.id,
        bankAccountName: account.name,
        linkedAccountId: account.linkedAccountId,
        linkedAccountCode: account.linkedAccountCode || '',
        linkedAccountName: account.linkedAccountName,
      }));
    } else {
      setTxnFormData((prev) => ({
        ...prev,
        bankAccountId: '',
        bankAccountName: '',
        linkedAccountId: '',
        linkedAccountCode: '',
        linkedAccountName: '',
      }));
    }
  };

  const handleCategoryAccountChange = (account: Account | null) => {
    if (account) {
      setTxnFormData((prev) => ({
        ...prev,
        categoryAccountId: account.id,
        categoryAccountCode: account.code,
        categoryAccountName: account.name,
      }));
    } else {
      setTxnFormData((prev) => ({
        ...prev,
        categoryAccountId: '',
        categoryAccountCode: '',
        categoryAccountName: '',
      }));
    }
  };

  const resetAccountForm = () => {
    setAccountFormData({
      name: '',
      accountType: 'checking',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      currency: company?.currency || 'USD',
      openingBalance: 0,
      linkedAccountId: '',
      linkedAccountCode: '',
      linkedAccountName: '',
      openingBalanceAccountId: '',
      openingBalanceAccountCode: '',
      openingBalanceAccountName: '',
      isDefault: false,
      notes: '',
    });
    setEditingAccount(null);
  };

  const resetTxnForm = () => {
    const selectedAccount = selectedAccountId !== 'all' ? bankAccounts.find(a => a.id === selectedAccountId) : null;
    setTxnFormData({
      bankAccountId: selectedAccount?.id || '',
      bankAccountName: selectedAccount?.name || '',
      linkedAccountId: selectedAccount?.linkedAccountId || '',
      linkedAccountCode: selectedAccount?.linkedAccountCode || '',
      linkedAccountName: selectedAccount?.linkedAccountName || '',
      type: 'deposit',
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: 0,
      description: '',
      payee: '',
      checkNumber: '',
      reference: '',
      category: '',
      categoryAccountId: '',
      categoryAccountCode: '',
      categoryAccountName: '',
    });
  };

  const validateAccountForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!accountFormData.name.trim()) {
      errors.name = 'Account name is required';
    }

    if (!accountFormData.linkedAccountId) {
      errors.linkedAccountId = 'Please select a linked account from Chart of Accounts';
    }

    if (!editingAccount && accountFormData.openingBalance > 0 && !accountFormData.openingBalanceAccountId) {
      errors.openingBalanceAccountId = 'Opening balance account is required when opening balance > 0';
    }

    setAccountFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAccountSubmit = async () => {
    if (!company?.id || !user) return;

    if (!validateAccountForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingAccount) {
        await updateBankAccount(company.id, editingAccount.id, {
          name: accountFormData.name,
          accountType: accountFormData.accountType,
          bankName: accountFormData.bankName,
          accountNumber: accountFormData.accountNumber,
          routingNumber: accountFormData.routingNumber,
          linkedAccountId: accountFormData.linkedAccountId,
          linkedAccountCode: accountFormData.linkedAccountCode,
          linkedAccountName: accountFormData.linkedAccountName,
          isDefault: accountFormData.isDefault,
          notes: accountFormData.notes,
        });
        toast.success('Bank account updated successfully');
      } else {
        await createBankAccount(company.id, {
          name: accountFormData.name,
          accountType: accountFormData.accountType,
          bankName: accountFormData.bankName,
          accountNumber: accountFormData.accountNumber,
          routingNumber: accountFormData.routingNumber,
          currency: accountFormData.currency,
          openingBalance: accountFormData.openingBalance,
          linkedAccountId: accountFormData.linkedAccountId,
          linkedAccountCode: accountFormData.linkedAccountCode,
          linkedAccountName: accountFormData.linkedAccountName,
          openingBalanceAccountId: accountFormData.openingBalanceAccountId,
          openingBalanceAccountCode: accountFormData.openingBalanceAccountCode,
          openingBalanceAccountName: accountFormData.openingBalanceAccountName,
          isDefault: accountFormData.isDefault,
          notes: accountFormData.notes,
          createdBy: user.uid,
        });
        toast.success('Bank account created successfully');
      }
      setAccountModalOpen(false);
      resetAccountForm();
      setAccountFormErrors({});
      loadData();
    } catch (error: any) {
      console.error('Error saving bank account:', error);
      toast.error(error.message || 'Failed to save bank account');
    } finally {
      setSaving(false);
    }
  };

  const validateTxnForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!txnFormData.bankAccountId) {
      errors.bankAccountId = 'Please select a bank account';
    }

    if (!txnFormData.amount || txnFormData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!txnFormData.description.trim()) {
      errors.description = 'Description is required';
    }

    setTxnFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTxnSubmit = async () => {
    if (!company?.id || !user) return;

    if (!validateTxnForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      // Adjust amount sign based on transaction type
      let amount = Math.abs(txnFormData.amount);
      if (['withdrawal', 'fee', 'check'].includes(txnFormData.type)) {
        amount = -amount;
      }

      await createBankTransaction(company.id, {
        bankAccountId: txnFormData.bankAccountId,
        bankAccountName: txnFormData.bankAccountName,
        linkedAccountId: txnFormData.linkedAccountId,
        linkedAccountCode: txnFormData.linkedAccountCode,
        linkedAccountName: txnFormData.linkedAccountName,
        type: txnFormData.type,
        date: new Date(txnFormData.date),
        amount,
        description: txnFormData.description,
        payee: txnFormData.payee,
        checkNumber: txnFormData.checkNumber,
        reference: txnFormData.reference,
        category: txnFormData.category,
        categoryAccountId: txnFormData.categoryAccountId,
        categoryAccountCode: txnFormData.categoryAccountCode,
        categoryAccountName: txnFormData.categoryAccountName,
        createdBy: user.uid,
      });
      toast.success('Transaction created successfully');
      setTxnModalOpen(false);
      resetTxnForm();
      setTxnFormErrors({});
      loadData();
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      toast.error(error.message || 'Failed to create transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setAccountFormData({
      name: account.name,
      accountType: account.accountType,
      bankName: account.bankName || '',
      accountNumber: account.accountNumber || '',
      routingNumber: account.routingNumber || '',
      currency: account.currency,
      openingBalance: account.openingBalance,
      linkedAccountId: account.linkedAccountId,
      linkedAccountCode: account.linkedAccountCode || '',
      linkedAccountName: account.linkedAccountName,
      openingBalanceAccountId: '',
      openingBalanceAccountCode: '',
      openingBalanceAccountName: '',
      isDefault: account.isDefault,
      notes: account.notes || '',
    });
    setAccountModalOpen(true);
  };

  const handleOpenDeleteDialog = (account: BankAccount) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAccount = async () => {
    if (!company?.id || !accountToDelete) return;
    try {
      await deleteBankAccount(company.id, accountToDelete.id);
      toast.success('Bank account deleted successfully');
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
      loadData();
    } catch (error: any) {
      console.error('Error deleting bank account:', error);
      toast.error(error.message || 'Failed to delete bank account');
    }
  };

  const handleDeleteTxn = async (txn: BankTransaction) => {
    if (!company?.id || !window.confirm(`Delete transaction: ${txn.description}?`)) return;
    try {
      await deleteBankTransaction(company.id, txn.id);
      toast.success('Transaction deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast.error(error.message || 'Failed to delete transaction');
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    const matchesAccount = selectedAccountId === 'all' || txn.bankAccountId === selectedAccountId;
    const matchesSearch = txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.payee?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAccount && matchesSearch;
  });

  const getAccountIcon = (type: BankAccountType) => {
    switch (type) {
      case 'checking':
      case 'savings':
        return <Landmark size={20} />;
      case 'credit_card':
        return <CreditCard size={20} />;
      case 'cash':
        return <Wallet size={20} />;
      default:
        return <Building2 size={20} />;
    }
  };

  if (authLoading || !user) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Stack spacing={3}>
        {/* Breadcrumbs */}
        <PageBreadcrumbs
          items={[
            { label: 'Bank & Cash', icon: <Landmark size={14} /> },
          ]}
        />

        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
          <Box>
            <Typography level="h2" sx={{ mb: 0.5 }}>Bank & Cash</Typography>
            <Typography level="body-md" sx={{ color: 'text.secondary' }}>
              Manage bank accounts and track transactions.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="primary"
              startDecorator={<Plus size={18} />}
              onClick={() => { resetAccountForm(); setAccountModalOpen(true); }}
            >
              Add Account
            </Button>
            <Button
              variant="solid"
              color="primary"
              startDecorator={<Plus size={18} />}
              onClick={() => { resetTxnForm(); setTxnModalOpen(true); }}
              disabled={bankAccounts.length === 0}
            >
              New Transaction
            </Button>
          </Stack>
        </Stack>

        {/* Stats Cards - Professional Accordion */}
        <AccordionGroup>
          <Accordion defaultExpanded={false}>
            <AccordionSummary>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', flexWrap: 'wrap' }}>
                <Landmark size={18} />
                <Typography level="body-sm" fontWeight={500}>
                  Total Balance: {loading ? '...' : `${company?.currency} ${(stats?.totalBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500}>
                  {loading ? '...' : stats?.totalAccounts || 0} Accounts
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: 'warning.600' }}>
                  {loading ? '...' : stats?.unreconciledTransactions || 0} Unreconciled
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)', borderColor: 'primary.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Box sx={{ p: 1, bgcolor: 'primary.100', borderRadius: 'sm' }}>
                          <Landmark size={16} style={{ color: 'var(--joy-palette-primary-700)' }} />
                        </Box>
                        <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Total Accounts
                        </Typography>
                      </Stack>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                        {loading ? <Skeleton width={60} /> : stats?.totalAccounts || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(46, 125, 50, 0.02) 100%)', borderColor: 'success.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Box sx={{ p: 1, bgcolor: 'success.100', borderRadius: 'sm' }}>
                          <CreditCard size={16} style={{ color: 'var(--joy-palette-success-700)' }} />
                        </Box>
                        <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Active Accounts
                        </Typography>
                      </Stack>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'success.700' }}>
                        {loading ? <Skeleton width={60} /> : stats?.activeAccounts || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Box sx={{ p: 1, bgcolor: 'rgba(156, 39, 176, 0.1)', borderRadius: 'sm' }}>
                          <Wallet size={16} style={{ color: 'rgb(156, 39, 176)' }} />
                        </Box>
                        <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Total Balance
                        </Typography>
                      </Stack>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={100} /> : `${company?.currency} ${(stats?.totalBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(237, 108, 2, 0.08) 0%, rgba(237, 108, 2, 0.02) 100%)', borderColor: 'warning.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Box sx={{ p: 1, bgcolor: 'warning.100', borderRadius: 'sm' }}>
                          <RefreshCw size={16} style={{ color: 'var(--joy-palette-warning-700)' }} />
                        </Box>
                        <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Unreconciled
                        </Typography>
                      </Stack>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'warning.700' }}>
                        {loading ? <Skeleton width={60} /> : stats?.unreconciledTransactions || 0}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        Transactions
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
                <Landmark size={16} />
                <span>Accounts ({bankAccounts.length})</span>
              </Stack>
            </Tab>
            <Tab>
              <Stack direction="row" spacing={1} alignItems="center">
                <ArrowUpRight size={16} />
                <span>Transactions ({transactions.length})</span>
              </Stack>
            </Tab>
          </TabList>

          {/* Bank Accounts Tab */}
          <TabPanel value={0}>
            <Card variant="outlined">
              {loading ? (
                <FormTableSkeleton columns={6} rows={6} />
              ) : bankAccounts.length === 0 ? (
                <CardContent>
                  <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
                    <Landmark size={48} strokeWidth={1} />
                    <Typography level="body-lg" sx={{ color: 'text.secondary' }}>
                      No bank accounts yet. Add your first account!
                    </Typography>
                  </Stack>
                </CardContent>
              ) : (
                <Sheet sx={{ overflowX: 'auto' }}>
                  <Table>
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th>Type</th>
                        <th>Linked COA</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th style={{ width: 100 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bankAccounts.map((account) => (
                        <tr key={account.id}>
                          <td>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {getAccountIcon(account.accountType)}
                              <Box>
                                <Typography level="body-sm" fontWeight={500}>{account.name}</Typography>
                                {account.bankName && (
                                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                    {account.bankName} {account.accountNumber ? `• ****${account.accountNumber.slice(-4)}` : ''}
                                  </Typography>
                                )}
                                {account.isDefault && (
                                  <Chip size="sm" variant="soft" color="primary" sx={{ mt: 0.5 }}>Default</Chip>
                                )}
                              </Box>
                            </Stack>
                          </td>
                          <td>
                            <Chip size="sm" variant="outlined" color="neutral">
                              {ACCOUNT_TYPES.find(t => t.value === account.accountType)?.label}
                            </Chip>
                          </td>
                          <td>
                            <Typography level="body-sm" fontWeight={500}>
                              {account.linkedAccountCode || ''} {account.linkedAccountName}
                            </Typography>
                          </td>
                          <td>
                            <Typography level="body-sm" fontWeight={600} color={account.currentBalance >= 0 ? 'success' : 'danger'}>
                              {company?.currency} {account.currentBalance.toFixed(2)}
                            </Typography>
                          </td>
                          <td>
                            <Chip size="sm" variant="soft" color={account.isActive ? 'success' : 'neutral'}>
                              {account.isActive ? 'Active' : 'Inactive'}
                            </Chip>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Dropdown>
                              <MenuButton
                                slots={{ root: IconButton }}
                                slotProps={{ root: { variant: 'plain', size: 'sm', color: 'neutral' } }}
                              >
                                <MoreVertical size={18} />
                              </MenuButton>
                              <Menu placement="bottom-end" sx={{ zIndex: 1300, minWidth: 160 }}>
                                <MenuItem onClick={() => handleEditAccount(account)}>
                                  <ListItemDecorator><Edit2 size={16} /></ListItemDecorator>
                                  Edit
                                </MenuItem>
                                <Divider />
                                <MenuItem color="danger" onClick={() => handleOpenDeleteDialog(account)}>
                                  <ListItemDecorator sx={{ color: 'inherit' }}><Trash2 size={16} /></ListItemDecorator>
                                  Delete
                                </MenuItem>
                              </Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Sheet>
              )}
            </Card>
          </TabPanel>

          {/* Transactions Tab */}
          <TabPanel value={1}>
            <Card variant="outlined">
              <CardContent sx={{ pb: 0 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                  <Input
                    placeholder="Search transactions..."
                    startDecorator={<Search size={18} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }}
                  />
                  <Select
                    value={selectedAccountId}
                    onChange={(_, value) => setSelectedAccountId(value as string)}
                    sx={{ minWidth: 200 }}
                  >
                    <Option value="all">All Accounts</Option>
                    {bankAccounts.map((account) => (
                      <Option key={account.id} value={account.id}>{account.name}</Option>
                    ))}
                  </Select>
                  <IconButton variant="outlined" onClick={loadData}>
                    <RefreshCw size={18} />
                  </IconButton>
                </Stack>
              </CardContent>

              {loading ? (
                <FormTableSkeleton columns={7} rows={6} />
              ) : filteredTransactions.length === 0 ? (
                <CardContent>
                  <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
                    <ArrowUpRight size={48} strokeWidth={1} />
                    <Typography level="body-lg" sx={{ color: 'text.secondary' }}>
                      No transactions yet.
                    </Typography>
                  </Stack>
                </CardContent>
              ) : (
                <Sheet sx={{ overflowX: 'auto' }}>
                  <Table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Account</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th style={{ width: 80 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((txn) => (
                        <tr key={txn.id}>
                          <td>{format(txn.date.toDate ? txn.date.toDate() : new Date(txn.date as unknown as string), 'MMM dd, yyyy')}</td>
                          <td>
                            <Typography level="body-sm" fontWeight={500}>{txn.bankAccountName}</Typography>
                            {txn.payee && (
                              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{txn.payee}</Typography>
                            )}
                          </td>
                          <td>
                            <Chip size="sm" variant="soft" color={txn.amount >= 0 ? 'success' : 'danger'}>
                              {TXN_TYPES.find(t => t.value === txn.type)?.label || txn.type}
                            </Chip>
                          </td>
                          <td>{txn.description}</td>
                          <td>
                            {txn.categoryAccountName ? (
                              <Typography level="body-sm">
                                {txn.categoryAccountCode} {txn.categoryAccountName}
                              </Typography>
                            ) : (
                              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Uncategorized</Typography>
                            )}
                          </td>
                          <td>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              {txn.amount >= 0 ? <ArrowDownLeft size={14} color="green" /> : <ArrowUpRight size={14} color="red" />}
                              <Typography level="body-sm" fontWeight={600} color={txn.amount >= 0 ? 'success' : 'danger'}>
                                {company?.currency} {Math.abs(txn.amount).toFixed(2)}
                              </Typography>
                            </Stack>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Dropdown>
                              <MenuButton
                                slots={{ root: IconButton }}
                                slotProps={{ root: { variant: 'plain', size: 'sm', color: 'neutral' } }}
                              >
                                <MoreVertical size={18} />
                              </MenuButton>
                              <Menu placement="bottom-end" sx={{ zIndex: 1300, minWidth: 160 }}>
                                <MenuItem color="danger" onClick={() => handleDeleteTxn(txn)}>
                                  <ListItemDecorator sx={{ color: 'inherit' }}><Trash2 size={16} /></ListItemDecorator>
                                  Delete
                                </MenuItem>
                              </Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Sheet>
              )}
            </Card>
          </TabPanel>
        </Tabs>
      </Stack>

      {/* Bank Account Modal - Professional Size */}
      <Modal open={accountModalOpen} onClose={() => !saving && setAccountModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          layout="center"
          sx={{ width: '100%', maxWidth: { xs: '95vw', sm: 700 }, maxHeight: '90vh', overflow: 'hidden', p: 0 }}
        >
          <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>
            {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
          </DialogTitle>
          <ModalClose disabled={saving} />
          <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
            <Stack spacing={2}>
              <FormControl required error={!!accountFormErrors.name}>
                <FormLabel>Account Name</FormLabel>
                <Input
                  value={accountFormData.name}
                  onChange={(e) => handleAccountFieldChange('name', e.target.value)}
                  placeholder="e.g., Business Checking"
                />
                {accountFormErrors.name && (
                  <FormHelperText>{accountFormErrors.name}</FormHelperText>
                )}
              </FormControl>

              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <FormControl required>
                    <FormLabel>Account Type</FormLabel>
                    <Select
                      value={accountFormData.accountType}
                      onChange={(_, value) => handleAccountFieldChange('accountType', value)}
                    >
                      {ACCOUNT_TYPES.map((type) => (
                        <Option key={type.value} value={type.value}>{type.label}</Option>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12} md={6}>
                  <FormControl required error={!!accountFormErrors.linkedAccountId}>
                    <FormLabel>Link to Chart Account</FormLabel>
                    <Autocomplete
                      placeholder="Select account from Chart of Accounts"
                      options={chartAccounts}
                      getOptionLabel={(option) => `${option.code} - ${option.name}`}
                      value={chartAccounts.find((a) => a.id === accountFormData.linkedAccountId) || null}
                      onChange={(_, value) => handleLinkedAccountChange(value)}
                    />
                    {accountFormErrors.linkedAccountId && (
                      <FormHelperText>{accountFormErrors.linkedAccountId}</FormHelperText>
                    )}
                    {!accountFormErrors.linkedAccountId && (
                      <FormHelperText>This links your bank account to the general ledger</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>

              <FormControl>
                <FormLabel>Bank Name</FormLabel>
                <Input
                  value={accountFormData.bankName}
                  onChange={(e) => handleAccountFieldChange('bankName', e.target.value)}
                  placeholder="e.g., Chase Bank"
                />
              </FormControl>

              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <FormControl>
                    <FormLabel>Account Number</FormLabel>
                    <Input
                      value={accountFormData.accountNumber}
                      onChange={(e) => handleAccountFieldChange('accountNumber', e.target.value)}
                      placeholder="Account number"
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} md={6}>
                  <FormControl>
                    <FormLabel>Routing Number</FormLabel>
                    <Input
                      value={accountFormData.routingNumber}
                      onChange={(e) => handleAccountFieldChange('routingNumber', e.target.value)}
                      placeholder="Routing number"
                    />
                  </FormControl>
                </Grid>
              </Grid>

              {!editingAccount && (
                <>
                  <Grid container spacing={2}>
                    <Grid xs={12} md={6}>
                      <FormControl>
                        <FormLabel>Opening Balance</FormLabel>
                        <Input
                          type="number"
                          value={accountFormData.openingBalance}
                          onChange={(e) => handleAccountFieldChange('openingBalance', Number(e.target.value))}
                          startDecorator={company?.currency}
                        />
                      </FormControl>
                    </Grid>
                    <Grid xs={12} md={6}>
                      <FormControl>
                        <FormLabel>Currency</FormLabel>
                        <Input value={accountFormData.currency} disabled />
                      </FormControl>
                    </Grid>
                  </Grid>
                  {accountFormData.openingBalance !== 0 && (
                    <FormControl>
                      <FormLabel>Opening Balance Equity Account</FormLabel>
                      <Autocomplete
                        placeholder="Select equity account for journal entry"
                        options={equityAccounts}
                        getOptionLabel={(option) => `${option.code} - ${option.name}`}
                        value={equityAccounts.find((a) => a.id === accountFormData.openingBalanceAccountId) || null}
                        onChange={(_, value) => handleOpeningBalanceAccountChange(value)}
                        groupBy={(option) => option.typeName}
                      />
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        A journal entry will be created to record the opening balance
                      </Typography>
                    </FormControl>
                  )}
                </>
              )}

              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  minRows={2}
                  value={accountFormData.notes}
                  onChange={(e) => handleAccountFieldChange('notes', e.target.value)}
                  placeholder="Additional notes..."
                />
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button variant="outlined" color="neutral" onClick={() => setAccountModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="solid"
              color="primary"
              onClick={handleAccountSubmit}
              loading={saving}
              disabled={!accountFormData.name || !accountFormData.linkedAccountId}
            >
              {editingAccount ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Transaction Modal - Professional Size */}
      <Modal open={txnModalOpen} onClose={() => !saving && setTxnModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          layout="center"
          sx={{ width: '100%', maxWidth: { xs: '95vw', sm: 700 }, maxHeight: '90vh', overflow: 'hidden', p: 0 }}
        >
          <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>New Transaction</DialogTitle>
          <ModalClose disabled={saving} />
          <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
            <Stack spacing={2}>
              <FormControl required>
                <FormLabel>Bank Account</FormLabel>
                <Autocomplete
                  placeholder="Select account"
                  options={bankAccounts}
                  getOptionLabel={(option) => option.name}
                  value={bankAccounts.find((a) => a.id === txnFormData.bankAccountId) || null}
                  onChange={(_, value) => handleBankAccountSelect(value)}
                />
              </FormControl>

              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <FormControl required>
                    <FormLabel>Type</FormLabel>
                    <Select
                      value={txnFormData.type}
                      onChange={(_, value) => handleTxnFieldChange('type', value)}
                    >
                      {TXN_TYPES.map((type) => (
                        <Option key={type.value} value={type.value}>{type.label}</Option>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12} md={6}>
                  <FormControl required>
                    <FormLabel>Date</FormLabel>
                    <Input
                      type="date"
                      value={txnFormData.date}
                      onChange={(e) => handleTxnFieldChange('date', e.target.value)}
                    />
                  </FormControl>
                </Grid>
              </Grid>

              <FormControl required>
                <FormLabel>Amount</FormLabel>
                <Input
                  type="number"
                  value={txnFormData.amount}
                  onChange={(e) => handleTxnFieldChange('amount', Number(e.target.value))}
                  startDecorator={company?.currency}
                />
              </FormControl>

              <FormControl required>
                <FormLabel>Description</FormLabel>
                <Input
                  value={txnFormData.description}
                  onChange={(e) => handleTxnFieldChange('description', e.target.value)}
                  placeholder="Transaction description"
                />
              </FormControl>

              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <FormControl>
                    <FormLabel>Payee</FormLabel>
                    <Input
                      value={txnFormData.payee}
                      onChange={(e) => handleTxnFieldChange('payee', e.target.value)}
                      placeholder="Payee name"
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} md={6}>
                  <FormControl>
                    <FormLabel>Reference</FormLabel>
                    <Input
                      value={txnFormData.reference}
                      onChange={(e) => handleTxnFieldChange('reference', e.target.value)}
                      placeholder="Reference #"
                    />
                  </FormControl>
                </Grid>
              </Grid>

              {txnFormData.type === 'check' && (
                <FormControl>
                  <FormLabel>Check Number</FormLabel>
                  <Input
                    value={txnFormData.checkNumber}
                    onChange={(e) => handleTxnFieldChange('checkNumber', e.target.value)}
                    placeholder="Check #"
                  />
                </FormControl>
              )}

              <FormControl>
                <FormLabel>Category Account</FormLabel>
                <Autocomplete
                  placeholder="Select expense/income account"
                  options={categoryAccounts}
                  getOptionLabel={(option) => `${option.code} - ${option.name}`}
                  value={categoryAccounts.find((a) => a.id === txnFormData.categoryAccountId) || null}
                  onChange={(_, value) => handleCategoryAccountChange(value)}
                  groupBy={(option) => option.typeName}
                />
                <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                  {['withdrawal', 'fee', 'check'].includes(txnFormData.type)
                    ? 'Select an expense account for this payment'
                    : 'Select an income account for this deposit'}
                </Typography>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button variant="outlined" color="neutral" onClick={() => setTxnModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="solid"
              color="primary"
              onClick={handleTxnSubmit}
              loading={saving}
              disabled={!txnFormData.bankAccountId || !txnFormData.amount || !txnFormData.description}
            >
              Create
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Bank Account"
        description={`Are you sure you want to delete "${accountToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDeleteAccount}
        onClose={() => {
          setDeleteDialogOpen(false);
          setAccountToDelete(null);
        }}
      />
    </Container>
  );
}
