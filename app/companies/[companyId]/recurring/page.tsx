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
  Input,
  Textarea,
  Select,
  Option,
  Grid,
  Autocomplete,
  Divider,
  Skeleton,
  Sheet,
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
  ListItemDecorator,
  AccordionGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/joy';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getRecurringTransactions,
  createRecurringInvoice,
  createRecurringBill,
  pauseRecurringTransaction,
  resumeRecurringTransaction,
  cancelRecurringTransaction,
  deleteRecurringTransaction,
  getRecurringTransactionStats,
} from '@/services/recurringTransactions';
import { getCustomers } from '@/services/customers';
import { getVendors } from '@/services/vendors';
import { LoadingSpinner, PageBreadcrumbs, FormTableSkeleton } from '@/components/common';
import { RecurringTransaction, RecurringFrequency, RecurringType, RecurringStatus, Customer, Vendor, InvoiceItem, BillItem } from '@/types';
import {
  Plus,
  Trash2,
  RefreshCw,
  Play,
  Pause,
  XCircle,
  Search,
  Filter,
  Calendar,
  FileText,
  Receipt,
  Calculator,
  BarChart3,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const STATUS_COLORS: Record<RecurringStatus, 'neutral' | 'primary' | 'success' | 'danger' | 'warning'> = {
  active: 'success',
  paused: 'warning',
  completed: 'neutral',
  cancelled: 'danger',
};

const TYPE_ICONS: Record<RecurringType, React.ReactNode> = {
  invoice: <FileText size={16} />,
  bill: <Receipt size={16} />,
  journal_entry: <Calendar size={16} />,
  transaction: <Calendar size={16} />,
};

export default function RecurringTransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const { company } = useCompany();
  const router = useRouter();
  const [recurringTxns, setRecurringTxns] = useState<RecurringTransaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'invoice' | 'bill'>('invoice');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<RecurringType | 'all'>('all');
  const [stats, setStats] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    customerId: '',
    customerName: '',
    vendorId: '',
    vendorName: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }] as InvoiceItem[],
    taxRate: 0,
    discount: 0,
    dueDays: 30,
    notes: '',
    terms: '',
    frequency: 'monthly' as RecurringFrequency,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    maxRuns: '',
    autoSend: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const [txnsData, customersData, vendorsData, statsData] = await Promise.all([
        getRecurringTransactions(company.id),
        getCustomers(company.id),
        getVendors(company.id),
        getRecurringTransactionStats(company.id),
      ]);
      setRecurringTxns(txnsData);
      setCustomers(customersData);
      setVendors(vendorsData);
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

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomerChange = (customer: Customer | null) => {
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
      }));
    }
  };

  const handleVendorChange = (vendor: Vendor | null) => {
    if (vendor) {
      setFormData((prev) => ({
        ...prev,
        vendorId: vendor.id,
        vendorName: vendor.name,
      }));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (formData.taxRate / 100);
    const total = subtotal + taxAmount - formData.discount;
    return { subtotal, taxAmount, total };
  };

  const resetForm = () => {
    setFormData({
      name: '',
      customerId: '',
      customerName: '',
      vendorId: '',
      vendorName: '',
      items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      taxRate: 0,
      discount: 0,
      dueDays: 30,
      notes: '',
      terms: '',
      frequency: 'monthly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      maxRuns: '',
      autoSend: false,
    });
  };

  const openCreateModal = (type: 'invoice' | 'bill') => {
    resetForm();
    setModalType(type);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!company?.id || !formData.name) return;
    setSaving(true);
    try {
      if (modalType === 'invoice') {
        if (!formData.customerId) return;
        await createRecurringInvoice(company.id, {
          name: formData.name,
          customerId: formData.customerId,
          customerName: formData.customerName,
          items: formData.items,
          taxRate: formData.taxRate,
          discount: formData.discount,
          dueDays: formData.dueDays,
          notes: formData.notes,
          terms: formData.terms,
          frequency: formData.frequency,
          startDate: new Date(formData.startDate),
          endDate: formData.endDate ? new Date(formData.endDate) : undefined,
          maxRuns: formData.maxRuns ? Number(formData.maxRuns) : undefined,
          autoSend: formData.autoSend,
        });
      } else {
        if (!formData.vendorId) return;
        await createRecurringBill(company.id, {
          name: formData.name,
          vendorId: formData.vendorId,
          vendorName: formData.vendorName,
          items: formData.items as BillItem[],
          dueDays: formData.dueDays,
          notes: formData.notes,
          frequency: formData.frequency,
          startDate: new Date(formData.startDate),
          endDate: formData.endDate ? new Date(formData.endDate) : undefined,
          maxRuns: formData.maxRuns ? Number(formData.maxRuns) : undefined,
        });
      }
      setModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating recurring transaction:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePause = async (rt: RecurringTransaction) => {
    if (!company?.id) return;
    try {
      await pauseRecurringTransaction(company.id, rt.id);
      loadData();
    } catch (error) {
      console.error('Error pausing:', error);
    }
  };

  const handleResume = async (rt: RecurringTransaction) => {
    if (!company?.id) return;
    try {
      await resumeRecurringTransaction(company.id, rt.id);
      loadData();
    } catch (error) {
      console.error('Error resuming:', error);
    }
  };

  const handleCancel = async (rt: RecurringTransaction) => {
    if (!company?.id || !confirm('Cancel this recurring transaction?')) return;
    try {
      await cancelRecurringTransaction(company.id, rt.id);
      loadData();
    } catch (error) {
      console.error('Error cancelling:', error);
    }
  };

  const handleDelete = async (rt: RecurringTransaction) => {
    if (!company?.id || !confirm('Delete this recurring transaction?')) return;
    try {
      await deleteRecurringTransaction(company.id, rt.id);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const filteredTxns = recurringTxns.filter((rt) => {
    const matchesSearch = rt.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || rt.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const { subtotal, taxAmount, total } = calculateTotals();

  if (authLoading || !user) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Breadcrumbs */}
        <PageBreadcrumbs
          items={[
            { label: 'Recurring', icon: <RefreshCw size={14} /> },
          ]}
        />

        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
          <Box>
            <Typography level="h2" sx={{ mb: 0.5 }}>Recurring Transactions</Typography>
            <Typography level="body-md" sx={{ color: 'text.secondary' }}>
              Automate your recurring invoices and bills.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="primary"
              startDecorator={<Plus size={18} />}
              onClick={() => openCreateModal('invoice')}
            >
              Recurring Invoice
            </Button>
            <Button
              variant="solid"
              color="primary"
              startDecorator={<Plus size={18} />}
              onClick={() => openCreateModal('bill')}
            >
              Recurring Bill
            </Button>
          </Stack>
        </Stack>

        {/* Stats Cards */}
        <AccordionGroup>
          <Accordion defaultExpanded={false}>
            <AccordionSummary>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <BarChart3 size={18} />
                <Typography level="body-sm" fontWeight={500}>
                  Total: {loading ? '...' : stats?.totalRecurring || 0}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: 'primary.600' }}>
                  Active: {loading ? '...' : stats?.activeRecurring || 0}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: 'danger.600' }}>
                  Due Today: {loading ? '...' : stats?.dueToday || 0}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Total Recurring</Typography>
                      <Typography level="h3" fontWeight="bold">{loading ? <Skeleton width={60} /> : stats?.totalRecurring || 0}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        {loading ? '...' : `${stats?.totalRuns || 0} total runs`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(46, 125, 50, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Active</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>{loading ? <Skeleton width={60} /> : stats?.activeRecurring || 0}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        Running
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(237, 108, 2, 0.08) 0%, rgba(237, 108, 2, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Paused</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'warning.700' }}>{loading ? <Skeleton width={60} /> : stats?.pausedRecurring || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.08) 0%, rgba(211, 47, 47, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Due Today</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'danger.700' }}>{loading ? <Skeleton width={60} /> : stats?.dueToday || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Invoices</Typography>
                      <Typography level="h3" fontWeight="bold">{loading ? <Skeleton width={60} /> : stats?.totalInvoices || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Bills</Typography>
                      <Typography level="h3" fontWeight="bold">{loading ? <Skeleton width={60} /> : stats?.totalBills || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Completed</Typography>
                      <Typography level="h3" fontWeight="bold">{loading ? <Skeleton width={60} /> : stats?.completedRecurring || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Cancelled</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'neutral.600' }}>{loading ? <Skeleton width={60} /> : stats?.cancelledRecurring || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </AccordionGroup>

        {/* Filters */}
        <Card variant="outlined">
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Input
                placeholder="Search by name..."
                startDecorator={<Search size={18} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: 1 }}
              />
              <Select
                value={typeFilter}
                onChange={(_, value) => setTypeFilter(value as RecurringType | 'all')}
                startDecorator={<Filter size={18} />}
                sx={{ minWidth: 150 }}
              >
                <Option value="all">All Types</Option>
                <Option value="invoice">Invoices</Option>
                <Option value="bill">Bills</Option>
                <Option value="journal_entry">Journal Entries</Option>
                <Option value="transaction">Transactions</Option>
              </Select>
              <IconButton variant="outlined" onClick={loadData}>
                <RefreshCw size={18} />
              </IconButton>
            </Stack>
          </CardContent>
        </Card>

        {/* Recurring Transactions Table */}
        <Card variant="outlined">
          {loading ? (
            <FormTableSkeleton columns={8} rows={6} />
          ) : filteredTxns.length === 0 ? (
            <CardContent>
              <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
                <RefreshCw size={48} strokeWidth={1} />
                <Typography level="body-lg" sx={{ color: 'text.secondary' }}>
                  No recurring transactions yet.
                </Typography>
              </Stack>
            </CardContent>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Frequency</th>
                    <th>Customer/Vendor</th>
                    <th>Next Run</th>
                    <th>Runs</th>
                    <th>Status</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxns.map((rt) => (
                    <tr key={rt.id}>
                      <td>{rt.name}</td>
                      <td>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {TYPE_ICONS[rt.type]}
                          <span style={{ textTransform: 'capitalize' }}>{rt.type.replace('_', ' ')}</span>
                        </Stack>
                      </td>
                      <td>{FREQUENCIES.find(f => f.value === rt.frequency)?.label}</td>
                      <td>{rt.customerName || rt.vendorName || '-'}</td>
                      <td>
                        {rt.nextRunDate
                          ? format(rt.nextRunDate.toDate ? rt.nextRunDate.toDate() : new Date(rt.nextRunDate as unknown as string), 'MMM dd, yyyy')
                          : '-'}
                      </td>
                      <td>
                        {rt.totalRuns}
                        {rt.maxRuns ? ` / ${rt.maxRuns}` : ''}
                      </td>
                      <td>
                        <Chip size="sm" variant="soft" color={STATUS_COLORS[rt.status]}>
                          {rt.status.charAt(0).toUpperCase() + rt.status.slice(1)}
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
                            {/* Pause - only when active */}
                            {rt.status === 'active' && (
                              <MenuItem onClick={() => handlePause(rt)}>
                                <ListItemDecorator><Pause size={16} /></ListItemDecorator>
                                Pause
                              </MenuItem>
                            )}
                            {/* Resume - only when paused */}
                            {rt.status === 'paused' && (
                              <MenuItem onClick={() => handleResume(rt)}>
                                <ListItemDecorator><Play size={16} /></ListItemDecorator>
                                Resume
                              </MenuItem>
                            )}
                            {/* Cancel - when active or paused */}
                            {(rt.status === 'active' || rt.status === 'paused') && (
                              <>
                                <Divider />
                                <MenuItem color="warning" onClick={() => handleCancel(rt)}>
                                  <ListItemDecorator sx={{ color: 'inherit' }}><XCircle size={16} /></ListItemDecorator>
                                  Cancel
                                </MenuItem>
                              </>
                            )}
                            {/* Delete - only when cancelled or completed */}
                            {(rt.status === 'cancelled' || rt.status === 'completed') && (
                              <>
                                <Divider />
                                <MenuItem color="danger" onClick={() => handleDelete(rt)}>
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
            </Box>
          )}
        </Card>
      </Stack>

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => !saving && setModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          layout="center"
          sx={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'hidden', p: 0 }}
        >
          <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>
            New Recurring {modalType === 'invoice' ? 'Invoice' : 'Bill'}
          </DialogTitle>
          <ModalClose disabled={saving} />
          <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
            <Stack spacing={2.5}>
              <FormControl required>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="e.g., Monthly Rent Invoice"
                />
              </FormControl>

              {modalType === 'invoice' ? (
                <FormControl required>
                  <FormLabel>Customer</FormLabel>
                  <Autocomplete
                    placeholder="Select customer"
                    options={customers}
                    getOptionLabel={(option) => option.name}
                    value={customers.find((c) => c.id === formData.customerId) || null}
                    onChange={(_, value) => handleCustomerChange(value)}
                  />
                </FormControl>
              ) : (
                <FormControl required>
                  <FormLabel>Vendor</FormLabel>
                  <Autocomplete
                    placeholder="Select vendor"
                    options={vendors}
                    getOptionLabel={(option) => option.name}
                    value={vendors.find((v) => v.id === formData.vendorId) || null}
                    onChange={(_, value) => handleVendorChange(value)}
                  />
                </FormControl>
              )}

              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <FormControl required>
                    <FormLabel>Frequency</FormLabel>
                    <Select
                      value={formData.frequency}
                      onChange={(_, value) => handleFieldChange('frequency', value)}
                    >
                      {FREQUENCIES.map((f) => (
                        <Option key={f.value} value={f.value}>{f.label}</Option>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12} md={6}>
                  <FormControl required>
                    <FormLabel>Start Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleFieldChange('startDate', e.target.value)}
                    />
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <FormControl>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleFieldChange('endDate', e.target.value)}
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} md={6}>
                  <FormControl>
                    <FormLabel>Max Occurrences (Optional)</FormLabel>
                    <Input
                      type="number"
                      value={formData.maxRuns}
                      onChange={(e) => handleFieldChange('maxRuns', e.target.value)}
                      placeholder="Leave blank for unlimited"
                    />
                  </FormControl>
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Typography level="title-sm" sx={{ mb: 1.5 }}>Line Items</Typography>
                <Stack spacing={1.5}>
                  {formData.items.map((item, index) => (
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
                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          />
                        </FormControl>
                      </Grid>
                      <Grid xs={4} sm={2}>
                        <FormControl>
                          <FormLabel>Rate</FormLabel>
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                          />
                        </FormControl>
                      </Grid>
                      <Grid xs={3} sm={2}>
                        <FormControl>
                          <FormLabel>Amount</FormLabel>
                          <Input value={item.amount.toFixed(2)} disabled />
                        </FormControl>
                      </Grid>
                      <Grid xs={1}>
                        <IconButton
                          size="sm"
                          variant="plain"
                          color="danger"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                  <Button variant="outlined" color="neutral" size="sm" onClick={addItem} startDecorator={<Plus size={16} />}>
                    Add Item
                  </Button>
                </Stack>
              </Box>

              <Divider />

              <Grid container spacing={2}>
                <Grid xs={6} md={4}>
                  <FormControl>
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <Input
                      type="number"
                      value={formData.taxRate}
                      onChange={(e) => handleFieldChange('taxRate', Number(e.target.value))}
                    />
                  </FormControl>
                </Grid>
                <Grid xs={6} md={4}>
                  <FormControl>
                    <FormLabel>Discount</FormLabel>
                    <Input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => handleFieldChange('discount', Number(e.target.value))}
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} md={4}>
                  <FormControl>
                    <FormLabel>Due Days After Issue</FormLabel>
                    <Input
                      type="number"
                      value={formData.dueDays}
                      onChange={(e) => handleFieldChange('dueDays', Number(e.target.value))}
                    />
                  </FormControl>
                </Grid>
              </Grid>

              <AccordionGroup>
                <Accordion defaultExpanded={false}>
                  <AccordionSummary>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                      <Calculator size={18} />
                      <Typography level="body-sm" fontWeight={500}>
                        Subtotal: {company?.currency} {subtotal.toFixed(2)}
                      </Typography>
                      <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                      <Typography level="title-sm" fontWeight={600} color="primary">
                        Total: {company?.currency} {total.toFixed(2)}
                      </Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1} sx={{ pt: 1 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography level="body-sm">Subtotal:</Typography>
                        <Typography level="body-sm">{company?.currency} {subtotal.toFixed(2)}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography level="body-sm">Tax ({formData.taxRate}%):</Typography>
                        <Typography level="body-sm">{company?.currency} {taxAmount.toFixed(2)}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography level="body-sm">Discount:</Typography>
                        <Typography level="body-sm">-{company?.currency} {formData.discount.toFixed(2)}</Typography>
                      </Stack>
                      <Divider />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography level="title-md">Total per occurrence:</Typography>
                        <Typography level="title-md">{company?.currency} {total.toFixed(2)}</Typography>
                      </Stack>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </AccordionGroup>

              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  minRows={2}
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="Additional notes..."
                />
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button variant="outlined" color="neutral" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="solid"
              color="primary"
              onClick={handleSubmit}
              loading={saving}
              disabled={!formData.name || (modalType === 'invoice' && !formData.customerId) || (modalType === 'bill' && !formData.vendorId)}
            >
              Create
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </Container>
  );
}
