'use client';
import { useState } from 'react';
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
} from '@mui/joy';
import {
  ArrowLeft,
  Save,
  Eye,
  FileText,
  Image,
  Tag,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';
import { useAuth } from '@/contexts/AuthContext';
import { createPost } from '@/services/blog';
import { adminFetch } from '@/lib/admin-fetch';
import { serverTimestamp } from 'firebase/firestore';

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

export default function AdminNewBlogPage() {
  const router = useRouter();
  const { user } = useAuth();

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
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('professional yet approachable');
  const [aiLength, setAiLength] = useState('medium');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) {
      setToast({ type: 'error', message: 'Enter a topic for AI generation.' });
      return;
    }
    setAiGenerating(true);
    setToast(null);
    try {
      const res = await adminFetch('/api/admin/blogs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, category, tone: aiTone, length: aiLength }),
      });
      const data = await res.json();
      if (data.error) {
        setToast({ type: 'error', message: data.error });
        return;
      }
      const g = data.generated;
      if (g.title) { setTitle(g.title); setSlug(generateSlug(g.title)); }
      if (g.excerpt) setExcerpt(g.excerpt);
      if (g.content) setContent(g.content);
      if (g.tags?.length) setTagsInput(g.tags.join(', '));
      setToast({ type: 'success', message: 'AI content generated! Review and edit as needed.' });
      setShowAiPanel(false);
    } catch {
      setToast({ type: 'error', message: 'AI generation failed. Please try again.' });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSlug(generateSlug(value));
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

      await createPost({
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        coverImage: coverImage.trim() || '',
        author: {
          name: user?.displayName || user?.email || 'Admin',
          email: user?.email || '',
          avatar: user?.photoURL || '',
        },
        category,
        tags,
        published,
        featured,
        readTime: estimateReadTime(content),
        publishedAt: published ? (serverTimestamp() as any) : undefined,
      });

      setToast({ type: 'success', message: 'Blog post created successfully!' });
      setTimeout(() => {
        router.push('/admin/blogs');
      }, 1200);
    } catch (error) {
      console.error('Error creating post:', error);
      setToast({ type: 'error', message: 'Failed to create post. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" spacing={2} alignItems="center">
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
              New Blog Post
            </Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              Create a new article for the Flowbooks blog
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="soft"
              color="primary"
              startDecorator={<Sparkles size={14} />}
              onClick={() => setShowAiPanel(!showAiPanel)}
            >
              {showAiPanel ? 'Hide AI' : 'Generate with AI'}
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
              Save Post
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

        {/* AI Generation Panel */}
        {showAiPanel && (
          <Card sx={{ ...adminCard as Record<string, unknown>, borderColor: 'primary.200', bgcolor: 'primary.50' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Sparkles size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                  <Typography level="title-sm" fontWeight={700}>
                    Generate with AI
                  </Typography>
                </Stack>

                <FormControl>
                  <FormLabel>Topic / Title Idea</FormLabel>
                  <Input
                    placeholder="e.g. How AI is transforming small business accounting"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                  />
                </FormControl>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Tone</FormLabel>
                    <Select
                      value={aiTone}
                      onChange={(_, val) => val && setAiTone(val)}
                    >
                      <Option value="professional yet approachable">Professional & Approachable</Option>
                      <Option value="casual and friendly">Casual & Friendly</Option>
                      <Option value="formal and authoritative">Formal & Authoritative</Option>
                      <Option value="educational and helpful">Educational & Helpful</Option>
                    </Select>
                  </FormControl>
                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Length</FormLabel>
                    <Select
                      value={aiLength}
                      onChange={(_, val) => val && setAiLength(val)}
                    >
                      <Option value="short">Short (~500 words)</Option>
                      <Option value="medium">Medium (~1000 words)</Option>
                      <Option value="long">Long (~1500 words)</Option>
                    </Select>
                  </FormControl>
                </Stack>

                <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                  <Button
                    variant="plain"
                    color="neutral"
                    size="sm"
                    onClick={() => setShowAiPanel(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    size="sm"
                    startDecorator={<Sparkles size={14} />}
                    onClick={handleAiGenerate}
                    loading={aiGenerating}
                  >
                    Generate Content
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
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
              <Card sx={{ ...adminCard as Record<string, unknown> }}>
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
                {published ? (
                  <Chip size="sm" variant="soft" color="success">
                    Will be published
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
              <Card sx={{ ...adminCard as Record<string, unknown>, p: 0, overflow: 'hidden' }}>
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
    </Box>
  );
}
