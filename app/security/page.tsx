'use client';
import React from 'react';
import { Moon, Sun, Home, Shield, Lock, Server, Key, CheckCircle, AlertTriangle, RefreshCw, Eye, FileCheck, Cloud, Fingerprint } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import FlowBooksLogo from '@/components/FlowBooksLogo';

const securityFeatures = [
  {
    icon: Lock,
    title: 'Encryption',
    subtitle: '256-bit AES',
    description: 'All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Encryption keys are managed through a dedicated key management service with automatic rotation every 90 days.',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200/60 dark:border-blue-800/30',
    highlights: ['TLS 1.3 in transit', 'AES-256 at rest', '90-day key rotation'],
  },
  {
    icon: Server,
    title: 'Infrastructure',
    subtitle: 'Enterprise-grade',
    description: 'Our platform runs on SOC 2 Type II certified cloud infrastructure with multi-region redundancy. We employ network segmentation, Web Application Firewalls (WAF), and DDoS protection across all endpoints.',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-200/60 dark:border-purple-800/30',
    highlights: ['SOC 2 Type II certified', 'Multi-region redundancy', 'DDoS protection'],
  },
  {
    icon: Key,
    title: 'Access Controls',
    subtitle: 'Zero-trust model',
    description: 'We follow a zero-trust security model. All internal access requires multi-factor authentication, role-based permissions, and is logged with complete audit trails. Production access is limited to a small, vetted team.',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200/60 dark:border-amber-800/30',
    highlights: ['Multi-factor authentication', 'Role-based access', 'Complete audit trails'],
  },
  {
    icon: RefreshCw,
    title: 'Data Backups',
    subtitle: 'Continuous & redundant',
    description: 'Your data is continuously backed up with point-in-time recovery capabilities. Backups are stored in geographically separate locations with the same encryption standards as primary data. We test backup restoration procedures monthly.',
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-200/60 dark:border-emerald-800/30',
    highlights: ['Point-in-time recovery', 'Geo-redundant storage', 'Monthly restoration tests'],
  },
  {
    icon: CheckCircle,
    title: 'Compliance',
    subtitle: 'Industry standards',
    description: 'Flowbooks is designed with regulatory compliance in mind. We adhere to GDPR, CCPA, and SOC 2 requirements. Our data processing agreements ensure your data is handled in accordance with applicable privacy regulations worldwide.',
    color: 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400',
    borderColor: 'border-brand-200/60 dark:border-brand-800/30',
    highlights: ['GDPR compliant', 'CCPA compliant', 'SOC 2 aligned'],
  },
  {
    icon: AlertTriangle,
    title: 'Incident Response',
    subtitle: '24/7 monitoring',
    description: 'Our security team monitors systems 24/7 with automated threat detection and alerting. We maintain a documented incident response plan with defined escalation procedures. Any security incidents affecting customer data are communicated within 72 hours.',
    color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-200/60 dark:border-rose-800/30',
    highlights: ['24/7 monitoring', 'Automated threat detection', '72-hour notification SLA'],
  },
];

const additionalMeasures = [
  { icon: Fingerprint, text: 'Biometric and hardware key support for account authentication' },
  { icon: Eye, text: 'Regular third-party penetration testing and security audits' },
  { icon: FileCheck, text: 'Secure software development lifecycle (SSDLC) practices' },
  { icon: Cloud, text: 'AI data processing with strict data isolation - your data is never used for model training' },
  { icon: Shield, text: 'Bug bounty program for responsible vulnerability disclosure' },
  { icon: Lock, text: 'Automatic session expiration and suspicious login detection' },
];

export default function SecurityPage() {
  const { mode, toggleMode } = useTheme();

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

      {/* Navbar */}
      <nav className="sticky top-0 z-50 py-1.5 bg-white/70 dark:bg-[#1A1915]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/[0.06] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <FlowBooksLogo size="sm" />
              </Link>
            </div>
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

      {/* Hero */}
      <section className="relative pt-16 pb-12">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-[0.08] blur-[100px] pointer-events-none"
          style={{ background: 'var(--brand-500)' }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50/80 dark:bg-brand-500/10 border border-brand-200/60 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 text-xs font-medium mb-5">
            <Shield className="w-3 h-3" />
            ENTERPRISE-GRADE SECURITY
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight mb-5">
            Your financial data{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              deserves the best protection
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-[#A8A29E] max-w-2xl mx-auto leading-relaxed">
            We treat security as a core product feature, not an afterthought. Every layer of Flowbooks is built with bank-grade security measures to keep your data safe.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            {[
              { label: '256-bit AES', sub: 'Encryption' },
              { label: 'SOC 2', sub: 'Type II' },
              { label: 'GDPR', sub: 'Compliant' },
              { label: '99.99%', sub: 'Uptime SLA' },
            ].map((badge, i) => (
              <div key={i} className="px-4 py-2.5 rounded-xl bg-slate-50/80 dark:bg-[#232220] border border-slate-200/60 dark:border-[#3D3A37] text-center">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{badge.label}</div>
                <div className="text-[11px] text-slate-500 dark:text-[#78736D]">{badge.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Feature Cards */}
      <section className="relative z-10 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {securityFeatures.map((feature, i) => (
              <div
                key={i}
                className={`bg-white dark:bg-[#232220] border border-slate-200/60 dark:border-[#3D3A37] rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
              >
                <div className={`w-11 h-11 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${feature.color} border ${feature.borderColor}`}>
                    {feature.subtitle}
                  </span>
                </div>
                <p className="text-[13px] text-slate-600 dark:text-[#A8A29E] leading-relaxed mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-1.5">
                  {feature.highlights.map((h, j) => (
                    <li key={j} className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-[#DBD8D0]">
                      <CheckCircle className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Measures */}
      <section className="relative z-10 py-16 bg-slate-50/50 dark:bg-[#232220]/30 border-y border-slate-200 dark:border-[#2D2B28]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Additional Security Measures</h2>
            <p className="text-sm text-slate-600 dark:text-[#A8A29E]">Beyond the fundamentals, we go further to protect your business.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {additionalMeasures.map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-white dark:bg-[#232220] p-4 rounded-xl border border-slate-200/60 dark:border-[#3D3A37]">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <p className="text-sm text-slate-700 dark:text-[#DBD8D0] leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Have security questions?</h2>
          <p className="text-sm text-slate-600 dark:text-[#A8A29E] mb-6">
            Our security team is happy to answer any questions about how we protect your data. For responsible disclosure of vulnerabilities, please contact us directly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/contact"
              className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5"
            >
              Contact Security Team
            </Link>
            <a
              href="mailto:security@flowbooks.com"
              className="px-6 py-2.5 rounded-lg font-semibold text-sm text-slate-700 dark:text-[#DBD8D0] bg-slate-100/80 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08] hover:bg-slate-200/60 dark:hover:bg-white/[0.1] transition-all"
            >
              security@flowbooks.com
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-50 dark:bg-[#232220]/50 py-8 border-t border-slate-200 dark:border-[#2D2B28]">
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
