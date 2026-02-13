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
  FormControl,
  FormLabel,
  FormHelperText,
  Textarea,
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
import { getVendors, createVendor, updateVendor, deleteVendor } from '@/services/vendors';
import { Vendor } from '@/types';
import { LoadingSpinner, EmptyState, ConfirmDialog, PageBreadcrumbs, FormTableSkeleton } from '@/components/common';
import {
  Search, Mail, Phone, ChevronLeft, ChevronRight, Building2, CreditCard,
  Plus, Edit2, Trash2, MapPin, BarChart3, MoreVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
  'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia',
  'Czech Republic', 'Denmark', 'Egypt', 'Finland', 'France', 'Germany', 'Greece',
  'Hong Kong', 'Hungary', 'India', 'Indonesia', 'Ireland', 'Israel', 'Italy',
  'Japan', 'Kenya', 'Malaysia', 'Mexico', 'Netherlands', 'New Zealand', 'Nigeria',
  'Norway', 'Pakistan', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea',
  'Spain', 'Sweden', 'Switzerland', 'Taiwan', 'Thailand', 'Turkey', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Vietnam'
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

export default function VendorsPage() {
  const { user, loading: authLoading } = useAuth();
  const { company } = useCompany();
  const router = useRouter();

  // Data states
  const [vendors, setVendors] = useState<Vendor[]>([]);
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
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Modal states - Delete
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteVendor, setPendingDeleteVendor] = useState<Vendor | null>(null);
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
    fetchVendors();
  }, [company?.id]);

  const fetchVendors = async () => {
    if (!company?.id) return;

    try {
      const data = await getVendors(company.id);
      setVendors(data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to load vendors');
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
    const cities = vendors
      .map(v => v.city)
      .filter((city): city is string => !!city);
    return Array.from(new Set(cities)).sort();
  }, [vendors]);

  // Filter vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchesSearch =
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.phone?.includes(searchTerm);
      const matchesBalance =
        filterBalance === 'all' ||
        (filterBalance === 'outstanding' && v.outstandingBalance > 0) ||
        (filterBalance === 'none' && v.outstandingBalance === 0);
      const matchesCity = filterCity === 'all' || v.city === filterCity;
      return matchesSearch && matchesBalance && matchesCity;
    });
  }, [vendors, searchTerm, filterBalance, filterCity]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredVendors.length / rowsPerPage);
  const paginatedVendors = filteredVendors.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterBalance, filterCity]);

  const totalPayables = vendors.reduce((sum, v) => sum + v.outstandingBalance, 0);

  // Additional stats for expanded accordion
  const vendorStats = useMemo(() => {
    const withBalance = vendors.filter(v => v.outstandingBalance > 0);
    const withoutBalance = vendors.filter(v => v.outstandingBalance === 0);
    const totalBilled = vendors.reduce((sum, v) => sum + v.totalBilled, 0);
    const uniqueCountries = new Set(vendors.map(v => v.country).filter(Boolean));
    const uniqueCitiesCount = new Set(vendors.map(v => v.city).filter(Boolean)).size;

    return {
      withBalanceCount: withBalance.length,
      withoutBalanceCount: withoutBalance.length,
      avgPayable: vendors.length > 0 ? totalPayables / vendors.length : 0,
      highestBalance: Math.max(...vendors.map(v => v.outstandingBalance), 0),
      totalBilled,
      countriesCount: uniqueCountries.size,
      citiesCount: uniqueCitiesCount,
    };
  }, [vendors, totalPayables]);

  // Validation functions
  const validateForm = (data: typeof formData): boolean => {
    const newErrors = { name: '', email: '', phone: '' };
    let isValid = true;

    if (!data.name.trim()) {
      newErrors.name = 'Vendor name is required';
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

    setSaving(true);
    try {
      await createVendor(company.id, {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        country: formData.country || undefined,
        taxId: formData.taxId.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      await fetchVendors();
      setAddModalOpen(false);
      resetForm();
      toast.success('Vendor created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create vendor');
    } finally {
      setSaving(false);
    }
  };

  // Handle Edit - Open modal
  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      city: vendor.city || '',
      country: vendor.country || '',
      taxId: vendor.taxId || '',
      notes: vendor.notes || '',
    });
    setErrors({ name: '', email: '', phone: '' });
    setEditModalOpen(true);
  };

  // Handle Edit - Save
  const handleEdit = async () => {
    if (!company?.id || !editingVendor) return;
    if (!validateForm(formData)) return;

    setSaving(true);
    try {
      await updateVendor(company.id, editingVendor.id, {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        country: formData.country || undefined,
        taxId: formData.taxId.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      await fetchVendors();
      setEditModalOpen(false);
      setEditingVendor(null);
      resetForm();
      toast.success('Vendor updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update vendor');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete
  const openDeleteConfirm = (vendor: Vendor) => {
    if (vendor.outstandingBalance > 0) {
      toast.error('Cannot delete vendor with outstanding balance');
      return;
    }
    setPendingDeleteVendor(vendor);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!company?.id || !pendingDeleteVendor) return;

    setDeleting(true);
    try {
      await deleteVendor(company.id, pendingDeleteVendor.id);
      await fetchVendors();
      toast.success('Vendor deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete vendor');
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setPendingDeleteVendor(null);
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
    <Grid container spacing={2}>
      <Grid xs={12}>
        <FormControl required error={!!errors.name}>
          <FormLabel>Vendor Name</FormLabel>
          <Input
            placeholder="e.g., Office Supplies Inc."
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            color={errors.name ? 'danger' : undefined}
          />
          {errors.name && <FormHelperText sx={{ color: 'danger.500' }}>{errors.name}</FormHelperText>}
        </FormControl>
      </Grid>

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
          {errors.email && <FormHelperText sx={{ color: 'danger.500' }}>{errors.email}</FormHelperText>}
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
          {errors.phone && <FormHelperText sx={{ color: 'danger.500' }}>{errors.phone}</FormHelperText>}
        </FormControl>
      </Grid>

      <Grid xs={12}>
        <FormControl>
          <FormLabel>Address</FormLabel>
          <Input
            placeholder="Street address"
            value={formData.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            startDecorator={<MapPin size={16} />}
          />
        </FormControl>
      </Grid>

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
            {COUNTRIES.map(country => (
              <Option key={country} value={country}>{country}</Option>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid xs={12}>
        <FormControl>
          <FormLabel>Tax ID / VAT Number</FormLabel>
          <Input
            placeholder="Tax identification number"
            value={formData.taxId}
            onChange={(e) => handleFieldChange('taxId', e.target.value)}
          />
        </FormControl>
      </Grid>

      <Grid xs={12}>
        <FormControl>
          <FormLabel>Notes</FormLabel>
          <Textarea
            placeholder="Additional notes about this vendor"
            value={formData.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            minRows={2}
          />
        </FormControl>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Breadcrumbs */}
        <PageBreadcrumbs
          items={[
            { label: 'Vendors', icon: <Building2 size={14} /> },
          ]}
        />

        {/* Header */}
        <Box>
          <Typography level="h2" sx={{ mb: 0.5 }}>
            Vendors
          </Typography>
          <Typography level="body-md" sx={{ color: 'text.secondary' }}>
            Manage your vendors and suppliers
          </Typography>
        </Box>

        {/* Stats Cards */}
        <AccordionGroup>
          <Accordion defaultExpanded={false}>
            <AccordionSummary>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <BarChart3 size={18} />
                <Typography level="body-sm" fontWeight={500}>
                  Total Vendors: {loading ? '...' : vendors.length}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: 'danger.600' }}>
                  Total Payables: {loading ? '...' : formatCurrency(totalPayables)}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)', borderColor: 'primary.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Total Vendors</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                        {loading ? <Skeleton width={60} /> : vendors.length}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        {loading ? '...' : `${vendorStats.citiesCount} cities`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.08) 0%, rgba(211, 47, 47, 0.02) 100%)', borderColor: 'danger.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Total Payables</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'danger.700' }}>
                        {loading ? <Skeleton width={100} /> : formatCurrency(totalPayables)}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        {loading ? '...' : `${vendorStats.withBalanceCount} with balance`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(112, 143, 150, 0.08) 0%, rgba(112, 143, 150, 0.02) 100%)', borderColor: 'primary.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Paid Up</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                        {loading ? <Skeleton width={50} /> : vendorStats.withoutBalanceCount}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        No outstanding balance
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.02) 100%)', borderColor: 'secondary.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Total Billed</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={100} /> : formatCurrency(vendorStats.totalBilled)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Avg Payable</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={80} /> : formatCurrency(vendorStats.avgPayable)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Highest Balance</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={80} /> : formatCurrency(vendorStats.highestBalance)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Countries</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={50} /> : vendorStats.countriesCount}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>With Balance</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'warning.600' }}>
                        {loading ? <Skeleton width={50} /> : vendorStats.withBalanceCount}
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
                placeholder="Search vendors..."
                startDecorator={<Search size={18} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }}
              />
              <Select
                value={filterBalance}
                onChange={(_, value) => setFilterBalance(value || 'all')}
                sx={{ minWidth: 160 }}
              >
                <Option value="all">All Balances</Option>
                <Option value="outstanding">With Balance</Option>
                <Option value="none">No Balance</Option>
              </Select>
              {uniqueCities.length > 0 && (
                <Select
                  value={filterCity}
                  onChange={(_, value) => setFilterCity(value || 'all')}
                  sx={{ minWidth: 140 }}
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
              Add Vendor
            </Button>
          </Stack>
        </Card>

        {/* Vendors Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <FormTableSkeleton columns={6} rows={8} />
            ) : filteredVendors.length === 0 ? (
              <EmptyState type="vendors" />
            ) : (
              <Sheet sx={{ overflow: 'auto' }}>
                <Table stickyHeader>
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Contact</th>
                      <th>Location</th>
                      <th style={{ textAlign: 'right' }}>Total Billed</th>
                      <th style={{ textAlign: 'right' }}>Outstanding</th>
                      <th style={{ width: 100, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedVendors.map((vendor) => (
                      <tr key={vendor.id}>
                        <td>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar size="sm" color="neutral">
                              {vendor.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography level="body-sm" fontWeight={500}>
                                {vendor.name}
                              </Typography>
                              {vendor.taxId && (
                                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                  Tax ID: {vendor.taxId}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </td>
                        <td>
                          <Stack spacing={0.5}>
                            {vendor.email && (
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Mail size={12} />
                                <Typography level="body-xs">{vendor.email}</Typography>
                              </Stack>
                            )}
                            {vendor.phone && (
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Phone size={12} />
                                <Typography level="body-xs">{vendor.phone}</Typography>
                              </Stack>
                            )}
                            {!vendor.email && !vendor.phone && (
                              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>-</Typography>
                            )}
                          </Stack>
                        </td>
                        <td>
                          <Typography level="body-sm">
                            {[vendor.city, vendor.country].filter(Boolean).join(', ') || '-'}
                          </Typography>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Typography level="body-sm">
                            {formatCurrency(vendor.totalBilled)}
                          </Typography>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={vendor.outstandingBalance > 0 ? 'danger' : 'success'}
                          >
                            {formatCurrency(vendor.outstandingBalance)}
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
                              <MenuItem onClick={() => openEditModal(vendor)}>
                                <ListItemDecorator><Edit2 size={16} /></ListItemDecorator>
                                Edit
                              </MenuItem>
                              <Divider />
                              <MenuItem color="danger" onClick={() => openDeleteConfirm(vendor)}>
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
            {!loading && filteredVendors.length > 0 && (
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
                      {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filteredVendors.length)} of {filteredVendors.length}
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

      {/* Add Vendor Modal */}
      <Modal open={addModalOpen} onClose={() => !saving && setAddModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          layout="center"
          sx={{
            width: '100%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflow: 'hidden',
            p: 0,
          }}
        >
          <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>Add New Vendor</DialogTitle>
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
              Create Vendor
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Edit Vendor Modal */}
      <Modal open={editModalOpen} onClose={() => !saving && setEditModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          layout="center"
          sx={{
            width: '100%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflow: 'hidden',
            p: 0,
          }}
        >
          <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>Edit Vendor</DialogTitle>
          <ModalClose disabled={saving} />
          <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
            {renderFormFields()}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => { setEditModalOpen(false); setEditingVendor(null); resetForm(); }}
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
          setPendingDeleteVendor(null);
        }}
        onConfirm={handleDelete}
        title="Delete Vendor"
        description={`Are you sure you want to delete "${pendingDeleteVendor?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </Container>
  );
}
