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
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

// --- Brand Name ---
const BrandName = ({ className = '', light = false }: { className?: string; light?: boolean }) => (
  <span className={`font-bold tracking-tight ${className}`}>
    <span
      className={light ? 'text-white' : ''}
      style={
        !light
          ? {
              background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }
          : {}
      }
    >
      Flow<em className="not-italic" style={{ fontStyle: 'italic' }}>books</em>
    </span>
  </span>
);

// --- Accordion ---
const AccordionItem = ({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) => (
  <div className="border-b border-slate-200 dark:border-[#3D3A37]">
    <button
      className="flex items-center justify-between w-full py-4 text-left focus:outline-none"
      onClick={onClick}
    >
      <span className="text-sm font-semibold text-slate-900 dark:text-white">{question}</span>
      {isOpen ? (
        <Minus className="w-4 h-4 text-slate-400" />
      ) : (
        <Plus className="w-4 h-4 text-slate-400" />
      )}
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}
    >
      <p className="text-slate-600 dark:text-[#A8A29E] leading-relaxed text-sm">{answer}</p>
    </div>
  </div>
);

// --- Data ---
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
    a: "Absolutely. We use bank-grade 256-bit encryption for all data transmission and storage. Your financial data is yours alone; we never sell it to third parties."
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

// --- Main Page ---
export default function LandingPage() {
  const { user } = useAuth();
  const { mode, toggleMode } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Navbar scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Chat typing animation
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
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-1.5 bg-white/70 dark:bg-[#1A1915]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/[0.06] shadow-sm'
            : 'py-3 bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/25">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <BrandName className="text-lg" />
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-0.5">
              <a href="#features" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-all">Features</a>
              <a href="#how-it-works" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-all">How it Works</a>
              <Link href="/pricing" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-all">Pricing</Link>
              <Link href="/blog" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-all">Blog</Link>
            </div>

            {/* Right Side */}
            <div className="hidden md:flex items-center gap-2.5">
              <button
                onClick={toggleMode}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-[#A8A29E] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
                aria-label="Toggle theme"
              >
                {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {user ? (
                <Link
                  href="/companies"
                  className="px-4 py-2 text-[13px] font-semibold text-white rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white transition-colors">
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-[13px] font-semibold text-white rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 flex items-center gap-1.5"
                  >
                    Get Started <ArrowRight className="w-3 h-3" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={toggleMode}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-[#A8A29E] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
              >
                {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-[#A8A29E] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden bg-white/90 dark:bg-[#1A1915]/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/[0.06] overflow-hidden transition-all duration-300 ${
            isMenuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-4 space-y-1">
            <a href="#features" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04]">Features</a>
            <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04]">How it Works</a>
            <Link href="/pricing" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04]">Pricing</Link>
            <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04]">Blog</Link>
            <hr className="border-slate-200/60 dark:border-white/[0.06] my-2" />
            <button onClick={toggleMode} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E] w-full">
              {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            {user ? (
              <Link href="/companies" className="block text-center mt-1 px-3 py-2.5 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-brand-500 to-brand-600">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-[#A8A29E]">Sign In</Link>
                <Link href="/signup" className="block text-center mt-1 px-3 py-2.5 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-brand-500 to-brand-600">Get Started Free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24">
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full opacity-[0.10] blur-[100px] pointer-events-none"
          style={{ background: 'var(--brand-500)' }}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50/80 dark:bg-brand-500/10 border border-brand-200/60 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="w-3 h-3" />
              AI-FIRST ACCOUNTING PLATFORM
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-5 max-w-3xl mx-auto">
            Your finances,{' '}
            <span
              className="inline-block"
              style={{
                background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              one conversation.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-center text-base sm:text-lg text-slate-600 dark:text-[#A8A29E] max-w-xl mx-auto mb-8 leading-relaxed">
            Invoices, expenses, reports, and bookkeeping — managed through
            simple chat. No spreadsheets, no complexity.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            {user ? (
              <Link
                href="/companies"
                className="w-full sm:w-auto px-7 py-3 rounded-lg text-white font-semibold text-sm bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="w-full sm:w-auto px-7 py-3 rounded-lg text-white font-semibold text-sm bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  Start Free <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto px-7 py-3 rounded-lg font-semibold text-sm text-slate-700 dark:text-[#DBD8D0] bg-slate-100/80 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08] hover:bg-slate-200/60 dark:hover:bg-white/[0.1] transition-all flex items-center justify-center gap-2"
                >
                  Explore
                </a>
              </>
            )}
          </div>

          {/* Trust Markers */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-[#78736D]">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brand-500" /> Bank-grade encryption
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brand-500" /> Real-time data
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brand-500" /> Set up in minutes
            </span>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-12 relative max-w-3xl mx-auto">
            <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-brand-500/15 to-brand-600/10 blur-2xl opacity-60 pointer-events-none" />

            <div className="relative rounded-xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-2xl shadow-slate-200/40 dark:shadow-black/40 bg-white dark:bg-[#1A1915]">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50/80 dark:bg-[#232220] border-b border-slate-200/60 dark:border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                </div>
                <div className="flex-1 h-6 rounded-md bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] flex items-center px-3 text-[11px] text-slate-400 dark:text-[#5C5752]">
                  flowbooks.com/chat
                </div>
              </div>

              {/* Chat Body */}
              <div className="flex flex-col">
                <div className="p-4 sm:p-5 space-y-4 max-h-[420px] overflow-hidden">

                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-3.5 py-2 rounded-2xl rounded-tr-md text-[13px] shadow-md shadow-brand-500/15 max-w-[80%]">
                      Create invoice for Acme Inc, web design, $3,500
                    </div>
                  </div>

                  {/* AI Response with Invoice Card */}
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2.5">
                      {/* Text */}
                      <div className="bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] px-3.5 py-2.5 rounded-2xl rounded-tl-md text-[13px] text-slate-600 dark:text-[#A8A29E]">
                        <div className="flex items-center gap-1.5 mb-1 text-brand-600 dark:text-brand-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </div>
                        Invoice created successfully for <strong className="text-slate-800 dark:text-[#EEECE8]">Acme Inc</strong>. Due in 30 days.
                      </div>

                      {/* Invoice Entity Card */}
                      <div className="border border-slate-200 dark:border-[#3D3A37] rounded-lg overflow-hidden bg-white dark:bg-[#232220]/50">
                        <div className="px-3.5 py-2.5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-slate-800 dark:text-[#EEECE8]">INV-0042</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Draft</span>
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

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-1.5">
                        <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-200/60 dark:border-brand-700/30 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors">
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-700/30 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                          <Send className="w-3 h-3" /> Send Invoice
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-700/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                          <Download className="w-3 h-3" /> Download PDF
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Second User Message */}
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-3.5 py-2 rounded-2xl rounded-tr-md text-[13px] shadow-md shadow-brand-500/15 max-w-[80%]">
                      {typedText}
                      {isTyping && <span className="inline-block w-1 h-3.5 ml-1 bg-white/70 animate-pulse align-middle rounded-full" />}
                    </div>
                  </div>

                  {/* Second AI Response */}
                  <div className={`flex gap-2.5 transition-all duration-500 ${showResponse ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2.5">
                      <div className="bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] px-3.5 py-2.5 rounded-2xl rounded-tl-md text-[13px] text-slate-600 dark:text-[#A8A29E]">
                        <div className="flex items-center gap-1.5 mb-1 text-brand-600 dark:text-brand-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </div>
                        {chatExamples[currentExample].ai}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="px-4 sm:px-5 pb-3 pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                  {/* Quick Action Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5 justify-center">
                    {[
                      { icon: FileText, label: 'Create Invoice' },
                      { icon: Receipt, label: 'Record Expense' },
                      { icon: BarChart3, label: 'View Reports' },
                      { icon: Users, label: 'Add Customer' },
                    ].map((action, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border border-slate-200 dark:border-[#3D3A37] text-slate-500 dark:text-[#78736D] bg-white dark:bg-transparent hover:border-brand-400 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer select-none">
                        <action.icon className="w-3 h-3" />
                        {action.label}
                      </span>
                    ))}
                  </div>
                  {/* Input Bar */}
                  <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 flex items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 dark:text-[#5C5752] flex-shrink-0" />
                    <div className="flex-1 text-[12px] text-slate-400 dark:text-[#5C5752] truncate">Ask Flow AI anything...</div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium text-slate-400 dark:text-[#5C5752] bg-slate-100 dark:bg-white/[0.04]">
                        <Zap className="w-2.5 h-2.5" /> Flow AI v1
                      </span>
                      <Mic className="w-3.5 h-3.5 text-slate-400 dark:text-[#5C5752]" />
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center text-white">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                  {/* Disclaimer */}
                  <p className="text-center text-[9px] text-slate-400 dark:text-[#5C5752] mt-1.5">Flow AI can make mistakes. Please verify important information.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ORIGINAL SECTIONS BELOW ============ */}

      {/* Feature Deep Dives (Zig-Zag) */}
      <section id="features" className="relative z-10 py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-24">

          {/* Feature 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-5">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Just text your accountant. <br/>
                <span className="text-slate-400">(Except it&apos;s AI)</span>
              </h2>
              <p className="text-base text-slate-600 dark:text-[#A8A29E] leading-relaxed">
                Send a message like you would to a friend. Flowbooks parses natural language to categorize transactions, create invoices, and update your ledger instantly. No forms, no dropdowns.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  'Recognizes vendors and categories automatically',
                  'Handles multi-step commands',
                  'Learns your business context over time'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-slate-700 dark:text-[#DBD8D0] text-sm">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-100 dark:from-brand-900/20 to-transparent rounded-2xl transform rotate-3 scale-95 opacity-50"></div>
              <div className="relative bg-white dark:bg-[#232220] border border-slate-200 dark:border-[#2D2B28] rounded-xl shadow-xl p-6 space-y-3">
                 <div className="flex justify-end">
                   <div className="bg-brand-600 text-white rounded-2xl rounded-br-sm px-3.5 py-2 text-[13px] max-w-[80%] shadow-lg">
                     Spent $150 at Office Depot for printer paper and ink
                   </div>
                 </div>
                 <div className="flex justify-start">
                   <div className="bg-slate-100 dark:bg-[#2D2B28] text-slate-800 dark:text-[#EEECE8] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[13px] max-w-[80%] border border-slate-200 dark:border-[#3D3A37]">
                     <div className="font-semibold mb-1 text-brand-700 dark:text-brand-400 text-xs">Expense Recorded</div>
                     <div className="flex justify-between gap-4 text-[11px] text-slate-500 dark:text-[#A8A29E] border-t border-slate-200 dark:border-[#3D3A37] pt-1.5 mt-1">
                       <span>Amount: $150.00</span>
                       <span>Cat: Office Supplies</span>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
            <div className="flex-1 space-y-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Invoices that chase <br/>
                payments for you
              </h2>
              <p className="text-base text-slate-600 dark:text-[#A8A29E] leading-relaxed">
                Create professional invoices in seconds. Better yet, let Flowbooks automatically follow up with clients who are late on payments using polite, customizable email sequences.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-[#2D2B28] rounded-xl border border-slate-100 dark:border-[#3D3A37]">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-0.5 text-sm">Recurring Bills</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A8A29E]">Set it and forget it for retainers.</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#2D2B28] rounded-xl border border-slate-100 dark:border-[#3D3A37]">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-0.5 text-sm">Pay Links</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A8A29E]">One-click payment for clients.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 relative group cursor-pointer">
              <div className="absolute -inset-2 bg-gradient-to-br from-brand-500/20 to-brand-600/10 rounded-2xl opacity-20 blur-lg group-hover:opacity-30 transition"></div>
              <div className="relative bg-white dark:bg-[#232220] border border-slate-200 dark:border-[#2D2B28] rounded-xl shadow-2xl overflow-hidden transform group-hover:scale-[1.01] transition duration-500">
                {/* Terracotta accent bar */}
                <div className="h-1 bg-gradient-to-r from-brand-500 to-brand-600" />
                {/* Header */}
                <div className="px-5 pt-4 pb-3 flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-0.5">Invoice</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">#INV-2024-001</div>
                    <div className="text-[11px] text-slate-500 dark:text-[#A8A29E] mt-0.5">Acme Corporation</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Sent</span>
                    <div className="text-[11px] text-slate-500 dark:text-[#A8A29E] mt-1.5">Due Jan 15, 2025</div>
                  </div>
                </div>
                {/* Line Items Table */}
                <div className="px-5 pb-3">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-semibold">
                        <td className="py-1.5 px-2 rounded-l-md">Description</td>
                        <td className="py-1.5 px-2 text-center">Qty</td>
                        <td className="py-1.5 px-2 text-right">Rate</td>
                        <td className="py-1.5 px-2 text-right rounded-r-md">Amount</td>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600 dark:text-[#A8A29E]">
                      <tr className="border-b border-slate-100 dark:border-[#2D2B28]">
                        <td className="py-1.5 px-2 text-slate-800 dark:text-[#EEECE8]">Website Redesign</td>
                        <td className="py-1.5 px-2 text-center">1</td>
                        <td className="py-1.5 px-2 text-right">$3,000.00</td>
                        <td className="py-1.5 px-2 text-right font-medium text-slate-800 dark:text-[#EEECE8]">$3,000.00</td>
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-[#2D2B28] bg-slate-50/50 dark:bg-white/[0.01]">
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
                {/* Totals */}
                <div className="px-5 pb-4">
                  <div className="flex justify-end">
                    <div className="w-48 space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-500 dark:text-[#A8A29E]">
                        <span>Subtotal</span>
                        <span>$4,500.00</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-[#A8A29E]">
                        <span>Tax (0%)</span>
                        <span>$0.00</span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-[#3D3A37] pt-1 mt-1 flex justify-between font-bold text-[13px] text-slate-900 dark:text-white">
                        <span>Total</span>
                        <span className="text-brand-600 dark:text-brand-400">$4,500.00</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Footer */}
                <div className="px-5 py-2.5 border-t border-slate-100 dark:border-[#2D2B28] bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 dark:text-[#5C5752]">Powered by Flowbooks</span>
                  <div className="flex gap-1.5">
                    <button className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-200/60 dark:border-brand-700/30">
                      <Eye className="w-2.5 h-2.5" /> View
                    </button>
                    <button className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-700/30">
                      <Download className="w-2.5 h-2.5" /> PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Bento Grid */}
      <section id="how-it-works" className="relative z-10 py-20 bg-slate-50/50 dark:bg-[#232220]/30 border-y border-slate-200 dark:border-[#2D2B28]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">Everything you need to run your business</h2>
            <p className="text-base text-slate-600 dark:text-[#A8A29E]">From day one to IPO, we&apos;ve got the tools to keep your finances healthy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[180px]">

             {/* 1 — Financial Reporting (wide) */}
             <div className="md:col-span-2 md:row-span-2 bg-white dark:bg-[#232220] p-5 rounded-2xl border border-slate-200 dark:border-[#2D2B28] shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
               <div className="relative z-10">
                 <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-3">
                   <BarChart3 className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                 </div>
                 <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Real-time Financial Reporting</h3>
                 <p className="text-slate-500 dark:text-[#A8A29E] max-w-xs text-[13px] leading-relaxed">Generate P&L, Balance Sheets, and Cash Flow statements instantly.</p>
               </div>
               {/* Mini chart visualization */}
               <div className="absolute right-4 bottom-4 w-52 h-36 bg-purple-50/80 dark:bg-purple-900/15 rounded-xl border border-purple-100 dark:border-purple-800/20 p-3 transform group-hover:translate-x-[-4px] transition-transform duration-300">
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">Revenue</span>
                   <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +24%</span>
                 </div>
                 <div className="flex items-end justify-between h-[calc(100%-24px)] gap-1.5 pb-1">
                   {[35, 50, 40, 65, 55, 80, 70, 90].map((h, i) => (
                     <div key={i} className="flex-1 rounded-sm bg-purple-200 dark:bg-purple-700/50" style={{ height: `${h}%` }} />
                   ))}
                 </div>
               </div>
             </div>

             {/* 2 — Expense Tracking */}
             <div className="bg-white dark:bg-[#232220] p-5 rounded-2xl border border-slate-200 dark:border-[#2D2B28] shadow-sm hover:shadow-lg transition-all overflow-hidden relative group">
                <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-2.5">
                  <Receipt className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Expense Tracking</h3>
                <p className="text-slate-500 dark:text-[#A8A29E] text-[13px]">Snap receipts. AI extracts the data.</p>
                {/* Mini receipt */}
                <div className="absolute bottom-3 right-3 w-20 h-24 bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-800/20 rounded-lg p-2 transform rotate-3 group-hover:rotate-0 transition-transform">
                  <div className="h-1.5 w-10 bg-amber-200 dark:bg-amber-700/40 rounded mb-1.5" />
                  <div className="h-1 w-14 bg-amber-100 dark:bg-amber-800/30 rounded mb-1" />
                  <div className="h-1 w-12 bg-amber-100 dark:bg-amber-800/30 rounded mb-1" />
                  <div className="border-t border-dashed border-amber-200 dark:border-amber-700/40 my-1.5" />
                  <div className="h-1.5 w-8 bg-amber-200 dark:bg-amber-700/40 rounded ml-auto" />
                </div>
             </div>

             {/* 3 — Bank Sync */}
             <div className="bg-white dark:bg-[#232220] p-5 rounded-2xl border border-slate-200 dark:border-[#2D2B28] shadow-sm hover:shadow-lg transition-all overflow-hidden relative">
                <div className="w-9 h-9 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center mb-2.5">
                  <Wallet className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Bank Sync</h3>
                <p className="text-slate-500 dark:text-[#A8A29E] text-[13px]">10,000+ banks connected securely.</p>
                {/* Mini connection dots */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/30" />
                  <div className="w-6 h-0.5 bg-rose-200 dark:bg-rose-700/40" />
                  <div className="w-5 h-5 rounded-full bg-rose-200 dark:bg-rose-800/30 border border-rose-300 dark:border-rose-700/30" />
                  <div className="w-6 h-0.5 bg-rose-200 dark:bg-rose-700/40" />
                  <div className="w-5 h-5 rounded-full bg-rose-300 dark:bg-rose-700/40 border border-rose-300 dark:border-rose-700/30 flex items-center justify-center">
                    <Check className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  </div>
                </div>
             </div>

             {/* 4 — Customer Management (tall) */}
             <div className="md:row-span-2 bg-white dark:bg-[#232220] p-5 rounded-2xl border border-slate-200 dark:border-[#2D2B28] shadow-sm hover:shadow-lg transition-all">
                <div className="h-full flex flex-col">
                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-2.5">
                    <Users className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Customer Management</h3>
                  <p className="text-slate-500 dark:text-[#A8A29E] text-[13px] mb-3">Track details and payment history.</p>
                  {/* Customer list */}
                  <div className="flex-1 space-y-2">
                    {[
                      { name: 'Sarah Chen', amount: '$12,400', color: 'bg-blue-500' },
                      { name: 'Alex Rivera', amount: '$8,750', color: 'bg-emerald-500' },
                      { name: 'Jordan Lee', amount: '$5,200', color: 'bg-purple-500' },
                      { name: 'Morgan Taylor', amount: '$3,800', color: 'bg-amber-500' },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center gap-2.5 bg-slate-50 dark:bg-[#2D2B28]/50 p-2 rounded-lg border border-slate-100 dark:border-[#3D3A37]/50">
                        <div className={`w-6 h-6 rounded-full ${c.color} flex items-center justify-center text-[9px] font-bold text-white`}>{c.name[0]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium text-slate-700 dark:text-[#DBD8D0] truncate">{c.name}</div>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-[#A8A29E]">{c.amount}</div>
                      </div>
                    ))}
                  </div>
                </div>
             </div>

             {/* 5 — Recurring Billing */}
             <div className="bg-white dark:bg-[#232220] p-5 rounded-2xl border border-slate-200 dark:border-[#2D2B28] shadow-sm hover:shadow-lg transition-all overflow-hidden relative">
                <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-2.5">
                  <RefreshCw className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Recurring Billing</h3>
                <p className="text-slate-500 dark:text-[#A8A29E] text-[13px]">Automate retainer invoices.</p>
                {/* Mini calendar dots */}
                <div className="absolute bottom-3 right-3 grid grid-cols-4 gap-1">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i === 2 || i === 6 || i === 10 ? 'bg-emerald-400 dark:bg-emerald-500' : 'bg-slate-100 dark:bg-[#2D2B28] border border-slate-200 dark:border-[#3D3A37]'}`} />
                  ))}
                </div>
             </div>

             {/* 6 — Multi-Currency (wide) */}
             <div className="md:col-span-2 bg-white dark:bg-[#232220] p-5 rounded-2xl border border-slate-200 dark:border-[#2D2B28] shadow-sm hover:shadow-lg transition-all overflow-hidden relative">
                <div className="flex items-start gap-4">
                  <div>
                    <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-2.5">
                      <CreditCard className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Multi-Currency Support</h3>
                    <p className="text-slate-500 dark:text-[#A8A29E] text-[13px]">Invoice and track in any currency. Auto-conversion at real-time rates.</p>
                  </div>
                  {/* Currency cards */}
                  <div className="flex items-center gap-2 ml-auto flex-shrink-0 mt-1">
                    {[
                      { code: 'USD', symbol: '$', rate: '1.00', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30' },
                      { code: 'EUR', symbol: '\u20AC', rate: '0.92', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/30' },
                      { code: 'GBP', symbol: '\u00A3', rate: '0.79', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/30' },
                    ].map((cur, i) => (
                      <div key={i} className={`px-2.5 py-2 rounded-lg border text-center ${cur.color}`}>
                        <div className="text-base font-bold">{cur.symbol}</div>
                        <div className="text-[9px] font-semibold mt-0.5">{cur.code}</div>
                      </div>
                    ))}
                  </div>
                </div>
             </div>

             {/* 7 — Audit Trail */}
             <div className="bg-white dark:bg-[#232220] p-5 rounded-2xl border border-slate-200 dark:border-[#2D2B28] shadow-sm hover:shadow-lg transition-all overflow-hidden relative">
                <div className="w-9 h-9 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center mb-2.5">
                  <Shield className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Audit Proof</h3>
                <p className="text-slate-500 dark:text-[#A8A29E] text-[13px]">Every change is logged.</p>
                {/* Mini log lines */}
                <div className="absolute bottom-3 left-5 right-5 space-y-1">
                  {['Invoice created', 'Payment received', 'Status updated'].map((log, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[9px]">
                      <div className="w-1 h-1 rounded-full bg-brand-400" />
                      <span className="text-slate-400 dark:text-[#5C5752]">{log}</span>
                    </div>
                  ))}
                </div>
             </div>

             {/* 8 — Tax Ready */}
             <div className="bg-white dark:bg-[#232220] p-5 rounded-2xl border border-slate-200 dark:border-[#2D2B28] shadow-sm hover:shadow-lg transition-all overflow-hidden relative group">
                <div className="w-9 h-9 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center mb-2.5">
                  <Calculator className="w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Tax Ready</h3>
                <p className="text-slate-500 dark:text-[#A8A29E] text-[13px]">Auto-calculate and file on time.</p>
                {/* Mini progress */}
                <div className="absolute bottom-4 left-5 right-5">
                  <div className="flex justify-between text-[9px] text-cyan-600 dark:text-cyan-400 font-medium mb-1">
                    <span>Tax Report</span>
                    <span>92%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-[#2D2B28] rounded-full overflow-hidden">
                    <div className="h-full w-[92%] bg-cyan-400 dark:bg-cyan-500 rounded-full" />
                  </div>
                </div>
             </div>

          </div>
        </div>
      </section>

      {/* Pricing CTA Banner */}
      <section className="relative z-10 py-16 bg-slate-50 dark:bg-[#232220]/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">Simple, transparent pricing</h2>
          <p className="text-slate-500 dark:text-[#A8A29E] text-sm mb-6 max-w-lg mx-auto">Choose the plan that fits your business. No hidden fees, cancel anytime.</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold text-sm bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5"
          >
            View Pricing <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 py-20 bg-white dark:bg-[#1A1915]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-1">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                question={faq.q}
                answer={faq.a}
                isOpen={openFaqIndex === index}
                onClick={() => setOpenFaqIndex(index === openFaqIndex ? -1 : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto relative rounded-[2rem] overflow-hidden bg-slate-900 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-600 opacity-90"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

          <div className="relative z-10 px-6 py-16 text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-5">
              Start your financial freedom today
            </h2>
            <p className="text-base text-white/80 mb-8 max-w-xl mx-auto">
              Join thousands of business owners who have traded spreadsheet headaches for AI-powered clarity.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="bg-white text-slate-900 px-7 py-3 rounded-full font-bold text-sm hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="px-7 py-3 rounded-full font-bold text-sm text-white border border-white/30 hover:bg-white/10 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>
            <p className="mt-5 text-xs text-white/60">Bank-grade encryption &bull; Set up in minutes</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-50 dark:bg-[#232220]/50 pt-16 pb-8 border-t border-slate-200 dark:border-[#2D2B28]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <BrandName className="text-lg" />
              </div>
              <p className="text-slate-500 dark:text-[#A8A29E] text-xs leading-relaxed max-w-xs mb-5">
                AI-powered accounting for the modern business. We make bookkeeping as easy as sending a text.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-5 text-sm">Product</h4>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-[#A8A29E]">
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Features</a></li>
                <li><Link href="/pricing" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Pricing</Link></li>
                <li><a href="#how-it-works" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">How it Works</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-5 text-sm">Company</h4>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-[#A8A29E]">
                <li><Link href="/about" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-5 text-sm">Legal</h4>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-[#A8A29E]">
                <li><Link href="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-[#2D2B28] flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-slate-500 dark:text-[#A8A29E] text-xs">
              &copy; {new Date().getFullYear()} Flowbooks Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#A8A29E]">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></div>
              System Operational
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
