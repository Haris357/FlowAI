'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Button, Input, Textarea,
  IconButton, Chip, Modal, ModalDialog, ModalClose, FormControl,
  FormLabel, Select, Option, Switch, Divider, Skeleton,
  Sheet, Table, Tooltip,
} from '@mui/joy';
import {
  Plus, Star, Trash2, Edit3, Save, Search, Filter, RefreshCw, Inbox,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getTestimonials, addTestimonial, updateTestimonial, deleteTestimonial,
} from '@/services/testimonials';
import type { Testimonial, TestimonialInput } from '@/types/testimonial';
import { adminCard } from '@/lib/admin-theme';
import PaginationFooter from '@/components/admin/PaginationFooter';

const emptyForm: TestimonialInput = {
  name: '', role: '', company: '', content: '', rating: 5,
  imageUrl: '', featured: true, order: 0,
};

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'not_featured'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TestimonialInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Testimonial | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setTestimonials(await getTestimonials());
    } catch {
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, featuredFilter, pageSize]);

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, order: testimonials.length });
    setModalOpen(true);
  };

  const handleOpenEdit = (t: Testimonial) => {
    setEditId(t.id);
    setForm({
      name: t.name, role: t.role, company: t.company,
      content: t.content, rating: t.rating, imageUrl: t.imageUrl || '',
      featured: t.featured, order: t.order,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) {
      toast.error('Name and content are required');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateTestimonial(editId, form);
        toast.success('Testimonial updated');
      } else {
        await addTestimonial(form);
        toast.success('Testimonial added');
      }
      setModalOpen(false);
      load();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: Testimonial) => {
    try {
      await deleteTestimonial(t.id);
      setTestimonials(prev => prev.filter(item => item.id !== t.id));
      toast.success('Testimonial deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleToggleFeatured = async (t: Testimonial) => {
    try {
      await updateTestimonial(t.id, { featured: !t.featured });
      setTestimonials(prev => prev.map(item =>
        item.id === t.id ? { ...item, featured: !item.featured } : item
      ));
    } catch {
      toast.error('Failed to update');
    }
  };

  const filtered = useMemo(() => {
    return testimonials.filter(t => {
      if (featuredFilter === 'featured' && !t.featured) return false;
      if (featuredFilter === 'not_featured' && t.featured) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !t.name.toLowerCase().includes(q) &&
          !(t.company || '').toLowerCase().includes(q) &&
          !t.content.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [testimonials, search, featuredFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filtered.length);
  const pageRows = filtered.slice(startIdx, endIdx);

  const featuredCount = testimonials.filter(t => t.featured).length;

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              width: 36, height: 36, borderRadius: 'md', bgcolor: 'warning.softBg',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Star size={16} style={{ color: 'var(--joy-palette-warning-500)' }} />
            </Box>
            <Box>
              <Typography level="h3" fontWeight={700}>Testimonials</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                {featuredCount} featured · {testimonials.length} total
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="sm" variant="outlined" color="neutral"
              startDecorator={<RefreshCw size={14} />}
              onClick={load} loading={loading}
              sx={{ borderRadius: '10px' }}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              startDecorator={<Plus size={14} />}
              onClick={handleOpenCreate}
              sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px', fontWeight: 700 }}
            >
              Add testimonial
            </Button>
          </Stack>
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
                placeholder="Search name, company, content…"
                startDecorator={<Search size={14} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 180, borderRadius: '8px' }}
              />
              <Select
                size="sm" value={featuredFilter}
                onChange={(_, v) => v && setFeaturedFilter(v as any)}
                sx={{ minWidth: 160, borderRadius: '8px' }}
              >
                <Option value="all">All testimonials</Option>
                <Option value="featured">Featured only</Option>
                <Option value="not_featured">Not featured</Option>
              </Select>
              {(search || featuredFilter !== 'all') && (
                <Chip
                  size="sm" variant="soft" color="neutral"
                  sx={{ cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => { setSearch(''); setFeaturedFilter('all'); }}
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
                  <th style={{ width: '14rem' }}>Person</th>
                  <th>Content</th>
                  <th style={{ width: '7rem' }}>Rating</th>
                  <th style={{ width: '6rem' }}>Order</th>
                  <th style={{ width: '7rem' }}>Featured</th>
                  <th style={{ width: '7rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Skeleton variant="circular" width={32} height={32} />
                          <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="60%" />
                            <Skeleton variant="text" width="40%" />
                          </Box>
                        </Stack>
                      </td>
                      <td><Skeleton variant="text" width="85%" /></td>
                      <td><Skeleton variant="text" width={60} /></td>
                      <td><Skeleton variant="text" width={30} /></td>
                      <td><Skeleton variant="rectangular" width={40} height={20} sx={{ borderRadius: 10 }} /></td>
                      <td><Skeleton variant="text" width={60} sx={{ ml: 'auto' }} /></td>
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <Box sx={{ py: 6, textAlign: 'center', color: 'text.tertiary' }}>
                        <Inbox size={28} style={{ opacity: 0.5, marginBottom: 6 }} />
                        <Typography level="body-sm">
                          {search || featuredFilter !== 'all' ? 'No testimonials match your filters.' : 'No testimonials yet.'}
                        </Typography>
                      </Box>
                    </td>
                  </tr>
                ) : (
                  pageRows.map(t => (
                    <tr key={t.id}>
                      <td>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{
                            width: 32, height: 32, borderRadius: '50%',
                            bgcolor: 'primary.softBg', color: 'primary.600',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.78rem', flexShrink: 0,
                          }}>
                            {t.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography level="body-sm" fontWeight={600} noWrap>{t.name}</Typography>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }} noWrap>
                              {t.role}{t.company ? ` · ${t.company}` : ''}
                            </Typography>
                          </Box>
                        </Stack>
                      </td>
                      <td>
                        <Typography level="body-sm" sx={{
                          color: 'text.secondary', fontStyle: 'italic',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        }}>
                          "{t.content}"
                        </Typography>
                      </td>
                      <td>
                        <Stack direction="row" spacing={0.25}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={11}
                              fill={i < t.rating ? 'var(--joy-palette-warning-400)' : 'none'}
                              color={i < t.rating ? 'var(--joy-palette-warning-400)' : 'var(--joy-palette-neutral-300)'}
                            />
                          ))}
                        </Stack>
                      </td>
                      <td>
                        <Typography level="body-sm" fontWeight={500}>{t.order}</Typography>
                      </td>
                      <td>
                        <Switch
                          size="sm"
                          checked={t.featured}
                          onChange={() => handleToggleFeatured(t)}
                        />
                      </td>
                      <td>
                        <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                          <Tooltip title="Edit">
                            <IconButton size="sm" variant="plain" color="primary" onClick={() => handleOpenEdit(t)}>
                              <Edit3 size={14} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="sm" variant="plain" color="danger" onClick={() => setDeleteConfirm(t)}>
                              <Trash2 size={14} />
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

      {/* Create / Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 560 }, width: '100%', borderRadius: '16px', maxHeight: '90vh', overflow: 'auto' }}>
          <ModalClose />
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px', bgcolor: '#FFF0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Star size={18} color="#D97757" />
            </Box>
            <Box>
              <Typography level="title-lg" fontWeight={700}>
                {editId ? 'Edit testimonial' : 'Add testimonial'}
              </Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                Featured testimonials appear on the landing page.
              </Typography>
            </Box>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl required sx={{ flex: 1 }}>
                <FormLabel>Name</FormLabel>
                <Input
                  size="sm" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Alex Johnson"
                  sx={{ borderRadius: '8px' }}
                />
              </FormControl>
              <FormControl sx={{ flex: 1 }}>
                <FormLabel>Role</FormLabel>
                <Input
                  size="sm" value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  placeholder="e.g. Founder"
                  sx={{ borderRadius: '8px' }}
                />
              </FormControl>
            </Stack>
            <FormControl>
              <FormLabel>Company</FormLabel>
              <Input
                size="sm" value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="e.g. Acme Co."
                sx={{ borderRadius: '8px' }}
              />
            </FormControl>
            <FormControl required>
              <FormLabel>Testimonial content</FormLabel>
              <Textarea
                minRows={3} maxRows={8}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="What the customer said…"
                sx={{ borderRadius: '8px' }}
              />
            </FormControl>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl sx={{ flex: 1 }}>
                <FormLabel>Rating</FormLabel>
                <Select
                  size="sm" value={form.rating}
                  onChange={(_, v) => v !== null && setForm(f => ({ ...f, rating: v as number }))}
                  sx={{ borderRadius: '8px' }}
                >
                  {[5, 4, 3, 2, 1].map(r => (
                    <Option key={r} value={r}>{r} star{r !== 1 ? 's' : ''}</Option>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ flex: 1 }}>
                <FormLabel>Order</FormLabel>
                <Input
                  size="sm" type="number" value={form.order}
                  onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                  sx={{ borderRadius: '8px' }}
                />
              </FormControl>
            </Stack>
            <Box sx={{
              p: 2, borderRadius: '10px',
              border: '1px solid', borderColor: 'divider',
              bgcolor: 'background.level1',
            }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography level="body-sm" fontWeight={600}>Featured on landing</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                    Only featured testimonials appear publicly.
                  </Typography>
                </Box>
                <Switch
                  checked={form.featured}
                  onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                />
              </Stack>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="plain" color="neutral" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave} loading={saving}
              startDecorator={<Save size={14} />}
              sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px' }}
            >
              {editId ? 'Save changes' : 'Create'}
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal open onClose={() => setDeleteConfirm(null)}>
          <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 400 }, width: '100%', borderRadius: '16px' }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box sx={{
                width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                bgcolor: 'danger.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertCircle size={18} style={{ color: 'var(--joy-palette-danger-500)' }} />
              </Box>
              <Box>
                <Typography level="title-md" fontWeight={700}>Delete testimonial?</Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Remove testimonial by <strong>{deleteConfirm.name}</strong>? This cannot be undone.
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2.5 }}>
              <Button variant="plain" color="neutral" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button
                color="danger" startDecorator={<Trash2 size={14} />}
                onClick={() => handleDelete(deleteConfirm)}
                sx={{ borderRadius: '10px' }}
              >
                Delete
              </Button>
            </Stack>
          </ModalDialog>
        </Modal>
      )}
    </Box>
  );
}
