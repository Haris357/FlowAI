'use client';
import React, { useState, useEffect } from 'react';
import { Moon, Sun, Shield, Eye, Database, Globe, UserCheck, Cookie, Bell, Mail, CreditCard, Info, BookOpen, ArrowRight, ChevronDown, LayoutDashboard, Menu, X, Lock, FileText, MessageCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import FlowBooksLogo from '@/components/FlowBooksLogo';

const sections = [
  {
    id: 'information-we-collect',
    icon: Database,
    title: '1. Information We Collect',
    content: `We collect information you provide directly to us when you create an account, use our services, or communicate with us. This includes:

**Account Information:** Your name, email address, company name, and billing address when you register for a Flowbooks account.

**Financial Data:** Transaction records, invoices, expense entries, customer and vendor details, and other bookkeeping data you input or generate through our platform. This data is yours and is stored solely to provide you with our services.

**Usage Data:** Information about how you interact with our platform, including features used, pages visited, AI queries made, and session duration. We collect this to improve our product experience.

**Device & Technical Data:** IP address, browser type, operating system, device identifiers, and log data. This is collected automatically when you access Flowbooks.

**Communications:** Any messages, feedback, or support requests you send to us.`,
  },
  {
    id: 'how-we-use',
    icon: Eye,
    title: '2. How We Use Your Information',
    content: `We use the information we collect for the following purposes:

**Providing Services:** To operate, maintain, and improve Flowbooks, including processing your financial data through our AI engine, generating reports, and creating invoices on your behalf.

**Personalization:** To tailor the AI experience to your business context, learn your categorization preferences, and provide more accurate suggestions over time.

**Billing & Account Management:** To process subscription payments, manage your account, and send transactional communications such as receipts and renewal notices.

**Security & Fraud Prevention:** To detect, investigate, and prevent fraudulent transactions, unauthorized access, and other illegal activities.

**Product Improvement:** To analyze usage patterns, diagnose technical issues, and develop new features. We may use aggregated, anonymized data for analytics and benchmarking.

**Legal Compliance:** To comply with applicable laws, regulations, and legal processes.`,
  },
  {
    id: 'data-security',
    icon: Shield,
    title: '3. Data Security',
    content: `We take the security of your data extremely seriously. Flowbooks implements industry-standard security measures to protect your information:

**Encryption in Transit:** All data transmitted between your browser and our servers is encrypted using TLS 1.3 with 256-bit AES encryption.

**Encryption at Rest:** Your financial data is encrypted at rest using AES-256 encryption. Encryption keys are managed through a dedicated key management service and rotated regularly.

**Infrastructure:** Our services are hosted on enterprise-grade cloud infrastructure with SOC 2 Type II certification. We employ network segmentation, firewalls, and intrusion detection systems.

**Access Controls:** Access to production data is restricted to authorized personnel only, enforced through multi-factor authentication and role-based access controls. All access is logged and audited.

**Regular Audits:** We conduct regular security assessments, penetration testing, and vulnerability scans to identify and address potential risks.

While no method of transmission or storage is 100% secure, we are committed to protecting your data using commercially reasonable measures.`,
  },
  {
    id: 'third-party',
    icon: Globe,
    title: '4. Third-Party Services',
    content: `We may share your information with third-party service providers who assist us in operating our platform. These providers are contractually obligated to handle your data securely and only for the purposes we specify:

**Payment Processors:** We use Stripe to process subscription payments. Stripe handles your payment card information directly; we do not store your full card details on our servers.

**Cloud Infrastructure:** Our platform is hosted on secure cloud infrastructure providers that maintain industry-leading security certifications.

**AI Services:** We use large language model providers to power our AI features. Your financial data sent to these services is processed in real time and is not used to train their models. We have data processing agreements in place with all AI providers.

**Analytics:** We use privacy-respecting analytics tools to understand how our platform is used. Data is aggregated and anonymized where possible.

**Email Services:** Transactional emails (invoices, notifications) are sent through third-party email providers.

We do not sell, rent, or trade your personal information to third parties for their marketing purposes.`,
  },
  {
    id: 'your-rights',
    icon: UserCheck,
    title: '5. Your Rights',
    content: `Depending on your jurisdiction, you may have the following rights regarding your personal data:

**Access:** You can request a copy of the personal data we hold about you at any time through your account settings or by contacting us.

**Correction:** You can update or correct inaccurate information directly in your Flowbooks account.

**Deletion:** You can request deletion of your account and associated data. Upon request, we will delete your data within 30 days, except where we are required to retain it for legal or compliance purposes.

**Data Portability:** You can export all your financial data from Flowbooks at any time in CSV, PDF, or Excel formats. We believe in data portability and will never hold your data hostage.

**Opt-Out:** You can opt out of non-essential communications at any time by updating your notification preferences or clicking the unsubscribe link in our emails.

**Restriction:** You can request that we restrict processing of your data in certain circumstances.

To exercise any of these rights, contact us at hello@flowbooksai.com.`,
  },
  {
    id: 'cookies',
    icon: Cookie,
    title: '6. Cookies & Tracking Technologies',
    content: `Flowbooks uses cookies and similar technologies to provide, secure, and improve our services:

**Essential Cookies:** Required for the platform to function. These handle authentication, session management, and security tokens. You cannot opt out of these.

**Preference Cookies:** Store your settings such as theme preference (light/dark mode), language, and display options.

**Analytics Cookies:** Help us understand how users interact with our platform so we can improve the experience. These cookies collect anonymized usage data.

We do not use advertising or tracking cookies. We do not participate in cross-site tracking networks.

You can manage cookie preferences through your browser settings. Note that disabling essential cookies may prevent you from using certain features of Flowbooks.`,
  },
  {
    id: 'changes',
    icon: Bell,
    title: '7. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will:

- Notify you via email at least 30 days before the changes take effect
- Display a prominent notice within the Flowbooks application
- Update the "Last Updated" date at the top of this page

We encourage you to review this Privacy Policy periodically. Your continued use of Flowbooks after changes become effective constitutes your acceptance of the revised policy.

For significant changes that materially affect how we handle your data, we will seek your explicit consent where required by law.`,
  },
  {
    id: 'contact',
    icon: Mail,
    title: '8. Contact Us',
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

**Email:** hello@flowbooksai.com
**General Support:** hello@flowbooksai.com
**Mailing Address:** Flowbooks Inc., 548 Market Street, Suite 36879, San Francisco, CA 94104, United States

We aim to respond to all privacy-related inquiries within 5 business days.

If you are located in the European Economic Area and believe we have not adequately addressed your data protection concerns, you have the right to lodge a complaint with your local data protection authority.`,
  },
];

export default function PrivacyPage() {
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
      {/* Dot Pattern + Gradient Blobs Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 0.5px, transparent 0.5px)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div
          className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full opacity-[0.04] dark:opacity-[0.03]"
          style={{ background: 'var(--brand-500)', filter: 'blur(150px)', transform: 'translate(30%, -40%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-[0.03] dark:opacity-[0.02]"
          style={{ background: 'var(--brand-500)', filter: 'blur(150px)', transform: 'translate(-30%, 40%)' }}
        />
      </div>

      {/* ============ NAVBAR ============ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'py-1.5 liquid-glass-strong'
            : 'py-3 bg-transparent'
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

      {/* Hero */}
      <section className="relative pt-32 pb-10">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[250px] rounded-full opacity-[0.08] blur-[100px] pointer-events-none"
          style={{ background: 'var(--brand-500)' }}
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50/80 dark:bg-brand-500/10 border border-brand-200/60 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 text-xs font-medium mb-5">
            <Shield className="w-3 h-3" />
            YOUR PRIVACY MATTERS
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-base text-slate-600 dark:text-[#A8A29E] leading-relaxed">
            Last updated: February 20, 2026. This policy describes how Flowbooks Inc. collects, uses, and protects your personal information.
          </p>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="relative z-10 pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="liquid-glass-subtle rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Table of Contents</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex items-center gap-2 text-[13px] text-slate-600 dark:text-[#A8A29E] hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                    <s.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="relative z-10 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
          {sections.map((s) => (
            <div key={s.id} id={s.id} className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg liquid-glass-subtle flex items-center justify-center flex-shrink-0">
                  <s.icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{s.title}</h2>
              </div>
              <div className="prose-sm max-w-none">
                {s.content.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-sm text-slate-600 dark:text-[#A8A29E] leading-relaxed mb-3 whitespace-pre-line">
                    {paragraph.split('**').map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j} className="text-slate-800 dark:text-[#EEECE8] font-semibold">{part}</strong>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
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
