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
  IconButton,
  Skeleton,
  Button,
  Modal,
  ModalDialog,
  ModalClose,
  FormControl,
  FormLabel,
  FormHelperText,
  Autocomplete,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  AccordionGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
  ListItemDecorator,
  Divider,
} from '@mui/joy';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '@/services/transactions';
import { getCompanyAccounts } from '@/services/account-init';
import { Transaction, Account } from '@/types';
import { LoadingSpinner, EmptyState, ConfirmDialog, PageBreadcrumbs, FormTableSkeleton } from '@/components/common';
import { Search, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Plus, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { useFormatting } from '@/hooks';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';

interface FormErrors {
  type?: string;
  amount?: string;
  date?: string;
  description?: string;
  account?: string;
  [key: string]: string | undefined;
}

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const { company } = useCompany();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense' | 'transfer',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    category: '',
    accountId: '',
    paymentMethod: '',
    reference: '',
  });
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Get formatting functions from company preferences
  const { formatCurrency, formatDate } = useFormatting();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchData() {
      if (!company?.id) return;

      try {
        const [transactionsData, accountsData] = await Promise.all([
          getTransactions(company.id),
          getCompanyAccounts(company.id),
        ]);
        setTransactions(transactionsData);
        setAccounts(accountsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [company?.id]);

  // Filtered transactions with useMemo
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch =
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchTerm, filterType, filterCategory]);

  // Get unique categories for filter
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats).sort();
  }, [transactions]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterType, filterCategory]);

  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'income':
        return <ArrowUpRight size={16} />;
      case 'expense':
        return <ArrowDownLeft size={16} />;
      default:
        return <ArrowLeftRight size={16} />;
    }
  };

  const getTypeColor = (type: Transaction['type']): 'success' | 'danger' | 'primary' => {
    switch (type) {
      case 'income':
        return 'success';
      case 'expense':
        return 'danger';
      default:
        return 'primary';
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.type) {
      errors.type = 'Transaction type is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!formData.date) {
      errors.date = 'Date is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!selectedAccount) {
      errors.account = 'Please select an account';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      category: '',
      accountId: '',
      paymentMethod: '',
      reference: '',
    });
    setSelectedAccount(null);
    setFormErrors({});
    setEditingTransaction(null);
  };

  // Open modal for add
  const handleAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    const account = accounts.find(a => a.id === transaction.accountId);
    setSelectedAccount(account || null);
    setFormData({
      type: transaction.type,
      amount: String(transaction.amount),
      date: transaction.date instanceof Timestamp
        ? format(transaction.date.toDate(), 'yyyy-MM-dd')
        : format(new Date(transaction.date), 'yyyy-MM-dd'),
      description: transaction.description,
      category: transaction.category || '',
      accountId: transaction.accountId,
      paymentMethod: transaction.paymentMethod || '',
      reference: transaction.reference || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm() || !company?.id || !selectedAccount || !user?.uid) return;

    setSaving(true);
    try {
      const transactionData = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        date: Timestamp.fromDate(new Date(formData.date)),
        description: formData.description.trim(),
        category: formData.category.trim() || undefined,
        accountId: selectedAccount.id,
        accountName: selectedAccount.name,
        paymentMethod: formData.paymentMethod.trim() || undefined,
        reference: formData.reference.trim() || undefined,
        journalEntryId: editingTransaction?.journalEntryId || '',
      };

      if (editingTransaction) {
        await updateTransaction(company.id, editingTransaction.id, transactionData);
        toast.success('Transaction updated successfully');
      } else {
        // Find default revenue and expense accounts for journal entries
        let revenueAccount: Account | undefined;
        let expenseAccount: Account | undefined;

        if (formData.type === 'income') {
          // Find a revenue account (type code 'revenue')
          revenueAccount = accounts.find(a => a.typeCode === 'revenue' && a.isActive);
          if (!revenueAccount) {
            toast.error('No active revenue account found. Please create one in Chart of Accounts.');
            setSaving(false);
            return;
          }
        } else if (formData.type === 'expense') {
          // Find an expense account (type code 'expense')
          // Prefer one matching the category if specified
          if (formData.category) {
            expenseAccount = accounts.find(
              a => a.typeCode === 'expense' &&
                   a.isActive &&
                   a.name.toLowerCase().includes(formData.category.toLowerCase())
            );
          }
          // If no category match, use any active expense account
          if (!expenseAccount) {
            expenseAccount = accounts.find(a => a.typeCode === 'expense' && a.isActive);
          }
          if (!expenseAccount) {
            toast.error('No active expense account found. Please create one in Chart of Accounts.');
            setSaving(false);
            return;
          }
        }

        // Create accounting config
        const accountingConfig = {
          revenueAccountId: revenueAccount?.id,
          revenueAccountCode: revenueAccount?.code,
          revenueAccountName: revenueAccount?.name,
          expenseAccountId: expenseAccount?.id,
          expenseAccountCode: expenseAccount?.code,
          expenseAccountName: expenseAccount?.name,
          createdBy: user.uid,
        };

        await createTransaction(company.id, transactionData, accountingConfig);
        toast.success('Transaction created successfully');
      }

      // Refresh data
      const data = await getTransactions(company.id);
      setTransactions(data);
      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error(editingTransaction ? 'Failed to update transaction' : 'Failed to create transaction');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!company?.id || !transactionToDelete) return;

    setDeleting(true);
    try {
      await deleteTransaction(company.id, transactionToDelete.id);
      toast.success('Transaction deleted successfully');
      const data = await getTransactions(company.id);
      setTransactions(data);
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    } finally {
      setDeleting(false);
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
            { label: 'Transactions', icon: <ArrowLeftRight size={14} /> },
          ]}
        />

        {/* Header */}
        <Box>
          <Typography level="h2" sx={{ mb: 0.5 }}>
            Transactions
          </Typography>
          <Typography level="body-md" sx={{ color: 'text.secondary' }}>
            Manage your income and expense transactions.
          </Typography>
        </Box>

        {/* Stats Overview - Collapsible Accordion */}
        <AccordionGroup>
          <Accordion defaultExpanded={false}>
            <AccordionSummary>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', flexWrap: 'wrap' }}>
                <ArrowLeftRight size={18} />
                <Typography level="body-sm" fontWeight={500}>
                  Total Income: {loading ? '...' : formatCurrency(totalIncome)}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500}>
                  Total Expenses: {loading ? '...' : formatCurrency(totalExpenses)}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500}>
                  Net Balance: {loading ? '...' : formatCurrency(totalIncome - totalExpenses)}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid xs={12} sm={6} md={4}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(46, 125, 50, 0.02) 100%)',
                      borderColor: 'success.200',
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>
                            Total Income
                          </Typography>
                          <Typography level="h3" fontWeight="bold" sx={{ color: 'success.700' }}>
                            {loading ? <Skeleton width={120} /> : formatCurrency(totalIncome)}
                          </Typography>
                          <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            All income transactions
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 'md',
                            bgcolor: 'success.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <TrendingUp size={20} style={{ color: 'var(--joy-palette-success-600)' }} />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={12} sm={6} md={4}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.08) 0%, rgba(211, 47, 47, 0.02) 100%)',
                      borderColor: 'danger.200',
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>
                            Total Expenses
                          </Typography>
                          <Typography level="h3" fontWeight="bold" sx={{ color: 'danger.700' }}>
                            {loading ? <Skeleton width={120} /> : formatCurrency(totalExpenses)}
                          </Typography>
                          <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            All expense transactions
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 'md',
                            bgcolor: 'danger.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <TrendingDown size={20} style={{ color: 'var(--joy-palette-danger-600)' }} />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={12} sm={6} md={4}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)',
                      borderColor: 'primary.200',
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>
                            Net Balance
                          </Typography>
                          <Typography level="h3" fontWeight="bold" sx={{ color: (totalIncome - totalExpenses) >= 0 ? 'success.700' : 'danger.700' }}>
                            {loading ? <Skeleton width={120} /> : formatCurrency(totalIncome - totalExpenses)}
                          </Typography>
                          <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            Income minus expenses
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 'md',
                            bgcolor: 'primary.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ArrowLeftRight size={20} style={{ color: 'var(--joy-palette-primary-600)' }} />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </AccordionGroup>

        {/* Action Bar */}
        <Card variant="outlined" sx={{ p: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flex: 1 }}>
              <Input
                placeholder="Search transactions..."
                startDecorator={<Search size={18} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }}
              />
              <Select
                value={filterType}
                onChange={(_, value) => setFilterType(value || 'all')}
                sx={{ minWidth: 150 }}
              >
                <Option value="all">All Types</Option>
                <Option value="income">Income</Option>
                <Option value="expense">Expense</Option>
                <Option value="transfer">Transfer</Option>
              </Select>
              {uniqueCategories.length > 0 && (
                <Select
                  value={filterCategory}
                  onChange={(_, value) => setFilterCategory(value || 'all')}
                  sx={{ minWidth: 180 }}
                >
                  <Option value="all">All Categories</Option>
                  {uniqueCategories.map((cat) => (
                    <Option key={cat} value={cat}>{cat}</Option>
                  ))}
                </Select>
              )}
            </Stack>
            <Button
              variant="solid"
              color="primary"
              startDecorator={<Plus size={18} />}
              onClick={handleAdd}
              sx={{ whiteSpace: 'nowrap' }}
            >
              New Transaction
            </Button>
          </Stack>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <FormTableSkeleton columns={7} rows={8} />
            ) : filteredTransactions.length === 0 ? (
              <EmptyState type="transactions" />
            ) : (
              <Sheet sx={{ overflow: 'auto' }}>
                <Table stickyHeader>
                  <thead>
                    <tr>
                      <th style={{ width: 120 }}>Date</th>
                      <th>Description</th>
                      <th style={{ width: 150 }}>Category</th>
                      <th style={{ width: 100 }}>Type</th>
                      <th style={{ width: 150 }}>Account</th>
                      <th style={{ width: 130, textAlign: 'right' }}>Amount</th>
                      <th style={{ width: 100, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <Typography level="body-sm">
                            {formatDate(transaction.date)}
                          </Typography>
                        </td>
                        <td>
                          <Typography level="body-sm" fontWeight={500}>
                            {transaction.description}
                          </Typography>
                          {transaction.reference && (
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                              Ref: {transaction.reference}
                            </Typography>
                          )}
                        </td>
                        <td>
                          <Chip size="sm" variant="soft">
                            {transaction.category || 'Uncategorized'}
                          </Chip>
                        </td>
                        <td>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={getTypeColor(transaction.type)}
                            startDecorator={getTypeIcon(transaction.type)}
                          >
                            {transaction.type}
                          </Chip>
                        </td>
                        <td>
                          <Typography level="body-sm">
                            {transaction.accountName || '-'}
                          </Typography>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Typography
                            level="body-sm"
                            fontWeight="bold"
                            sx={{
                              color: transaction.type === 'income' ? 'success.600' : 'danger.600',
                            }}
                          >
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </Typography>
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
                              <MenuItem onClick={() => handleEdit(transaction)}>
                                <ListItemDecorator><Edit2 size={16} /></ListItemDecorator>
                                Edit
                              </MenuItem>
                              <Divider />
                              <MenuItem color="danger" onClick={() => handleDeleteClick(transaction)}>
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
            {!loading && filteredTransactions.length > 0 && (
              <Box sx={{ px: 2, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={2}>
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
                      {filteredTransactions.length === 0 ? 0 : (page - 1) * rowsPerPage + 1}-
                      {Math.min(page * rowsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
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
      </Stack>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => !saving && setModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          layout="center"
          sx={{
            width: '100%',
            maxWidth: 700,
            maxHeight: '90vh',
            overflow: 'hidden',
            p: 0,
          }}
        >
          <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>
            {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
          </DialogTitle>
          <ModalClose disabled={saving} />
          <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
            <Stack spacing={2.5}>
              {/* Type Selection */}
              <FormControl error={!!formErrors.type}>
                <FormLabel required>Transaction Type</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(_, value) => setFormData({ ...formData, type: value || 'expense' })}
                >
                  <Option value="income">Income</Option>
                  <Option value="expense">Expense</Option>
                  <Option value="transfer">Transfer</Option>
                </Select>
                {formErrors.type && <FormHelperText>{formErrors.type}</FormHelperText>}
              </FormControl>

              {/* Amount and Date */}
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <FormControl error={!!formErrors.amount}>
                    <FormLabel required>Amount</FormLabel>
                    <Input
                      type="number"
                      slotProps={{ input: { min: 0, step: 0.01 } }}
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      startDecorator={company?.currency || '$'}
                    />
                    {formErrors.amount && <FormHelperText>{formErrors.amount}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl error={!!formErrors.date}>
                    <FormLabel required>Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                    {formErrors.date && <FormHelperText>{formErrors.date}</FormHelperText>}
                  </FormControl>
                </Grid>
              </Grid>

              {/* Description */}
              <FormControl error={!!formErrors.description}>
                <FormLabel required>Description</FormLabel>
                <Input
                  placeholder="Enter description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                {formErrors.description && <FormHelperText>{formErrors.description}</FormHelperText>}
              </FormControl>

              {/* Account Selection */}
              <FormControl error={!!formErrors.account}>
                <FormLabel required>Account</FormLabel>
                <Autocomplete
                  placeholder="Select account..."
                  options={accounts}
                  getOptionLabel={(option) => `${option.code} - ${option.name}`}
                  value={selectedAccount}
                  onChange={(_, value) => setSelectedAccount(value)}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  groupBy={(option) => option.typeName}
                  slotProps={{
                    listbox: {
                      sx: { maxHeight: 200 }
                    }
                  }}
                />
                {formErrors.account && <FormHelperText>{formErrors.account}</FormHelperText>}
              </FormControl>

              {/* Category and Payment Method */}
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <FormControl>
                    <FormLabel>Category</FormLabel>
                    <Input
                      placeholder="e.g., Office Supplies"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      value={formData.paymentMethod}
                      onChange={(_, value) => setFormData({ ...formData, paymentMethod: value || '' })}
                      placeholder="Select method..."
                    >
                      <Option value="">Not specified</Option>
                      <Option value="cash">Cash</Option>
                      <Option value="bank_transfer">Bank Transfer</Option>
                      <Option value="card">Card</Option>
                      <Option value="cheque">Cheque</Option>
                      <Option value="other">Other</Option>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Reference */}
              <FormControl>
                <FormLabel>Reference</FormLabel>
                <Input
                  placeholder="Invoice #, receipt #, etc."
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="primary"
              onClick={handleSave}
              loading={saving}
            >
              {editingTransaction ? 'Update Transaction' : 'Create Transaction'}
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        description={`Are you sure you want to delete this transaction? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />

    </Container>
  );
}
