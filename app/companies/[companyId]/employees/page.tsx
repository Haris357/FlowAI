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
  Switch,
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
import {
  getEmployees, createEmployee, updateEmployee, deleteEmployee,
  generateEmployeeId,
} from '@/services/employees';
import { Employee } from '@/types';
import { LoadingSpinner, EmptyState, ConfirmDialog, PageBreadcrumbs, FormTableSkeleton } from '@/components/common';
import {
  Search, Mail, Phone, ChevronLeft, ChevronRight, Users, DollarSign,
  Plus, Edit2, Trash2, Briefcase, Calendar, BarChart3, MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useSettingsCategory } from '@/hooks';
import { Timestamp } from 'firebase/firestore';

// Validation helpers
const isValidEmail = (email: string) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone: string) => {
  if (!phone) return true;
  return /^[\d\s\-+()]{7,20}$/.test(phone);
};

export default function EmployeesPage() {
  const { user, loading: authLoading } = useAuth();
  const { company } = useCompany();
  const router = useRouter();

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Get dynamic settings
  const { getLabel: getStatusLabel } = useSettingsCategory(company?.id, 'employee_status');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal states - Add
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal states - Edit
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Modal states - Delete
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteEmployee, setPendingDeleteEmployee] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    designation: '',
    department: '',
    salary: '',
    salaryType: 'monthly' as 'monthly' | 'hourly',
    joiningDate: format(new Date(), 'yyyy-MM-dd'),
    bankName: '',
    bankAccount: '',
    taxId: '',
    isActive: true,
  });

  // Validation errors
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    salary: '',
    joiningDate: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchEmployees();
  }, [company?.id]);

  const fetchEmployees = async () => {
    if (!company?.id) return;

    try {
      const data = await getEmployees(company.id);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
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

  const formatDate = (date: any) => {
    if (!date) return '-';
    const d = date?.toDate ? date.toDate() : new Date(date);
    return format(d, 'MMM dd, yyyy');
  };

  // Get unique departments for filter
  const uniqueDepartments = useMemo(() => {
    const departments = employees
      .map(e => e.department)
      .filter((dept): dept is string => !!dept);
    return Array.from(new Set(departments)).sort();
  }, [employees]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchesSearch =
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.designation?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && e.isActive) ||
        (filterStatus === 'inactive' && !e.isActive);
      const matchesDepartment = filterDepartment === 'all' || e.department === filterDepartment;
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [employees, searchTerm, filterStatus, filterDepartment]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus, filterDepartment]);

  const activeEmployees = employees.filter(e => e.isActive);
  const totalMonthlyPayroll = activeEmployees.reduce((sum, e) => sum + e.salary, 0);

  // Additional stats for expanded accordion
  const employeeStats = useMemo(() => {
    const inactive = employees.filter(e => !e.isActive);
    const uniqueDepts = new Set(employees.map(e => e.department).filter(Boolean));
    const salaries = employees.map(e => e.salary);
    const avgSalary = employees.length > 0 ? salaries.reduce((a, b) => a + b, 0) / employees.length : 0;
    const highestSalary = Math.max(...salaries, 0);
    const lowestSalary = salaries.length > 0 ? Math.min(...salaries) : 0;

    return {
      totalCount: employees.length,
      inactiveCount: inactive.length,
      departmentsCount: uniqueDepts.size,
      avgSalary,
      highestSalary,
      lowestSalary,
    };
  }, [employees]);

  // Validation functions
  const validateForm = (data: typeof formData): boolean => {
    const newErrors = { name: '', email: '', phone: '', salary: '', joiningDate: '' };
    let isValid = true;

    if (!data.name.trim()) {
      newErrors.name = 'Employee name is required';
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

    const salaryNum = parseFloat(data.salary);
    if (!data.salary || isNaN(salaryNum)) {
      newErrors.salary = 'Salary is required';
      isValid = false;
    } else if (salaryNum <= 0) {
      newErrors.salary = 'Salary must be a positive number';
      isValid = false;
    }

    if (!data.joiningDate) {
      newErrors.joiningDate = 'Joining date is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Reset form
  const resetForm = async () => {
    const newEmployeeId = company?.id ? await generateEmployeeId(company.id) : '';
    setFormData({
      employeeId: newEmployeeId,
      name: '',
      email: '',
      phone: '',
      address: '',
      designation: '',
      department: '',
      salary: '',
      salaryType: 'monthly',
      joiningDate: format(new Date(), 'yyyy-MM-dd'),
      bankName: '',
      bankAccount: '',
      taxId: '',
      isActive: true,
    });
    setErrors({ name: '', email: '', phone: '', salary: '', joiningDate: '' });
  };

  // Handle Add
  const handleAdd = async () => {
    if (!company?.id) return;
    if (!validateForm(formData)) return;

    setSaving(true);
    try {
      await createEmployee(company.id, {
        employeeId: formData.employeeId || await generateEmployeeId(company.id),
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        designation: formData.designation.trim() || undefined,
        department: formData.department.trim() || undefined,
        salary: parseFloat(formData.salary),
        salaryType: formData.salaryType,
        joiningDate: Timestamp.fromDate(new Date(formData.joiningDate)),
        bankName: formData.bankName.trim() || undefined,
        bankAccount: formData.bankAccount.trim() || undefined,
        taxId: formData.taxId.trim() || undefined,
        isActive: formData.isActive,
      });

      await fetchEmployees();
      setAddModalOpen(false);
      await resetForm();
      toast.success('Employee created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create employee');
    } finally {
      setSaving(false);
    }
  };

  // Handle Edit - Open modal
  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    const joiningDate = employee.joiningDate?.toDate
      ? format(employee.joiningDate.toDate(), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');
    setFormData({
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      designation: employee.designation || '',
      department: employee.department || '',
      salary: employee.salary.toString(),
      salaryType: employee.salaryType || 'monthly',
      joiningDate,
      bankName: employee.bankName || '',
      bankAccount: employee.bankAccount || '',
      taxId: employee.taxId || '',
      isActive: employee.isActive,
    });
    setErrors({ name: '', email: '', phone: '', salary: '', joiningDate: '' });
    setEditModalOpen(true);
  };

  // Handle Edit - Save
  const handleEdit = async () => {
    if (!company?.id || !editingEmployee) return;
    if (!validateForm(formData)) return;

    setSaving(true);
    try {
      await updateEmployee(company.id, editingEmployee.id, {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        designation: formData.designation.trim() || undefined,
        department: formData.department.trim() || undefined,
        salary: parseFloat(formData.salary),
        salaryType: formData.salaryType,
        joiningDate: Timestamp.fromDate(new Date(formData.joiningDate)),
        bankName: formData.bankName.trim() || undefined,
        bankAccount: formData.bankAccount.trim() || undefined,
        taxId: formData.taxId.trim() || undefined,
        isActive: formData.isActive,
      });

      await fetchEmployees();
      setEditModalOpen(false);
      setEditingEmployee(null);
      await resetForm();
      toast.success('Employee updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete
  const openDeleteConfirm = (employee: Employee) => {
    setPendingDeleteEmployee(employee);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!company?.id || !pendingDeleteEmployee) return;

    setDeleting(true);
    try {
      await deleteEmployee(company.id, pendingDeleteEmployee.id);
      await fetchEmployees();
      toast.success('Employee deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete employee');
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setPendingDeleteEmployee(null);
    }
  };

  // Form field change handler
  const handleFieldChange = (field: keyof typeof formData, value: any) => {
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
      <Grid xs={12} sm={4}>
        <FormControl>
          <FormLabel>Employee ID</FormLabel>
          <Input
            value={formData.employeeId}
            onChange={(e) => handleFieldChange('employeeId', e.target.value)}
            placeholder="Auto-generated if empty"
            disabled={!!editingEmployee}
          />
        </FormControl>
      </Grid>

      <Grid xs={12} sm={8}>
        <FormControl required error={!!errors.name}>
          <FormLabel>Full Name</FormLabel>
          <Input
            placeholder="e.g. Full Name"
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

      <Grid xs={12} sm={6}>
        <FormControl>
          <FormLabel>Designation</FormLabel>
          <Input
            placeholder="e.g., Software Engineer"
            value={formData.designation}
            onChange={(e) => handleFieldChange('designation', e.target.value)}
            startDecorator={<Briefcase size={16} />}
          />
        </FormControl>
      </Grid>

      <Grid xs={12} sm={6}>
        <FormControl>
          <FormLabel>Department</FormLabel>
          <Input
            placeholder="e.g., Engineering"
            value={formData.department}
            onChange={(e) => handleFieldChange('department', e.target.value)}
          />
        </FormControl>
      </Grid>

      <Grid xs={12} sm={4}>
        <FormControl required error={!!errors.salary}>
          <FormLabel>Salary</FormLabel>
          <Input
            type="number"
            placeholder="e.g., 5000"
            value={formData.salary}
            onChange={(e) => handleFieldChange('salary', e.target.value)}
            color={errors.salary ? 'danger' : undefined}
            startDecorator={<DollarSign size={16} />}
          />
          {errors.salary && <FormHelperText sx={{ color: 'danger.500' }}>{errors.salary}</FormHelperText>}
        </FormControl>
      </Grid>

      <Grid xs={12} sm={4}>
        <FormControl>
          <FormLabel>Salary Type</FormLabel>
          <Select
            value={formData.salaryType}
            onChange={(_, value) => handleFieldChange('salaryType', value || 'monthly')}
          >
            <Option value="monthly">Monthly</Option>
            <Option value="hourly">Hourly</Option>
          </Select>
        </FormControl>
      </Grid>

      <Grid xs={12} sm={4}>
        <FormControl required error={!!errors.joiningDate}>
          <FormLabel>Joining Date</FormLabel>
          <Input
            type="date"
            value={formData.joiningDate}
            onChange={(e) => handleFieldChange('joiningDate', e.target.value)}
            color={errors.joiningDate ? 'danger' : undefined}
            startDecorator={<Calendar size={16} />}
          />
          {errors.joiningDate && <FormHelperText sx={{ color: 'danger.500' }}>{errors.joiningDate}</FormHelperText>}
        </FormControl>
      </Grid>

      <Grid xs={12}>
        <FormControl>
          <FormLabel>Address</FormLabel>
          <Input
            placeholder="Street address"
            value={formData.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
          />
        </FormControl>
      </Grid>

      <Grid xs={12} sm={4}>
        <FormControl>
          <FormLabel>Bank Name</FormLabel>
          <Input
            placeholder="Bank name"
            value={formData.bankName}
            onChange={(e) => handleFieldChange('bankName', e.target.value)}
          />
        </FormControl>
      </Grid>

      <Grid xs={12} sm={4}>
        <FormControl>
          <FormLabel>Bank Account</FormLabel>
          <Input
            placeholder="Account number"
            value={formData.bankAccount}
            onChange={(e) => handleFieldChange('bankAccount', e.target.value)}
          />
        </FormControl>
      </Grid>

      <Grid xs={12} sm={4}>
        <FormControl>
          <FormLabel>Tax ID</FormLabel>
          <Input
            placeholder="Tax ID"
            value={formData.taxId}
            onChange={(e) => handleFieldChange('taxId', e.target.value)}
          />
        </FormControl>
      </Grid>

      <Grid xs={12}>
        <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between' }}>
          <FormLabel>Active Employee</FormLabel>
          <Switch
            checked={formData.isActive}
            onChange={(e) => handleFieldChange('isActive', e.target.checked)}
          />
        </FormControl>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Stack spacing={3}>
        {/* Breadcrumbs */}
        <PageBreadcrumbs
          items={[
            { label: 'Employees', icon: <Users size={14} /> },
          ]}
        />

        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 0 }}>
          <Box>
            <Typography level="h2" sx={{ mb: 0.5 }}>
              Employees
            </Typography>
            <Typography level="body-md" sx={{ color: 'text.secondary' }}>
              Manage your employees and payroll
            </Typography>
          </Box>
        </Stack>

        {/* Stats Cards */}
        <AccordionGroup>
          <Accordion defaultExpanded={false}>
            <AccordionSummary>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <BarChart3 size={18} />
                <Typography level="body-sm" fontWeight={500}>
                  Active Employees: {loading ? '...' : activeEmployees.length}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: 'primary.600' }}>
                  Monthly Payroll: {loading ? '...' : formatCurrency(totalMonthlyPayroll)}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)', borderColor: 'primary.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Active Employees</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                        {loading ? <Skeleton width={60} /> : activeEmployees.length}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        of {loading ? '...' : employeeStats.totalCount} total
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(112, 143, 150, 0.08) 0%, rgba(112, 143, 150, 0.02) 100%)', borderColor: 'primary.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Monthly Payroll</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                        {loading ? <Skeleton width={100} /> : formatCurrency(totalMonthlyPayroll)}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        Active employees only
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Total Employees</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={60} /> : employeeStats.totalCount}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                        {loading ? '...' : employeeStats.departmentsCount} departments
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(158, 158, 158, 0.08) 0%, rgba(158, 158, 158, 0.02) 100%)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Inactive</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'neutral.600' }}>
                        {loading ? <Skeleton width={50} /> : employeeStats.inactiveCount}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Avg Salary</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={80} /> : formatCurrency(employeeStats.avgSalary)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Highest Salary</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.600' }}>
                        {loading ? <Skeleton width={80} /> : formatCurrency(employeeStats.highestSalary)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Lowest Salary</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={80} /> : formatCurrency(employeeStats.lowestSalary)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Departments</Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={50} /> : employeeStats.departmentsCount}
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
                placeholder="Search employees..."
                startDecorator={<Search size={18} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }}
              />
              <Select
                value={filterStatus}
                onChange={(_, value) => setFilterStatus(value || 'all')}
                sx={{ minWidth: 140 }}
              >
                <Option value="all">All Status</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
              {uniqueDepartments.length > 0 && (
                <Select
                  value={filterDepartment}
                  onChange={(_, value) => setFilterDepartment(value || 'all')}
                  sx={{ minWidth: 150 }}
                >
                  <Option value="all">All Departments</Option>
                  {uniqueDepartments.map(dept => (
                    <Option key={dept} value={dept}>{dept}</Option>
                  ))}
                </Select>
              )}
            </Stack>
            <Button
              variant="solid"
              color="primary"
              startDecorator={<Plus size={18} />}
              onClick={async () => { await resetForm(); setAddModalOpen(true); }}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add Employee
            </Button>
          </Stack>
        </Card>

        {/* Employees Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <FormTableSkeleton columns={8} rows={8} />
            ) : filteredEmployees.length === 0 ? (
              <EmptyState type="employees" />
            ) : (
              <Sheet sx={{ overflowX: 'auto' }}>
                <Table stickyHeader>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>ID</th>
                      <th>Designation</th>
                      <th>Department</th>
                      <th>Joined</th>
                      <th style={{ textAlign: 'right' }}>Salary</th>
                      <th style={{ width: 80 }}>Status</th>
                      <th style={{ width: 100, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEmployees.map((employee) => (
                      <tr key={employee.id}>
                        <td>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar size="sm" color={employee.isActive ? 'primary' : 'neutral'}>
                              {employee.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography level="body-sm" fontWeight={500}>
                                {employee.name}
                              </Typography>
                              {employee.email && (
                                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                  {employee.email}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </td>
                        <td>
                          <Typography level="body-sm" fontFamily="monospace">
                            {employee.employeeId}
                          </Typography>
                        </td>
                        <td>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Briefcase size={14} />
                            <Typography level="body-sm">
                              {employee.designation || '-'}
                            </Typography>
                          </Stack>
                        </td>
                        <td>
                          <Typography level="body-sm">
                            {employee.department || '-'}
                          </Typography>
                        </td>
                        <td>
                          <Typography level="body-sm">
                            {formatDate(employee.joiningDate)}
                          </Typography>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Typography level="body-sm" fontWeight={500}>
                            {formatCurrency(employee.salary)}
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                              /{employee.salaryType === 'monthly' ? 'mo' : 'hr'}
                            </Typography>
                          </Typography>
                        </td>
                        <td>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={employee.isActive ? 'success' : 'neutral'}
                          >
                            {getStatusLabel(employee.isActive ? 'active' : 'inactive')}
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
                              <MenuItem onClick={() => openEditModal(employee)}>
                                <ListItemDecorator><Edit2 size={16} /></ListItemDecorator>
                                Edit
                              </MenuItem>
                              <Divider />
                              <MenuItem color="danger" onClick={() => openDeleteConfirm(employee)}>
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
            {!loading && filteredEmployees.length > 0 && (
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
                      {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filteredEmployees.length)} of {filteredEmployees.length}
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

      {/* Add Employee Modal */}
      <Modal open={addModalOpen} onClose={() => !saving && setAddModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          layout="center"
          sx={{
            width: '100%',
            maxWidth: { xs: '95vw', sm: 650 },
            maxHeight: '90vh',
            overflow: 'hidden',
            p: 0,
          }}
        >
          <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>Add New Employee</DialogTitle>
          <ModalClose disabled={saving} />
          <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
            {renderFormFields()}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              variant="outlined"
              color="neutral"
              onClick={async () => { setAddModalOpen(false); await resetForm(); }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="primary"
              onClick={handleAdd}
              loading={saving}
              disabled={!formData.name.trim() || !formData.salary}
            >
              Create Employee
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal open={editModalOpen} onClose={() => !saving && setEditModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          layout="center"
          sx={{
            width: '100%',
            maxWidth: { xs: '95vw', sm: 650 },
            maxHeight: '90vh',
            overflow: 'hidden',
            p: 0,
          }}
        >
          <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>Edit Employee</DialogTitle>
          <ModalClose disabled={saving} />
          <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
            {renderFormFields()}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              variant="outlined"
              color="neutral"
              onClick={async () => { setEditModalOpen(false); setEditingEmployee(null); await resetForm(); }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="primary"
              onClick={handleEdit}
              loading={saving}
              disabled={!formData.name.trim() || !formData.salary}
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
          setPendingDeleteEmployee(null);
        }}
        onConfirm={handleDelete}
        title="Delete Employee"
        description={`Are you sure you want to delete "${pendingDeleteEmployee?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </Container>
  );
}
