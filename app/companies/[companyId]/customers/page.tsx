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
  Avatar,
  Select,
  Option,
  IconButton,
  Skeleton,
  Button,
  Modal,
  ModalDialog,
  ModalClose,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  FormHelperText,
  Textarea,
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
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/services/customers';
import { Customer } from '@/types';
import { LoadingSpinner, EmptyState, ConfirmDialog, PageBreadcrumbs, FormTableSkeleton } from '@/components/common';
import {
  Search, Mail, Phone, ChevronLeft, ChevronRight, Users, DollarSign,
  Plus, Edit2, Trash2, MapPin, User, BarChart3, MoreVertical,
} from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import toast from 'react-hot-toast';

// Common countries list
const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
  'India', 'China', 'Japan', 'Brazil', 'Mexico', 'Spain', 'Italy', 'Netherlands',
  'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Belgium', 'Austria',
  'Ireland', 'Portugal', 'Poland', 'Russia', 'South Korea', 'Singapore', 'Hong Kong',
  'New Zealand', 'South Africa', 'United Arab Emirates', 'Saudi Arabia', 'Israel',
  'Turkey', 'Greece', 'Czech Republic', 'Hungary', 'Romania', 'Thailand', 'Malaysia',
  'Indonesia', 'Philippines', 'Vietnam', 'Pakistan', 'Bangladesh', 'Egypt', 'Nigeria',
  'Kenya', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela',
].sort();

// Validation helpers
const isValidEmail = (email: string) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone: string) => {
  if (!phone) return true;
  return /^[\d\s\-+()]{7,20}$/.test(phone);
};

export default function CustomersPage() {
  const { user, loading: authLoading } = useAuth();
  const { company } = useCompany();
  const { checkLimit, showUpgradeModal } = useSubscription();
  const router = useRouter();

  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBalance, setFilterBalance] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal states - Add
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal states - Edit
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Modal states - Delete
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteCustomer, setPendingDeleteCustomer] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    taxId: '',
    notes: '',
  });

  // Validation errors
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchCustomers();
  }, [company?.id]);

  const fetchCustomers = async () => {
    if (!company?.id) return;

    try {
      const data = await getCustomers(company.id);
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: company?.currency || 'USD',
    }).format(amount);
  };

  // Get unique cities for filter
  const uniqueCities = useMemo(() => {
    const cities = customers
      .map(c => c.city)
      .filter((city): city is string => !!city);
    return Array.from(new Set(cities)).sort();
  }, [customers]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm);
      const matchesBalance =
        filterBalance === 'all' ||
        (filterBalance === 'outstanding' && c.outstandingBalance > 0) ||
        (filterBalance === 'none' && c.outstandingBalance === 0);
      const matchesCity = filterCity === 'all' || c.city === filterCity;
      return matchesSearch && matchesBalance && matchesCity;
    });
  }, [customers, searchTerm, filterBalance, filterCity]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterBalance, filterCity]);

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  // Additional stats for expanded accordion
  const customerStats = useMemo(() => {
    const withBalance = customers.filter(c => c.outstandingBalance > 0);
    const withoutBalance = customers.filter(c => c.outstandingBalance === 0);
    const uniqueCountries = new Set(customers.map(c => c.country).filter(Boolean));
    const uniqueCitiesCount = new Set(customers.map(c => c.city).filter(Boolean)).size;

    return {
      withBalanceCount: withBalance.length,
      withoutBalanceCount: withoutBalance.length,
      avgOutstanding: customers.length > 0 ? totalOutstanding / customers.length : 0,
      highestBalance: Math.max(...customers.map(c => c.outstandingBalance), 0),
      countriesCount: uniqueCountries.size,
      citiesCount: uniqueCitiesCount,
    };
  }, [customers, totalOutstanding]);

  // Validation functions
  const validateForm = (data: typeof formData): boolean => {
    const newErrors = { name: '', email: '', phone: '' };
    let isValid = true;

    if (!data.name.trim()) {
      newErrors.name = 'Customer name is required';
      isValid = false;
    } else if (data.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
      isValid = false;
    } else if (data.name.trim().length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
      isValid = false;
    }

    if (data.email && !isValidEmail(data.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (data.phone && !isValidPhone(data.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      taxId: '',
      notes: '',
    });
    setErrors({ name: '', email: '', phone: '' });
  };

  // Handle Add
  const handleAdd = async () => {
    if (!company?.id) return;
    if (!validateForm(formData)) return;

    // Check plan limit
    const limitCheck = checkLimit('customers', customers.length);
    if (!limitCheck.allowed) {
      showUpgradeModal(limitCheck.reason || 'Customer limit reached. Please upgrade.');
      return;
    }

    setSaving(true);
    try {
      await createCustomer(company.id, {
        name: formData.name.trim(),
        email: formData.email.trim() || '',
        phone: formData.phone.trim() || '',
        address: formData.address.trim() || '',
        city: formData.city.trim() || '',
        country: formData.country || '',
        taxId: formData.taxId.trim() || '',
        notes: formData.notes.trim() || '',
      });

      await fetchCustomers();
      setAddModalOpen(false);
      resetForm();
      toast.success('Customer created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  // Handle Edit - Open modal
  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      country: customer.country || '',
      taxId: customer.taxId || '',
      notes: customer.notes || '',
    });
    setErrors({ name: '', email: '', phone: '' });
    setEditModalOpen(true);
  };

  // Handle Edit - Save
  const handleEdit = async () => {
    if (!company?.id || !editingCustomer) return;
    if (!validateForm(formData)) return;

    setSaving(true);
    try {
      await updateCustomer(company.id, editingCustomer.id, {
        name: formData.name.trim(),
        email: formData.email.trim() || '',
        phone: formData.phone.trim() || '',
        address: formData.address.trim() || '',
        city: formData.city.trim() || '',
        country: formData.country || '',
        taxId: formData.taxId.trim() || '',
        notes: formData.notes.trim() || '',
      });

      await fetchCustomers();
      setEditModalOpen(false);
      setEditingCustomer(null);
      resetForm();
      toast.success('Customer updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete
  const openDeleteConfirm = (customer: Customer) => {
    if (customer.outstandingBalance > 0) {
      toast.error('Cannot delete customer with outstanding balance');
      return;
    }
    setPendingDeleteCustomer(customer);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!company?.id || !pendingDeleteCustomer) return;

    setDeleting(true);
    try {
      await deleteCustomer(company.id, pendingDeleteCustomer.id);
      await fetchCustomers();
      toast.success('Customer deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete customer');
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setPendingDeleteCustomer(null);
    }
  };

  // Form field change handler
  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (authLoading || !user) {
    return <LoadingSpinner fullScreen />;
  }

  const renderFormFields = () => (
    <Stack spacing={2.5}>
      <FormControl required error={!!errors.name}>
        <FormLabel>Customer Name</FormLabel>
        <Input
          placeholder="e.g. Company Name"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          color={errors.name ? 'danger' : undefined}
          startDecorator={<User size={16} />}
        />
        {errors.name && <FormHelperText>{errors.name}</FormHelperText>}
      </FormControl>

      <Grid container spacing={2}>
        <Grid xs={12} sm={6}>
          <FormControl error={!!errors.email}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              color={errors.email ? 'danger' : undefined}
              startDecorator={<Mail size={16} />}
            />
            {errors.email && <FormHelperText>{errors.email}</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6}>
          <FormControl error={!!errors.phone}>
            <FormLabel>Phone</FormLabel>
            <Input
              placeholder="+1 234 567 8900"
              value={formData.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              color={errors.phone ? 'danger' : undefined}
              startDecorator={<Phone size={16} />}
            />
            {errors.phone && <FormHelperText>{errors.phone}</FormHelperText>}
          </FormControl>
        </Grid>
      </Grid>

      <FormControl>
        <FormLabel>Address</FormLabel>
        <Input
          placeholder="Street address"
          value={formData.address}
          onChange={(e) => handleFieldChange('address', e.target.value)}
          startDecorator={<MapPin size={16} />}
        />
      </FormControl>

      <Grid container spacing={2}>
        <Grid xs={12} sm={6}>
          <FormControl>
            <FormLabel>City</FormLabel>
            <Input
              placeholder="City"
              value={formData.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
            />
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6}>
          <FormControl>
            <FormLabel>Country</FormLabel>
            <Select
              placeholder="Select country"
              value={formData.country}
              onChange={(_, value) => handleFieldChange('country', value || '')}
              slotProps={{
                listbox: {
                  sx: { maxHeight: 250 }
                }
              }}
            >
              <Option value="">Select country</Option>
              {COUNTRIES.map(country => (
                <Option key={country} value={country}>{country}</Option>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <FormControl>
        <FormLabel>Tax ID / VAT Number</FormLabel>
        <Input
          placeholder="Tax identification number"
          value={formData.taxId}
          onChange={(e) => handleFieldChange('taxId', e.target.value)}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Notes</FormLabel>
        <Textarea
          placeholder="Additional notes about this customer"
          value={formData.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          minRows={2}
          maxRows={4}
        />
      </FormControl>
    </Stack>
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Stack spacing={3}>
        {/* Breadcrumbs */}
        <PageBreadcrumbs
          items={[
            { label: 'Customers', icon: <Users size={14} /> },
          ]}
        />

        {/* Header */}
        <Box>
          <Typography level="h2" sx={{ mb: 0.5 }}>
            Customers
          </Typography>
          <Typography level="body-md" sx={{ color: 'text.secondary' }}>
            Manage your customers and track their balances
          </Typography>
        </Box>

        {/* Stats Cards */}
        <AccordionGroup>
          <Accordion defaultExpanded={false}>
            <AccordionSummary>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <BarChart3 size={18} />
                <Typography level="body-sm" fontWeight={500}>
                  Customers: {loading ? '...' : customers.length}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: totalOutstanding > 0 ? 'warning.600' : 'text.primary' }}>
                  Outstanding: {loading ? '...' : formatCurrency(totalOutstanding)}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)', borderColor: 'primary.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Total Customers</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                        {loading ? <Skeleton width={50} /> : customers.length}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        {loading ? '...' : `${customerStats.citiesCount} cities`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(237, 108, 2, 0.08) 0%, rgba(237, 108, 2, 0.02) 100%)', borderColor: 'warning.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Outstanding</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: totalOutstanding > 0 ? 'warning.700' : 'text.primary' }}>
                        {loading ? <Skeleton width={80} /> : formatCurrency(totalOutstanding)}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        {loading ? '...' : `${customerStats.withBalanceCount} with balance`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(112, 143, 150, 0.08) 0%, rgba(112, 143, 150, 0.02) 100%)', borderColor: 'primary.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Paid Up</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                        {loading ? <Skeleton width={50} /> : customerStats.withoutBalanceCount}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        No outstanding balance
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.08) 0%, rgba(211, 47, 47, 0.02) 100%)', borderColor: 'danger.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>With Balance</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'danger.700' }}>
                        {loading ? <Skeleton width={50} /> : customerStats.withBalanceCount}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        Needs collection
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Avg Outstanding</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={80} /> : formatCurrency(customerStats.avgOutstanding)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Highest Balance</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={80} /> : formatCurrency(customerStats.highestBalance)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Countries</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={50} /> : customerStats.countriesCount}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Cities</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={50} /> : customerStats.citiesCount}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </AccordionGroup>

        {/* Action Bar */}
        <Card variant="outlined">
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              justifyContent="space-between"
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ flex: 1 }}
              >
                <Input
                  placeholder="Search customers..."
                  startDecorator={<Search size={18} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ minWidth: { sm: 250 } }}
                />
                <Select
                  value={filterBalance}
                  onChange={(_, value) => setFilterBalance(value || 'all')}
                  size="sm"
                  sx={{ minWidth: 140 }}
                >
                  <Option value="all">All Balances</Option>
                  <Option value="outstanding">With Balance</Option>
                  <Option value="none">No Balance</Option>
                </Select>
                {uniqueCities.length > 0 && (
                  <Select
                    value={filterCity}
                    onChange={(_, value) => setFilterCity(value || 'all')}
                    size="sm"
                    sx={{ minWidth: 120 }}
                  >
                    <Option value="all">All Cities</Option>
                    {uniqueCities.map(city => (
                      <Option key={city} value={city}>{city}</Option>
                    ))}
                  </Select>
                )}
              </Stack>
              <Button
                variant="solid"
                color="primary"
                startDecorator={<Plus size={18} />}
                onClick={() => { resetForm(); setAddModalOpen(true); }}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Add Customer
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card variant="outlined">
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <FormTableSkeleton columns={5} rows={8} />
            ) : filteredCustomers.length === 0 ? (
              <EmptyState type="customers" />
            ) : (
              <Sheet sx={{ overflowX: 'auto', borderRadius: 'md' }}>
                <Table
                  stickyHeader
                  sx={{
                    '& th, & td': { py: 1.5 },
                    minWidth: 700,
                  }}
                >
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th style={{ display: 'none' }} className="hide-mobile">Contact</th>
                      <th style={{ display: 'none' }} className="hide-mobile">Location</th>
                      <th style={{ textAlign: 'right' }}>Outstanding</th>
                      <th style={{ width: 100, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar size="sm" color="primary" variant="soft">
                              {customer.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography level="body-sm" fontWeight={600}>
                                {customer.name}
                              </Typography>
                              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                {customer.email || customer.phone || 'No contact info'}
                              </Typography>
                            </Box>
                          </Stack>
                        </td>
                        <td style={{ display: 'none' }} className="hide-mobile">
                          <Stack spacing={0.25}>
                            {customer.email && (
                              <Typography level="body-xs">{customer.email}</Typography>
                            )}
                            {customer.phone && (
                              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{customer.phone}</Typography>
                            )}
                          </Stack>
                        </td>
                        <td style={{ display: 'none' }} className="hide-mobile">
                          <Typography level="body-sm">
                            {[customer.city, customer.country].filter(Boolean).join(', ') || '-'}
                          </Typography>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={customer.outstandingBalance > 0 ? 'warning' : 'success'}
                          >
                            {formatCurrency(customer.outstandingBalance)}
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
                              <MenuItem onClick={() => openEditModal(customer)}>
                                <ListItemDecorator><Edit2 size={16} /></ListItemDecorator>
                                Edit
                              </MenuItem>
                              <Divider />
                              <MenuItem color="danger" onClick={() => openDeleteConfirm(customer)}>
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
            {!loading && filteredCustomers.length > 0 && (
              <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  spacing={1}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                      Show:
                    </Typography>
                    <Select
                      size="sm"
                      value={rowsPerPage}
                      onChange={(_, value) => {
                        setRowsPerPage(value || 10);
                        setPage(1);
                      }}
                      sx={{ minWidth: 70 }}
                    >
                      <Option value={10}>10</Option>
                      <Option value={25}>25</Option>
                      <Option value={50}>50</Option>
                    </Select>
                    <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                      {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filteredCustomers.length)} of {filteredCustomers.length}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton
                      size="sm"
                      variant="outlined"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft size={16} />
                    </IconButton>
                    <Typography level="body-xs" sx={{ px: 1 }}>
                      {page} / {totalPages || 1}
                    </Typography>
                    <IconButton
                      size="sm"
                      variant="outlined"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight size={16} />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Add Customer Modal */}
      <Modal open={addModalOpen} onClose={() => !saving && setAddModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          layout="center"
          sx={{
            width: '100%',
            maxWidth: { xs: '95vw', sm: 600 },
            maxHeight: { xs: '90vh', sm: '85vh' },
            overflowY: 'auto',
            p: 0,
          }}
        >
          <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>
            Add New Customer
          </DialogTitle>
          <ModalClose disabled={saving} />
          <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
            {renderFormFields()}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => { setAddModalOpen(false); resetForm(); }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="primary"
              onClick={handleAdd}
              loading={saving}
              disabled={!formData.name.trim()}
            >
              Create Customer
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal open={editModalOpen} onClose={() => !saving && setEditModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          layout="center"
          sx={{
            width: '100%',
            maxWidth: { xs: '95vw', sm: 600 },
            maxHeight: { xs: '90vh', sm: '85vh' },
            overflowY: 'auto',
            p: 0,
          }}
        >
          <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>
            Edit Customer
          </DialogTitle>
          <ModalClose disabled={saving} />
          <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
            {renderFormFields()}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => { setEditModalOpen(false); setEditingCustomer(null); resetForm(); }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="primary"
              onClick={handleEdit}
              loading={saving}
              disabled={!formData.name.trim()}
            >
              Save Changes
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setPendingDeleteCustomer(null);
        }}
        onConfirm={handleDelete}
        title="Delete Customer"
        description={`Are you sure you want to delete "${pendingDeleteCustomer?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />

    </Container>
  );
}
