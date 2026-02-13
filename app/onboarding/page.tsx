'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getDefaultChartOfAccounts } from '@/lib/chart-of-accounts';
import { countries, Country } from '@/lib/countries';
import toast from 'react-hot-toast';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Input,
  Button,
  Stack,
  Grid,
  Autocomplete,
  Chip,
  FormControl,
  FormLabel,
  LinearProgress,
  IconButton,
} from '@mui/joy';
import { Building2, CheckCircle2, ArrowRight, ArrowLeft, Moon, Sun, FileText, Users, Package, BookOpen, Check } from 'lucide-react';

interface OnboardingData {
  companyName: string;
  businessType: string;
  industry: string;
  country: string;
  currency: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  fiscalYearStart: number;
  hasInvoices: boolean;
  hasEmployees: boolean;
  tracksInventory: boolean;
  invoicePrefix: string;
  invoiceStartNumber: number;
}

const businessTypes = [
  'Freelancer', 'Consulting', 'Retail', 'Manufacturing', 'Services',
  'Technology', 'Construction', 'Healthcare', 'Education', 'Hospitality',
  'Real Estate', 'Other'
];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const AccountingBackground = () => {
  const calculations = [
    'Assets = Liabilities + Equity',
    'Revenue - Expenses = Net Income',
    'Debit = Credit',
    'Cash Flow = Inflows - Outflows',
    'Gross Profit = Revenue - COGS',
    'ROA = Net Income / Total Assets',
  ];

  const numbers = ['$1,234.56', '₹45,678', '€3,456', '£2,345', '$987.65', '¥12,345'];
  const ledgerItems = ['DR', 'CR', 'Bal', 'A/R', 'A/P', 'GL', 'P&L', 'COA'];

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Floating calculations */}
      {calculations.map((calc, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            fontSize: '13px',
            fontFamily: 'monospace',
            fontWeight: 600,
            color: 'primary.400',
            opacity: 0.15,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animation: 'float 20s ease-in-out infinite',
            animationDelay: `${i * 3}s`,
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-30px)' },
            },
          }}
        >
          {calc}
        </Box>
      ))}

      {/* Floating numbers */}
      {numbers.map((num, i) => (
        <Box
          key={`num-${i}`}
          sx={{
            position: 'absolute',
            fontSize: '24px',
            fontWeight: 700,
            color: 'primary.500',
            left: `${15 + Math.random() * 70}%`,
            top: `${15 + Math.random() * 70}%`,
            animation: 'pulse 4s ease-in-out infinite',
            animationDelay: `${i * 0.7}s`,
            '@keyframes pulse': {
              '0%, 100%': { opacity: 0.1 },
              '50%': { opacity: 0.25 },
            },
          }}
        >
          {num}
        </Box>
      ))}

      {/* Ledger abbreviations */}
      {ledgerItems.map((item, i) => (
        <Box
          key={`ledger-${i}`}
          sx={{
            position: 'absolute',
            fontSize: '20px',
            fontWeight: 800,
            fontFamily: 'monospace',
            color: 'primary.600',
            opacity: 0.12,
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
            animation: 'float 25s ease-in-out infinite',
            animationDelay: `${i * 2.5}s`,
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-40px) rotate(10deg)' },
            },
          }}
        >
          {item}
        </Box>
      ))}

      {/* Gradient background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 30% 40%, var(--joy-palette-primary-50), transparent 50%), radial-gradient(circle at 70% 70%, var(--joy-palette-primary-100), transparent 50%)',
          opacity: 0.4,
        }}
      />
    </Box>
  );
};

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const { mode, toggleMode } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const [formData, setFormData] = useState<OnboardingData>({
    companyName: '',
    businessType: '',
    industry: '',
    country: 'US',
    currency: 'USD',
    address: '',
    city: '',
    zipCode: '',
    phone: '',
    email: user?.email || '',
    website: '',
    taxId: '',
    fiscalYearStart: 1,
    hasInvoices: true,
    hasEmployees: false,
    tracksInventory: false,
    invoicePrefix: 'INV',
    invoiceStartNumber: 1000,
  });

  // Load draft data on mount
  useEffect(() => {
    if (!user || draftLoaded) return;

    const loadDraft = async () => {
      try {
        const draftRef = doc(db, 'users', user.uid, 'drafts', 'onboarding');
        const draftSnap = await getDoc(draftRef);

        if (draftSnap.exists()) {
          const draftData = draftSnap.data();
          setFormData(prev => ({
            ...prev,
            ...draftData,
            email: user.email || prev.email,
          }));
          if (draftData.step) setStep(draftData.step);
          toast.success('Draft loaded');
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      } finally {
        setDraftLoaded(true);
      }
    };

    loadDraft();
  }, [user, draftLoaded]);

  // Save draft whenever form data changes
  const saveDraft = useCallback(async (data: OnboardingData, currentStep: number) => {
    if (!user) return;

    try {
      const draftRef = doc(db, 'users', user.uid, 'drafts', 'onboarding');
      await setDoc(draftRef, {
        ...data,
        step: currentStep,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [user]);

  // Debounced save effect
  useEffect(() => {
    if (!draftLoaded) return;

    const timeoutId = setTimeout(() => {
      saveDraft(formData, step);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formData, step, saveDraft, draftLoaded]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const handleInputChange = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!formData.companyName.trim()) {
          toast.error('Please enter your company name');
          return false;
        }
        if (!formData.businessType) {
          toast.error('Please select a business type');
          return false;
        }
        return true;
      case 2:
        if (!formData.country) {
          toast.error('Please select a country');
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
      setStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId = doc(collection(db, 'companies')).id;

      // Create company document
      await setDoc(doc(db, 'companies', companyId), {
        name: formData.companyName,
        businessType: formData.businessType,
        industry: formData.industry,
        country: formData.country,
        currency: formData.currency,
        address: formData.address,
        city: formData.city,
        zipCode: formData.zipCode,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        taxId: formData.taxId,
        fiscalYearStart: formData.fiscalYearStart,
        hasInvoices: formData.hasInvoices,
        hasEmployees: formData.hasEmployees,
        tracksInventory: formData.tracksInventory,
        invoicePrefix: formData.invoicePrefix,
        invoiceNextNumber: formData.invoiceStartNumber,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create default chart of accounts
      const accounts = getDefaultChartOfAccounts(formData.businessType);
      const accountsPromises = accounts.map((account) =>
        setDoc(doc(db, 'companies', companyId, 'accounts', account.code), {
          ...account,
          createdAt: serverTimestamp(),
        })
      );

      await Promise.all(accountsPromises);

      // Delete the draft after successful completion
      try {
        const draftRef = doc(db, 'users', user.uid, 'drafts', 'onboarding');
        await setDoc(draftRef, { deleted: true, deletedAt: serverTimestamp() });
      } catch (error) {
        console.error('Error deleting draft:', error);
      }

      toast.success('Company created successfully!');
      // Store the company ID and redirect to dashboard
      localStorage.setItem('selectedCompanyId', companyId);
      router.push(`/companies/${companyId}/dashboard`);
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return null;
  }

  const selectedCountry = countries.find(c => c.code === formData.country);
  const progress = (step / 3) * 100;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.body', position: 'relative', overflow: 'hidden' }}>
      <AccountingBackground />

      {/* Dark Mode Toggle - Top Right */}
      <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 100 }}>
        <IconButton
          onClick={toggleMode}
          variant="soft"
          color="primary"
          size="sm"
          sx={{
            borderRadius: 'lg',
            boxShadow: 'sm',
          }}
        >
          {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </IconButton>
      </Box>

      {/* Header */}
      <Box sx={{ pt: 1.5, pb: 1, px: 2, position: 'relative', zIndex: 10 }}>
        <Stack alignItems="center" spacing={0.25}>
          <Box sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))', borderRadius: 'md', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'sm' }}>
            <BookOpen size={18} color="white" strokeWidth={2.5} />
          </Box>
          <Typography level="title-lg" fontWeight="bold" sx={{ fontFamily: 'var(--font-inter)', letterSpacing: '-1px' }}>
            Flow<span style={{ fontStyle: 'italic' }}>books</span>
          </Typography>
        </Stack>

        {/* Progress */}
        <Box sx={{ maxWidth: 650, mx: 'auto', mt: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" mb={0.25}>
            <Typography level="body-xs" fontWeight="md">Step {step} of 3</Typography>
            <Typography level="body-xs" sx={{ opacity: 0.7 }}>
              {step === 1 && 'Company Details'}
              {step === 2 && 'Location & Settings'}
              {step === 3 && 'Features & Preferences'}
            </Typography>
          </Stack>
          <LinearProgress determinate value={progress} size="sm" />
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, pt: 0.5, position: 'relative', zIndex: 10 }}>
        <Card
          variant="outlined"
          sx={{
            maxWidth: 650,
            width: '100%',
            maxHeight: 'calc(100vh - 160px)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'md',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ flex: 1, p: 2, overflowY: 'auto', overflowX: 'hidden' }}>
            {/* Step 1 */}
            {step === 1 && (
              <Stack spacing={1.5}>
                <Box textAlign="center" mb={0.5}>
                  <Building2 size={28} style={{ margin: '0 auto 6px', color: 'var(--joy-palette-primary-500)' }} />
                  <Typography level="title-lg" mb={0.25}>Company Details</Typography>
                  <Typography level="body-xs" sx={{ opacity: 0.7 }}>Tell us about your business</Typography>
                </Box>

                <Grid container spacing={1.5}>
                  <Grid xs={12}>
                    <FormControl required size="sm">
                      <FormLabel>Company Name</FormLabel>
                      <Input
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        placeholder="Acme Inc."
                        size="sm"
                      />
                    </FormControl>
                  </Grid>

                  <Grid xs={12} md={6}>
                    <FormControl size="sm">
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="hello@company.com"
                        size="sm"
                      />
                    </FormControl>
                  </Grid>

                  <Grid xs={12} md={6}>
                    <FormControl size="sm">
                      <FormLabel>Phone</FormLabel>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        size="sm"
                      />
                    </FormControl>
                  </Grid>

                  <Grid xs={12} md={6}>
                    <FormControl size="sm">
                      <FormLabel>Website</FormLabel>
                      <Input
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://company.com"
                        size="sm"
                      />
                    </FormControl>
                  </Grid>

                  <Grid xs={12} md={6}>
                    <FormControl size="sm">
                      <FormLabel>Tax ID / EIN</FormLabel>
                      <Input
                        value={formData.taxId}
                        onChange={(e) => handleInputChange('taxId', e.target.value)}
                        placeholder="12-3456789"
                        size="sm"
                      />
                    </FormControl>
                  </Grid>

                  <Grid xs={12}>
                    <FormControl required size="sm">
                      <FormLabel>Business Type</FormLabel>
                      <Autocomplete
                        value={formData.businessType}
                        onChange={(e, newValue) => handleInputChange('businessType', newValue)}
                        options={businessTypes}
                        placeholder="Select business type"
                        size="sm"
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </Stack>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <Stack spacing={1.5}>
                <Box textAlign="center" mb={0.5}>
                  <Typography level="title-lg" mb={0.25}>Location & Settings</Typography>
                  <Typography level="body-xs" sx={{ opacity: 0.7 }}>Configure regional preferences</Typography>
                </Box>

                <Grid container spacing={1.5}>
                  <Grid xs={12}>
                    <FormControl required size="sm">
                      <FormLabel>Country</FormLabel>
                      <Autocomplete
                        value={selectedCountry}
                        onChange={(e, newValue) => {
                          if (newValue) {
                            handleInputChange('country', newValue.code);
                            handleInputChange('currency', newValue.currency);
                          }
                        }}
                        options={countries}
                        getOptionLabel={(option) => `${option.flag} ${option.name} (${option.currency})`}
                        placeholder="Search country..."
                        size="sm"
                      />
                    </FormControl>
                  </Grid>

                  <Grid xs={12}>
                    <FormControl size="sm">
                      <FormLabel>Address</FormLabel>
                      <Input
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="123 Main Street"
                        size="sm"
                      />
                    </FormControl>
                  </Grid>

                  <Grid xs={12} md={6}>
                    <FormControl size="sm">
                      <FormLabel>City</FormLabel>
                      <Input
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="New York"
                        size="sm"
                      />
                    </FormControl>
                  </Grid>

                  <Grid xs={12} md={6}>
                    <FormControl size="sm">
                      <FormLabel>ZIP / Postal Code</FormLabel>
                      <Input
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        placeholder="10001"
                        size="sm"
                      />
                    </FormControl>
                  </Grid>

                  <Grid xs={12}>
                    <FormControl size="sm">
                      <FormLabel>Fiscal Year Start Month</FormLabel>
                      <Autocomplete
                        value={months[formData.fiscalYearStart - 1]}
                        onChange={(e, newValue) => {
                          const index = months.indexOf(newValue || '');
                          if (index >= 0) handleInputChange('fiscalYearStart', index + 1);
                        }}
                        options={months}
                        placeholder="Select month"
                        size="sm"
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </Stack>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <Stack spacing={1.5}>
                <Box textAlign="center" mb={0.5}>
                  <Typography level="title-lg" mb={0.25}>Features & Preferences</Typography>
                  <Typography level="body-xs" sx={{ opacity: 0.7 }}>Choose what you need</Typography>
                </Box>

                <Stack spacing={1}>
                  <Grid container spacing={1.25}>
                    <Grid xs={12} sm={4}>
                      <Card
                        variant="outlined"
                        onClick={() => handleInputChange('hasInvoices', !formData.hasInvoices)}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative',
                          borderWidth: 2,
                          borderColor: formData.hasInvoices ? 'primary.500' : 'neutral.outlinedBorder',
                          bgcolor: formData.hasInvoices ? 'primary.50' : 'background.surface',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 'md',
                            borderColor: 'primary.400',
                          },
                        }}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 1.5, px: 1, position: 'relative' }}>
                          {formData.hasInvoices && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                bgcolor: 'primary.500',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Check size={10} color="white" strokeWidth={3} />
                            </Box>
                          )}
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 'md',
                              bgcolor: formData.hasInvoices ? 'primary.100' : 'neutral.100',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 8px',
                            }}
                          >
                            <FileText size={18} style={{ color: formData.hasInvoices ? 'var(--joy-palette-primary-600)' : 'var(--joy-palette-neutral-600)' }} />
                          </Box>
                          <Typography level="title-sm" fontWeight={600} fontSize="13px">Invoicing</Typography>
                          <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.15, fontSize: '11px' }}>
                            Send invoices
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <Card
                        variant="outlined"
                        onClick={() => handleInputChange('hasEmployees', !formData.hasEmployees)}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative',
                          borderWidth: 2,
                          borderColor: formData.hasEmployees ? 'primary.500' : 'neutral.outlinedBorder',
                          bgcolor: formData.hasEmployees ? 'primary.50' : 'background.surface',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 'md',
                            borderColor: 'primary.400',
                          },
                        }}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 1.5, px: 1, position: 'relative' }}>
                          {formData.hasEmployees && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                bgcolor: 'primary.500',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Check size={10} color="white" strokeWidth={3} />
                            </Box>
                          )}
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 'md',
                              bgcolor: formData.hasEmployees ? 'primary.100' : 'neutral.100',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 8px',
                            }}
                          >
                            <Users size={18} style={{ color: formData.hasEmployees ? 'var(--joy-palette-primary-600)' : 'var(--joy-palette-neutral-600)' }} />
                          </Box>
                          <Typography level="title-sm" fontWeight={600} fontSize="13px">Payroll</Typography>
                          <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.15, fontSize: '11px' }}>
                            Manage employees
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <Card
                        variant="outlined"
                        onClick={() => handleInputChange('tracksInventory', !formData.tracksInventory)}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative',
                          borderWidth: 2,
                          borderColor: formData.tracksInventory ? 'primary.500' : 'neutral.outlinedBorder',
                          bgcolor: formData.tracksInventory ? 'primary.50' : 'background.surface',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 'md',
                            borderColor: 'primary.400',
                          },
                        }}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 1.5, px: 1, position: 'relative' }}>
                          {formData.tracksInventory && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                bgcolor: 'primary.500',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Check size={10} color="white" strokeWidth={3} />
                            </Box>
                          )}
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 'md',
                              bgcolor: formData.tracksInventory ? 'primary.100' : 'neutral.100',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 8px',
                            }}
                          >
                            <Package size={18} style={{ color: formData.tracksInventory ? 'var(--joy-palette-primary-600)' : 'var(--joy-palette-neutral-600)' }} />
                          </Box>
                          <Typography level="title-sm" fontWeight={600} fontSize="13px">Inventory</Typography>
                          <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.15, fontSize: '11px' }}>
                            Track products
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {formData.hasInvoices && (
                    <Card
                      variant="outlined"
                      sx={{
                        borderColor: 'primary.300',
                        bgcolor: 'primary.50',
                      }}
                    >
                      <CardContent sx={{ p: 1.25 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75} mb={0.75}>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: 'sm',
                              bgcolor: 'primary.100',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <FileText size={14} style={{ color: 'var(--joy-palette-primary-600)' }} />
                          </Box>
                          <Typography level="title-sm" fontWeight={600} fontSize="13px">
                            Invoice Settings
                          </Typography>
                        </Stack>

                        <Grid container spacing={0.75}>
                          <Grid xs={6}>
                            <FormControl size="sm">
                              <FormLabel sx={{ fontSize: '11px', mb: 0.25 }}>Prefix</FormLabel>
                              <Input
                                value={formData.invoicePrefix}
                                onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                                size="sm"
                                sx={{ fontWeight: 500 }}
                              />
                            </FormControl>
                          </Grid>
                          <Grid xs={6}>
                            <FormControl size="sm">
                              <FormLabel sx={{ fontSize: '11px', mb: 0.25 }}>Start #</FormLabel>
                              <Input
                                type="number"
                                value={formData.invoiceStartNumber}
                                onChange={(e) => handleInputChange('invoiceStartNumber', parseInt(e.target.value))}
                                size="sm"
                                sx={{ fontWeight: 500 }}
                              />
                            </FormControl>
                          </Grid>
                          <Grid xs={12}>
                            <Box
                              sx={{
                                mt: 0.5,
                                p: 0.5,
                                borderRadius: 'sm',
                                bgcolor: 'background.surface',
                                border: '1px dashed',
                                borderColor: 'primary.300',
                              }}
                            >
                              <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.1, fontSize: '10px' }}>
                                Preview
                              </Typography>
                              <Typography
                                level="body-sm"
                                fontWeight={600}
                                sx={{
                                  fontFamily: 'monospace',
                                  color: 'primary.700',
                                  letterSpacing: '0.5px',
                                  fontSize: '12px',
                                }}
                              >
                                {formData.invoicePrefix}-{formData.invoiceStartNumber}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </Stack>
            )}
          </CardContent>

          {/* Compact Navigation */}
          <Box sx={{ borderTop: 1, borderColor: 'divider', p: 1.5, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              color="neutral"
              startDecorator={<ArrowLeft size={16} />}
              onClick={prevStep}
              disabled={step === 1}
              size="sm"
            >
              Back
            </Button>

            {step < 3 ? (
              <Button
                color="primary"
                endDecorator={<ArrowRight size={16} />}
                onClick={nextStep}
                size="sm"
              >
                Continue
              </Button>
            ) : (
              <Button
                color="primary"
                endDecorator={<CheckCircle2 size={16} />}
                onClick={handleSubmit}
                loading={loading}
                size="sm"
              >
                Complete
              </Button>
            )}
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
