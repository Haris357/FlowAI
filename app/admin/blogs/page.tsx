'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, Button, Chip, Table, Stack, IconButton,
  Input, Modal, ModalDialog, Sheet, Skeleton, Tooltip, Select, Option,
} from '@mui/joy';
import {
  Plus, Search, Edit2, Trash2, ExternalLink, FileText, Inbox,
  Filter, RefreshCw, AlertCircle, Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';
import { getAllPosts, deletePost } from '@/services/blog';
import type { BlogPost } from '@/types/blog';
import PaginationFooter from '@/components/admin/PaginationFooter';

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminBlogsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [deleteConfirm, setDeleteConfirm] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    getAllPosts()
      .then(setPosts)
      .catch(() => toast.error('Failed to load posts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, categoryFilter, statusFilter, pageSize]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deletePost(deleteConfirm.id);
      setPosts(prev => prev.filter(p => p.id !== deleteConfirm.id));
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter(p => {
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (statusFilter === 'published' && !p.published) return false;
      if (statusFilter === 'draft' && p.published) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !p.title.toLowerCase().includes(q) &&
          !(p.slug || '').toLowerCase().includes(q) &&
          !(p.excerpt || '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [posts, search, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filtered.length);
  const pageRows = filtered.slice(startIdx, endIdx);

  const publishedCount = posts.filter(p => p.published).length;
  const draftCount = posts.length - publishedCount;

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
              <FileText size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Box>
              <Typography level="h3" fontWeight={700}>Blog Posts</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                {publishedCount} published · {draftCount} draft · {posts.length} total
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
              onClick={() => router.push('/admin/blogs/new')}
              sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px', fontWeight: 700 }}
            >
              New post
            </Button>
          </Stack>
        </Stack>

        {/* Auto-blog schedule banner */}
        <Card sx={{ ...liquidGlassSubtle as Record<string, unknown>, borderLeft: '3px solid', borderLeftColor: 'warning.400' }}>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Zap size={16} style={{ color: 'var(--joy-palette-warning-500)', flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography level="body-sm" fontWeight={600}>
                  Auto-blog: <Chip size="sm" variant="soft" color="success" sx={{ fontSize: '0.65rem', ml: 0.5 }}>Active</Chip>
                </Typography>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }}>
                  AI-generated posts are published automatically every Tuesday and Friday at 10:00 AM ET, then emailed to opted-in users.
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>

        {/* Filter bar */}
        <Card sx={{ ...adminCard as Record<string, unknown>, p: 0 }}>
          <Box sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} alignItems={{ md: 'center' }}>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.tertiary' }}>
                <Filter size={14} />
                <Typography level="body-xs" fontWeight={600}>Filters</Typography>
              </Stack>
              <Input
                size="sm"
                placeholder="Search title, slug, excerpt…"
                startDecorator={<Search size={14} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 180, borderRadius: '8px' }}
              />
              <Select
                size="sm" placeholder="All Categories" value={categoryFilter || ''}
                onChange={(_, v) => setCategoryFilter(v || '')}
                sx={{ minWidth: 150, borderRadius: '8px' }}
              >
                <Option value="">All Categories</Option>
                {categories.map(c => <Option key={c} value={c}>{c}</Option>)}
              </Select>
              <Select
                size="sm" placeholder="All Statuses" value={statusFilter || ''}
                onChange={(_, v) => setStatusFilter(v || '')}
                sx={{ minWidth: 130, borderRadius: '8px' }}
              >
                <Option value="">All Statuses</Option>
                <Option value="published">Published</Option>
                <Option value="draft">Draft</Option>
              </Select>
              {(search || categoryFilter || statusFilter) && (
                <Chip
                  size="sm" variant="soft" color="neutral"
                  sx={{ cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => { setSearch(''); setCategoryFilter(''); setStatusFilter(''); }}
                >
                  Clear
                </Chip>
              )}
            </Stack>
          </Box>
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
                  <th style={{ width: '7rem' }}>Status</th>
                  <th style={{ width: '8rem' }}>Category</th>
                  <th style={{ width: '5rem', textAlign: 'center' }}>Views</th>
                  <th style={{ width: '7rem' }}>Updated</th>
                  <th style={{ width: '8rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td><Skeleton variant="text" width="85%" /></td>
                      <td><Skeleton variant="rectangular" width={60} height={18} sx={{ borderRadius: 10 }} /></td>
                      <td><Skeleton variant="rectangular" width={70} height={18} sx={{ borderRadius: 10 }} /></td>
                      <td><Skeleton variant="text" width={30} sx={{ mx: 'auto' }} /></td>
                      <td><Skeleton variant="text" width={70} /></td>
                      <td><Skeleton variant="text" width={70} sx={{ ml: 'auto' }} /></td>
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <Box sx={{ py: 6, textAlign: 'center', color: 'text.tertiary' }}>
                        <Inbox size={28} style={{ opacity: 0.5, marginBottom: 6 }} />
                        <Typography level="body-sm">
                          {search || categoryFilter || statusFilter ? 'No posts match your filters.' : 'No posts yet.'}
                        </Typography>
                      </Box>
                    </td>
                  </tr>
                ) : (
                  pageRows.map(post => (
                    <tr key={post.id}>
                      <td>
                        <Box
                          onClick={() => router.push(`/admin/blogs/${post.id}/edit`)}
                          sx={{ cursor: 'pointer', minWidth: 0 }}
                        >
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Typography level="body-sm" fontWeight={600} noWrap sx={{ '&:hover': { color: 'primary.600' } }}>
                              {post.title}
                            </Typography>
                            {(post as any).automated && (
                              <Chip
                                size="sm" variant="soft" color="warning"
                                startDecorator={<Zap size={10} />}
                                sx={{ fontSize: '0.6rem', fontWeight: 700, '--Chip-minHeight': '16px', px: 0.75 }}
                              >
                                Auto
                              </Chip>
                            )}
                          </Stack>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary' }} noWrap>
                            /{post.slug}
                          </Typography>
                        </Box>
                      </td>
                      <td>
                        <Chip
                          size="sm" variant="soft"
                          color={post.published ? 'success' : 'neutral'}
                          sx={{ fontSize: '0.68rem', fontWeight: 600 }}
                        >
                          {post.published ? 'Published' : 'Draft'}
                        </Chip>
                      </td>
                      <td>
                        {post.category ? (
                          <Chip size="sm" variant="outlined" color="neutral" sx={{ fontSize: '0.68rem' }}>
                            {post.category}
                          </Chip>
                        ) : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Typography level="body-sm" fontWeight={500}>
                          {(post.views || 0).toLocaleString()}
                        </Typography>
                      </td>
                      <td>
                        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                          {formatDate(post.publishedAt || post.updatedAt || post.createdAt)}
                        </Typography>
                      </td>
                      <td>
                        <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                          {post.published && (
                            <Tooltip title="View public">
                              <IconButton
                                size="sm" variant="plain" color="neutral"
                                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                              >
                                <ExternalLink size={14} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit">
                            <IconButton
                              size="sm" variant="plain" color="primary"
                              onClick={() => router.push(`/admin/blogs/${post.id}/edit`)}
                            >
                              <Edit2 size={14} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="sm" variant="plain" color="danger"
                              onClick={() => setDeleteConfirm(post)}
                            >
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

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal open onClose={() => setDeleteConfirm(null)}>
          <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 420 }, width: '100%', borderRadius: '16px' }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box sx={{
                width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                bgcolor: 'danger.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertCircle size={18} style={{ color: 'var(--joy-palette-danger-500)' }} />
              </Box>
              <Box>
                <Typography level="title-md" fontWeight={700}>Delete post?</Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Permanently delete <strong>{deleteConfirm.title}</strong>? This cannot be undone.
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2.5 }}>
              <Button variant="plain" color="neutral" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                color="danger" loading={deleting}
                startDecorator={<Trash2 size={14} />}
                onClick={handleDelete}
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
