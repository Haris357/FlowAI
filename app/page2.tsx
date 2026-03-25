'use client';
import React, { useEffect, useState } from 'react';
import {
  MessageCircle,
  Zap,
  TrendingUp,
  Shield,
  Clock,
  Users,
  ArrowRight,
  Check,
  Sparkles,
  BarChart3,
  Receipt,
  FileText,
  Wallet,
  BookOpen,
  PieChart,
  CreditCard,
  Building2,
  RefreshCw,
  Calculator,
  Menu,
  X,
  ChevronDown,
  MousePointer,
  CheckCircle2,
  Plus,
  Minus,
  Moon,
  Sun,
  Eye,
  Send,
  Download,
  Calendar,
  Paperclip,
  Mic,
  LayoutDashboard,
  Info,
  Lock,
  Mail,
  Home,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import FlowBooksLogo from '@/components/FlowBooksLogo';

const AccordionItem = ({ question, answer, isOpen, onClick, index }: { question: string; answer: string; isOpen: boolean; onClick: () => void; index: number }) => (
  <div
    className={`group rounded-2xl border transition-all duration-300 ${
      isOpen
        ? 'bg-white dark:bg-[#232220] border-slate-200 dark:border-[#3D3A37] shadow-lg shadow-slate-200/50 dark:shadow-black/20'
        : 'bg-transparent border-transparent hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
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

const chatExamples = [
  {
    user: 'Create invoice for Acme Inc, web development, $3,500',
    ai: 'Invoice #INV-001 created for Acme Inc ($3,500). Due in 30 days.',
  },
  {
    user: 'Record office rent payment $1,200',
    ai: 'Expense recorded: Office Rent - $1,200. Categorized under Operating Expenses.',
  },
  {
    user: 'How much profit did we make last month?',
    ai: "Last month's Net Profit was $8,300. Revenue increased by 12% compared to the previous period.",
  },
];

const faqs = [
  {
    q: "Is my financial data secure?",
    a: "Absolutely. Your data is encrypted in transit and at rest using 256-bit AES encryption, secured by Google Cloud infrastructure. We never sell your data to third parties."
  },
  {
    q: "Do I need to know accounting to use this?",
    a: "Not at all. Flowbooks is designed for non-accountants. If you can send a text message, you can do your bookkeeping."
  },
  {
    q: "Can I export my data to other software?",
    a: "Yes, you can export all your data to CSV, PDF, or Excel formats at any time. We believe in data portability."
  },
  {
    q: "How does the AI handle tax calculations?",
    a: "Flowbooks automatically applies default tax rates based on your location settings. You can also customize tax rules for specific items or clients."
  }
];

const featureCards = [
  { icon: BarChart3, title: 'Real-time Reports', desc: 'P&L, Balance Sheets, Cash Flow — generated instantly.', color: 'purple', stat: '+24%', statLabel: 'Revenue Growth' },
  { icon: Receipt, title: 'Expense Tracking', desc: 'Snap receipts. AI extracts the data automatically.', color: 'amber', stat: '2.4s', statLabel: 'Avg Processing' },
  { icon: Wallet, title: 'Bank Sync', desc: '10,000+ banks connected with enterprise-grade security.', color: 'rose', stat: '10K+', statLabel: 'Banks Connected' },
  { icon: Users, title: 'Customer CRM', desc: 'Track client details, invoices, and payment history.', color: 'blue', stat: '360°', statLabel: 'Client View' },
  { icon: RefreshCw, title: 'Recurring Billing', desc: 'Set up auto-invoicing for retainers and subscriptions.', color: 'emerald', stat: '0', statLabel: 'Missed Invoices' },
  { icon: CreditCard, title: 'Multi-Currency', desc: 'Invoice in any currency with real-time conversion rates.', color: 'indigo', stat: '135+', statLabel: 'Currencies' },
  { icon: Shield, title: 'Audit Proof', desc: 'Every single change is logged with full traceability.', color: 'brand', stat: '100%', statLabel: 'Compliance' },
  { icon: Calculator, title: 'Tax Ready', desc: 'Auto-calculate tax obligations and file on time.', color: 'cyan', stat: '92%', statLabel: 'Auto-Filed' },
];

const colorMap: Record<string, { bg: string; text: string; border: string; statBg: string }> = {
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200/60 dark:border-purple-800/30', statBg: 'bg-purple-50 dark:bg-purple-900/20' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200/60 dark:border-amber-800/30', statBg: 'bg-amber-50 dark:bg-amber-900/20' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200/60 dark:border-rose-800/30', statBg: 'bg-rose-50 dark:bg-rose-900/20' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200/60 dark:border-blue-800/30', statBg: 'bg-blue-50 dark:bg-blue-900/20' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/60 dark:border-emerald-800/30', statBg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200/60 dark:border-indigo-800/30', statBg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  brand: { bg: 'bg-brand-100 dark:bg-brand-900/30', text: 'text-brand-600 dark:text-brand-400', border: 'border-brand-200/60 dark:border-brand-800/30', statBg: 'bg-brand-50 dark:bg-brand-900/20' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200/60 dark:border-cyan-800/30', statBg: 'bg-cyan-50 dark:bg-cyan-900/20' },
};

export default function LandingPage() {
  const { user } = useAuth();
  const { mode, toggleMode } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const example = chatExamples[currentExample];
    setShowResponse(false);
    setTypedText('');
    setIsTyping(true);

    let charIndex = 0;
    const typeInterval = setInterval(() => {
      if (charIndex < example.user.length) {
        setTypedText(example.user.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        setTimeout(() => setShowResponse(true), 600);
        setTimeout(() => {
          setCurrentExample((prev) => (prev + 1) % chatExamples.length);
        }, 5000);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [currentExample]);

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#1A1915] font-sans text-slate-900 dark:text-[#EEECE8] selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden text-[15px]">

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}} />

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
            ? 'py-1.5 bg-white/80 dark:bg-[#1A1915]/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/[0.06] shadow-sm shadow-slate-200/20 dark:shadow-black/10'
            : 'py-3 bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <FlowBooksLogo size="sm" />

            <div className="hidden lg:flex items-center gap-0.5 bg-slate-100/60 dark:bg-white/[0.04] rounded-full px-1.5 py-1 border border-slate-200/40 dark:border-white/[0.04]">
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
                <div className={`absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#232220] border border-slate-200/80 dark:border-[#3D3A37] rounded-2xl shadow-xl shadow-black/8 dark:shadow-black/30 overflow-hidden transition-all duration-300 origin-top ${isMoreOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
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
          className={`lg:hidden bg-white/95 dark:bg-[#1A1915]/95 backdrop-blur-2xl border-t border-slate-200/50 dark:border-white/[0.06] overflow-hidden transition-all duration-300 ${
            isMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-4 space-y-1">
            <Link href="/pricing" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"><CreditCard className="w-[18px] h-[18px]" />Pricing</Link>
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
      <section className="relative pt-32 pb-8 lg:pt-40 lg:pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className={`transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex justify-center mb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50/80 dark:bg-brand-500/10 border border-brand-200/50 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 text-[11px] font-semibold tracking-wide backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                AI-FIRST ACCOUNTING PLATFORM
              </div>
            </div>

            <h1 className="text-center text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.08] mb-5 max-w-3xl mx-auto">
              Your finances,{' '}
              <span className="relative inline-block">
                <span
                  style={{
                    background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  one conversation.
                </span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 8" fill="none">
                  <path d="M1 5.5C60 2 120 2 150 4C180 6 240 3 299 5.5" stroke="var(--brand-500)" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
                </svg>
              </span>
            </h1>

            <p className="text-center text-base sm:text-lg text-slate-500 dark:text-[#A8A29E] max-w-lg mx-auto mb-8 leading-relaxed">
              Invoices, expenses, reports, and bookkeeping — managed through simple chat. No spreadsheets, no complexity.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
              {user ? (
                <Link
                  href="/companies"
                  className="w-full sm:w-auto px-7 py-3 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="group w-full sm:w-auto px-7 py-3 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    Start Free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <a
                    href="#how-it-works"
                    className="w-full sm:w-auto px-7 py-3 rounded-full font-semibold text-sm text-slate-700 dark:text-[#DBD8D0] bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.12] hover:shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    Explore
                  </a>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-xs text-slate-500 dark:text-[#78736D]">
              {['256-bit AES encryption', 'Real-time data', 'Set up in minutes'].map((t, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand-500" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className={`mt-14 relative max-w-3xl mx-auto transition-all duration-1000 delay-300 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="absolute -inset-px rounded-[20px] bg-gradient-to-b from-brand-500/20 via-brand-500/5 to-transparent pointer-events-none" />
            <div className="absolute -inset-8 bg-gradient-to-b from-brand-500/8 to-transparent rounded-3xl blur-2xl pointer-events-none" />

            <div className="relative rounded-[20px] overflow-hidden border border-slate-200/70 dark:border-white/[0.08] shadow-2xl shadow-slate-300/30 dark:shadow-black/40 bg-white dark:bg-[#1A1915]">
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50/80 dark:bg-[#232220] border-b border-slate-200/60 dark:border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                </div>
                <div className="flex-1 h-6 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] flex items-center px-3 text-[11px] text-slate-400 dark:text-[#5C5752]">
                  flowbooks.com/chat
                </div>
              </div>

              <div className="flex flex-col">
                <div className="p-4 sm:p-5 space-y-4 max-h-[420px] overflow-hidden">
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-md text-[13px] shadow-md shadow-brand-500/15 max-w-[80%]">
                      Create invoice for Acme Inc, web design, $3,500
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2.5">
                      <div className="bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] px-4 py-3 rounded-2xl rounded-tl-md text-[13px] text-slate-600 dark:text-[#A8A29E]">
                        <div className="flex items-center gap-1.5 mb-1.5 text-brand-600 dark:text-brand-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </div>
                        Invoice created successfully for <strong className="text-slate-800 dark:text-[#EEECE8]">Acme Inc</strong>. Due in 30 days.
                      </div>

                      <div className="border border-slate-200 dark:border-[#3D3A37] rounded-xl overflow-hidden bg-white dark:bg-[#232220]/50">
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-slate-800 dark:text-[#EEECE8]">INV-0042</span>
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Draft</span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-[#78736D] mt-0.5">
                              <span>Acme Inc</span>
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due Mar 15</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-[15px] font-bold text-slate-800 dark:text-[#EEECE8]">$3,500.00</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-200/60 dark:border-brand-700/30 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors">
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-700/30 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                          <Send className="w-3 h-3" /> Send Invoice
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-700/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                          <Download className="w-3 h-3" /> Download PDF
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-md text-[13px] shadow-md shadow-brand-500/15 max-w-[80%]">
                      {typedText}
                      {isTyping && <span className="inline-block w-0.5 h-3.5 ml-1 bg-white/70 animate-pulse align-middle rounded-full" />}
                    </div>
                  </div>

                  <div className={`flex gap-2.5 transition-all duration-500 ${showResponse ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2.5">
                      <div className="bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] px-4 py-3 rounded-2xl rounded-tl-md text-[13px] text-slate-600 dark:text-[#A8A29E]">
                        <div className="flex items-center gap-1.5 mb-1.5 text-brand-600 dark:text-brand-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </div>
                        {chatExamples[currentExample].ai}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 sm:px-5 pb-3 pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                  <div className="flex flex-wrap gap-1.5 mb-2.5 justify-center">
                    {[
                      { icon: FileText, label: 'Create Invoice' },
                      { icon: Receipt, label: 'Record Expense' },
                      { icon: BarChart3, label: 'View Reports' },
                      { icon: Users, label: 'Add Customer' },
                    ].map((action, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border border-slate-200 dark:border-[#3D3A37] text-slate-500 dark:text-[#78736D] bg-white dark:bg-transparent hover:border-brand-400 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer select-none">
                        <action.icon className="w-3 h-3" />
                        {action.label}
                      </span>
                    ))}
                  </div>
                  <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 dark:text-[#5C5752] flex-shrink-0" />
                    <div className="flex-1 text-[12px] text-slate-400 dark:text-[#5C5752] truncate">Ask Flow AI anything...</div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium text-slate-400 dark:text-[#5C5752] bg-slate-100 dark:bg-white/[0.04]">
                        <Zap className="w-2.5 h-2.5" /> Flow AI v1
                      </span>
                      <Mic className="w-3.5 h-3.5 text-slate-400 dark:text-[#5C5752]" />
                      <div className="w-7 h-7 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center text-white">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-[9px] text-slate-400 dark:text-[#5C5752] mt-1.5">Flow AI can make mistakes. Please verify important information.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SOCIAL PROOF STRIP ============ */}
      <section className="relative z-10 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: '12K+', label: 'Active businesses' },
              { value: '$2.4B', label: 'Invoices processed' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '4.9/5', label: 'User rating' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{s.value}</div>
                <div className="text-xs text-slate-500 dark:text-[#78736D] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES — STORYTELLING CARDS ============ */}
      <section id="features" className="relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          <div className="max-w-2xl mb-16">
            <p className="text-brand-600 dark:text-brand-400 text-xs font-semibold tracking-widest uppercase mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
              Talk to your books,<br />they talk back.
            </h2>
            <p className="text-base text-slate-500 dark:text-[#A8A29E] leading-relaxed">
              No forms, no dropdowns, no spreadsheet headaches. Just tell Flowbooks what happened and it handles the rest.
            </p>
          </div>

          {/* Feature Story 1 */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center mb-24">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/20 border border-brand-200/50 dark:border-brand-700/30">
                <MessageCircle className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span className="text-[11px] font-semibold text-brand-700 dark:text-brand-400">Natural Language Input</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-snug">
                Just text your accountant.{' '}
                <span className="text-slate-400 dark:text-[#5C5752]">(Except it&apos;s AI)</span>
              </h3>
              <p className="text-base text-slate-600 dark:text-[#A8A29E] leading-relaxed">
                Send a message like you would to a friend. Flowbooks parses natural language to categorize transactions, create invoices, and update your ledger instantly.
              </p>
              <div className="space-y-3 pt-1">
                {[
                  'Recognizes vendors and categories automatically',
                  'Handles multi-step commands',
                  'Learns your business context over time'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-[#DBD8D0]">
                    <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-brand-500/8 to-transparent rounded-3xl blur-xl pointer-events-none" />
              <div className="relative bg-white dark:bg-[#232220] border border-slate-200 dark:border-[#2D2B28] rounded-2xl shadow-xl p-5 space-y-3">
                <div className="flex justify-end">
                  <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-[13px] max-w-[80%] shadow-lg shadow-brand-500/15">
                    Spent $150 at Office Depot for printer paper and ink
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-slate-50 dark:bg-[#2D2B28] text-slate-800 dark:text-[#EEECE8] rounded-2xl rounded-bl-sm px-4 py-3 text-[13px] max-w-[80%] border border-slate-100 dark:border-[#3D3A37]">
                    <div className="font-semibold mb-1.5 text-brand-700 dark:text-brand-400 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" /> Expense Recorded
                    </div>
                    <div className="flex justify-between gap-4 text-[11px] text-slate-500 dark:text-[#A8A29E] border-t border-slate-200 dark:border-[#3D3A37] pt-2 mt-1.5">
                      <span>Amount: $150.00</span>
                      <span>Cat: Office Supplies</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Story 2 */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
            <div className="order-2 lg:order-1 relative group">
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/8 to-transparent rounded-3xl blur-xl pointer-events-none" />
              <div className="relative bg-white dark:bg-[#232220] border border-slate-200 dark:border-[#2D2B28] rounded-2xl shadow-2xl overflow-hidden transform group-hover:scale-[1.005] transition-transform duration-500">
                <div className="h-1 bg-gradient-to-r from-brand-500 to-brand-600" />
                <div className="px-5 pt-4 pb-3 flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-0.5">Invoice</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">#INV-2024-001</div>
                    <div className="text-[11px] text-slate-500 dark:text-[#A8A29E] mt-0.5">Acme Corporation</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Sent</span>
                    <div className="text-[11px] text-slate-500 dark:text-[#A8A29E] mt-1.5">Due Jan 15, 2025</div>
                  </div>
                </div>
                <div className="px-5 pb-3">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-semibold">
                        <td className="py-1.5 px-2 rounded-l-lg">Description</td>
                        <td className="py-1.5 px-2 text-center">Qty</td>
                        <td className="py-1.5 px-2 text-right">Rate</td>
                        <td className="py-1.5 px-2 text-right rounded-r-lg">Amount</td>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600 dark:text-[#A8A29E]">
                      <tr className="border-b border-slate-100 dark:border-[#2D2B28]">
                        <td className="py-1.5 px-2 text-slate-800 dark:text-[#EEECE8]">Website Redesign</td>
                        <td className="py-1.5 px-2 text-center">1</td>
                        <td className="py-1.5 px-2 text-right">$3,000.00</td>
                        <td className="py-1.5 px-2 text-right font-medium text-slate-800 dark:text-[#EEECE8]">$3,000.00</td>
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-[#2D2B28]">
                        <td className="py-1.5 px-2 text-slate-800 dark:text-[#EEECE8]">SEO Optimization</td>
                        <td className="py-1.5 px-2 text-center">5</td>
                        <td className="py-1.5 px-2 text-right">$200.00</td>
                        <td className="py-1.5 px-2 text-right font-medium text-slate-800 dark:text-[#EEECE8]">$1,000.00</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 text-slate-800 dark:text-[#EEECE8]">Hosting (Annual)</td>
                        <td className="py-1.5 px-2 text-center">1</td>
                        <td className="py-1.5 px-2 text-right">$500.00</td>
                        <td className="py-1.5 px-2 text-right font-medium text-slate-800 dark:text-[#EEECE8]">$500.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-5 pb-4">
                  <div className="flex justify-end">
                    <div className="w-48 space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-500 dark:text-[#A8A29E]">
                        <span>Subtotal</span><span>$4,500.00</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-[#A8A29E]">
                        <span>Tax (0%)</span><span>$0.00</span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-[#3D3A37] pt-1.5 mt-1.5 flex justify-between font-bold text-[13px] text-slate-900 dark:text-white">
                        <span>Total</span>
                        <span className="text-brand-600 dark:text-brand-400">$4,500.00</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-2.5 border-t border-slate-100 dark:border-[#2D2B28] bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 dark:text-[#5C5752]">Powered by Flowbooks</span>
                  <div className="flex gap-1.5">
                    <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-200/60 dark:border-brand-700/30">
                      <Eye className="w-2.5 h-2.5" /> View
                    </button>
                    <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-700/30">
                      <Download className="w-2.5 h-2.5" /> PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/30">
                <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">Smart Invoicing</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-snug">
                Invoices that chase payments for you
              </h3>
              <p className="text-base text-slate-600 dark:text-[#A8A29E] leading-relaxed">
                Create professional invoices in seconds. Let Flowbooks automatically follow up with clients who are late on payments using polite, customizable email sequences.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-4 bg-slate-50/80 dark:bg-[#2D2B28]/50 rounded-2xl border border-slate-100 dark:border-[#3D3A37]">
                  <RefreshCw className="w-4 h-4 text-brand-500 mb-2" />
                  <h4 className="font-bold text-slate-900 dark:text-white mb-0.5 text-sm">Recurring Bills</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A8A29E]">Set it and forget it for retainers.</p>
                </div>
                <div className="p-4 bg-slate-50/80 dark:bg-[#2D2B28]/50 rounded-2xl border border-slate-100 dark:border-[#3D3A37]">
                  <Zap className="w-4 h-4 text-brand-500 mb-2" />
                  <h4 className="font-bold text-slate-900 dark:text-white mb-0.5 text-sm">Pay Links</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A8A29E]">One-click payment for clients.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CAPABILITIES GRID ============ */}
      <section id="how-it-works" className="relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-brand-600 dark:text-brand-400 text-xs font-semibold tracking-widest uppercase mb-3">Capabilities</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">Everything you need to run your business</h2>
            <p className="text-base text-slate-500 dark:text-[#A8A29E]">From day one to IPO, we&apos;ve got the tools to keep your finances healthy.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featureCards.map((card, i) => {
              const c = colorMap[card.color];
              return (
                <div
                  key={i}
                  className="group relative bg-white dark:bg-[#232220] rounded-2xl border border-slate-200/80 dark:border-[#2D2B28] p-5 hover:shadow-xl hover:shadow-slate-200/30 dark:hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3.5`}>
                    <card.icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <h3 className="text-sm font-bold mb-1.5 text-slate-900 dark:text-white">{card.title}</h3>
                  <p className="text-slate-500 dark:text-[#A8A29E] text-[13px] leading-relaxed mb-4">{card.desc}</p>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${c.statBg} border ${c.border}`}>
                    <span className={`text-sm font-bold ${c.text}`}>{card.stat}</span>
                    <span className="text-[10px] text-slate-500 dark:text-[#78736D]">{card.statLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ PRICING CTA ============ */}
      <section className="relative z-10 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-3xl overflow-hidden bg-slate-50 dark:bg-[#232220] border border-slate-200/80 dark:border-[#2D2B28] p-8 md:p-12 text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-brand-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">Simple, transparent pricing</h2>
              <p className="text-slate-500 dark:text-[#A8A29E] text-sm mb-7 max-w-md mx-auto">Choose the plan that fits your business. No hidden fees, cancel anytime.</p>
              <Link
                href="/pricing"
                className="group inline-flex items-center gap-2 px-7 py-3 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5"
              >
                View Pricing <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="relative z-10 py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-brand-600 dark:text-brand-400 text-xs font-semibold tracking-widest uppercase mb-3">Support</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">Frequently Asked Questions</h2>
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

      {/* ============ FINAL CTA ============ */}
      <section className="relative z-10 py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto relative rounded-[2rem] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-600" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] transform translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/10 rounded-full blur-[80px] transform -translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10 px-6 py-16 md:py-20 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white/90 text-[11px] font-semibold mb-6 backdrop-blur-sm">
              <Sparkles className="w-3 h-3" /> Join 12,000+ businesses
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-5 leading-tight max-w-lg mx-auto">
              Start your financial freedom today
            </h2>
            <p className="text-base text-white/75 mb-8 max-w-xl mx-auto">
              Join thousands of business owners who have traded spreadsheet headaches for AI-powered clarity.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="group bg-white text-slate-900 px-7 py-3 rounded-full font-bold text-sm hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                Get Started Free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="px-7 py-3 rounded-full font-bold text-sm text-white border border-white/30 hover:bg-white/10 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>
            <p className="mt-6 text-xs text-white/50">Encrypted in transit &amp; at rest &bull; Set up in minutes &bull; Cancel anytime</p>
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