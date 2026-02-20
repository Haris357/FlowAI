'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Sparkles,
  Moon,
  Sun,
  Menu,
  X,
  Clock,
  User,
  ArrowLeft,
  ArrowRight,
  Eye,
  Home,
  Calendar,
  Tag,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getPostBySlug, getPublishedPosts, incrementViews } from '@/services/blog';
import type { BlogPost } from '@/types/blog';

// --- Brand Name ---
const BrandName = () => (
  <span className="font-bold tracking-tight text-lg">
    <span
      style={{
        background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      Flow<em className="not-italic" style={{ fontStyle: 'italic' }}>books</em>
    </span>
  </span>
);

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

export default function BlogPostPage() {
  const { mode, toggleMode } = useTheme();
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    getPostBySlug(slug)
      .then((data) => {
        setPost(data);
        // Increment views
        if (data) {
          incrementViews(data.id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Fetch related posts
    getPublishedPosts()
      .then((allPosts) => {
        const others = allPosts.filter((p) => p.slug !== slug).slice(0, 3);
        setRelatedPosts(others);
      })
      .catch(console.error);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-[#1A1915] font-sans text-slate-900 dark:text-[#EEECE8]">
        <div className="max-w-3xl mx-auto px-4 pt-32 pb-20 animate-pulse space-y-6">
          <div className="h-4 w-24 bg-slate-200 dark:bg-[#2D2B28] rounded" />
          <div className="h-10 w-3/4 bg-slate-200 dark:bg-[#2D2B28] rounded" />
          <div className="h-4 w-1/2 bg-slate-200 dark:bg-[#2D2B28] rounded" />
          <div className="h-64 bg-slate-200 dark:bg-[#2D2B28] rounded-xl" />
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 dark:bg-[#2D2B28] rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-[#1A1915] font-sans text-slate-900 dark:text-[#EEECE8] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Post Not Found</h1>
          <p className="text-slate-600 dark:text-[#A8A29E]">The blog post you are looking for does not exist.</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#1A1915] font-sans text-slate-900 dark:text-[#EEECE8] selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden text-[15px]">
      {/* Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              mode === 'dark'
                ? 'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)'
                : 'linear-gradient(to right, rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.035) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              mode === 'dark'
                ? 'radial-gradient(ellipse at center, transparent 0%, #1A1915 70%)'
                : 'radial-gradient(ellipse at center, transparent 0%, rgba(255,255,255,0.85) 70%)',
          }}
        />
      </div>

      {/* ============ NAVBAR ============ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-1.5 bg-white/70 dark:bg-[#1A1915]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/[0.06] shadow-sm'
            : 'py-3 bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/25">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <BrandName />
            </Link>

            <div className="hidden md:flex items-center gap-0.5">
              <Link
                href="/"
                className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-all flex items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" /> Home
              </Link>
              <Link
                href="/blog"
                className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-all"
              >
                Blog
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-2.5">
              <button
                onClick={toggleMode}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-[#A8A29E] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
                aria-label="Toggle theme"
              >
                {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link
                href="/signup"
                className="px-4 py-2 text-[13px] font-semibold text-white rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 flex items-center gap-1.5"
              >
                Get Started <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Mobile */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={toggleMode}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-[#A8A29E] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
              >
                {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-[#A8A29E] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden bg-white/90 dark:bg-[#1A1915]/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/[0.06] overflow-hidden transition-all duration-300 ${
            isMenuOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-4 space-y-1">
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04]">
              Home
            </Link>
            <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04]">
              Blog
            </Link>
          </div>
        </div>
      </nav>

      {/* ============ ARTICLE HEADER ============ */}
      <section className="relative pt-28 pb-8 lg:pt-36 lg:pb-12">
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full opacity-[0.10] blur-[100px] pointer-events-none"
          style={{ background: 'var(--brand-500)' }}
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-[#A8A29E] hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>

          {/* Category */}
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-brand-50/80 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-200/40 dark:border-brand-500/20 mb-4">
            {post.category}
          </span>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-5">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-[#A8A29E] mb-6">
            <div className="flex items-center gap-2">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt={post.author.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#454240] flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500 dark:text-[#A8A29E]" />
                </div>
              )}
              <span className="font-medium text-slate-700 dark:text-[#DBD8D0]">{post.author.name}</span>
            </div>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {post.readTime} min read
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> {post.views.toLocaleString()} views
            </span>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-[#A8A29E] border border-slate-200/60 dark:border-white/[0.08]"
                >
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ COVER IMAGE ============ */}
      {post.coverImage && (
        <section className="relative z-10 pb-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl overflow-hidden border border-slate-200/60 dark:border-[#3D3A37] shadow-xl">
              <img src={post.coverImage} alt={post.title} className="w-full h-auto object-cover" />
            </div>
          </div>
        </section>
      )}

      {/* ============ ARTICLE BODY ============ */}
      <section className="relative z-10 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <article
            className="prose prose-slate dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
              prose-p:text-slate-700 dark:prose-p:text-[#CCCCBB] prose-p:leading-relaxed
              prose-a:text-brand-600 dark:prose-a:text-brand-400 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
              prose-strong:text-slate-900 dark:prose-strong:text-white
              prose-blockquote:border-l-brand-500 prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-white/[0.03] prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic
              prose-code:text-brand-700 dark:prose-code:text-brand-400 prose-code:bg-slate-100 dark:prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-normal prose-code:before:content-[''] prose-code:after:content-['']
              prose-pre:bg-slate-900 dark:prose-pre:bg-[#0D0C0B] prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-[#3D3A37] prose-pre:rounded-xl
              prose-img:rounded-xl prose-img:border prose-img:border-slate-200 dark:prose-img:border-[#3D3A37] prose-img:shadow-lg
              prose-li:text-slate-700 dark:prose-li:text-[#CCCCBB]
              prose-hr:border-slate-200 dark:prose-hr:border-[#3D3A37]
              prose-th:text-slate-900 dark:prose-th:text-white
              prose-td:text-slate-700 dark:prose-td:text-[#CCCCBB]"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </section>

      {/* ============ RELATED POSTS ============ */}
      {relatedPosts.length > 0 && (
        <section className="relative z-10 py-16 border-t border-slate-200 dark:border-[#2D2B28]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">
              More from the Blog
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className="group rounded-2xl border border-slate-200 dark:border-[#3D3A37] bg-white dark:bg-[#232220] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {rp.coverImage ? (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={rp.coverImage}
                        alt={rp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-brand-500/20 via-brand-600/10 to-purple-500/15 dark:from-brand-500/15 dark:via-brand-600/10 dark:to-purple-500/10 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-brand-400/40 dark:text-brand-500/30" />
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-brand-50/80 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400">
                      {rp.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {rp.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#78736D]">
                      <span>{formatDateShort(rp.publishedAt)}</span>
                      <span className="flex items-center gap-1">
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
      <footer className="relative z-10 bg-slate-50 dark:bg-[#232220]/50 py-8 border-t border-slate-200 dark:border-[#2D2B28]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <BrandName />
          </div>
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
