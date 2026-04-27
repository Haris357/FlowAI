'use client';
import React, { useState, useEffect } from 'react';
import { Moon, Sun, FileText, UserCheck, CreditCard, ShieldCheck, Lightbulb, Scale, XCircle, Landmark, Mail, Info, BookOpen, ArrowRight, ChevronDown, LayoutDashboard, Menu, X, Lock, Shield, MessageCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import FlowBooksLogo from '@/components/FlowBooksLogo';

const LAST_UPDATED = 'February 20, 2026';

const sections = [
  {
    id: 'acceptance',
    icon: FileText,
    title: '1. Acceptance of terms',
    content: `By accessing or using Flowbooks ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.

If you do not agree to these Terms, you may not access or use the Service. We reserve the right to update these Terms at any time. Material changes will be communicated via email or in-app notification at least 30 days in advance. Your continued use of the Service after changes take effect constitutes acceptance of the revised Terms.

These Terms constitute a legally binding agreement between you and Flowbooks Inc., a Delaware corporation ("Flowbooks," "we," "us," or "our").`,
  },
  {
    id: 'account-terms',
    icon: UserCheck,
    title: '2. Account terms',
    content: `**Eligibility:** You must be at least 18 years old and capable of forming a binding contract to use Flowbooks. The Service is intended for business and professional use.

**Account registration:** You must provide accurate, complete, and current information when creating your account. You are responsible for maintaining the accuracy of this information.

**Account security:** You are responsible for safeguarding your account credentials and for all activity that occurs under your account. You must notify us immediately at hello@flowbooksai.com if you suspect unauthorized access to your account.

**One person per account:** Accounts are for individual users. You may not share your login credentials with others. If you need multiple users, please use our collaboration features available on Pro and Max plans.

**Account responsibility:** You are solely responsible for all data, content, and activity in your account. Flowbooks is not liable for any loss or damage arising from your failure to maintain account security.`,
  },
  {
    id: 'payment-terms',
    icon: CreditCard,
    title: '3. Payment terms',
    content: `**Free plan:** Flowbooks offers a free tier with limited features. No payment information is required for the free plan.

**Paid subscriptions:** Pro and Max plans are billed monthly or annually in advance. Prices are listed on our pricing page and are subject to change with 30 days' notice.

**Payment processing:** All payments are processed securely through Lemon Squeezy. By providing payment information, you authorize us to charge your payment method for the applicable subscription fees.

**Automatic renewal:** Subscriptions automatically renew at the end of each billing period unless you cancel before the renewal date. You can cancel at any time from your account settings.

**Refunds:** If you cancel within 14 days of your initial subscription purchase, you may request a full refund. After 14 days, no refunds will be issued for the current billing period, but you will retain access until the end of that period.

**Taxes:** Subscription fees are exclusive of applicable taxes. You are responsible for any sales tax, VAT, or similar taxes imposed by your jurisdiction.

**Late payments:** If payment fails, we will attempt to charge your payment method up to three times over a 10-day period. If payment cannot be collected, your account may be downgraded to the free plan.`,
  },
  {
    id: 'acceptable-use',
    icon: ShieldCheck,
    title: '4. Acceptable use',
    content: `You agree to use Flowbooks only for lawful purposes and in accordance with these Terms. You may not:

- Use the Service for any illegal activity, including money laundering, tax evasion, or fraud
- Attempt to gain unauthorized access to any part of the Service, other accounts, or computer systems
- Upload or transmit viruses, malware, or any other malicious code
- Interfere with or disrupt the Service, servers, or networks connected to the Service
- Reverse engineer, decompile, or disassemble any aspect of the Service
- Use automated tools (bots, scrapers, crawlers) to access the Service without our written consent
- Resell, sublicense, or redistribute the Service or any part of it
- Use the AI features to generate content that is harmful, misleading, or violates the rights of others
- Exceed the usage limits of your plan through automated or abusive means
- Impersonate any person or entity, or falsely represent your affiliation with any person or entity

We reserve the right to suspend or terminate accounts that violate these terms without prior notice.`,
  },
  {
    id: 'intellectual-property',
    icon: Lightbulb,
    title: '5. Intellectual property',
    content: `**Our property:** The Flowbooks platform — including its software, design, logos, trademarks, documentation, and all related intellectual property — is owned by Flowbooks Inc. and protected by copyright, trademark, and other intellectual property laws. These Terms do not grant you any right, title, or interest in our intellectual property.

**Your data:** You retain full ownership of all financial data, business records, and content you create or upload to Flowbooks. We do not claim any ownership rights over your data.

**License to us:** By using the Service, you grant us a limited, non-exclusive license to access, process, and store your data solely for the purpose of providing and improving the Service. This license terminates when you delete your data or close your account.

**AI-generated content:** Reports, summaries, and suggestions generated by our AI features based on your data are considered your content. However, the underlying AI models and algorithms remain our intellectual property.

**Feedback:** If you provide us with feedback, suggestions, or ideas about the Service, you grant us an unrestricted, perpetual, irrevocable license to use such feedback for any purpose without compensation to you.`,
  },
  {
    id: 'limitation-of-liability',
    icon: Scale,
    title: '6. Limitation of liability',
    content: `**Disclaimer of warranties:** The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.

**Not financial advice:** Flowbooks is an accounting and bookkeeping tool. The AI-generated insights, categorizations, and reports are provided for informational purposes only and do not constitute financial, tax, or legal advice. You should consult qualified professionals for financial and tax decisions.

**Limitation:** To the maximum extent permitted by law, Flowbooks Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenue, data, or business opportunities arising out of or related to your use of the Service.

**Cap on liability:** Our total aggregate liability to you for any claims arising from or related to these Terms or the Service shall not exceed the total amount you paid to Flowbooks in the twelve (12) months preceding the claim.

**Data accuracy:** While we strive for accuracy, we do not guarantee that AI-generated categorizations, calculations, or reports are error-free. You are responsible for reviewing and verifying all financial data and reports generated through the Service.

**Service availability:** We aim for high availability but do not guarantee uninterrupted access to the Service. We are not liable for any downtime, data loss, or interruptions caused by factors beyond our reasonable control.`,
  },
  {
    id: 'termination',
    icon: XCircle,
    title: '7. Termination',
    content: `**By you:** You may terminate your account at any time by navigating to Settings and selecting "Delete Account," or by contacting hello@flowbooksai.com. Upon termination, your subscription will not renew, and you will retain access until the end of your current billing period.

**By us:** We may suspend or terminate your account if you violate these Terms, engage in abusive behavior, fail to pay subscription fees, or if required by law. We will provide reasonable notice before termination unless immediate action is necessary to protect the Service or other users.

**Effect of termination:** Upon termination:

- Your right to access the Service ceases immediately (or at the end of your billing period, if you initiated the termination)
- We will retain your data for 30 days to allow you to export it, after which it will be permanently deleted
- Provisions of these Terms that by their nature should survive termination will remain in effect, including Intellectual Property, Limitation of Liability, and Governing Law sections

**Data export:** Before terminating your account, we strongly recommend exporting all your financial data. You can export data in CSV, PDF, and Excel formats from your account settings.`,
  },
  {
    id: 'governing-law',
    icon: Landmark,
    title: '8. Governing law',
    content: `These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.

**Dispute resolution:** Any disputes arising from or relating to these Terms or the Service shall first be addressed through good-faith negotiation. If a dispute cannot be resolved through negotiation within 30 days, it shall be submitted to binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules.

**Class action waiver:** You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.

**Jurisdiction:** For any matters not subject to arbitration, you consent to the exclusive jurisdiction of the state and federal courts located in Wilmington, Delaware.

**Severability:** If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.

**Entire agreement:** These Terms, together with our Privacy Policy and any applicable plan-specific terms, constitute the entire agreement between you and Flowbooks Inc. regarding the Service.`,
  },
  {
    id: 'contact',
    icon: Mail,
    title: '9. Contact information',
    content: `If you have questions about these Terms of Service, please contact us:

**Email:** hello@flowbooksai.com
**General support:** hello@flowbooksai.com
**Mailing address:** Flowbooks Inc., 548 Market Street, Suite 36879, San Francisco, CA 94104, United States

For urgent matters related to account security or data breaches, contact hello@flowbooksai.com.`,
  },
];

function RenderContent({ text }: { text: string }) {
  const blocks = text.split('\n\n');
  return (
    <>
      {blocks.map((block, bi) => {
        if (block.split('\n').every((l) => l.trim().startsWith('-'))) {
          return (
            <ul key={bi} className="my-5 space-y-2 pl-1">
              {block.split('\n').map((l, li) => {
                const item = l.replace(/^[-\s]+/, '');
                return (
                  <li
                    key={li}
                    className="relative pl-5 text-[15.5px] leading-[1.7] text-slate-700 dark:text-[#CCCCBB] before:content-[''] before:absolute before:left-0 before:top-[0.7em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-brand-500"
                  >
                    {renderInline(item)}
                  </li>
                );
              })}
            </ul>
          );
        }
        return (
          <p
            key={bi}
            className="my-5 text-[15.5px] leading-[1.75] text-slate-700 dark:text-[#CCCCBB] whitespace-pre-line"
          >
            {renderInline(block)}
          </p>
        );
      })}
    </>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function TermsPage() {
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
                    <Link href="/terms" className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-slate-900 dark:text-white rounded-xl bg-slate-50 dark:bg-white/[0.04]">
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
            <Link href="/terms" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white rounded-xl bg-slate-100/60 dark:bg-white/[0.04]"><FileText className="w-[18px] h-[18px]" />Terms of Service</Link>
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
      <section className="relative pt-32 pb-10 lg:pt-40 lg:pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50/80 dark:bg-brand-500/10 border border-brand-200/60 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 text-xs font-medium mb-5">
              <FileText className="w-3 h-3" />
              Legal
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.05] mb-5">
              Terms of Service
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-[#A8A29E] leading-relaxed">
              The terms that govern your use of Flowbooks. We've kept the language as plain as we can without losing legal precision.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-[#78736D]">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              Last updated: {LAST_UPDATED}
            </div>
          </div>
        </div>
      </section>

      {/* ============ TWO-COLUMN: TOC + CONTENT ============ */}
      <section className="relative z-10 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-12 lg:gap-16">
            {/* Sticky TOC */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#78736D] mb-3">
                  On this page
                </p>
                <nav className="space-y-1.5 border-l border-slate-200/70 dark:border-white/[0.06] pl-4">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block text-[13px] leading-snug text-slate-500 dark:text-[#A8A29E] hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Content */}
            <div className="max-w-2xl">
              <details className="lg:hidden mb-10 rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                  Table of contents
                  <ChevronDown className="w-4 h-4" />
                </summary>
                <ul className="px-4 pb-4 space-y-2 border-t border-slate-200/70 dark:border-white/[0.06] pt-3">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="text-[13px] text-slate-600 dark:text-[#A8A29E] hover:text-brand-600 dark:hover:text-brand-400">
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>

              <div className="space-y-14">
                {sections.map((s, idx) => (
                  <div key={s.id} id={s.id} className="scroll-mt-24">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-200/40 dark:border-brand-500/15 flex items-center justify-center flex-shrink-0">
                        <s.icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {s.title}
                      </h2>
                    </div>
                    <RenderContent text={s.content} />
                    {idx < sections.length - 1 && (
                      <div className="mt-14 h-px bg-slate-200/70 dark:bg-white/[0.06]" />
                    )}
                  </div>
                ))}
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
