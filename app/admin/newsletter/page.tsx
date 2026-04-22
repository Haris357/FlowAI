'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Button, Input, Textarea,
  Select, Option, Modal, ModalDialog, ModalClose, Chip, Skeleton,
  FormControl, FormLabel, Divider, CircularProgress,
  Sheet, Table, IconButton, Tooltip,
} from '@mui/joy';
import {
  Newspaper, Sparkles, Send, Eye, Users, CheckCircle, Plus, Trash2,
  Zap, Search, Filter, RefreshCw, Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';
import PaginationFooter from '@/components/admin/PaginationFooter';

interface NewsletterSection {
  heading: string;
  body: string;
}

interface Newsletter {
  id: string;
  title: string;
  sections: NewsletterSection[];
  footerNote: string;
  recipients: string;
  sent: number;
  failed: number;
  total: number;
  createdAt: any;
  automated?: boolean;
}

const RECIPIENT_LABELS: Record<string, string> = {
  all: 'All Users', free: 'Free Users', pro: 'Pro Users', max: 'Max Users',
};

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts._seconds ? new Date(ts._seconds * 1000) : ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminNewsletterPage() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [history, setHistory] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [detailModal, setDetailModal] = useState<Newsletter | null>(null);

  const loadHistory = () => {
    setLoading(true);
    adminFetch('/api/admin/newsletter')
      .then(r => r.json())
      .then(d => setHistory(d.newsletters || []))
      .catch(() => toast.error('Failed to load newsletters'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { setPage(1); }, [search, recipientFilter, pageSize]);

  const filtered = useMemo(() => {
    return history.filter(n => {
      if (recipientFilter && n.recipients !== recipientFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!n.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [history, search, recipientFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filtered.length);
  const pageRows = filtered.slice(startIdx, endIdx);

  const totalSent = history.reduce((s, n) => s + (n.sent || 0), 0);

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Newspaper size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Box>
              <Typography level="h3" fontWeight={700}>Newsletter</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                {history.length} sent · {totalSent.toLocaleString()} total delivered
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="sm" variant="outlined" color="neutral"
              startDecorator={<RefreshCw size={14} />}
              onClick={loadHistory} loading={loading}
              sx={{ borderRadius: '10px' }}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              startDecorator={<Plus size={14} />}
              onClick={() => setComposeOpen(true)}
              sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px', fontWeight: 700 }}
            >
              New newsletter
            </Button>
          </Stack>
        </Stack>

        {/* Auto-newsletter banner */}
        <Card sx={{ ...liquidGlassSubtle as Record<string, unknown>, borderLeft: '3px solid', borderLeftColor: 'success.400' }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Zap size={16} style={{ color: 'var(--joy-palette-success-500)', flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography level="body-sm" fontWeight={600}>
                  Auto-newsletter: <Chip size="sm" variant="soft" color="success" sx={{ fontSize: '0.65rem', ml: 0.5 }}>Active</Chip>
                </Typography>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }}>
                  AI-generated newsletters are sent automatically every Monday and Thursday at 9:00 AM ET to opted-in users.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

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
                placeholder="Search title…"
                startDecorator={<Search size={14} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 180, borderRadius: '8px' }}
              />
              <Select
                size="sm" placeholder="All Recipients" value={recipientFilter || ''}
                onChange={(_, v) => setRecipientFilter(v || '')}
                sx={{ minWidth: 150, borderRadius: '8px' }}
              >
                <Option value="">All Recipients</Option>
                {Object.entries(RECIPIENT_LABELS).map(([k, v]) => (
                  <Option key={k} value={k}>{v}</Option>
                ))}
              </Select>
              {(search || recipientFilter) && (
                <Chip
                  size="sm" variant="soft" color="neutral"
                  sx={{ cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => { setSearch(''); setRecipientFilter(''); }}
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
            <Table hoverRow stickyHeader sx={{
              '& thead th': {
                py: 1.25, fontSize: '0.7rem', fontWeight: 700,
                color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em',
                bgcolor: 'background.surface',
              },
              '& tbody td': { py: 1.5, verticalAlign: 'middle' },
              minWidth: 900,
            }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th style={{ width: '6rem', textAlign: 'center' }}>Sections</th>
                  <th style={{ width: '9rem' }}>Recipients</th>
                  <th style={{ width: '6rem', textAlign: 'center' }}>Sent</th>
                  <th style={{ width: '6rem', textAlign: 'center' }}>Failed</th>
                  <th style={{ width: '7rem' }}>Date</th>
                  <th style={{ width: '5rem', textAlign: 'right' }}>View</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td><Skeleton variant="text" width="80%" /></td>
                      <td><Skeleton variant="text" width={30} sx={{ mx: 'auto' }} /></td>
                      <td><Skeleton variant="rectangular" width={70} height={18} sx={{ borderRadius: 10 }} /></td>
                      <td><Skeleton variant="text" width={40} sx={{ mx: 'auto' }} /></td>
                      <td><Skeleton variant="text" width={30} sx={{ mx: 'auto' }} /></td>
                      <td><Skeleton variant="text" width={70} /></td>
                      <td><Skeleton variant="text" width={30} sx={{ ml: 'auto' }} /></td>
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <Box sx={{ py: 6, textAlign: 'center', color: 'text.tertiary' }}>
                        <Inbox size={28} style={{ opacity: 0.5, marginBottom: 6 }} />
                        <Typography level="body-sm">
                          {search || recipientFilter ? 'No newsletters match your filters.' : 'No newsletters sent yet.'}
                        </Typography>
                      </Box>
                    </td>
                  </tr>
                ) : (
                  pageRows.map(n => (
                    <tr key={n.id}>
                      <td>
                        <Box onClick={() => setDetailModal(n)} sx={{ cursor: 'pointer', minWidth: 0 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Typography level="body-sm" fontWeight={600} noWrap>{n.title}</Typography>
                            {n.automated && (
                              <Chip size="sm" variant="soft" color="warning" startDecorator={<Zap size={10} />} sx={{ fontSize: '0.62rem', '--Chip-minHeight': '16px' }}>
                                Auto
                              </Chip>
                            )}
                          </Stack>
                        </Box>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Typography level="body-sm">{n.sections?.length || 0}</Typography>
                      </td>
                      <td>
                        <Chip size="sm" variant="outlined" color="neutral" sx={{ fontSize: '0.68rem' }}>
                          {RECIPIENT_LABELS[n.recipients] || n.recipients}
                        </Chip>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Typography level="body-sm" fontWeight={600} sx={{ color: 'success.600' }}>
                          {n.sent?.toLocaleString() || 0}
                        </Typography>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {n.failed > 0 ? (
                          <Typography level="body-sm" fontWeight={600} sx={{ color: 'danger.600' }}>
                            {n.failed}
                          </Typography>
                        ) : (
                          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>—</Typography>
                        )}
                      </td>
                      <td>
                        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                          {formatDate(n.createdAt)}
                        </Typography>
                      </td>
                      <td>
                        <Stack direction="row" justifyContent="flex-end">
                          <Tooltip title="View newsletter">
                            <IconButton size="sm" variant="plain" color="neutral" onClick={() => setDetailModal(n)}>
                              <Eye size={14} />
                            </IconButton>
                          </Tooltip>
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

      {composeOpen && (
        <ComposeNewsletterModal
          onClose={() => setComposeOpen(false)}
          onSent={() => { setComposeOpen(false); loadHistory(); }}
        />
      )}

      {detailModal && (
        <Modal open onClose={() => setDetailModal(null)}>
          <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 640 }, width: '100%', borderRadius: '16px', maxHeight: '90vh', overflow: 'auto' }}>
            <ModalClose />
            <Typography level="title-lg" fontWeight={700}>{detailModal.title}</Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
              <Chip size="sm" variant="outlined">{RECIPIENT_LABELS[detailModal.recipients] || detailModal.recipients}</Chip>
              <Chip size="sm" variant="soft" color="success">{detailModal.sent?.toLocaleString() || 0} sent</Chip>
              {detailModal.failed > 0 && (
                <Chip size="sm" variant="soft" color="danger">{detailModal.failed} failed</Chip>
              )}
              {detailModal.automated && (
                <Chip size="sm" variant="soft" color="warning" startDecorator={<Zap size={10} />}>Auto</Chip>
              )}
            </Stack>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.75 }}>
              {formatDate(detailModal.createdAt)}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              {detailModal.sections?.map((s, i) => (
                <Box key={i} sx={{
                  p: 2, borderRadius: '10px',
                  border: '1px solid', borderColor: 'divider',
                  bgcolor: 'background.level1',
                }}>
                  <Typography level="title-sm" fontWeight={700} sx={{ mb: 0.75 }}>{s.heading}</Typography>
                  <Typography level="body-sm" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>{s.body}</Typography>
                </Box>
              ))}
              {detailModal.footerNote && (
                <Box sx={{
                  p: 1.5, borderRadius: '8px',
                  bgcolor: 'warning.softBg', border: '1px solid', borderColor: 'warning.outlinedBorder',
                }}>
                  <Typography level="body-xs" sx={{ color: 'warning.700', fontStyle: 'italic' }}>
                    {detailModal.footerNote}
                  </Typography>
                </Box>
              )}
            </Stack>
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="plain" color="neutral" onClick={() => setDetailModal(null)}>Close</Button>
            </Stack>
          </ModalDialog>
        </Modal>
      )}
    </Box>
  );
}

// ============================================================
// Compose newsletter modal (AI generate + edit + send)
// ============================================================

function ComposeNewsletterModal({
  onClose, onSent,
}: { onClose: () => void; onSent: () => void }) {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional yet friendly');
  const [sectionCount, setSectionCount] = useState(3);
  const [generating, setGenerating] = useState(false);

  const [title, setTitle] = useState('');
  const [sections, setSections] = useState<NewsletterSection[]>([]);
  const [footerNote, setFooterNote] = useState('');
  const [recipients, setRecipients] = useState<'all' | 'free' | 'pro' | 'max'>('all');
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await adminFetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          topic: topic || undefined,
          tone, sections: sectionCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setTitle(data.generated.title);
      setSections(data.generated.sections);
      setFooterNote(data.generated.footerNote || '');
      toast.success('Newsletter generated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    setConfirmOpen(false);
    setSending(true);
    try {
      const res = await adminFetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          title, sections, footerNote, recipients,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      toast.success(`Newsletter sent to ${data.sent?.toLocaleString() || 0} user(s)`);
      onSent();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const updateSection = (idx: number, field: 'heading' | 'body', value: string) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };
  const addSection = () => setSections(prev => [...prev, { heading: '', body: '' }]);
  const removeSection = (idx: number) => setSections(prev => prev.filter((_, i) => i !== idx));

  const canSend = title.trim() && sections.length > 0;

  return (
    <>
      <Modal open onClose={onClose}>
        <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 720 }, width: '100%', borderRadius: '16px', maxHeight: '92vh', overflow: 'auto' }}>
          <ModalClose />
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px', bgcolor: '#FFF0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Newspaper size={18} color="#D97757" />
            </Box>
            <Box>
              <Typography level="title-lg" fontWeight={700}>New newsletter</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                Generate content with AI, edit it, then send to your users.
              </Typography>
            </Box>
          </Stack>
          <Divider sx={{ my: 2 }} />

          {/* AI generation */}
          <Card sx={{
            mb: 2, p: 0, borderRadius: '12px',
            bgcolor: 'warning.softBg', border: '1px solid', borderColor: 'warning.outlinedBorder',
          }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <Sparkles size={14} style={{ color: 'var(--joy-palette-warning-700)' }} />
                <Typography level="body-sm" fontWeight={700} sx={{ color: 'warning.700' }}>
                  AI Generation
                </Typography>
              </Stack>
              <Stack spacing={1.5}>
                <FormControl>
                  <FormLabel>Topic / Theme</FormLabel>
                  <Textarea
                    minRows={2} maxRows={3}
                    placeholder="e.g., new invoice templates, tax season tips…"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    sx={{ borderRadius: '8px' }}
                  />
                </FormControl>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Tone</FormLabel>
                    <Select size="sm" value={tone} onChange={(_, v) => v && setTone(v)} sx={{ borderRadius: '8px' }}>
                      <Option value="professional yet friendly">Professional & Friendly</Option>
                      <Option value="casual and upbeat">Casual & Upbeat</Option>
                      <Option value="formal and informative">Formal & Informative</Option>
                      <Option value="inspiring and motivational">Inspiring & Motivational</Option>
                    </Select>
                  </FormControl>
                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Sections</FormLabel>
                    <Select size="sm" value={sectionCount} onChange={(_, v) => v && setSectionCount(v)} sx={{ borderRadius: '8px' }}>
                      <Option value={2}>2 sections</Option>
                      <Option value={3}>3 sections</Option>
                      <Option value={4}>4 sections</Option>
                      <Option value={5}>5 sections</Option>
                    </Select>
                  </FormControl>
                </Stack>
                <Button
                  size="sm" color="warning"
                  startDecorator={generating ? <CircularProgress size="sm" /> : <Sparkles size={14} />}
                  onClick={handleGenerate}
                  loading={generating}
                  sx={{ alignSelf: 'flex-start', borderRadius: '10px' }}
                >
                  {generating ? 'Generating…' : 'Generate with AI'}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Editor */}
          <Stack spacing={2}>
            <FormControl>
              <FormLabel>Title</FormLabel>
              <Input
                size="sm" value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Newsletter title"
                sx={{ borderRadius: '8px' }}
              />
            </FormControl>

            {sections.length === 0 ? (
              <Box sx={{
                p: 3, borderRadius: '10px', border: '1px dashed', borderColor: 'divider',
                textAlign: 'center', color: 'text.tertiary',
              }}>
                <Typography level="body-sm">No sections yet. Generate with AI or add one manually.</Typography>
              </Box>
            ) : (
              sections.map((section, idx) => (
                <Box key={idx} sx={{
                  p: 2, borderRadius: '10px',
                  border: '1px solid', borderColor: 'divider',
                  bgcolor: 'background.level1',
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography level="body-xs" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.tertiary' }}>
                      Section {idx + 1}
                    </Typography>
                    <IconButton size="sm" variant="plain" color="danger" onClick={() => removeSection(idx)}>
                      <Trash2 size={13} />
                    </IconButton>
                  </Stack>
                  <Stack spacing={1}>
                    <Input
                      size="sm" value={section.heading}
                      onChange={e => updateSection(idx, 'heading', e.target.value)}
                      placeholder="Section heading"
                      sx={{ borderRadius: '8px' }}
                    />
                    <Textarea
                      minRows={3} maxRows={6}
                      value={section.body}
                      onChange={e => updateSection(idx, 'body', e.target.value)}
                      placeholder="Section content…"
                      sx={{ borderRadius: '8px' }}
                    />
                  </Stack>
                </Box>
              ))
            )}

            <Button
              size="sm" variant="soft" color="neutral"
              startDecorator={<Plus size={14} />}
              onClick={addSection}
              sx={{ alignSelf: 'flex-start', borderRadius: '10px' }}
            >
              Add section
            </Button>

            <FormControl>
              <FormLabel>Footer note (optional)</FormLabel>
              <Input
                size="sm" value={footerNote}
                onChange={e => setFooterNote(e.target.value)}
                placeholder="A closing tip or call-to-action…"
                sx={{ borderRadius: '8px' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Recipients</FormLabel>
              <Select
                size="sm" value={recipients}
                onChange={(_, v) => v && setRecipients(v as any)}
                startDecorator={<Users size={14} />}
                sx={{ borderRadius: '8px' }}
              >
                {Object.entries(RECIPIENT_LABELS).map(([k, v]) => (
                  <Option key={k} value={k}>{v}</Option>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="plain" color="neutral" onClick={onClose} disabled={sending}>
              Cancel
            </Button>
            <Button
              startDecorator={<Send size={14} />}
              loading={sending}
              disabled={!canSend}
              onClick={() => setConfirmOpen(true)}
              sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px', fontWeight: 700 }}
            >
              Send newsletter
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Confirm send */}
      {confirmOpen && (
        <Modal open onClose={() => setConfirmOpen(false)}>
          <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 440 }, width: '100%', borderRadius: '16px' }}>
            <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center', py: 1 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: '50%', bgcolor: 'primary.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Send size={20} style={{ color: 'var(--joy-palette-primary-500)' }} />
              </Box>
              <Typography level="title-lg" fontWeight={700}>Send newsletter?</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                This will send <strong>"{title}"</strong> to <strong>{RECIPIENT_LABELS[recipients]}</strong>.
                This cannot be undone.
              </Typography>
            </Stack>
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} sx={{ mt: 2.5 }}>
              <Button variant="plain" color="neutral" onClick={() => setConfirmOpen(false)} sx={{ flex: 1 }}>
                Cancel
              </Button>
              <Button
                startDecorator={<Send size={14} />}
                onClick={handleSend}
                sx={{ flex: 1, bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px' }}
              >
                Send now
              </Button>
            </Stack>
          </ModalDialog>
        </Modal>
      )}
    </>
  );
}
