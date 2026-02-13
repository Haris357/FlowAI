'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Table,
  Sheet,
  Typography,
  IconButton,
  Chip,
  Button,
  Stack,
} from '@mui/joy';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
} from 'lucide-react';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'currency' | 'date' | 'status';
  width?: string;
}

interface ChatDataGridProps {
  items: Record<string, any>[];
  columns: Column[];
  entityType: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
  onViewItem?: (item: Record<string, any>) => void;
  onPageChange?: (page: number) => void;
  maxRows?: number;
}

export default function ChatDataGrid({
  items,
  columns,
  entityType,
  pagination,
  onViewItem,
  onPageChange,
  maxRows = 5,
}: ChatDataGridProps) {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const [currentPage, setCurrentPage] = useState(1);

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '-';
    return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (['paid', 'active', 'completed', 'income'].includes(statusLower)) return 'success';
    if (['overdue', 'inactive', 'cancelled', 'expense'].includes(statusLower)) return 'danger';
    if (['sent', 'pending', 'in_progress'].includes(statusLower)) return 'primary';
    if (['draft', 'unpaid'].includes(statusLower)) return 'warning';
    return 'neutral';
  };

  const renderCellValue = (item: Record<string, any>, column: Column) => {
    const value = item[column.key];

    if (value === undefined || value === null) return '-';

    switch (column.type) {
      case 'currency':
        return formatCurrency(value);
      case 'date':
        return formatDate(value);
      case 'status':
        return (
          <Chip
            size="sm"
            variant="soft"
            color={getStatusColor(String(value))}
            sx={{ textTransform: 'capitalize' }}
          >
            {String(value).replace(/_/g, ' ')}
          </Chip>
        );
      default:
        return String(value);
    }
  };

  // Limit displayed rows
  const displayedItems = items.slice(0, maxRows);
  const hasMore = items.length > maxRows;

  return (
    <Box sx={{ width: '100%' }}>
      <Sheet
        variant="outlined"
        sx={{
          borderRadius: 'md',
          overflow: 'hidden',
          '& table': {
            tableLayout: 'auto',
          },
        }}
      >
        <Table
          size="sm"
          stickyHeader
          hoverRow
          sx={{
            '--TableCell-paddingY': '8px',
            '--TableCell-paddingX': '12px',
            '& thead th': {
              bgcolor: 'background.level1',
              fontWeight: 600,
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'text.secondary',
            },
            '& tbody tr:hover': {
              bgcolor: 'background.level1',
            },
          }}
        >
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    width: column.width,
                    textAlign: column.type === 'currency' ? 'right' : 'left',
                  }}
                >
                  {column.label}
                </th>
              ))}
              {onViewItem && <th style={{ width: '60px' }}></th>}
            </tr>
          </thead>
          <tbody>
            {displayedItems.map((item, index) => (
              <tr
                key={item.id || index}
                style={{ cursor: onViewItem ? 'pointer' : 'default' }}
                onClick={() => onViewItem?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      textAlign: column.type === 'currency' ? 'right' : 'left',
                    }}
                  >
                    <Typography level="body-sm" noWrap sx={{ maxWidth: 200 }}>
                      {renderCellValue(item, column)}
                    </Typography>
                  </td>
                ))}
                {onViewItem && (
                  <td>
                    <IconButton
                      size="sm"
                      variant="plain"
                      color="neutral"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewItem(item);
                      }}
                    >
                      <Eye size={16} />
                    </IconButton>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </Sheet>

      {/* Footer with pagination or "show more" */}
      {(hasMore || pagination) && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 1, px: 0.5 }}
        >
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            Showing {displayedItems.length} of {items.length} {entityType}s
          </Typography>

          {pagination && pagination.total > pagination.pageSize && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <IconButton
                size="sm"
                variant="outlined"
                color="neutral"
                disabled={currentPage === 1}
                onClick={() => {
                  const newPage = currentPage - 1;
                  setCurrentPage(newPage);
                  onPageChange?.(newPage);
                }}
              >
                <ChevronLeft size={16} />
              </IconButton>
              <Typography level="body-xs" sx={{ px: 1 }}>
                Page {currentPage} of {Math.ceil(pagination.total / pagination.pageSize)}
              </Typography>
              <IconButton
                size="sm"
                variant="outlined"
                color="neutral"
                disabled={currentPage >= Math.ceil(pagination.total / pagination.pageSize)}
                onClick={() => {
                  const newPage = currentPage + 1;
                  setCurrentPage(newPage);
                  onPageChange?.(newPage);
                }}
              >
                <ChevronRight size={16} />
              </IconButton>
            </Stack>
          )}

          {hasMore && !pagination && (
            <Button
              size="sm"
              variant="plain"
              color="primary"
              endDecorator={<MoreHorizontal size={14} />}
              onClick={() => {
                // Navigate to the relevant page based on entity type
                const routes: Record<string, string> = {
                  account: 'accounts',
                  customer: 'customers',
                  vendor: 'vendors',
                  employee: 'employees',
                  invoice: 'invoices',
                  bill: 'bills',
                  transaction: 'transactions',
                };
                const route = routes[entityType];
                if (route && companyId) {
                  router.push(`/companies/${companyId}/${route}`);
                }
              }}
            >
              View All
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
