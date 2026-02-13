'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  IconButton,
  Grid,
  Chip,
  Modal,
  ModalDialog,
  ModalClose,
  Input,
  Textarea,
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
  Divider,
  FormControl,
  FormLabel,
  List,
  ListItem,
  Avatar,
  Sheet,
  Autocomplete,
  LinearProgress,
} from '@mui/joy';
import {
  Building2,
  Plus,
  MoreVertical,
  Lock,
  Users as UsersIcon,
  Download,
  Trash2,
  Calendar,
  DollarSign,
  Shield,
  Mail,
  X,
  BookOpen,
  Moon,
  Sun,
  LogOut,
  Settings,
  Search,
  LayoutGrid,
  List as ListIcon,
  TrendingUp,
  Briefcase,
  Check,
  FileText,
  Package,
  ArrowRight,
  Table as TableIcon,
  Grid3x3,
  User,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { countries, Country } from '@/lib/countries';
import { getAllChartOfAccounts } from '@/lib/chart-of-accounts';
import { initializeCompanyAccounts, initializeMasterAccountTypes } from '@/services/account-init';
import { initializeCompanySettings } from '@/services/settings';
import { ALL_SETTINGS } from '@/lib/settings-seed-data';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { LoadingSpinner, DangerousConfirmDialog, ConfirmDialog } from '@/components/common';
import { deleteCompanyData, getCompanyDataCounts } from '@/services/company';

interface Company {
  id: string;
  name: string;
  businessType: string;
  country: string;
  currency: string;
  ownerId: string;
  createdAt: any;
  logo?: string;
  hasPasscode?: boolean;
  passcode?: string;
  collaborators?: string[];
  collaboratorEmails?: string[];
  email?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  fiscalYearStart?: number;
  hasInvoices?: boolean;
  hasEmployees?: boolean;
  tracksInventory?: boolean;
  invoicePrefix?: string;
  invoiceStartNumber?: number;
  description?: string;
  accountsCreated?: boolean;
}

// Get business types from seed data (used before company is created)
const BUSINESS_TYPES = ALL_SETTINGS.find(s => s.code === 'business_type')?.options.map(o => o.label) || [
  'Freelancer',
  'Consulting',
  'Retail',
  'Services',
  'Other',
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function CompaniesPage() {
  const { user, signOut } = useAuth();
  const { mode, toggleMode } = useTheme();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table' | 'compact'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Confirm dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    companyId: string;
    companyName: string;
  } | null>(null);
  const [removeUserConfirm, setRemoveUserConfirm] = useState<{
    open: boolean;
    email: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dataCounts, setDataCounts] = useState<Record<string, number> | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);

  // Security modals
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');

  // User management modal
  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [addingUser, setAddingUser] = useState(false);

  // New company form state
  const [newCompany, setNewCompany] = useState({
    companyName: '',
    businessType: '',
    country: 'US',
    currency: 'USD',
    email: user?.email || '',
    phone: '',
    website: '',
    taxId: '',
    address: '',
    city: '',
    zipCode: '',
    fiscalYearStart: 1,
    hasInvoices: true,
    hasEmployees: false,
    tracksInventory: false,
    invoicePrefix: 'INV',
    invoiceStartNumber: 1000,
    description: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchCompanies();
  }, [user, router]);

  const fetchCompanies = async () => {
    if (!user) return;

    try {
      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef, where('ownerId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const companiesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Company[];

      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const selectedCountry = useMemo(
    () => countries.find((c) => c.code === newCompany.country),
    [newCompany.country]
  );

  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    const query = searchQuery.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.businessType.toLowerCase().includes(query) ||
        c.currency.toLowerCase().includes(query)
    );
  }, [companies, searchQuery]);

  const handleInputChange = (field: string, value: any) => {
    setNewCompany((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (): boolean => {
    switch (createStep) {
      case 1:
        if (!newCompany.companyName.trim()) {
          toast.error('Please enter company name');
          return false;
        }
        if (!newCompany.businessType) {
          toast.error('Please select business type');
          return false;
        }
        return true;
      case 2:
        if (!newCompany.country) {
          toast.error('Please select country');
          return false;
        }
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setCreateStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCreateStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCreateCompany = async () => {
    if (!user || !validateStep()) return;

    setCreating(true);
    try {
      const companyData = {
        name: newCompany.companyName.trim(),
        businessType: newCompany.businessType,
        country: newCompany.country,
        currency: newCompany.currency,
        email: newCompany.email.trim(),
        phone: newCompany.phone.trim(),
        website: newCompany.website.trim(),
        taxId: newCompany.taxId.trim(),
        address: newCompany.address.trim(),
        city: newCompany.city.trim(),
        zipCode: newCompany.zipCode.trim(),
        fiscalYearStart: newCompany.fiscalYearStart,
        hasInvoices: newCompany.hasInvoices,
        hasEmployees: newCompany.hasEmployees,
        tracksInventory: newCompany.tracksInventory,
        invoicePrefix: newCompany.invoicePrefix,
        invoiceNextNumber: newCompany.invoiceStartNumber,
        description: newCompany.description.trim(),
        ownerId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        hasPasscode: false,
        collaborators: [],
        collaboratorEmails: [],
        accountsCreated: true,
      };

      const companyRef = await addDoc(collection(db, 'companies'), companyData);

      // Initialize master account types (only runs once globally)
      await initializeMasterAccountTypes();

      // Initialize dynamic account subtypes and accounts for this company
      await initializeCompanyAccounts(companyRef.id, newCompany.businessType);

      // Initialize company settings (statuses, payment methods, categories, etc.)
      await initializeCompanySettings(companyRef.id);

      toast.success('Company created successfully with chart of accounts!');
      setCreateModalOpen(false);
      setCreateStep(1);
      setNewCompany({
        companyName: '',
        businessType: '',
        country: 'US',
        currency: 'USD',
        email: user?.email || '',
        phone: '',
        website: '',
        taxId: '',
        address: '',
        city: '',
        zipCode: '',
        fiscalYearStart: 1,
        hasInvoices: true,
        hasEmployees: false,
        tracksInventory: false,
        invoicePrefix: 'INV',
        invoiceStartNumber: 1000,
        description: '',
      });
      fetchCompanies();
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Failed to create company');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenDeleteConfirm = async (companyId: string, companyName: string) => {
    setLoadingCounts(true);
    try {
      const counts = await getCompanyDataCounts(companyId);
      setDataCounts(counts);
    } catch (error) {
      console.error('Error loading data counts:', error);
      // Still open dialog even if counts fail - show generic warning
      setDataCounts(null);
    } finally {
      setLoadingCounts(false);
      setDeleteConfirm({
        open: true,
        companyId,
        companyName,
      });
    }
  };

  const handleDeleteCompany = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      // Delete all company data (invoices, bills, customers, etc.)
      const result = await deleteCompanyData(deleteConfirm.companyId);

      if (result.success) {
        // After data cleanup, delete the company document itself
        await deleteDoc(doc(db, 'companies', deleteConfirm.companyId));
        toast.success('Company and all data deleted successfully');
        setDeleteConfirm(null);
        setDataCounts(null);
        fetchCompanies();
      }
    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast.error(error.message || 'Failed to delete company');
    } finally {
      setDeleting(false);
    }
  };

  const getWarningItems = (): string[] => {
    const items: string[] = [];

    if (dataCounts) {
      // Show actual counts if available
      if (dataCounts.invoices > 0) items.push(`${dataCounts.invoices} invoice(s)`);
      if (dataCounts.bills > 0) items.push(`${dataCounts.bills} bill(s)`);
      if (dataCounts.customers > 0) items.push(`${dataCounts.customers} customer(s)`);
      if (dataCounts.vendors > 0) items.push(`${dataCounts.vendors} vendor(s)`);
      if (dataCounts.employees > 0) items.push(`${dataCounts.employees} employee(s)`);
      if (dataCounts.transactions > 0) items.push(`${dataCounts.transactions} transaction(s)`);
      if (dataCounts.journalEntries > 0) items.push(`${dataCounts.journalEntries} journal entry(ies)`);
      if (dataCounts.salarySlips > 0) items.push(`${dataCounts.salarySlips} salary slip(s)`);
      if (dataCounts.customAccounts && dataCounts.customAccounts > 0) {
        items.push(`${dataCounts.customAccounts} custom account(s)`);
      }
      if (dataCounts.customSubtypes && dataCounts.customSubtypes > 0) {
        items.push(`${dataCounts.customSubtypes} custom subtype(s)`);
      }
    } else {
      // Show generic warnings if counts couldn't be loaded
      items.push('All invoices');
      items.push('All bills');
      items.push('All customers');
      items.push('All vendors');
      items.push('All employees');
      items.push('All transactions');
      items.push('All journal entries');
      items.push('All salary slips');
    }

    items.push('Chart of Accounts (will be reset to defaults with proper mappings)');
    items.push('All custom settings (will be reset to defaults)');
    items.push('Invoice/Bill numbering counters (will reset to 1)');
    items.push('The company itself');

    return items;
  };

  const handleBackupCompany = async (companyId: string, companyName: string) => {
    try {
      const companyDoc = await getDocs(
        query(collection(db, 'companies'), where('__name__', '==', companyId))
      );
      const transactionsSnapshot = await getDocs(
        collection(db, `companies/${companyId}/transactions`)
      );

      const backup = {
        company: companyDoc.docs[0]?.data(),
        transactions: transactionsSnapshot.docs.map((doc) => doc.data()),
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${companyName.replace(/[^a-z0-9]/gi, '_')}_backup_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Backup downloaded successfully');
    } catch (error) {
      console.error('Error backing up company:', error);
      toast.error('Failed to backup company data');
    }
  };

  const handleSelectCompany = async (company: Company) => {
    // Check if accounts need to be created for old companies
    if (!company.accountsCreated) {
      try {
        // Check if chart of accounts already exists
        const accountsRef = collection(db, `companies/${company.id}/chartOfAccounts`);
        const accountsSnapshot = await getDocs(accountsRef);

        if (accountsSnapshot.empty) {
          // Create chart of accounts with ALL available accounts
          const allAccounts = getAllChartOfAccounts();

          const accountPromises = allAccounts.map((account) =>
            addDoc(accountsRef, {
              ...account,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            })
          );

          await Promise.all(accountPromises);

          // Mark accounts as created
          await updateDoc(doc(db, 'companies', company.id), {
            accountsCreated: true,
            updatedAt: Timestamp.now(),
          });

          toast.success('Chart of accounts initialized!');
        }
      } catch (error) {
        console.error('Error creating accounts:', error);
        // Continue anyway - accounts can be created later
      }
    }

    // Initialize settings for existing companies (runs only if not already initialized)
    try {
      await initializeCompanySettings(company.id);
    } catch (error) {
      console.error('Error initializing settings:', error);
    }

    if (company.hasPasscode) {
      setSelectedCompany(company);
      setPasscodeInput('');
      setVerifyModalOpen(true);
    } else {
      localStorage.setItem('selectedCompanyId', company.id);
      router.push(`/companies/${company.id}/dashboard`);
    }
  };

  const handleVerifyPasscode = () => {
    if (!selectedCompany) return;

    if (passcodeInput === selectedCompany.passcode) {
      localStorage.setItem('selectedCompanyId', selectedCompany.id);
      setVerifyModalOpen(false);
      router.push(`/companies/${selectedCompany.id}/dashboard`);
    } else {
      toast.error('Incorrect passcode');
      setPasscodeInput('');
    }
  };

  const handleOpenSecurity = (company: Company, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCompany(company);
    setNewPasscode('');
    setConfirmPasscode('');
    setPasscodeInput('');
    setSecurityModalOpen(true);
  };

  const handleSetPasscode = async () => {
    if (!selectedCompany) return;

    if (selectedCompany.hasPasscode && passcodeInput !== selectedCompany.passcode) {
      toast.error('Current passcode is incorrect');
      return;
    }

    if (newPasscode.length < 4) {
      toast.error('Passcode must be at least 4 characters');
      return;
    }

    if (newPasscode !== confirmPasscode) {
      toast.error('Passcodes do not match');
      return;
    }

    try {
      await updateDoc(doc(db, 'companies', selectedCompany.id), {
        hasPasscode: true,
        passcode: newPasscode,
        updatedAt: Timestamp.now(),
      });

      toast.success('Passcode set successfully');
      setSecurityModalOpen(false);
      fetchCompanies();
    } catch (error) {
      console.error('Error setting passcode:', error);
      toast.error('Failed to set passcode');
    }
  };

  const handleRemovePasscode = async () => {
    if (!selectedCompany) return;

    if (passcodeInput !== selectedCompany.passcode) {
      toast.error('Incorrect passcode');
      return;
    }

    try {
      await updateDoc(doc(db, 'companies', selectedCompany.id), {
        hasPasscode: false,
        passcode: null,
        updatedAt: Timestamp.now(),
      });

      toast.success('Passcode removed successfully');
      setSecurityModalOpen(false);
      fetchCompanies();
    } catch (error) {
      console.error('Error removing passcode:', error);
      toast.error('Failed to remove passcode');
    }
  };

  const handleOpenUsers = (company: Company, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCompany(company);
    setNewUserEmail('');
    setUsersModalOpen(true);
  };

  const handleAddCollaborator = async () => {
    if (!selectedCompany || !newUserEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    const email = newUserEmail.trim().toLowerCase();

    if (email === user?.email?.toLowerCase()) {
      toast.error('You cannot add yourself as a collaborator');
      return;
    }

    if (selectedCompany.collaboratorEmails?.includes(email)) {
      toast.error('This user is already a collaborator');
      return;
    }

    setAddingUser(true);
    try {
      await updateDoc(doc(db, 'companies', selectedCompany.id), {
        collaboratorEmails: arrayUnion(email),
        updatedAt: Timestamp.now(),
      });

      toast.success('Collaborator added successfully');
      setNewUserEmail('');
      fetchCompanies();

      setSelectedCompany({
        ...selectedCompany,
        collaboratorEmails: [...(selectedCompany.collaboratorEmails || []), email],
      });
    } catch (error) {
      console.error('Error adding collaborator:', error);
      toast.error('Failed to add collaborator');
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveCollaborator = async () => {
    if (!selectedCompany || !removeUserConfirm) return;

    try {
      await updateDoc(doc(db, 'companies', selectedCompany.id), {
        collaboratorEmails: arrayRemove(removeUserConfirm.email),
        updatedAt: Timestamp.now(),
      });

      toast.success('Collaborator removed successfully');
      setRemoveUserConfirm(null);
      fetchCompanies();

      setSelectedCompany({
        ...selectedCompany,
        collaboratorEmails:
          selectedCompany.collaboratorEmails?.filter(
            (e) => e !== removeUserConfirm.email
          ) || [],
      });
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error('Failed to remove collaborator');
    }
  };

  const progress = (createStep / 3) * 100;

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LoadingSpinner message="Loading your companies..." />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      {/* Header with User Profile Dropdown */}
      <Sheet
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          ...(mode === 'dark' && {
            bgcolor: 'rgba(0, 0, 0, 0.6)',
          }),
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ py: 2 }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 'lg',
                  background:
                    'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                <BookOpen size={22} color="white" strokeWidth={2.5} />
              </Box>
              <Box>
                <Typography
                  level="h4"
                  fontWeight="bold"
                  sx={{ letterSpacing: '-0.03em', lineHeight: 1 }}
                >
                  Flow<span style={{ fontStyle: 'italic' }}>books</span>
                </Typography>
                <Typography
                  level="body-xs"
                  sx={{ color: 'text.tertiary', lineHeight: 1, mt: 0.25 }}
                >
                  Companies
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton
                variant="soft"
                size="md"
                onClick={toggleMode}
                sx={{
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'rotate(180deg)',
                  },
                }}
              >
                {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </IconButton>

              <Dropdown>
                <MenuButton
                  slots={{ root: IconButton }}
                  slotProps={{
                    root: {
                      variant: 'soft',
                      size: 'md',
                    },
                  }}
                >
                  <Avatar size="sm" src={user?.photoURL || undefined}>
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                  </Avatar>
                </MenuButton>
                <Menu placement="bottom-end" sx={{ minWidth: 200, zIndex: 1100 }}>
                  <MenuItem disabled>
                    <Stack>
                      <Typography level="body-sm" fontWeight={600}>
                        {user?.displayName || 'User'}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        {user?.email}
                      </Typography>
                    </Stack>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => router.push('/settings')}>
                    <Settings size={16} />
                    Account Settings
                  </MenuItem>
                  <Divider />
                  <MenuItem color="danger" onClick={signOut}>
                    <LogOut size={16} />
                    Sign out
                  </MenuItem>
                </Menu>
              </Dropdown>
            </Stack>
          </Stack>
        </Container>
      </Sheet>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <Stack spacing={4}>
          {/* Welcome Section */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <Typography level="h2">
                Welcome back, {user?.displayName?.split(' ')[0] || 'there'}!
              </Typography>
            </Stack>
            <Typography level="body-md" sx={{ color: 'text.secondary', mb: 3 }}>
              Here's an overview of your business portfolio
            </Typography>

            {/* Quick Action Buttons */}
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                size="lg"
                startDecorator={<Plus size={20} />}
                onClick={() => setCreateModalOpen(true)}
                sx={{
                  background:
                    'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, var(--joy-palette-primary-600), var(--joy-palette-primary-700))',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                New Company
              </Button>
              <Button
                size="lg"
                variant="outlined"
                color="neutral"
                startDecorator={<FileText size={20} />}
                onClick={() => {
                  if (companies.length > 0) {
                    handleSelectCompany(companies[0]);
                  }
                }}
                disabled={companies.length === 0}
              >
                Quick Access
              </Button>
            </Stack>
          </Box>

          {/* Search & View Toggle */}
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startDecorator={<Search size={18} />}
              sx={{ flex: 1, maxWidth: 400, minWidth: 250 }}
            />
            <Stack direction="row" spacing={0.5}>
              <IconButton
                variant={viewMode === 'grid' ? 'solid' : 'outlined'}
                color={viewMode === 'grid' ? 'primary' : 'neutral'}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <LayoutGrid size={18} />
              </IconButton>
              <IconButton
                variant={viewMode === 'compact' ? 'solid' : 'outlined'}
                color={viewMode === 'compact' ? 'primary' : 'neutral'}
                onClick={() => setViewMode('compact')}
                title="Compact View"
              >
                <Grid3x3 size={18} />
              </IconButton>
              <IconButton
                variant={viewMode === 'list' ? 'solid' : 'outlined'}
                color={viewMode === 'list' ? 'primary' : 'neutral'}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <ListIcon size={18} />
              </IconButton>
              <IconButton
                variant={viewMode === 'table' ? 'solid' : 'outlined'}
                color={viewMode === 'table' ? 'primary' : 'neutral'}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <TableIcon size={18} />
              </IconButton>
            </Stack>
          </Stack>

          {/* Companies Grid/List */}
          {filteredCompanies.length === 0 ? (
            <Card
              variant="outlined"
              sx={{
                textAlign: 'center',
                py: 12,
                px: 4,
                border: '2px dashed',
                borderColor: 'divider',
                background:
                  'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'primary.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                  }}
                >
                  <Building2
                    size={40}
                    style={{ color: 'var(--joy-palette-primary-600)' }}
                  />
                </Box>
                <Typography level="h3" sx={{ mb: 1 }}>
                  {searchQuery
                    ? 'No companies found'
                    : 'No companies yet'}
                </Typography>
                <Typography level="body-md" sx={{ color: 'text.secondary', mb: 4 }}>
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : 'Get started by creating your first company'}
                </Typography>
                {!searchQuery && (
                  <Button
                    size="lg"
                    startDecorator={<Plus size={20} />}
                    onClick={() => setCreateModalOpen(true)}
                    sx={{
                      background:
                        'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
                    }}
                  >
                    Create Company
                  </Button>
                )}
              </Box>
            </Card>
          ) : viewMode === 'table' ? (
            <Sheet
              variant="outlined"
              sx={{
                borderRadius: 'lg',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: '2px solid var(--joy-palette-divider)',
                        backgroundColor: 'var(--joy-palette-background-level1)',
                      }}
                    >
                      <th
                        style={{
                          padding: '16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'var(--joy-palette-text-secondary)',
                        }}
                      >
                        Company
                      </th>
                      <th
                        style={{
                          padding: '16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'var(--joy-palette-text-secondary)',
                        }}
                      >
                        Type
                      </th>
                      <th
                        style={{
                          padding: '16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'var(--joy-palette-text-secondary)',
                        }}
                      >
                        Currency
                      </th>
                      <th
                        style={{
                          padding: '16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'var(--joy-palette-text-secondary)',
                        }}
                      >
                        Created
                      </th>
                      <th
                        style={{
                          padding: '16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'var(--joy-palette-text-secondary)',
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          padding: '16px',
                          textAlign: 'center',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'var(--joy-palette-text-secondary)',
                          width: '100px',
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.map((company) => (
                      <tr
                        key={company.id}
                        style={{
                          borderBottom: '1px solid var(--joy-palette-divider)',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        onClick={() => handleSelectCompany(company)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            'var(--joy-palette-background-level1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td style={{ padding: '16px' }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                              size="sm"
                              sx={{
                                background:
                                  'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
                              }}
                            >
                              {company.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography level="body-sm" fontWeight={600}>
                                {company.name}
                              </Typography>
                              {company.description && (
                                <Typography
                                  level="body-xs"
                                  sx={{ color: 'text.tertiary' }}
                                >
                                  {company.description.substring(0, 30)}
                                  {company.description.length > 30 ? '...' : ''}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <Chip size="sm" variant="soft" color="primary">
                            {company.businessType}
                          </Chip>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <Typography level="body-sm">{company.currency}</Typography>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <Typography level="body-sm">
                            {company.createdAt?.toDate
                              ? new Date(company.createdAt.toDate()).toLocaleDateString()
                              : 'N/A'}
                          </Typography>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <Stack direction="row" spacing={0.5}>
                            {company.hasPasscode && (
                              <Chip size="sm" variant="soft" color="warning" startDecorator={<Lock size={12} />}>
                                Protected
                              </Chip>
                            )}
                          </Stack>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <Dropdown>
                            <MenuButton
                              slots={{ root: IconButton }}
                              slotProps={{
                                root: {
                                  variant: 'plain',
                                  size: 'sm',
                                },
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical size={18} />
                            </MenuButton>
                            <Menu placement="bottom-end" sx={{ zIndex: 1100 }}>
                              <MenuItem onClick={(e) => { e.stopPropagation(); handleSelectCompany(company); }}>
                                <ArrowRight size={16} />
                                Open
                              </MenuItem>
                              <MenuItem onClick={(e) => handleOpenSecurity(company, e)}>
                                <Shield size={16} />
                                Security
                              </MenuItem>
                              <MenuItem onClick={(e) => handleOpenUsers(company, e)}>
                                <UsersIcon size={16} />
                                Collaborators
                              </MenuItem>
                              <MenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBackupCompany(company.id, company.name);
                                }}
                              >
                                <Download size={16} />
                                Backup
                              </MenuItem>
                              <Divider />
                              <MenuItem
                                color="danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDeleteConfirm(company.id, company.name);
                                }}
                              >
                                <Trash2 size={16} />
                                Delete
                              </MenuItem>
                            </Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Sheet>
          ) : viewMode === 'list' ? (
            <Stack spacing={2}>
              {filteredCompanies.map((company) => (
                <Card
                  key={company.id}
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: 'md',
                      borderColor: 'primary.500',
                    },
                  }}
                  onClick={() => handleSelectCompany(company)}
                >
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                        <Avatar
                          size="lg"
                          sx={{
                            background:
                              'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
                          }}
                        >
                          {company.name.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography level="title-lg" fontWeight={600}>
                            {company.name}
                          </Typography>
                          <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                            <Chip size="sm" variant="soft" color="primary">
                              {company.businessType}
                            </Chip>
                            <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                              {company.currency}
                            </Typography>
                            {company.hasPasscode && (
                              <Chip size="sm" variant="soft" color="warning" startDecorator={<Lock size={12} />}>
                                Protected
                              </Chip>
                            )}
                          </Stack>
                          {company.description && (
                            <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 1 }}>
                              {company.description}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                      <Dropdown>
                        <MenuButton
                          slots={{ root: IconButton }}
                          slotProps={{
                            root: {
                              variant: 'plain',
                              size: 'sm',
                            },
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical size={18} />
                        </MenuButton>
                        <Menu placement="bottom-end" sx={{ zIndex: 1100 }}>
                          <MenuItem onClick={(e) => { e.stopPropagation(); handleSelectCompany(company); }}>
                            <ArrowRight size={16} />
                            Open
                          </MenuItem>
                          <MenuItem onClick={(e) => handleOpenSecurity(company, e)}>
                            <Shield size={16} />
                            Security
                          </MenuItem>
                          <MenuItem onClick={(e) => handleOpenUsers(company, e)}>
                            <UsersIcon size={16} />
                            Collaborators
                          </MenuItem>
                          <MenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBackupCompany(company.id, company.name);
                            }}
                          >
                            <Download size={16} />
                            Backup
                          </MenuItem>
                          <Divider />
                          <MenuItem
                            color="danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({
                                open: true,
                                companyId: company.id,
                                companyName: company.name,
                              });
                            }}
                          >
                            <Trash2 size={16} />
                            Delete
                          </MenuItem>
                        </Menu>
                      </Dropdown>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : viewMode === 'compact' ? (
            <Grid container spacing={2}>
              {filteredCompanies.map((company) => (
                <Grid key={company.id} xs={12} sm={6} md={4} lg={3}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: 'md',
                        transform: 'translateY(-4px)',
                        borderColor: 'primary.500',
                      },
                      height: '100%',
                    }}
                    onClick={() => handleSelectCompany(company)}
                  >
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Avatar
                            size="md"
                            sx={{
                              background:
                                'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
                            }}
                          >
                            {company.name.charAt(0)}
                          </Avatar>
                          <Dropdown>
                            <MenuButton
                              slots={{ root: IconButton }}
                              slotProps={{
                                root: {
                                  variant: 'plain',
                                  size: 'sm',
                                },
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical size={16} />
                            </MenuButton>
                            <Menu placement="bottom-end" sx={{ zIndex: 1100 }}>
                              <MenuItem onClick={(e) => { e.stopPropagation(); handleSelectCompany(company); }}>
                                <ArrowRight size={16} />
                                Open
                              </MenuItem>
                              <MenuItem onClick={(e) => handleOpenSecurity(company, e)}>
                                <Shield size={16} />
                                Security
                              </MenuItem>
                              <MenuItem onClick={(e) => handleOpenUsers(company, e)}>
                                <UsersIcon size={16} />
                                Collaborators
                              </MenuItem>
                              <MenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBackupCompany(company.id, company.name);
                                }}
                              >
                                <Download size={16} />
                                Backup
                              </MenuItem>
                              <Divider />
                              <MenuItem
                                color="danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDeleteConfirm(company.id, company.name);
                                }}
                              >
                                <Trash2 size={16} />
                                Delete
                              </MenuItem>
                            </Menu>
                          </Dropdown>
                        </Stack>
                        <Box>
                          <Typography level="title-md" fontWeight={600} noWrap>
                            {company.name}
                          </Typography>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                            {company.businessType}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Chip size="sm" variant="soft">
                            {company.currency}
                          </Chip>
                          {company.hasPasscode && (
                            <Chip size="sm" variant="soft" color="warning">
                              <Lock size={12} />
                            </Chip>
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            // Grid view with improved visual hierarchy
            <Grid container spacing={3}>
              {filteredCompanies.map((company) => (
                <Grid key={company.id} xs={12} sm={6} lg={4}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      height: '100%',
                      '&:hover': {
                        boxShadow: 'lg',
                        transform: 'translateY(-6px)',
                        borderColor: 'primary.500',
                        '&::before': {
                          opacity: 1,
                        },
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background:
                          'linear-gradient(90deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                      },
                    }}
                    onClick={() => handleSelectCompany(company)}
                  >
                    <CardContent>
                      <Stack spacing={3}>
                        {/* Header */}
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 'lg',
                                background:
                                  'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                              }}
                            >
                              <Typography level="h3" sx={{ color: 'white' }}>
                                {company.name.charAt(0)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography level="title-lg" fontWeight={600}>
                                {company.name}
                              </Typography>
                              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                {company.country}
                              </Typography>
                            </Box>
                          </Stack>
                          <Dropdown>
                            <MenuButton
                              slots={{ root: IconButton }}
                              slotProps={{
                                root: {
                                  variant: 'plain',
                                  size: 'sm',
                                },
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical size={18} />
                            </MenuButton>
                            <Menu placement="bottom-end" sx={{ zIndex: 1100 }}>
                              <MenuItem onClick={(e) => { e.stopPropagation(); handleSelectCompany(company); }}>
                                <ArrowRight size={16} />
                                Open Dashboard
                              </MenuItem>
                              <MenuItem onClick={(e) => handleOpenSecurity(company, e)}>
                                <Shield size={16} />
                                Security Settings
                              </MenuItem>
                              <MenuItem onClick={(e) => handleOpenUsers(company, e)}>
                                <UsersIcon size={16} />
                                Manage Collaborators
                              </MenuItem>
                              <MenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBackupCompany(company.id, company.name);
                                }}
                              >
                                <Download size={16} />
                                Download Backup
                              </MenuItem>
                              <Divider />
                              <MenuItem
                                color="danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDeleteConfirm(company.id, company.name);
                                }}
                              >
                                <Trash2 size={16} />
                                Delete Company
                              </MenuItem>
                            </Menu>
                          </Dropdown>
                        </Stack>

                        {/* Description */}
                        {company.description && (
                          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                            {company.description.substring(0, 80)}
                            {company.description.length > 80 ? '...' : ''}
                          </Typography>
                        )}

                        {/* Details */}
                        <Stack spacing={1.5}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Briefcase size={16} style={{ color: 'var(--joy-palette-text-tertiary)' }} />
                            <Typography level="body-sm">{company.businessType}</Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <DollarSign size={16} style={{ color: 'var(--joy-palette-text-tertiary)' }} />
                            <Typography level="body-sm">{company.currency}</Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Calendar size={16} style={{ color: 'var(--joy-palette-text-tertiary)' }} />
                            <Typography level="body-sm">
                              Created {company.createdAt?.toDate
                                ? new Date(company.createdAt.toDate()).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'N/A'}
                            </Typography>
                          </Stack>
                        </Stack>

                        {/* Footer */}
                        <Divider />
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={1}>
                            {company.hasPasscode && (
                              <Chip size="sm" variant="soft" color="warning" startDecorator={<Lock size={12} />}>
                                Secured
                              </Chip>
                            )}
                            {company.collaboratorEmails && company.collaboratorEmails.length > 0 && (
                              <Chip
                                size="sm"
                                variant="soft"
                                color="primary"
                                startDecorator={<UsersIcon size={12} />}
                              >
                                {company.collaboratorEmails.length} collaborator{company.collaboratorEmails.length > 1 ? 's' : ''}
                              </Chip>
                            )}
                          </Stack>
                          <IconButton
                            size="sm"
                            variant="soft"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCompany(company);
                            }}
                          >
                            <ArrowRight size={18} />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      </Container>

      {/* Create Company Modal */}
      <Modal open={createModalOpen} onClose={() => !creating && setCreateModalOpen(false)}>
        <ModalDialog
          sx={{
            maxWidth: 600,
            width: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
          }}
        >
          <ModalClose disabled={creating} />
          <Typography level="h4" sx={{ mb: 1 }}>
            Create New Company
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 3 }}>
            Step {createStep} of 3
          </Typography>

          <LinearProgress
            determinate
            value={progress}
            sx={{ mb: 3 }}
            color="primary"
          />

          {createStep === 1 && (
            <Stack spacing={2}>
              <FormControl required>
                <FormLabel>Company Name</FormLabel>
                <Input
                  placeholder="Enter company name"
                  value={newCompany.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  autoFocus
                />
              </FormControl>

              <FormControl required>
                <FormLabel>Business Type</FormLabel>
                <Autocomplete
                  placeholder="Select business type"
                  options={BUSINESS_TYPES}
                  value={newCompany.businessType}
                  onChange={(e, value) => handleInputChange('businessType', value || '')}
                  freeSolo
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Brief description of your company"
                  value={newCompany.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  minRows={3}
                />
              </FormControl>
            </Stack>
          )}

          {createStep === 2 && (
            <Stack spacing={2}>
              <FormControl required>
                <FormLabel>Country</FormLabel>
                <Autocomplete
                  placeholder="Select country"
                  options={countries}
                  getOptionLabel={(option) => option.name}
                  value={selectedCountry || null}
                  onChange={(e, value) => {
                    if (value) {
                      handleInputChange('country', value.code);
                      handleInputChange('currency', value.currency);
                    }
                  }}
                />
              </FormControl>

              <FormControl required>
                <FormLabel>Currency</FormLabel>
                <Input
                  value={newCompany.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  placeholder="USD"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  placeholder="company@example.com"
                  value={newCompany.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={newCompany.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Website</FormLabel>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={newCompany.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                />
              </FormControl>
            </Stack>
          )}

          {createStep === 3 && (
            <Stack spacing={2}>
              <FormControl>
                <FormLabel>Tax ID / Registration Number</FormLabel>
                <Input
                  placeholder="Enter tax ID"
                  value={newCompany.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Address</FormLabel>
                <Input
                  placeholder="Street address"
                  value={newCompany.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </FormControl>

              <Grid container spacing={2}>
                <Grid xs={6}>
                  <FormControl>
                    <FormLabel>City</FormLabel>
                    <Input
                      placeholder="City"
                      value={newCompany.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </FormControl>
                </Grid>
                <Grid xs={6}>
                  <FormControl>
                    <FormLabel>Zip Code</FormLabel>
                    <Input
                      placeholder="Zip code"
                      value={newCompany.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    />
                  </FormControl>
                </Grid>
              </Grid>

              <FormControl>
                <FormLabel>Fiscal Year Start</FormLabel>
                <Autocomplete
                  placeholder="Select month"
                  options={MONTHS}
                  value={MONTHS[newCompany.fiscalYearStart - 1]}
                  onChange={(e, value) => {
                    const monthIndex = MONTHS.indexOf(value || 'January');
                    handleInputChange('fiscalYearStart', monthIndex + 1);
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Invoice Settings</FormLabel>
                <Grid container spacing={2}>
                  <Grid xs={6}>
                    <Input
                      placeholder="Prefix"
                      value={newCompany.invoicePrefix}
                      onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                    />
                  </Grid>
                  <Grid xs={6}>
                    <Input
                      type="number"
                      placeholder="Start number"
                      value={newCompany.invoiceStartNumber}
                      onChange={(e) =>
                        handleInputChange('invoiceStartNumber', parseInt(e.target.value) || 1000)
                      }
                    />
                  </Grid>
                </Grid>
              </FormControl>
            </Stack>
          )}

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            {createStep > 1 && (
              <Button
                variant="outlined"
                color="neutral"
                onClick={prevStep}
                disabled={creating}
                fullWidth
              >
                Previous
              </Button>
            )}
            {createStep < 3 ? (
              <Button onClick={nextStep} disabled={creating} fullWidth>
                Next
              </Button>
            ) : (
              <Button
                onClick={handleCreateCompany}
                loading={creating}
                fullWidth
                startDecorator={!creating && <Check size={18} />}
              >
                Create Company
              </Button>
            )}
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Security Modal */}
      <Modal
        open={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
      >
        <ModalDialog sx={{ maxWidth: 400 }}>
          <ModalClose />
          <Typography level="h4" startDecorator={<Shield size={24} />} sx={{ mb: 2 }}>
            Security Settings
          </Typography>
          <Typography level="body-sm" sx={{ mb: 3 }}>
            {selectedCompany?.name}
          </Typography>

          <Stack spacing={2}>
            {selectedCompany?.hasPasscode && (
              <FormControl>
                <FormLabel>Current Passcode</FormLabel>
                <Input
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter current passcode"
                />
              </FormControl>
            )}

            <FormControl>
              <FormLabel>New Passcode</FormLabel>
              <Input
                type="password"
                value={newPasscode}
                onChange={(e) => setNewPasscode(e.target.value)}
                placeholder="Enter new passcode (min 4 characters)"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Confirm Passcode</FormLabel>
              <Input
                type="password"
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
                placeholder="Confirm new passcode"
              />
            </FormControl>

            <Stack direction="row" spacing={2}>
              <Button onClick={handleSetPasscode} fullWidth>
                {selectedCompany?.hasPasscode ? 'Update' : 'Set'} Passcode
              </Button>
              {selectedCompany?.hasPasscode && (
                <Button
                  color="danger"
                  variant="outlined"
                  onClick={handleRemovePasscode}
                  fullWidth
                >
                  Remove
                </Button>
              )}
            </Stack>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Verify Passcode Modal */}
      <Modal open={verifyModalOpen} onClose={() => setVerifyModalOpen(false)}>
        <ModalDialog sx={{ maxWidth: 400 }}>
          <ModalClose />
          <Typography level="h4" startDecorator={<Lock size={24} />} sx={{ mb: 2 }}>
            Enter Passcode
          </Typography>
          <Typography level="body-sm" sx={{ mb: 3 }}>
            This company is protected. Please enter the passcode to continue.
          </Typography>

          <Stack spacing={2}>
            <FormControl>
              <FormLabel>{selectedCompany?.name}</FormLabel>
              <Input
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Enter passcode"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleVerifyPasscode();
                  }
                }}
              />
            </FormControl>

            <Button onClick={handleVerifyPasscode} fullWidth>
              Verify
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Collaborators Modal */}
      <Modal open={usersModalOpen} onClose={() => setUsersModalOpen(false)}>
        <ModalDialog sx={{ maxWidth: 500 }}>
          <ModalClose />
          <Typography level="h4" startDecorator={<UsersIcon size={24} />} sx={{ mb: 2 }}>
            Manage Collaborators
          </Typography>
          <Typography level="body-sm" sx={{ mb: 3 }}>
            {selectedCompany?.name}
          </Typography>

          <Stack spacing={3}>
            <Stack direction="row" spacing={1}>
              <Input
                placeholder="Enter email address"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                sx={{ flex: 1 }}
                startDecorator={<Mail size={18} />}
              />
              <Button
                onClick={handleAddCollaborator}
                loading={addingUser}
                startDecorator={!addingUser && <Plus size={18} />}
              >
                Add
              </Button>
            </Stack>

            {selectedCompany?.collaboratorEmails &&
              selectedCompany.collaboratorEmails.length > 0 && (
                <Box>
                  <Typography level="body-sm" fontWeight={600} sx={{ mb: 1 }}>
                    Collaborators ({selectedCompany.collaboratorEmails.length})
                  </Typography>
                  <List>
                    {selectedCompany.collaboratorEmails.map((email) => (
                      <ListItem
                        key={email}
                        endAction={
                          <IconButton
                            size="sm"
                            color="danger"
                            onClick={() =>
                              setRemoveUserConfirm({ open: true, email })
                            }
                          >
                            <X size={16} />
                          </IconButton>
                        }
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar size="sm">{email.charAt(0).toUpperCase()}</Avatar>
                          <Typography level="body-sm">{email}</Typography>
                        </Stack>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <DangerousConfirmDialog
          open={deleteConfirm.open}
          onClose={() => {
            setDeleteConfirm(null);
            setDataCounts(null);
          }}
          onConfirm={handleDeleteCompany}
          title={`Delete ${deleteConfirm.companyName}`}
          description="This action will permanently delete the company and all its business data. This cannot be undone."
          confirmPhrase="DELETE ALL DATA"
          confirmText="Delete Everything"
          cancelText="Cancel"
          loading={deleting}
          warningItems={getWarningItems()}
        />
      )}

      {/* Remove Collaborator Confirm Dialog */}
      {removeUserConfirm && (
        <ConfirmDialog
          open={removeUserConfirm.open}
          title="Remove Collaborator"
          description={`Are you sure you want to remove "${removeUserConfirm.email}" from this company?`}
          confirmText="Remove"
          variant="danger"
          onConfirm={handleRemoveCollaborator}
          onClose={() => setRemoveUserConfirm(null)}
        />
      )}
    </Box>
  );
}
