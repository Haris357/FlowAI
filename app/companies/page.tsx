'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Stack, Button, IconButton, Grid,
  Chip, Modal, ModalDialog, ModalClose, Input, Textarea, Dropdown, Menu, MenuButton,
  MenuItem, Divider, FormControl, FormLabel, List, ListItem, Avatar, Sheet,
  Autocomplete, LinearProgress, Tooltip,
} from '@mui/joy';
import {
  Building2, Plus, Lock, Users as UsersIcon, Download, Trash2, Calendar,
  DollarSign, Shield, Mail, X, BookOpen, Moon, Sun, LogOut, Settings,
  Search, LayoutGrid, List as ListIcon, Check, FileText, ArrowRight,
  Table as TableIcon, Grid3x3, MoreVertical, Briefcase, Home, Bell,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { countries } from '@/lib/countries';
import { getAllChartOfAccounts } from '@/lib/chart-of-accounts';
import { initializeCompanyAccounts, initializeMasterAccountTypes } from '@/services/account-init';
import { initializeCompanySettings } from '@/services/settings';
import { ALL_SETTINGS } from '@/lib/settings-seed-data';
import { isAdminEmail } from '@/lib/admin';
import {
  collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc,
  Timestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { LoadingSpinner, DangerousConfirmDialog, ConfirmDialog } from '@/components/common';
import { deleteCompanyData, getCompanyDataCounts } from '@/services/company';
import CompanyCard, { type CompanyData } from '@/components/companies/CompanyCard';
import NotificationBell from '@/components/notifications/NotificationBell';
import NotificationPanel from '@/components/notifications/NotificationPanel';
import SettingsModal from '@/components/settings/SettingsModal';

const BUSINESS_TYPES = ALL_SETTINGS.find(s => s.code === 'business_type')?.options.map(o => o.label) || [
  'Freelancer', 'Consulting', 'Retail', 'Services', 'Other',
];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CompaniesPage() {
  const { user, signOut } = useAuth();
  const { mode, toggleMode } = useTheme();
  const { plan } = useSubscription();
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table' | 'compact'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; companyId: string; companyName: string } | null>(null);
  const [removeUserConfirm, setRemoveUserConfirm] = useState<{ open: boolean; email: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dataCounts, setDataCounts] = useState<Record<string, number> | null>(null);

  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');

  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [addingUser, setAddingUser] = useState(false);

  const [newCompany, setNewCompany] = useState({
    companyName: '', businessType: '', country: 'US', currency: 'USD',
    email: user?.email || '', phone: '', website: '', taxId: '',
    address: '', city: '', zipCode: '', fiscalYearStart: 1,
    hasInvoices: true, hasEmployees: false, tracksInventory: false,
    invoicePrefix: 'INV', invoiceStartNumber: 1000, description: '',
  });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchCompanies();
  }, [user, router]);

  const fetchCompanies = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'companies'), where('ownerId', '==', user.uid));
      const snap = await getDocs(q);
      setCompanies(snap.docs.map(d => ({ id: d.id, ...d.data() })) as CompanyData[]);
    } catch { toast.error('Failed to load companies'); }
    finally { setLoading(false); }
  };

  const selectedCountry = useMemo(() => countries.find(c => c.code === newCompany.country), [newCompany.country]);

  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    const q = searchQuery.toLowerCase();
    return companies.filter(c =>
      c.name.toLowerCase().includes(q) || c.businessType.toLowerCase().includes(q) || c.currency.toLowerCase().includes(q)
    );
  }, [companies, searchQuery]);

  const handleInputChange = (field: string, value: any) => setNewCompany(p => ({ ...p, [field]: value }));

  const validateStep = (): boolean => {
    if (createStep === 1) {
      if (!newCompany.companyName.trim()) { toast.error('Please enter company name'); return false; }
      if (!newCompany.businessType) { toast.error('Please select business type'); return false; }
    }
    if (createStep === 2 && !newCompany.country) { toast.error('Please select country'); return false; }
    return true;
  };

  const nextStep = () => { if (validateStep()) setCreateStep(p => Math.min(p + 1, 3)); };
  const prevStep = () => setCreateStep(p => Math.max(p - 1, 1));

  const handleCreateCompany = async () => {
    if (!user || !validateStep()) return;
    setCreating(true);
    try {
      const companyData = {
        name: newCompany.companyName.trim(), businessType: newCompany.businessType,
        country: newCompany.country, currency: newCompany.currency,
        email: newCompany.email.trim(), phone: newCompany.phone.trim(),
        website: newCompany.website.trim(), taxId: newCompany.taxId.trim(),
        address: newCompany.address.trim(), city: newCompany.city.trim(),
        zipCode: newCompany.zipCode.trim(), fiscalYearStart: newCompany.fiscalYearStart,
        hasInvoices: newCompany.hasInvoices, hasEmployees: newCompany.hasEmployees,
        tracksInventory: newCompany.tracksInventory, invoicePrefix: newCompany.invoicePrefix,
        invoiceNextNumber: newCompany.invoiceStartNumber, description: newCompany.description.trim(),
        ownerId: user.uid, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
        hasPasscode: false, collaborators: [], collaboratorEmails: [], accountsCreated: true,
      };
      const companyRef = await addDoc(collection(db, 'companies'), companyData);
      await initializeMasterAccountTypes();
      await initializeCompanyAccounts(companyRef.id, newCompany.businessType);
      await initializeCompanySettings(companyRef.id);
      toast.success('Company created successfully!');
      setCreateModalOpen(false);
      setCreateStep(1);
      setNewCompany({
        companyName: '', businessType: '', country: 'US', currency: 'USD',
        email: user?.email || '', phone: '', website: '', taxId: '',
        address: '', city: '', zipCode: '', fiscalYearStart: 1,
        hasInvoices: true, hasEmployees: false, tracksInventory: false,
        invoicePrefix: 'INV', invoiceStartNumber: 1000, description: '',
      });
      fetchCompanies();
    } catch { toast.error('Failed to create company'); }
    finally { setCreating(false); }
  };

  const handleOpenDeleteConfirm = async (companyId: string, companyName: string) => {
    try { setDataCounts(await getCompanyDataCounts(companyId)); } catch { setDataCounts(null); }
    setDeleteConfirm({ open: true, companyId, companyName });
  };

  const handleDeleteCompany = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const result = await deleteCompanyData(deleteConfirm.companyId);
      if (result.success) {
        await deleteDoc(doc(db, 'companies', deleteConfirm.companyId));
        toast.success('Company deleted');
        setDeleteConfirm(null); setDataCounts(null); fetchCompanies();
      }
    } catch (e: any) { toast.error(e.message || 'Failed to delete'); }
    finally { setDeleting(false); }
  };

  const getWarningItems = (): string[] => {
    const items: string[] = [];
    if (dataCounts) {
      if (dataCounts.invoices > 0) items.push(`${dataCounts.invoices} invoice(s)`);
      if (dataCounts.bills > 0) items.push(`${dataCounts.bills} bill(s)`);
      if (dataCounts.customers > 0) items.push(`${dataCounts.customers} customer(s)`);
      if (dataCounts.vendors > 0) items.push(`${dataCounts.vendors} vendor(s)`);
      if (dataCounts.employees > 0) items.push(`${dataCounts.employees} employee(s)`);
      if (dataCounts.transactions > 0) items.push(`${dataCounts.transactions} transaction(s)`);
      if (dataCounts.journalEntries > 0) items.push(`${dataCounts.journalEntries} journal entry(ies)`);
      if (dataCounts.salarySlips > 0) items.push(`${dataCounts.salarySlips} salary slip(s)`);
    } else {
      items.push('All invoices', 'All bills', 'All customers', 'All vendors', 'All transactions');
    }
    items.push('Chart of Accounts (reset to defaults)', 'All custom settings', 'The company itself');
    return items;
  };

  const handleBackupCompany = async (companyId: string, companyName: string) => {
    try {
      const snap = await getDocs(query(collection(db, 'companies'), where('__name__', '==', companyId)));
      const txns = await getDocs(collection(db, `companies/${companyId}/transactions`));
      const backup = { company: snap.docs[0]?.data(), transactions: txns.docs.map(d => d.data()), exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${companyName.replace(/[^a-z0-9]/gi, '_')}_backup_${Date.now()}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
    } catch { toast.error('Failed to backup'); }
  };

  const handleSelectCompany = async (company: CompanyData) => {
    if (!company.accountsCreated) {
      try {
        const accountsRef = collection(db, `companies/${company.id}/chartOfAccounts`);
        const snap = await getDocs(accountsRef);
        if (snap.empty) {
          const allAccounts = getAllChartOfAccounts();
          await Promise.all(allAccounts.map(a => addDoc(accountsRef, { ...a, createdAt: Timestamp.now(), updatedAt: Timestamp.now() })));
          await updateDoc(doc(db, 'companies', company.id), { accountsCreated: true, updatedAt: Timestamp.now() });
        }
      } catch { /* continue */ }
    }
    try { await initializeCompanySettings(company.id); } catch { /* continue */ }

    if (company.hasPasscode) {
      setSelectedCompany(company); setPasscodeInput(''); setVerifyModalOpen(true);
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
    } else { toast.error('Incorrect passcode'); setPasscodeInput(''); }
  };

  const handleOpenSecurity = (company: CompanyData, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCompany(company); setNewPasscode(''); setConfirmPasscode(''); setPasscodeInput('');
    setSecurityModalOpen(true);
  };

  const handleSetPasscode = async () => {
    if (!selectedCompany) return;
    if (selectedCompany.hasPasscode && passcodeInput !== selectedCompany.passcode) { toast.error('Current passcode is incorrect'); return; }
    if (newPasscode.length < 4) { toast.error('Passcode must be at least 4 characters'); return; }
    if (newPasscode !== confirmPasscode) { toast.error('Passcodes do not match'); return; }
    try {
      await updateDoc(doc(db, 'companies', selectedCompany.id), { hasPasscode: true, passcode: newPasscode, updatedAt: Timestamp.now() });
      toast.success('Passcode set'); setSecurityModalOpen(false); fetchCompanies();
    } catch { toast.error('Failed to set passcode'); }
  };

  const handleRemovePasscode = async () => {
    if (!selectedCompany) return;
    if (passcodeInput !== selectedCompany.passcode) { toast.error('Incorrect passcode'); return; }
    try {
      await updateDoc(doc(db, 'companies', selectedCompany.id), { hasPasscode: false, passcode: null, updatedAt: Timestamp.now() });
      toast.success('Passcode removed'); setSecurityModalOpen(false); fetchCompanies();
    } catch { toast.error('Failed to remove passcode'); }
  };

  const handleOpenUsers = (company: CompanyData, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCompany(company); setNewUserEmail(''); setUsersModalOpen(true);
  };

  const handleAddCollaborator = async () => {
    if (!selectedCompany || !newUserEmail.trim()) { toast.error('Please enter an email'); return; }
    const email = newUserEmail.trim().toLowerCase();
    if (email === user?.email?.toLowerCase()) { toast.error('Cannot add yourself'); return; }
    if (selectedCompany.collaboratorEmails?.includes(email)) { toast.error('Already a collaborator'); return; }
    setAddingUser(true);
    try {
      await updateDoc(doc(db, 'companies', selectedCompany.id), { collaboratorEmails: arrayUnion(email), updatedAt: Timestamp.now() });
      toast.success('Collaborator added'); setNewUserEmail(''); fetchCompanies();
      setSelectedCompany({ ...selectedCompany, collaboratorEmails: [...(selectedCompany.collaboratorEmails || []), email] });
    } catch { toast.error('Failed to add collaborator'); }
    finally { setAddingUser(false); }
  };

  const handleRemoveCollaborator = async () => {
    if (!selectedCompany || !removeUserConfirm) return;
    try {
      await updateDoc(doc(db, 'companies', selectedCompany.id), { collaboratorEmails: arrayRemove(removeUserConfirm.email), updatedAt: Timestamp.now() });
      toast.success('Collaborator removed'); setRemoveUserConfirm(null); fetchCompanies();
      setSelectedCompany({ ...selectedCompany, collaboratorEmails: selectedCompany.collaboratorEmails?.filter(e => e !== removeUserConfirm.email) || [] });
    } catch { toast.error('Failed to remove collaborator'); }
  };

  if (loading) {
    return <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner message="Loading your companies..." /></Box>;
  }

  const progress = (createStep / 3) * 100;
  const isAdmin = isAdminEmail(user?.email);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body' }}>
      {/* ===== Navbar ===== */}
      <Sheet sx={{
        position: 'sticky', top: 0, zIndex: 1000,
        borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: 'background.surface',
        backdropFilter: 'blur(12px)',
      }}>
        <Box sx={{ maxWidth: 1152, mx: 'auto', px: { xs: 2, sm: 3 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ height: 56 }}>
            {/* Left: Home + Logo */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Home">
                <IconButton variant="plain" size="sm" onClick={() => router.push('/')}>
                  <Home size={18} />
                </IconButton>
              </Tooltip>
              <Divider orientation="vertical" sx={{ height: 20 }} />
              <Stack direction="row" spacing={1} alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => router.push('/companies')}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: 'md',
                  background: 'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BookOpen size={16} color="white" strokeWidth={2.5} />
                </Box>
                <Typography level="title-md" fontWeight="bold" sx={{ letterSpacing: '-0.03em' }}>
                  Flow<span style={{ fontStyle: 'italic' }}>books</span>
                </Typography>
              </Stack>
            </Stack>

            {/* Right: Notifications + General + Theme + Avatar */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <NotificationBell onClick={() => setNotificationPanelOpen(true)} />
              <Tooltip title="Settings">
                <IconButton variant="plain" size="sm" onClick={() => setSettingsModalOpen(true)}>
                  <Settings size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
                <IconButton variant="plain" size="sm" onClick={toggleMode}
                  sx={{ transition: 'transform 0.3s', '&:hover': { transform: 'rotate(180deg)' } }}>
                  {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </IconButton>
              </Tooltip>
              <Dropdown>
                <MenuButton slots={{ root: IconButton }} slotProps={{ root: { variant: 'plain', size: 'sm', sx: { p: 0.25 } } }}>
                  <Avatar size="sm" src={user?.photoURL || undefined} sx={{ width: 30, height: 30, fontSize: '0.8rem' }}>
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                  </Avatar>
                </MenuButton>
                <Menu placement="bottom-end" sx={{ minWidth: 200, zIndex: 1100 }}>
                  <MenuItem disabled>
                    <Stack>
                      <Typography level="body-sm" fontWeight={600}>{user?.displayName || 'User'}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{user?.email}</Typography>
                    </Stack>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => setSettingsModalOpen(true)}><Settings size={14} /> Account Settings</MenuItem>
                  <Divider />
                  <MenuItem color="danger" onClick={signOut}><LogOut size={14} /> Sign out</MenuItem>
                </Menu>
              </Dropdown>
            </Stack>
          </Stack>
        </Box>
      </Sheet>

      {/* ===== Page Content ===== */}
      <Box sx={{ maxWidth: 1152, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          {/* Welcome + New Company */}
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
            <Box>
              <Typography level="h3" fontWeight={700}>
                Welcome back, {user?.displayName?.split(' ')[0] || 'there'}
              </Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                {companies.length} {companies.length === 1 ? 'company' : 'companies'} in your portfolio
              </Typography>
            </Box>
            <Button size="sm" startDecorator={<Plus size={16} />} onClick={() => setCreateModalOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
                '&:hover': { background: 'linear-gradient(135deg, var(--joy-palette-primary-600), var(--joy-palette-primary-700))' },
              }}>
              New Company
            </Button>
          </Stack>

          {/* Search & View Toggle */}
          {companies.length > 0 && (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                startDecorator={<Search size={16} />}
                size="sm"
                sx={{ flex: 1, maxWidth: 320 }}
              />
              <Stack direction="row" spacing={0.25}>
                {(['grid', 'compact', 'list', 'table'] as const).map(m => {
                  const icons = { grid: LayoutGrid, compact: Grid3x3, list: ListIcon, table: TableIcon };
                  const Icon = icons[m];
                  return (
                    <IconButton key={m} size="sm" variant={viewMode === m ? 'solid' : 'plain'}
                      color={viewMode === m ? 'primary' : 'neutral'} onClick={() => setViewMode(m)}>
                      <Icon size={16} />
                    </IconButton>
                  );
                })}
              </Stack>
            </Stack>
          )}

          {/* Companies */}
          {filteredCompanies.length === 0 ? (
            <Card variant="outlined" sx={{ textAlign: 'center', py: 10, px: 4, border: '2px dashed', borderColor: 'divider' }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: '50%', bgcolor: 'primary.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <Building2 size={28} style={{ color: 'var(--joy-palette-primary-500)' }} />
              </Box>
              <Typography level="h4" sx={{ mb: 0.5 }}>{searchQuery ? 'No companies found' : 'No companies yet'}</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 3 }}>
                {searchQuery ? `No results for "${searchQuery}"` : 'Get started by creating your first company'}
              </Typography>
              {!searchQuery && (
                <Button size="sm" startDecorator={<Plus size={16} />} onClick={() => setCreateModalOpen(true)}>Create Company</Button>
              )}
            </Card>
          ) : viewMode === 'table' ? (
            <Sheet variant="outlined" sx={{ borderRadius: 'md', overflow: 'hidden' }}>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--joy-palette-divider)', backgroundColor: 'var(--joy-palette-background-level1)' }}>
                      {['Company', 'Type', 'Currency', 'Created', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--joy-palette-text-tertiary)', ...(h === '' ? { width: '50px' } : {}) }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.map(company => (
                      <tr key={company.id} style={{ borderBottom: '1px solid var(--joy-palette-divider)', cursor: 'pointer', transition: 'background-color 0.15s' }}
                        onClick={() => handleSelectCompany(company)}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--joy-palette-background-level1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <td style={{ padding: '10px 16px' }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar size="sm" sx={{ width: 28, height: 28, fontSize: '0.75rem', background: 'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))' }}>{company.name.charAt(0)}</Avatar>
                            <Typography level="body-sm" fontWeight={600}>{company.name}</Typography>
                          </Stack>
                        </td>
                        <td style={{ padding: '10px 16px' }}><Chip size="sm" variant="soft" color="primary" sx={{ fontSize: '10px' }}>{company.businessType}</Chip></td>
                        <td style={{ padding: '10px 16px' }}><Typography level="body-xs">{company.currency}</Typography></td>
                        <td style={{ padding: '10px 16px' }}><Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{company.createdAt?.toDate ? new Date(company.createdAt.toDate()).toLocaleDateString() : '-'}</Typography></td>
                        <td style={{ padding: '10px 16px' }}>
                          {company.hasPasscode && <Chip size="sm" variant="soft" color="warning" sx={{ fontSize: '10px' }}><Lock size={10} /></Chip>}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <Dropdown>
                            <MenuButton slots={{ root: IconButton }} slotProps={{ root: { variant: 'plain', size: 'sm' } }} onClick={e => e.stopPropagation()}>
                              <MoreVertical size={14} />
                            </MenuButton>
                            <Menu placement="bottom-end" sx={{ zIndex: 1100 }}>
                              <MenuItem onClick={e => { e.stopPropagation(); handleSelectCompany(company); }}><ArrowRight size={14} /> Open</MenuItem>
                              <MenuItem onClick={e => handleOpenSecurity(company, e)}><Shield size={14} /> Security</MenuItem>
                              <MenuItem onClick={e => handleOpenUsers(company, e)}><UsersIcon size={14} /> Collaborators</MenuItem>
                              <MenuItem onClick={e => { e.stopPropagation(); handleBackupCompany(company.id, company.name); }}><Download size={14} /> Backup</MenuItem>
                              <Divider />
                              <MenuItem color="danger" onClick={e => { e.stopPropagation(); handleOpenDeleteConfirm(company.id, company.name); }}><Trash2 size={14} /> Delete</MenuItem>
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
            <Stack spacing={1.5}>
              {filteredCompanies.map((c, i) => (
                <CompanyCard key={c.id} company={c} viewMode="list" index={i} onSelect={handleSelectCompany} onOpenSecurity={handleOpenSecurity} onOpenUsers={handleOpenUsers} onBackup={handleBackupCompany} onDelete={handleOpenDeleteConfirm} />
              ))}
            </Stack>
          ) : viewMode === 'compact' ? (
            <Grid container spacing={2}>
              {filteredCompanies.map((c, i) => (
                <Grid key={c.id} xs={6} sm={4} md={3}>
                  <CompanyCard company={c} viewMode="compact" index={i} onSelect={handleSelectCompany} onOpenSecurity={handleOpenSecurity} onOpenUsers={handleOpenUsers} onBackup={handleBackupCompany} onDelete={handleOpenDeleteConfirm} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={2}>
              {filteredCompanies.map((c, i) => (
                <Grid key={c.id} xs={12} sm={6} md={4}>
                  <CompanyCard company={c} viewMode="grid" index={i} onSelect={handleSelectCompany} onOpenSecurity={handleOpenSecurity} onOpenUsers={handleOpenUsers} onBackup={handleBackupCompany} onDelete={handleOpenDeleteConfirm} />
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>

        {/* Footer */}
        <Box sx={{ py: 2, mt: 4, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '11px' }}>
            &copy; {new Date().getFullYear()} Flowbooks. All rights reserved.
          </Typography>
        </Box>
      </Box>

      {/* Create Company Modal */}
      <Modal open={createModalOpen} onClose={() => !creating && setCreateModalOpen(false)}>
        <ModalDialog sx={{ maxWidth: 540, width: '90vw', maxHeight: '90vh', overflow: 'auto', p: 3 }}>
          <ModalClose disabled={creating} />
          <Typography level="title-lg" fontWeight={700} sx={{ mb: 0.25 }}>Create New Company</Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 2 }}>Step {createStep} of 3</Typography>
          <LinearProgress determinate value={progress} sx={{ mb: 2.5 }} color="primary" />

          {createStep === 1 && (
            <Stack spacing={2}>
              <FormControl required size="sm"><FormLabel>Company Name</FormLabel>
                <Input placeholder="Enter company name" value={newCompany.companyName} onChange={e => handleInputChange('companyName', e.target.value)} autoFocus />
              </FormControl>
              <FormControl required size="sm"><FormLabel>Business Type</FormLabel>
                <Autocomplete size="sm" placeholder="Select business type" options={BUSINESS_TYPES} value={newCompany.businessType} onChange={(e, v) => handleInputChange('businessType', v || '')} freeSolo />
              </FormControl>
              <FormControl size="sm"><FormLabel>Description</FormLabel>
                <Textarea placeholder="Brief description" value={newCompany.description} onChange={e => handleInputChange('description', e.target.value)} minRows={2} />
              </FormControl>
            </Stack>
          )}
          {createStep === 2 && (
            <Stack spacing={2}>
              <FormControl required size="sm"><FormLabel>Country</FormLabel>
                <Autocomplete size="sm" placeholder="Select country" options={countries} getOptionLabel={o => o.name} value={selectedCountry || null}
                  onChange={(e, v) => { if (v) { handleInputChange('country', v.code); handleInputChange('currency', v.currency); } }} />
              </FormControl>
              <FormControl required size="sm"><FormLabel>Currency</FormLabel>
                <Input size="sm" value={newCompany.currency} onChange={e => handleInputChange('currency', e.target.value)} placeholder="USD" />
              </FormControl>
              <FormControl size="sm"><FormLabel>Email</FormLabel><Input size="sm" type="email" placeholder="company@example.com" value={newCompany.email} onChange={e => handleInputChange('email', e.target.value)} /></FormControl>
              <FormControl size="sm"><FormLabel>Phone</FormLabel><Input size="sm" type="tel" placeholder="+1 (555) 123-4567" value={newCompany.phone} onChange={e => handleInputChange('phone', e.target.value)} /></FormControl>
              <FormControl size="sm"><FormLabel>Website</FormLabel><Input size="sm" type="url" placeholder="https://example.com" value={newCompany.website} onChange={e => handleInputChange('website', e.target.value)} /></FormControl>
            </Stack>
          )}
          {createStep === 3 && (
            <Stack spacing={2}>
              <FormControl size="sm"><FormLabel>Tax ID</FormLabel><Input size="sm" placeholder="Enter tax ID" value={newCompany.taxId} onChange={e => handleInputChange('taxId', e.target.value)} /></FormControl>
              <FormControl size="sm"><FormLabel>Address</FormLabel><Input size="sm" placeholder="Street address" value={newCompany.address} onChange={e => handleInputChange('address', e.target.value)} /></FormControl>
              <Grid container spacing={2}>
                <Grid xs={6}><FormControl size="sm"><FormLabel>City</FormLabel><Input size="sm" placeholder="City" value={newCompany.city} onChange={e => handleInputChange('city', e.target.value)} /></FormControl></Grid>
                <Grid xs={6}><FormControl size="sm"><FormLabel>Zip Code</FormLabel><Input size="sm" placeholder="Zip code" value={newCompany.zipCode} onChange={e => handleInputChange('zipCode', e.target.value)} /></FormControl></Grid>
              </Grid>
              <FormControl size="sm"><FormLabel>Fiscal Year Start</FormLabel>
                <Autocomplete size="sm" placeholder="Select month" options={MONTHS} value={MONTHS[newCompany.fiscalYearStart - 1]}
                  onChange={(e, v) => handleInputChange('fiscalYearStart', MONTHS.indexOf(v || 'January') + 1)} />
              </FormControl>
              <FormControl size="sm"><FormLabel>Invoice Settings</FormLabel>
                <Grid container spacing={2}>
                  <Grid xs={6}><Input size="sm" placeholder="Prefix" value={newCompany.invoicePrefix} onChange={e => handleInputChange('invoicePrefix', e.target.value)} /></Grid>
                  <Grid xs={6}><Input size="sm" type="number" placeholder="Start number" value={newCompany.invoiceStartNumber} onChange={e => handleInputChange('invoiceStartNumber', parseInt(e.target.value) || 1000)} /></Grid>
                </Grid>
              </FormControl>
            </Stack>
          )}

          <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
            {createStep > 1 && <Button variant="outlined" color="neutral" size="sm" onClick={prevStep} disabled={creating} fullWidth>Previous</Button>}
            {createStep < 3
              ? <Button size="sm" onClick={nextStep} disabled={creating} fullWidth>Next</Button>
              : <Button size="sm" onClick={handleCreateCompany} loading={creating} fullWidth startDecorator={!creating && <Check size={14} />}>Create Company</Button>
            }
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Security Modal */}
      <Modal open={securityModalOpen} onClose={() => setSecurityModalOpen(false)}>
        <ModalDialog sx={{ maxWidth: 380, p: 3 }}>
          <ModalClose />
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 'md', bgcolor: 'warning.softBg', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={16} style={{ color: 'var(--joy-palette-warning-500)' }} />
            </Box>
            <Box>
              <Typography level="title-md" fontWeight={700}>Security</Typography>
              <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{selectedCompany?.name}</Typography>
            </Box>
          </Stack>
          <Stack spacing={2}>
            {selectedCompany?.hasPasscode && (
              <FormControl size="sm"><FormLabel>Current Passcode</FormLabel><Input size="sm" type="password" value={passcodeInput} onChange={e => setPasscodeInput(e.target.value)} placeholder="Enter current passcode" /></FormControl>
            )}
            <FormControl size="sm"><FormLabel>New Passcode</FormLabel><Input size="sm" type="password" value={newPasscode} onChange={e => setNewPasscode(e.target.value)} placeholder="Min 4 characters" /></FormControl>
            <FormControl size="sm"><FormLabel>Confirm Passcode</FormLabel><Input size="sm" type="password" value={confirmPasscode} onChange={e => setConfirmPasscode(e.target.value)} placeholder="Confirm passcode" /></FormControl>
            <Stack direction="row" spacing={1.5}>
              <Button size="sm" onClick={handleSetPasscode} fullWidth>{selectedCompany?.hasPasscode ? 'Update' : 'Set'} Passcode</Button>
              {selectedCompany?.hasPasscode && <Button size="sm" color="danger" variant="outlined" onClick={handleRemovePasscode} fullWidth>Remove</Button>}
            </Stack>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Verify Passcode Modal */}
      <Modal open={verifyModalOpen} onClose={() => setVerifyModalOpen(false)}>
        <ModalDialog sx={{ maxWidth: 380, p: 3 }}>
          <ModalClose />
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Box>
              <Typography level="title-md" fontWeight={700}>Enter Passcode</Typography>
              <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{selectedCompany?.name}</Typography>
            </Box>
          </Stack>
          <Stack spacing={2}>
            <Input size="sm" type="password" value={passcodeInput} onChange={e => setPasscodeInput(e.target.value)} placeholder="Enter passcode" autoFocus
              onKeyPress={e => { if (e.key === 'Enter') handleVerifyPasscode(); }} />
            <Button size="sm" onClick={handleVerifyPasscode} fullWidth>Verify</Button>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Collaborators Modal */}
      <Modal open={usersModalOpen} onClose={() => setUsersModalOpen(false)}>
        <ModalDialog sx={{ maxWidth: 460, p: 3 }}>
          <ModalClose />
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UsersIcon size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Box>
              <Typography level="title-md" fontWeight={700}>Collaborators</Typography>
              <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{selectedCompany?.name}</Typography>
            </Box>
          </Stack>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1}>
              <Input size="sm" placeholder="Enter email address" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} sx={{ flex: 1 }} startDecorator={<Mail size={14} />} />
              <Button size="sm" onClick={handleAddCollaborator} loading={addingUser} startDecorator={!addingUser && <Plus size={14} />}>Add</Button>
            </Stack>
            {selectedCompany?.collaboratorEmails && selectedCompany.collaboratorEmails.length > 0 && (
              <Box>
                <Typography level="body-xs" fontWeight={600} sx={{ mb: 1, color: 'text.secondary' }}>
                  {selectedCompany.collaboratorEmails.length} collaborator(s)
                </Typography>
                <List size="sm">
                  {selectedCompany.collaboratorEmails.map(email => (
                    <ListItem key={email} endAction={<IconButton size="sm" color="danger" variant="plain" onClick={() => setRemoveUserConfirm({ open: true, email })}><X size={14} /></IconButton>}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar size="sm" sx={{ width: 24, height: 24, fontSize: '0.65rem' }}>{email.charAt(0).toUpperCase()}</Avatar>
                        <Typography level="body-xs">{email}</Typography>
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Stack>
        </ModalDialog>
      </Modal>

      {deleteConfirm && (
        <DangerousConfirmDialog open={deleteConfirm.open}
          onClose={() => { setDeleteConfirm(null); setDataCounts(null); }}
          onConfirm={handleDeleteCompany}
          title={`Delete ${deleteConfirm.companyName}`}
          description="This will permanently delete the company and all data."
          confirmPhrase="DELETE ALL DATA" confirmText="Delete Everything" cancelText="Cancel"
          loading={deleting} warningItems={getWarningItems()} />
      )}
      {removeUserConfirm && (
        <ConfirmDialog open={removeUserConfirm.open} title="Remove Collaborator"
          description={`Remove "${removeUserConfirm.email}" from this company?`}
          confirmText="Remove" variant="danger"
          onConfirm={handleRemoveCollaborator} onClose={() => setRemoveUserConfirm(null)} />
      )}

      <NotificationPanel open={notificationPanelOpen} onClose={() => setNotificationPanelOpen(false)} />
      <SettingsModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
    </Box>
  );
}
