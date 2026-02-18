'use client';
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Container, Grid, Button,
  IconButton, Chip, Sheet, Switch, Divider, Select, Option, Table, LinearProgress,
} from '@mui/joy';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { DashboardSkeleton } from '@/components/Skeletons';
import { PageBreadcrumbs } from '@/components/common';
import StatusChangeModal from '@/components/StatusChangeModal';
import { useFormatting } from '@/hooks';
import { getInvoices, getOutstandingInvoices, getOverdueInvoices } from '@/services/invoices';
import { getBills, getOutstandingBills, getOverdueBills, updateBillStatus } from '@/services/bills';
import { getTransactions } from '@/services/transactions';
import { getCustomers } from '@/services/customers';
import { getVendors } from '@/services/vendors';
import { getTotalPayrollForMonth } from '@/services/salarySlips';
import { generateARAgingReport } from '@/services/reports';
import { getStatusColor, formatStatus } from '@/lib/status-management';
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard, FileText, Users,
  Settings, Calendar, BarChart3, Building2, LayoutDashboard,
  AlertCircle, Briefcase, ArrowRight, Clock, Receipt, ArrowUpRight,
  ArrowDownRight, PieChart,
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from 'recharts';
import { primaryPalette, successPalette, dangerPalette, warningPalette } from '@/styles/colors';
import toast from 'react-hot-toast';

// ==========================================
// TYPES & DEFAULTS
// ==========================================

interface DashboardPreferences {
  widgets: {
    statCards: boolean;
    revenueExpenseChart: boolean;
    breakdownChart: boolean;
    cashFlowChart: boolean;
    recentInvoices: boolean;
    recentBills: boolean;
    recentTransactions: boolean;
    overdueAging: boolean;
  };
  dateRange: 'week' | 'month' | '3months' | '6months' | 'year';
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  widgets: {
    statCards: true,
    revenueExpenseChart: true,
    breakdownChart: true,
    cashFlowChart: true,
    recentInvoices: true,
    recentBills: true,
    recentTransactions: true,
    overdueAging: true,
  },
  dateRange: 'month',
};

const COLORS = [
  primaryPalette[500], primaryPalette[400], primaryPalette[700],
  successPalette[500], warningPalette[500], dangerPalette[400],
  primaryPalette[300], successPalette[600],
];

const DATE_RANGE_LABELS: Record<string, string> = {
  week: 'Last 7 days', month: 'This month', '3months': 'Last 3 months',
  '6months': 'Last 6 months', year: 'Last 12 months',
};

// ==========================================
// HELPERS
// ==========================================

function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

function calcTrend(current: number, previous: number): string | null {
  if (previous === 0) return current > 0 ? '+100%' : null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

function getDateRange(range: string): { start: Date; end: Date } {
  const now = new Date();
  const end = now;
  let start: Date;
  switch (range) {
    case 'week': start = subDays(now, 7); break;
    case '3months': start = subMonths(now, 3); break;
    case '6months': start = subMonths(now, 6); break;
    case 'year': start = subMonths(now, 12); break;
    default: start = startOfMonth(now); break; // 'month'
  }
  return { start, end };
}

function getPrevDateRange(range: string): { start: Date; end: Date } {
  const { start, end } = getDateRange(range);
  const duration = end.getTime() - start.getTime();
  return { start: new Date(start.getTime() - duration), end: new Date(start.getTime()) };
}

function toDate(ts: any): Date {
  if (!ts) return new Date();
  if (ts.toDate) return ts.toDate();
  return new Date(ts);
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { company, loading: companyLoading, refreshData } = useCompany();
  const router = useRouter();
  const { formatCurrency, formatDate } = useFormatting();

  // Preferences (persisted)
  const [prefs, setPrefs] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [showSettings, setShowSettings] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const isInitialLoad = useRef(true);

  // Data
  const [dataLoading, setDataLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState<any[]>([]);
  const [overdueInvoicesList, setOverdueInvoicesList] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [outstandingBills, setOutstandingBills] = useState<any[]>([]);
  const [overdueBillsList, setOverdueBillsList] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [payroll, setPayroll] = useState({ totalGross: 0, totalDeductions: 0, totalNet: 0, count: 0 });
  const [arAging, setArAging] = useState<any>(null);

  // Status change modal
  const [statusModal, setStatusModal] = useState<{
    open: boolean; entityType: 'invoice' | 'bill';
    entityId: string; entityName: string;
    currentStatus: string;
  } | null>(null);

  // ── Auth guard ──
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (!companyLoading && !company) router.push('/companies');
  }, [user, company, authLoading, companyLoading, router]);

  // ── Load preferences ──
  useEffect(() => {
    if (!company?.id) return;
    const prefRef = doc(db, `companies/${company.id}/settings`, 'dashboard_preferences');
    getDoc(prefRef).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setPrefs({
          widgets: { ...DEFAULT_PREFERENCES.widgets, ...(d.widgets || {}) },
          dateRange: d.dateRange || DEFAULT_PREFERENCES.dateRange,
        });
      }
      isInitialLoad.current = false;
    }).catch(() => { isInitialLoad.current = false; });
  }, [company?.id]);

  // ── Save preferences (debounced) ──
  useEffect(() => {
    if (isInitialLoad.current || !company?.id) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const prefRef = doc(db, `companies/${company.id}/settings`, 'dashboard_preferences');
        await setDoc(prefRef, { ...prefs, updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) { console.warn('Failed to save dashboard preferences:', e); }
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [prefs, company?.id]);

  // ── Fetch all data in parallel ──
  const fetchData = useCallback(async () => {
    if (!company?.id) return;
    setDataLoading(true);
    const now = new Date();
    try {
      const [txns, invs, outInvs, overInvs, bls, outBls, overBls, custs, vnds, pay, aging] = await Promise.all([
        getTransactions(company.id, 200),
        getInvoices(company.id, 20),
        getOutstandingInvoices(company.id),
        getOverdueInvoices(company.id),
        getBills(company.id, 20),
        getOutstandingBills(company.id),
        getOverdueBills(company.id),
        getCustomers(company.id),
        getVendors(company.id),
        getTotalPayrollForMonth(company.id, now.getMonth() + 1, now.getFullYear()),
        generateARAgingReport(company.id),
      ]);
      setAllTransactions(txns);
      setInvoices(invs);
      setOutstandingInvoices(outInvs);
      setOverdueInvoicesList(overInvs);
      setBills(bls);
      setOutstandingBills(outBls);
      setOverdueBillsList(overBls);
      setCustomers(custs);
      setVendors(vnds);
      setPayroll(pay);
      setArAging(aging);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setDataLoading(false);
    }
  }, [company?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filtered transactions by date range ──
  const filteredTransactions = useMemo(() => {
    if (!allTransactions.length) return [];
    const { start, end } = getDateRange(prefs.dateRange);
    return allTransactions.filter(t => {
      const d = toDate(t.date);
      return isWithinInterval(d, { start, end });
    });
  }, [allTransactions, prefs.dateRange]);

  const prevFilteredTransactions = useMemo(() => {
    if (!allTransactions.length) return [];
    const { start, end } = getPrevDateRange(prefs.dateRange);
    return allTransactions.filter(t => {
      const d = toDate(t.date);
      return isWithinInterval(d, { start, end });
    });
  }, [allTransactions, prefs.dateRange]);

  // ── Stats ──
  const stats = useMemo(() => {
    const revenue = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const prevRevenue = prevFilteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const prevExpenses = prevFilteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const receivables = outstandingInvoices.reduce((s, i) => s + (i.amountDue || 0), 0);
    const payables = outstandingBills.reduce((s, b) => s + (b.amountDue || 0), 0);
    const overdueAmt = overdueInvoicesList.reduce((s, i) => s + (i.amountDue || 0), 0);
    return {
      totalRevenue: revenue, totalExpenses: expenses,
      netProfit: revenue - expenses, cashBalance: revenue - expenses,
      outstandingReceivables: receivables, outstandingPayables: payables,
      outstandingInvoicesCount: outstandingInvoices.length,
      outstandingBillsCount: outstandingBills.length,
      overdueAmount: overdueAmt, overdueCount: overdueInvoicesList.length,
      trendRevenue: calcTrend(revenue, prevRevenue),
      trendExpenses: calcTrend(expenses, prevExpenses),
      trendProfit: calcTrend(revenue - expenses, prevRevenue - prevExpenses),
    };
  }, [filteredTransactions, prevFilteredTransactions, outstandingInvoices, outstandingBills, overdueInvoicesList]);

  // ── Chart data: Revenue vs Expenses trend ──
  const trendData = useMemo(() => {
    if (!filteredTransactions.length) return [];
    const grouped: Record<string, { date: string; revenue: number; expenses: number }> = {};
    filteredTransactions.forEach(t => {
      const key = format(toDate(t.date), 'MMM dd');
      if (!grouped[key]) grouped[key] = { date: key, revenue: 0, expenses: 0 };
      if (t.type === 'income') grouped[key].revenue += t.amount;
      if (t.type === 'expense') grouped[key].expenses += t.amount;
    });
    return Object.values(grouped).slice(-30);
  }, [filteredTransactions]);

  // ── Chart data: Cash flow ──
  const cashFlowData = useMemo(() => {
    if (!filteredTransactions.length) return [];
    const grouped: Record<string, { date: string; inflow: number; outflow: number; net: number }> = {};
    filteredTransactions.forEach(t => {
      const key = format(toDate(t.date), 'MMM dd');
      if (!grouped[key]) grouped[key] = { date: key, inflow: 0, outflow: 0, net: 0 };
      if (t.type === 'income') { grouped[key].inflow += t.amount; grouped[key].net += t.amount; }
      if (t.type === 'expense') { grouped[key].outflow += t.amount; grouped[key].net -= t.amount; }
    });
    return Object.values(grouped).slice(-30);
  }, [filteredTransactions]);

  // ── Chart data: Expense breakdown ──
  const expenseBreakdown = useMemo(() => {
    const cats: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || 'Other';
      cats[cat] = (cats[cat] || 0) + t.amount;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredTransactions]);

  // ── Status change handler (used by StatusChangeModal) ──
  const handleModalStatusChange = useCallback(async (entityId: string, newStatus: string) => {
    if (!company?.id || !statusModal) return;
    const { entityType } = statusModal;
    try {
      if (entityType === 'invoice') {
        // Use the API route which handles email notifications + accounting
        const res = await fetch('/api/invoices/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId: company.id, invoiceId: entityId, newStatus }),
        });
        const result = await res.json();
        if (!res.ok) { toast.error(result.error || 'Failed to update status'); return; }
        toast.success(`Status updated to ${formatStatus('invoice', newStatus)}`);
        if (result.emailSent) toast.success(`Notification sent to ${result.emailRecipient}`);
        const refreshed = await getInvoices(company.id, 20);
        setInvoices(refreshed);
        const refreshedOutstanding = await getOutstandingInvoices(company.id);
        setOutstandingInvoices(refreshedOutstanding);
        const refreshedOverdue = await getOverdueInvoices(company.id);
        setOverdueInvoicesList(refreshedOverdue);
      } else {
        await updateBillStatus(company.id, entityId, newStatus);
        toast.success(`Status updated to ${formatStatus('bill', newStatus)}`);
        const refreshed = await getBills(company.id, 20);
        setBills(refreshed);
        const refreshedOutstanding = await getOutstandingBills(company.id);
        setOutstandingBills(refreshedOutstanding);
      }
      refreshData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  }, [company?.id, statusModal, refreshData]);

  // ── Loading state ──
  if (authLoading || companyLoading || !company || !user) return <DashboardSkeleton />;

  const companyBase = `/companies/${company.id}`;
  const w = prefs.widgets;
  const dateLabel = DATE_RANGE_LABELS[prefs.dateRange] || 'This month';

  // ── Stat cards config ──
  const statCards = [
    { key: 'revenue', title: 'Total Revenue', value: formatCurrency(stats.totalRevenue), subtitle: dateLabel, icon: TrendingUp, color: 'success' as const, trend: stats.trendRevenue, route: `${companyBase}/transactions` },
    { key: 'expenses', title: 'Total Expenses', value: formatCurrency(stats.totalExpenses), subtitle: dateLabel, icon: TrendingDown, color: 'danger' as const, trend: stats.trendExpenses, route: `${companyBase}/transactions` },
    { key: 'profit', title: 'Net Profit', value: formatCurrency(stats.netProfit), subtitle: dateLabel, icon: DollarSign, color: (stats.netProfit >= 0 ? 'success' : 'danger') as any, trend: stats.trendProfit, route: `${companyBase}/reports` },
    { key: 'cash', title: 'Cash Balance', value: formatCurrency(stats.cashBalance), subtitle: 'Available', icon: CreditCard, color: 'primary' as const, trend: null, route: `${companyBase}/transactions` },
    { key: 'receivables', title: 'Receivables', value: formatCurrency(stats.outstandingReceivables), subtitle: `${stats.outstandingInvoicesCount} outstanding`, icon: FileText, color: 'warning' as const, trend: null, route: `${companyBase}/invoices` },
    { key: 'payables', title: 'Payables', value: formatCurrency(stats.outstandingPayables), subtitle: `${stats.outstandingBillsCount} outstanding`, icon: Receipt, color: 'neutral' as const, trend: null, route: `${companyBase}/bills` },
    { key: 'overdue', title: 'Overdue', value: formatCurrency(stats.overdueAmount), subtitle: `${stats.overdueCount} overdue`, icon: AlertCircle, color: 'danger' as const, trend: null, route: `${companyBase}/invoices` },
    { key: 'payroll', title: 'Payroll', value: formatCurrency(payroll.totalNet), subtitle: `${payroll.count} employees`, icon: Briefcase, color: 'primary' as const, trend: null, route: `${companyBase}/payroll` },
  ];

  // ── Widget settings config ──
  const widgetOptions: { key: keyof DashboardPreferences['widgets']; label: string }[] = [
    { key: 'statCards', label: 'Stat Cards' },
    { key: 'revenueExpenseChart', label: 'Revenue & Expense Trend' },
    { key: 'breakdownChart', label: 'Expense Breakdown' },
    { key: 'cashFlowChart', label: 'Cash Flow Chart' },
    { key: 'recentInvoices', label: 'Recent Invoices' },
    { key: 'recentBills', label: 'Recent Bills' },
    { key: 'recentTransactions', label: 'Recent Transactions' },
    { key: 'overdueAging', label: 'Overdue & Aging' },
  ];

  const tooltipStyle = {
    backgroundColor: 'var(--joy-palette-background-surface)',
    border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    fontSize: 12,
  };

  // ── Aging data ──
  const agingRows = arAging ? [
    { label: 'Current', amount: arAging.totals.current, color: 'primary' as const },
    { label: '1-30 days', amount: arAging.totals.days30, color: 'primary' as const },
    { label: '31-60 days', amount: arAging.totals.days60, color: 'warning' as const },
    { label: '61-90+ days', amount: arAging.totals.days90Plus, color: 'danger' as const },
  ] : [];
  const agingTotal = agingRows.reduce((s, r) => s + r.amount, 0);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* ══════════ HEADER ══════════ */}
      <Box sx={{ mb: 3 }}>
        <PageBreadcrumbs items={[{ label: 'Dashboard', icon: <LayoutDashboard size={16} /> }]} />
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ mt: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ width: 44, height: 44, borderRadius: 'lg', bgcolor: 'primary.softBg', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={22} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Box>
              <Typography level="h3" fontWeight={700}>{company.name}</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                Welcome back{user.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}! Here&apos;s your overview.
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Select
              size="sm"
              value={prefs.dateRange}
              onChange={(_, v) => v && setPrefs(p => ({ ...p, dateRange: v as any }))}
              startDecorator={<Calendar size={14} />}
              sx={{ minWidth: 150 }}
            >
              <Option value="week">Last Week</Option>
              <Option value="month">This Month</Option>
              <Option value="3months">Last 3 Months</Option>
              <Option value="6months">Last 6 Months</Option>
              <Option value="year">Last Year</Option>
            </Select>
            <IconButton
              size="sm"
              variant={showSettings ? 'solid' : 'outlined'}
              color={showSettings ? 'primary' : 'neutral'}
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings size={18} />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* ══════════ WIDGET SETTINGS ══════════ */}
      {showSettings && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography level="title-sm" fontWeight={700} sx={{ mb: 1.5 }}>Dashboard Widgets</Typography>
            <Grid container spacing={1.5}>
              {widgetOptions.map(opt => (
                <Grid key={opt.key} xs={12} sm={6} md={3}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1 }}>
                    <Typography level="body-sm">{opt.label}</Typography>
                    <Switch
                      size="sm"
                      checked={w[opt.key]}
                      onChange={(e) => setPrefs(p => ({ ...p, widgets: { ...p.widgets, [opt.key]: e.target.checked } }))}
                    />
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* ══════════ STAT CARDS ══════════ */}
      {w.statCards && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {statCards.map(card => {
            const Icon = card.icon;
            const trendPositive = card.trend && !card.trend.startsWith('-');
            return (
              <Grid key={card.key} xs={12} sm={6} md={3}>
                <Card
                  variant="outlined"
                  sx={{ cursor: 'pointer', transition: 'all 0.15s', '&:hover': { borderColor: `${card.color}.400`, boxShadow: 'sm' }, height: '100%' }}
                  onClick={() => router.push(card.route)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>
                          {card.title}
                        </Typography>
                        <Typography level="h4" fontWeight={700}>{dataLoading ? '...' : card.value}</Typography>
                      </Box>
                      <Box sx={{ width: 36, height: 36, borderRadius: 'md', bgcolor: `${card.color}.softBg`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} style={{ color: `var(--joy-palette-${card.color}-500)` }} />
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{card.subtitle}</Typography>
                      {card.trend && (
                        <Chip size="sm" variant="soft" color={trendPositive ? 'success' : 'danger'} sx={{ fontSize: '10px', fontWeight: 700, height: 20 }}>
                          {card.trend}
                        </Chip>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ══════════ CHARTS ROW ══════════ */}
      {(w.revenueExpenseChart || w.breakdownChart) && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Revenue vs Expenses Trend */}
          {w.revenueExpenseChart && (
            <Grid xs={12} md={w.breakdownChart ? 7 : 12}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <BarChart3 size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                      <Typography level="title-sm" fontWeight={700}>Revenue vs Expenses</Typography>
                    </Stack>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{dateLabel}</Typography>
                  </Stack>
                  {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={successPalette[500]} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={successPalette[500]} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={dangerPalette[500]} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={dangerPalette[500]} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--joy-palette-neutral-200)" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: 11 }} stroke="var(--joy-palette-text-tertiary)" />
                        <YAxis tickLine={false} axisLine={false} style={{ fontSize: 11 }} stroke="var(--joy-palette-text-tertiary)" tickFormatter={formatCompactCurrency} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                        <Area type="monotone" dataKey="revenue" stroke={successPalette[500]} strokeWidth={2} fill="url(#gradRev)" name="Revenue" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
                        <Area type="monotone" dataKey="expenses" stroke={dangerPalette[500]} strokeWidth={2} fill="url(#gradExp)" name="Expenses" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>No transaction data for this period</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Expense Breakdown Donut */}
          {w.breakdownChart && (
            <Grid xs={12} md={w.revenueExpenseChart ? 5 : 12}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <PieChart size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                    <Typography level="title-sm" fontWeight={700}>Expense Breakdown</Typography>
                  </Stack>
                  {expenseBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie>
                        <Pie data={expenseBreakdown} cx="50%" cy="45%" innerRadius={55} outerRadius={100} paddingAngle={2} dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={{ stroke: 'var(--joy-palette-text-tertiary)', strokeWidth: 1 }}
                        >
                          {expenseBreakdown.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--joy-palette-background-surface)" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>No expense data</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* ══════════ CASH FLOW CHART ══════════ */}
      {w.cashFlowChart && cashFlowData.length > 0 && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <BarChart3 size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                <Typography level="title-sm" fontWeight={700}>Cash Flow</Typography>
              </Stack>
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{dateLabel}</Typography>
            </Stack>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="cfIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={successPalette[500]} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={successPalette[500]} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cfOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={dangerPalette[500]} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={dangerPalette[500]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--joy-palette-neutral-200)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: 11 }} stroke="var(--joy-palette-text-tertiary)" />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 11 }} stroke="var(--joy-palette-text-tertiary)" tickFormatter={formatCompactCurrency} />
                <ReferenceLine y={0} stroke="var(--joy-palette-neutral-400)" strokeDasharray="3 3" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="inflow" stroke={successPalette[500]} strokeWidth={2} fill="url(#cfIn)" name="Inflow" dot={false} />
                <Area type="monotone" dataKey="outflow" stroke={dangerPalette[500]} strokeWidth={2} fill="url(#cfOut)" name="Outflow" dot={false} />
                <Area type="monotone" dataKey="net" stroke={primaryPalette[500]} strokeWidth={2} strokeDasharray="5 5" fill="none" name="Net" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ══════════ RECENT INVOICES + BILLS ══════════ */}
      {(w.recentInvoices || w.recentBills) && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Recent Invoices */}
          {w.recentInvoices && (
            <Grid xs={12} md={w.recentBills ? 6 : 12}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 0 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FileText size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                      <Typography level="title-sm" fontWeight={700}>Recent Invoices</Typography>
                    </Stack>
                    <Button size="sm" variant="plain" endDecorator={<ArrowRight size={14} />} onClick={() => router.push(`${companyBase}/invoices`)}>
                      View All
                    </Button>
                  </Stack>
                  <Sheet sx={{ overflow: 'auto' }}>
                    <Table size="sm" sx={{ '& th': { bgcolor: 'background.level1', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.tertiary' } }}>
                      <thead>
                        <tr><th>Invoice</th><th>Customer</th><th style={{ textAlign: 'right' }}>Amount</th><th>Status</th><th>Due</th></tr>
                      </thead>
                      <tbody>
                        {invoices.length === 0 ? (
                          <tr><td colSpan={5}><Typography level="body-sm" sx={{ py: 3, textAlign: 'center', color: 'text.tertiary' }}>No invoices yet</Typography></td></tr>
                        ) : invoices.slice(0, 5).map((inv: any) => (
                            <tr key={inv.id}>
                              <td><Typography level="body-xs" fontWeight={600}>{inv.invoiceNumber || '-'}</Typography></td>
                              <td><Typography level="body-xs">{inv.customerName}</Typography></td>
                              <td style={{ textAlign: 'right' }}><Typography level="body-xs" fontWeight={600}>{formatCurrency(inv.total || 0)}</Typography></td>
                              <td>
                                <Chip
                                  size="sm" variant="soft"
                                  color={getStatusColor('invoice', inv.status)}
                                  sx={{ cursor: 'pointer', fontSize: '11px' }}
                                  onClick={() => setStatusModal({ open: true, entityType: 'invoice', entityId: inv.id, entityName: inv.invoiceNumber || inv.id, currentStatus: inv.status })}
                                >
                                  {formatStatus('invoice', inv.status)}
                                </Chip>
                              </td>
                              <td><Typography level="body-xs" sx={{ color: 'text.secondary' }}>{inv.dueDate ? format(toDate(inv.dueDate), 'MMM dd') : '-'}</Typography></td>
                            </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Sheet>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Recent Bills */}
          {w.recentBills && (
            <Grid xs={12} md={w.recentInvoices ? 6 : 12}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 0 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Receipt size={16} style={{ color: 'var(--joy-palette-warning-500)' }} />
                      <Typography level="title-sm" fontWeight={700}>Recent Bills</Typography>
                    </Stack>
                    <Button size="sm" variant="plain" endDecorator={<ArrowRight size={14} />} onClick={() => router.push(`${companyBase}/bills`)}>
                      View All
                    </Button>
                  </Stack>
                  <Sheet sx={{ overflow: 'auto' }}>
                    <Table size="sm" sx={{ '& th': { bgcolor: 'background.level1', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.tertiary' } }}>
                      <thead>
                        <tr><th>Bill</th><th>Vendor</th><th style={{ textAlign: 'right' }}>Amount</th><th>Status</th><th>Due</th></tr>
                      </thead>
                      <tbody>
                        {bills.length === 0 ? (
                          <tr><td colSpan={5}><Typography level="body-sm" sx={{ py: 3, textAlign: 'center', color: 'text.tertiary' }}>No bills yet</Typography></td></tr>
                        ) : bills.slice(0, 5).map((bill: any) => (
                            <tr key={bill.id}>
                              <td><Typography level="body-xs" fontWeight={600}>{bill.billNumber || '-'}</Typography></td>
                              <td><Typography level="body-xs">{bill.vendorName}</Typography></td>
                              <td style={{ textAlign: 'right' }}><Typography level="body-xs" fontWeight={600}>{formatCurrency(bill.total || 0)}</Typography></td>
                              <td>
                                <Chip
                                  size="sm" variant="soft"
                                  color={getStatusColor('bill', bill.status)}
                                  sx={{ cursor: 'pointer', fontSize: '11px' }}
                                  onClick={() => setStatusModal({ open: true, entityType: 'bill', entityId: bill.id, entityName: bill.billNumber || bill.vendorName || bill.id, currentStatus: bill.status })}
                                >
                                  {formatStatus('bill', bill.status)}
                                </Chip>
                              </td>
                              <td><Typography level="body-xs" sx={{ color: 'text.secondary' }}>{bill.dueDate ? format(toDate(bill.dueDate), 'MMM dd') : '-'}</Typography></td>
                            </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Sheet>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* ══════════ RECENT TRANSACTIONS ══════════ */}
      {w.recentTransactions && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <DollarSign size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                <Typography level="title-sm" fontWeight={700}>Recent Transactions</Typography>
              </Stack>
              <Button size="sm" variant="plain" endDecorator={<ArrowRight size={14} />} onClick={() => router.push(`${companyBase}/transactions`)}>
                View All
              </Button>
            </Stack>
            <Sheet sx={{ overflow: 'auto' }}>
              <Table size="sm" sx={{ '& th': { bgcolor: 'background.level1', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.tertiary' } }}>
                <thead>
                  <tr><th style={{ width: 32 }}></th><th>Description</th><th>Category</th><th style={{ textAlign: 'right' }}>Amount</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr><td colSpan={5}><Typography level="body-sm" sx={{ py: 3, textAlign: 'center', color: 'text.tertiary' }}>No transactions for this period</Typography></td></tr>
                  ) : filteredTransactions.slice(0, 10).map((t: any, i: number) => {
                    const isIncome = t.type === 'income';
                    return (
                      <tr key={t.id || i}>
                        <td>
                          <Box sx={{ width: 24, height: 24, borderRadius: 'sm', bgcolor: isIncome ? 'success.softBg' : 'danger.softBg', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isIncome ? <ArrowUpRight size={13} style={{ color: 'var(--joy-palette-success-600)' }} /> : <ArrowDownRight size={13} style={{ color: 'var(--joy-palette-danger-600)' }} />}
                          </Box>
                        </td>
                        <td><Typography level="body-xs" fontWeight={600}>{t.description || '-'}</Typography></td>
                        <td><Typography level="body-xs" sx={{ color: 'text.secondary' }}>{t.category || '-'}</Typography></td>
                        <td style={{ textAlign: 'right' }}>
                          <Typography level="body-xs" fontWeight={700} sx={{ color: isIncome ? 'success.600' : 'danger.600' }}>
                            {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                          </Typography>
                        </td>
                        <td><Typography level="body-xs" sx={{ color: 'text.secondary' }}>{format(toDate(t.date), 'MMM dd')}</Typography></td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Sheet>
          </CardContent>
        </Card>
      )}

      {/* ══════════ OVERDUE & AGING ══════════ */}
      {w.overdueAging && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Overdue Invoices */}
          <Grid xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AlertCircle size={16} style={{ color: 'var(--joy-palette-danger-500)' }} />
                    <Typography level="title-sm" fontWeight={700}>Overdue Invoices</Typography>
                    {overdueInvoicesList.length > 0 && (
                      <Chip size="sm" variant="soft" color="danger" sx={{ fontSize: '11px' }}>{overdueInvoicesList.length}</Chip>
                    )}
                  </Stack>
                  <Button size="sm" variant="plain" endDecorator={<ArrowRight size={14} />} onClick={() => router.push(`${companyBase}/invoices`)}>
                    View All
                  </Button>
                </Stack>
                {overdueInvoicesList.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>No overdue invoices</Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {overdueInvoicesList.slice(0, 5).map((inv: any) => {
                      const dueDate = toDate(inv.dueDate);
                      const daysOverdue = Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
                      return (
                        <Stack key={inv.id} direction="row" justifyContent="space-between" alignItems="center"
                          sx={{ p: 1.5, borderRadius: 'md', bgcolor: 'danger.50', border: '1px solid', borderColor: 'danger.100' }}>
                          <Box>
                            <Typography level="body-xs" fontWeight={600}>{inv.invoiceNumber} — {inv.customerName}</Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                              <Clock size={11} style={{ opacity: 0.5 }} />
                              <Typography level="body-xs" sx={{ color: 'danger.600' }}>{daysOverdue} days overdue</Typography>
                            </Stack>
                          </Box>
                          <Typography level="body-sm" fontWeight={700} sx={{ color: 'danger.600' }}>
                            {formatCurrency(inv.amountDue || inv.total || 0)}
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* AR Aging */}
          <Grid xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <BarChart3 size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                  <Typography level="title-sm" fontWeight={700}>Accounts Receivable Aging</Typography>
                </Stack>
                {agingTotal === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>No outstanding receivables</Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {agingRows.map((row) => {
                      const pct = agingTotal > 0 ? (row.amount / agingTotal) * 100 : 0;
                      return (
                        <Box key={row.label}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography level="body-xs" fontWeight={600}>{row.label}</Typography>
                            <Typography level="body-xs" fontWeight={700}>{formatCurrency(row.amount)}</Typography>
                          </Stack>
                          <LinearProgress
                            determinate
                            value={pct}
                            color={row.color}
                            sx={{ height: 6, borderRadius: 3, bgcolor: 'neutral.100' }}
                          />
                          <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }}>{pct.toFixed(0)}%</Typography>
                        </Box>
                      );
                    })}
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography level="body-sm" fontWeight={700}>Total Outstanding</Typography>
                      <Typography level="body-sm" fontWeight={700} color="primary">{formatCurrency(agingTotal)}</Typography>
                    </Stack>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ══════════ STATUS CHANGE MODAL ══════════ */}
      {statusModal && (
        <StatusChangeModal
          open={statusModal.open}
          onClose={() => setStatusModal(null)}
          entityType={statusModal.entityType}
          entityId={statusModal.entityId}
          entityName={statusModal.entityName}
          currentStatus={statusModal.currentStatus}
          onStatusChange={handleModalStatusChange}
        />
      )}
    </Container>
  );
}
