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
  Select,
  Option,
  AccordionGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Skeleton,
  Button,
  IconButton,
  Modal,
  ModalDialog,
  ModalClose,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Divider,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
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
  getSalarySlipsByMonth,
  getTotalPayrollForMonth,
  updateSalarySlipStatus,
  createSalarySlipManually,
  updateSalarySlip,
  deleteSalarySlip,
} from '@/services/salarySlips';
import { getActiveEmployees } from '@/services/employees';
import { SalarySlip, Employee } from '@/types';
import { LoadingSpinner, EmptyState, ConfirmDialog, PageBreadcrumbs, FormTableSkeleton } from '@/components/common';
import { Calendar, DollarSign, Users, CheckCircle, BarChart3, Plus, Edit2, Trash2, Eye, MoreVertical } from 'lucide-react';
import StatusChangeModal from '@/components/StatusChangeModal';
import FormEntityDetailModal from '@/components/FormEntityDetailModal';
import { canEdit as canEditStatus, canDelete as canDeleteStatus, getStatusColor as getStatusMgmtColor, formatStatus } from '@/lib/status-management';
import toast from 'react-hot-toast';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface SlipFormData {
  employeeId: string;
  employeeName: string;
  employeeDesignation: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  da: number;
  ta: number;
  otherAllowances: number;
  tax: number;
  providentFund: number;
  loan: number;
  otherDeductions: number;
}

const emptyFormData: SlipFormData = {
  employeeId: '',
  employeeName: '',
  employeeDesignation: '',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  basicSalary: 0,
  hra: 0,
  da: 0,
  ta: 0,
  otherAllowances: 0,
  tax: 0,
  providentFund: 0,
  loan: 0,
  otherDeductions: 0,
};

export default function PayrollPage() {
  const { user, loading: authLoading } = useAuth();
  const { company } = useCompany();
  const router = useRouter();
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [payrollSummary, setPayrollSummary] = useState({
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    count: 0,
  });

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlip, setEditingSlip] = useState<SalarySlip | null>(null);
  const [formData, setFormData] = useState<SlipFormData>({ ...emptyFormData });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slipToDelete, setSlipToDelete] = useState<SalarySlip | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Status change modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalSlip, setStatusModalSlip] = useState<SalarySlip | null>(null);

  // Detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailSlip, setDetailSlip] = useState<SalarySlip | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const refreshData = async () => {
    if (!company?.id) return;
    const [slips, summary] = await Promise.all([
      getSalarySlipsByMonth(company.id, selectedMonth, selectedYear),
      getTotalPayrollForMonth(company.id, selectedMonth, selectedYear),
    ]);
    setSalarySlips(slips);
    setPayrollSummary(summary);
  };

  useEffect(() => {
    async function fetchPayroll() {
      if (!company?.id) return;

      setLoading(true);
      try {
        const [slips, summary, emps] = await Promise.all([
          getSalarySlipsByMonth(company.id, selectedMonth, selectedYear),
          getTotalPayrollForMonth(company.id, selectedMonth, selectedYear),
          getActiveEmployees(company.id),
        ]);
        setSalarySlips(slips);
        setPayrollSummary(summary);
        setEmployees(emps);
      } catch (error) {
        console.error('Error fetching payroll:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPayroll();
  }, [company?.id, selectedMonth, selectedYear]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: company?.currency || 'USD',
    }).format(amount);
  };

  // Computed values for form
  const totalEarnings = useMemo(() => {
    return formData.basicSalary + formData.hra + formData.da + formData.ta + formData.otherAllowances;
  }, [formData.basicSalary, formData.hra, formData.da, formData.ta, formData.otherAllowances]);

  const totalDeductions = useMemo(() => {
    return formData.tax + formData.providentFund + formData.loan + formData.otherDeductions;
  }, [formData.tax, formData.providentFund, formData.loan, formData.otherDeductions]);

  const netSalary = useMemo(() => totalEarnings - totalDeductions, [totalEarnings, totalDeductions]);

  const paidCount = salarySlips.filter(s => s.status === 'paid').length;
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const payrollStats = useMemo(() => {
    const unpaid = salarySlips.filter(s => s.status === 'generated');
    const paid = salarySlips.filter(s => s.status === 'paid');
    const uniqueDesignations = new Set(salarySlips.map(s => s.employeeDesignation).filter(Boolean));

    const paidAmount = paid.reduce((sum, s) => sum + s.netSalary, 0);
    const unpaidAmount = unpaid.reduce((sum, s) => sum + s.netSalary, 0);

    return {
      unpaidCount: unpaid.length,
      unpaidAmount,
      paidAmount,
      designationsCount: uniqueDesignations.size,
    };
  }, [salarySlips]);

  // Form handlers
  const resetForm = () => {
    setFormData({ ...emptyFormData, month: selectedMonth, year: selectedYear });
    setSelectedEmployee(null);
    setEditingSlip(null);
    setFormErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleEdit = (slip: SalarySlip) => {
    setEditingSlip(slip);
    const emp = employees.find(e => e.id === slip.employeeId);
    setSelectedEmployee(emp || null);
    setFormData({
      employeeId: slip.employeeId,
      employeeName: slip.employeeName,
      employeeDesignation: slip.employeeDesignation || '',
      month: slip.month,
      year: slip.year,
      basicSalary: slip.basicSalary,
      hra: slip.allowances?.hra || 0,
      da: slip.allowances?.da || 0,
      ta: slip.allowances?.ta || 0,
      otherAllowances: slip.allowances?.other || 0,
      tax: slip.deductions?.tax || 0,
      providentFund: slip.deductions?.providentFund || 0,
      loan: slip.deductions?.loan || 0,
      otherDeductions: slip.deductions?.other || 0,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.employeeId) errors.employee = 'Please select an employee';
    if (formData.basicSalary <= 0) errors.basicSalary = 'Basic salary must be greater than 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !company?.id) return;

    setSaving(true);
    try {
      if (editingSlip) {
        await updateSalarySlip(company.id, editingSlip.id, {
          basicSalary: formData.basicSalary,
          allowances: { hra: formData.hra, da: formData.da, ta: formData.ta, other: formData.otherAllowances },
          deductions: { tax: formData.tax, providentFund: formData.providentFund, loan: formData.loan, other: formData.otherDeductions },
        });
        toast.success('Salary slip updated');
      } else {
        await createSalarySlipManually(company.id, {
          employeeId: formData.employeeId,
          employeeName: formData.employeeName,
          employeeDesignation: formData.employeeDesignation,
          month: formData.month,
          year: formData.year,
          basicSalary: formData.basicSalary,
          allowances: { hra: formData.hra, da: formData.da, ta: formData.ta, other: formData.otherAllowances },
          deductions: { tax: formData.tax, providentFund: formData.providentFund, loan: formData.loan, other: formData.otherDeductions },
        });
        toast.success('Salary slip created');
      }
      await refreshData();
      setModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save salary slip');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (slip: SalarySlip) => {
    setSlipToDelete(slip);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!company?.id || !slipToDelete) return;
    setDeleting(true);
    try {
      await deleteSalarySlip(company.id, slipToDelete.id);
      toast.success('Salary slip deleted');
      await refreshData();
      setDeleteDialogOpen(false);
      setSlipToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete salary slip');
    } finally {
      setDeleting(false);
    }
  };

  const handleEmployeeSelect = (emp: Employee | null) => {
    setSelectedEmployee(emp);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeDesignation: emp.designation || '',
        basicSalary: emp.salary || 0,
      }));
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
            { label: 'Payroll', icon: <DollarSign size={14} /> },
          ]}
        />

        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography level="h2" sx={{ mb: 0.5 }}>
              Payroll
            </Typography>
            <Typography level="body-md" sx={{ color: 'text.secondary' }}>
              Manage salary slips, track payments and deductions.
            </Typography>
          </Box>
          <Button
            variant="solid"
            color="primary"
            startDecorator={<Plus size={18} />}
            onClick={handleAdd}
          >
            Add Salary Slip
          </Button>
        </Stack>

        {/* Month/Year Selection */}
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Calendar size={18} />
              <Typography level="body-sm" fontWeight={500}>
                Period:
              </Typography>
              <Select
                value={selectedMonth}
                onChange={(_, value) => setSelectedMonth(value || 1)}
                sx={{ minWidth: 130 }}
              >
                {MONTHS.map((month, index) => (
                  <Option key={index + 1} value={index + 1}>
                    {month}
                  </Option>
                ))}
              </Select>
              <Select
                value={selectedYear}
                onChange={(_, value) => setSelectedYear(value || new Date().getFullYear())}
                sx={{ minWidth: 100 }}
              >
                {years.map((year) => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>
            </Stack>
          </CardContent>
        </Card>

        {/* Payroll Summary */}
        <AccordionGroup>
          <Accordion defaultExpanded={false}>
            <AccordionSummary>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', flexWrap: 'wrap' }}>
                <BarChart3 size={18} />
                <Typography level="body-sm" fontWeight={500}>
                  {loading ? '...' : `${payrollSummary.count} Employees`}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500}>
                  Gross: {loading ? '...' : formatCurrency(payrollSummary.totalGross)}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500}>
                  Net: {loading ? '...' : formatCurrency(payrollSummary.totalNet)}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography level="body-sm" fontWeight={500}>
                  Paid: {loading ? '...' : `${paidCount}/${payrollSummary.count}`}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid xs={12} sm={6} md={4}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)', borderColor: 'primary.200' }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>Total Employees</Typography>
                          <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                            {loading ? <Skeleton width={80} /> : payrollSummary.count}
                          </Typography>
                          <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            {payrollStats.designationsCount} designation{payrollStats.designationsCount !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                        <Box sx={{ p: 1, borderRadius: 'md', bgcolor: 'primary.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Users size={20} style={{ color: 'var(--joy-palette-primary-600)' }} />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={12} sm={6} md={4}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(46, 125, 50, 0.02) 100%)', borderColor: 'success.200' }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>Gross Salary</Typography>
                          <Typography level="h3" fontWeight="bold" sx={{ color: 'success.700' }}>
                            {loading ? <Skeleton width={120} /> : formatCurrency(payrollSummary.totalGross)}
                          </Typography>
                        </Box>
                        <Box sx={{ p: 1, borderRadius: 'md', bgcolor: 'success.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <DollarSign size={20} style={{ color: 'var(--joy-palette-success-600)' }} />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={12} sm={6} md={4}>
                  <Card variant="outlined" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(237, 108, 2, 0.08) 0%, rgba(237, 108, 2, 0.02) 100%)', borderColor: 'warning.200' }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>Net Payable</Typography>
                          <Typography level="h3" fontWeight="bold" sx={{ color: 'warning.700' }}>
                            {loading ? <Skeleton width={120} /> : formatCurrency(payrollSummary.totalNet)}
                          </Typography>
                        </Box>
                        <Box sx={{ p: 1, borderRadius: 'md', bgcolor: 'warning.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <DollarSign size={20} style={{ color: 'var(--joy-palette-warning-600)' }} />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={12} sm={6} md={4}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Paid</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'success.700' }}>{loading ? <Skeleton width={80} /> : paidCount}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5 }}>{formatCurrency(payrollStats.paidAmount)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={12} sm={6} md={4}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Unpaid</Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'warning.700' }}>{loading ? <Skeleton width={80} /> : payrollStats.unpaidCount}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5 }}>{formatCurrency(payrollStats.unpaidAmount)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={12} sm={6} md={4}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Deductions</Typography>
                      <Typography level="h3" fontWeight="bold">{loading ? <Skeleton width={120} /> : formatCurrency(payrollSummary.totalDeductions)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </AccordionGroup>

        {/* Salary Slips Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <FormTableSkeleton columns={7} />
            ) : salarySlips.length === 0 ? (
              <EmptyState type="payroll" />
            ) : (
              <Sheet sx={{ overflow: 'auto' }}>
                <Table stickyHeader>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Designation</th>
                      <th style={{ textAlign: 'right' }}>Basic</th>
                      <th style={{ textAlign: 'right' }}>Allowances</th>
                      <th style={{ textAlign: 'right' }}>Deductions</th>
                      <th style={{ textAlign: 'right' }}>Net Salary</th>
                      <th style={{ width: 100 }}>Status</th>
                      <th style={{ width: 120, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salarySlips.map((slip) => {
                      const totalAllowances =
                        (slip.allowances?.hra || 0) +
                        (slip.allowances?.da || 0) +
                        (slip.allowances?.ta || 0) +
                        (slip.allowances?.other || 0);
                      return (
                        <tr key={slip.id}>
                          <td>
                            <Typography level="body-sm" fontWeight={500}>
                              {slip.employeeName}
                            </Typography>
                          </td>
                          <td>
                            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                              {slip.employeeDesignation || '-'}
                            </Typography>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Typography level="body-sm">
                              {formatCurrency(slip.basicSalary)}
                            </Typography>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Typography level="body-sm" sx={{ color: 'primary.600' }}>
                              +{formatCurrency(totalAllowances)}
                            </Typography>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Typography level="body-sm" sx={{ color: 'danger.600' }}>
                              -{formatCurrency(slip.totalDeductions)}
                            </Typography>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Typography level="body-sm" fontWeight="bold">
                              {formatCurrency(slip.netSalary)}
                            </Typography>
                          </td>
                          <td>
                            <Chip
                              size="sm"
                              variant="soft"
                              color={getStatusMgmtColor('salarySlip', slip.status)}
                              sx={{ cursor: 'pointer' }}
                              onClick={() => {
                                setStatusModalSlip(slip);
                                setStatusModalOpen(true);
                              }}
                            >
                              {formatStatus('salarySlip', slip.status)}
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
                                  setDetailSlip(slip);
                                  setDetailModalOpen(true);
                                }}>
                                  <ListItemDecorator><Eye size={16} /></ListItemDecorator>
                                  View Details
                                </MenuItem>
                                {canEditStatus('salarySlip', slip.status).allowed && (
                                  <MenuItem onClick={() => handleEdit(slip)}>
                                    <ListItemDecorator><Edit2 size={16} /></ListItemDecorator>
                                    Edit
                                  </MenuItem>
                                )}
                                {canDeleteStatus('salarySlip', slip.status).allowed && (
                                  <>
                                    <Divider />
                                    <MenuItem color="danger" onClick={() => handleDeleteClick(slip)}>
                                      <ListItemDecorator sx={{ color: 'inherit' }}><Trash2 size={16} /></ListItemDecorator>
                                      Delete
                                    </MenuItem>
                                  </>
                                )}
                              </Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Sheet>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Add/Edit Salary Slip Modal */}
      <Modal open={modalOpen} onClose={() => !saving && setModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          layout="center"
          sx={{ width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'hidden', p: 0 }}
        >
          <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>
            {editingSlip ? 'Edit Salary Slip' : 'New Salary Slip'}
          </DialogTitle>
          <ModalClose disabled={saving} />
          <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
            <Stack spacing={3}>
              {/* Employee Selection */}
              <FormControl error={!!formErrors.employee}>
                <FormLabel required>Employee</FormLabel>
                <Autocomplete
                  placeholder="Select employee..."
                  options={employees}
                  getOptionLabel={(option) => `${option.name}${option.designation ? ` - ${option.designation}` : ''}`}
                  value={selectedEmployee}
                  onChange={(_, value) => handleEmployeeSelect(value)}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  disabled={!!editingSlip}
                  slotProps={{ listbox: { sx: { maxHeight: 200 } } }}
                />
                {formErrors.employee && <FormHelperText>{formErrors.employee}</FormHelperText>}
              </FormControl>

              {/* Period */}
              <Grid container spacing={2}>
                <Grid xs={6}>
                  <FormControl>
                    <FormLabel>Month</FormLabel>
                    <Select
                      value={formData.month}
                      onChange={(_, v) => setFormData(prev => ({ ...prev, month: v || 1 }))}
                      disabled={!!editingSlip}
                    >
                      {MONTHS.map((m, i) => <Option key={i + 1} value={i + 1}>{m}</Option>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={6}>
                  <FormControl>
                    <FormLabel>Year</FormLabel>
                    <Select
                      value={formData.year}
                      onChange={(_, v) => setFormData(prev => ({ ...prev, year: v || new Date().getFullYear() }))}
                      disabled={!!editingSlip}
                    >
                      {years.map(y => <Option key={y} value={y}>{y}</Option>)}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider />

              {/* Earnings */}
              <Box>
                <Typography level="title-sm" sx={{ mb: 1.5, color: 'success.700' }}>Earnings</Typography>
                <Grid container spacing={2}>
                  <Grid xs={6}>
                    <FormControl error={!!formErrors.basicSalary}>
                      <FormLabel required>Basic Salary</FormLabel>
                      <Input
                        type="number"
                        value={formData.basicSalary || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, basicSalary: parseFloat(e.target.value) || 0 }))}
                        slotProps={{ input: { min: 0, step: 0.01 } }}
                      />
                      {formErrors.basicSalary && <FormHelperText>{formErrors.basicSalary}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  <Grid xs={6}>
                    <FormControl>
                      <FormLabel>HRA</FormLabel>
                      <Input
                        type="number"
                        value={formData.hra || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, hra: parseFloat(e.target.value) || 0 }))}
                        slotProps={{ input: { min: 0, step: 0.01 } }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={6}>
                    <FormControl>
                      <FormLabel>DA</FormLabel>
                      <Input
                        type="number"
                        value={formData.da || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, da: parseFloat(e.target.value) || 0 }))}
                        slotProps={{ input: { min: 0, step: 0.01 } }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={6}>
                    <FormControl>
                      <FormLabel>TA</FormLabel>
                      <Input
                        type="number"
                        value={formData.ta || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, ta: parseFloat(e.target.value) || 0 }))}
                        slotProps={{ input: { min: 0, step: 0.01 } }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={6}>
                    <FormControl>
                      <FormLabel>Other Allowances</FormLabel>
                      <Input
                        type="number"
                        value={formData.otherAllowances || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, otherAllowances: parseFloat(e.target.value) || 0 }))}
                        slotProps={{ input: { min: 0, step: 0.01 } }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={6}>
                    <Box sx={{ p: 1.5, borderRadius: 'md', bgcolor: 'success.softBg' }}>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Total Earnings</Typography>
                      <Typography level="title-md" sx={{ color: 'success.700' }}>{formatCurrency(totalEarnings)}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Deductions */}
              <Box>
                <Typography level="title-sm" sx={{ mb: 1.5, color: 'danger.700' }}>Deductions</Typography>
                <Grid container spacing={2}>
                  <Grid xs={6}>
                    <FormControl>
                      <FormLabel>Tax</FormLabel>
                      <Input
                        type="number"
                        value={formData.tax || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                        slotProps={{ input: { min: 0, step: 0.01 } }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={6}>
                    <FormControl>
                      <FormLabel>Provident Fund</FormLabel>
                      <Input
                        type="number"
                        value={formData.providentFund || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, providentFund: parseFloat(e.target.value) || 0 }))}
                        slotProps={{ input: { min: 0, step: 0.01 } }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={6}>
                    <FormControl>
                      <FormLabel>Loan</FormLabel>
                      <Input
                        type="number"
                        value={formData.loan || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, loan: parseFloat(e.target.value) || 0 }))}
                        slotProps={{ input: { min: 0, step: 0.01 } }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={6}>
                    <FormControl>
                      <FormLabel>Other Deductions</FormLabel>
                      <Input
                        type="number"
                        value={formData.otherDeductions || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, otherDeductions: parseFloat(e.target.value) || 0 }))}
                        slotProps={{ input: { min: 0, step: 0.01 } }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={6}>
                    <Box sx={{ p: 1.5, borderRadius: 'md', bgcolor: 'danger.softBg' }}>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Total Deductions</Typography>
                      <Typography level="title-md" sx={{ color: 'danger.700' }}>{formatCurrency(totalDeductions)}</Typography>
                    </Box>
                  </Grid>
                  <Grid xs={6}>
                    <Box sx={{ p: 1.5, borderRadius: 'md', bgcolor: 'primary.softBg' }}>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Net Salary</Typography>
                      <Typography level="title-md" fontWeight="bold" sx={{ color: 'primary.700' }}>{formatCurrency(netSalary)}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button variant="outlined" color="neutral" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="solid" color="primary" onClick={handleSave} loading={saving}>
              {editingSlip ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Salary Slip"
        description={`Are you sure you want to delete the salary slip for ${slipToDelete?.employeeName}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />

      {/* Status Change Modal */}
      {statusModalSlip && (
        <StatusChangeModal
          open={statusModalOpen}
          onClose={() => { setStatusModalOpen(false); setStatusModalSlip(null); }}
          entityType="salarySlip"
          entityId={statusModalSlip.id}
          entityName={`${statusModalSlip.employeeName} - ${MONTHS[statusModalSlip.month - 1]} ${statusModalSlip.year}`}
          currentStatus={statusModalSlip.status}
          onStatusChange={async (id, newStatus) => {
            await updateSalarySlipStatus(company!.id, id, newStatus);
            await refreshData();
            toast.success(`Status updated to ${formatStatus('salarySlip', newStatus)}`);
          }}
        />
      )}

      {/* Detail Modal */}
      <FormEntityDetailModal
        open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setDetailSlip(null); }}
        entityType="salarySlip"
        entity={detailSlip}
        onEdit={(entity) => { setDetailModalOpen(false); handleEdit(entity as SalarySlip); }}
        onDelete={(entity) => { setDetailModalOpen(false); handleDeleteClick(entity as SalarySlip); }}
      />
    </Container>
  );
}
