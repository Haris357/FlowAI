'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Select,
  Option,
  Button,
  IconButton,
  FormControl,
  Chip,
  Input,
  Table,
  Sheet,
} from '@mui/joy';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import {
  generateProfitLossReport,
  generateBalanceSheetReport,
  generateTrialBalanceReport,
  generateEnhancedCashFlowReport,
  generateGeneralLedgerReport,
  generateAgedReceivablesReport,
  generateAgedPayablesReport,
} from '@/services/reports';
import { LoadingSpinner, PageBreadcrumbs } from '@/components/common';
import ReportsSidebar, { type ReportType } from '@/components/reports/ReportsSidebar';
import {
  Download,
  RefreshCw,
  X,
  Calendar,
  TrendingUp,
  Scale,
  Wallet,
  ArrowLeftRight,
  BookOpen,
  Users,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  SlidersHorizontal,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subQuarters } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { gradients, primaryPalette } from '@/styles/colors';

// ==========================================
// TYPES & CONSTANTS
// ==========================================

type DateRange = 'this-month' | 'last-month' | 'this-quarter' | 'last-quarter' | 'this-year' | 'last-year' | 'custom';

interface ActiveFilter {
  key: string;
  label: string;
  displayValue: string;
}

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  'this-month': 'This Month',
  'last-month': 'Last Month',
  'this-quarter': 'This Quarter',
  'last-quarter': 'Last Quarter',
  'this-year': 'This Year',
  'last-year': 'Last Year',
  'custom': 'Custom Range',
};

const REPORT_META: Record<string, { title: string; icon: any; description: string }> = {
  'profit-loss': { title: 'Profit & Loss', icon: TrendingUp, description: 'Revenue, expenses, and net income' },
  'balance-sheet': { title: 'Balance Sheet', icon: Scale, description: 'Assets, liabilities, and equity' },
  'trial-balance': { title: 'Trial Balance', icon: ArrowLeftRight, description: 'Account balances verification' },
  'cash-flow': { title: 'Cash Flow', icon: Wallet, description: 'Cash inflows and outflows' },
  'general-ledger': { title: 'General Ledger', icon: BookOpen, description: 'Detailed transaction history' },
  'aged-receivables': { title: 'Aged Receivables', icon: Users, description: 'Outstanding customer invoices' },
  'aged-payables': { title: 'Aged Payables', icon: Building2, description: 'Outstanding vendor bills' },
};

// ==========================================
// HELPERS
// ==========================================

function fmtCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function computeDateRange(dateRange: DateRange, customStart: string, customEnd: string) {
  const now = new Date();
  switch (dateRange) {
    case 'this-month': return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last-month': { const lm = subMonths(now, 1); return { start: startOfMonth(lm), end: endOfMonth(lm) }; }
    case 'this-quarter': { const qs = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); return { start: qs, end: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0) }; }
    case 'last-quarter': { const lqs = subQuarters(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1), 1); return { start: lqs, end: new Date(lqs.getFullYear(), lqs.getMonth() + 3, 0) }; }
    case 'this-year': return { start: startOfYear(now), end: endOfYear(now) };
    case 'last-year': { const ly = new Date(now.getFullYear() - 1, 0, 1); return { start: startOfYear(ly), end: endOfYear(ly) }; }
    case 'custom': return { start: new Date(customStart), end: new Date(customEnd) };
    default: return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

// ==========================================
// STAT CARD
// ==========================================

function StatCard({ label, value, subtext, color = 'primary', icon: Icon, trend }: {
  label: string;
  value: string;
  subtext?: string;
  color?: 'success' | 'danger' | 'primary' | 'warning' | 'neutral';
  icon?: any;
  trend?: 'up' | 'down' | 'flat';
}) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;

  return (
    <Card variant="outlined" sx={{ flex: 1, minWidth: 160 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack spacing={0.5} sx={{ flex: 1 }}>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>{label}</Typography>
            <Typography level="h3" fontWeight="bold">{value}</Typography>
            {subtext && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {trend && <TrendIcon size={13} style={{ color: `var(--joy-palette-${trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'neutral'}-500)` }} />}
                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{subtext}</Typography>
              </Stack>
            )}
            {!subtext && trend && (
              <Chip size="sm" color={color} variant="soft" sx={{ alignSelf: 'flex-start', fontSize: '11px' }}>
                <TrendIcon size={12} /> {trend === 'up' ? 'Increase' : trend === 'down' ? 'Decrease' : 'Stable'}
              </Chip>
            )}
          </Stack>
          {Icon && (
            <Box sx={{ p: 1.5, borderRadius: 'sm', bgcolor: `${color}.100`, color: `${color}.600` }}>
              <Icon size={20} />
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, total, color = 'primary' }: { title: string; total?: string; color?: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.5, borderLeft: '3px solid', borderColor: `${color}.400`, bgcolor: `${color}.50` }}>
      <Typography level="title-sm" fontWeight={700} sx={{ color: `${color}.700` }}>{title}</Typography>
      {total && <Typography level="body-sm" fontWeight={700} sx={{ fontFamily: 'monospace', color: `${color}.700` }}>{total}</Typography>}
    </Stack>
  );
}

// ==========================================
// PDF EXPORT
// ==========================================

function exportReportPDF(
  reportData: any,
  reportType: ReportType,
  companyName: string,
  currency: string,
  dateLabel: string,
) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;
  const fmt = (n: number) => fmtCurrency(n, currency);
  const meta = REPORT_META[reportType] || { title: reportType };

  // --- Header (brand terracotta accent) ---
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(142, 74, 55); // #8B4A37 — primaryPalette[800]
  pdf.text(companyName, margin, y);
  y += 7;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60);
  pdf.text(meta.title, margin, y);
  y += 5;
  pdf.setFontSize(9);
  pdf.setTextColor(120);
  pdf.text(dateLabel, margin, y);
  pdf.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, pageWidth - margin, y, { align: 'right' });
  pdf.setTextColor(0);
  y += 3;
  pdf.setDrawColor(217, 119, 87); // #D97757 brand primary
  pdf.setLineWidth(0.75);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 6;

  const tableOpts = {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [254, 244, 240] as [number, number, number], textColor: [110, 59, 45] as [number, number, number], fontStyle: 'bold' as const, lineWidth: 0.1, lineColor: [249, 188, 159] as [number, number, number] },
    bodyStyles: { lineWidth: 0.1, lineColor: [232, 229, 222] as [number, number, number] },
    footStyles: { fillColor: [253, 220, 204] as [number, number, number], textColor: [110, 59, 45] as [number, number, number], fontStyle: 'bold' as const, lineWidth: 0.1, lineColor: [249, 188, 159] as [number, number, number] },
    alternateRowStyles: { fillColor: [250, 249, 247] as [number, number, number] },
    theme: 'plain' as const,
  };

  switch (reportData.type) {
    case 'profit-loss': {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Net Profit: ${fmt(reportData.netProfit)}`, margin, y);
      y += 8;
      pdf.text('Revenue', margin, y);
      y += 2;
      autoTable(pdf, {
        ...tableOpts, startY: y,
        head: [['Account', 'Amount']],
        body: reportData.revenue.accounts.map((a: any) => [a.name, fmt(a.amount)]),
        foot: [['Total Revenue', fmt(reportData.revenue.total)]],
        columnStyles: { 1: { halign: 'right' } },
      });
      y = (pdf as any).lastAutoTable.finalY + 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Expenses', margin, y);
      y += 2;
      autoTable(pdf, {
        ...tableOpts, startY: y,
        head: [['Account', 'Amount']],
        body: reportData.expenses.accounts.map((a: any) => [a.name, fmt(a.amount)]),
        foot: [['Total Expenses', fmt(reportData.expenses.total)]],
        columnStyles: { 1: { halign: 'right' } },
      });
      y = (pdf as any).lastAutoTable.finalY + 6;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Net Profit: ${fmt(reportData.netProfit)}`, margin, y);
      break;
    }
    case 'balance-sheet': {
      const sections = [
        { label: 'Assets', rows: [...reportData.assets.current.map((a: any) => ['  ' + a.name, fmt(a.amount)]), ...reportData.assets.fixed.map((a: any) => ['  ' + a.name, fmt(a.amount)]), ...(reportData.assets.other || []).map((a: any) => ['  ' + a.name, fmt(a.amount)])], foot: [['Total Assets', fmt(reportData.assets.total)]] },
        { label: 'Liabilities', rows: [...reportData.liabilities.current.map((a: any) => ['  ' + a.name, fmt(a.amount)]), ...reportData.liabilities.longTerm.map((a: any) => ['  ' + a.name, fmt(a.amount)]), ...(reportData.liabilities.other || []).map((a: any) => ['  ' + a.name, fmt(a.amount)])], foot: [['Total Liabilities', fmt(reportData.liabilities.total)]] },
        { label: 'Equity', rows: reportData.equity.items.map((a: any) => [a.name, fmt(a.amount)]), foot: [['Total Equity', fmt(reportData.equity.total)]] },
      ];
      for (const s of sections) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(s.label, margin, y);
        y += 2;
        autoTable(pdf, { ...tableOpts, startY: y, head: [['Account', 'Amount']], body: s.rows, foot: s.foot, columnStyles: { 1: { halign: 'right' } } });
        y = (pdf as any).lastAutoTable.finalY + 6;
      }
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Assets (${fmt(reportData.assets.total)}) = Liabilities (${fmt(reportData.liabilities.total)}) + Equity (${fmt(reportData.equity.total)})`, margin, y);
      break;
    }
    case 'trial-balance': {
      autoTable(pdf, {
        ...tableOpts, startY: y,
        head: [['Code', 'Account', 'Debit', 'Credit']],
        body: reportData.accounts.map((a: any) => [a.code, a.name, a.debit > 0 ? fmt(a.debit) : '-', a.credit > 0 ? fmt(a.credit) : '-']),
        foot: [['', 'Total', fmt(reportData.totalDebit), fmt(reportData.totalCredit)]],
        columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
      });
      y = (pdf as any).lastAutoTable.finalY + 6;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(reportData.isBalanced ? 'Books are balanced' : `Books NOT balanced (Diff: ${fmt(Math.abs(reportData.totalDebit - reportData.totalCredit))})`, margin, y);
      break;
    }
    case 'cash-flow': {
      pdf.setFontSize(9);
      pdf.text(`Opening: ${fmt(reportData.openingBalance)}  |  Change: ${fmt(reportData.netCashChange)}  |  Closing: ${fmt(reportData.closingBalance)}`, margin, y);
      y += 6;
      autoTable(pdf, {
        ...tableOpts, startY: y,
        head: [['Description', 'Inflow', 'Outflow']],
        body: [
          ...reportData.operating.inflows.map((i: any) => [i.description, fmt(i.amount), '']),
          ...reportData.operating.outflows.map((o: any) => [o.description, '', fmt(Math.abs(o.amount))]),
        ],
        foot: [['Net Operating', fmt(Math.max(0, reportData.operating.netOperating)), fmt(Math.max(0, -reportData.operating.netOperating))]],
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      });
      break;
    }
    case 'aged-receivables': {
      autoTable(pdf, {
        ...tableOpts, startY: y,
        head: [['Customer', 'Current', '1-30', '31-60', '61-90', '90+', 'Total']],
        body: reportData.customers.map((c: any) => [c.customerName, fmt(c.totalCurrent), fmt(c.total1to30), fmt(c.total31to60), fmt(c.total61to90), fmt(c.totalOver90), fmt(c.totalOutstanding)]),
        foot: [['Total', fmt(reportData.summaryCurrent), fmt(reportData.summary1to30), fmt(reportData.summary31to60), fmt(reportData.summary61to90), fmt(reportData.summaryOver90), fmt(reportData.totalOutstanding)]],
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
      });
      break;
    }
    case 'aged-payables': {
      autoTable(pdf, {
        ...tableOpts, startY: y,
        head: [['Vendor', 'Current', '1-30', '31-60', '61-90', '90+', 'Total']],
        body: reportData.vendors.map((v: any) => [v.vendorName, fmt(v.totalCurrent), fmt(v.total1to30), fmt(v.total31to60), fmt(v.total61to90), fmt(v.totalOver90), fmt(v.totalOutstanding)]),
        foot: [['Total', fmt(reportData.summaryCurrent), fmt(reportData.summary1to30), fmt(reportData.summary31to60), fmt(reportData.summary61to90), fmt(reportData.summaryOver90), fmt(reportData.totalOutstanding)]],
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
      });
      break;
    }
    case 'general-ledger': {
      reportData.accounts.forEach((account: any, idx: number) => {
        if (idx > 0 && y > pdf.internal.pageSize.getHeight() - 40) { pdf.addPage(); y = margin; }
        if (idx > 0) y += 4;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${account.accountCode} — ${account.accountName}`, margin, y);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(`Closing: ${fmt(account.closingBalance)}`, pageWidth - margin, y, { align: 'right' });
        y += 2;
        autoTable(pdf, {
          ...tableOpts, startY: y,
          head: [['Date', 'Entry#', 'Description', 'Debit', 'Credit', 'Balance']],
          body: account.entries.map((e: any) => [format(e.date, 'MMM dd, yyyy'), e.entryNumber || '', e.description, e.debit > 0 ? fmt(e.debit) : '-', e.credit > 0 ? fmt(e.credit) : '-', fmt(e.balance)]),
          foot: [['', '', 'Total', fmt(account.totalDebits), fmt(account.totalCredits), fmt(account.closingBalance)]],
          columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
        });
        y = (pdf as any).lastAutoTable.finalY + 6;
      });
      break;
    }
  }

  // Footer on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    const pageH = pdf.internal.pageSize.getHeight();
    pdf.setFontSize(8);
    pdf.setTextColor(168, 90, 66); // primaryPalette[700] muted
    pdf.text(`${companyName} — ${meta.title}`, margin, pageH - 8);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageH - 8, { align: 'right' });
    pdf.setTextColor(0);
  }

  pdf.save(`${companyName.replace(/[^a-z0-9]/gi, '_')}_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function ReportPage() {
  const { user, loading: authLoading } = useAuth();
  const { company } = useCompany();
  const router = useRouter();
  const params = useParams();

  const companyId = params?.companyId as string;
  const reportType = params?.reportType as ReportType;
  const currency = company?.currency || 'USD';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('this-month');
  const [customStartDate, setCustomStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Reset filters when switching report type
  useEffect(() => {
    setAccountTypeFilter('all');
    setReportData(null);
  }, [reportType]);

  const { start, end } = useMemo(
    () => computeDateRange(dateRange, customStartDate, customEndDate),
    [dateRange, customStartDate, customEndDate]
  );

  const isPointInTime = reportType === 'balance-sheet' || reportType === 'trial-balance' || reportType === 'aged-receivables' || reportType === 'aged-payables';
  const dateLabel = isPointInTime
    ? `As of ${format(end, 'MMM dd, yyyy')}`
    : `${format(start, 'MMM dd, yyyy')} — ${format(end, 'MMM dd, yyyy')}`;

  // Active Filters
  const activeFilters = useMemo(() => {
    const filters: ActiveFilter[] = [];
    filters.push({ key: 'period', label: 'Period', displayValue: DATE_RANGE_LABELS[dateRange] });
    if (dateRange === 'custom') {
      filters.push({ key: 'from', label: 'From', displayValue: format(new Date(customStartDate), 'MMM dd, yyyy') });
      filters.push({ key: 'to', label: 'To', displayValue: format(new Date(customEndDate), 'MMM dd, yyyy') });
    }
    if (accountTypeFilter !== 'all') {
      filters.push({ key: 'accountType', label: 'Account Type', displayValue: accountTypeFilter.charAt(0).toUpperCase() + accountTypeFilter.slice(1) });
    }
    return filters;
  }, [dateRange, customStartDate, customEndDate, accountTypeFilter]);

  const removeFilter = (key: string) => {
    if (key === 'period' || key === 'from' || key === 'to') setDateRange('this-month');
    if (key === 'accountType') setAccountTypeFilter('all');
  };

  // Generate Report
  const generateReport = useCallback(async () => {
    if (!company?.id || !reportType) return;
    setLoading(true);
    setError(null);
    try {
      let data: any = null;
      switch (reportType) {
        case 'profit-loss': {
          const raw = await generateProfitLossReport(company.id, start, end);
          data = { type: 'profit-loss', ...raw, startDate: start, endDate: end };
          break;
        }
        case 'balance-sheet': {
          const raw = await generateBalanceSheetReport(company.id, end);
          data = { type: 'balance-sheet', ...raw, asOfDate: end };
          break;
        }
        case 'trial-balance': {
          const raw = await generateTrialBalanceReport(company.id, end);
          data = { type: 'trial-balance', ...raw, asOfDate: end };
          if (accountTypeFilter !== 'all') {
            data.accounts = raw.accounts.filter((a: any) => {
              const c = a.code || '';
              if (accountTypeFilter === 'asset') return c.startsWith('1');
              if (accountTypeFilter === 'liability') return c.startsWith('2');
              if (accountTypeFilter === 'equity') return c.startsWith('3');
              if (accountTypeFilter === 'revenue') return c.startsWith('4');
              if (accountTypeFilter === 'expense') return c.startsWith('5') || c.startsWith('6');
              return true;
            });
            data.totalDebit = data.accounts.reduce((s: number, a: any) => s + a.debit, 0);
            data.totalCredit = data.accounts.reduce((s: number, a: any) => s + a.credit, 0);
            data.isBalanced = Math.abs(data.totalDebit - data.totalCredit) < 0.01;
          }
          break;
        }
        case 'cash-flow': {
          const raw = await generateEnhancedCashFlowReport(company.id, start, end);
          data = { type: 'cash-flow', ...raw };
          break;
        }
        case 'general-ledger': {
          const raw = await generateGeneralLedgerReport(company.id, start, end);
          data = { type: 'general-ledger', ...raw };
          if (accountTypeFilter !== 'all') {
            data.accounts = raw.accounts.filter((a: any) => {
              const c = a.accountCode || '';
              if (accountTypeFilter === 'asset') return c.startsWith('1');
              if (accountTypeFilter === 'liability') return c.startsWith('2');
              if (accountTypeFilter === 'equity') return c.startsWith('3');
              if (accountTypeFilter === 'revenue') return c.startsWith('4');
              if (accountTypeFilter === 'expense') return c.startsWith('5') || c.startsWith('6');
              return true;
            });
          }
          break;
        }
        case 'aged-receivables': {
          const raw = await generateAgedReceivablesReport(company.id, end);
          data = { type: 'aged-receivables', ...raw, asOfDate: end };
          break;
        }
        case 'aged-payables': {
          const raw = await generateAgedPayablesReport(company.id, end);
          data = { type: 'aged-payables', ...raw, asOfDate: end };
          break;
        }
        default: throw new Error(`Unknown report type: ${reportType}`);
      }
      setReportData(data);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [company?.id, reportType, start, end, accountTypeFilter]);

  useEffect(() => {
    if (company?.id && reportType) generateReport();
  }, [company?.id, reportType, dateRange, customStartDate, customEndDate, accountTypeFilter]);

  const handleExportPDF = async () => {
    if (!reportData || !company) return;
    setExporting(true);
    try {
      exportReportPDF(reportData, reportType, company.name, currency, dateLabel);
      toast.success('PDF exported');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const meta = REPORT_META[reportType] || { title: 'Report', icon: FileText, description: '' };
  const ReportIcon = meta.icon;
  const fmt = (n: number) => fmtCurrency(n, currency);
  const showAccountFilter = reportType === 'trial-balance' || reportType === 'general-ledger';

  // ==========================================
  // RENDER REPORT CONTENT
  // ==========================================

  const renderReport = () => {
    if (!reportData) return null;

    switch (reportData.type) {
      case 'profit-loss':
        return (
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
              <StatCard label="Total Revenue" value={fmt(reportData.revenue.total)} color="success" icon={TrendingUp} trend="up" />
              <StatCard label="Total Expenses" value={fmt(reportData.expenses.total)} color="danger" icon={ArrowDownRight} trend="down" />
              <StatCard label="Net Profit" value={fmt(reportData.netProfit)} color={reportData.netProfit >= 0 ? 'success' : 'danger'} icon={Wallet}
                subtext={reportData.revenue.total > 0 ? `${((reportData.netProfit / reportData.revenue.total) * 100).toFixed(1)}% margin` : undefined} />
            </Stack>

            <Card variant="outlined">
              <CardContent sx={{ p: 0 }}>
                <SectionHeader title="Revenue" total={fmt(reportData.revenue.total)} color="success" />
                <Sheet sx={{ overflow: 'auto' }}>
                  <Table size="sm" stripe="odd" sx={{ '& thead th': { bgcolor: 'background.level1', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' } }}>
                    <thead><tr><th style={{ width: '60%' }}>Account</th><th style={{ textAlign: 'right' }}>Amount</th>{reportData.revenue.total > 0 && <th style={{ textAlign: 'right', width: 80 }}>%</th>}</tr></thead>
                    <tbody>
                      {reportData.revenue.accounts.map((a: any, i: number) => (
                        <tr key={i}>
                          <td>{a.name}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(a.amount)}</td>
                          {reportData.revenue.total > 0 && <td style={{ textAlign: 'right', color: 'var(--joy-palette-text-tertiary)' }}>{((a.amount / reportData.revenue.total) * 100).toFixed(1)}%</td>}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr><td><strong>Total Revenue</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.revenue.total)}</strong></td>{reportData.revenue.total > 0 && <td style={{ textAlign: 'right' }}><strong>100%</strong></td>}</tr></tfoot>
                  </Table>
                </Sheet>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent sx={{ p: 0 }}>
                <SectionHeader title="Expenses" total={fmt(reportData.expenses.total)} color="danger" />
                <Sheet sx={{ overflow: 'auto' }}>
                  <Table size="sm" stripe="odd" sx={{ '& thead th': { bgcolor: 'background.level1', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' } }}>
                    <thead><tr><th style={{ width: '60%' }}>Account</th><th style={{ textAlign: 'right' }}>Amount</th>{reportData.expenses.total > 0 && <th style={{ textAlign: 'right', width: 80 }}>%</th>}</tr></thead>
                    <tbody>
                      {reportData.expenses.accounts.map((a: any, i: number) => (
                        <tr key={i}>
                          <td>{a.name}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(a.amount)}</td>
                          {reportData.expenses.total > 0 && <td style={{ textAlign: 'right', color: 'var(--joy-palette-text-tertiary)' }}>{((a.amount / reportData.expenses.total) * 100).toFixed(1)}%</td>}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr><td><strong>Total Expenses</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.expenses.total)}</strong></td>{reportData.expenses.total > 0 && <td style={{ textAlign: 'right' }}><strong>100%</strong></td>}</tr></tfoot>
                  </Table>
                </Sheet>
              </CardContent>
            </Card>

            <Card variant="soft" color={reportData.netProfit >= 0 ? 'success' : 'danger'} sx={{ py: 1 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography level="title-md" fontWeight={700}>Net Profit</Typography>
                  <Typography level="h3" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{fmt(reportData.netProfit)}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        );

      case 'balance-sheet':
        return (
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
              <StatCard label="Total Assets" value={fmt(reportData.assets.total)} color="primary" icon={TrendingUp} />
              <StatCard label="Total Liabilities" value={fmt(reportData.liabilities.total)} color="warning" icon={AlertTriangle} />
              <StatCard label="Total Equity" value={fmt(reportData.equity.total)} color="success" icon={CheckCircle} />
            </Stack>

            {/* Assets */}
            <Card variant="outlined">
              <CardContent sx={{ p: 0 }}>
                <SectionHeader title="Assets" total={fmt(reportData.assets.total)} color="primary" />
                <Sheet sx={{ overflow: 'auto' }}>
                  <Table size="sm" stripe="odd" sx={{ '& thead th': { bgcolor: 'background.level1', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' } }}>
                    <thead><tr><th>Account</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                    <tbody>
                      {reportData.assets.current.length > 0 && <>
                        <tr><td colSpan={2} style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--joy-palette-text-secondary)' }}>Current Assets</td></tr>
                        {reportData.assets.current.map((a: any, i: number) => <tr key={`ca-${i}`}><td style={{ paddingLeft: 24 }}>{a.name}</td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(a.amount)}</td></tr>)}
                        <tr><td style={{ fontWeight: 600 }}>Subtotal Current</td><td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{fmt(reportData.assets.totalCurrent)}</td></tr>
                      </>}
                      {reportData.assets.fixed.length > 0 && <>
                        <tr><td colSpan={2} style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--joy-palette-text-secondary)' }}>Fixed Assets</td></tr>
                        {reportData.assets.fixed.map((a: any, i: number) => <tr key={`fa-${i}`}><td style={{ paddingLeft: 24 }}>{a.name}</td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(a.amount)}</td></tr>)}
                        <tr><td style={{ fontWeight: 600 }}>Subtotal Fixed</td><td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{fmt(reportData.assets.totalFixed)}</td></tr>
                      </>}
                      {reportData.assets.other?.length > 0 && <>
                        <tr><td colSpan={2} style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--joy-palette-text-secondary)' }}>Other Assets</td></tr>
                        {reportData.assets.other.map((a: any, i: number) => <tr key={`oa-${i}`}><td style={{ paddingLeft: 24 }}>{a.name}</td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(a.amount)}</td></tr>)}
                        <tr><td style={{ fontWeight: 600 }}>Subtotal Other</td><td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{fmt(reportData.assets.totalOther)}</td></tr>
                      </>}
                    </tbody>
                    <tfoot><tr><td><strong>Total Assets</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.assets.total)}</strong></td></tr></tfoot>
                  </Table>
                </Sheet>
              </CardContent>
            </Card>

            {/* Liabilities */}
            <Card variant="outlined">
              <CardContent sx={{ p: 0 }}>
                <SectionHeader title="Liabilities" total={fmt(reportData.liabilities.total)} color="warning" />
                <Sheet sx={{ overflow: 'auto' }}>
                  <Table size="sm" stripe="odd" sx={{ '& thead th': { bgcolor: 'background.level1', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' } }}>
                    <thead><tr><th>Account</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                    <tbody>
                      {reportData.liabilities.current.length > 0 && <>
                        <tr><td colSpan={2} style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--joy-palette-text-secondary)' }}>Current Liabilities</td></tr>
                        {reportData.liabilities.current.map((a: any, i: number) => <tr key={`cl-${i}`}><td style={{ paddingLeft: 24 }}>{a.name}</td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(a.amount)}</td></tr>)}
                        <tr><td style={{ fontWeight: 600 }}>Subtotal Current</td><td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{fmt(reportData.liabilities.totalCurrent)}</td></tr>
                      </>}
                      {reportData.liabilities.longTerm.length > 0 && <>
                        <tr><td colSpan={2} style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--joy-palette-text-secondary)' }}>Long-term Liabilities</td></tr>
                        {reportData.liabilities.longTerm.map((a: any, i: number) => <tr key={`lt-${i}`}><td style={{ paddingLeft: 24 }}>{a.name}</td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(a.amount)}</td></tr>)}
                        <tr><td style={{ fontWeight: 600 }}>Subtotal Long-term</td><td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{fmt(reportData.liabilities.totalLongTerm)}</td></tr>
                      </>}
                      {reportData.liabilities.other?.length > 0 && <>
                        <tr><td colSpan={2} style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--joy-palette-text-secondary)' }}>Other Liabilities</td></tr>
                        {reportData.liabilities.other.map((a: any, i: number) => <tr key={`ol-${i}`}><td style={{ paddingLeft: 24 }}>{a.name}</td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(a.amount)}</td></tr>)}
                        <tr><td style={{ fontWeight: 600 }}>Subtotal Other</td><td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{fmt(reportData.liabilities.totalOther)}</td></tr>
                      </>}
                    </tbody>
                    <tfoot><tr><td><strong>Total Liabilities</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.liabilities.total)}</strong></td></tr></tfoot>
                  </Table>
                </Sheet>
              </CardContent>
            </Card>

            {/* Equity */}
            <Card variant="outlined">
              <CardContent sx={{ p: 0 }}>
                <SectionHeader title="Equity" total={fmt(reportData.equity.total)} color="success" />
                <Sheet sx={{ overflow: 'auto' }}>
                  <Table size="sm" stripe="odd" sx={{ '& thead th': { bgcolor: 'background.level1', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' } }}>
                    <thead><tr><th>Account</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                    <tbody>{reportData.equity.items.map((a: any, i: number) => <tr key={i}><td>{a.name}</td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(a.amount)}</td></tr>)}</tbody>
                    <tfoot><tr><td><strong>Total Equity</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.equity.total)}</strong></td></tr></tfoot>
                  </Table>
                </Sheet>
              </CardContent>
            </Card>

            <Card variant="soft" color="primary" sx={{ py: 0.5 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ flexWrap: 'wrap' }}>
                  <CheckCircle size={16} />
                  <Typography level="body-sm" fontWeight={600}>
                    Assets ({fmt(reportData.assets.total)}) = Liabilities ({fmt(reportData.liabilities.total)}) + Equity ({fmt(reportData.equity.total)})
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        );

      case 'trial-balance':
        return (
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2}>
              <StatCard label="Total Debit" value={fmt(reportData.totalDebit)} color="primary" icon={ArrowUpRight} />
              <StatCard label="Total Credit" value={fmt(reportData.totalCredit)} color="primary" icon={ArrowDownRight} />
              <StatCard label="Status" value={reportData.isBalanced ? 'Balanced' : 'Unbalanced'} color={reportData.isBalanced ? 'success' : 'danger'} icon={reportData.isBalanced ? CheckCircle : AlertTriangle}
                subtext={!reportData.isBalanced ? `Diff: ${fmt(Math.abs(reportData.totalDebit - reportData.totalCredit))}` : `${reportData.accounts.length} accounts`} />
            </Stack>

            <Card variant="outlined">
              <CardContent sx={{ p: 0 }}>
                <Sheet sx={{ overflow: 'auto' }}>
                  <Table size="sm" stripe="odd" sx={{ '& thead th': { bgcolor: 'background.level1', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' } }}>
                    <thead><tr><th style={{ width: 90 }}>Code</th><th>Account</th><th style={{ textAlign: 'right' }}>Debit</th><th style={{ textAlign: 'right' }}>Credit</th></tr></thead>
                    <tbody>
                      {reportData.accounts.map((a: any, i: number) => (
                        <tr key={i}>
                          <td><Typography level="body-xs" sx={{ fontFamily: 'monospace', color: 'text.tertiary' }}>{a.code}</Typography></td>
                          <td>{a.name}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{a.debit > 0 ? fmt(a.debit) : <Typography component="span" level="body-xs" sx={{ color: 'text.tertiary' }}>—</Typography>}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{a.credit > 0 ? fmt(a.credit) : <Typography component="span" level="body-xs" sx={{ color: 'text.tertiary' }}>—</Typography>}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr><td colSpan={2}><strong>Total</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.totalDebit)}</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.totalCredit)}</strong></td></tr></tfoot>
                  </Table>
                </Sheet>
              </CardContent>
            </Card>

            <Card variant="soft" color={reportData.isBalanced ? 'success' : 'danger'} sx={{ py: 0.5 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                  {reportData.isBalanced ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  <Typography level="body-sm" fontWeight={700}>
                    {reportData.isBalanced ? 'Books are balanced' : `Books NOT balanced — Diff: ${fmt(Math.abs(reportData.totalDebit - reportData.totalCredit))}`}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        );

      case 'cash-flow':
        return (
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
              <StatCard label="Opening Balance" value={fmt(reportData.openingBalance)} color="primary" icon={Wallet} />
              <StatCard label="Net Cash Change" value={fmt(reportData.netCashChange)} color={reportData.netCashChange >= 0 ? 'success' : 'danger'} icon={ArrowLeftRight} trend={reportData.netCashChange >= 0 ? 'up' : 'down'} />
              <StatCard label="Closing Balance" value={fmt(reportData.closingBalance)} color="primary" icon={Wallet} />
            </Stack>

            <Card variant="outlined">
              <CardContent sx={{ p: 0 }}>
                <SectionHeader title="Operating Activities" total={fmt(reportData.operating.netOperating)} color="primary" />
                <Sheet sx={{ overflow: 'auto' }}>
                  <Table size="sm" stripe="odd" sx={{ '& thead th': { bgcolor: 'background.level1', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' } }}>
                    <thead><tr><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                    <tbody>
                      {reportData.operating.inflows.map((item: any, i: number) => (
                        <tr key={`in-${i}`}><td>{item.description}</td><td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--joy-palette-success-600)' }}>{fmt(item.amount)}</td></tr>
                      ))}
                      {reportData.operating.outflows.map((item: any, i: number) => (
                        <tr key={`out-${i}`}><td>{item.description}</td><td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--joy-palette-danger-600)' }}>{fmt(item.amount)}</td></tr>
                      ))}
                    </tbody>
                    <tfoot><tr><td><strong>Net Operating</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.operating.netOperating)}</strong></td></tr></tfoot>
                  </Table>
                </Sheet>
              </CardContent>
            </Card>

            <Card variant="soft" color={reportData.netCashChange >= 0 ? 'success' : 'danger'} sx={{ py: 0.5 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography level="title-md" fontWeight={700}>Net Cash Flow</Typography>
                  <Typography level="h3" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{fmt(reportData.netCashChange)}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        );

      case 'aged-receivables':
        return (
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 0.5 }}>
              <StatCard label="Current" value={fmt(reportData.summaryCurrent)} color="success" icon={CheckCircle} />
              <StatCard label="1–30 Days" value={fmt(reportData.summary1to30)} color="primary" icon={Calendar} />
              <StatCard label="31–60 Days" value={fmt(reportData.summary31to60)} color="warning" icon={AlertTriangle} />
              <StatCard label="61–90 Days" value={fmt(reportData.summary61to90)} color="warning" icon={AlertTriangle} />
              <StatCard label="90+ Days" value={fmt(reportData.summaryOver90)} color="danger" icon={AlertTriangle} />
            </Stack>
            <Card variant="outlined">
              <CardContent sx={{ p: 0 }}>
                <SectionHeader title="Outstanding by Customer" total={fmt(reportData.totalOutstanding)} />
                <Sheet sx={{ overflow: 'auto' }}>
                  <Table size="sm" stripe="odd" sx={{ '& thead th': { bgcolor: 'background.level1', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' } }}>
                    <thead><tr><th>Customer</th><th style={{ textAlign: 'right' }}>Current</th><th style={{ textAlign: 'right' }}>1–30</th><th style={{ textAlign: 'right' }}>31–60</th><th style={{ textAlign: 'right' }}>61–90</th><th style={{ textAlign: 'right' }}>90+</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
                    <tbody>
                      {reportData.customers.map((c: any) => (
                        <tr key={c.customerId}>
                          <td><Typography level="body-sm" fontWeight={500}>{c.customerName}</Typography></td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(c.totalCurrent)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(c.total1to30)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: c.total31to60 > 0 ? 'var(--joy-palette-warning-600)' : undefined }}>{fmt(c.total31to60)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: c.total61to90 > 0 ? 'var(--joy-palette-warning-700)' : undefined }}>{fmt(c.total61to90)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: c.totalOver90 > 0 ? 'var(--joy-palette-danger-600)' : undefined }}>{fmt(c.totalOver90)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{fmt(c.totalOutstanding)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr><td><strong>Total</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.summaryCurrent)}</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.summary1to30)}</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.summary31to60)}</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.summary61to90)}</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.summaryOver90)}</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.totalOutstanding)}</strong></td></tr></tfoot>
                  </Table>
                </Sheet>
              </CardContent>
            </Card>
          </Stack>
        );

      case 'aged-payables':
        return (
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 0.5 }}>
              <StatCard label="Current" value={fmt(reportData.summaryCurrent)} color="success" icon={CheckCircle} />
              <StatCard label="1–30 Days" value={fmt(reportData.summary1to30)} color="primary" icon={Calendar} />
              <StatCard label="31–60 Days" value={fmt(reportData.summary31to60)} color="warning" icon={AlertTriangle} />
              <StatCard label="61–90 Days" value={fmt(reportData.summary61to90)} color="warning" icon={AlertTriangle} />
              <StatCard label="90+ Days" value={fmt(reportData.summaryOver90)} color="danger" icon={AlertTriangle} />
            </Stack>
            <Card variant="outlined">
              <CardContent sx={{ p: 0 }}>
                <SectionHeader title="Outstanding by Vendor" total={fmt(reportData.totalOutstanding)} />
                <Sheet sx={{ overflow: 'auto' }}>
                  <Table size="sm" stripe="odd" sx={{ '& thead th': { bgcolor: 'background.level1', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' } }}>
                    <thead><tr><th>Vendor</th><th style={{ textAlign: 'right' }}>Current</th><th style={{ textAlign: 'right' }}>1–30</th><th style={{ textAlign: 'right' }}>31–60</th><th style={{ textAlign: 'right' }}>61–90</th><th style={{ textAlign: 'right' }}>90+</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
                    <tbody>
                      {reportData.vendors.map((v: any) => (
                        <tr key={v.vendorId}>
                          <td><Typography level="body-sm" fontWeight={500}>{v.vendorName}</Typography></td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(v.totalCurrent)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(v.total1to30)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: v.total31to60 > 0 ? 'var(--joy-palette-warning-600)' : undefined }}>{fmt(v.total31to60)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: v.total61to90 > 0 ? 'var(--joy-palette-warning-700)' : undefined }}>{fmt(v.total61to90)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: v.totalOver90 > 0 ? 'var(--joy-palette-danger-600)' : undefined }}>{fmt(v.totalOver90)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{fmt(v.totalOutstanding)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr><td><strong>Total</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.summaryCurrent)}</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.summary1to30)}</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.summary31to60)}</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.summary61to90)}</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.summaryOver90)}</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(reportData.totalOutstanding)}</strong></td></tr></tfoot>
                  </Table>
                </Sheet>
              </CardContent>
            </Card>
          </Stack>
        );

      case 'general-ledger':
        return (
          <Stack spacing={2}>
            <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>{reportData.accounts.length} account{reportData.accounts.length !== 1 ? 's' : ''} with activity</Typography>
            {reportData.accounts.map((account: any) => (
              <Card key={account.accountId} variant="outlined">
                <CardContent sx={{ p: 0 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', borderLeft: '3px solid', borderLeftColor: 'primary.400', bgcolor: 'primary.50' }}>
                    <Box>
                      <Typography level="title-sm" fontWeight={700} sx={{ color: 'primary.700' }}>{account.accountCode} — {account.accountName}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{account.accountType}</Typography>
                    </Box>
                    <Typography level="body-sm" fontWeight={600} sx={{ fontFamily: 'monospace', color: 'primary.700' }}>Balance: {fmt(account.closingBalance)}</Typography>
                  </Stack>
                  <Sheet sx={{ overflow: 'auto' }}>
                    <Table size="sm" stripe="odd" sx={{ '& thead th': { bgcolor: 'background.level1', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' } }}>
                      <thead><tr><th style={{ width: 100 }}>Date</th><th style={{ width: 80 }}>Entry#</th><th>Description</th><th style={{ textAlign: 'right' }}>Debit</th><th style={{ textAlign: 'right' }}>Credit</th><th style={{ textAlign: 'right' }}>Balance</th></tr></thead>
                      <tbody>
                        {account.entries.map((e: any, i: number) => (
                          <tr key={i}>
                            <td><Typography level="body-xs">{format(e.date, 'MMM dd, yyyy')}</Typography></td>
                            <td><Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{e.entryNumber}</Typography></td>
                            <td><Typography level="body-xs">{e.description}</Typography></td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{e.debit > 0 ? fmt(e.debit) : <Typography component="span" level="body-xs" sx={{ color: 'text.tertiary' }}>—</Typography>}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{e.credit > 0 ? fmt(e.credit) : <Typography component="span" level="body-xs" sx={{ color: 'text.tertiary' }}>—</Typography>}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 500 }}>{fmt(e.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot><tr><td colSpan={3}><strong>Total</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(account.totalDebits)}</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(account.totalCredits)}</strong></td><td style={{ textAlign: 'right', fontFamily: 'monospace' }}><strong>{fmt(account.closingBalance)}</strong></td></tr></tfoot>
                    </Table>
                  </Sheet>
                </CardContent>
              </Card>
            ))}
          </Stack>
        );

      default:
        return (
          <Card variant="outlined"><CardContent sx={{ py: 6, textAlign: 'center' }}>
            <FileText size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
            <Typography level="body-md" sx={{ color: 'text.tertiary', mt: 1 }}>Coming soon</Typography>
          </CardContent></Card>
        );
    }
  };

  // ==========================================
  // PAGE LAYOUT
  // ==========================================

  if (authLoading || !user) return <LoadingSpinner fullScreen />;

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <ReportsSidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ px: 4, pt: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <PageBreadcrumbs items={[{ label: 'Reports', href: `/companies/${companyId}/reports` }, { label: meta.title, icon: <ReportIcon size={14} /> }]} />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 4, py: 3 }}>
          <Stack spacing={2.5}>
            {/* Title + Actions */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, borderRadius: 'md', background: gradients.brand, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ReportIcon size={22} />
                </Box>
                <Box>
                  <Typography level="h2" sx={{ mb: 0.25 }}>{meta.title}</Typography>
                  <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>{dateLabel}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1}>
                <IconButton variant="outlined" color="primary" size="sm" onClick={generateReport} disabled={loading}>
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </IconButton>
                <Button variant="solid" color="primary" size="sm" startDecorator={<Download size={14} />}
                  onClick={handleExportPDF} disabled={loading || exporting || !reportData} loading={exporting}>
                  Export PDF
                </Button>
              </Stack>
            </Stack>

            {/* Filters */}
            <Card variant="outlined" sx={{ background: gradients.primaryCard, borderColor: `${primaryPalette[200]}40` }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                    <SlidersHorizontal size={15} style={{ color: `var(--joy-palette-primary-500)`, flexShrink: 0 }} />

                    <FormControl size="sm">
                      <Select value={dateRange} onChange={(_, v) => setDateRange(v as DateRange)} startDecorator={<Calendar size={14} />} size="sm" sx={{ minWidth: 150 }}>
                        <Option value="this-month">This Month</Option>
                        <Option value="last-month">Last Month</Option>
                        <Option value="this-quarter">This Quarter</Option>
                        <Option value="last-quarter">Last Quarter</Option>
                        <Option value="this-year">This Year</Option>
                        <Option value="last-year">Last Year</Option>
                        <Option value="custom">Custom Range</Option>
                      </Select>
                    </FormControl>

                    {dateRange === 'custom' && <>
                      <Input type="date" size="sm" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} sx={{ width: 150 }} />
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>to</Typography>
                      <Input type="date" size="sm" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} sx={{ width: 150 }} />
                    </>}

                    {showAccountFilter && (
                      <FormControl size="sm">
                        <Select value={accountTypeFilter} onChange={(_, v) => setAccountTypeFilter(v as string)} size="sm" sx={{ minWidth: 140 }} placeholder="Account Type">
                          <Option value="all">All Accounts</Option>
                          <Option value="asset">Assets</Option>
                          <Option value="liability">Liabilities</Option>
                          <Option value="equity">Equity</Option>
                          <Option value="revenue">Revenue</Option>
                          <Option value="expense">Expenses</Option>
                        </Select>
                      </FormControl>
                    )}
                  </Stack>

                  {/* Active filter chips */}
                  {activeFilters.length > 0 && (
                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                      {activeFilters.map((f) => (
                        <Chip key={f.key} size="sm" variant="soft" color="primary" sx={{ fontSize: '0.7rem' }}
                          endDecorator={f.key !== 'period' ? (
                            <Box component="span" onClick={() => removeFilter(f.key)} sx={{ cursor: 'pointer', display: 'flex', ml: 0.25, '&:hover': { color: 'danger.500' } }}><X size={12} /></Box>
                          ) : undefined}>
                          {f.label}: {f.displayValue}
                        </Chip>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Report Content */}
            {loading ? (
              <Card variant="outlined"><CardContent sx={{ py: 8 }}>
                <Stack alignItems="center" spacing={2}>
                  <RefreshCw size={36} className="animate-spin" style={{ color: primaryPalette[400] }} />
                  <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>Generating report...</Typography>
                </Stack>
              </CardContent></Card>
            ) : error ? (
              <Card variant="outlined"><CardContent sx={{ py: 6 }}>
                <Stack alignItems="center" spacing={2}>
                  <AlertTriangle size={36} color="var(--joy-palette-danger-500)" />
                  <Typography level="body-md" color="danger">{error}</Typography>
                  <Button variant="outlined" size="sm" onClick={generateReport} startDecorator={<RefreshCw size={14} />}>Retry</Button>
                </Stack>
              </CardContent></Card>
            ) : reportData ? renderReport() : (
              <Card variant="outlined"><CardContent sx={{ py: 6, textAlign: 'center' }}>
                <FileText size={48} strokeWidth={1} style={{ opacity: 0.2 }} />
                <Typography level="body-sm" sx={{ color: 'text.tertiary', mt: 1 }}>No data available for this period</Typography>
              </CardContent></Card>
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
