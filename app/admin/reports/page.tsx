'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Button, Skeleton,
  Modal, ModalDialog, ModalClose, Sheet, Table, IconButton, Tooltip,
  Select, Option, Input, Divider,
} from '@mui/joy';
import {
  Flag, CheckCircle, Inbox, ExternalLink, Download, Eye, Search, Filter,
  RefreshCw, ImageIcon, MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard } from '@/lib/admin-theme';
import PaginationFooter from '@/components/admin/PaginationFooter';

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug / Error',
  ui_issue: 'UI / Display',
  feature_request: 'Feature Request',
  other: 'Other',
};

type ChipColor = 'danger' | 'warning' | 'primary' | 'neutral' | 'success';
const CATEGORY_COLORS: Record<string, ChipColor> = {
  bug: 'danger', ui_issue: 'warning', feature_request: 'primary', other: 'neutral',
};
const STATUS_COLORS: Record<string, ChipColor> = {
  new: 'warning', reviewed: 'primary', resolved: 'success',
};

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts._seconds ? new Date(ts._seconds * 1000) : ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface BugReport {
  id: string;
  category: string;
  description: string;
  status: string;
  userEmail?: string;
  pageUrl?: string;
  screenshotUrl?: string;
  createdAt: any;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [screenshotModal, setScreenshotModal] = useState<BugReport | null>(null);
  const [detailModal, setDetailModal] = useState<BugReport | null>(null);

  const loadReports = () => {
    setLoading(true);
    adminFetch('/api/admin/reports')
      .then(res => res.json())
      .then(d => setReports(d.reports || []))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReports(); }, []);
  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter, pageSize]);

  const handleUpdateStatus = async (reportId: string, status: string) => {
    setUpdating(reportId);
    try {
      const res = await adminFetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status }),
      });
      if (!res.ok) throw new Error();
      toast.success('Status updated');
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
    } catch {
      toast.error('Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = useMemo(() => {
    return reports.filter(r => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (categoryFilter && r.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !(r.description || '').toLowerCase().includes(q) &&
          !(r.userEmail || '').toLowerCase().includes(q) &&
          !(r.category || '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [reports, search, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filtered.length);
  const pageRows = filtered.slice(startIdx, endIdx);

  const newCount = reports.filter(r => r.status === 'new').length;
  const reviewedCount = reports.filter(r => r.status === 'reviewed').length;

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              width: 36, height: 36, borderRadius: 'md', bgcolor: 'danger.softBg',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Flag size={16} style={{ color: 'var(--joy-palette-danger-500)' }} />
            </Box>
            <Box>
              <Typography level="h3" fontWeight={700}>Bug Reports</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                {newCount} new · {reviewedCount} reviewed · {reports.length} total
              </Typography>
            </Box>
          </Stack>
          <Button
            size="sm" variant="outlined" color="neutral"
            startDecorator={<RefreshCw size={14} />}
            onClick={loadReports} loading={loading}
            sx={{ borderRadius: '10px' }}
          >
            Refresh
          </Button>
        </Stack>

        {/* Filter bar */}
        <Card sx={{ ...adminCard as Record<string, unknown>, p: 0 }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} alignItems={{ md: 'center' }}>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.tertiary' }}>
                <Filter size={14} />
                <Typography level="body-xs" fontWeight={600}>Filters</Typography>
              </Stack>

              <Input
                size="sm"
                placeholder="Search description, user, category…"
                startDecorator={<Search size={14} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 180, borderRadius: '8px' }}
              />

              <Select
                size="sm"
                placeholder="All Statuses"
                value={statusFilter || ''}
                onChange={(_, v) => setStatusFilter(v || '')}
                sx={{ minWidth: 140, borderRadius: '8px' }}
              >
                <Option value="">All Statuses</Option>
                <Option value="new">New</Option>
                <Option value="reviewed">Reviewed</Option>
                <Option value="resolved">Resolved</Option>
              </Select>

              <Select
                size="sm"
                placeholder="All Categories"
                value={categoryFilter || ''}
                onChange={(_, v) => setCategoryFilter(v || '')}
                sx={{ minWidth: 160, borderRadius: '8px' }}
              >
                <Option value="">All Categories</Option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <Option key={k} value={k}>{v}</Option>
                ))}
              </Select>

              {(search || statusFilter || categoryFilter) && (
                <Chip
                  size="sm" variant="soft" color="neutral"
                  sx={{ cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); }}
                >
                  Clear
                </Chip>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Table */}
        <Card sx={{ ...adminCard as Record<string, unknown>, p: 0, overflow: 'hidden' }}>
          <Sheet sx={{ overflow: 'auto' }}>
            <Table
              hoverRow stickyHeader
              sx={{
                '& thead th': {
                  py: 1.25, fontSize: '0.7rem', fontWeight: 700,
                  color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em',
                  bgcolor: 'background.surface',
                },
                '& tbody td': { py: 1.5, verticalAlign: 'middle' },
                minWidth: 800,
              }}
            >
              <thead>
                <tr>
                  <th style={{ width: '5rem' }}>Preview</th>
                  <th style={{ width: '9rem' }}>Category</th>
                  <th>Description</th>
                  <th style={{ width: '13rem' }}>User · Date</th>
                  <th style={{ width: '7rem' }}>Status</th>
                  <th style={{ width: '10rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td><Skeleton variant="rectangular" width={48} height={34} sx={{ borderRadius: 'sm' }} /></td>
                      <td><Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: 10 }} /></td>
                      <td><Skeleton variant="text" width="80%" /></td>
                      <td><Skeleton variant="text" width="70%" /></td>
                      <td><Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 10 }} /></td>
                      <td><Skeleton variant="text" width={100} sx={{ ml: 'auto' }} /></td>
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <Box sx={{ py: 6, textAlign: 'center', color: 'text.tertiary' }}>
                        <Inbox size={28} style={{ opacity: 0.5, marginBottom: 6 }} />
                        <Typography level="body-sm">
                          {search || statusFilter || categoryFilter ? 'No reports match your filters.' : 'No reports yet.'}
                        </Typography>
                      </Box>
                    </td>
                  </tr>
                ) : (
                  pageRows.map(r => (
                    <tr key={r.id}>
                      <td>
                        {r.screenshotUrl ? (
                          <Box
                            onClick={() => setScreenshotModal(r)}
                            sx={{
                              width: 48, height: 34, borderRadius: '6px', overflow: 'hidden',
                              cursor: 'pointer', border: '1px solid', borderColor: 'divider',
                              position: 'relative', flexShrink: 0,
                              '&:hover .o': { opacity: 1 },
                            }}
                          >
                            <img
                              src={r.screenshotUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                            <Box className="o" sx={{
                              position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.45)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: 0, transition: 'opacity 0.15s',
                            }}>
                              <Eye size={14} color="white" />
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{
                            width: 48, height: 34, borderRadius: '6px',
                            border: '1px solid', borderColor: 'divider',
                            bgcolor: 'background.level1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <ImageIcon size={14} style={{ color: 'var(--joy-palette-neutral-400)' }} />
                          </Box>
                        )}
                      </td>
                      <td>
                        <Chip
                          size="sm" variant="soft"
                          color={CATEGORY_COLORS[r.category] || 'neutral'}
                          sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                        >
                          {CATEGORY_LABELS[r.category] || r.category}
                        </Chip>
                      </td>
                      <td>
                        <Typography
                          level="body-sm"
                          onClick={() => setDetailModal(r)}
                          sx={{
                            fontWeight: 500, cursor: 'pointer',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                            '&:hover': { color: 'primary.600' },
                          }}
                        >
                          {r.description}
                        </Typography>
                      </td>
                      <td>
                        <Typography level="body-xs" fontWeight={500} noWrap>{r.userEmail || '—'}</Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{formatDate(r.createdAt)}</Typography>
                      </td>
                      <td>
                        <Chip
                          size="sm" variant="soft"
                          color={STATUS_COLORS[r.status] || 'neutral'}
                          sx={{ fontSize: '0.68rem', fontWeight: 600 }}
                        >
                          {r.status}
                        </Chip>
                      </td>
                      <td>
                        <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                          <Tooltip title="View details">
                            <IconButton
                              size="sm" variant="plain" color="neutral"
                              onClick={() => setDetailModal(r)}
                            >
                              <MessageSquare size={14} />
                            </IconButton>
                          </Tooltip>
                          {r.pageUrl && (
                            <Tooltip title="Open page">
                              <IconButton
                                size="sm" variant="plain" color="neutral"
                                component="a" href={r.pageUrl} target="_blank" rel="noreferrer"
                              >
                                <ExternalLink size={14} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {r.status === 'new' && (
                            <Tooltip title="Mark reviewed">
                              <IconButton
                                size="sm" variant="plain" color="primary"
                                onClick={() => handleUpdateStatus(r.id, 'reviewed')}
                                loading={updating === r.id}
                              >
                                <CheckCircle size={14} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {r.status === 'reviewed' && (
                            <Tooltip title="Mark resolved">
                              <IconButton
                                size="sm" variant="plain" color="success"
                                onClick={() => handleUpdateStatus(r.id, 'resolved')}
                                loading={updating === r.id}
                              >
                                <CheckCircle size={14} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Sheet>

          {!loading && filtered.length > 0 && (
            <PaginationFooter
              startIdx={startIdx} endIdx={endIdx} total={filtered.length}
              pageSize={pageSize} setPageSize={setPageSize}
              currentPage={currentPage} totalPages={totalPages} setPage={setPage}
            />
          )}
        </Card>
      </Stack>

      {/* Screenshot modal */}
      <Modal open={!!screenshotModal} onClose={() => setScreenshotModal(null)}>
        <ModalDialog sx={{
          maxWidth: '92vw', maxHeight: '92vh', p: 1, overflow: 'hidden',
          borderRadius: '16px',
        }}>
          <ModalClose sx={{ zIndex: 2 }} />
          {screenshotModal?.screenshotUrl && (
            <img
              src={screenshotModal.screenshotUrl}
              alt="Screenshot"
              style={{ maxWidth: '100%', maxHeight: '82vh', objectFit: 'contain', display: 'block', borderRadius: '8px' }}
            />
          )}
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
            {screenshotModal?.screenshotUrl && (
              <Button
                size="sm" variant="outlined" color="neutral"
                component="a"
                href={screenshotModal.screenshotUrl}
                download={`report-${screenshotModal.id}.png`}
                startDecorator={<Download size={14} />}
                sx={{ borderRadius: '10px' }}
              >
                Download
              </Button>
            )}
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Detail modal */}
      {detailModal && (
        <Modal open onClose={() => setDetailModal(null)}>
          <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 560 }, width: '100%', borderRadius: '16px', maxHeight: '90vh', overflow: 'auto' }}>
            <ModalClose />
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box sx={{
                width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                bgcolor: `${CATEGORY_COLORS[detailModal.category] || 'neutral'}.softBg`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Flag size={18} style={{ color: `var(--joy-palette-${CATEGORY_COLORS[detailModal.category] || 'neutral'}-500)` }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography level="title-lg" fontWeight={700}>Bug report detail</Typography>
                <Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }}>
                  <Chip size="sm" variant="soft" color={CATEGORY_COLORS[detailModal.category] || 'neutral'}>
                    {CATEGORY_LABELS[detailModal.category] || detailModal.category}
                  </Chip>
                  <Chip size="sm" variant="soft" color={STATUS_COLORS[detailModal.status] || 'neutral'}>
                    {detailModal.status}
                  </Chip>
                </Stack>
              </Box>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              <Box>
                <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                  Description
                </Typography>
                <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap' }}>{detailModal.description}</Typography>
              </Box>
              <Box>
                <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                  Reporter
                </Typography>
                <Typography level="body-sm">{detailModal.userEmail || '—'}</Typography>
                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{formatDate(detailModal.createdAt)}</Typography>
              </Box>
              {detailModal.pageUrl && (
                <Box>
                  <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                    Page URL
                  </Typography>
                  <Typography
                    level="body-sm" component="a"
                    href={detailModal.pageUrl} target="_blank" rel="noreferrer"
                    sx={{ color: 'primary.600', textDecoration: 'none', wordBreak: 'break-all', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {detailModal.pageUrl}
                  </Typography>
                </Box>
              )}
              {detailModal.screenshotUrl && (
                <Box>
                  <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                    Screenshot
                  </Typography>
                  <Box
                    onClick={() => { setScreenshotModal(detailModal); setDetailModal(null); }}
                    sx={{
                      borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
                      border: '1px solid', borderColor: 'divider',
                    }}
                  >
                    <img src={detailModal.screenshotUrl} alt="" style={{ width: '100%', display: 'block' }} />
                  </Box>
                </Box>
              )}
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
              {detailModal.status === 'new' && (
                <Button
                  startDecorator={<CheckCircle size={14} />}
                  onClick={() => { handleUpdateStatus(detailModal.id, 'reviewed'); setDetailModal(null); }}
                  sx={{ borderRadius: '10px' }}
                >
                  Mark reviewed
                </Button>
              )}
              {detailModal.status === 'reviewed' && (
                <Button
                  startDecorator={<CheckCircle size={14} />}
                  color="success"
                  onClick={() => { handleUpdateStatus(detailModal.id, 'resolved'); setDetailModal(null); }}
                  sx={{ borderRadius: '10px' }}
                >
                  Mark resolved
                </Button>
              )}
              <Button variant="plain" color="neutral" onClick={() => setDetailModal(null)}>
                Close
              </Button>
            </Stack>
          </ModalDialog>
        </Modal>
      )}
    </Box>
  );
}
