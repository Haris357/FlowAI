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
  getQuotes,
  createQuote,
  updateQuote,
  deleteQuote,
  markQuoteSent,
  markQuoteAccepted,
  markQuoteRejected,
  getQuoteStats,
} from '@/services/quotes';
import { getCustomers } from '@/services/customers';
import { createInvoice } from '@/services/invoices';
import { convertQuoteToInvoice } from '@/services/quotes';
import { LoadingSpinner, PageBreadcrumbs, FormTableSkeleton } from '@/components/common';
import { Quote, QuoteItem, QuoteStatus, Customer } from '@/types';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  Calculator,
  BarChart3,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import StatusChangeModal from '@/components/StatusChangeModal';
import FormEntityDetailModal from '@/components/FormEntityDetailModal';
import { canEdit as canEditStatus, canDelete as canDeleteStatus, getStatusColor as getStatusMgmtColor, formatStatus } from '@/lib/status-management';

const STATUS_COLORS: Record<QuoteStatus, 'neutral' | 'primary' | 'success' | 'danger' | 'warning'> = {
  draft: 'neutral',
  sent: 'primary',
  accepted: 'success',
  rejected: 'danger',
  expired: 'warning',
  converted: 'success',
};

export default function QuotesPage() {
  const { user, loading: authLoading } = useAuth();
  const { company } = useCompany();
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [stats, setStats] = useState<any>(null);

  // Status change modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalQuote, setStatusModalQuote] = useState<Quote | null>(null);

  // Detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailQuote, setDetailQuote] = useState<Quote | null>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    expiryDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }] as QuoteItem[],
    taxRate: 0,
    discount: 0,
    notes: '',
    terms: '',
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
      const [quotesData, customersData, statsData] = await Promise.all([
        getQuotes(company.id),
        getCustomers(company.id),
        getQuoteStats(company.id),
      ]);
      setQuotes(quotesData);
      setCustomers(customersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading quotes:', error);
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
        customerEmail: customer.email || '',
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
      customerId: '',
      customerName: '',
      customerEmail: '',
      expiryDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      taxRate: 0,
      discount: 0,
      notes: '',
      terms: '',
    });
    setEditingQuote(null);
  };

  const handleSubmit = async () => {
    if (!company?.id || !formData.customerId || formData.items.length === 0) return;
    setSaving(true);
    try {
      if (editingQuote) {
        const { subtotal, taxAmount, total } = calculateTotals();
        await updateQuote(company.id, editingQuote.id, {
          customerId: formData.customerId,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          expiryDate: { toDate: () => new Date(formData.expiryDate) } as any,
          items: formData.items,
          subtotal,
          taxRate: formData.taxRate,
          taxAmount,
          discount: formData.discount,
          total,
          notes: formData.notes,
          terms: formData.terms,
        });
      } else {
        await createQuote(company.id, {
          customerId: formData.customerId,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          items: formData.items,
          expiryDate: new Date(formData.expiryDate),
          taxRate: formData.taxRate,
          discount: formData.discount,
          notes: formData.notes,
          terms: formData.terms,
        });
      }
      setModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving quote:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setFormData({
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail || '',
      expiryDate: format(quote.expiryDate.toDate ? quote.expiryDate.toDate() : new Date(quote.expiryDate as unknown as string), 'yyyy-MM-dd'),
      items: quote.items,
      taxRate: quote.taxRate,
      discount: quote.discount,
      notes: quote.notes || '',
      terms: quote.terms || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (quote: Quote) => {
    if (!company?.id || !confirm('Are you sure you want to delete this quote?')) return;
    try {
      await deleteQuote(company.id, quote.id);
      loadData();
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  };

  const handleSendQuote = async (quote: Quote) => {
    if (!company?.id) return;
    try {
      await markQuoteSent(company.id, quote.id);
      loadData();
    } catch (error) {
      console.error('Error sending quote:', error);
    }
  };

  const handleAcceptQuote = async (quote: Quote) => {
    if (!company?.id) return;
    try {
      await markQuoteAccepted(company.id, quote.id);
      loadData();
    } catch (error) {
      console.error('Error accepting quote:', error);
    }
  };

  const handleRejectQuote = async (quote: Quote) => {
    if (!company?.id) return;
    try {
      await markQuoteRejected(company.id, quote.id);
      loadData();
    } catch (error) {
      console.error('Error rejecting quote:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!company?.id) return;
    try {
      if (newStatus === 'sent') {
        await markQuoteSent(company.id, id);
      } else if (newStatus === 'accepted') {
        await markQuoteAccepted(company.id, id);
      } else if (newStatus === 'declined' || newStatus === 'rejected') {
        await markQuoteRejected(company.id, id);
      } else {
        // For any other status, use generic update
        await updateQuote(company.id, id, { status: newStatus as any });
      }
      const data = await getQuotes(company.id);
      setQuotes(data);
      toast.success(`Status updated to ${formatStatus('quote', newStatus)}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleConvertToInvoice = async (quote: Quote) => {
    if (!company?.id || !confirm('Convert this quote to an invoice?')) return;
    try {
      const invoiceId = await createInvoice(company.id, {
        customerId: quote.customerId,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        items: quote.items,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        taxRate: quote.taxRate,
        discount: quote.discount,
        notes: quote.notes,
        terms: quote.terms,
      });
      // Get the invoice number and update the quote
      await convertQuoteToInvoice(company.id, quote.id, invoiceId, ''); // Invoice number will be auto-generated
      loadData();
      alert('Quote converted to invoice successfully!');
    } catch (error) {
      console.error('Error converting quote:', error);
    }
  };

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
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
            { label: 'Quotes', icon: <FileText size={14} /> },
          ]}
        />

        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
          <Box>
            <Typography level="h2" sx={{ mb: 0.5 }}>Quotes & Estimates</Typography>
            <Typography level="body-md" sx={{ color: 'text.secondary' }}>
              Create and manage quotes for your customers.
            </Typography>
          </Box>
          <Button
            variant="solid"
            color="primary"
            startDecorator={<Plus size={18} />}
            onClick={() => { resetForm(); setModalOpen(true); }}
          >
            New Quote
          </Button>
        </Stack>

        {/* Stats Cards */}
        <AccordionGroup>
          <Accordion defaultExpanded={false}>
            <AccordionSummary>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <BarChart3 size={18} />
                <Typography level="body-sm" fontWeight={500}>
                  Total Quotes: {loading ? '...' : stats?.totalQuotes || 0}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: 'primary.600' }}>
                  Accepted: {loading ? '...' : stats?.totalAccepted || 0}
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
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Total Quotes</Typography>
                      <Typography level="h3" fontWeight="bold">{loading ? <Skeleton width={60} /> : stats?.totalQuotes || 0}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        {loading ? '...' : `${stats?.totalDraft || 0} drafts`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(46, 125, 50, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Accepted</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>{loading ? <Skeleton width={60} /> : stats?.totalAccepted || 0}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        {loading ? '...' : stats?.totalQuotes > 0 ? `${((stats?.totalAccepted || 0) / stats.totalQuotes * 100).toFixed(0)}% rate` : '0% rate'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(237, 108, 2, 0.08) 0%, rgba(237, 108, 2, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Pending</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'warning.700' }}>{loading ? <Skeleton width={60} /> : stats?.totalSent || 0}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        Awaiting response
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
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.08) 0%, rgba(211, 47, 47, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Rejected</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'danger.700' }}>{loading ? <Skeleton width={60} /> : stats?.totalRejected || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Expired</Typography>
                      <Typography level="h3" fontWeight="bold">{loading ? <Skeleton width={60} /> : stats?.totalExpired || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Converted</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.600' }}>{loading ? <Skeleton width={60} /> : stats?.totalConverted || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Accepted Value</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.600' }}>{loading ? <Skeleton width={100} /> : `${company?.currency} ${(stats?.acceptedValue || 0).toFixed(2)}`}</Typography>
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
                placeholder="Search quotes..."
                startDecorator={<Search size={18} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }}
              />
              <Select
                value={statusFilter}
                onChange={(_, value) => setStatusFilter(value as QuoteStatus | 'all')}
                startDecorator={<Filter size={18} />}
                sx={{ minWidth: 150 }}
              >
                <Option value="all">All Status</Option>
                <Option value="draft">Draft</Option>
                <Option value="sent">Sent</Option>
                <Option value="accepted">Accepted</Option>
                <Option value="rejected">Rejected</Option>
                <Option value="expired">Expired</Option>
                <Option value="converted">Converted</Option>
              </Select>
              <IconButton variant="outlined" onClick={loadData}>
                <RefreshCw size={18} />
              </IconButton>
            </Stack>
          </CardContent>
        </Card>

        {/* Quotes Table */}
        <Card variant="outlined">
          {loading ? (
            <CardContent sx={{ p: 0 }}>
              <FormTableSkeleton columns={7} />
            </CardContent>
          ) : filteredQuotes.length === 0 ? (
            <CardContent>
              <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
                <FileText size={48} strokeWidth={1} />
                <Typography level="body-lg" sx={{ color: 'text.secondary' }}>
                  {searchTerm || statusFilter !== 'all' ? 'No quotes match your filters.' : 'No quotes yet. Create your first quote!'}
                </Typography>
              </Stack>
            </CardContent>
          ) : (
            <Sheet sx={{ overflowX: 'auto' }}>
              <Table>
                <thead>
                  <tr>
                    <th>Quote #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Expiry</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th style={{ width: 150 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((quote) => (
                    <tr key={quote.id}>
                      <td>{quote.quoteNumber}</td>
                      <td>{quote.customerName}</td>
                      <td>{format(quote.issueDate.toDate ? quote.issueDate.toDate() : new Date(quote.issueDate as unknown as string), 'MMM dd, yyyy')}</td>
                      <td>{format(quote.expiryDate.toDate ? quote.expiryDate.toDate() : new Date(quote.expiryDate as unknown as string), 'MMM dd, yyyy')}</td>
                      <td>{company?.currency} {(quote.total || 0).toFixed(2)}</td>
                      <td>
                        <Chip
                          size="sm"
                          variant="soft"
                          color={getStatusMgmtColor('quote', quote.status)}
                          sx={{ cursor: 'pointer' }}
                          onClick={() => {
                            setStatusModalQuote(quote);
                            setStatusModalOpen(true);
                          }}
                        >
                          {formatStatus('quote', quote.status)}
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
                            <MenuItem onClick={() => { setDetailQuote(quote); setDetailModalOpen(true); }}>
                              <ListItemDecorator><Eye size={16} /></ListItemDecorator>
                              View Details
                            </MenuItem>
                            {quote.status === 'accepted' && !quote.convertedToInvoiceId && (
                              <MenuItem onClick={() => handleConvertToInvoice(quote)}>
                                <ListItemDecorator><ArrowRight size={16} /></ListItemDecorator>
                                Convert to Invoice
                              </MenuItem>
                            )}
                            {canEditStatus('quote', quote.status).allowed && (
                              <MenuItem onClick={() => handleEdit(quote)}>
                                <ListItemDecorator><Edit size={16} /></ListItemDecorator>
                                Edit
                              </MenuItem>
                            )}
                            {canDeleteStatus('quote', quote.status).allowed && (
                              <>
                                <Divider />
                                <MenuItem color="danger" onClick={() => handleDelete(quote)}>
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

      {/* Create/Edit Quote Modal */}
      <Modal open={modalOpen} onClose={() => !saving && setModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          layout="center"
          sx={{ width: '100%', maxWidth: { xs: '95vw', sm: 700 }, maxHeight: '90vh', overflow: 'hidden', p: 0 }}
        >
          <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>
            {editingQuote ? 'Edit Quote' : 'New Quote'}
          </DialogTitle>
          <ModalClose disabled={saving} />
          <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
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
                </Grid>
                <Grid xs={12} md={6}>
                  <FormControl required>
                    <FormLabel>Expiry Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
                    />
                  </FormControl>
                </Grid>
              </Grid>

              <Divider />

              {/* Line Items */}
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
              disabled={!formData.customerId || formData.items.length === 0}
            >
              {editingQuote ? 'Update Quote' : 'Create Quote'}
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Status Change Modal */}
      {statusModalQuote && (
        <StatusChangeModal
          open={statusModalOpen}
          onClose={() => { setStatusModalOpen(false); setStatusModalQuote(null); }}
          entityType="quote"
          entityId={statusModalQuote.id}
          entityName={statusModalQuote.quoteNumber}
          currentStatus={statusModalQuote.status}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Detail Modal */}
      <FormEntityDetailModal
        open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setDetailQuote(null); }}
        entityType="quote"
        entity={detailQuote}
        onEdit={(entity) => { setDetailModalOpen(false); handleEdit(entity as any); }}
        onDelete={(entity) => { setDetailModalOpen(false); handleDelete(entity as any); }}
      />
    </Container>
  );
}
