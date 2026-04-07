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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionGroup,
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
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
  ListItemDecorator,
} from '@mui/joy';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getJournalEntries, createJournalEntry, updateJournalEntry, deleteJournalEntry } from '@/services/journalEntries';
import { getCompanyAccounts } from '@/services/account-init';
import { JournalEntry, JournalEntryLine, Account } from '@/types';
import { LoadingSpinner, EmptyState, ConfirmDialog, PageBreadcrumbs, FormTableSkeleton } from '@/components/common';
import { Search, BookOpen, ChevronDown, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, X, CheckCircle2, AlertCircle, Calculator, BarChart3, MoreVertical } from 'lucide-react';
import { useFormatting } from '@/hooks';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';

interface FormErrors {
  date?: string;
  description?: string;
  lines?: string;
  [key: string]: string | undefined;
}

interface LineItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

const emptyLine: LineItem = {
  accountId: '',
  accountCode: '',
  accountName: '',
  description: '',
  debit: 0,
  credit: 0,
};

export default function JournalEntriesPage() {
  const { user, loading: authLoading } = useAuth();
  const { company } = useCompany();
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState<LineItem[]>([{ ...emptyLine }, { ...emptyLine }]);
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
        const [entriesData, accountsData] = await Promise.all([
          getJournalEntries(company.id),
          getCompanyAccounts(company.id),
        ]);
        setEntries(entriesData);
        setAccounts(accountsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [company?.id]);

  // Calculate totals
  const totalDebit = useMemo(() => {
    return lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  }, [lines]);

  const totalCredit = useMemo(() => {
    return lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  }, [lines]);

  const isBalanced = useMemo(() => {
    return Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
  }, [totalDebit, totalCredit]);

  // Filtered entries with useMemo
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchesSearch =
        e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.entryNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || e.referenceType === filterType;
      return matchesSearch && matchesType;
    });
  }, [entries, searchTerm, filterType]);

  // Get unique reference types for filter
  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    entries.forEach(e => {
      if (e.referenceType) types.add(e.referenceType);
    });
    return Array.from(types).sort();
  }, [entries]);

  // Count balanced entries
  const balancedCount = useMemo(() => {
    return entries.filter(e => e.isBalanced).length;
  }, [entries]);

  // Additional journal stats
  const journalStats = useMemo(() => {
    const manualEntries = entries.filter(e => e.referenceType === 'manual');
    const automatedEntries = entries.filter(e => e.referenceType !== 'manual');

    const totalDebitAmount = entries.reduce((sum, e) =>
      sum + e.lines.reduce((lineSum, l) => lineSum + l.debit, 0), 0);
    const totalCreditAmount = entries.reduce((sum, e) =>
      sum + e.lines.reduce((lineSum, l) => lineSum + l.credit, 0), 0);

    const uniqueAccountIds = new Set<string>();
    entries.forEach(e => e.lines.forEach(l => uniqueAccountIds.add(l.accountId)));

    const totalLines = entries.reduce((sum, e) => sum + e.lines.length, 0);
    const avgLinesPerEntry = entries.length > 0 ? totalLines / entries.length : 0;

    // This month's entries
    const now = new Date();
    const thisMonth = entries.filter(e => {
      const entryDate = e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date);
      return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    });

    return {
      manualCount: manualEntries.length,
      automatedCount: automatedEntries.length,
      totalDebitAmount,
      totalCreditAmount,
      uniqueAccountsCount: uniqueAccountIds.size,
      avgLinesPerEntry,
      thisMonthCount: thisMonth.length,
      totalLines,
    };
  }, [entries]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredEntries.length / rowsPerPage);
  const paginatedEntries = filteredEntries.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterType]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!entryDate) {
      errors.date = 'Date is required';
    }

    if (!description.trim()) {
      errors.description = 'Description is required';
    }

    const validLines = lines.filter(line => line.accountId && (line.debit > 0 || line.credit > 0));
    if (validLines.length < 2) {
      errors.lines = 'At least two valid line items are required';
    } else if (!isBalanced) {
      errors.lines = 'Entry must be balanced (total debits must equal total credits)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setEntryDate(format(new Date(), 'yyyy-MM-dd'));
    setDescription('');
    setReference('');
    setLines([{ ...emptyLine }, { ...emptyLine }]);
    setFormErrors({});
    setEditingEntry(null);
  };

  // Open modal for add
  const handleAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEntryDate(entry.date instanceof Timestamp
      ? format(entry.date.toDate(), 'yyyy-MM-dd')
      : format(new Date(entry.date), 'yyyy-MM-dd'));
    setDescription(entry.description || '');
    setReference(entry.reference || '');
    setLines(entry.lines.map(line => ({
      accountId: line.accountId,
      accountCode: line.accountCode,
      accountName: line.accountName,
      description: line.description || '',
      debit: line.debit,
      credit: line.credit,
    })));
    setFormErrors({});
    setModalOpen(true);
  };

  // Handle line change
  const handleLineChange = (index: number, field: keyof LineItem, value: string | number) => {
    const newLines = [...lines];
    if (field === 'debit' || field === 'credit') {
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      newLines[index] = {
        ...newLines[index],
        [field]: numValue,
        // Clear the other field when entering a value
        ...(field === 'debit' && numValue > 0 ? { credit: 0 } : {}),
        ...(field === 'credit' && numValue > 0 ? { debit: 0 } : {}),
      };
    } else {
      newLines[index] = { ...newLines[index], [field]: value };
    }
    setLines(newLines);
    if (formErrors.lines) setFormErrors(prev => ({ ...prev, lines: undefined }));
  };

  // Handle account selection
  const handleAccountSelect = (index: number, account: Account | null) => {
    const newLines = [...lines];
    if (account) {
      newLines[index] = {
        ...newLines[index],
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
      };
    } else {
      newLines[index] = {
        ...newLines[index],
        accountId: '',
        accountCode: '',
        accountName: '',
      };
    }
    setLines(newLines);
    if (formErrors.lines) setFormErrors(prev => ({ ...prev, lines: undefined }));
  };

  // Add new line
  const handleAddLine = () => {
    setLines([...lines, { ...emptyLine }]);
  };

  // Remove line
  const handleRemoveLine = (index: number) => {
    if (lines.length > 2) {
      const newLines = lines.filter((_, i) => i !== index);
      setLines(newLines);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm() || !company?.id || !user) return;

    setSaving(true);
    try {
      const validLines = lines.filter(line => line.accountId && (line.debit > 0 || line.credit > 0));
      const entryLines: JournalEntryLine[] = validLines.map(line => ({
        accountId: line.accountId,
        accountCode: line.accountCode,
        accountName: line.accountName,
        description: line.description,
        debit: line.debit,
        credit: line.credit,
      }));

      if (editingEntry) {
        await updateJournalEntry(company.id, editingEntry.id, {
          date: new Date(entryDate),
          description: description.trim(),
          lines: entryLines,
          reference: reference.trim(),
        });
        toast.success('Journal entry updated successfully');
      } else {
        await createJournalEntry(company.id, {
          date: new Date(entryDate),
          description: description.trim(),
          lines: entryLines,
          reference: reference.trim() || '',
          referenceType: 'manual',
          createdBy: user.uid,
        });
        toast.success('Journal entry created successfully');
      }

      // Refresh data
      const data = await getJournalEntries(company.id);
      setEntries(data);
      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save journal entry';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDeleteClick = (entry: JournalEntry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!company?.id || !entryToDelete) return;

    setDeleting(true);
    try {
      await deleteJournalEntry(company.id, entryToDelete.id);
      toast.success('Journal entry deleted successfully');
      const data = await getJournalEntries(company.id);
      setEntries(data);
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      toast.error('Failed to delete journal entry');
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || !user) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Stack spacing={3}>
        {/* Breadcrumbs */}
        <PageBreadcrumbs
          items={[
            { label: 'Journal Entries', icon: <BookOpen size={14} /> },
          ]}
        />

        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 0 }}>
          <Box>
            <Typography level="h2" sx={{ mb: 0.5 }}>
              Journal Entries
            </Typography>
            <Typography level="body-md" sx={{ color: 'text.secondary' }}>
              Manage your journal entries for double-entry bookkeeping.
            </Typography>
          </Box>
        </Stack>

        {/* Stats Cards */}
        <AccordionGroup>
          <Accordion defaultExpanded={false}>
            <AccordionSummary>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', flexWrap: 'wrap' }}>
                <BarChart3 size={18} />
                <Typography level="body-sm" fontWeight={500}>
                  Total Entries: {loading ? '...' : entries.length}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: 'primary.600' }}>
                  Balanced: {loading ? '...' : balancedCount}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>|</Typography>
                <Typography level="body-sm" fontWeight={500} sx={{ color: 'danger.600' }}>
                  Unbalanced: {loading ? '...' : entries.length - balancedCount}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid xs={6} md={3}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)',
                      borderColor: 'primary.200',
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Total Entries
                        </Typography>
                        <Box
                          sx={{
                            p: 0.75,
                            borderRadius: 'sm',
                            bgcolor: 'primary.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <BookOpen size={16} style={{ color: 'var(--joy-palette-primary-600)' }} />
                        </Box>
                      </Stack>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                        {loading ? <Skeleton width={60} /> : entries.length}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        {journalStats.totalLines} lines total
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(46, 125, 50, 0.02) 100%)',
                      borderColor: 'primary.200',
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Balanced
                        </Typography>
                        <Box
                          sx={{
                            p: 0.75,
                            borderRadius: 'sm',
                            bgcolor: 'primary.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <CheckCircle2 size={16} style={{ color: 'var(--joy-palette-success-600)' }} />
                        </Box>
                      </Stack>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                        {loading ? <Skeleton width={60} /> : balancedCount}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        {entries.length > 0 ? ((balancedCount / entries.length) * 100).toFixed(0) : 0}% of entries
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.08) 0%, rgba(211, 47, 47, 0.02) 100%)',
                      borderColor: 'danger.200',
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Unbalanced
                        </Typography>
                        <Box
                          sx={{
                            p: 0.75,
                            borderRadius: 'sm',
                            bgcolor: 'danger.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <AlertCircle size={16} style={{ color: 'var(--joy-palette-danger-600)' }} />
                        </Box>
                      </Stack>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'danger.700' }}>
                        {loading ? <Skeleton width={60} /> : entries.length - balancedCount}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        Needs attention
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>
                        This Month
                      </Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={60} /> : journalStats.thisMonthCount}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        New entries
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>
                        Manual Entries
                      </Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={60} /> : journalStats.manualCount}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        User-created
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>
                        Automated
                      </Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={60} /> : journalStats.automatedCount}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        From transactions
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>
                        Total Debits
                      </Typography>
                      <Typography level="h3" fontWeight="bold" sx={{ color: 'primary.700' }}>
                        {loading ? <Skeleton width={60} /> : formatCurrency(journalStats.totalDebitAmount)}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        All entries
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid xs={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>
                        Accounts Used
                      </Typography>
                      <Typography level="h3" fontWeight="bold">
                        {loading ? <Skeleton width={60} /> : journalStats.uniqueAccountsCount}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        Avg {journalStats.avgLinesPerEntry.toFixed(1)} lines/entry
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
                placeholder="Search entries..."
                startDecorator={<Search size={18} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }}
              />
              <Select
                value={filterType}
                onChange={(_, value) => setFilterType(value || 'all')}
                sx={{ minWidth: 150 }}
              >
                <Option value="all">All Types</Option>
                <Option value="manual">Manual</Option>
                {uniqueTypes.filter(t => t !== 'manual').map((type) => (
                  <Option key={type} value={type}>{type}</Option>
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
              New Entry
            </Button>
          </Stack>
        </Card>

        {/* Journal Entries */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <FormTableSkeleton columns={6} rows={8} />
            ) : filteredEntries.length === 0 ? (
              <EmptyState type="journal" />
            ) : (
              <AccordionGroup>
                {paginatedEntries.map((entry) => {
                  const entryTotalDebit = entry.lines.reduce((sum, l) => sum + l.debit, 0);
                  const entryTotalCredit = entry.lines.reduce((sum, l) => sum + l.credit, 0);
                  const entryIsBalanced = Math.abs(entryTotalDebit - entryTotalCredit) < 0.01;

                  return (
                    <Accordion
                      key={entry.id}
                      expanded={expandedEntry === entry.id}
                      onChange={(_, expanded) =>
                        setExpandedEntry(expanded ? entry.id : null)
                      }
                    >
                      <AccordionSummary
                        indicator={<ChevronDown />}
                        sx={{ px: 2 }}
                      >
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          sx={{ width: '100%', pr: 2 }}
                        >
                          <BookOpen size={18} />
                          <Box sx={{ flex: 1 }}>
                            <Typography level="body-sm" fontWeight={500}>
                              {entry.entryNumber || 'Journal Entry'} - {entry.description || 'No description'}
                            </Typography>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                              {formatDate(entry.date)} {entry.reference && `• Ref: ${entry.reference}`}
                            </Typography>
                          </Box>
                          <Typography level="body-sm" fontWeight="bold">
                            {formatCurrency(entryTotalDebit)}
                          </Typography>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={entryIsBalanced ? 'success' : 'danger'}
                          >
                            {entryIsBalanced ? 'Balanced' : 'Unbalanced'}
                          </Chip>
                          <Dropdown>
                            <MenuButton
                              slots={{ root: IconButton }}
                              slotProps={{ root: { variant: 'plain', size: 'sm', color: 'neutral' } }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical size={18} />
                            </MenuButton>
                            <Menu placement="bottom-end" sx={{ zIndex: 1300, minWidth: 160 }}>
                              <MenuItem onClick={() => handleEdit(entry)}>
                                <ListItemDecorator><Edit2 size={16} /></ListItemDecorator>
                                Edit
                              </MenuItem>
                              <Divider />
                              <MenuItem
                                color="danger"
                                onClick={() => handleDeleteClick(entry)}
                                disabled={entry.referenceType !== 'manual'}
                              >
                                <ListItemDecorator sx={{ color: 'inherit' }}><Trash2 size={16} /></ListItemDecorator>
                                Delete
                              </MenuItem>
                            </Menu>
                          </Dropdown>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Sheet sx={{ overflow: 'auto', mx: 2, mb: 2, borderRadius: 'sm' }}>
                          <Table size="sm">
                            <thead>
                              <tr>
                                <th>Account</th>
                                <th style={{ width: 130, textAlign: 'right' }}>Debit</th>
                                <th style={{ width: 130, textAlign: 'right' }}>Credit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.lines.map((line, index) => (
                                <tr key={index}>
                                  <td>
                                    <Typography level="body-sm">
                                      {line.accountCode} - {line.accountName || line.accountId}
                                    </Typography>
                                    {line.description && (
                                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                        {line.description}
                                      </Typography>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <Typography
                                      level="body-sm"
                                      sx={{ color: line.debit > 0 ? 'primary.600' : 'text.tertiary' }}
                                    >
                                      {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                                    </Typography>
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <Typography
                                      level="body-sm"
                                      sx={{ color: line.credit > 0 ? 'primary.600' : 'text.tertiary' }}
                                    >
                                      {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                                    </Typography>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td>
                                  <Typography level="body-sm" fontWeight="bold">
                                    Total
                                  </Typography>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <Typography level="body-sm" fontWeight="bold">
                                    {formatCurrency(entryTotalDebit)}
                                  </Typography>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <Typography level="body-sm" fontWeight="bold">
                                    {formatCurrency(entryTotalCredit)}
                                  </Typography>
                                </td>
                              </tr>
                            </tfoot>
                          </Table>
                        </Sheet>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </AccordionGroup>
            )}
            {!loading && filteredEntries.length > 0 && (
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
                      {filteredEntries.length === 0 ? 0 : (page - 1) * rowsPerPage + 1}-
                      {Math.min(page * rowsPerPage, filteredEntries.length)} of {filteredEntries.length}
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
            maxWidth: { xs: '95vw', sm: 700 },
            maxHeight: '90vh',
            overflowY: 'auto',
            p: 0,
          }}
        >
          <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>
            {editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
          </DialogTitle>
          <ModalClose disabled={saving} />
          <DialogContent sx={{ px: 3, py: 2, overflowY: 'auto' }}>
            <Stack spacing={3}>
              {/* Header Info */}
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <FormControl error={!!formErrors.date}>
                    <FormLabel required>Date</FormLabel>
                    <Input
                      type="date"
                      value={entryDate}
                      onChange={(e) => {
                        setEntryDate(e.target.value);
                        if (formErrors.date) setFormErrors(prev => ({ ...prev, date: undefined }));
                      }}
                    />
                    {formErrors.date && <FormHelperText>{formErrors.date}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl>
                    <FormLabel>Reference</FormLabel>
                    <Input
                      placeholder="Invoice #, receipt #, etc."
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </FormControl>
                </Grid>
              </Grid>

              <FormControl error={!!formErrors.description}>
                <FormLabel required>Description</FormLabel>
                <Input
                  placeholder="Enter description..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (formErrors.description) setFormErrors(prev => ({ ...prev, description: undefined }));
                  }}
                />
                {formErrors.description && <FormHelperText>{formErrors.description}</FormHelperText>}
              </FormControl>

              <Divider />

              {/* Line Items */}
              <Box>
                <Typography level="title-sm" sx={{ mb: 1.5 }}>Journal Lines</Typography>
                {formErrors.lines && (
                  <Typography level="body-sm" color="danger" sx={{ mb: 1.5 }}>
                    {formErrors.lines}
                  </Typography>
                )}
                <Stack spacing={1.5}>
                  {lines.map((line, index) => (
                    <Grid container spacing={1} key={index} alignItems="flex-end">
                      <Grid xs={12} sm={4}>
                        <FormControl>
                          <FormLabel>Account</FormLabel>
                          <Autocomplete
                            placeholder="Select account..."
                            options={accounts}
                            getOptionLabel={(option) => `${option.code} - ${option.name}`}
                            value={accounts.find(a => a.id === line.accountId) || null}
                            onChange={(_, value) => handleAccountSelect(index, value)}
                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                            groupBy={(option) => option.typeName}
                            slotProps={{
                              listbox: {
                                sx: { maxHeight: 200 }
                              }
                            }}
                          />
                        </FormControl>
                      </Grid>
                      <Grid xs={12} sm={3}>
                        <FormControl>
                          <FormLabel>Description</FormLabel>
                          <Input
                            placeholder="Line memo"
                            value={line.description}
                            onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                          />
                        </FormControl>
                      </Grid>
                      <Grid xs={5} sm={2}>
                        <FormControl>
                          <FormLabel>Debit</FormLabel>
                          <Input
                            type="number"
                            value={line.debit || ''}
                            onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                          />
                        </FormControl>
                      </Grid>
                      <Grid xs={5} sm={2}>
                        <FormControl>
                          <FormLabel>Credit</FormLabel>
                          <Input
                            type="number"
                            value={line.credit || ''}
                            onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                          />
                        </FormControl>
                      </Grid>
                      <Grid xs={2} sm={1}>
                        <IconButton
                          size="sm"
                          variant="plain"
                          color="danger"
                          onClick={() => handleRemoveLine(index)}
                          disabled={lines.length <= 2}
                        >
                          <X size={16} />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                  <Button variant="outlined" color="neutral" size="sm" onClick={handleAddLine} startDecorator={<Plus size={16} />}>
                    Add Line
                  </Button>
                </Stack>

                {/* Totals Summary */}
                <AccordionGroup sx={{ mt: 2 }}>
                  <Accordion defaultExpanded={false}>
                    <AccordionSummary>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                        <Calculator size={18} />
                        <Typography level="body-sm" fontWeight={500}>
                          Debit: {formatCurrency(totalDebit)}
                        </Typography>
                        <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                        <Typography level="body-sm" fontWeight={500}>
                          Credit: {formatCurrency(totalCredit)}
                        </Typography>
                        <Typography level="body-sm" sx={{ color: 'text.secondary' }}>|</Typography>
                        <Chip
                          size="sm"
                          variant="soft"
                          color={isBalanced ? 'success' : totalDebit === 0 ? 'neutral' : 'danger'}
                        >
                          {isBalanced ? 'Balanced' : totalDebit === 0 ? 'Pending' : 'Unbalanced'}
                        </Chip>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1} sx={{ pt: 1 }}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography level="body-sm">Total Debit</Typography>
                          <Typography level="body-sm" fontWeight={500}>{formatCurrency(totalDebit)}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography level="body-sm">Total Credit</Typography>
                          <Typography level="body-sm" fontWeight={500}>{formatCurrency(totalCredit)}</Typography>
                        </Stack>
                        <Divider />
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography level="body-sm">Status</Typography>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={isBalanced ? 'success' : totalDebit === 0 ? 'neutral' : 'danger'}
                          >
                            {isBalanced ? 'Entry is balanced' : totalDebit === 0 ? 'Enter debit and credit amounts' : `Difference: ${formatCurrency(Math.abs(totalDebit - totalCredit))}`}
                          </Chip>
                        </Stack>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </AccordionGroup>
              </Box>
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
              disabled={!isBalanced}
            >
              {editingEntry ? 'Update Entry' : 'Create Entry'}
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Journal Entry"
        description={`Are you sure you want to delete journal entry ${entryToDelete?.entryNumber}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />

    </Container>
  );
}
