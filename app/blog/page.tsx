'use client';
import React, { useEffect, useState, useMemo } from 'react';
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
  CreditCard,
  Info,
  BookOpen,
  Mail,
  ChevronDown,
  Lock,
  FileText,
  Shield,
  LayoutDashboard,
  Search,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getPublishedPosts } from '@/services/blog';
import type { BlogPost } from '@/types/blog';
import FlowBooksLogo from '@/components/FlowBooksLogo';

const CATEGORIES = ['All', 'News', 'Updates', 'Guides', 'Tips', 'Engineering'];

function formatDate(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Skeletons ────────────────────────────────────────────────────────────────
function FeaturedSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 animate-pulse">
      <div className="aspect-[16/10] rounded-2xl bg-slate-200/60 dark:bg-white/[0.04]" />
      <div className="flex flex-col justify-center space-y-4">
        <div className="h-5 w-24 rounded-full bg-slate-200/60 dark:bg-white/[0.06]" />
        <div className="h-9 w-11/12 rounded bg-slate-200/60 dark:bg-white/[0.06]" />
        <div className="h-9 w-9/12 rounded bg-slate-200/60 dark:bg-white/[0.06]" />
        <div className="h-4 w-full rounded bg-slate-200/60 dark:bg-white/[0.06]" />
        <div className="h-4 w-10/12 rounded bg-slate-200/60 dark:bg-white/[0.06]" />
        <div className="h-4 w-32 rounded bg-slate-200/60 dark:bg-white/[0.06]" />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-white/[0.05] animate-pulse">
      <div className="aspect-[16/10] bg-slate-200/60 dark:bg-white/[0.04]" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-20 bg-slate-200/60 dark:bg-white/[0.06] rounded-full" />
        <div className="h-5 w-11/12 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
        <div className="h-5 w-7/12 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
        <div className="h-3 w-1/2 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
      </div>
    </div>
  );
}

// ── Cards ────────────────────────────────────────────────────────────────────
function CoverPlaceholder({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const iconSize = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-brand-500/15 via-brand-500/5 to-transparent dark:from-brand-500/20 dark:via-brand-500/5 flex items-center justify-center">
      <Sparkles className={`${iconSize} text-brand-400/40 dark:text-brand-500/30`} />
    </div>
  );
}

function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
    >
      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.06] shadow-lg shadow-slate-900/5 dark:shadow-black/20">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          />
        ) : (
          <CoverPlaceholder size="lg" />
        )}
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-200/60 dark:border-brand-500/20">
            {post.category}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#78736D]">
            Featured
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {post.title}
        </h2>
        <p className="text-base text-slate-600 dark:text-[#A8A29E] leading-relaxed line-clamp-3 max-w-xl">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-[#A8A29E]">
          {post.author.avatar ? (
            <img src={post.author.avatar} alt={post.author.name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
              <User className="w-4 h-4 text-slate-500 dark:text-[#78736D]" />
            </div>
          )}
          <span className="font-medium text-slate-700 dark:text-[#DBD8D0]">{post.author.name}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/[0.15]" />
          <span>{formatDate(post.publishedAt)}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/[0.15]" />
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {post.readTime} min read
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 mt-1 text-sm font-semibold text-brand-600 dark:text-brand-400">
          Read article
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-slate-200/70 dark:border-white/[0.06] bg-white dark:bg-[#1F1E1B]/40 hover:border-slate-300 dark:hover:border-white/[0.12] hover:shadow-xl hover:shadow-slate-900/5 dark:hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <CoverPlaceholder />
        )}
      </div>
      <div className="flex flex-col flex-1 p-5 gap-3">
        <span className="inline-flex w-fit px-2 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400">
          {post.category}
        </span>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-[#A8A29E] leading-relaxed line-clamp-2">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-2 pt-3 mt-auto text-xs text-slate-500 dark:text-[#78736D] border-t border-slate-100 dark:border-white/[0.05]">
          <span className="font-medium text-slate-700 dark:text-[#DBD8D0]">
            {post.author.name}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/[0.15]" />
          <span>{formatDate(post.publishedAt)}</span>
          <span className="ml-auto inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> {post.readTime}m
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function BlogPage() {
  const { user } = useAuth();
  const { mode, toggleMode } = useTheme();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
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

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activeCategory !== 'All') {
      result = result.filter((p) => p.category === activeCategory);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [posts, activeCategory, search]);

  // Pull featured = first post matching filter; rest below
  const showFeatured = activeCategory === 'All' && !search && filteredPosts.length > 0;
  const featuredPost = showFeatured ? filteredPosts[0] : null;
  const gridPosts = featuredPost ? filteredPosts.slice(1) : filteredPosts;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#1A1915] font-sans text-slate-900 dark:text-[#EEECE8] selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden text-[15px]">
      {/* Subtle background — single soft glow, no busy patterns */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-[0.06] dark:opacity-[0.04]"
          style={{ background: 'var(--brand-500)', filter: 'blur(160px)' }}
        />
      </div>

      {/* ============ NAVBAR ============ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'py-1.5 liquid-glass-strong' : 'py-3 bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <Link href="/" className="flex items-center gap-2">
              <FlowBooksLogo size="sm" />
            </Link>

            <div className="hidden lg:flex items-center gap-0.5 liquid-glass-subtle rounded-full px-1.5 py-1">
              <Link href="/pricing" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-all flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />Pricing
              </Link>
              <Link href="/about" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-all flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />About
              </Link>
              <Link href="/blog" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-900 dark:text-white rounded-full bg-white dark:bg-white/[0.06] transition-all flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />Blog
              </Link>
              <Link href="/contact" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-all flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />Contact
              </Link>

              <div className="relative">
                <button
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  onBlur={() => setTimeout(() => setIsMoreOpen(false), 150)}
                  className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-all flex items-center gap-1.5"
                >
                  More
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isMoreOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`absolute right-0 top-full mt-2 w-52 liquid-glass-strong rounded-2xl overflow-hidden transition-all duration-300 origin-top ${isMoreOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                  <div className="p-2">
                    <Link href="/privacy" className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                      <Shield className="w-4 h-4" />Privacy Policy
                    </Link>
                    <Link href="/terms" className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                      <FileText className="w-4 h-4" />Terms of Service
                    </Link>
                    <Link href="/security" className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                      <Lock className="w-4 h-4" />Security
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2.5">
              <button
                onClick={toggleMode}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-[#A8A29E] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
                aria-label="Toggle theme"
              >
                {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {user ? (
                <Link
                  href="/companies"
                  className="px-5 py-2 text-[13px] font-semibold text-white rounded-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white transition-colors">
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-5 py-2 text-[13px] font-semibold text-white rounded-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 flex items-center gap-1.5"
                  >
                    Get Started <ArrowRight className="w-3 h-3" />
                  </Link>
                </>
              )}
            </div>

            <div className="flex lg:hidden items-center gap-1.5">
              <button
                onClick={toggleMode}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-[#A8A29E] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
              >
                {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-[#A8A29E] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <div
          className={`lg:hidden liquid-glass-strong overflow-hidden transition-all duration-300 ${
            isMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-4 space-y-1">
            <Link href="/pricing" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"><CreditCard className="w-[18px] h-[18px]" />Pricing</Link>
            <Link href="/about" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"><Info className="w-[18px] h-[18px]" />About</Link>
            <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white rounded-xl bg-slate-100/60 dark:bg-white/[0.04]"><BookOpen className="w-[18px] h-[18px]" />Blog</Link>
            <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"><Mail className="w-[18px] h-[18px]" />Contact</Link>
            <hr className="border-slate-200/60 dark:border-white/[0.06] my-2" />
            <p className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#5C5752]">Legal</p>
            <Link href="/privacy" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"><Shield className="w-[18px] h-[18px]" />Privacy Policy</Link>
            <Link href="/terms" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"><FileText className="w-[18px] h-[18px]" />Terms of Service</Link>
            <Link href="/security" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"><Lock className="w-[18px] h-[18px]" />Security</Link>
            <hr className="border-slate-200/60 dark:border-white/[0.06] my-2" />
            <button onClick={toggleMode} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] w-full rounded-xl">
              {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            {user ? (
              <Link href="/companies" className="block text-center mt-1 px-3 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-brand-500 to-brand-600">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E]">Sign In</Link>
                <Link href="/signup" className="block text-center mt-1 px-3 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-brand-500 to-brand-600">Get Started Free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="relative pt-32 pb-12 lg:pt-40 lg:pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50/80 dark:bg-brand-500/10 border border-brand-200/60 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 text-xs font-medium backdrop-blur-sm mb-5">
              <Sparkles className="w-3 h-3" />
              The Flowbooks Blog
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.05] mb-5">
              Stories, guides, and ideas for modern small business.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-[#A8A29E] leading-relaxed">
              Practical writing on accounting, AI, invoicing, and the craft of running a
              business that doesn't run you.
            </p>
          </div>
        </div>
      </section>

      {/* ============ CONTROLS: search + categories ============ */}
      <section className="relative z-10 pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200/70 dark:border-white/[0.06]">
            {/* Categories */}
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                      active
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                        : 'text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#78736D] pointer-events-none" />
              <input
                type="text"
                placeholder="Search posts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[13px] rounded-full bg-slate-100/70 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#78736D] border border-transparent focus:border-brand-300 dark:focus:border-brand-500/40 focus:bg-white dark:focus:bg-white/[0.06] focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURED POST (only on default view) ============ */}
      {(loading || featuredPost) && (
        <section className="relative z-10 pb-16 lg:pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {loading ? (
              <FeaturedSkeleton />
            ) : featuredPost ? (
              <FeaturedCard post={featuredPost} />
            ) : null}
          </div>
        </section>
      )}

      {/* ============ POSTS GRID ============ */}
      <section className="relative z-10 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {!loading && featuredPost && gridPosts.length > 0 && (
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Latest articles
              </h2>
              <span className="text-xs text-slate-500 dark:text-[#78736D]">
                {gridPosts.length} {gridPosts.length === 1 ? 'post' : 'posts'}
              </span>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-24 max-w-md mx-auto">
              <div className="w-12 h-12 mx-auto mb-5 rounded-full bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-slate-400 dark:text-[#78736D]" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                No posts to show
              </h3>
              <p className="text-sm text-slate-500 dark:text-[#A8A29E] mb-5">
                {search
                  ? `Nothing matches "${search}". Try a different keyword.`
                  : `No posts in "${activeCategory}" yet. Check back soon.`}
              </p>
              {(activeCategory !== 'All' || search) && (
                <button
                  onClick={() => {
                    setActiveCategory('All');
                    setSearch('');
                  }}
                  className="text-brand-600 dark:text-brand-400 text-sm font-semibold hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : gridPosts.length === 0 ? null : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
              {gridPosts.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ NEWSLETTER CTA ============ */}
      {!loading && filteredPosts.length > 0 && (
        <section className="relative z-10 pb-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-white/[0.06] bg-gradient-to-br from-slate-50 via-white to-brand-50/40 dark:from-[#232220] dark:via-[#1F1E1B] dark:to-[#2A201C] p-8 sm:p-12 text-center">
              <div
                className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.08]"
                style={{ background: 'var(--brand-500)', filter: 'blur(120px)' }}
              />
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                  New posts, in your inbox.
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-[#A8A29E] max-w-md mx-auto mb-6">
                  Get our latest writing on accounting, AI, and small business — twice a week. No spam.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5"
                >
                  Get a free account
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ FOOTER ============ */}
      <footer className="relative z-10 py-8 border-t border-slate-200/60 dark:border-[#2D2B28]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <FlowBooksLogo size="xs" />
            <p className="text-slate-500 dark:text-[#A8A29E] text-xs">
              &copy; {new Date().getFullYear()} Flowbooks Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#A8A29E]">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              System Operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
