'use client';

import { Box, Stack, Typography, Tooltip, IconButton, Chip } from '@mui/joy';
import {
  TrendingUp,
  Scale,
  Wallet,
  ArrowLeftRight,
  BookOpen,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { ElementType } from 'react';

export type ReportType =
  | 'profit-loss'
  | 'balance-sheet'
  | 'trial-balance'
  | 'cash-flow'
  | 'general-ledger'
  | 'aged-receivables'
  | 'aged-payables';

interface Report {
  id: ReportType;
  name: string;
  description: string;
  icon: ElementType;
}

interface ReportCategory {
  name: string;
  reports: Report[];
}

const reportCategories: ReportCategory[] = [
  {
    name: 'Financial Statements',
    reports: [
      { id: 'profit-loss', name: 'Profit & Loss', description: 'Revenue, expenses and net income', icon: TrendingUp },
      { id: 'balance-sheet', name: 'Balance Sheet', description: 'Assets, liabilities and equity', icon: Scale },
      { id: 'cash-flow', name: 'Cash Flow', description: 'Cash inflows and outflows', icon: Wallet },
    ],
  },
  {
    name: 'Accounting Reports',
    reports: [
      { id: 'trial-balance', name: 'Trial Balance', description: 'Account balances verification', icon: ArrowLeftRight },
      { id: 'general-ledger', name: 'General Ledger', description: 'Detailed transaction history', icon: BookOpen },
    ],
  },
  {
    name: 'Aging Reports',
    reports: [
      { id: 'aged-receivables', name: 'Aged Receivables', description: 'Outstanding customer invoices', icon: Users },
      { id: 'aged-payables', name: 'Aged Payables', description: 'Outstanding vendor bills', icon: Building2 },
    ],
  },
];

interface ReportsSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ReportsSidebar({ collapsed, onToggleCollapse }: ReportsSidebarProps) {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.companyId as string;
  const reportType = params?.reportType as ReportType | undefined;

  const sidebarWidth = collapsed ? 60 : 280;

  const handleSelectReport = (report: Report) => {
    router.push(`/companies/${companyId}/reports/${report.id}`);
  };

  return (
    <Box
      sx={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.surface',
        borderRight: '1px solid',
        borderColor: 'divider',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent={collapsed ? 'center' : 'space-between'}
        sx={{ px: collapsed ? 1 : 2, py: 2, minHeight: 64 }}
      >
        {!collapsed && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 'sm',
                bgcolor: 'primary.softBg',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={18} style={{ color: 'var(--joy-palette-primary-600)' }} />
            </Box>
            <Typography level="title-md" fontWeight="lg">
              Reports
            </Typography>
          </Stack>
        )}
        <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
          <IconButton
            size="sm"
            variant="plain"
            onClick={onToggleCollapse}
            sx={{ borderRadius: 'sm' }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Reports List */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: collapsed ? 1 : 1.5, pb: 2 }}>
        <Stack spacing={2.5}>
          {reportCategories.map((category) => (
            <Box key={category.name}>
              {!collapsed && (
                <Typography
                  level="body-xs"
                  sx={{
                    color: 'text.tertiary',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    mb: 1,
                    px: 1,
                  }}
                >
                  {category.name}
                </Typography>
              )}
              <Stack spacing={0.5}>
                {category.reports.map((report) => {
                  const Icon = report.icon;
                  const isActive = reportType === report.id;

                  return (
                    <Tooltip
                      key={report.id}
                      title={collapsed ? report.name : ''}
                      placement="right"
                    >
                      <Box
                        onClick={() => handleSelectReport(report)}
                        sx={{
                          p: collapsed ? 1 : 1.5,
                          borderRadius: 'md',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          bgcolor: isActive ? 'primary.softBg' : 'transparent',
                          color: isActive ? 'primary.600' : 'text.primary',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          gap: 1.5,
                          '&:hover': {
                            bgcolor: isActive ? 'primary.softHoverBg' : 'neutral.softBg',
                          },
                        }}
                      >
                        <Icon size={collapsed ? 20 : 18} />
                        {!collapsed && (
                          <>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                level="body-sm"
                                fontWeight={isActive ? 600 : 400}
                                sx={{
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {report.name}
                              </Typography>
                            </Box>
                            {isActive && <ChevronRight size={16} />}
                          </>
                        )}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Count Badge */}
      {!collapsed && (
        <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
              Total Reports
            </Typography>
            <Chip size="sm" variant="soft" color="primary">
              {reportCategories.reduce((sum, cat) => sum + cat.reports.length, 0)}
            </Chip>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export { reportCategories };
export type { Report, ReportCategory };
