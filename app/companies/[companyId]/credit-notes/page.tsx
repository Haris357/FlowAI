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
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
  ListItemDecorator,
} from '@mui/joy';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getCreditNotes,
  createCreditNote,
  updateCreditNote,
  deleteCreditNote,
  issueCreditNote,
  voidCreditNote,
  getCreditNoteStats,
  getDebitNotes,
  createDebitNote,
  updateDebitNote,
  deleteDebitNote,
  issueDebitNote,
  voidDebitNote,
} from '@/services/creditNotes';
import { getCustomers } from '@/services/customers';
import { getVendors } from '@/services/vendors';
import { getInvoices } from '@/services/invoices';
import { getBills } from '@/services/bills';
import { LoadingSpinner, PageBreadcrumbs, FormTableSkeleton } from '@/components/common';
import { CreditNote, CreditNoteItem, CreditNoteStatus, DebitNote, DebitNoteStatus, Customer, Vendor, Invoice, Bill } from '@/types';
import {
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  FileText,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Users,
  Building2,
  Calculator,
  BarChart3,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import StatusChangeModal from '@/components/StatusChangeModal';
import FormEntityDetailModal from '@/components/FormEntityDetailModal';
import { canEdit as canEditStatus, canDelete as canDeleteStatus, getStatusColor as getStatusMgmtColor, formatStatus, EntityType } from '@/lib/status-management';

const CN_STATUS_COLORS: Record<CreditNoteStatus, 'neutral' | 'primary' | 'success' | 'danger' | 'warning'> = {
  draft: 'neutral',
  issued: 'primary',
  applied: 'success',
  partial: 'warning',
  refunded: 'success',
  void: 'danger',
};

const DN_STATUS_COLORS: Record<DebitNoteStatus, 'neutral' | 'primary' | 'success' | 'danger' | 'warning'> = {
  draft: 'neutral',
  issued: 'primary',
  applied: 'warning',
  partial: 'warning',
  settled: 'success',
  void: 'danger',
};

const REASONS = [
  { value: 'return', label: 'Goods Return' },
  { value: 'discount', label: 'Discount' },
  { value: 'error', label: 'Billing Error' },
  { value: 'other', label: 'Other' },
];

export default function CreditNotesPage() {
  const { user, loading: authLoading } = useAuth();
  const { company } = useCompany();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'credit' | 'debit'>('credit');
  const [editingNote, setEditingNote] = useState<CreditNote | DebitNote | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<any>(null);

  // Status change modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalEntity, setStatusModalEntity] = useState<any>(null);
  const [statusModalEntityType, setStatusModalEntityType] = useState<EntityType>('creditNote');

  // Detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailEntity, setDetailEntity] = useState<any>(null);
  const [detailEntityType, setDetailEntityType] = useState<EntityType>('creditNote');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    vendorId: '',
    vendorName: '',
    vendorEmail: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }] as CreditNoteItem[],
    taxRate: 0,
    reason: 'return' as 'return' | 'discount' | 'error' | 'other',
    reasonDescription: '',
    originalInvoiceId: '',
    originalInvoiceNumber: '',
    originalBillId: '',
    originalBillNumber: '',
    notes: '',
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
      const [cnData, dnData, customersData, vendorsData, invoicesData, billsData, statsData] = await Promise.all([
        getCreditNotes(company.id),
        getDebitNotes(company.id),
        getCustomers(company.id),
        getVendors(company.id),
        getInvoices(company.id),
        getBills(company.id),
        getCreditNoteStats(company.id),
      ]);
      setCreditNotes(cnData);
      setDebitNotes(dnData);
      setCustomers(customersData);
      setVendors(vendorsData);
      setInvoices(invoicesData);
      setBills(billsData);
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
    if (formErrors[field]) {
      setFormErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const handleCustomerChange = (customer: Customer | null) => {
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email || '',
      }));
      if (formErrors.customerId) {
        setFormErrors((prev) => { const next = { ...prev }; delete next.customerId; return next; });
      }
    }
  };

  const handleVendorChange = (vendor: Vendor | null) => {
    if (vendor) {
      setFormData((prev) => ({
        ...prev,
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorEmail: vendor.email || '',
      }));
      if (formErrors.vendorId) {
        setFormErrors((prev) => { const next = { ...prev }; delete next.vendorId; return next; });
      }
    }
  };

  const handleInvoiceChange = (invoice: Invoice | null) => {
    if (invoice) {
      setFormData((prev) => ({
        ...prev,
        originalInvoiceId: invoice.id,
        originalInvoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail || '',
      }));
    }
  };

  const handleBillChange = (bill: Bill | null) => {
    if (bill) {
      setFormData((prev) => ({
        ...prev,
        originalBillId: bill.id,
        originalBillNumber: bill.billNumber || '',
        vendorId: bill.vendorId || '',
        vendorName: bill.vendorName,
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
    if (formErrors.items) {
      setFormErrors((prev) => { const next = { ...prev }; delete next.items; return next; });
    }
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
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      customerEmail: '',
      vendorId: '',
      vendorName: '',
      vendorEmail: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      taxRate: 0,
      reason: 'return',
      reasonDescription: '',
      originalInvoiceId: '',
      originalInvoiceNumber: '',
      originalBillId: '',
      originalBillNumber: '',
      notes: '',
    });
    setFormErrors({});
    setEditingNote(null);
  };

  const openCreateModal = (type: 'credit' | 'debit') => {
    resetForm();
    setModalType(type);
    setModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (modalType === 'credit') {
      if (!formData.customerId) errors.customerId = 'Please select a customer';
    } else {
      if (!formData.vendorId) errors.vendorId = 'Please select a vendor';
    }

    if (!formData.date) errors.date = 'Date is required';

    if (!formData.reason) errors.reason = 'Please select a reason';

    const validItems = formData.items.filter(
      (item) => item.description.trim() && item.rate > 0
    );
    if (validItems.length === 0) errors.items = 'Add at least one line item';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!company?.id) return;
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (modalType === 'credit') {
        if (editingNote) {
          await updateCreditNote(company.id, editingNote.id, {
            customerId: formData.customerId,
            customerName: formData.customerName,
            customerEmail: formData.customerEmail,
            items: formData.items,
            taxRate: formData.taxRate,
            reason: formData.reason,
            reasonDescription: formData.reasonDescription,
            originalInvoiceId: formData.originalInvoiceId,
            originalInvoiceNumber: formData.originalInvoiceNumber,
            notes: formData.notes,
          } as any);
        } else {
          await createCreditNote(company.id, {
            customerId: formData.customerId,
            customerName: formData.customerName,
            customerEmail: formData.customerEmail,
            items: formData.items,
            taxRate: formData.taxRate,
            reason: formData.reason,
            reasonDescription: formData.reasonDescription,
            originalInvoiceId: formData.originalInvoiceId,
            originalInvoiceNumber: formData.originalInvoiceNumber,
            notes: formData.notes,
          });
        }
      } else {
        if (editingNote) {
          await updateDebitNote(company.id, editingNote.id, {
            vendorId: formData.vendorId,
            vendorName: formData.vendorName,
            vendorEmail: formData.vendorEmail,
            items: formData.items,
            taxRate: formData.taxRate,
            reason: formData.reason,
            reasonDescription: formData.reasonDescription,
            originalBillId: formData.originalBillId,
            originalBillNumber: formData.originalBillNumber,
            notes: formData.notes,
          } as any);
        } else {
          await createDebitNote(company.id, {
            vendorId: formData.vendorId,
            vendorName: formData.vendorName,
            vendorEmail: formData.vendorEmail,
            items: formData.items,
            taxRate: formData.taxRate,
            reason: formData.reason,
            reasonDescription: formData.reasonDescription,
            originalBillId: formData.originalBillId,
            originalBillNumber: formData.originalBillNumber,
            notes: formData.notes,
          });
        }
      }
      setModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditCN = (cn: CreditNote) => {
    setEditingNote(cn);
    setModalType('credit');
    setFormData({
      customerId: cn.customerId,
      customerName: cn.customerName,
      customerEmail: cn.customerEmail || '',
      vendorId: '',
      vendorName: '',
      vendorEmail: '',
      date: cn.date?.toDate ? format(cn.date.toDate(), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      items: cn.items,
      taxRate: cn.taxRate,
      reason: cn.reason,
      reasonDescription: cn.reasonDescription || '',
      originalInvoiceId: cn.originalInvoiceId || '',
      originalInvoiceNumber: cn.originalInvoiceNumber || '',
      originalBillId: '',
      originalBillNumber: '',
      notes: cn.notes || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleEditDN = (dn: DebitNote) => {
    setEditingNote(dn);
    setModalType('debit');
    setFormData({
      customerId: '',
      customerName: '',
      customerEmail: '',
      vendorId: dn.vendorId,
      vendorName: dn.vendorName,
      vendorEmail: dn.vendorEmail || '',
      date: dn.date?.toDate ? format(dn.date.toDate(), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      items: dn.items,
      taxRate: dn.taxRate,
      reason: dn.reason,
      reasonDescription: dn.reasonDescription || '',
      originalInvoiceId: '',
      originalInvoiceNumber: '',
      originalBillId: dn.originalBillId || '',
      originalBillNumber: dn.originalBillNumber || '',
      notes: dn.notes || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleDeleteCN = async (cn: CreditNote) => {
    if (!company?.id || !confirm('Delete this credit note?')) return;
    try {
      await deleteCreditNote(company.id, cn.id);
      loadData();
    } catch (error) {
      console.error('Error deleting credit note:', error);
    }
  };

  const handleDeleteDN = async (dn: DebitNote) => {
    if (!company?.id || !confirm('Delete this debit note?')) return;
    try {
      await deleteDebitNote(company.id, dn.id);
      loadData();
    } catch (error) {
      console.error('Error deleting debit note:', error);
    }
  };

  const handleIssueCN = async (cn: CreditNote) => {
    if (!company?.id) return;
    try {
      await issueCreditNote(company.id, cn.id);
      loadData();
    } catch (error) {
      console.error('Error issuing credit note:', error);
    }
  };

  const handleIssueDN = async (dn: DebitNote) => {
    if (!company?.id) return;
    try {
      await issueDebitNote(company.id, dn.id);
      loadData();
    } catch (error) {
      console.error('Error issuing debit note:', error);
    }
  };

  const handleVoidCN = async (cn: CreditNote) => {
    if (!company?.id || !confirm('Void this credit note?')) return;
    try {
      await voidCreditNote(company.id, cn.id);
      loadData();
    } catch (error) {
      console.error('Error voiding credit note:', error);
    }
  };

  const handleVoidDN = async (dn: DebitNote) => {
    if (!company?.id || !confirm('Void this debit note?')) return;
    try {
      await voidDebitNote(company.id, dn.id);
      loadData();
    } catch (error) {
      console.error('Error voiding debit note:', error);
    }
  };

  const handleCNStatusChange = async (id: string, newStatus: string) => {
    if (!company?.id) return;
    await updateCreditNote(company.id, id, { status: newStatus as CreditNoteStatus });
    const data = await getCreditNotes(company.id);
    setCreditNotes(data);
    toast.success(`Status updated to ${formatStatus('creditNote', newStatus)}`);
  };

  const handleDNStatusChange = async (id: string, newStatus: string) => {
    if (!company?.id) return;
    await updateDebitNote(company.id, id, { status: newStatus as DebitNoteStatus });
    const data = await getDebitNotes(company.id);
    setDebitNotes(data);
    toast.success(`Status updated to ${formatStatus('debitNote', newStatus)}`);
  };

  const filteredCNs = creditNotes.filter((cn) =>
    cn.creditNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cn.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDNs = debitNotes.filter((dn) =>
    dn.debitNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dn.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { subtotal, taxAmount, total } = calculateTotals();

  if (authLoading || !user) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Stack spacing={3}>
        {/* Breadcrumbs */}
        <PageBreadcrumbs
          items={[
            { label: 'Credit Notes', icon: <FileText size={14} /> },
          ]}
        />

        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
          <Box>
            <Typography level="h2" sx={{ mb: 0.5 }}>Credit & Debit Notes</Typography>
            <Typography level="body-md" sx={{ color: 'text.secondary' }}>
              Manage credit notes for customers and debit notes for vendors.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="primary"
              startDecorator={<Plus size={18} />}
              onClick={() => openCreateModal('credit')}
            >
              Credit Note
            </Button>
            <Button
              variant="solid"
              color="primary"
              startDecorator={<Plus size={18} />}
              onClick={() => openCreateModal('debit')}
            >
              Debit Note
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
                  Credit Notes: {loading ? '...' : stats?.totalCreditNotes || 0}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: 'primary.600' }}>
                  Debit Notes: {loading ? '...' : stats?.totalDebitNotes || 0}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} color="primary">
                  Credit: {loading ? '...' : `${company?.currency} ${(stats?.availableCreditValue || 0).toFixed(2)}`}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Credit Notes</Typography>
                      <Typography level="h3" fontWeight="bold">{loading ? <Skeleton width={60} /> : stats?.totalCreditNotes || 0}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        For customers
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(46, 125, 50, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Debit Notes</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>{loading ? <Skeleton width={60} /> : stats?.totalDebitNotes || 0}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        From vendors
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(237, 108, 2, 0.08) 0%, rgba(237, 108, 2, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Available Credit</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'warning.700' }}>{loading ? <Skeleton width={100} /> : `${company?.currency} ${(stats?.availableCreditValue || 0).toFixed(2)}`}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Available Debit</Typography>
                      <Typography level="h3" fontWeight="bold">{loading ? <Skeleton width={100} /> : `${company?.currency} ${(stats?.availableDebitValue || 0).toFixed(2)}`}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>CN Issued</Typography>
                      <Typography level="h3" fontWeight="bold">{loading ? <Skeleton width={60} /> : stats?.totalCNIssued || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>CN Applied</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.600' }}>{loading ? <Skeleton width={60} /> : stats?.totalCNApplied || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Total CN Value</Typography>
                      <Typography level="h3" fontWeight="bold">{loading ? <Skeleton width={100} /> : `${company?.currency} ${(stats?.totalCreditValue || 0).toFixed(2)}`}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Total DN Value</Typography>
                      <Typography level="h3" fontWeight="bold">{loading ? <Skeleton width={100} /> : `${company?.currency} ${(stats?.totalDebitValue || 0).toFixed(2)}`}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </AccordionGroup>

        {/* Search */}
        <Card variant="outlined">
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" sx={{ mb: 0 }}>
              <Input
                placeholder="Search notes..."
                startDecorator={<Search size={18} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }}
              />
              <IconButton variant="outlined" onClick={loadData}>
                <RefreshCw size={18} />
              </IconButton>
            </Stack>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value as number)}>
          <TabList>
            <Tab>
              <Stack direction="row" spacing={1} alignItems="center">
                <Users size={16} />
                <span>Credit Notes ({creditNotes.length})</span>
              </Stack>
            </Tab>
            <Tab>
              <Stack direction="row" spacing={1} alignItems="center">
                <Building2 size={16} />
                <span>Debit Notes ({debitNotes.length})</span>
              </Stack>
            </Tab>
          </TabList>

          {/* Credit Notes Tab */}
          <TabPanel value={0}>
            <Card variant="outlined">
              {loading ? (
                <CardContent sx={{ p: 0 }}>
                  <FormTableSkeleton columns={6} />
                </CardContent>
              ) : filteredCNs.length === 0 ? (
                <CardContent>
                  <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
                    <FileText size={48} strokeWidth={1} />
                    <Typography level="body-lg" sx={{ color: 'text.secondary' }}>
                      No credit notes yet.
                    </Typography>
                  </Stack>
                </CardContent>
              ) : (
                <Sheet sx={{ overflowX: 'auto' }}>
                  <Table>
                    <thead>
                      <tr>
                        <th>Note #</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Reason</th>
                        <th>Amount</th>
                        <th>Remaining</th>
                        <th>Status</th>
                        <th style={{ width: 120 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCNs.map((cn) => (
                        <tr key={cn.id}>
                          <td>{cn.creditNoteNumber}</td>
                          <td>{cn.customerName}</td>
                          <td>{format(cn.date.toDate ? cn.date.toDate() : new Date(cn.date as unknown as string), 'MMM dd, yyyy')}</td>
                          <td>{REASONS.find(r => r.value === cn.reason)?.label || cn.reason}</td>
                          <td>{company?.currency} {cn.total.toFixed(2)}</td>
                          <td>{company?.currency} {cn.remainingCredit.toFixed(2)}</td>
                          <td>
                            <Chip
                              size="sm"
                              variant="soft"
                              color={getStatusMgmtColor('creditNote', cn.status)}
                              onClick={() => {
                                setStatusModalEntity(cn);
                                setStatusModalEntityType('creditNote');
                                setStatusModalOpen(true);
                              }}
                              sx={{ cursor: 'pointer' }}
                            >
                              {formatStatus('creditNote', cn.status)}
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
                                <MenuItem onClick={() => {
                                  setDetailEntity(cn);
                                  setDetailEntityType('creditNote');
                                  setDetailModalOpen(true);
                                }}>
                                  <ListItemDecorator><Eye size={16} /></ListItemDecorator>
                                  View Details
                                </MenuItem>
                                {canEditStatus('creditNote', cn.status).allowed && (
                                  <MenuItem onClick={() => handleEditCN(cn)}>
                                    <ListItemDecorator><Edit2 size={16} /></ListItemDecorator>
                                    Edit
                                  </MenuItem>
                                )}
                                {canDeleteStatus('creditNote', cn.status).allowed && (
                                  <>
                                    <Divider />
                                    <MenuItem color="danger" onClick={() => handleDeleteCN(cn)}>
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
            </Card>
          </TabPanel>

          {/* Debit Notes Tab */}
          <TabPanel value={1}>
            <Card variant="outlined">
              {loading ? (
                <CardContent sx={{ p: 0 }}>
                  <FormTableSkeleton columns={6} />
                </CardContent>
              ) : filteredDNs.length === 0 ? (
                <CardContent>
                  <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
                    <FileText size={48} strokeWidth={1} />
                    <Typography level="body-lg" sx={{ color: 'text.secondary' }}>
                      No debit notes yet.
                    </Typography>
                  </Stack>
                </CardContent>
              ) : (
                <Sheet sx={{ overflowX: 'auto' }}>
                  <Table>
                    <thead>
                      <tr>
                        <th>Note #</th>
                        <th>Vendor</th>
                        <th>Date</th>
                        <th>Reason</th>
                        <th>Amount</th>
                        <th>Remaining</th>
                        <th>Status</th>
                        <th style={{ width: 120 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDNs.map((dn) => (
                        <tr key={dn.id}>
                          <td>{dn.debitNoteNumber}</td>
                          <td>{dn.vendorName}</td>
                          <td>{format(dn.date.toDate ? dn.date.toDate() : new Date(dn.date as unknown as string), 'MMM dd, yyyy')}</td>
                          <td>{REASONS.find(r => r.value === dn.reason)?.label || dn.reason}</td>
                          <td>{company?.currency} {dn.total.toFixed(2)}</td>
                          <td>{company?.currency} {dn.remainingBalance.toFixed(2)}</td>
                          <td>
                            <Chip
                              size="sm"
                              variant="soft"
                              color={getStatusMgmtColor('debitNote', dn.status)}
                              onClick={() => {
                                setStatusModalEntity(dn);
                                setStatusModalEntityType('debitNote');
                                setStatusModalOpen(true);
                              }}
                              sx={{ cursor: 'pointer' }}
                            >
                              {formatStatus('debitNote', dn.status)}
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
                                <MenuItem onClick={() => {
                                  setDetailEntity(dn);
                                  setDetailEntityType('debitNote');
                                  setDetailModalOpen(true);
                                }}>
                                  <ListItemDecorator><Eye size={16} /></ListItemDecorator>
                                  View Details
                                </MenuItem>
                                {canEditStatus('debitNote', dn.status).allowed && (
                                  <MenuItem onClick={() => handleEditDN(dn)}>
                                    <ListItemDecorator><Edit2 size={16} /></ListItemDecorator>
                                    Edit
                                  </MenuItem>
                                )}
                                {canDeleteStatus('debitNote', dn.status).allowed && (
                                  <>
                                    <Divider />
                                    <MenuItem color="danger" onClick={() => handleDeleteDN(dn)}>
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
            </Card>
          </TabPanel>
        </Tabs>
      </Stack>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => !saving && setModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          layout="center"
          sx={{ width: '100%', maxWidth: { xs: '95vw', sm: 600 }, maxHeight: '90vh', overflow: 'hidden', p: 0 }}
        >
          <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>
            {editingNote ? `Edit ${modalType === 'credit' ? 'Credit' : 'Debit'} Note` : `New ${modalType === 'credit' ? 'Credit' : 'Debit'} Note`}
          </DialogTitle>
          <ModalClose disabled={saving} />
          <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
            <Stack spacing={2.5}>
              {modalType === 'credit' ? (
                <Grid container spacing={2}>
                  <Grid xs={12} md={6}>
                    <FormControl required error={!!formErrors.customerId}>
                      <FormLabel>Customer</FormLabel>
                      <Autocomplete
                        placeholder="Select customer"
                        options={customers}
                        getOptionLabel={(option) => option.name}
                        value={customers.find((c) => c.id === formData.customerId) || null}
                        onChange={(_, value) => handleCustomerChange(value)}
                      />
                      {formErrors.customerId && <FormHelperText>{formErrors.customerId}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  <Grid xs={12} md={6}>
                    <FormControl>
                      <FormLabel>Original Invoice</FormLabel>
                      <Autocomplete
                        placeholder="Select invoice (optional)"
                        options={invoices.filter(inv => inv.customerId === formData.customerId)}
                        getOptionLabel={(option) => option.invoiceNumber}
                        value={invoices.find((i) => i.id === formData.originalInvoiceId) || null}
                        onChange={(_, value) => handleInvoiceChange(value)}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid xs={12} md={6}>
                    <FormControl required error={!!formErrors.vendorId}>
                      <FormLabel>Vendor</FormLabel>
                      <Autocomplete
                        placeholder="Select vendor"
                        options={vendors}
                        getOptionLabel={(option) => option.name}
                        value={vendors.find((v) => v.id === formData.vendorId) || null}
                        onChange={(_, value) => handleVendorChange(value)}
                      />
                      {formErrors.vendorId && <FormHelperText>{formErrors.vendorId}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  <Grid xs={12} md={6}>
                    <FormControl>
                      <FormLabel>Original Bill</FormLabel>
                      <Autocomplete
                        placeholder="Select bill (optional)"
                        options={bills.filter(bill => bill.vendorId === formData.vendorId)}
                        getOptionLabel={(option) => option.billNumber || option.id}
                        value={bills.find((b) => b.id === formData.originalBillId) || null}
                        onChange={(_, value) => handleBillChange(value)}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              )}

              <Grid container spacing={2}>
                <Grid xs={12} md={4}>
                  <FormControl required error={!!formErrors.date}>
                    <FormLabel>Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleFieldChange('date', e.target.value)}
                      color={formErrors.date ? 'danger' : undefined}
                    />
                    {formErrors.date && <FormHelperText>{formErrors.date}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid xs={12} md={4}>
                  <FormControl required error={!!formErrors.reason}>
                    <FormLabel>Reason</FormLabel>
                    <Select
                      value={formData.reason}
                      onChange={(_, value) => handleFieldChange('reason', value)}
                      color={formErrors.reason ? 'danger' : undefined}
                    >
                      {REASONS.map((r) => (
                        <Option key={r.value} value={r.value}>{r.label}</Option>
                      ))}
                    </Select>
                    {formErrors.reason && <FormHelperText>{formErrors.reason}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid xs={12} md={4}>
                  <FormControl>
                    <FormLabel>Reason Description</FormLabel>
                    <Input
                      value={formData.reasonDescription}
                      onChange={(e) => handleFieldChange('reasonDescription', e.target.value)}
                      placeholder="Additional details..."
                    />
                  </FormControl>
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography level="title-sm">Line Items</Typography>
                  {formErrors.items && <FormHelperText sx={{ color: 'danger.500', m: 0 }}>{formErrors.items}</FormHelperText>}
                </Stack>
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

              <FormControl>
                <FormLabel>Tax Rate (%)</FormLabel>
                <Input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => handleFieldChange('taxRate', Number(e.target.value))}
                  sx={{ maxWidth: 150 }}
                />
              </FormControl>

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
                      <Divider />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography level="title-md">Total:</Typography>
                        <Typography level="title-md" fontWeight="bold" color="primary">{company?.currency} {total.toFixed(2)}</Typography>
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
            >
              {editingNote ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {statusModalEntity && (
        <StatusChangeModal
          open={statusModalOpen}
          onClose={() => { setStatusModalOpen(false); setStatusModalEntity(null); }}
          entityType={statusModalEntityType}
          entityId={statusModalEntity.id}
          entityName={statusModalEntity.creditNoteNumber || statusModalEntity.debitNoteNumber || ''}
          currentStatus={statusModalEntity.status}
          onStatusChange={statusModalEntityType === 'creditNote' ? handleCNStatusChange : handleDNStatusChange}
        />
      )}

      <FormEntityDetailModal
        open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setDetailEntity(null); }}
        entityType={detailEntityType}
        entity={detailEntity}
        currencySymbol={company?.currency || '$'}
        onEdit={(entity) => {
          setDetailModalOpen(false);
          if (detailEntityType === 'creditNote') {
            handleEditCN(entity as CreditNote);
          } else {
            handleEditDN(entity as DebitNote);
          }
        }}
        onDelete={(entity) => {
          setDetailModalOpen(false);
          if (detailEntityType === 'creditNote') {
            handleDeleteCN(entity as CreditNote);
          } else {
            handleDeleteDN(entity as DebitNote);
          }
        }}
      />
    </Container>
  );
}
