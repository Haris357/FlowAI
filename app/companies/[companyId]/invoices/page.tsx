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
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, generateInvoiceNumber, updateInvoiceStatus } from '@/services/invoices';
import { getCustomers } from '@/services/customers';
import { Invoice, InvoiceItem, Customer } from '@/types';
import { LoadingSpinner, EmptyState, ConfirmDialog, PageBreadcrumbs, FormTableSkeleton } from '@/components/common';
import { Search, FileText, ChevronLeft, ChevronRight, DollarSign, Plus, Edit2, Trash2, X, Calculator, BarChart3, Eye, MoreVertical } from 'lucide-react';
import StatusChangeModal from '@/components/StatusChangeModal';
import FormEntityDetailModal from '@/components/FormEntityDetailModal';
import { useSettingsCategory, useFormatting } from '@/hooks';
import { canEdit as canEditStatus, canDelete as canDeleteStatus, getStatusColor as getStatusMgmtColor, formatStatus } from '@/lib/status-management';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';

// Color mapping for MUI Joy Chip colors
const colorMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  blue: 'primary',
  green: 'success',
  yellow: 'warning',
  red: 'danger',
  gray: 'neutral',
  orange: 'warning',
  purple: 'primary',
};

interface FormErrors {
  customer?: string;
  dueDate?: string;
  items?: string;
  [key: string]: string | undefined;
}

const emptyItem: InvoiceItem = {
  description: '',
  quantity: 1,
  rate: 0,
  amount: 0,
};

export default function InvoicesPage() {
  const { user, loading: authLoading } = useAuth();
  const { company } = useCompany();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Status change modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalInvoice, setStatusModalInvoice] = useState<Invoice | null>(null);

  // Detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [items, setItems] = useState<InvoiceItem[]>([{ ...emptyItem }]);
  const [taxRate, setTaxRate] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Get invoice statuses from dynamic settings
  const { options: invoiceStatuses, getLabel: getStatusLabel, getColor: getStatusColor } = useSettingsCategory(company?.id, 'invoice_status');

  // Get formatting functions from company preferences
  const { formatCurrency, formatDate } = useFormatting();

  // Map status code to chip color
  const getChipColor = (statusCode: string): 'primary' | 'success' | 'warning' | 'danger' | 'neutral' => {
    const color = getStatusColor(statusCode);
    if (color && colorMap[color]) return colorMap[color];
    // Fallback based on status code
    if (statusCode === 'paid') return 'success';
    if (statusCode === 'overdue') return 'danger';
    if (statusCode === 'partial') return 'warning';
    if (statusCode === 'sent' || statusCode === 'viewed') return 'primary';
    return 'neutral';
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
        const [invoicesData, customersData] = await Promise.all([
          getInvoices(company.id),
          getCustomers(company.id),
        ]);
        setInvoices(invoicesData);
        setCustomers(customersData);
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

  const taxAmount = useMemo(() => {
    return subtotal * (parseFloat(taxRate) || 0) / 100;
  }, [subtotal, taxRate]);

  const total = useMemo(() => {
    return subtotal + taxAmount - (parseFloat(discount) || 0);
  }, [subtotal, taxAmount, discount]);

  // Filtered invoices with useMemo
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchesCustomer = customerFilter === 'all' || inv.customerId === customerFilter;
      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }, [invoices, searchTerm, statusFilter, customerFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredInvoices.length / rowsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, customerFilter]);

  // Calculate outstanding - any invoice that's not paid or cancelled
  const totalOutstanding = useMemo(() => {
    return invoices
      .filter(inv => !['paid', 'cancelled'].includes(inv.status))
      .reduce((sum, inv) => sum + inv.amountDue, 0);
  }, [invoices]);

  // Additional stats for expanded accordion
  const invoiceStats = useMemo(() => {
    const paid = invoices.filter(inv => inv.status === 'paid');
    const draft = invoices.filter(inv => inv.status === 'draft');
    const overdue = invoices.filter(inv => inv.status === 'overdue');
    const partial = invoices.filter(inv => inv.status === 'partial');
    const totalValue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);

    return {
      paidCount: paid.length,
      paidAmount: paid.reduce((sum, inv) => sum + inv.total, 0),
      draftCount: draft.length,
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((sum, inv) => sum + inv.amountDue, 0),
      partialCount: partial.length,
      totalValue,
      totalPaid,
      avgAmount: invoices.length > 0 ? totalValue / invoices.length : 0,
    };
  }, [invoices]);

  // Get unique customers for filter
  const uniqueCustomers = useMemo(() => {
    const customerMap = new Map<string, { id: string; name: string }>();
    invoices.forEach(inv => {
      if (inv.customerId && !customerMap.has(inv.customerId)) {
        customerMap.set(inv.customerId, { id: inv.customerId, name: inv.customerName });
      }
    });
    return Array.from(customerMap.values());
  }, [invoices]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!selectedCustomer) {
      errors.customer = 'Please select a customer';
    }

    if (!dueDate) {
      errors.dueDate = 'Due date is required';
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
    setSelectedCustomer(null);
    setIssueDate(format(new Date(), 'yyyy-MM-dd'));
    setDueDate(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
    setItems([{ ...emptyItem }]);
    setTaxRate('0');
    setDiscount('0');
    setNotes('');
    setTerms('');
    setFormErrors({});
    setEditingInvoice(null);
  };

  // Open modal for add
  const handleAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    const customer = customers.find(c => c.id === invoice.customerId);
    setSelectedCustomer(customer || null);
    setIssueDate(invoice.issueDate instanceof Timestamp
      ? format(invoice.issueDate.toDate(), 'yyyy-MM-dd')
      : format(new Date(invoice.issueDate), 'yyyy-MM-dd'));
    setDueDate(invoice.dueDate instanceof Timestamp
      ? format(invoice.dueDate.toDate(), 'yyyy-MM-dd')
      : format(new Date(invoice.dueDate), 'yyyy-MM-dd'));
    setItems(invoice.items.length > 0 ? [...invoice.items] : [{ ...emptyItem }]);
    setTaxRate(String(invoice.taxRate || 0));
    setDiscount(String(invoice.discount || 0));
    setNotes(invoice.notes || '');
    setTerms(invoice.terms || '');
    setFormErrors({});
    setModalOpen(true);
  };

  // Handle item change
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
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
    if (!validateForm() || !company?.id || !selectedCustomer) return;

    setSaving(true);
    try {
      const validItems = items.filter(item => item.description.trim() && item.quantity > 0 && item.rate > 0);

      if (editingInvoice) {
        // Update existing invoice
        const updatedData = {
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerEmail: selectedCustomer.email || '',
          issueDate: Timestamp.fromDate(new Date(issueDate)),
          dueDate: Timestamp.fromDate(new Date(dueDate)),
          items: validItems,
          subtotal,
          taxRate: parseFloat(taxRate) || 0,
          taxAmount,
          discount: parseFloat(discount) || 0,
          total,
          amountDue: total - editingInvoice.amountPaid,
          notes,
          terms,
        };
        await updateInvoice(company.id, editingInvoice.id, updatedData);
        toast.success('Invoice updated successfully');
      } else {
        // Create new invoice
        await createInvoice(company.id, {
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerEmail: selectedCustomer.email,
          items: validItems,
          dueDate: new Date(dueDate),
          taxRate: parseFloat(taxRate) || 0,
          discount: parseFloat(discount) || 0,
          notes,
          terms,
        });
        toast.success('Invoice created successfully');
      }

      // Refresh data
      const data = await getInvoices(company.id);
      setInvoices(data);
      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error(editingInvoice ? 'Failed to update invoice' : 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!company?.id || !invoiceToDelete) return;

    setDeleting(true);
    try {
      await deleteInvoice(company.id, invoiceToDelete.id);
      toast.success('Invoice deleted successfully');
      const data = await getInvoices(company.id);
      setInvoices(data);
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
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
            { label: 'Invoices', icon: <FileText size={14} /> },
          ]}
        />

        {/* Header */}
        <Box>
          <Typography level="h2" sx={{ mb: 0.5 }}>
            Invoices
          </Typography>
          <Typography level="body-md" sx={{ color: 'text.secondary' }}>
            Manage your invoices and track payments.
          </Typography>
        </Box>

        {/* Stats Cards */}
        <AccordionGroup>
          <Accordion defaultExpanded={false}>
            <AccordionSummary>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <BarChart3 size={18} />
                <Typography level="body-sm" fontWeight={500}>
                  Total Invoices: {loading ? '...' : invoices.length}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: 'warning.600' }}>
                  Outstanding: {loading ? '...' : formatCurrency(totalOutstanding)}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)', borderColor: 'primary.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Total Invoices</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                        {loading ? <Skeleton width={60} /> : invoices.length}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        Value: {loading ? '...' : formatCurrency(invoiceStats.totalValue)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(237, 108, 2, 0.08) 0%, rgba(237, 108, 2, 0.02) 100%)', borderColor: 'warning.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Outstanding</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'warning.700' }}>
                        {loading ? <Skeleton width={100} /> : formatCurrency(totalOutstanding)}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        {loading ? '...' : `${invoices.length - invoiceStats.paidCount} unpaid`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(46, 125, 50, 0.02) 100%)', borderColor: 'success.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Paid</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'success.700' }}>
                        {loading ? <Skeleton width={60} /> : invoiceStats.paidCount}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        {loading ? '...' : formatCurrency(invoiceStats.paidAmount)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.08) 0%, rgba(211, 47, 47, 0.02) 100%)', borderColor: 'danger.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Overdue</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'danger.700' }}>
                        {loading ? <Skeleton width={60} /> : invoiceStats.overdueCount}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        {loading ? '...' : formatCurrency(invoiceStats.overdueAmount)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Draft</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={60} /> : invoiceStats.draftCount}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Partially Paid</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={60} /> : invoiceStats.partialCount}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Total Collected</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'success.600' }}>
                        {loading ? <Skeleton width={100} /> : formatCurrency(invoiceStats.totalPaid)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Avg Invoice</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={100} /> : formatCurrency(invoiceStats.avgAmount)}
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
                placeholder="Search invoices..."
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
                <Option value="draft">Draft</Option>
                <Option value="sent">Sent</Option>
                <Option value="viewed">Viewed</Option>
                <Option value="partial">Partial</Option>
                <Option value="paid">Paid</Option>
                <Option value="overdue">Overdue</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
              <Select
                value={customerFilter}
                onChange={(_, value) => setCustomerFilter(value || 'all')}
                sx={{ minWidth: 180 }}
              >
                <Option value="all">All Customers</Option>
                {uniqueCustomers.map((c) => (
                  <Option key={c.id} value={c.id}>{c.name}</Option>
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
              New Invoice
            </Button>
          </Stack>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <FormTableSkeleton columns={8} rows={10} />
            ) : filteredInvoices.length === 0 ? (
              <EmptyState type="invoices" />
            ) : (
              <Sheet sx={{ overflow: 'auto' }}>
                <Table stickyHeader>
                  <thead>
                    <tr>
                      <th style={{ width: 120 }}>Invoice #</th>
                      <th>Customer</th>
                      <th style={{ width: 120 }}>Date</th>
                      <th style={{ width: 120 }}>Due Date</th>
                      <th style={{ width: 100 }}>Status</th>
                      <th style={{ width: 120, textAlign: 'right' }}>Total</th>
                      <th style={{ width: 120, textAlign: 'right' }}>Due</th>
                      <th style={{ width: 100, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <FileText size={16} />
                            <Typography level="body-sm" fontWeight={500}>
                              {invoice.invoiceNumber}
                            </Typography>
                          </Stack>
                        </td>
                        <td>
                          <Typography level="body-sm">{invoice.customerName}</Typography>
                          {invoice.customerEmail && (
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                              {invoice.customerEmail}
                            </Typography>
                          )}
                        </td>
                        <td>
                          <Typography level="body-sm">{formatDate(invoice.issueDate)}</Typography>
                        </td>
                        <td>
                          <Typography level="body-sm">{formatDate(invoice.dueDate)}</Typography>
                        </td>
                        <td>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={getStatusMgmtColor('invoice', invoice.status)}
                            sx={{ cursor: 'pointer' }}
                            onClick={() => {
                              setStatusModalInvoice(invoice);
                              setStatusModalOpen(true);
                            }}
                          >
                            {formatStatus('invoice', invoice.status)}
                          </Chip>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Typography level="body-sm" fontWeight={500}>
                            {formatCurrency(invoice.total)}
                          </Typography>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Typography
                            level="body-sm"
                            fontWeight={500}
                            sx={{ color: invoice.amountDue > 0 ? 'danger.600' : 'success.600' }}
                          >
                            {formatCurrency(invoice.amountDue)}
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
                              <MenuItem onClick={() => { setDetailInvoice(invoice); setDetailModalOpen(true); }}>
                                <ListItemDecorator><Eye size={16} /></ListItemDecorator>
                                View Details
                              </MenuItem>
                              {canEditStatus('invoice', invoice.status).allowed && (
                                <MenuItem onClick={() => handleEdit(invoice)}>
                                  <ListItemDecorator><Edit2 size={16} /></ListItemDecorator>
                                  Edit
                                </MenuItem>
                              )}
                              {canDeleteStatus('invoice', invoice.status).allowed && (
                                <>
                                  <Divider />
                                  <MenuItem color="danger" onClick={() => handleDeleteClick(invoice)}>
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
            {!loading && filteredInvoices.length > 0 && (
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
                      {filteredInvoices.length === 0 ? 0 : (page - 1) * rowsPerPage + 1}-
                      {Math.min(page * rowsPerPage, filteredInvoices.length)} of {filteredInvoices.length}
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
            {editingInvoice ? 'Edit Invoice' : 'New Invoice'}
          </DialogTitle>
          <ModalClose disabled={saving} />
          <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
            <Stack spacing={3}>
              {/* Customer Selection */}
              <FormControl error={!!formErrors.customer}>
                <FormLabel required>Customer</FormLabel>
                <Autocomplete
                  placeholder="Select or search customer..."
                  options={customers}
                  getOptionLabel={(option) => option.name}
                  value={selectedCustomer}
                  onChange={(_, value) => setSelectedCustomer(value)}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  disabled={!!editingInvoice}
                  slotProps={{
                    listbox: {
                      sx: { maxHeight: 200 }
                    }
                  }}
                />
                {formErrors.customer && <FormHelperText>{formErrors.customer}</FormHelperText>}
              </FormControl>

              {/* Dates */}
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <FormControl>
                    <FormLabel>Issue Date</FormLabel>
                    <Input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      disabled={!!editingInvoice}
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl error={!!formErrors.dueDate}>
                    <FormLabel required>Due Date</FormLabel>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                    {formErrors.dueDate && <FormHelperText>{formErrors.dueDate}</FormHelperText>}
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
                  <Stack spacing={2}>
                    <FormControl>
                      <FormLabel>Notes</FormLabel>
                      <Input
                        placeholder="Notes to customer..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Terms</FormLabel>
                      <Input
                        placeholder="Payment terms..."
                        value={terms}
                        onChange={(e) => setTerms(e.target.value)}
                      />
                    </FormControl>
                  </Stack>
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
                            <Typography level="body-sm">Tax (%)</Typography>
                            <Input
                              size="sm"
                              type="number"
                              slotProps={{ input: { min: 0, max: 100, step: 0.1 } }}
                              value={taxRate}
                              onChange={(e) => setTaxRate(e.target.value)}
                              sx={{ width: 80, textAlign: 'right' }}
                            />
                          </Stack>
                          {taxAmount > 0 && (
                            <Stack direction="row" justifyContent="space-between">
                              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                                Tax Amount
                              </Typography>
                              <Typography level="body-sm">
                                {formatCurrency(taxAmount)}
                              </Typography>
                            </Stack>
                          )}
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography level="body-sm">Discount</Typography>
                            <Input
                              size="sm"
                              type="number"
                              slotProps={{ input: { min: 0, step: 0.01 } }}
                              value={discount}
                              onChange={(e) => setDiscount(e.target.value)}
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
              {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice ${invoiceToDelete?.invoiceNumber}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />

      {/* Status Change Modal */}
      {statusModalInvoice && (
        <StatusChangeModal
          open={statusModalOpen}
          onClose={() => { setStatusModalOpen(false); setStatusModalInvoice(null); }}
          entityType="invoice"
          entityId={statusModalInvoice.id}
          entityName={statusModalInvoice.invoiceNumber}
          currentStatus={statusModalInvoice.status}
          onStatusChange={async (id, newStatus) => {
            await updateInvoiceStatus(company!.id, id, newStatus);
            const data = await getInvoices(company!.id);
            setInvoices(data);
            toast.success(`Status updated to ${formatStatus('invoice', newStatus)}`);
          }}
        />
      )}

      {/* Detail Modal */}
      <FormEntityDetailModal
        open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setDetailInvoice(null); }}
        entityType="invoice"
        entity={detailInvoice}
        onEdit={(entity) => { setDetailModalOpen(false); handleEdit(entity as Invoice); }}
        onDelete={(entity) => { setDetailModalOpen(false); handleDeleteClick(entity as Invoice); }}
      />
    </Container>
  );
}
