'use client';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Container,
  Grid,
  Button,
  IconButton,
  Chip,
  Sheet,
  Checkbox,
  Divider,
  Select,
  Option,
  FormControl,
  FormLabel,
} from '@mui/joy';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { DashboardSkeleton } from '@/components/Skeletons';
import { PageBreadcrumbs } from '@/components/common';
import { getInvoices } from '@/services/invoices';
import { getVendors } from '@/services/vendors';
import { getCustomers } from '@/services/customers';
import { useFormatting } from '@/hooks';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  FileText,
  Users,
  Settings,
  Filter,
  Calendar,
  PieChart,
  BarChart3,
  LineChart,
  Building2,
  LayoutDashboard,
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  LineChart as RechartsLine,
  Line,
  BarChart as RechartsBar,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
  outstandingReceivables: number;
  outstandingPayables: number;
}

interface DashboardSettings {
  showRevenue: boolean;
  showExpenses: boolean;
  showProfit: boolean;
  showCash: boolean;
  showReceivables: boolean;
  showPayables: boolean;
  showRevenueChart: boolean;
  showExpenseChart: boolean;
  showCashFlowChart: boolean;
  showCategoryBreakdown: boolean;
  dateRange: 'week' | 'month' | '3months' | '6months' | 'year';
}

// Chart colors from brand palette - import from centralized colors
import { primaryPalette, secondaryPalette } from '@/styles/colors';
const COLORS = [primaryPalette[500], primaryPalette[600], primaryPalette[700], primaryPalette[300], primaryPalette[800], primaryPalette[200]];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { company, transactions, loading: companyLoading } = useCompany();
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);

  // Get formatting functions from company preferences
  const { formatCurrency } = useFormatting();

  const [settings, setSettings] = useState<DashboardSettings>({
    showRevenue: true,
    showExpenses: true,
    showProfit: true,
    showCash: true,
    showReceivables: true,
    showPayables: true,
    showRevenueChart: true,
    showExpenseChart: true,
    showCashFlowChart: true,
    showCategoryBreakdown: true,
    dateRange: 'month',
  });

  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    cashBalance: 0,
    outstandingReceivables: 0,
    outstandingPayables: 0,
  });

  // Fetch real receivables and payables data
  useEffect(() => {
    async function fetchBalances() {
      if (!company?.id) return;

      try {
        // Fetch invoices to calculate receivables
        const invoices = await getInvoices(company.id);
        const receivables = invoices
          .filter(inv => !['paid', 'cancelled'].includes(inv.status))
          .reduce((sum, inv) => sum + (inv.amountDue || 0), 0);

        // Fetch customers and vendors to get outstanding balances
        const customers = await getCustomers(company.id);
        const vendors = await getVendors(company.id);

        const customerReceivables = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
        const vendorPayables = vendors.reduce((sum, v) => sum + (v.outstandingBalance || 0), 0);

        setStats(prev => ({
          ...prev,
          outstandingReceivables: receivables || customerReceivables,
          outstandingPayables: vendorPayables,
          cashBalance: prev.totalRevenue - prev.totalExpenses, // Net cash from transactions
        }));
      } catch (error) {
        console.error('Error fetching balance data:', error);
      }
    }

    fetchBalances();
  }, [company?.id]);

  useEffect(() => {
    if (authLoading || companyLoading) return;

    if (!user) {
      router.replace('/login');
    } else if (!company) {
      // No company selected, redirect to companies page
      router.replace('/companies');
    }
  }, [user, company, authLoading, companyLoading, router]);

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    if (transactions.length === 0) return [];

    const now = new Date();
    let startDate: Date;

    switch (settings.dateRange) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case '3months':
        startDate = subMonths(now, 3);
        break;
      case '6months':
        startDate = subMonths(now, 6);
        break;
      case 'year':
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = startOfMonth(now);
    }

    return transactions.filter(t => {
      const transactionDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return isWithinInterval(transactionDate, { start: startDate, end: now });
    });
  }, [transactions, settings.dateRange]);

  // Calculate stats from transactions
  useEffect(() => {
    const revenue = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    setStats(prev => ({
      ...prev,
      totalRevenue: revenue,
      totalExpenses: expenses,
      netProfit: revenue - expenses,
      cashBalance: revenue - expenses, // Net cash flow from transactions
    }));
  }, [filteredTransactions]);

  // Revenue/Expense trend data
  const trendData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    const grouped = filteredTransactions.reduce((acc, t) => {
      const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      const key = format(date, 'MMM dd');

      if (!acc[key]) {
        acc[key] = { date: key, revenue: 0, expenses: 0 };
      }

      if (t.type === 'income') {
        acc[key].revenue += t.amount;
      } else {
        acc[key].expenses += t.amount;
      }

      return acc;
    }, {} as Record<string, { date: string; revenue: number; expenses: number }>);

    return Object.values(grouped).slice(-30);
  }, [filteredTransactions]);

  // Expense breakdown by category
  const expenseBreakdown = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    const grouped = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  // Revenue breakdown by category
  const revenueBreakdown = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    const grouped = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        const category = t.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  // Cash flow data
  const cashFlowData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    const grouped = filteredTransactions.reduce((acc, t) => {
      const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      const key = format(date, 'MMM dd');

      if (!acc[key]) {
        acc[key] = { date: key, inflow: 0, outflow: 0, net: 0 };
      }

      if (t.type === 'income') {
        acc[key].inflow += t.amount;
      } else {
        acc[key].outflow += t.amount;
      }
      acc[key].net = acc[key].inflow - acc[key].outflow;

      return acc;
    }, {} as Record<string, { date: string; inflow: number; outflow: number; net: number }>);

    return Object.values(grouped).slice(-30);
  }, [filteredTransactions]);

  if (authLoading || companyLoading) {
    return <DashboardSkeleton />;
  }

  if (!user || !company) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      subtitle: settings.dateRange === 'month' ? 'This month' : `Last ${settings.dateRange}`,
      icon: TrendingUp,
      color: 'success' as const,
      trend: '+12%',
      show: settings.showRevenue,
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(stats.totalExpenses),
      subtitle: settings.dateRange === 'month' ? 'This month' : `Last ${settings.dateRange}`,
      icon: TrendingDown,
      color: 'danger' as const,
      trend: '+5%',
      show: settings.showExpenses,
    },
    {
      title: 'Net Profit',
      value: formatCurrency(stats.netProfit),
      subtitle: settings.dateRange === 'month' ? 'This month' : `Last ${settings.dateRange}`,
      icon: DollarSign,
      color: stats.netProfit >= 0 ? 'success' as const : 'danger' as const,
      trend: stats.netProfit >= 0 ? '+8%' : '-3%',
      show: settings.showProfit,
    },
    {
      title: 'Cash Balance',
      value: formatCurrency(stats.cashBalance),
      subtitle: 'Available now',
      icon: CreditCard,
      color: 'primary' as const,
      show: settings.showCash,
    },
    {
      title: 'Receivables',
      value: formatCurrency(stats.outstandingReceivables),
      subtitle: 'Outstanding',
      icon: FileText,
      color: 'warning' as const,
      show: settings.showReceivables,
    },
    {
      title: 'Payables',
      value: formatCurrency(stats.outstandingPayables),
      subtitle: 'Due soon',
      icon: Users,
      color: 'neutral' as const,
      show: settings.showPayables,
    },
  ];

  const visibleCards = statCards.filter(card => card.show);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack spacing={3}>
        {/* Breadcrumbs */}
        <PageBreadcrumbs
          items={[
            { label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
          ]}
        />

        {/* Header with Filters */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 'md',
                    bgcolor: 'primary.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={22} style={{ color: 'var(--joy-palette-primary-600)' }} />
                </Box>
                <Typography level="h2">
                  {company.name}
                </Typography>
              </Stack>
              <Typography level="body-md" sx={{ color: 'text.secondary' }}>
                Welcome back, {user.displayName?.split(' ')[0] || 'there'}! Here's your company overview.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl size="sm" sx={{ minWidth: 150 }}>
                <Select
                  value={settings.dateRange}
                  onChange={(_, value) => value && setSettings(prev => ({ ...prev, dateRange: value }))}
                  startDecorator={<Calendar size={16} />}
                  size="sm"
                >
                  <Option value="week">Last Week</Option>
                  <Option value="month">This Month</Option>
                  <Option value="3months">Last 3 Months</Option>
                  <Option value="6months">Last 6 Months</Option>
                  <Option value="year">Last Year</Option>
                </Select>
              </FormControl>

              <IconButton
                variant={showSettings ? 'solid' : 'outlined'}
                color="neutral"
                onClick={() => setShowSettings(!showSettings)}
                size="sm"
              >
                <Settings size={18} />
              </IconButton>
            </Stack>
          </Stack>

          {/* Dashboard Settings */}
          {showSettings && (
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Typography level="title-md" sx={{ mb: 2 }}>
                  <Filter size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  Dashboard Settings
                </Typography>

                <Grid container spacing={2}>
                  <Grid xs={12} md={6}>
                    <Typography level="title-sm" sx={{ mb: 1 }}>Stat Cards</Typography>
                    <Stack spacing={0.5}>
                      <Checkbox
                        label="Show Revenue"
                        checked={settings.showRevenue}
                        onChange={(e) => setSettings(prev => ({ ...prev, showRevenue: e.target.checked }))}
                        size="sm"
                      />
                      <Checkbox
                        label="Show Expenses"
                        checked={settings.showExpenses}
                        onChange={(e) => setSettings(prev => ({ ...prev, showExpenses: e.target.checked }))}
                        size="sm"
                      />
                      <Checkbox
                        label="Show Net Profit"
                        checked={settings.showProfit}
                        onChange={(e) => setSettings(prev => ({ ...prev, showProfit: e.target.checked }))}
                        size="sm"
                      />
                      <Checkbox
                        label="Show Cash Balance"
                        checked={settings.showCash}
                        onChange={(e) => setSettings(prev => ({ ...prev, showCash: e.target.checked }))}
                        size="sm"
                      />
                      <Checkbox
                        label="Show Receivables"
                        checked={settings.showReceivables}
                        onChange={(e) => setSettings(prev => ({ ...prev, showReceivables: e.target.checked }))}
                        size="sm"
                      />
                      <Checkbox
                        label="Show Payables"
                        checked={settings.showPayables}
                        onChange={(e) => setSettings(prev => ({ ...prev, showPayables: e.target.checked }))}
                        size="sm"
                      />
                    </Stack>
                  </Grid>

                  <Grid xs={12} md={6}>
                    <Typography level="title-sm" sx={{ mb: 1 }}>Charts & Analytics</Typography>
                    <Stack spacing={0.5}>
                      <Checkbox
                        label="Revenue/Expense Trend"
                        checked={settings.showRevenueChart}
                        onChange={(e) => setSettings(prev => ({ ...prev, showRevenueChart: e.target.checked }))}
                        size="sm"
                      />
                      <Checkbox
                        label="Expense Breakdown"
                        checked={settings.showExpenseChart}
                        onChange={(e) => setSettings(prev => ({ ...prev, showExpenseChart: e.target.checked }))}
                        size="sm"
                      />
                      <Checkbox
                        label="Cash Flow Analysis"
                        checked={settings.showCashFlowChart}
                        onChange={(e) => setSettings(prev => ({ ...prev, showCashFlowChart: e.target.checked }))}
                        size="sm"
                      />
                      <Checkbox
                        label="Category Breakdown"
                        checked={settings.showCategoryBreakdown}
                        onChange={(e) => setSettings(prev => ({ ...prev, showCategoryBreakdown: e.target.checked }))}
                        size="sm"
                      />
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Stats Grid */}
        {visibleCards.length > 0 && (
          <Grid container spacing={2}>
            {visibleCards.map((stat, index) => (
              <Grid key={index} xs={12} sm={6} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack spacing={0.5} sx={{ flex: 1 }}>
                        <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                          {stat.title}
                        </Typography>
                        <Typography level="h3" fontWeight="bold">
                          {stat.value}
                        </Typography>
                        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                          {stat.subtitle}
                        </Typography>
                        {stat.trend && (
                          <Chip size="sm" color={stat.color} variant="soft">
                            {stat.trend}
                          </Chip>
                        )}
                      </Stack>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 'sm',
                          bgcolor: `${stat.color}.100`,
                          color: `${stat.color}.600`,
                        }}
                      >
                        <stat.icon size={20} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Revenue/Expense Trend Chart */}
        {settings.showRevenueChart && trendData.length > 0 && (
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <LineChart size={20} style={{ color: 'var(--joy-palette-primary-500)' }} />
                <Typography level="title-lg">Revenue & Expense Trend</Typography>
              </Stack>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLine data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--joy-palette-neutral-200)" />
                  <XAxis dataKey="date" stroke="var(--joy-palette-text-secondary)" style={{ fontSize: 12 }} />
                  <YAxis stroke="var(--joy-palette-text-secondary)" style={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--joy-palette-background-surface)',
                      border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                      borderRadius: 8,
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--joy-palette-success-500)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--joy-palette-success-500)' }}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="var(--joy-palette-danger-500)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--joy-palette-danger-500)' }}
                    name="Expenses"
                  />
                </RechartsLine>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Cash Flow Chart */}
        {settings.showCashFlowChart && cashFlowData.length > 0 && (
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <BarChart3 size={20} style={{ color: 'var(--joy-palette-primary-500)' }} />
                <Typography level="title-lg">Cash Flow Analysis</Typography>
              </Stack>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={cashFlowData}>
                  <defs>
                    <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--joy-palette-success-500)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--joy-palette-success-500)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--joy-palette-danger-500)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--joy-palette-danger-500)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--joy-palette-neutral-200)" />
                  <XAxis dataKey="date" stroke="var(--joy-palette-text-secondary)" style={{ fontSize: 12 }} />
                  <YAxis stroke="var(--joy-palette-text-secondary)" style={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--joy-palette-background-surface)',
                      border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                      borderRadius: 8,
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="inflow"
                    stroke="var(--joy-palette-success-500)"
                    fillOpacity={1}
                    fill="url(#colorInflow)"
                    name="Inflow"
                  />
                  <Area
                    type="monotone"
                    dataKey="outflow"
                    stroke="var(--joy-palette-danger-500)"
                    fillOpacity={1}
                    fill="url(#colorOutflow)"
                    name="Outflow"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Category Breakdowns */}
        {settings.showCategoryBreakdown && (expenseBreakdown.length > 0 || revenueBreakdown.length > 0) && (
          <Grid container spacing={2}>
            {/* Expense Breakdown */}
            {settings.showExpenseChart && expenseBreakdown.length > 0 && (
              <Grid xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <PieChart size={20} style={{ color: 'var(--joy-palette-danger-500)' }} />
                      <Typography level="title-lg">Expense Breakdown</Typography>
                    </Stack>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie>
                        <Pie
                          data={expenseBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {expenseBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Revenue Breakdown */}
            {revenueBreakdown.length > 0 && (
              <Grid xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <PieChart size={20} style={{ color: 'var(--joy-palette-primary-500)' }} />
                      <Typography level="title-lg">Revenue Breakdown</Typography>
                    </Stack>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie>
                        <Pie
                          data={revenueBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {revenueBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}

        {/* Recent Transactions */}
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography level="title-lg">Recent Transactions</Typography>
              {filteredTransactions.length > 0 && (
                <Button size="sm" variant="plain" onClick={() => router.push('/transactions')}>
                  View All
                </Button>
              )}
            </Stack>

            {filteredTransactions.length === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 6,
                  px: 2,
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 'md',
                  bgcolor: 'background.level1',
                }}
              >
                <Typography level="title-md" sx={{ mb: 1, color: 'text.secondary' }}>
                  No transactions yet
                </Typography>
                <Typography level="body-sm" sx={{ mb: 3, color: 'text.tertiary' }}>
                  Get started by recording your first transaction using the AI chat below
                </Typography>
                <Stack spacing={1} sx={{ maxWidth: 400, mx: 'auto' }}>
                  <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Try these examples:
                  </Typography>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.surface',
                      borderRadius: 'sm',
                      border: '1px solid',
                      borderColor: 'primary.200',
                    }}
                  >
                    <Typography level="body-sm" sx={{ fontStyle: 'italic' }}>
                      "Record office rent payment of $2,000"
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.surface',
                      borderRadius: 'sm',
                      border: '1px solid',
                      borderColor: 'primary.200',
                    }}
                  >
                    <Typography level="body-sm" sx={{ fontStyle: 'italic' }}>
                      "Create invoice for ABC Corp for consulting, $5,000"
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.surface',
                      borderRadius: 'sm',
                      border: '1px solid',
                      borderColor: 'primary.200',
                    }}
                  >
                    <Typography level="body-sm" sx={{ fontStyle: 'italic' }}>
                      "Add customer John Smith, email john@company.com"
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ) : (
              <Stack spacing={1}>
                {filteredTransactions.slice(0, 5).map((transaction, index) => (
                  <Box
                    key={transaction.id || index}
                    sx={{
                      p: 1.5,
                      borderRadius: 'sm',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.surface',
                      '&:hover': {
                        bgcolor: 'background.level1',
                      },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack spacing={0.25}>
                        <Typography level="body-sm" fontWeight={600}>
                          {transaction.description || 'Transaction'}
                        </Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                          {transaction.date?.toDate ? format(transaction.date.toDate(), 'MMM dd, yyyy') : 'No date'}
                          {transaction.category && ` • ${transaction.category}`}
                        </Typography>
                      </Stack>
                      <Typography
                        level="body-sm"
                        fontWeight={700}
                        sx={{
                          color: transaction.type === 'income' ? 'success.600' : 'danger.600',
                        }}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
