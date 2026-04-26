'use client';

import { useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Input, IconButton, Button, Chip,
  Sheet, List, ListItem, ListItemButton, ListItemDecorator, ListItemContent,
  Card, CardContent, Tooltip,
} from '@mui/joy';
import {
  Search, Sun, Moon, ArrowRight, ExternalLink, MessageSquare, Sparkles,
  Rocket, FileText, Receipt, Landmark, DollarSign, BarChart3, MessageCircle,
  Settings, CreditCard, Building2, ChevronRight, BookOpen, GraduationCap,
  Lightbulb,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { FlowBooksLogoJoy } from '@/components/FlowBooksLogo';
import { DOC_CATEGORIES, DOC_ARTICLES, TUTORIAL_STEPS } from '@/lib/docs';

const ICON_MAP: Record<string, React.ElementType> = {
  Rocket, FileText, Receipt, Landmark, DollarSign, BarChart3,
  MessageCircle, Settings, CreditCard, Building2,
};

// We treat tutorials as one virtual category alongside the article categories.
const TUTORIAL_CATEGORY = { id: 'tutorials', label: 'Tutorials', icon: 'Sparkles' as const };

function getSupportUrl() {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_SUPPORT_URL || '/support';
  // If we're already on docs.flowbooksai.com, send people to support.flowbooksai.com.
  if (window.location.hostname.startsWith('docs.')) {
    const base = window.location.hostname.replace(/^docs\./, 'support.');
    return `${window.location.protocol}//${base}/`;
  }
  return process.env.NEXT_PUBLIC_SUPPORT_URL || '/support';
}

function getAppUrl() {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_APP_URL || 'https://flowbooksai.com';
  if (window.location.hostname.startsWith('docs.')) {
    const base = window.location.hostname.replace(/^docs\./, '');
    return `${window.location.protocol}//${base}/`;
  }
  return '/';
}

export default function DocsPage() {
  const { mode, toggleMode } = useTheme();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const isLight = mode === 'light';
  const q = search.trim().toLowerCase();

  const filteredArticles = useMemo(() => {
    if (!q) return DOC_ARTICLES;
    return DOC_ARTICLES.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      (a.steps?.some(s => s.toLowerCase().includes(q)) ?? false)
    );
  }, [q]);

  const filteredTutorials = useMemo(() => {
    if (!q) return TUTORIAL_STEPS;
    return TUTORIAL_STEPS.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      (t.features?.some(f => f.toLowerCase().includes(q)) ?? false)
    );
  }, [q]);

  // Per-category counts for the sidebar.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DOC_ARTICLES.forEach(a => { counts[a.category] = (counts[a.category] || 0) + 1; });
    counts[TUTORIAL_CATEGORY.id] = TUTORIAL_STEPS.length;
    return counts;
  }, []);

  const visibleCategories = activeCategory === 'all'
    ? [...DOC_CATEGORIES, TUTORIAL_CATEGORY]
    : activeCategory === TUTORIAL_CATEGORY.id
      ? [TUTORIAL_CATEGORY]
      : DOC_CATEGORIES.filter(c => c.id === activeCategory);

  const totalResults = filteredArticles.length + filteredTutorials.length;

  return (
    <Box sx={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      bgcolor: 'background.body',
    }}>
      {/* ── Top bar ── */}
      <Sheet
        variant="outlined"
        sx={{
          flexShrink: 0,
          px: { xs: 2, md: 3 },
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, md: 2 },
          borderTop: 'none', borderLeft: 'none', borderRight: 'none',
          bgcolor: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(26,25,21,0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexShrink: 0 }}>
          <Link href={getAppUrl()} style={{ textDecoration: 'none' }}>
            <FlowBooksLogoJoy iconSize={26} fontSize="1rem" />
          </Link>
          <Chip
            size="sm"
            variant="soft"
            color="primary"
            sx={{ fontSize: '0.65rem', fontWeight: 700, '--Chip-minHeight': '20px', display: { xs: 'none', sm: 'inline-flex' } }}
          >
            DOCS
          </Chip>
        </Stack>

        {/* Search — fills the middle */}
        <Box sx={{ flex: 1, minWidth: 0, maxWidth: 560, mx: 'auto' }}>
          <Input
            size="sm"
            placeholder="Search docs and tutorials…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startDecorator={<Search size={15} />}
            endDecorator={
              search ? (
                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                  {totalResults} {totalResults === 1 ? 'result' : 'results'}
                </Typography>
              ) : null
            }
            sx={{ borderRadius: '999px', width: '100%' }}
          />
        </Box>

        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
          <Tooltip title={isLight ? 'Dark mode' : 'Light mode'}>
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              onClick={toggleMode}
              sx={{ borderRadius: '10px' }}
            >
              {isLight ? <Moon size={16} /> : <Sun size={16} />}
            </IconButton>
          </Tooltip>
          <Button
            component="a"
            href={getSupportUrl()}
            size="sm"
            variant="plain"
            color="neutral"
            startDecorator={<MessageSquare size={14} />}
            sx={{ borderRadius: '10px', display: { xs: 'none', md: 'inline-flex' } }}
          >
            Support
          </Button>
          <Button
            component="a"
            href={getAppUrl()}
            size="sm"
            endDecorator={<ArrowRight size={14} />}
            sx={{
              borderRadius: '999px',
              fontWeight: 600,
              bgcolor: '#D97757',
              '&:hover': { bgcolor: '#C4694D' },
            }}
          >
            Open app
          </Button>
        </Stack>
      </Sheet>

      {/* ── Body: sidebar + content ── */}
      <Box sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* Sidebar */}
        <Box
          sx={{
            width: { xs: 0, md: 260 },
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            overflow: 'auto',
            display: { xs: 'none', md: 'block' },
            py: 2.5,
            px: 1.5,
          }}
        >
          <Typography
            level="body-xs"
            sx={{
              color: 'text.tertiary',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontWeight: 700,
              fontSize: '0.65rem',
              px: 1.25,
              mb: 1,
            }}
          >
            Browse
          </Typography>
          <List size="sm" sx={{ '--ListItem-paddingY': '4px', '--ListItem-paddingX': '4px', mb: 2 }}>
            <ListItem>
              <ListItemButton
                selected={activeCategory === 'all'}
                onClick={() => setActiveCategory('all')}
                sx={{ borderRadius: '10px', py: 0.75 }}
              >
                <ListItemDecorator sx={{ color: activeCategory === 'all' ? 'primary.500' : 'text.tertiary', minInlineSize: 28 }}>
                  <BookOpen size={15} />
                </ListItemDecorator>
                <ListItemContent>
                  <Typography level="body-sm" fontWeight={activeCategory === 'all' ? 600 : 500} sx={{ fontSize: '0.82rem' }}>
                    All docs
                  </Typography>
                </ListItemContent>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', fontVariantNumeric: 'tabular-nums' }}>
                  {DOC_ARTICLES.length + TUTORIAL_STEPS.length}
                </Typography>
              </ListItemButton>
            </ListItem>
          </List>

          <Typography
            level="body-xs"
            sx={{
              color: 'text.tertiary',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontWeight: 700,
              fontSize: '0.65rem',
              px: 1.25,
              mb: 1,
            }}
          >
            Categories
          </Typography>
          <List size="sm" sx={{ '--ListItem-paddingY': '2px', '--ListItem-paddingX': '4px' }}>
            {[...DOC_CATEGORIES, TUTORIAL_CATEGORY].map((cat) => {
              const Icon = ICON_MAP[cat.icon] || (cat.id === TUTORIAL_CATEGORY.id ? Sparkles : FileText);
              const isActive = activeCategory === cat.id;
              return (
                <ListItem key={cat.id}>
                  <ListItemButton
                    selected={isActive}
                    onClick={() => setActiveCategory(cat.id)}
                    sx={{ borderRadius: '10px', py: 0.75 }}
                  >
                    <ListItemDecorator sx={{ color: isActive ? 'primary.500' : 'text.tertiary', minInlineSize: 28 }}>
                      <Icon size={15} />
                    </ListItemDecorator>
                    <ListItemContent>
                      <Typography level="body-sm" fontWeight={isActive ? 600 : 500} sx={{ fontSize: '0.82rem' }}>
                        {cat.label}
                      </Typography>
                    </ListItemContent>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', fontVariantNumeric: 'tabular-nums' }}>
                      {categoryCounts[cat.id] || 0}
                    </Typography>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Content */}
        <Box sx={{
          flex: 1,
          minWidth: 0,
          overflow: 'auto',
        }}>
          {/* Mobile category chips */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, px: 2, pt: 2 }}>
            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
              <Chip
                variant={activeCategory === 'all' ? 'solid' : 'outlined'}
                color={activeCategory === 'all' ? 'primary' : 'neutral'}
                onClick={() => setActiveCategory('all')}
                sx={{ flexShrink: 0, cursor: 'pointer' }}
              >
                All docs
              </Chip>
              {[...DOC_CATEGORIES, TUTORIAL_CATEGORY].map((cat) => (
                <Chip
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'solid' : 'outlined'}
                  color={activeCategory === cat.id ? 'primary' : 'neutral'}
                  onClick={() => setActiveCategory(cat.id)}
                  sx={{ flexShrink: 0, cursor: 'pointer' }}
                >
                  {cat.label}
                </Chip>
              ))}
            </Stack>
          </Box>

          {/* Hero (only on "all" view, no search) */}
          {activeCategory === 'all' && !q && (
            <Box sx={{ px: { xs: 2, md: 5 }, pt: { xs: 3, md: 5 }, pb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <Lightbulb size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                <Typography level="body-xs" sx={{ color: 'primary.500', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.7rem' }}>
                  Documentation
                </Typography>
              </Stack>
              <Typography
                sx={{
                  fontSize: { xs: '1.7rem', md: '2.2rem' },
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  mb: 1.25,
                }}
              >
                How can we help you today?
              </Typography>
              <Typography level="body-md" sx={{ color: 'text.secondary', maxWidth: 640 }}>
                Browse step-by-step guides, walkthrough tutorials, and quick answers to common questions about Flowbooks.
              </Typography>
            </Box>
          )}

          {/* Empty state for searches */}
          {q && totalResults === 0 && (
            <Box sx={{ px: { xs: 2, md: 5 }, py: { xs: 6, md: 10 }, textAlign: 'center' }}>
              <Box sx={{
                width: 56, height: 56, borderRadius: '50%',
                bgcolor: 'neutral.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
              }}>
                <Search size={22} style={{ color: 'var(--joy-palette-neutral-500)' }} />
              </Box>
              <Typography level="title-md" fontWeight={700} sx={{ mb: 0.5 }}>
                No results for &ldquo;{search}&rdquo;
              </Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 2.5 }}>
                Try different keywords, or reach out to the support team for a hand.
              </Typography>
              <Button
                component="a"
                href={getSupportUrl()}
                variant="soft"
                color="primary"
                size="sm"
                startDecorator={<MessageSquare size={14} />}
                sx={{ borderRadius: '999px' }}
              >
                Contact support
              </Button>
            </Box>
          )}

          {/* Sections */}
          <Box sx={{ px: { xs: 2, md: 5 }, pt: 2, pb: 6 }}>
            {visibleCategories.map((cat) => {
              const isTutorial = cat.id === TUTORIAL_CATEGORY.id;
              const itemsForCat = isTutorial
                ? filteredTutorials
                : filteredArticles.filter(a => a.category === cat.id);

              if (itemsForCat.length === 0) return null;

              const Icon = ICON_MAP[cat.icon] || (isTutorial ? Sparkles : FileText);

              return (
                <Box key={cat.id} sx={{ mb: 4 }} id={`cat-${cat.id}`}>
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.75 }}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: '10px',
                      bgcolor: 'primary.softBg',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={15} style={{ color: 'var(--joy-palette-primary-500)' }} />
                    </Box>
                    <Typography level="title-md" fontWeight={700}>
                      {cat.label}
                    </Typography>
                    <Chip size="sm" variant="soft" color="neutral" sx={{ fontSize: '0.65rem', '--Chip-minHeight': '18px' }}>
                      {itemsForCat.length}
                    </Chip>
                  </Stack>

                  <Stack spacing={1.25}>
                    {isTutorial
                      ? filteredTutorials.map((step) => (
                          <TutorialItem
                            key={step.id}
                            id={step.id}
                            title={step.title}
                            description={step.description}
                            features={step.features}
                            tip={step.tip}
                            isOpen={expanded === `tut-${step.id}`}
                            onToggle={() => setExpanded(expanded === `tut-${step.id}` ? null : `tut-${step.id}`)}
                          />
                        ))
                      : itemsForCat
                          .filter((a): a is typeof DOC_ARTICLES[number] => 'steps' in a)
                          .map((a) => (
                            <ArticleItem
                              key={a.id}
                              id={a.id}
                              title={a.title}
                              description={a.description}
                              steps={a.steps}
                              isOpen={expanded === `doc-${a.id}`}
                              onToggle={() => setExpanded(expanded === `doc-${a.id}` ? null : `doc-${a.id}`)}
                            />
                          ))}
                  </Stack>
                </Box>
              );
            })}

            {/* Bottom help card */}
            <Card
              variant="outlined"
              sx={{
                mt: 4,
                borderRadius: '16px',
                background: isLight
                  ? 'linear-gradient(135deg, rgba(217,119,87,0.06) 0%, rgba(217,119,87,0.02) 100%)'
                  : 'linear-gradient(135deg, rgba(217,119,87,0.1) 0%, rgba(217,119,87,0.04) 100%)',
                borderColor: 'primary.outlinedBorder',
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems={{ sm: 'center' }}
                  justifyContent="space-between"
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                      bgcolor: 'primary.softBg',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <MessageSquare size={20} style={{ color: 'var(--joy-palette-primary-600)' }} />
                    </Box>
                    <Box>
                      <Typography level="title-sm" fontWeight={700}>
                        Still need help?
                      </Typography>
                      <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.25 }}>
                        Chat with our AI assistant or open a ticket — a human will respond within 24 hours.
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    component="a"
                    href={getSupportUrl()}
                    endDecorator={<ExternalLink size={14} />}
                    sx={{
                      borderRadius: '999px',
                      fontWeight: 600,
                      bgcolor: '#D97757',
                      '&:hover': { bgcolor: '#C4694D' },
                      flexShrink: 0,
                    }}
                  >
                    Contact support
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Footer */}
            <Box sx={{ pt: 4, mt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                justifyContent="space-between"
                alignItems={{ sm: 'center' }}
              >
                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                  &copy; {new Date().getFullYear()} Flowbooks. All rights reserved.
                </Typography>
                <Stack direction="row" spacing={2.5}>
                  <Typography
                    component="a"
                    href={getAppUrl()}
                    level="body-xs"
                    sx={{ color: 'text.tertiary', textDecoration: 'none', '&:hover': { color: 'primary.500' } }}
                  >
                    Open Flowbooks
                  </Typography>
                  <Typography
                    component="a"
                    href={getSupportUrl()}
                    level="body-xs"
                    sx={{ color: 'text.tertiary', textDecoration: 'none', '&:hover': { color: 'primary.500' } }}
                  >
                    Support
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ── Article card with expandable step list ──────────────────────────────────
function ArticleItem({
  id, title, description, steps, isOpen, onToggle,
}: {
  id: string;
  title: string;
  description: string;
  steps?: string[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Card
      variant="outlined"
      id={`article-${id}`}
      sx={{
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease',
        '&:hover': {
          borderColor: 'primary.300',
          boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
        },
      }}
      onClick={onToggle}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.25 } }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box sx={{
            width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
            bgcolor: 'primary.softBg',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mt: 0.25,
          }}>
            <FileText size={14} style={{ color: 'var(--joy-palette-primary-500)' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography level="body-md" fontWeight={600} sx={{ letterSpacing: '-0.005em' }}>
                  {title}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.25 }}>
                  {description}
                </Typography>
              </Box>
              <Box sx={{
                color: 'text.tertiary',
                transition: 'transform 0.18s ease',
                transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                mt: 0.5,
                flexShrink: 0,
              }}>
                <ChevronRight size={16} />
              </Box>
            </Stack>

            {isOpen && steps && steps.length > 0 && (
              <Box sx={{ mt: 1.75, pl: 0.5 }}>
                <Stack spacing={1}>
                  {steps.map((step, i) => (
                    <Stack key={i} direction="row" spacing={1.25} alignItems="flex-start">
                      <Box sx={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        bgcolor: 'primary.softBg', color: 'primary.700',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700,
                        mt: 0.125,
                      }}>
                        {i + 1}
                      </Box>
                      <Typography level="body-sm" sx={{ color: 'text.primary', lineHeight: 1.55 }}>
                        {step}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Tutorial card ───────────────────────────────────────────────────────────
function TutorialItem({
  id, title, description, features, tip, isOpen, onToggle,
}: {
  id: string;
  title: string;
  description: string;
  features?: string[];
  tip?: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Card
      variant="outlined"
      id={`tutorial-${id}`}
      sx={{
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease',
        '&:hover': {
          borderColor: 'primary.300',
          boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
        },
      }}
      onClick={onToggle}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.25 } }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box sx={{
            width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
            bgcolor: 'warning.softBg',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mt: 0.25,
          }}>
            <GraduationCap size={14} style={{ color: '#D97757' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography level="body-md" fontWeight={600} sx={{ letterSpacing: '-0.005em' }}>
                  {title}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.25 }}>
                  {description}
                </Typography>
              </Box>
              <Box sx={{
                color: 'text.tertiary',
                transition: 'transform 0.18s ease',
                transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                mt: 0.5,
                flexShrink: 0,
              }}>
                <ChevronRight size={16} />
              </Box>
            </Stack>

            {isOpen && (
              <Box sx={{ mt: 1.75 }}>
                {features && features.length > 0 && (
                  <Stack spacing={0.75} sx={{ mb: tip ? 1.75 : 0 }}>
                    {features.map((feature, i) => (
                      <Stack key={i} direction="row" spacing={1.25} alignItems="flex-start">
                        <Box sx={{
                          width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                          bgcolor: 'primary.500',
                          mt: 0.875,
                        }} />
                        <Typography level="body-sm" sx={{ color: 'text.primary', lineHeight: 1.55 }}>
                          {feature}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}
                {tip && (
                  <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="flex-start"
                    sx={{
                      p: 1.25,
                      borderRadius: '8px',
                      bgcolor: 'warning.softBg',
                    }}
                  >
                    <Lightbulb size={14} style={{ color: '#D97757', marginTop: 2, flexShrink: 0 }} />
                    <Typography level="body-sm" sx={{ color: 'text.primary' }}>
                      <Typography component="span" fontWeight={700}>Tip: </Typography>
                      {tip}
                    </Typography>
                  </Stack>
                )}
              </Box>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
