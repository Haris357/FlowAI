'use client';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Chip,
  Table,
  Stack,
  IconButton,
  Input,
  Modal,
  ModalDialog,
  Sheet,
  Skeleton,
} from '@mui/joy';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';
import { getAllPosts, deletePost } from '@/services/blog';
import type { BlogPost } from '@/types/blog';

function formatDate(ts: any): string {
  if (!ts) return '-';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminBlogsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = () => {
    setLoading(true);
    getAllPosts()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!postToDelete) return;
    setDeleting(true);
    try {
      await deletePost(postToDelete.id);
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      setDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 'md',
                  bgcolor: 'primary.softBg',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FileText size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
              </Box>
              <Box>
                <Typography level="h3" fontWeight={700}>
                  Blog Posts
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                  Manage your blog content
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Button
            startDecorator={<Plus size={16} />}
            onClick={() => router.push('/admin/blogs/new')}
          >
            New Post
          </Button>
        </Stack>

        {/* Search */}
        <Input
          placeholder="Search posts by title..."
          startDecorator={<Search size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ maxWidth: 400 }}
        />

        {/* Table */}
        <Card sx={{ ...adminCard as Record<string, unknown>, overflow: 'hidden' }}>
          <Sheet sx={{ overflow: 'auto' }}>
            <Table
              sx={{
                '& thead th': { py: 1.5, fontSize: '0.75rem' },
                '& tbody td': { py: 1.5 },
              }}
            >
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Title</th>
                  <th style={{ width: '12%' }}>Status</th>
                  <th style={{ width: '14%' }}>Category</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Views</th>
                  <th style={{ width: '14%' }}>Date</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td><Skeleton variant="text" width="80%" /></td>
                        <td><Skeleton variant="text" width={60} /></td>
                        <td><Skeleton variant="text" width={60} /></td>
                        <td><Skeleton variant="text" width={30} sx={{ mx: 'auto' }} /></td>
                        <td><Skeleton variant="text" width={80} /></td>
                        <td><Skeleton variant="text" width={60} sx={{ mx: 'auto' }} /></td>
                      </tr>
                    ))
                  : filteredPosts.length === 0
                  ? (
                    <tr>
                      <td colSpan={6}>
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                          <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                            {searchQuery ? 'No posts match your search.' : 'No blog posts yet.'}
                          </Typography>
                        </Box>
                      </td>
                    </tr>
                  )
                  : filteredPosts.map((post) => (
                      <tr key={post.id}>
                        <td>
                          <Stack spacing={0.25}>
                            <Typography level="body-sm" fontWeight={600} noWrap>
                              {post.title}
                            </Typography>
                            <Typography
                              level="body-xs"
                              sx={{ color: 'text.tertiary' }}
                              noWrap
                            >
                              /{post.slug}
                            </Typography>
                          </Stack>
                        </td>
                        <td>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={post.published ? 'success' : 'neutral'}
                          >
                            {post.published ? 'Published' : 'Draft'}
                          </Chip>
                        </td>
                        <td>
                          <Chip size="sm" variant="outlined">
                            {post.category}
                          </Chip>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Typography level="body-sm">
                            {post.views.toLocaleString()}
                          </Typography>
                        </td>
                        <td>
                          <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                            {formatDate(post.publishedAt || post.createdAt)}
                          </Typography>
                        </td>
                        <td>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            {post.published && (
                              <IconButton
                                size="sm"
                                variant="plain"
                                color="neutral"
                                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                              >
                                <ExternalLink size={14} />
                              </IconButton>
                            )}
                            <IconButton
                              size="sm"
                              variant="plain"
                              color="primary"
                              onClick={() =>
                                router.push(`/admin/blogs/${post.id}/edit`)
                              }
                            >
                              <Edit2 size={14} />
                            </IconButton>
                            <IconButton
                              size="sm"
                              variant="plain"
                              color="danger"
                              onClick={() => {
                                setPostToDelete(post);
                                setDeleteModalOpen(true);
                              }}
                            >
                              <Trash2 size={14} />
                            </IconButton>
                          </Stack>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </Table>
          </Sheet>
        </Card>

        {/* Stats */}
        {!loading && (
          <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'right' }}>
            {posts.length} total post{posts.length !== 1 ? 's' : ''} &middot;{' '}
            {posts.filter((p) => p.published).length} published &middot;{' '}
            {posts.filter((p) => !p.published).length} draft{posts.filter((p) => !p.published).length !== 1 ? 's' : ''}
          </Typography>
        )}
      </Stack>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalDialog variant="outlined" role="alertdialog" sx={{ maxWidth: { xs: '95vw', sm: 400 }, width: '100%' }}>
          <Typography level="title-lg" fontWeight={700}>
            Delete Post
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 1 }}>
            Are you sure you want to delete &quot;{postToDelete?.title}&quot;? This action
            cannot be undone.
          </Typography>
          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="plain"
              color="neutral"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="danger"
              onClick={handleDelete}
              loading={deleting}
              startDecorator={<Trash2 size={14} />}
            >
              Delete
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Box>
  );
}
