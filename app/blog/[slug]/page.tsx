'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Sparkles,
  Moon,
  Sun,
  Clock,
  User,
  ArrowLeft,
  ArrowRight,
  Eye,
  Home,
  Calendar,
  Tag,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Check,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getPostBySlug, getPublishedPosts, incrementViews } from '@/services/blog';
import type { BlogPost } from '@/types/blog';
import FlowBooksLogo from '@/components/FlowBooksLogo';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateShort(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Reading progress bar ─────────────────────────────────────────────────────
function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrollTop = h.scrollTop || document.body.scrollTop;
      const scrollHeight = h.scrollHeight - h.clientHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setProgress(pct);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── Share buttons ────────────────────────────────────────────────────────────
function ShareBar({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const baseBtn =
    'w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white bg-slate-100/70 dark:bg-white/[0.04] hover:bg-slate-200/70 dark:hover:bg-white/[0.08] transition-all';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#78736D] mr-1">
        Share
      </span>
      <a href={tweetUrl} target="_blank" rel="noreferrer" className={baseBtn} aria-label="Share on Twitter">
        <Twitter className="w-4 h-4" />
      </a>
      <a href={linkedInUrl} target="_blank" rel="noreferrer" className={baseBtn} aria-label="Share on LinkedIn">
        <Linkedin className="w-4 h-4" />
      </a>
      <button onClick={copy} className={baseBtn} aria-label="Copy link">
        {copied ? <Check className="w-4 h-4 text-brand-500" /> : <LinkIcon className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function BlogPostPage() {
  const { mode, toggleMode } = useTheme();
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    setPageUrl(typeof window !== 'undefined' ? window.location.href : '');
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    getPostBySlug(slug)
      .then((data) => {
        setPost(data);
        if (data) incrementViews(data.id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    getPublishedPosts()
      .then((allPosts) => {
        const others = allPosts.filter((p) => p.slug !== slug).slice(0, 3);
        setRelatedPosts(others);
      })
      .catch(console.error);
  }, [slug]);

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-[#1A1915] font-sans text-slate-900 dark:text-[#EEECE8]">
        <div className="max-w-2xl mx-auto px-4 pt-32 pb-20 animate-pulse space-y-6">
          <div className="h-4 w-24 bg-slate-200 dark:bg-[#2D2B28] rounded" />
          <div className="h-12 w-11/12 bg-slate-200 dark:bg-[#2D2B28] rounded" />
          <div className="h-12 w-7/12 bg-slate-200 dark:bg-[#2D2B28] rounded" />
          <div className="h-4 w-1/2 bg-slate-200 dark:bg-[#2D2B28] rounded" />
          <div className="h-72 bg-slate-200 dark:bg-[#2D2B28] rounded-2xl" />
          <div className="space-y-3 pt-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-4 bg-slate-200 dark:bg-[#2D2B28] rounded"
                style={{ width: `${70 + Math.random() * 30}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────
  if (!post) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-[#1A1915] font-sans text-slate-900 dark:text-[#EEECE8] flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-slate-400 dark:text-[#78736D]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Post not found</h1>
          <p className="text-sm text-slate-600 dark:text-[#A8A29E]">
            The article you are looking for does not exist or may have been removed.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#1A1915] font-sans text-slate-900 dark:text-[#EEECE8] selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden text-[15px]">
      <ReadingProgress />

      {/* Soft glow background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full opacity-[0.06] dark:opacity-[0.04]"
          style={{ background: 'var(--brand-500)', filter: 'blur(160px)' }}
        />
      </div>

      {/* ============ NAVBAR ============ */}
      <nav className="sticky top-0 z-50 py-1.5 bg-white/80 dark:bg-[#1A1915]/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <Link href="/" className="flex items-center gap-2">
              <FlowBooksLogo size="sm" />
            </Link>
            <div className="flex items-center gap-1.5">
              <Link
                href="/blog"
                className="px-3 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> All articles
              </Link>
              <Link
                href="/"
                className="px-3 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-all flex items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" /> Home
              </Link>
              <button
                onClick={toggleMode}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-[#A8A29E] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
                aria-label="Toggle theme"
              >
                {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ============ ARTICLE HEADER ============ */}
      <header className="relative pt-14 pb-10 lg:pt-20 lg:pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Back to blog */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 dark:text-[#A8A29E] hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to all articles
          </Link>

          {/* Category */}
          <div className="mb-5">
            <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-200/60 dark:border-brand-500/20">
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-5">
            {post.title}
          </h1>

          {/* Excerpt as deck */}
          {post.excerpt && (
            <p className="text-lg sm:text-xl text-slate-600 dark:text-[#A8A29E] leading-relaxed mb-8 font-normal">
              {post.excerpt}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center justify-between gap-y-4 pt-6 border-t border-slate-200/70 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm">
                  {post.author.name?.[0]?.toUpperCase() || 'F'}
                </div>
              )}
              <div className="leading-tight">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {post.author.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-[#78736D] flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDate(post.publishedAt)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/[0.15]" />
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {post.readTime} min read
                  </span>
                  {typeof post.views === 'number' && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/[0.15]" />
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {post.views.toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <ShareBar title={post.title} url={pageUrl} />
          </div>
        </div>
      </header>

      {/* ============ COVER IMAGE ============ */}
      {post.coverImage && (
        <section className="relative z-10 pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.06] shadow-2xl shadow-slate-900/10 dark:shadow-black/40">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* ============ ARTICLE BODY ============ */}
      <section className="relative z-10 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <article
            className="article-body prose prose-slate dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-white
              prose-h2:text-[1.75rem] prose-h2:leading-tight prose-h2:mt-14 prose-h2:mb-4
              prose-h3:text-[1.35rem] prose-h3:leading-snug prose-h3:mt-10 prose-h3:mb-3
              prose-h4:text-[1.1rem] prose-h4:mt-8 prose-h4:mb-2
              prose-p:text-[17px] prose-p:leading-[1.75] prose-p:text-slate-700 dark:prose-p:text-[#CCCCBB] prose-p:my-5
              prose-a:text-brand-600 dark:prose-a:text-brand-400 prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-4
              prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-semibold
              prose-em:text-slate-700 dark:prose-em:text-[#DBD8D0]
              prose-blockquote:border-l-4 prose-blockquote:border-brand-500 prose-blockquote:bg-brand-50/60 dark:prose-blockquote:bg-brand-500/5 prose-blockquote:rounded-r-xl prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:not-italic prose-blockquote:font-medium prose-blockquote:my-8 prose-blockquote:text-slate-800 dark:prose-blockquote:text-[#DBD8D0]
              prose-code:text-brand-700 dark:prose-code:text-brand-400 prose-code:bg-brand-50/80 dark:prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[0.9em] prose-code:font-mono prose-code:font-normal prose-code:before:content-[''] prose-code:after:content-['']
              prose-pre:bg-[#0D0C0B] dark:prose-pre:bg-[#0D0C0B] prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-white/[0.05] prose-pre:rounded-2xl prose-pre:p-5 prose-pre:my-7 prose-pre:overflow-x-auto
              prose-img:rounded-2xl prose-img:border prose-img:border-slate-200 dark:prose-img:border-white/[0.06] prose-img:shadow-lg prose-img:my-8
              prose-ul:my-5 prose-ol:my-5 prose-li:my-1.5 prose-li:text-slate-700 dark:prose-li:text-[#CCCCBB] prose-li:text-[17px] prose-li:leading-[1.75]
              prose-li:marker:text-brand-500
              prose-hr:border-slate-200 dark:prose-hr:border-white/[0.06] prose-hr:my-12
              prose-table:my-7
              prose-th:text-slate-900 dark:prose-th:text-white prose-th:font-semibold prose-th:bg-slate-50 dark:prose-th:bg-white/[0.04] prose-th:py-3 prose-th:px-4
              prose-td:text-slate-700 dark:prose-td:text-[#CCCCBB] prose-td:py-3 prose-td:px-4
              prose-figure:my-8 prose-figcaption:text-center prose-figcaption:text-sm prose-figcaption:text-slate-500 dark:prose-figcaption:text-[#78736D] prose-figcaption:mt-3"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-200/70 dark:border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-[#78736D]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#78736D]">
                  Tagged
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100/80 dark:bg-white/[0.04] text-slate-600 dark:text-[#A8A29E] hover:bg-slate-200/70 dark:hover:bg-white/[0.08] transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author bio */}
          <div className="mt-10 p-6 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
            <div className="flex items-start gap-4">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {post.author.name?.[0]?.toUpperCase() || 'F'}
                </div>
              )}
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#78736D] mb-1">
                  Written by
                </div>
                <div className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                  {post.author.name}
                </div>
                <p className="text-sm text-slate-600 dark:text-[#A8A29E] leading-relaxed">
                  Sharing practical writing on AI, accounting, and small business —
                  built by the team behind Flowbooks.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom share */}
          <div className="mt-8 flex items-center justify-between gap-4 pt-6 border-t border-slate-200/70 dark:border-white/[0.06]">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-[#A8A29E] hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> All articles
            </Link>
            <ShareBar title={post.title} url={pageUrl} />
          </div>
        </div>
      </section>

      {/* ============ CTA STRIP ============ */}
      <section className="relative z-10 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-8 sm:p-12 text-center shadow-2xl shadow-brand-500/20">
            <div className="absolute inset-0 opacity-30">
              <div
                className="absolute -top-20 -right-20 w-80 h-80 rounded-full"
                style={{ background: '#fff', filter: 'blur(80px)', opacity: 0.15 }}
              />
            </div>
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Try Flowbooks free
              </h2>
              <p className="text-sm sm:text-base text-white/80 max-w-md mx-auto mb-6">
                AI-first accounting for small businesses and freelancers. No credit card required.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 px-6 py-3 text-sm font-semibold text-brand-700 rounded-full bg-white hover:bg-slate-50 shadow-lg transition-all hover:-translate-y-0.5"
              >
                Get started free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ RELATED POSTS ============ */}
      {relatedPosts.length > 0 && (
        <section className="relative z-10 py-16 border-t border-slate-200/60 dark:border-[#2D2B28]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Keep reading
              </h2>
              <Link
                href="/blog"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                All articles <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className="group flex flex-col rounded-2xl overflow-hidden border border-slate-200/70 dark:border-white/[0.06] bg-white dark:bg-[#1F1E1B]/40 hover:border-slate-300 dark:hover:border-white/[0.12] hover:shadow-xl hover:shadow-slate-900/5 dark:hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {rp.coverImage ? (
                      <img
                        src={rp.coverImage}
                        alt={rp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/15 via-brand-500/5 to-transparent dark:from-brand-500/20 dark:via-brand-500/5 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-brand-400/40 dark:text-brand-500/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 p-5 gap-3">
                    <span className="inline-flex w-fit px-2 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400">
                      {rp.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {rp.title}
                    </h3>
                    <div className="flex items-center gap-2 pt-3 mt-auto text-xs text-slate-500 dark:text-[#78736D] border-t border-slate-100 dark:border-white/[0.05]">
                      <span>{formatDateShort(rp.publishedAt)}</span>
                      <span className="ml-auto inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {rp.readTime}m
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ FOOTER ============ */}
      <footer className="relative z-10 bg-slate-50/50 dark:bg-[#232220]/50 py-8 border-t border-slate-200 dark:border-[#2D2B28]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <FlowBooksLogo size="xs" />
          <p className="text-slate-500 dark:text-[#A8A29E] text-xs">
            &copy; {new Date().getFullYear()} Flowbooks Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#A8A29E]">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            System Operational
          </div>
        </div>
      </footer>
    </div>
  );
}
