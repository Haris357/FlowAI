'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Stack, Button, IconButton, Grid,
  Chip, Modal, ModalDialog, ModalClose, Input, Textarea, Dropdown, Menu, MenuButton,
  MenuItem, Divider, FormControl, FormLabel, List, ListItem, Avatar, Sheet,
  Autocomplete, Tooltip,
} from '@mui/joy';
import {
  Building2, Plus, Lock, Users as UsersIcon, Download, Trash2, Calendar,
  DollarSign, Shield, Mail, X, Moon, Sun, LogOut, Settings,
  Search, LayoutGrid, List as ListIcon, Check, FileText, ArrowRight,
  Table as TableIcon, Grid3x3, MoreVertical, Briefcase, Home, Bell,
  Sparkles, Loader2, Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { countries } from '@/lib/countries';
import { getAllChartOfAccounts, getDefaultChartOfAccounts, type ChartAccount } from '@/lib/chart-of-accounts';
import { initializeCompanySettings } from '@/services/settings';
import { ALL_SETTINGS } from '@/lib/settings-seed-data';
import { isAdminEmail } from '@/lib/admin';
import {
  collection, query, where, getDocs, getDoc, addDoc, deleteDoc, doc, updateDoc, setDoc,
  Timestamp, serverTimestamp,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { FlowBooksLogoJoy } from '@/components/FlowBooksLogo';
import { LoadingSpinner, DangerousConfirmDialog, ConfirmDialog } from '@/components/common';
import { deleteCompanyData, getCompanyDataCounts } from '@/services/company';
import CompanyCard, { type CompanyData } from '@/components/companies/CompanyCard';
import NotificationBell from '@/components/notifications/NotificationBell';
import NotificationPanel from '@/components/notifications/NotificationPanel';
import SettingsModal from '@/components/settings/SettingsModal';
import TeamManagementModal from '@/components/team/TeamManagementModal';
import PendingInvitationsBanner from '@/components/team/PendingInvitationsBanner';
import { useSettingsModal } from '@/contexts/SettingsModalContext';
import { PLANS, formatMessages } from '@/lib/plans';
import { getUserMemberships, addOwnerAsMember } from '@/services/members';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions';
import type { CompanyRole } from '@/types';

const BUSINESS_TYPES = ALL_SETTINGS.find(s => s.code === 'business_type')?.options.map(o => o.label) || [
  'Freelancer', 'Consulting', 'Retail', 'Services', 'Other',
];

export default function CompaniesPage() {
  const { user, signOut } = useAuth();
  const { mode, toggleMode } = useTheme();
  const { plan, checkLimit, showUpgradeModal, isTrial, isTrialExpired: trialExpired, subscription } = useSubscription();
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table' | 'compact'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const { isOpen: settingsModalOpen, section: settingsSection, openSettings, closeSettings } = useSettingsModal();

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; companyId: string; companyName: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dataCounts, setDataCounts] = useState<Record<string, number> | null>(null);

  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');

  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [memberCompanies, setMemberCompanies] = useState<Array<{ id: string; data: CompanyData; role: CompanyRole }>>([]);

  const [newCompany, setNewCompany] = useState({
    companyName: '', businessType: '', country: 'US', currency: 'USD', description: '',
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAccounts, setAiAccounts] = useState<ChartAccount[]>([]);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchCompanies();
  }, [user, router]);

  const fetchCompanies = async () => {
    if (!user) return;
    try {
      // Fetch owned companies
      const q = query(collection(db, 'companies'), where('ownerId', '==', user.uid));
      const snap = await getDocs(q);

      // New user with no companies — check memberships first
      if (snap.empty) {
        const memberships = await getUserMemberships(user.uid);
        if (memberships.length === 0) {
          router.replace('/onboarding');
          return;
        }
      }

      setCompanies(snap.docs.map(d => ({ id: d.id, ...d.data() })) as CompanyData[]);

      // Fetch companies user is a member of (not owner)
      try {
        const memberships = await getUserMemberships(user.uid);
        const memberCompanyPromises = memberships
          .filter(m => !snap.docs.some(d => d.id === m.companyId)) // exclude owned
          .map(async m => {
            try {
              const companySnap = await getDoc(doc(db, 'companies', m.companyId));
              if (companySnap.exists()) {
                return { id: m.companyId, data: { id: m.companyId, ...companySnap.data() } as CompanyData, role: m.role };
              }
            } catch { /* company may have been deleted */ }
            return null;
          });
        const results = (await Promise.all(memberCompanyPromises)).filter(Boolean) as Array<{ id: string; data: CompanyData; role: CompanyRole }>;
        setMemberCompanies(results);
      } catch { /* ignore membership fetch errors */ }
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

  const generateAiAccounts = async () => {
    if (!newCompany.description.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/onboarding/suggest-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newCompany.description, businessType: newCompany.businessType }),
      });
      const data = await res.json();
      if (data.accounts?.length) {
        setAiAccounts(data.accounts.map((a: any) => ({ ...a, isActive: true, isSystem: false, balance: 0 })));
        toast.success(`${data.accounts.length} custom accounts suggested!`);
      } else {
        toast.success('Default accounts will work great for your business.');
      }
    } catch {
      toast.error('Could not generate suggestions. Default accounts will be used.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!user) return;
    if (!newCompany.companyName.trim()) { toast.error('Please enter company name'); return; }
    if (!newCompany.businessType) { toast.error('Please select business type'); return; }

    // Check plan limit
    const limitCheck = checkLimit('companies', companies.length);
    if (!limitCheck.allowed) {
      showUpgradeModal(limitCheck.reason || 'Company limit reached. Please upgrade.');
      return;
    }

    setCreating(true);
    try {
      const companyId = doc(collection(db, 'companies')).id;

      await setDoc(doc(db, 'companies', companyId), {
        name: newCompany.companyName.trim(),
        businessType: newCompany.businessType,
        country: newCompany.country,
        currency: newCompany.currency,
        description: newCompany.description.trim(),
        ownerId: user.uid,
        fiscalYearStart: 1,
        hasInvoices: true,
        hasEmployees: false,
        tracksInventory: false,
        invoicePrefix: 'INV',
        invoiceNextNumber: 1000,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create chart of accounts: base + AI-suggested
      const baseAccounts = getDefaultChartOfAccounts(newCompany.businessType.toLowerCase());
      const allAccounts = [...baseAccounts, ...aiAccounts];
      const seen = new Set<string>();
      const uniqueAccounts = allAccounts.filter(a => {
        if (seen.has(a.code)) return false;
        seen.add(a.code);
        return true;
      });

      await Promise.all(
        uniqueAccounts.map(account =>
          setDoc(doc(db, 'companies', companyId, 'accounts', account.code), {
            ...account,
            createdAt: serverTimestamp(),
          })
        )
      );

      // Add owner as first member
      await addOwnerAsMember(companyId, newCompany.companyName.trim(), {
        userId: user.uid,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'Owner',
        photoURL: user.photoURL || undefined,
      });

      await initializeCompanySettings(companyId);
      toast.success('Company created successfully!');
      setCreateModalOpen(false);
      setNewCompany({ companyName: '', businessType: '', country: 'US', currency: 'USD', description: '' });
      setAiAccounts([]);
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
    if (isTrial && trialExpired) {
      openSettings('subscription');
      return;
    }
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
    setSelectedCompany(company);
    setTeamModalOpen(true);
  };

  if (loading) {
    return <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner message="Loading your companies..." /></Box>;
  }

  const isAdmin = isAdminEmail(user?.email);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body', position: 'relative' }}>
      {/* ===== Dot Pattern + Gradient Blobs Background ===== */}
      <Box sx={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {/* Dot pattern */}
        <Box sx={{
          position: 'absolute', inset: 0,
          opacity: mode === 'light' ? 0.03 : 0.02,
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 0.5px, transparent 0.5px)',
          backgroundSize: '32px 32px',
        }} />
        {/* Gradient blobs */}
        <Box sx={{
          position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500,
          borderRadius: '50%',
          background: mode === 'light' ? 'rgba(217,119,87,0.06)' : 'rgba(217,119,87,0.03)',
          filter: 'blur(120px)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: '-20%', left: '-10%', width: 400, height: 400,
          borderRadius: '50%',
          background: mode === 'light' ? 'rgba(196,105,77,0.05)' : 'rgba(196,105,77,0.02)',
          filter: 'blur(100px)',
        }} />
      </Box>
      {/* ===== Navbar ===== */}
      <Sheet sx={{
        position: 'sticky', top: 0, zIndex: 1000,
        borderBottom: '1px solid',
        borderColor: mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
        background: mode === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(26,25,21,0.7)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
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
              <Stack direction="row" spacing={0} alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => router.push('/companies')}>
                <FlowBooksLogoJoy iconSize={28} fontSize="1.1rem" />
              </Stack>
            </Stack>

            {/* Right: Notifications + General + Theme + Avatar */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box data-tour="notifications" sx={{ display: 'inline-flex' }}>
                <NotificationBell onClick={() => setNotificationPanelOpen(true)} />
              </Box>
              <Tooltip title="Settings">
                <IconButton data-tour="settings" variant="plain" size="sm" onClick={() => openSettings()}>
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
                  <MenuItem onClick={() => openSettings()}><Settings size={14} /> Account Settings</MenuItem>
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

          {/* Trial Expired Block */}
          {isTrial && trialExpired && (
            <Box sx={{
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'sm',
            }}>
              {/* Gradient banner */}
              <Box sx={{
                px: { xs: 3, sm: 4 }, py: 3,
                background: 'linear-gradient(135deg, #B91C1C 0%, #D97757 100%)',
                textAlign: 'center',
              }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: '50%', mx: 'auto', mb: 1.5,
                  bgcolor: 'rgba(255,255,255,0.2)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Clock size={22} color="white" />
                </Box>
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem' }}>
                  Your trial has ended
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', mt: 0.5 }}>
                  Subscribe to continue managing your companies
                </Typography>
              </Box>

              {/* Plan cards + CTA */}
              <Box sx={{ p: { xs: 2.5, sm: 3 }, bgcolor: 'background.surface' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
                  {[PLANS.pro, PLANS.max].map(p => (
                    <Box
                      key={p.id}
                      onClick={() => openSettings('subscription')}
                      sx={{
                        flex: 1, p: 2, borderRadius: '12px', cursor: 'pointer',
                        border: p.id === 'pro' ? '2px solid #D97757' : '1px solid',
                        borderColor: p.id === 'pro' ? '#D97757' : 'divider',
                        bgcolor: p.id === 'pro' ? 'rgba(217,119,87,0.04)' : 'transparent',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                        position: 'relative',
                        '&:hover': { borderColor: '#D97757', boxShadow: 'md' },
                      }}
                    >
                      {p.id === 'pro' && (
                        <Chip size="sm" sx={{
                          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                          bgcolor: '#D97757', color: '#fff',
                          fontSize: '0.6rem', fontWeight: 700,
                        }}>
                          RECOMMENDED
                        </Chip>
                      )}
                      <Typography level="body-sm" fontWeight={700}>{p.name}</Typography>
                      <Stack direction="row" alignItems="baseline" justifyContent="center" spacing={0.25} sx={{ my: 0.5 }}>
                        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800 }}>${p.price}</Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>/mo</Typography>
                      </Stack>
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                        {p.id === 'max' ? '3x AI + advanced models' : p.id === 'pro' ? 'Extended AI (4h sessions)' : 'Limited AI usage'}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Button
                  fullWidth
                  size="lg"
                  endDecorator={<ArrowRight size={16} />}
                  onClick={() => openSettings('subscription')}
                  sx={{
                    borderRadius: '10px', fontWeight: 700, py: 1.25,
                    background: 'linear-gradient(135deg, #D97757 0%, #C4694D 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #C4694D 0%, #B85A3D 100%)' },
                  }}
                >
                  Choose a Plan
                </Button>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center', mt: 1.5 }}>
                  Your data is safe and waiting for you
                </Typography>
              </Box>
            </Box>
          )}

          {/* Pending Invitations */}
          <PendingInvitationsBanner onAccepted={fetchCompanies} />

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
            <Button data-tour="new-company" size="sm" startDecorator={<Plus size={16} />}
              disabled={isTrial && trialExpired}
              onClick={() => setCreateModalOpen(true)}
              sx={{
                borderRadius: '20px',
                background: (isTrial && trialExpired) ? undefined : 'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
                '&:hover': {
                  background: (isTrial && trialExpired) ? undefined : 'linear-gradient(135deg, var(--joy-palette-primary-600), var(--joy-palette-primary-700))',
                  transform: (isTrial && trialExpired) ? undefined : 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
                boxShadow: (isTrial && trialExpired) ? undefined : '0 4px 12px rgba(217,119,87,0.25)',
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
                sx={{ flex: 1, maxWidth: 320, borderRadius: '20px' }}
              />
              <Stack direction="row" spacing={0.25}>
                {(['grid', 'compact', 'list', 'table'] as const).map(m => {
                  const icons = { grid: LayoutGrid, compact: Grid3x3, list: ListIcon, table: TableIcon };
                  const Icon = icons[m];
                  return (
                    <IconButton key={m} size="sm" variant={viewMode === m ? 'solid' : 'plain'}
                      color={viewMode === m ? 'primary' : 'neutral'} onClick={() => setViewMode(m)}
                      sx={{ borderRadius: '10px' }}>
                      <Icon size={16} />
                    </IconButton>
                  );
                })}
              </Stack>
            </Stack>
          )}

          {/* Companies */}
          <Box data-tour="company-list">
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
                              <MenuItem onClick={e => handleOpenUsers(company, e)}><UsersIcon size={14} /> Team</MenuItem>
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
          </Box>

          {/* Member Companies (companies user was invited to) */}
          {memberCompanies.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography level="title-sm" fontWeight={700} sx={{ mb: 2, color: 'text.secondary' }}>
                <UsersIcon size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                Shared with you ({memberCompanies.length})
              </Typography>
              <Grid container spacing={2}>
                {memberCompanies.map(({ data: c, role }) => (
                  <Grid key={c.id} xs={12} sm={6} md={4}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: 'primary.300', boxShadow: 'sm', transform: 'translateY(-2px)' },
                      }}
                      onClick={() => handleSelectCompany(c)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar size="sm" sx={{
                            width: 36, height: 36,
                            background: 'linear-gradient(135deg, var(--joy-palette-primary-400), var(--joy-palette-primary-600))',
                          }}>
                            {c.name.charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography level="body-sm" fontWeight={700} noWrap>{c.name}</Typography>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{c.businessType}</Typography>
                          </Box>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={ROLE_COLORS[role]}
                            sx={{ fontSize: '10px', fontWeight: 600 }}
                          >
                            {ROLE_LABELS[role]}
                          </Chip>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
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
        <ModalDialog sx={{
          maxWidth: 500, width: '90vw', maxHeight: '90vh', overflow: 'auto', p: 3,
          background: mode === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(35,34,32,0.9)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid',
          borderColor: mode === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.08)',
          borderRadius: '20px',
        }}>
          <ModalClose disabled={creating} />
          <Typography level="title-lg" fontWeight={700} sx={{ mb: 0.25 }}>Create New Company</Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 2 }}>Just the basics — you can update everything in settings later.</Typography>

          <Stack spacing={2}>
            {/* Company Name */}
            <FormControl required size="sm">
              <FormLabel>Company Name</FormLabel>
              <Input placeholder="Acme Inc." value={newCompany.companyName} onChange={e => handleInputChange('companyName', e.target.value)} autoFocus size="sm" />
            </FormControl>

            {/* Business Type & Country */}
            <Grid container spacing={1.5}>
              <Grid xs={12} md={6}>
                <FormControl required size="sm">
                  <FormLabel>Business Type</FormLabel>
                  <Autocomplete size="sm" placeholder="Select type" options={BUSINESS_TYPES} value={newCompany.businessType} onChange={(_, v) => handleInputChange('businessType', v || '')} />
                </FormControl>
              </Grid>
              <Grid xs={12} md={6}>
                <FormControl required size="sm">
                  <FormLabel>Country</FormLabel>
                  <Autocomplete size="sm" placeholder="Select country" options={countries} getOptionLabel={o => `${o.flag} ${o.name}`} value={selectedCountry || null}
                    onChange={(_, v) => { if (v) { handleInputChange('country', v.code); handleInputChange('currency', v.currency); } }} />
                </FormControl>
              </Grid>
            </Grid>

            {/* AI Business Description */}
            <FormControl size="sm">
              <FormLabel sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                Describe Your Business
                <Chip size="sm" variant="soft" color="primary" startDecorator={<Sparkles size={10} />} sx={{ fontSize: '0.65rem', height: 18, '--Chip-gap': '2px' }}>AI</Chip>
              </FormLabel>
              <Textarea
                value={newCompany.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder="e.g. I run a web design agency with 3 employees. We do monthly retainer contracts and project-based work..."
                minRows={3}
                maxRows={5}
                size="sm"
              />
              <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                Optional — AI will customize your chart of accounts based on this description.
              </Typography>
            </FormControl>

            {/* AI Generate Button */}
            {newCompany.description.trim().length > 20 && (
              <Button
                variant="soft"
                color="primary"
                size="sm"
                fullWidth
                onClick={generateAiAccounts}
                loading={aiLoading}
                startDecorator={aiLoading ? <Loader2 size={14} /> : <Sparkles size={14} />}
                sx={{ borderRadius: 'md' }}
              >
                {aiLoading ? 'Generating Custom Accounts...' : 'Generate Custom Accounts'}
              </Button>
            )}

            {/* AI Suggested Accounts Preview */}
            {aiAccounts.length > 0 && (
              <Card variant="soft" color="primary" sx={{ p: 1.5 }}>
                <Typography level="body-xs" fontWeight={600} sx={{ mb: 0.75, color: 'primary.700' }}>
                  AI-Suggested Accounts ({aiAccounts.length})
                </Typography>
                <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5}>
                  {aiAccounts.map((a, i) => (
                    <Chip key={i} size="sm" variant="outlined" color="primary" sx={{ fontSize: '0.7rem' }}>
                      {a.name}
                    </Chip>
                  ))}
                </Stack>
              </Card>
            )}
          </Stack>

          <Button sx={{ mt: 2.5 }} size="sm" onClick={handleCreateCompany} loading={creating} fullWidth startDecorator={!creating && <Check size={14} />}>
            Create Company
          </Button>
        </ModalDialog>
      </Modal>

      {/* Security Modal */}
      <Modal open={securityModalOpen} onClose={() => setSecurityModalOpen(false)}>
        <ModalDialog sx={{
          maxWidth: 380, p: 3,
          background: mode === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(35,34,32,0.9)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid',
          borderColor: mode === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.08)',
          borderRadius: '20px',
        }}>
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
        <ModalDialog sx={{
          maxWidth: 380, p: 3,
          background: mode === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(35,34,32,0.9)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid',
          borderColor: mode === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.08)',
          borderRadius: '20px',
        }}>
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

      {/* Team Management Modal */}
      {selectedCompany && (
        <TeamManagementModal
          open={teamModalOpen}
          onClose={() => setTeamModalOpen(false)}
          companyId={selectedCompany.id}
          companyName={selectedCompany.name}
          ownerId={selectedCompany.ownerId || user?.uid || ''}
          currentUserRole="owner"
        />
      )}

      {deleteConfirm && (
        <DangerousConfirmDialog open={deleteConfirm.open}
          onClose={() => { setDeleteConfirm(null); setDataCounts(null); }}
          onConfirm={handleDeleteCompany}
          title={`Delete ${deleteConfirm.companyName}`}
          description="This will permanently delete the company and all data."
          confirmPhrase="DELETE ALL DATA" confirmText="Delete Everything" cancelText="Cancel"
          loading={deleting} warningItems={getWarningItems()} />
      )}

      <NotificationPanel open={notificationPanelOpen} onClose={() => setNotificationPanelOpen(false)} />
      <SettingsModal open={settingsModalOpen} onClose={closeSettings} initialSection={settingsSection} />
    </Box>
  );
}
