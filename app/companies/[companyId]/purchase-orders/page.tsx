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
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  markPOSent,
  markPOConfirmed,
  recordGoodsReceived,
  getPOStats,
} from '@/services/purchaseOrders';
import { getVendors } from '@/services/vendors';
import { createBill } from '@/services/bills';
import { convertPOToBill } from '@/services/purchaseOrders';
import { LoadingSpinner, PageBreadcrumbs, FormTableSkeleton } from '@/components/common';
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus, Vendor } from '@/types';
import { SUPPORTED_CURRENCIES } from '@/services/exchangeRates';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Send,
  CheckCircle,
  Package,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  Calculator,
  BarChart3,
  Eye,
  MoreVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import StatusChangeModal from '@/components/StatusChangeModal';
import FormEntityDetailModal from '@/components/FormEntityDetailModal';
import { canEdit as canEditStatus, canDelete as canDeleteStatus, getStatusColor as getStatusMgmtColor, formatStatus } from '@/lib/status-management';

const STATUS_COLORS: Record<PurchaseOrderStatus, 'neutral' | 'primary' | 'success' | 'danger' | 'warning'> = {
  draft: 'neutral',
  sent: 'primary',
  confirmed: 'warning',
  partial: 'warning',
  received: 'success',
  cancelled: 'danger',
  converted: 'success',
};

export default function PurchaseOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { company } = useCompany();
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');
  const [stats, setStats] = useState<any>(null);

  // Status change modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalPO, setStatusModalPO] = useState<PurchaseOrder | null>(null);

  // Detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailPO, setDetailPO] = useState<PurchaseOrder | null>(null);

  // Send PO email
  const [sendingPoId, setSendingPoId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    vendorId: '',
    vendorName: '',
    vendorEmail: '',
    expectedDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    items: [{ description: '', quantity: 1, rate: 0, amount: 0, receivedQuantity: 0 }] as PurchaseOrderItem[],
    taxRate: 0,
    discount: 0,
    shippingAddress: '',
    notes: '',
    terms: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  // Multi-currency
  const [poCurrency, setPoCurrency] = useState('');
  const [poExchangeRate, setPoExchangeRate] = useState<number>(1);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const [posData, vendorsData, statsData] = await Promise.all([
        getPurchaseOrders(company.id),
        getVendors(company.id),
        getPOStats(company.id),
      ]);
      setPurchaseOrders(posData);
      setVendors(vendorsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (company?.id) {
      loadData();
      fetch(`/api/exchange-rates?companyId=${company.id}`)
        .then(r => r.json())
        .then(d => { if (d.rates) setExchangeRates(d.rates); })
        .catch(() => {});
    }
  }, [company?.id]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.vendorId) {
      errors.vendorId = 'Vendor is required';
    }
    const validItems = formData.items.filter((item) => item.description.trim() !== '' && item.rate > 0);
    if (validItems.length === 0) {
      errors.items = 'Add at least one line item with description and rate';
    } else {
      const itemWithMissingRate = formData.items.find((item) => item.description.trim() !== '' && item.rate === 0);
      if (itemWithMissingRate) {
        errors.items = 'Rate is required for all items';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
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
      const vend = vendor as any;
      const cur = vend.currency || company?.currency || 'USD';
      setPoCurrency(cur);
      const base = company?.currency || 'USD';
      setPoExchangeRate(cur === base ? 1 : (exchangeRates[cur] ?? 1));
      if (formErrors.vendorId) {
        setFormErrors((prev) => { const next = { ...prev }; delete next.vendorId; return next; });
      }
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
      items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0, receivedQuantity: 0 }],
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
      vendorId: '',
      vendorName: '',
      vendorEmail: '',
      expectedDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      items: [{ description: '', quantity: 1, rate: 0, amount: 0, receivedQuantity: 0 }],
      taxRate: 0,
      discount: 0,
      shippingAddress: '',
      notes: '',
      terms: '',
    });
    setFormErrors({});
    setEditingPO(null);
    setPoCurrency(company?.currency || 'USD');
    setPoExchangeRate(1);
  };

  const handleSubmit = async () => {
    if (!company?.id) return;
    if (!validateForm()) return;
    setSaving(true);
    const baseCurrency = company?.currency || 'USD';
    const docCurrency = poCurrency || baseCurrency;
    const exchRate = docCurrency === baseCurrency ? 1 : (poExchangeRate || 1);
    try {
      if (editingPO) {
        const { subtotal, taxAmount, total } = calculateTotals();
        await updatePurchaseOrder(company.id, editingPO.id, {
          vendorId: formData.vendorId,
          vendorName: formData.vendorName,
          vendorEmail: formData.vendorEmail,
          expectedDate: formData.expectedDate ? { toDate: () => new Date(formData.expectedDate) } as any : null,
          items: formData.items,
          subtotal,
          taxRate: formData.taxRate,
          taxAmount,
          discount: formData.discount,
          total,
          shippingAddress: formData.shippingAddress,
          notes: formData.notes,
          terms: formData.terms,
          currency: docCurrency,
          exchangeRate: exchRate,
          totalInBaseCurrency: total * exchRate,
        });
      } else {
        await createPurchaseOrder(company.id, {
          vendorId: formData.vendorId,
          vendorName: formData.vendorName,
          vendorEmail: formData.vendorEmail,
          items: formData.items,
          expectedDate: formData.expectedDate ? new Date(formData.expectedDate) : undefined,
          taxRate: formData.taxRate,
          discount: formData.discount,
          shippingAddress: formData.shippingAddress,
          notes: formData.notes,
          terms: formData.terms,
          currency: docCurrency,
          exchangeRate: exchRate,
        });
      }
      setModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving purchase order:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (po: PurchaseOrder) => {
    setEditingPO(po);
    setFormData({
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      vendorEmail: po.vendorEmail || '',
      expectedDate: po.expectedDate ? format(po.expectedDate.toDate ? po.expectedDate.toDate() : new Date(po.expectedDate as unknown as string), 'yyyy-MM-dd') : '',
      items: po.items,
      taxRate: po.taxRate,
      discount: po.discount,
      shippingAddress: po.shippingAddress || '',
      notes: po.notes || '',
      terms: po.terms || '',
    });
    setPoCurrency(po.currency || company?.currency || 'USD');
    setPoExchangeRate(po.exchangeRate ?? 1);
    setModalOpen(true);
  };

  const handleDelete = async (po: PurchaseOrder) => {
    if (!company?.id || !confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      await deletePurchaseOrder(company.id, po.id);
      loadData();
    } catch (error) {
      console.error('Error deleting purchase order:', error);
    }
  };

  const handleSendPO = async (po: PurchaseOrder) => {
    if (!company?.id) return;
    try {
      await markPOSent(company.id, po.id);
      loadData();
    } catch (error) {
      console.error('Error sending PO:', error);
    }
  };

  const handleSendPOEmail = async (po: PurchaseOrder) => {
    if (!company?.id) return;
    setSendingPoId(po.id);
    try {
      const res = await fetch('/api/purchase-orders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id, poId: po.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');
      toast.success('Purchase order sent to vendor');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send purchase order email');
    } finally {
      setSendingPoId(null);
    }
  };

  const handleConfirmPO = async (po: PurchaseOrder) => {
    if (!company?.id) return;
    try {
      await markPOConfirmed(company.id, po.id);
      loadData();
    } catch (error) {
      console.error('Error confirming PO:', error);
    }
  };

  const handleReceiveGoods = async (po: PurchaseOrder) => {
    if (!company?.id || !confirm('Mark all items as received?')) return;
    try {
      const receivedItems = po.items.map((item, index) => ({
        index,
        quantity: item.quantity - (item.receivedQuantity || 0),
      }));
      await recordGoodsReceived(company.id, po.id, receivedItems);
      loadData();
    } catch (error) {
      console.error('Error receiving goods:', error);
    }
  };

  const handleConvertToBill = async (po: PurchaseOrder) => {
    if (!company?.id || !confirm('Convert this purchase order to a bill?')) return;
    try {
      const billId = await createBill(company.id, {
        vendorId: po.vendorId,
        vendorName: po.vendorName,
        items: po.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        taxAmount: po.taxAmount,
        notes: po.notes,
      });
      await convertPOToBill(company.id, po.id, billId, '');
      loadData();
      alert('Purchase order converted to bill successfully!');
    } catch (error) {
      console.error('Error converting PO to bill:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!company?.id) return;
    try {
      // Delegate to specific service functions based on the target status
      if (newStatus === 'sent') {
        await markPOSent(company.id, id);
      } else if (newStatus === 'confirmed') {
        await markPOConfirmed(company.id, id);
      } else if (newStatus === 'received') {
        // Find the PO to calculate received items
        const po = purchaseOrders.find(p => p.id === id);
        if (po) {
          const receivedItems = po.items.map((item, index) => ({
            index,
            quantity: item.quantity - (item.receivedQuantity || 0),
          }));
          await recordGoodsReceived(company.id, id, receivedItems);
        }
      } else if (newStatus === 'cancelled') {
        const { cancelPurchaseOrder } = await import('@/services/purchaseOrders');
        await cancelPurchaseOrder(company.id, id);
      } else {
        // Generic fallback using updatePurchaseOrder
        await updatePurchaseOrder(company.id, id, { status: newStatus as any });
      }
      const data = await getPurchaseOrders(company.id);
      setPurchaseOrders(data);
      const statsData = await getPOStats(company.id);
      setStats(statsData);
      toast.success(`Status updated to ${formatStatus('purchaseOrder', newStatus)}`);
    } catch (error) {
      console.error('Error changing PO status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteClick = (po: PurchaseOrder) => {
    handleDelete(po);
  };

  // Build a map of vendorId -> email for quick lookup
  const vendorEmailMap = vendors.reduce((map, vendor) => {
    if (vendor.email) map[vendor.id] = vendor.email;
    return map;
  }, {} as Record<string, string>);

  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            { label: 'Purchase Orders', icon: <Package size={14} /> },
          ]}
        />

        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
          <Box>
            <Typography level="h2" sx={{ mb: 0.5 }}>Purchase Orders</Typography>
            <Typography level="body-md" sx={{ color: 'text.secondary' }}>
              Create and manage purchase orders for your vendors.
            </Typography>
          </Box>
          <Button
            variant="solid"
            color="primary"
            startDecorator={<Plus size={18} />}
            onClick={() => { resetForm(); setModalOpen(true); }}
          >
            New Purchase Order
          </Button>
        </Stack>

        {/* Stats Cards */}
        <AccordionGroup>
          <Accordion defaultExpanded={false}>
            <AccordionSummary>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <BarChart3 size={18} />
                <Typography level="body-sm" fontWeight={500}>
                  Total POs: {loading ? '...' : stats?.totalPOs || 0}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: 'warning.600' }}>
                  Pending: {loading ? '...' : (stats?.totalSent || 0) + (stats?.totalConfirmed || 0)}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} color="primary">
                  Value: {loading ? '...' : `${company?.currency} ${(stats?.totalValue || 0).toFixed(2)}`}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Total POs</Typography>
                      <Typography level="h3" fontWeight="bold">{loading ? <Skeleton width={60} /> : stats?.totalPOs || 0}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        {loading ? '...' : `${stats?.totalDraft || 0} drafts`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(237, 108, 2, 0.08) 0%, rgba(237, 108, 2, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Pending</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'warning.700' }}>{loading ? <Skeleton width={60} /> : (stats?.totalSent || 0) + (stats?.totalConfirmed || 0)}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        Awaiting receipt
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(46, 125, 50, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Received</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>{loading ? <Skeleton width={60} /> : stats?.totalReceived || 0}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        Goods delivered
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Total Value</Typography>
                      <Typography level="h3" fontWeight="bold">{loading ? <Skeleton width={100} /> : `${company?.currency} ${(stats?.totalValue || 0).toFixed(2)}`}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Draft</Typography>
                      <Typography level="h3" fontWeight="bold">{loading ? <Skeleton width={60} /> : stats?.totalDraft || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Confirmed</Typography>
                      <Typography level="h3" fontWeight="bold">{loading ? <Skeleton width={60} /> : stats?.totalConfirmed || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Converted to Bill</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.600' }}>{loading ? <Skeleton width={60} /> : stats?.totalConverted || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.08) 0%, rgba(211, 47, 47, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Cancelled</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'danger.600' }}>{loading ? <Skeleton width={60} /> : stats?.totalCancelled || 0}</Typography>
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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" sx={{ mb: 0 }}>
              <Input
                placeholder="Search purchase orders..."
                startDecorator={<Search size={18} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }}
              />
              <Select
                value={statusFilter}
                onChange={(_, value) => setStatusFilter(value as PurchaseOrderStatus | 'all')}
                startDecorator={<Filter size={18} />}
                sx={{ minWidth: 150 }}
              >
                <Option value="all">All Status</Option>
                <Option value="draft">Draft</Option>
                <Option value="sent">Sent</Option>
                <Option value="confirmed">Confirmed</Option>
                <Option value="partial">Partial</Option>
                <Option value="received">Received</Option>
                <Option value="converted">Converted</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
              <IconButton variant="outlined" onClick={loadData}>
                <RefreshCw size={18} />
              </IconButton>
            </Stack>
          </CardContent>
        </Card>

        {/* Purchase Orders Table */}
        <Card variant="outlined">
          {loading ? (
            <CardContent sx={{ p: 0 }}>
              <FormTableSkeleton columns={7} />
            </CardContent>
          ) : filteredPOs.length === 0 ? (
            <CardContent>
              <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
                <FileText size={48} strokeWidth={1} />
                <Typography level="body-lg" sx={{ color: 'text.secondary' }}>
                  {searchTerm || statusFilter !== 'all' ? 'No purchase orders match your filters.' : 'No purchase orders yet. Create your first PO!'}
                </Typography>
              </Stack>
            </CardContent>
          ) : (
            <Sheet sx={{ overflowX: 'auto' }}>
              <Table>
                <thead>
                  <tr>
                    <th>PO #</th>
                    <th>Vendor</th>
                    <th>Date</th>
                    <th>Expected</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th style={{ width: 150 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPOs.map((po) => (
                    <tr key={po.id}>
                      <td>{po.poNumber}</td>
                      <td>{po.vendorName}</td>
                      <td>{format(po.issueDate.toDate ? po.issueDate.toDate() : new Date(po.issueDate as unknown as string), 'MMM dd, yyyy')}</td>
                      <td>{po.expectedDate ? format(po.expectedDate.toDate ? po.expectedDate.toDate() : new Date(po.expectedDate as unknown as string), 'MMM dd, yyyy') : '-'}</td>
                      <td>{company?.currency} {po.total.toFixed(2)}</td>
                      <td>
                        <Chip
                          size="sm"
                          variant="soft"
                          color={getStatusMgmtColor('purchaseOrder', po.status)}
                          onClick={() => { setStatusModalPO(po); setStatusModalOpen(true); }}
                          sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                        >
                          {formatStatus('purchaseOrder', po.status)}
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
                            <MenuItem onClick={() => { setDetailPO(po); setDetailModalOpen(true); }}>
                              <ListItemDecorator><Eye size={16} /></ListItemDecorator>
                              View Details
                            </MenuItem>
                            {(po.status === 'draft' || po.status === 'sent') && (po.vendorEmail || vendorEmailMap[po.vendorId]) && (
                              <MenuItem
                                onClick={() => handleSendPOEmail(po)}
                                disabled={sendingPoId === po.id}
                              >
                                <ListItemDecorator><Send size={16} /></ListItemDecorator>
                                {sendingPoId === po.id ? 'Sending...' : 'Send PO'}
                              </MenuItem>
                            )}
                            {po.status === 'received' && (
                              <MenuItem onClick={() => handleConvertToBill(po)}>
                                <ListItemDecorator><ArrowRight size={16} /></ListItemDecorator>
                                Convert to Bill
                              </MenuItem>
                            )}
                            {canEditStatus('purchaseOrder', po.status).allowed && (
                              <MenuItem onClick={() => handleEdit(po)}>
                                <ListItemDecorator><Edit size={16} /></ListItemDecorator>
                                Edit
                              </MenuItem>
                            )}
                            {canDeleteStatus('purchaseOrder', po.status).allowed && (
                              <>
                                <Divider />
                                <MenuItem color="danger" onClick={() => handleDelete(po)}>
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
      </Stack>

      {/* Create/Edit PO Modal */}
      <Modal open={modalOpen} onClose={() => !saving && setModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          layout="center"
          sx={{ width: '100%', maxWidth: { xs: '95vw', sm: 700 }, maxHeight: '90vh', overflow: 'hidden', p: 0 }}
        >
          <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>
            {editingPO ? 'Edit Purchase Order' : 'New Purchase Order'}
          </DialogTitle>
          <ModalClose disabled={saving} />
          <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
            <Stack spacing={2.5}>
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
                    <FormLabel>Expected Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.expectedDate}
                      onChange={(e) => handleFieldChange('expectedDate', e.target.value)}
                    />
                  </FormControl>
                </Grid>
              </Grid>

              <FormControl>
                <FormLabel>Shipping Address</FormLabel>
                <Textarea
                  minRows={2}
                  value={formData.shippingAddress}
                  onChange={(e) => handleFieldChange('shippingAddress', e.target.value)}
                  placeholder="Delivery address..."
                />
              </FormControl>

              {/* Currency row */}
              {(() => {
                const baseCur = company?.currency || 'USD';
                const docCur = poCurrency || baseCur;
                const isDifferent = docCur !== baseCur;
                return (
                  <Grid container spacing={2} alignItems="flex-end">
                    <Grid xs={12} sm={isDifferent ? 5 : 6}>
                      <FormControl>
                        <FormLabel>PO Currency</FormLabel>
                        <Select size="sm" value={poCurrency || baseCur} onChange={(_, v) => {
                          const c = v || baseCur;
                          setPoCurrency(c);
                          setPoExchangeRate(c === baseCur ? 1 : (exchangeRates[c] ?? 1));
                        }}>
                          {Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => (
                            <Option key={code} value={code}>{info.symbol} {code} — {info.name}</Option>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    {isDifferent && (
                      <Grid xs={12} sm={7}>
                        <FormControl>
                          <FormLabel>Exchange Rate (1 {docCur} = ? {baseCur})</FormLabel>
                          <Input size="sm" type="number" value={poExchangeRate}
                            onChange={(e) => setPoExchangeRate(parseFloat(e.target.value) || 1)}
                            endDecorator={<Typography level="body-xs">{baseCur}</Typography>}
                          />
                        </FormControl>
                      </Grid>
                    )}
                  </Grid>
                );
              })()}

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
                  {formErrors.items && (
                    <Typography level="body-sm" sx={{ color: 'danger.500', mt: 0.5 }}>
                      {formErrors.items}
                    </Typography>
                  )}
                </Stack>
              </Box>

              <Divider />

              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <FormControl>
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <Input
                      type="number"
                      value={formData.taxRate}
                      onChange={(e) => handleFieldChange('taxRate', Number(e.target.value))}
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} md={6}>
                  <FormControl>
                    <FormLabel>Discount</FormLabel>
                    <Input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => handleFieldChange('discount', Number(e.target.value))}
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
                        <Typography level="title-md">Total:</Typography>
                        <Typography level="title-md" fontWeight="bold" color="primary">{company?.currency} {total.toFixed(2)}</Typography>
                      </Stack>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </AccordionGroup>

              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <FormControl>
                    <FormLabel>Notes</FormLabel>
                    <Textarea
                      minRows={2}
                      value={formData.notes}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      placeholder="Additional notes..."
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} md={6}>
                  <FormControl>
                    <FormLabel>Terms</FormLabel>
                    <Textarea
                      minRows={2}
                      value={formData.terms}
                      onChange={(e) => handleFieldChange('terms', e.target.value)}
                      placeholder="Terms and conditions..."
                    />
                  </FormControl>
                </Grid>
              </Grid>
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
              {editingPO ? 'Update PO' : 'Create PO'}
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Status Change Modal */}
      {statusModalPO && (
        <StatusChangeModal
          open={statusModalOpen}
          onClose={() => { setStatusModalOpen(false); setStatusModalPO(null); }}
          entityType="purchaseOrder"
          entityId={statusModalPO.id}
          entityName={statusModalPO.poNumber}
          currentStatus={statusModalPO.status}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Detail Modal */}
      <FormEntityDetailModal
        open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setDetailPO(null); }}
        entityType="purchaseOrder"
        entity={detailPO}
        currencySymbol={company?.currency}
        onEdit={(entity) => { setDetailModalOpen(false); handleEdit(entity as PurchaseOrder); }}
        onDelete={(entity) => { setDetailModalOpen(false); handleDeleteClick(entity as PurchaseOrder); }}
      />
    </Container>
  );
}
