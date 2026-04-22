'use client';

import { Box, Stack, Typography, Select, Option, IconButton } from '@mui/joy';
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';

interface Props {
  startIdx: number;
  endIdx: number;
  total: number;
  pageSize: number;
  setPageSize: (n: number) => void;
  currentPage: number;
  totalPages: number;
  setPage: (fn: number | ((p: number) => number)) => void;
  pageSizeOptions?: number[];
}

const DEFAULT_SIZES = [10, 25, 50, 100];

/**
 * Shared pagination footer — drop into any admin Card under a Table.
 * Used by activity, reports, support, feedback, testimonials, blogs,
 * notifications, announcements, newsletter pages.
 */
export default function PaginationFooter({
  startIdx, endIdx, total,
  pageSize, setPageSize,
  currentPage, totalPages, setPage,
  pageSizeOptions = DEFAULT_SIZES,
}: Props) {
  return (
    <Box sx={{
      px: { xs: 2, sm: 2.5 }, py: 1.5,
      borderTop: '1px solid', borderColor: 'divider',
      bgcolor: 'background.surface',
    }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            Showing <strong>{total === 0 ? 0 : startIdx + 1}</strong>–<strong>{endIdx}</strong> of <strong>{total}</strong>
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Rows:</Typography>
            <Select
              size="sm"
              value={pageSize}
              onChange={(_, v) => v && setPageSize(v)}
              sx={{ minHeight: '28px', minWidth: 60, fontSize: '0.75rem', borderRadius: '6px' }}
            >
              {pageSizeOptions.map(n => <Option key={n} value={n}>{n}</Option>)}
            </Select>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-end' }}>
          <IconButton size="sm" variant="plain" color="neutral"
            disabled={currentPage <= 1} onClick={() => setPage(1)}
            sx={{ borderRadius: '6px' }}>
            <ChevronsLeft size={14} />
          </IconButton>
          <IconButton size="sm" variant="plain" color="neutral"
            disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
            sx={{ borderRadius: '6px' }}>
            <ChevronLeft size={14} />
          </IconButton>
          <Typography level="body-xs" sx={{ px: 1.25, fontWeight: 600, color: 'text.secondary' }}>
            Page {currentPage} of {totalPages}
          </Typography>
          <IconButton size="sm" variant="plain" color="neutral"
            disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            sx={{ borderRadius: '6px' }}>
            <ChevronRight size={14} />
          </IconButton>
          <IconButton size="sm" variant="plain" color="neutral"
            disabled={currentPage >= totalPages} onClick={() => setPage(totalPages)}
            sx={{ borderRadius: '6px' }}>
            <ChevronsRight size={14} />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}
