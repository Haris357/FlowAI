'use client';
import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Shield,
  Lock,
  Server,
  Key,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  FileCheck,
  Cloud,
  Fingerprint,
  CreditCard,
  Info,
  BookOpen,
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  Menu,
  X,
  FileText,
  MessageCircle,
  Mail,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import FlowBooksLogo from '@/components/FlowBooksLogo';

const trustBadges = [
  { label: '256-bit AES', sub: 'Encryption' },
  { label: 'SOC 2', sub: 'Type II aligned' },
  { label: 'GDPR', sub: 'Compliant' },
  { label: '99.99%', sub: 'Uptime SLA' },
];

const securityPillars = [
  {
    icon: Lock,
    title: 'Encryption',
    subtitle: '256-bit AES',
    description:
      'All data is encrypted in transit using TLS 1.3 and at rest using AES-256. Encryption keys are managed through a dedicated key-management service with automatic rotation every 90 days.',
    highlights: ['TLS 1.3 in transit', 'AES-256 at rest', '90-day key rotation'],
  },
  {
    icon: Server,
    title: 'Infrastructure',
    subtitle: 'Enterprise-grade',
    description:
      'Our platform runs on SOC 2 Type II certified cloud infrastructure with multi-region redundancy. We employ network segmentation, web application firewalls, and DDoS protection across all endpoints.',
    highlights: ['SOC 2 Type II certified', 'Multi-region redundancy', 'DDoS protection'],
  },
  {
    icon: Key,
    title: 'Access controls',
    subtitle: 'Zero-trust',
    description:
      'We follow a zero-trust security model. All internal access requires multi-factor authentication, role-based permissions, and is logged with complete audit trails. Production access is limited to a small, vetted team.',
    highlights: ['Multi-factor authentication', 'Role-based access', 'Complete audit trails'],
  },
  {
    icon: RefreshCw,
    title: 'Backups',
    subtitle: 'Continuous',
    description:
      'Your data is continuously backed up with point-in-time recovery. Backups are stored in geographically separate locations with the same encryption standards as primary data. We test restoration procedures monthly.',
    highlights: ['Point-in-time recovery', 'Geo-redundant storage', 'Monthly restoration tests'],
  },
  {
    icon: CheckCircle2,
    title: 'Compliance',
    subtitle: 'Industry standards',
    description:
      'Flowbooks is designed with regulatory compliance in mind. We adhere to GDPR, CCPA, and SOC 2 requirements. Our data processing agreements ensure your data is handled in accordance with applicable privacy regulations worldwide.',
    highlights: ['GDPR compliant', 'CCPA compliant', 'SOC 2 aligned'],
  },
  {
    icon: AlertTriangle,
    title: 'Incident response',
    subtitle: '24/7 monitoring',
    description:
      'Our security team monitors systems around the clock with automated threat detection and alerting. We maintain a documented incident response plan with defined escalation procedures. Security incidents affecting customer data are communicated within 72 hours.',
    highlights: ['24/7 monitoring', 'Automated threat detection', '72-hour notification SLA'],
  },
];

const additionalMeasures = [
  { icon: Fingerprint, text: 'Biometric and hardware key support for account authentication' },
  { icon: Eye, text: 'Regular third-party penetration testing and security audits' },
  { icon: FileCheck, text: 'Secure software development lifecycle (SSDLC) practices' },
  { icon: Cloud, text: 'AI data isolation — your data is never used for model training' },
  { icon: Shield, text: 'Bug bounty program for responsible vulnerability disclosure' },
  { icon: Lock, text: 'Automatic session expiration and suspicious-login detection' },
];

export default function SecurityPage() {
  const { user } = useAuth();
  const { mode, toggleMode } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
              <Link href="/about" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-all flex items-center gap-1.5">
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
                    <Link href="/security" className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-slate-900 dark:text-white rounded-xl bg-slate-50 dark:bg-white/[0.04]">
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
            <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"><MessageCircle className="w-[18px] h-[18px]" />Contact</Link>
            <hr className="border-slate-200/60 dark:border-white/[0.06] my-2" />
            <p className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#5C5752]">Legal</p>
            <Link href="/privacy" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"><Shield className="w-[18px] h-[18px]" />Privacy Policy</Link>
            <Link href="/terms" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"><FileText className="w-[18px] h-[18px]" />Terms of Service</Link>
            <Link href="/security" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white rounded-xl bg-slate-100/60 dark:bg-white/[0.04]"><Lock className="w-[18px] h-[18px]" />Security</Link>
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
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50/80 dark:bg-brand-500/10 border border-brand-200/60 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 text-xs font-medium mb-5">
              <Shield className="w-3 h-3" />
              Security
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.05] mb-6">
              Built around your financial data.
            </h1>
            <p className="text-lg text-slate-600 dark:text-[#A8A29E] leading-relaxed max-w-2xl">
              We treat security as a core product feature, not an afterthought. Every layer of Flowbooks — from the first encryption byte to the on-call rotation — is built to keep your business data safe.
            </p>
          </div>
        </div>
      </section>

      {/* ============ TRUST STRIP ============ */}
      <section className="relative z-10 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200/70 dark:bg-white/[0.06] rounded-2xl overflow-hidden border border-slate-200/70 dark:border-white/[0.06]">
            {trustBadges.map((badge, i) => (
              <div key={i} className="bg-white dark:bg-[#1A1915] px-6 py-7 flex flex-col items-start">
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">
                  {badge.label}
                </div>
                <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-[#78736D] font-medium">
                  {badge.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SECURITY PILLARS ============ */}
      <section className="relative z-10 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#78736D] mb-3">
              Security pillars
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
              Six layers protecting your data, every second.
            </h2>
            <p className="text-base text-slate-600 dark:text-[#A8A29E]">
              Not a feature list — these are the foundations the rest of Flowbooks is built on.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200/70 dark:bg-white/[0.06] rounded-2xl overflow-hidden border border-slate-200/70 dark:border-white/[0.06]">
            {securityPillars.map((feature, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#1A1915] p-7 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200/40 dark:border-brand-500/15 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#78736D]">
                    {feature.subtitle}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                  {feature.title}
                </h3>
                <p className="text-[14px] text-slate-600 dark:text-[#A8A29E] leading-relaxed mb-5">
                  {feature.description}
                </p>
                <ul className="mt-auto space-y-2 pt-5 border-t border-slate-200/70 dark:border-white/[0.05]">
                  {feature.highlights.map((h, j) => (
                    <li key={j} className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-[#DBD8D0]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ADDITIONAL MEASURES ============ */}
      <section className="relative z-10 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-24">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#78736D] mb-3">
                  Beyond the basics
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
                  We go further than the checklist.
                </h2>
                <p className="text-base text-slate-600 dark:text-[#A8A29E] leading-relaxed">
                  The fundamentals are table-stakes. These are the practices that make a real difference for the small businesses we serve.
                </p>
              </div>
            </div>
            <div className="lg:col-span-7">
              <ul className="divide-y divide-slate-200/70 dark:divide-white/[0.06] border-y border-slate-200/70 dark:border-white/[0.06]">
                {additionalMeasures.map((item, i) => (
                  <li key={i} className="flex items-start gap-4 py-5">
                    <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-200/40 dark:border-brand-500/15 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    </div>
                    <p className="text-[15px] text-slate-700 dark:text-[#CCCCBB] leading-[1.7] pt-1">
                      {item.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ DISCLOSURE / CTA ============ */}
      <section className="relative z-10 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Disclosure card */}
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] p-7 sm:p-9">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200/40 dark:border-brand-500/15 flex items-center justify-center mb-5">
                <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                Responsible disclosure
              </h3>
              <p className="text-[14.5px] text-slate-600 dark:text-[#A8A29E] leading-relaxed mb-5">
                Found a vulnerability? We'd rather hear from you than read about it later. Send a write-up to{' '}
                <a href="mailto:hello@flowbooksai.com" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  hello@flowbooksai.com
                </a>
                . We respond within one business day and work with researchers in good faith.
              </p>
              <div className="flex items-center gap-2 text-[12.5px] text-slate-500 dark:text-[#78736D]">
                <Mail className="w-3.5 h-3.5" />
                hello@flowbooksai.com
              </div>
            </div>

            {/* CTA card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-7 sm:p-9 shadow-2xl shadow-brand-500/20">
              <div
                className="absolute -top-20 -right-20 w-72 h-72 rounded-full"
                style={{ background: '#fff', filter: 'blur(80px)', opacity: 0.18 }}
              />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-5 border border-white/20">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white mb-3">
                  Have security questions?
                </h3>
                <p className="text-[14.5px] text-white/85 leading-relaxed mb-6">
                  We're happy to walk you through how we protect your data, share our compliance documentation, or sign a DPA for your business.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-brand-700 bg-white hover:bg-slate-50 shadow-lg transition-all hover:-translate-y-0.5"
                >
                  Talk to our security team
                  <ArrowRight className="w-4 h-4" />
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
