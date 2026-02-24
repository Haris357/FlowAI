'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Moon,
  Sun,
  Menu,
  X,
  Clock,
  User,
  ArrowRight,
  Home,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getPublishedPosts } from '@/services/blog';
import type { BlogPost } from '@/types/blog';
import FlowBooksLogo from '@/components/FlowBooksLogo';

const CATEGORIES = ['All', 'News', 'Updates', 'Guides', 'Tips', 'Engineering'];

function formatDate(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// --- Skeleton Card ---
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#3D3A37] bg-white dark:bg-[#232220] overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-200 dark:bg-[#2D2B28]" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-20 bg-slate-200 dark:bg-[#2D2B28] rounded" />
        <div className="h-5 w-3/4 bg-slate-200 dark:bg-[#2D2B28] rounded" />
        <div className="h-4 w-full bg-slate-200 dark:bg-[#2D2B28] rounded" />
        <div className="h-4 w-2/3 bg-slate-200 dark:bg-[#2D2B28] rounded" />
        <div className="flex items-center gap-3 pt-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#2D2B28]" />
          <div className="h-3 w-24 bg-slate-200 dark:bg-[#2D2B28] rounded" />
          <div className="h-3 w-16 bg-slate-200 dark:bg-[#2D2B28] rounded ml-auto" />
        </div>
      </div>
    </div>
  );
}

export default function BlogPage() {
  const { mode, toggleMode } = useTheme();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    getPublishedPosts()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredPosts =
    activeCategory === 'All'
      ? posts
      : posts.filter((p) => p.category === activeCategory);

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
      <nav className="sticky top-0 z-50 py-1.5 bg-white/70 dark:bg-[#1A1915]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/[0.06] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <Link href="/" className="flex items-center gap-2">
              <FlowBooksLogo size="sm" />
            </Link>
            <div className="flex items-center gap-2.5">
              <Link href="/" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-all flex items-center gap-1.5">
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

      {/* ============ HERO ============ */}
      <section className="relative pt-16 pb-12 lg:pt-20 lg:pb-16">
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full opacity-[0.10] blur-[100px] pointer-events-none"
          style={{ background: 'var(--brand-500)' }}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50/80 dark:bg-brand-500/10 border border-brand-200/60 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 text-xs font-medium backdrop-blur-sm mb-5">
            <Sparkles className="w-3 h-3" />
            FLOWBOOKS BLOG
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-4 max-w-3xl mx-auto">
            Blog
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-[#A8A29E] max-w-xl mx-auto leading-relaxed">
            Insights, updates, and guides for modern business
          </p>
        </div>
      </section>

      {/* ============ CATEGORY FILTERS ============ */}
      <section className="relative z-10 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'bg-slate-100/80 dark:bg-white/[0.06] text-slate-600 dark:text-[#A8A29E] border border-slate-200/60 dark:border-white/[0.08] hover:bg-slate-200/60 dark:hover:bg-white/[0.1]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BLOG GRID ============ */}
      <section className="relative z-10 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500 dark:text-[#78736D] text-lg">No posts found.</p>
              {activeCategory !== 'All' && (
                <button
                  onClick={() => setActiveCategory('All')}
                  className="mt-3 text-brand-600 dark:text-brand-400 text-sm font-medium hover:underline"
                >
                  View all posts
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group rounded-2xl border border-slate-200 dark:border-[#3D3A37] bg-white dark:bg-[#232220] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Cover Image / Gradient Placeholder */}
                  {post.coverImage ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-brand-500/20 via-brand-600/10 to-purple-500/15 dark:from-brand-500/15 dark:via-brand-600/10 dark:to-purple-500/10 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-brand-400/40 dark:text-brand-500/30" />
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    {/* Category chip */}
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-brand-50/80 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-200/40 dark:border-brand-500/20">
                      {post.category}
                    </span>

                    {/* Title */}
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-sm text-slate-600 dark:text-[#A8A29E] leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-[#2D2B28]">
                      {post.author.avatar ? (
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-[#454240] flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-slate-500 dark:text-[#A8A29E]" />
                        </div>
                      )}
                      <span className="text-xs font-medium text-slate-700 dark:text-[#DBD8D0]">
                        {post.author.name}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-[#78736D] ml-auto flex items-center gap-1">
                        {formatDate(post.publishedAt)}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-[#78736D] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.readTime}m
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative z-10 bg-slate-50 dark:bg-[#232220]/50 py-8 border-t border-slate-200 dark:border-[#2D2B28]">
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
