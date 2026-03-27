'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Button, Skeleton, Modal, ModalDialog, ModalClose,
} from '@mui/joy';
import { Flag, CheckCircle, Eye, Inbox, ExternalLink, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug / Error',
  ui_issue: 'UI / Display Issue',
  feature_request: 'Feature Request',
  other: 'Other',
};

const CATEGORY_COLORS: Record<string, 'danger' | 'warning' | 'primary' | 'neutral'> = {
  bug: 'danger',
  ui_issue: 'warning',
  feature_request: 'primary',
  other: 'neutral',
};

const STATUS_COLORS: Record<string, 'warning' | 'primary' | 'success'> = {
  new: 'warning',
  reviewed: 'primary',
  resolved: 'success',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [screenshotModal, setScreenshotModal] = useState<string | null>(null);

  useEffect(() => {
    adminFetch('/api/admin/reports')
      .then(res => res.json())
      .then(d => setReports(d.reports || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  const formatDate = (ts: any) => {
    if (!ts) return '-';
    const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={3}>
        <Box>
          <Typography level="h3" fontWeight={700}>Bug Reports</Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            User-submitted issue reports with page screenshots.
          </Typography>
        </Box>

        {loading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3].map(i => (
              <Card key={i} variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={2}>
                    <Skeleton variant="rectangular" width={120} height={80} sx={{ borderRadius: 'sm', flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" width="80%" sx={{ mt: 0.5 }} />
                      <Skeleton variant="text" width={140} sx={{ mt: 0.5 }} />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : reports.length === 0 ? (
          <Card sx={{ ...liquidGlassSubtle as Record<string, unknown> }}>
            <CardContent sx={{ py: 6, textAlign: 'center' }}>
              <Inbox size={36} style={{ color: 'var(--joy-palette-neutral-400)', margin: '0 auto 8px' }} />
              <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>No reports yet.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {reports.map(report => (
              <Card key={report.id} sx={{
                ...adminCard as Record<string, unknown>,
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: 'neutral.400' },
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    {/* Screenshot thumbnail + actions */}
                    {report.screenshotUrl ? (
                      <Box sx={{ flexShrink: 0, width: { xs: '100%', sm: 140 } }}>
                        <Box
                          onClick={() => setScreenshotModal(report.screenshotUrl)}
                          sx={{
                            width: '100%',
                            height: 88,
                            borderRadius: 'sm',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: '1px solid',
                            borderColor: 'neutral.200',
                            position: 'relative',
                            '&:hover .overlay': { opacity: 1 },
                          }}
                        >
                          <img
                            src={report.screenshotUrl}
                            alt="Screenshot"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                          />
                          <Box className="overlay" sx={{
                            position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.45)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: 0, transition: 'opacity 0.15s',
                          }}>
                            <Eye size={18} color="white" />
                          </Box>
                        </Box>
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.75 }}>
                          <Button
                            size="sm" variant="outlined" color="neutral"
                            startDecorator={<Eye size={11} />}
                            component="a"
                            href={report.screenshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ flex: 1, fontSize: '10px', py: 0.4 }}
                          >
                            Preview
                          </Button>
                          <Button
                            size="sm" variant="outlined" color="neutral"
                            startDecorator={<Download size={11} />}
                            component="a"
                            href={report.screenshotUrl}
                            download={`report-${report.id}.png`}
                            sx={{ flex: 1, fontSize: '10px', py: 0.4 }}
                          >
                            Download
                          </Button>
                        </Stack>
                      </Box>
                    ) : (
                      <Box sx={{
                        width: { xs: '100%', sm: 140 }, height: 88, flexShrink: 0,
                        borderRadius: 'sm', bgcolor: 'background.level2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid', borderColor: 'neutral.200',
                      }}>
                        <Flag size={20} style={{ color: 'var(--joy-palette-neutral-400)' }} />
                      </Box>
                    )}

                    {/* Details */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip size="sm" variant="soft" color={CATEGORY_COLORS[report.category] || 'neutral'} sx={{ fontSize: '10px' }}>
                          {CATEGORY_LABELS[report.category] || report.category}
                        </Chip>
                        <Chip size="sm" variant="soft" color={STATUS_COLORS[report.status] || 'neutral'} sx={{ fontSize: '10px' }}>
                          {report.status}
                        </Chip>
                      </Stack>

                      <Typography level="body-sm" sx={{ color: 'text.primary', mb: 0.5 }}>
                        {report.description}
                      </Typography>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                          {report.userEmail} &bull; {formatDate(report.createdAt)}
                        </Typography>
                        {report.pageUrl && (
                          <Typography
                            level="body-xs"
                            component="a"
                            href={report.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: 'primary.500', display: 'flex', alignItems: 'center', gap: 0.25, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                          >
                            <ExternalLink size={10} /> View page
                          </Typography>
                        )}
                      </Stack>
                    </Box>

                    {/* Actions */}
                    <Stack spacing={1} alignItems="flex-end" sx={{ flexShrink: 0 }}>
                      {report.status === 'new' && (
                        <Button
                          size="sm" variant="soft" color="primary"
                          startDecorator={<CheckCircle size={12} />}
                          onClick={() => handleUpdateStatus(report.id, 'reviewed')}
                          loading={updating === report.id}
                          sx={{ fontSize: '11px' }}
                        >
                          Mark Reviewed
                        </Button>
                      )}
                      {report.status === 'reviewed' && (
                        <Button
                          size="sm" variant="soft" color="success"
                          startDecorator={<CheckCircle size={12} />}
                          onClick={() => handleUpdateStatus(report.id, 'resolved')}
                          loading={updating === report.id}
                          sx={{ fontSize: '11px' }}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Screenshot full-size modal */}
      <Modal open={!!screenshotModal} onClose={() => setScreenshotModal(null)}>
        <ModalDialog sx={{ maxWidth: '90vw', maxHeight: '90vh', p: 1, borderRadius: 'lg', overflow: 'hidden' }}>
          <ModalClose />
          {screenshotModal && (
            <img
              src={screenshotModal}
              alt="Full screenshot"
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', display: 'block' }}
            />
          )}
        </ModalDialog>
      </Modal>
    </Box>
  );
}
