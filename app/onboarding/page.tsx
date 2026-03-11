'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getDefaultChartOfAccounts, type ChartAccount } from '@/lib/chart-of-accounts';
import { initializeCompanySettings } from '@/services/settings';
import { countries } from '@/lib/countries';
import toast from 'react-hot-toast';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Input,
  Textarea,
  Button,
  Stack,
  Grid,
  Autocomplete,
  FormControl,
  FormLabel,
  LinearProgress,
  IconButton,
  Chip,
} from '@mui/joy';
import {
  Building2, CheckCircle2, ArrowRight, Moon, Sun, Sparkles, Loader2,
} from 'lucide-react';
import { FlowBooksLogoJoy } from '@/components/FlowBooksLogo';

// ─── Enhanced boxes background ───
const BOXES = [
  { w: 64, h: 64, left: '6%', top: '10%', rot: 12, filled: false },
  { w: 48, h: 48, left: '20%', top: '65%', rot: 35, filled: true },
  { w: 80, h: 80, left: '72%', top: '6%', rot: -8, filled: false },
  { w: 44, h: 44, left: '85%', top: '42%', rot: 22, filled: true },
  { w: 56, h: 56, left: '3%', top: '76%', rot: -15, filled: false },
  { w: 100, h: 100, left: '58%', top: '70%', rot: 18, filled: false },
  { w: 36, h: 36, left: '40%', top: '4%', rot: 40, filled: true },
  { w: 72, h: 72, left: '88%', top: '78%', rot: -25, filled: false },
  { w: 52, h: 52, left: '14%', top: '36%', rot: 30, filled: false },
  { w: 44, h: 44, left: '66%', top: '33%', rot: -12, filled: true },
  { w: 60, h: 60, left: '48%', top: '86%', rot: 8, filled: false },
  { w: 32, h: 32, left: '33%', top: '50%', rot: 45, filled: false },
  { w: 90, h: 90, left: '80%', top: '15%', rot: -20, filled: false },
  { w: 42, h: 42, left: '53%', top: '52%', rot: 15, filled: true },
  { w: 70, h: 70, left: '26%', top: '20%', rot: -35, filled: false },
  { w: 50, h: 50, left: '92%', top: '60%', rot: 28, filled: false },
];

const BoxesBackground = () => (
  <Box sx={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    {BOXES.map((box, i) => (
      <Box
        key={i}
        sx={{
          position: 'absolute',
          width: box.w,
          height: box.h,
          left: box.left,
          top: box.top,
          borderRadius: '12px',
          transform: `rotate(${box.rot}deg)`,
          border: box.filled ? 'none' : '1.5px solid',
          borderColor: box.filled ? 'transparent' : 'var(--joy-palette-primary-200)',
          bgcolor: box.filled ? 'primary.50' : 'transparent',
        }}
      />
    ))}
    {/* Soft radial glow */}
    <Box sx={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(circle at 25% 35%, var(--joy-palette-primary-50), transparent 55%), radial-gradient(circle at 75% 65%, var(--joy-palette-primary-50), transparent 55%)',
      opacity: 0.35,
    }} />
  </Box>
);

interface OnboardingData {
  companyName: string;
  businessType: string;
  country: string;
  currency: string;
  description: string;
}

const businessTypes = [
  'Freelancer', 'Consulting', 'Retail', 'Manufacturing', 'Services',
  'Technology', 'Construction', 'Healthcare', 'Education', 'Hospitality',
  'Real Estate', 'Restaurant', 'E-Commerce', 'Agency', 'Other',
];

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const { mode, toggleMode } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAccounts, setAiAccounts] = useState<ChartAccount[]>([]);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const [formData, setFormData] = useState<OnboardingData>({
    companyName: '',
    businessType: '',
    country: 'US',
    currency: 'USD',
    description: '',
  });

  // Load draft on mount
  useEffect(() => {
    if (!user || draftLoaded) return;
    const loadDraft = async () => {
      try {
        const draftRef = doc(db, 'users', user.uid, 'drafts', 'onboarding');
        const draftSnap = await getDoc(draftRef);
        if (draftSnap.exists()) {
          const d = draftSnap.data();
          if (!d.deleted) {
            setFormData(prev => ({
              ...prev,
              companyName: d.companyName || prev.companyName,
              businessType: d.businessType || prev.businessType,
              country: d.country || prev.country,
              currency: d.currency || prev.currency,
              description: d.description || prev.description,
            }));
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      } finally {
        setDraftLoaded(true);
      }
    };
    loadDraft();
  }, [user, draftLoaded]);

  // Save draft on changes
  const saveDraft = useCallback(async (data: OnboardingData) => {
    if (!user) return;
    try {
      const draftRef = doc(db, 'users', user.uid, 'drafts', 'onboarding');
      await setDoc(draftRef, { ...data, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!draftLoaded) return;
    const t = setTimeout(() => saveDraft(formData), 1500);
    return () => clearTimeout(t);
  }, [formData, saveDraft, draftLoaded]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const handleChange = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // AI account suggestion
  const generateAiAccounts = async () => {
    if (!formData.description.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/onboarding/suggest-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          businessType: formData.businessType,
        }),
      });
      const data = await res.json();
      if (data.accounts?.length) {
        setAiAccounts(data.accounts.map((a: any) => ({
          ...a,
          isActive: true,
          isSystem: false,
          balance: 0,
        })));
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

  const handleSubmit = async () => {
    if (!user) return;
    if (!formData.companyName.trim()) {
      toast.error('Please enter your company name');
      return;
    }
    if (!formData.businessType) {
      toast.error('Please select a business type');
      return;
    }

    setLoading(true);
    try {
      const companyId = doc(collection(db, 'companies')).id;

      await setDoc(doc(db, 'companies', companyId), {
        name: formData.companyName,
        businessType: formData.businessType,
        country: formData.country,
        currency: formData.currency,
        description: formData.description,
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

      // Create chart of accounts: base + business-specific + AI-suggested
      const baseAccounts = getDefaultChartOfAccounts(formData.businessType.toLowerCase());
      const allAccounts = [...baseAccounts, ...aiAccounts];

      // Deduplicate by code
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

      // Initialize company settings
      await initializeCompanySettings(companyId);

      // Clean up draft
      try {
        await setDoc(doc(db, 'users', user.uid, 'drafts', 'onboarding'), {
          deleted: true, deletedAt: serverTimestamp(),
        });
      } catch {}

      localStorage.setItem('selectedCompanyId', companyId);
      router.replace('/companies');
      toast.success('Company created successfully!');
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;

  const selectedCountry = countries.find(c => c.code === formData.country);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.body', position: 'relative', overflow: 'hidden' }}>
      <BoxesBackground />

      {/* Dark Mode Toggle */}
      <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 100 }}>
        <IconButton onClick={toggleMode} variant="soft" color="primary" size="sm" sx={{ borderRadius: 'lg', boxShadow: 'sm' }}>
          {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </IconButton>
      </Box>

      {/* Header */}
      <Box sx={{ pt: 2, pb: 1, px: 2, position: 'relative', zIndex: 10 }}>
        <Stack alignItems="center" spacing={0.25}>
          <FlowBooksLogoJoy iconSize={32} fontSize="1.25rem" />
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, pt: 0, position: 'relative', zIndex: 10 }}>
        <Card
          variant="outlined"
          sx={{
            maxWidth: 560,
            width: '100%',
            maxHeight: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'md',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ flex: 1, p: 3, overflowY: 'auto', overflowX: 'hidden' }}>
            <Stack spacing={2}>
              <Box textAlign="center" mb={0.5}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: '50%', mx: 'auto', mb: 1.5,
                  bgcolor: 'primary.softBg', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Building2 size={24} style={{ color: 'var(--joy-palette-primary-500)' }} />
                </Box>
                <Typography level="h4" fontWeight={700}>Create Your Company</Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Just the basics — you can update everything else in settings later.
                </Typography>
              </Box>

              <Grid container spacing={1.5}>
                {/* Company Name */}
                <Grid xs={12}>
                  <FormControl required size="sm">
                    <FormLabel>Company Name</FormLabel>
                    <Input
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      placeholder="Acme Inc."
                      size="sm"
                    />
                  </FormControl>
                </Grid>

                {/* Business Type */}
                <Grid xs={12} md={6}>
                  <FormControl required size="sm">
                    <FormLabel>Business Type</FormLabel>
                    <Autocomplete
                      value={formData.businessType}
                      onChange={(_, v) => handleChange('businessType', v || '')}
                      options={businessTypes}
                      placeholder="Select type"
                      size="sm"
                    />
                  </FormControl>
                </Grid>

                {/* Country */}
                <Grid xs={12} md={6}>
                  <FormControl required size="sm">
                    <FormLabel>Country</FormLabel>
                    <Autocomplete
                      value={selectedCountry}
                      onChange={(_, v) => {
                        if (v) {
                          handleChange('country', v.code);
                          handleChange('currency', v.currency);
                        }
                      }}
                      options={countries}
                      getOptionLabel={(o) => `${o.flag} ${o.name}`}
                      placeholder="Select country"
                      size="sm"
                    />
                  </FormControl>
                </Grid>

                {/* AI Business Description */}
                <Grid xs={12}>
                  <FormControl size="sm">
                    <FormLabel sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      Describe Your Business
                      <Chip
                        size="sm"
                        variant="soft"
                        color="primary"
                        startDecorator={<Sparkles size={10} />}
                        sx={{ fontSize: '0.65rem', height: 18, '--Chip-gap': '2px' }}
                      >
                        AI
                      </Chip>
                    </FormLabel>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="e.g. I run a web design agency with 3 employees. We do monthly retainer contracts and project-based work. We also resell hosting services..."
                      minRows={3}
                      maxRows={5}
                      size="sm"
                    />
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                      Optional — AI will customize your chart of accounts based on this description.
                    </Typography>
                  </FormControl>
                </Grid>

                {/* AI Suggested Accounts */}
                {formData.description.trim().length > 20 && (
                  <Grid xs={12}>
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
                  </Grid>
                )}

                {aiAccounts.length > 0 && (
                  <Grid xs={12}>
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
                  </Grid>
                )}
              </Grid>
            </Stack>
          </CardContent>

          {/* Footer */}
          <Box sx={{ borderTop: 1, borderColor: 'divider', p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              color="primary"
              endDecorator={!loading ? <CheckCircle2 size={16} /> : undefined}
              onClick={handleSubmit}
              loading={loading}
              sx={{ px: 3 }}
            >
              Create Company
            </Button>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
