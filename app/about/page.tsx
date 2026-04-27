'use client';
import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Moon,
  Sun,
  ArrowRight,
  Lightbulb,
  Minimize2,
  Shield,
  Heart,
  Target,
  Users,
  BarChart3,
  Zap,
  BookOpen,
  CreditCard,
  MessageCircle,
  ChevronDown,
  Lock,
  FileText,
  Info,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import FlowBooksLogo from '@/components/FlowBooksLogo';

const values = [
  {
    icon: Lightbulb,
    title: 'Innovation',
    description:
      'Accounting should evolve with technology. By putting AI at the core of everything we build, we turn traditionally complex financial tasks into intuitive conversations.',
  },
  {
    icon: Minimize2,
    title: 'Simplicity',
    description:
      'Great software disappears into the workflow. We obsess over removing friction so business owners can focus on what they do best — not wrestling with spreadsheets and ledgers.',
  },
  {
    icon: Shield,
    title: 'Security',
    description:
      'Financial data is some of the most sensitive information a business holds. We treat its protection as a non-negotiable priority with 256-bit AES encryption and strict access controls.',
  },
  {
    icon: Heart,
    title: 'Trust',
    description:
      'We earn trust through transparency. From our clear pricing to our privacy practices, you should always know exactly how your data is handled and what you are paying for.',
  },
];

const stats = [
  { value: '10,000+', label: 'Businesses served' },
  { value: '2M+', label: 'Invoices generated' },
  { value: '99.99%', label: 'Platform uptime' },
  { value: '4.9/5', label: 'Average rating' },
];

const story = [
  {
    number: '01',
    title: 'The problem we saw',
    body:
      'As small business owners ourselves, we experienced firsthand how painful traditional accounting software could be. The interfaces were built for CPAs, not entrepreneurs. Simple tasks like recording an expense or sending an invoice required navigating layers of menus and understanding accounting jargon. We watched friends avoid their books entirely — leading to tax-season panic and missed financial insights.',
  },
  {
    number: '02',
    title: 'The breakthrough',
    body:
      'When large language models became powerful enough to truly understand context and intent, we realized we could reimagine accounting from scratch. Instead of forcing users to learn the software, we could build software that understands the user. The concept was simple: what if managing your finances was as easy as texting a friend? That idea became Flowbooks.',
  },
  {
    number: '03',
    title: 'Where we are today',
    body:
      'Flowbooks now serves thousands of businesses worldwide, from solo freelancers to growing startups. Our users have generated millions of invoices, tracked countless expenses, and gained real-time financial clarity — all through simple conversation. We are a small, focused team of engineers, designers, and finance people working to make business finance accessible to everyone.',
  },
];

export default function AboutPage() {
  const { user } = useAuth();
  const { mode, toggleMode } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
              <Link href="/about" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-900 dark:text-white rounded-full bg-white dark:bg-white/[0.06] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />About
              </Link>
              <Link href="/blog" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-all flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />Blog
              </Link>
              <Link href="/contact" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-all flex items-center gap-1.5">
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
            <Link href="/about" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white rounded-xl bg-slate-100/60 dark:bg-white/[0.04]"><Info className="w-[18px] h-[18px]" />About</Link>
            <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"><BookOpen className="w-[18px] h-[18px]" />Blog</Link>
            <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"><MessageCircle className="w-[18px] h-[18px]" />Contact</Link>
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
      <section className="relative pt-32 pb-12 lg:pt-40 lg:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50/80 dark:bg-brand-500/10 border border-brand-200/60 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 text-xs font-medium mb-5">
              <Sparkles className="w-3 h-3" />
              About Flowbooks
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.05] mb-6">
              Accounting should be as easy as sending a text.
            </h1>
            <p className="text-lg text-slate-600 dark:text-[#A8A29E] leading-relaxed max-w-2xl">
              Flowbooks is an AI-first accounting platform built for small businesses and freelancers. We started it because the tools we had to use as founders ourselves felt designed for accountants, not the people running the business.
            </p>
          </div>
        </div>
      </section>

      {/* ============ MISSION ============ */}
      <section className="relative z-10 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-24">
                <div className="inline-flex items-center gap-2 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-200/40 dark:border-brand-500/15 flex items-center justify-center">
                    <Target className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#78736D]">
                    Our Mission
                  </p>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Democratize financial management for everyone running a business.
                </h2>
              </div>
            </div>
            <div className="lg:col-span-7 space-y-6">
              <p className="text-base sm:text-[17px] leading-[1.75] text-slate-700 dark:text-[#CCCCBB]">
                Every entrepreneur deserves access to professional-grade accounting tools without the steep learning curve or the high price tag.
              </p>
              <p className="text-base sm:text-[17px] leading-[1.75] text-slate-700 dark:text-[#CCCCBB]">
                Our AI-first approach means you interact with your finances the same way you talk to a colleague. Tell Flowbooks what you need in plain English and it handles the rest — categorizing expenses, generating invoices, reconciling accounts, producing reports.
              </p>
              <p className="text-base sm:text-[17px] leading-[1.75] text-slate-700 dark:text-[#CCCCBB]">
                We are building the future of bookkeeping — one where the software works for you, not the other way around.
              </p>

              <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: Users, label: 'Built for non-accountants', desc: 'No jargon, no complexity' },
                  { icon: Zap, label: 'AI-powered efficiency', desc: 'Tasks in seconds, not hours' },
                  { icon: BarChart3, label: 'Real-time insights', desc: 'Always know where you stand' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] p-4"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-200/40 dark:border-brand-500/15 flex items-center justify-center mb-3">
                      <item.icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div className="text-[13px] font-semibold text-slate-900 dark:text-white">{item.label}</div>
                    <div className="text-[12px] text-slate-500 dark:text-[#78736D] mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ VALUES ============ */}
      <section className="relative z-10 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#78736D] mb-3">
              What we stand for
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
              Four values guide every decision.
            </h2>
            <p className="text-base text-slate-600 dark:text-[#A8A29E]">
              From the features we build to how we handle your data, these are the principles we won't compromise on.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-200/70 dark:bg-white/[0.06] rounded-2xl overflow-hidden border border-slate-200/70 dark:border-white/[0.06]">
            {values.map((value, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#1A1915] p-7 lg:p-8 flex flex-col"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200/40 dark:border-brand-500/15 flex items-center justify-center mb-5">
                  <value.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                  {value.title}
                </h3>
                <p className="text-[14.5px] text-slate-600 dark:text-[#A8A29E] leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STORY ============ */}
      <section className="relative z-10 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#78736D] mb-3">
              Our story
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              How Flowbooks came to be.
            </h2>
          </div>
          <div className="max-w-3xl space-y-12">
            {story.map((item, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[80px_1fr] gap-6">
                <div>
                  <div className="text-3xl font-bold text-brand-500 dark:text-brand-400 tracking-tight">
                    {item.number}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-base leading-[1.75] text-slate-700 dark:text-[#CCCCBB]">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative z-10 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-8 sm:p-14 shadow-2xl shadow-brand-500/20">
            <div
              className="absolute -top-32 -right-20 w-[400px] h-[400px] rounded-full"
              style={{ background: '#fff', filter: 'blur(120px)', opacity: 0.15 }}
            />
            <div className="relative max-w-xl">
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight tracking-tight mb-4">
                Ready to simplify your finances?
              </h2>
              <p className="text-base sm:text-lg text-white/80 mb-7 leading-relaxed">
                Join thousands of businesses that have already made the switch to AI-powered bookkeeping. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-brand-700 bg-white hover:bg-slate-50 shadow-lg transition-all hover:-translate-y-0.5"
                >
                  Get started free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white border border-white/25 hover:bg-white/10 transition-all"
                >
                  Talk to us
                </Link>
              </div>
            </div>
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
