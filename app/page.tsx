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
  Star,
  CheckCircle2,
  ArrowUpRight,
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
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
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
  <div className="border-b border-slate-200 dark:border-slate-700">
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
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{answer}</p>
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

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "Freelance Designer",
    content: "I used to dread the end of the month. Flowbooks turned my least favorite chore into a 5-minute chat. It's actually kind of fun.",
    image: "SJ"
  },
  {
    name: "Marcus Chen",
    role: "Founder, TechStart",
    content: "The natural language input is a game changer. I don't need to know accounting codes; I just tell the AI what I bought.",
    image: "MC"
  },
  {
    name: "Elena Rodriguez",
    role: "Small Business Owner",
    content: "Finally, accounting software that doesn't feel like a spreadsheet from 1995. The financial reports are beautiful and easy to read.",
    image: "ER"
  }
];

const pricingPlans = [
  {
    name: "Starter",
    price: "0",
    description: "Perfect for freelancers and side hustles.",
    features: ["Up to 5 clients", "Basic Invoicing", "Expense Tracking", "Standard Support"],
    cta: "Start Free",
    popular: false
  },
  {
    name: "Pro",
    price: "29",
    description: "For growing businesses needing more power.",
    features: ["Unlimited clients", "AI Automation", "Financial Reports", "Priority Support", "Multi-currency"],
    cta: "Start Trial",
    popular: true
  },
  {
    name: "Business",
    price: "79",
    description: "Advanced features for established teams.",
    features: ["Everything in Pro", "Payroll Integration", "Team Access (5 seats)", "API Access", "Dedicated Manager"],
    cta: "Contact Sales",
    popular: false
  }
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
  const user = null;
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

  if (user) return null;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-slate-100 selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden text-[15px]">

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
                ? 'radial-gradient(ellipse at center, transparent 0%, #0a0a0a 70%)'
                : 'radial-gradient(ellipse at center, transparent 0%, rgba(255,255,255,0.85) 70%)',
          }}
        />
      </div>

      {/* ============ NAVBAR ============ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-1.5 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/[0.06] shadow-sm'
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
              {['Features', 'How it Works', 'Pricing'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-all"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Right Side */}
            <div className="hidden md:flex items-center gap-2.5">
              <button
                onClick={toggleMode}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
                aria-label="Toggle theme"
              >
                {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link href="/login" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-[13px] font-semibold text-white rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 flex items-center gap-1.5"
              >
                Get Started <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Mobile */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={toggleMode}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
              >
                {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/[0.06] overflow-hidden transition-all duration-300 ${
            isMenuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-4 space-y-1">
            <a href="#features" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04]">Features</a>
            <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04]">How it Works</a>
            <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04]">Pricing</a>
            <hr className="border-slate-200/60 dark:border-white/[0.06] my-2" />
            <button onClick={toggleMode} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 w-full">
              {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <Link href="/login" className="block px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400">Sign In</Link>
            <Link href="/signup" className="block text-center mt-1 px-3 py-2.5 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-brand-500 to-brand-600">Get Started Free</Link>
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
          <p className="text-center text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Invoices, expenses, reports, and bookkeeping — managed through
            simple chat. No spreadsheets, no complexity.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-7 py-3 rounded-lg text-white font-semibold text-sm bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-7 py-3 rounded-lg font-semibold text-sm text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08] hover:bg-slate-200/60 dark:hover:bg-white/[0.1] transition-all flex items-center justify-center gap-2"
            >
              Explore
            </a>
          </div>

          {/* Trust Markers */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brand-500" /> Free forever
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brand-500" /> Real-time data
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brand-500" /> No credit card
            </span>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-12 relative max-w-3xl mx-auto">
            <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-brand-500/15 to-brand-600/10 blur-2xl opacity-60 pointer-events-none" />

            <div className="relative rounded-xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-2xl shadow-slate-200/40 dark:shadow-black/40 bg-white dark:bg-[#111111]">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50/80 dark:bg-[#161616] border-b border-slate-200/60 dark:border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                </div>
                <div className="flex-1 h-6 rounded-md bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] flex items-center px-3 text-[11px] text-slate-400 dark:text-slate-600">
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
                      <div className="bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] px-3.5 py-2.5 rounded-2xl rounded-tl-md text-[13px] text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 mb-1 text-brand-600 dark:text-brand-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </div>
                        Invoice created successfully for <strong className="text-slate-800 dark:text-slate-200">Acme Inc</strong>. Due in 30 days.
                      </div>

                      {/* Invoice Entity Card */}
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900/50">
                        <div className="px-3.5 py-2.5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">INV-0042</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Draft</span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">
                              <span>Acme Inc</span>
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due Mar 15</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-[15px] font-bold text-slate-800 dark:text-slate-200">$3,500.00</div>
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
                      <div className="bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] px-3.5 py-2.5 rounded-2xl rounded-tl-md text-[13px] text-slate-600 dark:text-slate-400">
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
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-500 bg-white dark:bg-transparent hover:border-brand-400 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer select-none">
                        <action.icon className="w-3 h-3" />
                        {action.label}
                      </span>
                    ))}
                  </div>
                  {/* Input Bar */}
                  <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 flex items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 flex-shrink-0" />
                    <div className="flex-1 text-[12px] text-slate-400 dark:text-slate-600 truncate">Ask Flow AI anything...</div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-white/[0.04]">
                        <Zap className="w-2.5 h-2.5" /> Flow AI v1
                      </span>
                      <Mic className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center text-white">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                  {/* Disclaimer */}
                  <p className="text-center text-[9px] text-slate-400 dark:text-slate-600 mt-1.5">Flow AI can make mistakes. Please verify important information.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ORIGINAL SECTIONS BELOW ============ */}

      {/* Social Proof Ticker */}
      <section className="relative z-10 py-8 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
        <p className="text-center text-xs font-semibold text-slate-400 mb-5 uppercase tracking-wider">Powering the next generation of business</p>
        <div className="relative w-full overflow-hidden">
          <div className="flex whitespace-nowrap w-[200%]" style={{ animation: 'scroll 30s linear infinite' }}>
             {[...Array(2)].map((_, setIndex) => (
                <div key={setIndex} className="flex space-x-14 mx-8 items-center">
                  {['Acme Corp', 'GlobalTech', 'Nebula Inc', 'FastScale', 'GreenLeaf', 'Stark Ind', 'Wayne Ent', 'Cyberdyne'].map((company, i) => (
                    <div key={i} className="text-lg font-bold text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors cursor-default select-none">
                      {company}
                    </div>
                  ))}
                </div>
             ))}
          </div>
          <div className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-slate-50 dark:from-[#0a0a0a] to-transparent pointer-events-none"></div>
          <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-slate-50 dark:from-[#0a0a0a] to-transparent pointer-events-none"></div>
        </div>
      </section>

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
              <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Send a message like you would to a friend. Flowbooks parses natural language to categorize transactions, create invoices, and update your ledger instantly. No forms, no dropdowns.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  'Recognizes vendors and categories automatically',
                  'Handles multi-step commands',
                  'Learns your business context over time'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-100 dark:from-brand-900/20 to-transparent rounded-2xl transform rotate-3 scale-95 opacity-50"></div>
              <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-6 space-y-3">
                 <div className="flex justify-end">
                   <div className="bg-brand-600 text-white rounded-2xl rounded-br-sm px-3.5 py-2 text-[13px] max-w-[80%] shadow-lg">
                     Spent $150 at Office Depot for printer paper and ink
                   </div>
                 </div>
                 <div className="flex justify-start">
                   <div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[13px] max-w-[80%] border border-slate-200 dark:border-slate-700">
                     <div className="font-semibold mb-1 text-brand-700 dark:text-brand-400 text-xs">Expense Recorded</div>
                     <div className="flex justify-between gap-4 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-1.5 mt-1">
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
              <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Create professional invoices in seconds. Better yet, let Flowbooks automatically follow up with clients who are late on payments using polite, customizable email sequences.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-0.5 text-sm">Recurring Bills</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Set it and forget it for retainers.</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-0.5 text-sm">Pay Links</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">One-click payment for clients.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 relative group cursor-pointer">
              <div className="absolute -inset-2 bg-gradient-to-br from-brand-500/20 to-brand-600/10 rounded-2xl opacity-20 blur-lg group-hover:opacity-30 transition"></div>
              <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden transform group-hover:scale-[1.01] transition duration-500">
                {/* Terracotta accent bar */}
                <div className="h-1 bg-gradient-to-r from-brand-500 to-brand-600" />
                {/* Header */}
                <div className="px-5 pt-4 pb-3 flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-0.5">Invoice</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">#INV-2024-001</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Acme Corporation</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Sent</span>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">Due Jan 15, 2025</div>
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
                    <tbody className="text-slate-600 dark:text-slate-400">
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-1.5 px-2 text-slate-800 dark:text-slate-200">Website Redesign</td>
                        <td className="py-1.5 px-2 text-center">1</td>
                        <td className="py-1.5 px-2 text-right">$3,000.00</td>
                        <td className="py-1.5 px-2 text-right font-medium text-slate-800 dark:text-slate-200">$3,000.00</td>
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/[0.01]">
                        <td className="py-1.5 px-2 text-slate-800 dark:text-slate-200">SEO Optimization</td>
                        <td className="py-1.5 px-2 text-center">5</td>
                        <td className="py-1.5 px-2 text-right">$200.00</td>
                        <td className="py-1.5 px-2 text-right font-medium text-slate-800 dark:text-slate-200">$1,000.00</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 text-slate-800 dark:text-slate-200">Hosting (Annual)</td>
                        <td className="py-1.5 px-2 text-center">1</td>
                        <td className="py-1.5 px-2 text-right">$500.00</td>
                        <td className="py-1.5 px-2 text-right font-medium text-slate-800 dark:text-slate-200">$500.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Totals */}
                <div className="px-5 pb-4">
                  <div className="flex justify-end">
                    <div className="w-48 space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Subtotal</span>
                        <span>$4,500.00</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Tax (0%)</span>
                        <span>$0.00</span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-1 mt-1 flex justify-between font-bold text-[13px] text-slate-900 dark:text-white">
                        <span>Total</span>
                        <span className="text-brand-600 dark:text-brand-400">$4,500.00</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Footer */}
                <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 dark:text-slate-600">Powered by Flowbooks</span>
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
      <section id="how-it-works" className="relative z-10 py-20 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">Everything you need to run your business</h2>
            <p className="text-base text-slate-600 dark:text-slate-400">From day one to IPO, we&apos;ve got the tools to keep your finances healthy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[180px]">

             {/* 1 — Financial Reporting (wide) */}
             <div className="md:col-span-2 md:row-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
               <div className="relative z-10">
                 <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-3">
                   <BarChart3 className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                 </div>
                 <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Real-time Financial Reporting</h3>
                 <p className="text-slate-500 dark:text-slate-400 max-w-xs text-[13px] leading-relaxed">Generate P&L, Balance Sheets, and Cash Flow statements instantly.</p>
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
             <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all overflow-hidden relative group">
                <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-2.5">
                  <Receipt className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Expense Tracking</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[13px]">Snap receipts. AI extracts the data.</p>
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
             <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all overflow-hidden relative">
                <div className="w-9 h-9 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center mb-2.5">
                  <Wallet className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Bank Sync</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[13px]">10,000+ banks connected securely.</p>
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
             <div className="md:row-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all">
                <div className="h-full flex flex-col">
                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-2.5">
                    <Users className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Customer Management</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[13px] mb-3">Track details and payment history.</p>
                  {/* Customer list */}
                  <div className="flex-1 space-y-2">
                    {[
                      { name: 'Sarah Chen', amount: '$12,400', color: 'bg-blue-500' },
                      { name: 'Alex Rivera', amount: '$8,750', color: 'bg-emerald-500' },
                      { name: 'Jordan Lee', amount: '$5,200', color: 'bg-purple-500' },
                      { name: 'Morgan Taylor', amount: '$3,800', color: 'bg-amber-500' },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
                        <div className={`w-6 h-6 rounded-full ${c.color} flex items-center justify-center text-[9px] font-bold text-white`}>{c.name[0]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">{c.name}</div>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{c.amount}</div>
                      </div>
                    ))}
                  </div>
                </div>
             </div>

             {/* 5 — Recurring Billing */}
             <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all overflow-hidden relative">
                <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-2.5">
                  <RefreshCw className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Recurring Billing</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[13px]">Automate retainer invoices.</p>
                {/* Mini calendar dots */}
                <div className="absolute bottom-3 right-3 grid grid-cols-4 gap-1">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i === 2 || i === 6 || i === 10 ? 'bg-emerald-400 dark:bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`} />
                  ))}
                </div>
             </div>

             {/* 6 — Multi-Currency (wide) */}
             <div className="md:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all overflow-hidden relative">
                <div className="flex items-start gap-4">
                  <div>
                    <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-2.5">
                      <CreditCard className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Multi-Currency Support</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-[13px]">Invoice and track in any currency. Auto-conversion at real-time rates.</p>
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
             <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all overflow-hidden relative">
                <div className="w-9 h-9 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center mb-2.5">
                  <Shield className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Audit Proof</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[13px]">Every change is logged.</p>
                {/* Mini log lines */}
                <div className="absolute bottom-3 left-5 right-5 space-y-1">
                  {['Invoice created', 'Payment received', 'Status updated'].map((log, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[9px]">
                      <div className="w-1 h-1 rounded-full bg-brand-400" />
                      <span className="text-slate-400 dark:text-slate-600">{log}</span>
                    </div>
                  ))}
                </div>
             </div>

             {/* 8 — Tax Ready */}
             <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all overflow-hidden relative group">
                <div className="w-9 h-9 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center mb-2.5">
                  <Calculator className="w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Tax Ready</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[13px]">Auto-calculate and file on time.</p>
                {/* Mini progress */}
                <div className="absolute bottom-4 left-5 right-5">
                  <div className="flex justify-between text-[9px] text-cyan-600 dark:text-cyan-400 font-medium mb-1">
                    <span>Tax Report</span>
                    <span>92%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[92%] bg-cyan-400 dark:bg-cyan-500 rounded-full" />
                  </div>
                </div>
             </div>

          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-20 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">Loved by businesses everywhere</h2>
            <div className="flex items-center justify-center gap-1 text-amber-400">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
              <span className="text-slate-600 dark:text-slate-400 text-xs ml-2 font-medium">4.9/5 from 500+ reviews</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 relative hover:-translate-y-1 transition-transform duration-300">
                <div className="text-4xl text-brand-200 dark:text-brand-800 absolute top-3 left-5 font-serif">&ldquo;</div>
                <p className="text-slate-700 dark:text-slate-300 relative z-10 mb-5 italic pt-3 text-sm">{t.content}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-300 text-xs">
                    {t.image}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-20 bg-slate-900 text-white overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-500 rounded-full blur-[128px]"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500 rounded-full blur-[128px]"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Simple, transparent pricing</h2>
            <p className="text-slate-400 text-sm">No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 items-center">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 border relative ${
                  plan.popular
                    ? 'bg-white/10 border-brand-500/50 backdrop-blur-sm shadow-2xl shadow-brand-500/10 scale-105 z-10'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 transition-colors'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold mb-1.5">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-slate-400 text-sm">/month</span>
                </div>
                <p className="text-slate-400 text-xs mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <Check className="w-3.5 h-3.5 text-brand-400" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:shadow-lg hover:shadow-brand-500/20'
                      : 'bg-white text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 py-20 bg-white dark:bg-[#0a0a0a]">
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
            <p className="mt-5 text-xs text-white/60">No credit card required &bull; 14-day free trial</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-50 dark:bg-slate-900/50 pt-16 pb-8 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <BrandName className="text-lg" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-xs mb-5">
                AI-powered accounting for the modern business. We make bookkeeping as easy as sending a text.
              </p>
              <div className="flex gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-brand-500 hover:text-white transition-colors cursor-pointer flex items-center justify-center">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-5 text-sm">Product</h4>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">API</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-5 text-sm">Company</h4>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-5 text-sm">Legal</h4>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <li><a href="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              &copy; {new Date().getFullYear()} Flowbooks Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></div>
              System Operational
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll animation keyframe */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
