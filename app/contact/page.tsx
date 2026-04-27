'use client';
import React, { useEffect, useState } from 'react';
import {
  Moon,
  Sun,
  Mail,
  MapPin,
  Phone,
  Send,
  MessageCircle,
  HelpCircle,
  FileText,
  Shield,
  CreditCard,
  ArrowUpRight,
  Info,
  BookOpen,
  ArrowRight,
  ChevronDown,
  Lock,
  LayoutDashboard,
  Menu,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import FlowBooksLogo from '@/components/FlowBooksLogo';

const faqLinks = [
  { icon: HelpCircle, title: 'Getting started', description: 'Set up your account and take your first steps.', href: '/#how-it-works' },
  { icon: CreditCard, title: 'Billing & plans', description: 'Pricing, upgrades, refunds, and invoices.', href: '/pricing' },
  { icon: Shield, title: 'Security & privacy', description: 'How we protect your data and handle information.', href: '/security' },
  { icon: FileText, title: 'Reports & exports', description: 'Generating financial reports and exporting data.', href: '/#features' },
];

const responseTimes = [
  { label: 'General inquiries', time: '< 24 hours' },
  { label: 'Technical support', time: '< 12 hours' },
  { label: 'Billing questions', time: '< 6 hours' },
  { label: 'Security issues', time: '< 2 hours' },
];

export default function ContactPage() {
  const { user } = useAuth();
  const { mode, toggleMode } = useTheme();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#1A1915] font-sans text-slate-900 dark:text-[#EEECE8] selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden text-[15px]">
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
              <Link href="/blog" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-all flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />Blog
              </Link>
              <Link href="/contact" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-900 dark:text-white rounded-full bg-white dark:bg-white/[0.06] flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />Contact
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
            <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"><BookOpen className="w-[18px] h-[18px]" />Blog</Link>
            <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white rounded-xl bg-slate-100/60 dark:bg-white/[0.04]"><MessageCircle className="w-[18px] h-[18px]" />Contact</Link>
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50/80 dark:bg-brand-500/10 border border-brand-200/60 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 text-xs font-medium mb-5">
              <MessageCircle className="w-3 h-3" />
              Get in touch
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.05] mb-5">
              We'd love to hear from you.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-[#A8A29E] leading-relaxed">
              A real person reads every message. Send a question, share feedback, or tell us where Flowbooks could be better — we usually reply within a business day.
            </p>
          </div>
        </div>
      </section>

      {/* ============ MAIN: FORM + SIDEBAR ============ */}
      <section className="relative z-10 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 lg:gap-12">
            {/* Form */}
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/[0.06] bg-white dark:bg-[#1F1E1B]/40 p-7 sm:p-9">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">
                Send us a message
              </h2>
              <p className="text-sm text-slate-500 dark:text-[#78736D] mb-7">
                Fill out the form and we'll get back to you as soon as possible.
              </p>

              {/* Success */}
              {submitted && (
                <div className="mb-6 p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-900/15 border border-emerald-200/70 dark:border-emerald-500/20 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      Message sent
                    </div>
                    <div className="text-[12.5px] text-emerald-700/80 dark:text-emerald-400/80">
                      We'll get back to you within 24 hours.
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 dark:text-[#DBD8D0] mb-1.5">
                      Full name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Alex Johnson"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#5C5752] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 dark:text-[#DBD8D0] mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#5C5752] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-700 dark:text-[#DBD8D0] mb-1.5">
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  >
                    <option value="">Choose a topic…</option>
                    <option value="general">General inquiry</option>
                    <option value="support">Technical support</option>
                    <option value="billing">Billing question</option>
                    <option value="feature">Feature request</option>
                    <option value="partnership">Partnership opportunity</option>
                    <option value="security">Security concern</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-700 dark:text-[#DBD8D0] mb-1.5">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Tell us how we can help…"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#5C5752] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="rounded-2xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] p-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#78736D] mb-4">
                  Reach us directly
                </p>
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#78736D]">
                        Email
                      </span>
                    </div>
                    <a
                      href="mailto:hello@flowbooksai.com"
                      className="text-sm font-semibold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      hello@flowbooksai.com
                    </a>
                    <p className="text-[12px] text-slate-500 dark:text-[#78736D] mt-1">
                      Replies within 24 hours
                    </p>
                  </div>
                  <div className="h-px bg-slate-200/70 dark:bg-white/[0.06]" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#78736D]">
                        Phone
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      +1 (415) 555-0132
                    </p>
                    <p className="text-[12px] text-slate-500 dark:text-[#78736D] mt-1">
                      Mon–Fri, 9am–6pm PT
                    </p>
                  </div>
                  <div className="h-px bg-slate-200/70 dark:bg-white/[0.06]" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#78736D]">
                        Office
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                      548 Market Street, Suite 36879
                      <br />
                      San Francisco, CA 94104
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] p-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#78736D] mb-4">
                  Average response times
                </p>
                <ul className="space-y-3">
                  {responseTimes.map((item) => (
                    <li key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-[#A8A29E]">{item.label}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {item.time}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ============ HELP TOPICS ============ */}
      <section className="relative z-10 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#78736D] mb-3">
              Looking for a quick answer?
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Skim our most popular topics first.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {faqLinks.map((faq, i) => (
              <Link
                key={i}
                href={faq.href}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] bg-white dark:bg-[#1F1E1B]/40 p-5 hover:border-slate-300 dark:hover:border-white/[0.12] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5 dark:hover:shadow-black/20 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200/40 dark:border-brand-500/15 flex items-center justify-center flex-shrink-0">
                  <faq.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-slate-900 dark:text-white mb-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {faq.title}
                  </div>
                  <div className="text-[13px] text-slate-500 dark:text-[#A8A29E]">
                    {faq.description}
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 dark:text-[#5C5752] group-hover:text-brand-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>

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
