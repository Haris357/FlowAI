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
  Divider,
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
} from '@mui/joy';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getBills, updateBill, deleteBill, getVendors } from '@/services/vendors';
import { createBill, updateBillStatus } from '@/services/bills';
import { getCompanyAccounts } from '@/services/account-init';
import { Bill, BillItem, Vendor, Account } from '@/types';
import { LoadingSpinner, EmptyState, ConfirmDialog, PageBreadcrumbs, FormTableSkeleton } from '@/components/common';
import { Search, FileText, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, X, Calculator, BarChart3, Eye, MoreVertical } from 'lucide-react';
import StatusChangeModal from '@/components/StatusChangeModal';
import FormEntityDetailModal from '@/components/FormEntityDetailModal';
import { useFormatting } from '@/hooks';
import { canEdit as canEditStatus, canDelete as canDeleteStatus, getStatusColor as getStatusMgmtColor, formatStatus } from '@/lib/status-management';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';

interface FormErrors {
  vendor?: string;
  issueDate?: string;
  items?: string;
  [key: string]: string | undefined;
}

const emptyItem: BillItem = {
  description: '',
  quantity: 1,
  rate: 0,
  amount: 0,
};

export default function BillsPage() {
  const { user, loading: authLoading } = useAuth();
  const { company } = useCompany();
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Status change modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalBill, setStatusModalBill] = useState<Bill | null>(null);

  // Detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailBill, setDetailBill] = useState<Bill | null>(null);

  // Form state
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [billNumber, setBillNumber] = useState('');
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [items, setItems] = useState<BillItem[]>([{ ...emptyItem }]);
  const [taxAmount, setTaxAmount] = useState('0');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
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
        const [billsData, vendorsData, accountsData] = await Promise.all([
          getBills(company.id),
          getVendors(company.id),
          getCompanyAccounts(company.id),
        ]);
        setBills(billsData);
        setVendors(vendorsData);
        setAccounts(accountsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [company?.id]);

  // Calculate totals for line items
  const calculateItemAmount = (quantity: number, rate: number) => quantity * rate;

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  }, [items]);

  const total = useMemo(() => {
    return subtotal + (parseFloat(taxAmount) || 0);
  }, [subtotal, taxAmount]);

  // Filtered bills with useMemo
  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      const matchesSearch =
        b.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.billNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchesVendor = vendorFilter === 'all' || b.vendorId === vendorFilter;
      return matchesSearch && matchesStatus && matchesVendor;
    });
  }, [bills, searchTerm, statusFilter, vendorFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBills.length / rowsPerPage);
  const paginatedBills = filteredBills.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, vendorFilter]);

  // Get unique vendors for filter
  const uniqueVendors = useMemo(() => {
    const vendorMap = new Map<string, { id: string; name: string }>();
    bills.forEach(b => {
      if (b.vendorId && !vendorMap.has(b.vendorId)) {
        vendorMap.set(b.vendorId, { id: b.vendorId, name: b.vendorName });
      }
    });
    return Array.from(vendorMap.values());
  }, [bills]);

  const getStatusIcon = (status: Bill['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={14} />;
      case 'overdue':
        return <AlertCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const getStatusColor = (status: Bill['status']): 'success' | 'danger' | 'warning' | 'primary' => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'overdue':
        return 'danger';
      case 'partial':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const totalOutstanding = useMemo(() => {
    return bills
      .filter(b => b.status !== 'paid')
      .reduce((sum, b) => sum + b.amountDue, 0);
  }, [bills]);

  const overdueCount = useMemo(() => {
    return bills.filter(b => b.status === 'overdue').length;
  }, [bills]);

  // Additional stats for expanded accordion
  const billStats = useMemo(() => {
    const paid = bills.filter(b => b.status === 'paid');
    const unpaid = bills.filter(b => b.status === 'unpaid');
    const partial = bills.filter(b => b.status === 'partial');
    const overdue = bills.filter(b => b.status === 'overdue');
    const totalValue = bills.reduce((sum, b) => sum + b.total, 0);
    const totalPaid = bills.reduce((sum, b) => sum + b.amountPaid, 0);

    return {
      paidCount: paid.length,
      paidAmount: paid.reduce((sum, b) => sum + b.total, 0),
      unpaidCount: unpaid.length,
      partialCount: partial.length,
      overdueAmount: overdue.reduce((sum, b) => sum + b.amountDue, 0),
      totalValue,
      totalPaid,
      avgAmount: bills.length > 0 ? totalValue / bills.length : 0,
    };
  }, [bills]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!selectedVendor) {
      errors.vendor = 'Please select a vendor';
    }

    if (!issueDate) {
      errors.issueDate = 'Bill date is required';
    }

    const validItems = items.filter(item => item.description.trim() && item.quantity > 0 && item.rate > 0);
    if (validItems.length === 0) {
      errors.items = 'At least one valid line item is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setSelectedVendor(null);
    setBillNumber('');
    setIssueDate(format(new Date(), 'yyyy-MM-dd'));
    setDueDate(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
    setItems([{ ...emptyItem }]);
    setTaxAmount('0');
    setCategory('');
    setNotes('');
    setFormErrors({});
    setEditingBill(null);
  };

  // Open modal for add
  const handleAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    const vendor = vendors.find(v => v.id === bill.vendorId);
    setSelectedVendor(vendor || null);
    setBillNumber(bill.billNumber || '');
    setIssueDate(bill.issueDate instanceof Timestamp
      ? format(bill.issueDate.toDate(), 'yyyy-MM-dd')
      : format(new Date(bill.issueDate), 'yyyy-MM-dd'));
    setDueDate(bill.dueDate instanceof Timestamp
      ? format(bill.dueDate.toDate(), 'yyyy-MM-dd')
      : bill.dueDate ? format(new Date(bill.dueDate), 'yyyy-MM-dd') : '');
    setItems(bill.items.length > 0 ? [...bill.items] : [{ ...emptyItem }]);
    setTaxAmount(String(bill.taxAmount || 0));
    setCategory(bill.category || '');
    setNotes(bill.notes || '');
    setFormErrors({});
    setModalOpen(true);
  };

  // Handle item change
  const handleItemChange = (index: number, field: keyof BillItem, value: string | number) => {
    const newItems = [...items];
    if (field === 'quantity' || field === 'rate') {
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      newItems[index] = {
        ...newItems[index],
        [field]: numValue,
        amount: field === 'quantity'
          ? calculateItemAmount(numValue, newItems[index].rate)
          : calculateItemAmount(newItems[index].quantity, numValue),
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  // Add new item
  const handleAddItem = () => {
    setItems([...items, { ...emptyItem }]);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm() || !company?.id) return;

    setSaving(true);
    try {
      const validItems = items.filter(item => item.description.trim() && item.quantity > 0 && item.rate > 0);

      if (editingBill) {
        // Update existing bill
        const updatedData = {
          vendorId: selectedVendor?.id,
          vendorName: selectedVendor?.name || '',
          issueDate: Timestamp.fromDate(new Date(issueDate)),
          dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : undefined,
          items: validItems,
          subtotal,
          taxAmount: parseFloat(taxAmount) || 0,
          total,
          amountDue: total - editingBill.amountPaid,
          category,
          notes,
        };
        await updateBill(company.id, editingBill.id, updatedData);
        toast.success('Bill updated successfully');
      } else {
        // Create new bill
        const billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt' | 'billNumber'> & { billNumber?: string } = {
          vendorId: selectedVendor?.id,
          vendorName: selectedVendor?.name || '',
          issueDate: Timestamp.fromDate(new Date(issueDate)),
          dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : undefined,
          items: validItems,
          subtotal,
          taxAmount: parseFloat(taxAmount) || 0,
          total,
          amountPaid: 0,
          amountDue: total,
          status: 'unpaid',
          category,
          notes,
        };
        if (billNumber.trim()) {
          billData.billNumber = billNumber.trim();
        }

        // Find Accounts Payable account
        let payableAccount = accounts.find(a =>
          a.isActive &&
          a.typeCode === 'liability' &&
          a.subtypeCode === 'accounts_payable'
        );

        if (!payableAccount) {
          // Fallback to any active liability account
          payableAccount = accounts.find(a => a.isActive && a.typeCode === 'liability');
        }

        if (!payableAccount) {
          toast.error('No active accounts payable account found. Please create one in Chart of Accounts.');
          setSaving(false);
          return;
        }

        // Find Expense account (prefer one matching the category)
        let expenseAccount = accounts.find(a =>
          a.isActive &&
          a.typeCode === 'expense' &&
          (category ? a.name.toLowerCase().includes(category.toLowerCase()) : true)
        );

        if (!expenseAccount) {
          // Fallback to any active expense account
          expenseAccount = accounts.find(a => a.isActive && a.typeCode === 'expense');
        }

        if (!expenseAccount) {
          toast.error('No active expense account found. Please create one in Chart of Accounts.');
          setSaving(false);
          return;
        }

        // Create accounting config
        const accountingConfig = {
          payableAccountId: payableAccount.id,
          payableAccountCode: payableAccount.code,
          payableAccountName: payableAccount.name,
          expenseAccountId: expenseAccount.id,
          expenseAccountCode: expenseAccount.code,
          expenseAccountName: expenseAccount.name,
          createdBy: user?.uid || 'unknown',
        };

        // Create bill data with correct types for createBill
        await createBill(company.id, {
          vendorId: selectedVendor?.id,
          vendorName: selectedVendor?.name || '',
          billNumber: billNumber.trim() || undefined,
          items: validItems,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          taxAmount: parseFloat(taxAmount) || 0,
          category,
          notes,
          accountingConfig,
        });
        toast.success('Bill created successfully');
      }

      // Refresh data
      const data = await getBills(company.id);
      setBills(data);
      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error(editingBill ? 'Failed to update bill' : 'Failed to create bill');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDeleteClick = (bill: Bill) => {
    setBillToDelete(bill);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!company?.id || !billToDelete) return;

    setDeleting(true);
    try {
      await deleteBill(company.id, billToDelete.id);
      toast.success('Bill deleted successfully');
      const data = await getBills(company.id);
      setBills(data);
      setDeleteDialogOpen(false);
      setBillToDelete(null);
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.error('Failed to delete bill');
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
            { label: 'Bills', icon: <FileText size={14} /> },
          ]}
        />

        {/* Header */}
        <Box>
          <Typography level="h2" sx={{ mb: 0.5 }}>
            Bills
          </Typography>
          <Typography level="body-md" sx={{ color: 'text.secondary' }}>
            Manage vendor bills and track payments.
          </Typography>
        </Box>

        {/* Stats Cards */}
        <AccordionGroup>
          <Accordion defaultExpanded={false}>
            <AccordionSummary>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <BarChart3 size={18} />
                <Typography level="body-sm" fontWeight={500}>
                  Total Bills: {loading ? '...' : bills.length}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: 'danger.600' }}>
                  Outstanding: {loading ? '...' : formatCurrency(totalOutstanding)}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: 'warning.600' }}>
                  Overdue: {loading ? '...' : overdueCount}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)', borderColor: 'primary.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Total Bills</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                        {loading ? <Skeleton width={60} /> : bills.length}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        Value: {loading ? '...' : formatCurrency(billStats.totalValue)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.08) 0%, rgba(211, 47, 47, 0.02) 100%)', borderColor: 'danger.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Outstanding</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'danger.700' }}>
                        {loading ? <Skeleton width={100} /> : formatCurrency(totalOutstanding)}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        {loading ? '...' : `${bills.length - billStats.paidCount} unpaid`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(112, 143, 150, 0.08) 0%, rgba(112, 143, 150, 0.02) 100%)', borderColor: 'primary.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Paid</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                        {loading ? <Skeleton width={60} /> : billStats.paidCount}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        {loading ? '...' : formatCurrency(billStats.paidAmount)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(237, 108, 2, 0.08) 0%, rgba(237, 108, 2, 0.02) 100%)', borderColor: 'warning.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Overdue</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'warning.700' }}>
                        {loading ? <Skeleton width={60} /> : overdueCount}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        {loading ? '...' : formatCurrency(billStats.overdueAmount)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Unpaid</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={60} /> : billStats.unpaidCount}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Partially Paid</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={60} /> : billStats.partialCount}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Total Paid</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'success.600' }}>
                        {loading ? <Skeleton width={100} /> : formatCurrency(billStats.totalPaid)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Avg Bill</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={100} /> : formatCurrency(billStats.avgAmount)}
                      </Typography>
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
                placeholder="Search bills..."
                startDecorator={<Search size={18} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }}
              />
              <Select
                value={statusFilter}
                onChange={(_, value) => setStatusFilter(value || 'all')}
                sx={{ minWidth: 150 }}
              >
                <Option value="all">All Status</Option>
                <Option value="unpaid">Unpaid</Option>
                <Option value="partial">Partial</Option>
                <Option value="paid">Paid</Option>
                <Option value="overdue">Overdue</Option>
              </Select>
              <Select
                value={vendorFilter}
                onChange={(_, value) => setVendorFilter(value || 'all')}
                sx={{ minWidth: 180 }}
              >
                <Option value="all">All Vendors</Option>
                {uniqueVendors.map((v) => (
                  <Option key={v.id} value={v.id}>{v.name}</Option>
                ))}
              </Select>
            </Stack>
            <Button
              variant="solid"
              color="primary"
              startDecorator={<Plus size={18} />}
              onClick={handleAdd}
              sx={{ whiteSpace: 'nowrap' }}
            >
              New Bill
            </Button>
          </Stack>
        </Card>

        {/* Bills Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <FormTableSkeleton columns={8} rows={10} />
            ) : filteredBills.length === 0 ? (
              <EmptyState type="bills" />
            ) : (
              <Sheet sx={{ overflow: 'auto' }}>
                <Table stickyHeader>
                  <thead>
                    <tr>
                      <th style={{ width: 120 }}>Bill #</th>
                      <th>Vendor</th>
                      <th style={{ width: 120 }}>Bill Date</th>
                      <th style={{ width: 120 }}>Due Date</th>
                      <th style={{ width: 130, textAlign: 'right' }}>Amount</th>
                      <th style={{ width: 130, textAlign: 'right' }}>Due</th>
                      <th style={{ width: 100 }}>Status</th>
                      <th style={{ width: 100, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBills.map((bill) => (
                      <tr key={bill.id}>
                        <td>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <FileText size={14} />
                            <Typography level="body-sm" fontFamily="monospace">
                              {bill.billNumber || '-'}
                            </Typography>
                          </Stack>
                        </td>
                        <td>
                          <Typography level="body-sm" fontWeight={500}>
                            {bill.vendorName}
                          </Typography>
                        </td>
                        <td>
                          <Typography level="body-sm">
                            {formatDate(bill.issueDate)}
                          </Typography>
                        </td>
                        <td>
                          <Typography
                            level="body-sm"
                            sx={{
                              color: bill.status === 'overdue' ? 'danger.600' : 'text.primary',
                            }}
                          >
                            {bill.dueDate ? formatDate(bill.dueDate) : '-'}
                          </Typography>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Typography level="body-sm">
                            {formatCurrency(bill.total)}
                          </Typography>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Typography
                            level="body-sm"
                            fontWeight="bold"
                            sx={{
                              color: bill.amountDue > 0 ? 'danger.600' : 'success.600',
                            }}
                          >
                            {formatCurrency(bill.amountDue)}
                          </Typography>
                        </td>
                        <td>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={getStatusMgmtColor('bill', bill.status)}
                            sx={{ cursor: 'pointer' }}
                            onClick={() => {
                              setStatusModalBill(bill);
                              setStatusModalOpen(true);
                            }}
                          >
                            {formatStatus('bill', bill.status)}
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
                              <MenuItem onClick={() => { setDetailBill(bill); setDetailModalOpen(true); }}>
                                <ListItemDecorator><Eye size={16} /></ListItemDecorator>
                                View Details
                              </MenuItem>
                              {canEditStatus('bill', bill.status).allowed && (
                                <MenuItem onClick={() => handleEdit(bill)}>
                                  <ListItemDecorator><Edit2 size={16} /></ListItemDecorator>
                                  Edit
                                </MenuItem>
                              )}
                              {canDeleteStatus('bill', bill.status).allowed && (
                                <>
                                  <Divider />
                                  <MenuItem color="danger" onClick={() => handleDeleteClick(bill)}>
                                    <ListItemDecorator sx={{ color: 'inherit' }}><Trash2 size={16} /></ListItemDecorator>
                                    Delete
                                  </MenuItem>
                                </>
                              )}
                            </Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Sheet>
            )}
            {!loading && filteredBills.length > 0 && (
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
                      {filteredBills.length === 0 ? 0 : (page - 1) * rowsPerPage + 1}-
                      {Math.min(page * rowsPerPage, filteredBills.length)} of {filteredBills.length}
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
            maxWidth: 850,
            maxHeight: '90vh',
            overflow: 'hidden',
            p: 0,
          }}
        >
          <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>
            {editingBill ? 'Edit Bill' : 'New Bill'}
          </DialogTitle>
          <ModalClose disabled={saving} />
          <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
            <Stack spacing={3}>
              {/* Vendor Selection */}
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <FormControl error={!!formErrors.vendor}>
                    <FormLabel required>Vendor</FormLabel>
                    <Autocomplete
                      placeholder="Select or search vendor..."
                      options={vendors}
                      getOptionLabel={(option) => option.name}
                      value={selectedVendor}
                      onChange={(_, value) => setSelectedVendor(value)}
                      isOptionEqualToValue={(option, value) => option.id === value?.id}
                      disabled={!!editingBill}
                      slotProps={{
                        listbox: {
                          sx: { maxHeight: 200 }
                        }
                      }}
                    />
                    {formErrors.vendor && <FormHelperText>{formErrors.vendor}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl>
                    <FormLabel>Bill Number (Optional)</FormLabel>
                    <Input
                      placeholder="Auto-generated if empty"
                      value={billNumber}
                      onChange={(e) => setBillNumber(e.target.value)}
                      disabled={!!editingBill}
                    />
                  </FormControl>
                </Grid>
              </Grid>

              {/* Dates */}
              <Grid container spacing={2}>
                <Grid xs={12} sm={4}>
                  <FormControl error={!!formErrors.issueDate}>
                    <FormLabel required>Bill Date</FormLabel>
                    <Input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                    />
                    {formErrors.issueDate && <FormHelperText>{formErrors.issueDate}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={4}>
                  <FormControl>
                    <FormLabel>Due Date</FormLabel>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={4}>
                  <FormControl>
                    <FormLabel>Category</FormLabel>
                    <Input
                      placeholder="e.g., Office Supplies"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                  </FormControl>
                </Grid>
              </Grid>

              <Divider />

              {/* Line Items */}
              <Box>
                <Typography level="title-sm" sx={{ mb: 1.5 }}>Line Items</Typography>
                {formErrors.items && (
                  <Typography level="body-sm" color="danger" sx={{ mb: 1.5 }}>
                    {formErrors.items}
                  </Typography>
                )}
                <Stack spacing={1.5}>
                  {items.map((item, index) => (
                    <Grid container spacing={1} key={index} alignItems="flex-end">
                      <Grid xs={12} sm={5}>
                        <FormControl>
                          <FormLabel>Description</FormLabel>
                          <Input
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        </FormControl>
                      </Grid>
                      <Grid xs={4} sm={2}>
                        <FormControl>
                          <FormLabel>Qty</FormLabel>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          />
                        </FormControl>
                      </Grid>
                      <Grid xs={4} sm={2}>
                        <FormControl>
                          <FormLabel>Rate</FormLabel>
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          />
                        </FormControl>
                      </Grid>
                      <Grid xs={3} sm={2}>
                        <FormControl>
                          <FormLabel>Amount</FormLabel>
                          <Input value={formatCurrency(item.amount)} disabled />
                        </FormControl>
                      </Grid>
                      <Grid xs={1}>
                        <IconButton
                          size="sm"
                          variant="plain"
                          color="danger"
                          onClick={() => handleRemoveItem(index)}
                          disabled={items.length === 1}
                        >
                          <X size={16} />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                  <Button variant="outlined" color="neutral" size="sm" onClick={handleAddItem} startDecorator={<Plus size={16} />}>
                    Add Item
                  </Button>
                </Stack>
              </Box>

              <Divider />

              {/* Totals */}
              <Grid container spacing={3}>
                <Grid xs={12} md={6}>
                  <FormControl>
                    <FormLabel>Notes</FormLabel>
                    <Input
                      placeholder="Internal notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </FormControl>
                </Grid>

                <Grid xs={12} md={6}>
                  <AccordionGroup>
                    <Accordion defaultExpanded={false}>
                      <AccordionSummary>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                          <Calculator size={18} />
                          <Typography level="body-sm" fontWeight={500}>
                            Subtotal: {formatCurrency(subtotal)}
                          </Typography>
                          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                          <Typography level="title-sm" fontWeight={600} color="primary">
                            Total: {formatCurrency(total)}
                          </Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={1.5} sx={{ pt: 1 }}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography level="body-sm">Subtotal</Typography>
                            <Typography level="body-sm" fontWeight={500}>
                              {formatCurrency(subtotal)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography level="body-sm">Tax Amount</Typography>
                            <Input
                              size="sm"
                              type="number"
                              slotProps={{ input: { min: 0, step: 0.01 } }}
                              value={taxAmount}
                              onChange={(e) => setTaxAmount(e.target.value)}
                              sx={{ width: 100, textAlign: 'right' }}
                            />
                          </Stack>
                          <Divider />
                          <Stack direction="row" justifyContent="space-between">
                            <Typography level="title-md">Total</Typography>
                            <Typography level="title-md" fontWeight="bold" color="primary">
                              {formatCurrency(total)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  </AccordionGroup>
                </Grid>
              </Grid>
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
              {editingBill ? 'Update Bill' : 'Create Bill'}
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Bill"
        description={`Are you sure you want to delete bill ${billToDelete?.billNumber || billToDelete?.id}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />

      {/* Status Change Modal */}
      {statusModalBill && (
        <StatusChangeModal
          open={statusModalOpen}
          onClose={() => { setStatusModalOpen(false); setStatusModalBill(null); }}
          entityType="bill"
          entityId={statusModalBill.id}
          entityName={statusModalBill.billNumber || statusModalBill.vendorName}
          currentStatus={statusModalBill.status}
          onStatusChange={async (id, newStatus) => {
            await updateBillStatus(company!.id, id, newStatus);
            const data = await getBills(company!.id);
            setBills(data);
            toast.success(`Status updated to ${formatStatus('bill', newStatus)}`);
          }}
        />
      )}

      {/* Detail Modal */}
      <FormEntityDetailModal
        open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setDetailBill(null); }}
        entityType="bill"
        entity={detailBill}
        onEdit={(entity) => { setDetailModalOpen(false); handleEdit(entity as Bill); }}
        onDelete={(entity) => { setDetailModalOpen(false); handleDeleteClick(entity as Bill); }}
      />
    </Container>
  );
}
