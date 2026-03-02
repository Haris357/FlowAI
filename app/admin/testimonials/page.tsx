'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Button, Input, Textarea,
  IconButton, Chip, Modal, ModalDialog, ModalClose, FormControl,
  FormLabel, Select, Option, Switch, Divider, Skeleton,
} from '@mui/joy';
import { Plus, Star, Trash2, Edit3, GripVertical, Save, X } from 'lucide-react';
import {
  getTestimonials, addTestimonial, updateTestimonial, deleteTestimonial,
} from '@/services/testimonials';
import type { Testimonial, TestimonialInput } from '@/types/testimonial';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';
import toast from 'react-hot-toast';

const emptyForm: TestimonialInput = {
  name: '',
  role: '',
  company: '',
  content: '',
  rating: 5,
  imageUrl: '',
  featured: true,
  order: 0,
};

export default function TestimonialsAdmin() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TestimonialInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadTestimonials = async () => {
    try {
      const data = await getTestimonials();
      setTestimonials(data);
    } catch {
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTestimonials(); }, []);

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, order: testimonials.length });
    setModalOpen(true);
  };

  const handleOpenEdit = (t: Testimonial) => {
    setEditId(t.id);
    setForm({
      name: t.name,
      role: t.role,
      company: t.company,
      content: t.content,
      rating: t.rating,
      imageUrl: t.imageUrl || '',
      featured: t.featured,
      order: t.order,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.content) {
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
      loadTestimonials();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTestimonial(id);
      setTestimonials(prev => prev.filter(t => t.id !== id));
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

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography level="h3" fontWeight={700}>Testimonials</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              Manage customer testimonials shown on the landing page.
            </Typography>
          </Box>
          <Button
            startDecorator={<Plus size={16} />}
            onClick={handleOpenCreate}
            sx={{
              background: 'linear-gradient(135deg, var(--joy-palette-primary-500) 0%, var(--joy-palette-primary-600) 100%)',
            }}
          >
            Add Testimonial
          </Button>
        </Stack>

        {/* List */}
        {loading ? (
          <Stack spacing={2}>
            {[1, 2, 3].map(i => (
              <Card key={i} variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" width="70%" />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : testimonials.length === 0 ? (
          <Card sx={{ ...adminCard as Record<string, unknown> }}>
            <CardContent sx={{ p: 6, textAlign: 'center' }}>
              <Star size={40} style={{ color: 'var(--joy-palette-neutral-300)', margin: '0 auto 12px' }} />
              <Typography level="title-md" fontWeight={600} sx={{ mb: 0.5 }}>No testimonials yet</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 2 }}>
                Add your first customer testimonial to display on the landing page.
              </Typography>
              <Button size="sm" startDecorator={<Plus size={14} />} onClick={handleOpenCreate}>
                Add Testimonial
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {testimonials.map(t => (
              <Card key={t.id} sx={{
                ...adminCard as Record<string, unknown>,
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: 'primary.300' },
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    {/* Avatar */}
                    <Box sx={{
                      width: 40, height: 40, borderRadius: '50%',
                      bgcolor: 'primary.softBg',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '14px', color: 'primary.600', flexShrink: 0,
                    }}>
                      {t.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography level="body-sm" fontWeight={600}>{t.name}</Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                          {t.role}{t.company ? ` at ${t.company}` : ''}
                        </Typography>
                        {t.featured && <Chip size="sm" variant="soft" color="success" sx={{ fontSize: '10px' }}>Featured</Chip>}
                      </Stack>
                      <Typography level="body-sm" sx={{ color: 'text.secondary', fontStyle: 'italic' }} noWrap>
                        &ldquo;{t.content}&rdquo;
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} size={12} fill={i < t.rating ? 'var(--joy-palette-warning-400)' : 'none'} stroke={i < t.rating ? 'var(--joy-palette-warning-400)' : 'var(--joy-palette-neutral-300)'} />
                        ))}
                      </Stack>
                    </Box>

                    {/* Actions */}
                    <Stack direction="row" spacing={0.5}>
                      <Switch
                        size="sm"
                        checked={t.featured}
                        onChange={() => handleToggleFeatured(t)}
                        sx={{ mr: 1 }}
                      />
                      <IconButton size="sm" variant="plain" onClick={() => handleOpenEdit(t)}>
                        <Edit3 size={16} />
                      </IconButton>
                      <IconButton size="sm" variant="plain" color="danger" onClick={() => setDeleteConfirm(t.id)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalDialog sx={{ maxWidth: 500, width: '100%' }}>
          <ModalClose />
          <Typography level="title-lg" fontWeight={700}>
            {editId ? 'Edit Testimonial' : 'Add Testimonial'}
          </Typography>
          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <FormControl sx={{ flex: 1 }}>
                <FormLabel>Name *</FormLabel>
                <Input
                  size="sm"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </FormControl>
              <FormControl sx={{ flex: 1 }}>
                <FormLabel>Role</FormLabel>
                <Input
                  size="sm"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  placeholder="CEO"
                />
              </FormControl>
            </Stack>

            <FormControl>
              <FormLabel>Company</FormLabel>
              <Input
                size="sm"
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="Acme Inc"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Testimonial *</FormLabel>
              <Textarea
                minRows={3}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="What the customer said about your product..."
              />
            </FormControl>

            <Stack direction="row" spacing={2}>
              <FormControl sx={{ flex: 1 }}>
                <FormLabel>Rating</FormLabel>
                <Select
                  size="sm"
                  value={form.rating}
                  onChange={(_, val) => val !== null && setForm(f => ({ ...f, rating: val as number }))}
                >
                  {[5, 4, 3, 2, 1].map(r => (
                    <Option key={r} value={r}>{r} Star{r !== 1 ? 's' : ''}</Option>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ flex: 1 }}>
                <FormLabel>Order</FormLabel>
                <Input
                  size="sm"
                  type="number"
                  value={form.order}
                  onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                />
              </FormControl>
            </Stack>

            <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between' }}>
              <Box>
                <FormLabel>Featured</FormLabel>
                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Show on landing page</Typography>
              </Box>
              <Switch
                checked={form.featured}
                onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
              />
            </FormControl>

            <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button variant="plain" color="neutral" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                startDecorator={<Save size={14} />}
                loading={saving}
                onClick={handleSave}
              >
                {editId ? 'Update' : 'Create'}
              </Button>
            </Stack>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <ModalDialog variant="outlined" sx={{ maxWidth: 360 }}>
          <Typography level="title-md" fontWeight={700}>Delete Testimonial?</Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary', my: 1 }}>
            This action cannot be undone. The testimonial will be permanently removed.
          </Typography>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button variant="plain" color="neutral" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button color="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Delete
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Box>
  );
}
