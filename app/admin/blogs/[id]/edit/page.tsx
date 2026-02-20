'use client';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Input,
  Textarea,
  Select,
  Option,
  Switch,
  Stack,
  FormControl,
  FormLabel,
  Divider,
  Chip,
  Alert,
  Modal,
  ModalDialog,
  Skeleton,
} from '@mui/joy';
import {
  ArrowLeft,
  Save,
  Eye,
  Image,
  Tag,
  CheckCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getPostById, updatePost, deletePost } from '@/services/blog';
import { serverTimestamp } from 'firebase/firestore';
import type { BlogPost } from '@/types/blog';

const CATEGORIES = ['News', 'Updates', 'Guides', 'Tips', 'Engineering'];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function estimateReadTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function AdminEditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('News');
  const [tagsInput, setTagsInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [published, setPublished] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [originalPost, setOriginalPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    getPostById(postId)
      .then((post) => {
        if (!post) {
          setToast({ type: 'error', message: 'Post not found.' });
          setLoading(false);
          return;
        }
        setOriginalPost(post);
        setTitle(post.title);
        setSlug(post.slug);
        setExcerpt(post.excerpt);
        setContent(post.content);
        setCategory(post.category);
        setTagsInput(post.tags.join(', '));
        setCoverImage(post.coverImage || '');
        setPublished(post.published);
        setFeatured(post.featured);
      })
      .catch((err) => {
        console.error('Error loading post:', err);
        setToast({ type: 'error', message: 'Failed to load post.' });
      })
      .finally(() => setLoading(false));
  }, [postId]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Only auto-generate slug if it was previously in sync or empty
    if (!slug || slug === generateSlug(originalPost?.title || '')) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setToast({ type: 'error', message: 'Title is required.' });
      return;
    }
    if (!slug.trim()) {
      setToast({ type: 'error', message: 'Slug is required.' });
      return;
    }
    if (!excerpt.trim()) {
      setToast({ type: 'error', message: 'Excerpt is required.' });
      return;
    }
    if (!content.trim()) {
      setToast({ type: 'error', message: 'Content is required.' });
      return;
    }

    setSaving(true);
    setToast(null);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const updateData: any = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        coverImage: coverImage.trim() || null,
        category,
        tags,
        published,
        featured,
        readTime: estimateReadTime(content),
      };

      // If transitioning from draft to published, set publishedAt
      if (published && !originalPost?.published) {
        updateData.publishedAt = serverTimestamp();
      }
      // If unpublishing, clear publishedAt
      if (!published && originalPost?.published) {
        updateData.publishedAt = null;
      }

      await updatePost(postId, updateData);

      setToast({ type: 'success', message: 'Blog post updated successfully!' });

      // Update local original post reference
      setOriginalPost((prev) =>
        prev
          ? {
              ...prev,
              ...updateData,
            }
          : prev
      );
    } catch (error) {
      console.error('Error updating post:', error);
      setToast({ type: 'error', message: 'Failed to update post. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePost(postId);
      router.push('/admin/blogs');
    } catch (error) {
      console.error('Error deleting post:', error);
      setToast({ type: 'error', message: 'Failed to delete post.' });
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 'sm' }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width={200} sx={{ fontSize: '1.5rem' }} />
              <Skeleton variant="text" width={300} />
            </Box>
          </Stack>
          <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 'sm' }} />
          <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 'sm' }} />
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 'sm' }} />
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 'sm' }} />
        </Stack>
      </Box>
    );
  }

  if (!originalPost) {
    return (
      <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        <Stack spacing={3} alignItems="center" sx={{ py: 8 }}>
          <Typography level="h3" fontWeight={700}>
            Post Not Found
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            The blog post you are trying to edit does not exist.
          </Typography>
          <Button
            variant="outlined"
            startDecorator={<ArrowLeft size={14} />}
            onClick={() => router.push('/admin/blogs')}
          >
            Back to Blog Posts
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <Button
            variant="plain"
            color="neutral"
            startDecorator={<ArrowLeft size={16} />}
            onClick={() => router.push('/admin/blogs')}
          >
            Back
          </Button>
          <Box sx={{ flex: 1 }}>
            <Typography level="h3" fontWeight={700}>
              Edit Post
            </Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              Editing: {originalPost.title}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              color="danger"
              startDecorator={<Trash2 size={14} />}
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete
            </Button>
            <Button
              variant="outlined"
              color="neutral"
              startDecorator={<Eye size={14} />}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Editor' : 'Preview'}
            </Button>
            <Button
              startDecorator={<Save size={14} />}
              onClick={handleSave}
              loading={saving}
            >
              Save Changes
            </Button>
          </Stack>
        </Stack>

        {/* Toast */}
        {toast && (
          <Alert
            variant="soft"
            color={toast.type === 'success' ? 'success' : 'danger'}
            startDecorator={
              toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />
            }
            endDecorator={
              <Button
                variant="plain"
                color={toast.type === 'success' ? 'success' : 'danger'}
                size="sm"
                onClick={() => setToast(null)}
              >
                Dismiss
              </Button>
            }
          >
            {toast.message}
          </Alert>
        )}

        {/* Content */}
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          {/* Editor Panel */}
          <Box sx={{ flex: showPreview ? 0.5 : 1, display: showPreview ? { xs: 'none', lg: 'block' } : 'block' }}>
            <Stack spacing={3}>
              {/* Title */}
              <FormControl>
                <FormLabel>Title</FormLabel>
                <Input
                  placeholder="Enter post title..."
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  sx={{ fontSize: '1.1rem', fontWeight: 600 }}
                />
              </FormControl>

              {/* Slug */}
              <FormControl>
                <FormLabel>Slug</FormLabel>
                <Input
                  placeholder="post-url-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  startDecorator={
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                      /blog/
                    </Typography>
                  }
                />
              </FormControl>

              {/* Excerpt */}
              <FormControl>
                <FormLabel>Excerpt</FormLabel>
                <Textarea
                  placeholder="Brief summary of the post..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  minRows={2}
                  maxRows={4}
                />
              </FormControl>

              {/* Category & Tags */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl sx={{ flex: 1 }}>
                  <FormLabel>Category</FormLabel>
                  <Select
                    value={category}
                    onChange={(_, val) => val && setCategory(val)}
                  >
                    {CATEGORIES.map((cat) => (
                      <Option key={cat} value={cat}>
                        {cat}
                      </Option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ flex: 1 }}>
                  <FormLabel>Tags (comma separated)</FormLabel>
                  <Input
                    placeholder="ai, accounting, tips"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    startDecorator={<Tag size={14} />}
                  />
                </FormControl>
              </Stack>

              {/* Cover Image URL */}
              <FormControl>
                <FormLabel>Cover Image URL</FormLabel>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  startDecorator={<Image size={14} />}
                />
              </FormControl>

              {/* Content */}
              <FormControl>
                <FormLabel>Content (HTML)</FormLabel>
                <Textarea
                  placeholder="<h2>Introduction</h2><p>Write your content here...</p>"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  minRows={16}
                  maxRows={40}
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                  }}
                />
              </FormControl>

              {/* Settings */}
              <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                  <Typography level="title-sm" fontWeight={700} sx={{ mb: 2 }}>
                    Settings
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography level="body-sm" fontWeight={600}>
                          Published
                        </Typography>
                        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                          Make this post visible to the public
                        </Typography>
                      </Box>
                      <Switch
                        checked={published}
                        onChange={(e) => setPublished(e.target.checked)}
                        color={published ? 'success' : 'neutral'}
                      />
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography level="body-sm" fontWeight={600}>
                          Featured
                        </Typography>
                        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                          Highlight this post on the blog
                        </Typography>
                      </Box>
                      <Switch
                        checked={featured}
                        onChange={(e) => setFeatured(e.target.checked)}
                        color={featured ? 'primary' : 'neutral'}
                      />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              {/* Info */}
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Chip size="sm" variant="soft" color="neutral">
                  Read time: ~{estimateReadTime(content)} min
                </Chip>
                <Chip size="sm" variant="soft" color="neutral">
                  Words: {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length}
                </Chip>
                <Chip size="sm" variant="soft" color="neutral">
                  Views: {originalPost.views.toLocaleString()}
                </Chip>
                {published ? (
                  <Chip size="sm" variant="soft" color="success">
                    Published
                  </Chip>
                ) : (
                  <Chip size="sm" variant="soft" color="warning">
                    Draft
                  </Chip>
                )}
              </Stack>
            </Stack>
          </Box>

          {/* Preview Panel */}
          {showPreview && (
            <Box sx={{ flex: 1 }}>
              <Card variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
                <Box
                  sx={{
                    px: 3,
                    py: 1.5,
                    bgcolor: 'background.level1',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography level="body-xs" fontWeight={600} sx={{ color: 'text.secondary' }}>
                    Preview
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  {/* Preview Title */}
                  {category && (
                    <Chip size="sm" variant="soft" color="primary" sx={{ mb: 1.5 }}>
                      {category}
                    </Chip>
                  )}
                  <Typography level="h2" fontWeight={700} sx={{ mb: 1.5 }}>
                    {title || 'Untitled Post'}
                  </Typography>

                  {/* Preview Meta */}
                  <Stack direction="row" spacing={2} sx={{ mb: 2, color: 'text.secondary' }}>
                    <Typography level="body-xs">
                      {user?.displayName || user?.email || 'Admin'}
                    </Typography>
                    <Typography level="body-xs">
                      ~{estimateReadTime(content)} min read
                    </Typography>
                  </Stack>

                  {/* Preview Excerpt */}
                  {excerpt && (
                    <Typography
                      level="body-md"
                      sx={{ color: 'text.secondary', mb: 3, fontStyle: 'italic' }}
                    >
                      {excerpt}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Preview Content */}
                  {content ? (
                    <Box
                      sx={{
                        '& h1': { fontSize: '1.75rem', fontWeight: 700, mb: 1, mt: 2 },
                        '& h2': { fontSize: '1.4rem', fontWeight: 700, mb: 1, mt: 2 },
                        '& h3': { fontSize: '1.15rem', fontWeight: 700, mb: 0.5, mt: 1.5 },
                        '& p': { mb: 1.5, lineHeight: 1.7, color: 'var(--joy-palette-text-primary)' },
                        '& ul, & ol': { pl: 3, mb: 1.5 },
                        '& li': { mb: 0.5, lineHeight: 1.7 },
                        '& blockquote': {
                          borderLeft: '3px solid var(--joy-palette-primary-500)',
                          pl: 2,
                          ml: 0,
                          fontStyle: 'italic',
                          color: 'var(--joy-palette-text-secondary)',
                        },
                        '& code': {
                          bgcolor: 'var(--joy-palette-background-level1)',
                          px: 0.5,
                          py: 0.25,
                          borderRadius: 'sm',
                          fontSize: '0.85em',
                        },
                        '& pre': {
                          bgcolor: 'var(--joy-palette-background-level1)',
                          p: 2,
                          borderRadius: 'md',
                          overflow: 'auto',
                          fontSize: '0.85rem',
                        },
                        '& img': { maxWidth: '100%', borderRadius: 'md' },
                        '& a': { color: 'var(--joy-palette-primary-500)', textDecoration: 'underline' },
                      }}
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  ) : (
                    <Typography
                      level="body-sm"
                      sx={{ color: 'text.tertiary', fontStyle: 'italic', textAlign: 'center', py: 6 }}
                    >
                      Start writing content to see a preview...
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </Stack>
      </Stack>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalDialog variant="outlined" role="alertdialog" sx={{ maxWidth: 400 }}>
          <Typography level="title-lg" fontWeight={700}>
            Delete Post
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 1 }}>
            Are you sure you want to delete &quot;{originalPost.title}&quot;? This action cannot
            be undone.
          </Typography>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
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
