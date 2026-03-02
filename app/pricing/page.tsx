'use client';
import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  ArrowRight,
  Moon,
  Sun,
  Plus,
  Minus,
  Menu,
  LayoutDashboard,
  Zap,
  BookOpen,
  Info,
  Mail,
  Lock,
  ChevronDown,
  FileText,
  Shield,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import FlowBooksLogo from '@/components/FlowBooksLogo';

// --- Accordion Item (Numbered style matching landing page) ---
const AccordionItem = ({
  question,
  answer,
  isOpen,
  onClick,
  index,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
  index: number;
}) => (
  <div
    className={`group rounded-2xl transition-all duration-300 ${
      isOpen
        ? 'liquid-glass shadow-lg shadow-slate-200/50 dark:shadow-black/20'
        : 'bg-transparent border border-transparent hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
    }`}
  >
    <button
      className="flex items-center justify-between w-full px-5 py-4 text-left focus:outline-none"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <span className={`text-xs font-mono font-bold transition-colors duration-300 ${isOpen ? 'text-brand-500' : 'text-slate-300 dark:text-[#3D3A37]'}`}>
          0{index + 1}
        </span>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{question}</span>
      </div>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-brand-500 rotate-0' : 'bg-slate-100 dark:bg-[#2D2B28]'}`}>
        {isOpen ? (
          <Minus className="w-3.5 h-3.5 text-white" />
        ) : (
          <Plus className="w-3.5 h-3.5 text-slate-400 dark:text-[#78736D]" />
        )}
      </div>
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
    >
      <p className="px-5 pb-5 pl-[52px] text-slate-600 dark:text-[#A8A29E] leading-relaxed text-sm">{answer}</p>
    </div>
  </div>
);

// --- Data ---

interface PricingPlan {
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  href: string;
}

const pricingPlans: PricingPlan[] = [
  {
    name: 'Free',
    monthlyPrice: '0',
    annualPrice: '0',
    description: 'Perfect for trying out Flowbooks.',
    features: [
      '1 company',
      '~100 AI messages/month',
      '10 customers & vendors',
      '5 invoices/month',
      'Basic reports (P&L)',
      'Community support',
    ],
    cta: 'Start Free',
    popular: false,
    href: '/signup',
  },
  {
    name: 'Pro',
    monthlyPrice: '29.99',
    annualPrice: '23.99',
    description: 'For growing businesses needing more power.',
    features: [
      '3 companies',
      '~1,000 AI messages/month',
      'Unlimited clients',
      'All financial reports',
      'Payroll & salary slips',
      'Custom branding',
      '3 collaborators',
      'Email support',
    ],
    cta: 'Start Free Trial',
    popular: true,
    href: '/signup?plan=pro',
  },
  {
    name: 'Max',
    monthlyPrice: '99.99',
    annualPrice: '79.99',
    description: 'Advanced features for established teams.',
    features: [
      '10 companies',
      '~4,000 AI messages/month',
      'Advanced AI capabilities',
      'Unlimited everything',
      'Unlimited collaborators',
      'Priority support',
      'Buy extra AI tokens',
    ],
    cta: 'Start Free Trial',
    popular: false,
    href: '/signup?plan=max',
  },
];

interface ComparisonRow {
  feature: string;
  free: string | boolean;
  pro: string | boolean;
  max: string | boolean;
}

const comparisonData: ComparisonRow[] = [
  { feature: 'Companies', free: '1', pro: '3', max: '10' },
  { feature: 'AI Messages', free: '~100/mo', pro: '~1,000/mo', max: '~4,000/mo' },
  { feature: 'Customers', free: '10', pro: 'Unlimited', max: 'Unlimited' },
  { feature: 'Invoices', free: '5/mo', pro: 'Unlimited', max: 'Unlimited' },
  { feature: 'Reports', free: 'P&L only', pro: 'All reports', max: 'All reports' },
  { feature: 'Payroll', free: false, pro: true, max: true },
  { feature: 'Collaborators', free: '0', pro: '3', max: 'Unlimited' },
  { feature: 'Email Sends', free: false, pro: '50/mo', max: 'Unlimited' },
  { feature: 'Chat History', free: '7 days', pro: '90 days', max: 'Unlimited' },
  { feature: 'Token Purchases', free: false, pro: true, max: true },
  { feature: 'Custom Branding', free: false, pro: true, max: true },
  { feature: 'Export PDF/Excel', free: false, pro: true, max: true },
];

const faqs = [
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes, you can upgrade or downgrade your plan at any time. When upgrading, you\'ll get immediate access to the new features. When downgrading, the change takes effect at the end of your current billing period.',
  },
  {
    q: 'What happens when I exceed my AI tokens?',
    a: 'When you reach your monthly AI message limit, messages will be limited until the next billing period. On Pro and Max plans, you can purchase additional token packs at any time to keep going without interruption.',
  },
  {
    q: 'Is there a free trial?',
    a: 'The Free plan is available forever with no credit card required. For Pro and Max plans, we offer a 14-day money-back guarantee so you can try all premium features risk-free.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Yes, we offer a full refund within 14 days of purchase, no questions asked. Simply reach out to our support team, and we\'ll process your refund promptly.',
  },
];

// --- Main Page ---
export default function PricingPage() {
  const { user } = useAuth();
  const { mode, toggleMode } = useTheme();
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(-1);
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getPrice = (plan: PricingPlan) => {
    if (plan.monthlyPrice === '0') return '0';
    return isAnnual ? plan.annualPrice : plan.monthlyPrice;
  };

  const getBillingLabel = () => (isAnnual ? '/month, billed annually' : '/month');

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#1A1915] font-sans text-slate-900 dark:text-[#EEECE8] selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden text-[15px]">
      {/* Dot Pattern + Gradient Blobs Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.015]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 0.5px, transparent 0.5px)',
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

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-0.5 liquid-glass-subtle rounded-full px-1.5 py-1">
              <Link href="/" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-all flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />Home
              </Link>
              <Link href="/about" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-all flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />About
              </Link>
              <Link href="/blog" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-all flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />Blog
              </Link>
              <Link href="/contact" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-all flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />Contact
              </Link>

              {/* More Dropdown */}
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

            {/* Desktop Right Actions */}
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

            {/* Mobile Right Actions */}
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

        {/* Mobile Menu */}
        <div
          className={`lg:hidden liquid-glass-strong overflow-hidden transition-all duration-300 ${
            isMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-4 space-y-1">
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"><CreditCard className="w-[18px] h-[18px]" />Home</Link>
            <Link href="/about" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"><Info className="w-[18px] h-[18px]" />About</Link>
            <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"><BookOpen className="w-[18px] h-[18px]" />Blog</Link>
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
      <section className="relative pt-28 pb-8 lg:pt-32 lg:pb-12">
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full opacity-[0.10] blur-[100px] pointer-events-none"
          style={{ background: 'var(--brand-500)' }}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50/80 dark:bg-brand-500/10 border border-brand-200/60 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 text-xs font-medium backdrop-blur-sm">
              <Zap className="w-3 h-3" />
              PRICING
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-5 max-w-3xl mx-auto">
            Simple,{' '}
            <span
              className="inline-block"
              style={{
                background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              transparent pricing
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-center text-base sm:text-lg text-slate-600 dark:text-[#A8A29E] max-w-xl mx-auto mb-4 leading-relaxed">
            Start free. Upgrade when you need more.
          </p>

          {/* Trust Markers */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-[#78736D]">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brand-500" /> No hidden fees
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brand-500" /> Cancel anytime
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brand-500" /> 14-day money-back guarantee
            </span>
          </div>
        </div>
      </section>

      {/* ============ PRICING TOGGLE ============ */}
      <section className="relative z-10 pb-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-3">
            <span
              className={`text-sm font-medium transition-colors ${
                !isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-[#78736D]'
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                isAnnual
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600'
                  : 'bg-slate-200 dark:bg-[#3D3A37]'
              }`}
              aria-label="Toggle annual billing"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                  isAnnual ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium transition-colors ${
                isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-[#78736D]'
              }`}
            >
              Annual
            </span>
            {isAnnual && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-700/30 animate-fade-in">
                Save 20%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ============ PRICING CARDS ============ */}
      <section className="relative z-10 py-8 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => {
              const price = getPrice(plan);
              const isFree = price === '0';

              return (
                <div
                  key={i}
                  className={`relative rounded-2xl transition-all duration-300 ${
                    plan.popular
                      ? 'lg:-mt-4 lg:mb-[-16px]'
                      : ''
                  }`}
                >
                  {/* Popular gradient border wrapper */}
                  {plan.popular && (
                    <div className="absolute -inset-[1.5px] rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 opacity-100" />
                  )}

                  <div
                    className={`relative rounded-2xl p-6 sm:p-7 h-full flex flex-col ${
                      plan.popular
                        ? 'liquid-glass-strong ring-2 ring-brand-500/20 shadow-2xl shadow-brand-500/10'
                        : 'liquid-glass hover:shadow-lg'
                    } transition-all duration-300`}
                  >
                    {/* Most Popular badge */}
                    {plan.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide shadow-lg shadow-brand-500/25">
                        Most Popular
                      </div>
                    )}

                    {/* Plan name */}
                    <h3
                      className={`text-lg font-bold mb-1.5 ${
                        plan.popular ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {plan.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-bold text-slate-900 dark:text-white">
                        ${price}
                      </span>
                      {!isFree && (
                        <span className="text-slate-500 dark:text-[#78736D] text-sm">
                          {getBillingLabel()}
                        </span>
                      )}
                    </div>

                    {/* Annual savings note */}
                    {!isFree && isAnnual && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-3">
                        Save ${((parseFloat(plan.monthlyPrice) - parseFloat(plan.annualPrice)) * 12).toFixed(0)}/year
                      </p>
                    )}
                    {(isFree || !isAnnual) && <div className="mb-3" />}

                    {/* Description */}
                    <p className="text-slate-500 dark:text-[#A8A29E] text-[13px] mb-6">
                      {plan.description}
                    </p>

                    {/* CTA Button */}
                    <Link
                      href={plan.href}
                      className={`w-full py-2.5 rounded-full font-semibold text-sm text-center transition-all duration-200 block mb-6 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5'
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 hover:-translate-y-0.5'
                      }`}
                    >
                      {plan.cta}
                    </Link>

                    {/* Feature list */}
                    <ul className="space-y-3 flex-1">
                      {plan.features.map((f, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-[#DBD8D0]"
                        >
                          <Check className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ FEATURE COMPARISON TABLE ============ */}
      <section className="relative z-10 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Compare plans in detail
            </h2>
            <p className="text-base text-slate-600 dark:text-[#A8A29E]">
              Every feature at a glance so you can pick the right plan.
            </p>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <div className="liquid-glass rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-white/[0.06]">
                    <th className="text-left text-[13px] font-semibold text-slate-500 dark:text-[#78736D] uppercase tracking-wider py-4 px-6 w-[40%]">
                      Feature
                    </th>
                    <th className="text-center text-[13px] font-semibold text-slate-500 dark:text-[#78736D] uppercase tracking-wider py-4 px-4 w-[20%]">
                      Free
                    </th>
                    <th className="text-center text-[13px] font-semibold uppercase tracking-wider py-4 px-4 w-[20%]">
                      <span className="text-brand-600 dark:text-brand-400">Pro</span>
                    </th>
                    <th className="text-center text-[13px] font-semibold text-slate-500 dark:text-[#78736D] uppercase tracking-wider py-4 px-4 w-[20%]">
                      Max
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-slate-100/60 dark:border-white/[0.03] last:border-0 ${
                        idx % 2 === 0 ? '' : 'bg-white/20 dark:bg-white/[0.01]'
                      }`}
                    >
                      <td className="py-3.5 px-6 text-sm font-medium text-slate-700 dark:text-[#DBD8D0]">
                        {row.feature}
                      </td>
                      {(['free', 'pro', 'max'] as const).map((planKey) => (
                        <td key={planKey} className="py-3.5 px-4 text-center">
                          {typeof row[planKey] === 'boolean' ? (
                            row[planKey] ? (
                              <Check className="w-4.5 h-4.5 text-brand-500 mx-auto" />
                            ) : (
                              <X className="w-4.5 h-4.5 text-slate-300 dark:text-[#454240] mx-auto" />
                            )
                          ) : (
                            <span
                              className={`text-sm ${
                                row[planKey] === 'Unlimited'
                                  ? 'font-semibold text-brand-600 dark:text-brand-400'
                                  : 'text-slate-600 dark:text-[#A8A29E]'
                              }`}
                            >
                              {row[planKey]}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Comparison */}
          <div className="md:hidden space-y-3">
            {comparisonData.map((row, idx) => (
              <div
                key={idx}
                className="liquid-glass rounded-xl p-4"
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  {row.feature}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['free', 'pro', 'max'] as const).map((planKey) => (
                    <div key={planKey} className="text-center">
                      <div className="text-[10px] font-semibold uppercase text-slate-400 dark:text-[#78736D] mb-1">
                        {planKey === 'free' ? 'Free' : planKey === 'pro' ? 'Pro' : 'Max'}
                      </div>
                      {typeof row[planKey] === 'boolean' ? (
                        row[planKey] ? (
                          <Check className="w-4 h-4 text-brand-500 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300 dark:text-[#454240] mx-auto" />
                        )
                      ) : (
                        <span
                          className={`text-xs ${
                            row[planKey] === 'Unlimited'
                              ? 'font-semibold text-brand-600 dark:text-brand-400'
                              : 'text-slate-600 dark:text-[#A8A29E]'
                          }`}
                        >
                          {row[planKey]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="relative z-10 py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-slate-600 dark:text-[#A8A29E]">
              Everything you need to know about our pricing.
            </p>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                question={faq.q}
                answer={faq.a}
                isOpen={openFaqIndex === index}
                onClick={() => setOpenFaqIndex(index === openFaqIndex ? -1 : index)}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section className="relative z-10 py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 shadow-2xl shadow-brand-500/20">
          <div className="absolute inset-0 backdrop-blur-sm" />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] transform translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/10 rounded-full blur-[80px] transform -translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10 px-6 py-16 md:py-20 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-white/90 text-[11px] font-semibold mb-6" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}>
              <Sparkles className="w-3 h-3" /> Join 12,000+ businesses
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-5 leading-tight max-w-lg mx-auto">
              Ready to get started?
            </h2>
            <p className="text-base text-white/80 mb-8 max-w-xl mx-auto">
              Join thousands of business owners who manage their finances with AI-powered simplicity.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="group w-full sm:w-auto bg-white text-slate-900 px-7 py-3.5 rounded-full font-bold text-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
              >
                Start Free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full font-bold text-sm text-white transition-all duration-300 flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                Sign In
              </Link>
            </div>
            <p className="mt-6 text-xs text-white/50">
              No credit card required &bull; Free plan available forever
            </p>
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
