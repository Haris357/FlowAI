'use client';
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  MessageCircle, Zap, TrendingUp, Shield, Users, ArrowRight, Check, Sparkles,
  BarChart3, Receipt, FileText, Wallet, BookOpen, CreditCard, RefreshCw,
  Calculator, Menu, X, ChevronDown, CheckCircle2, Plus, Minus, Moon, Sun,
  Eye, Send, Download, Calendar, Paperclip, Mic, LayoutDashboard, Info,
  Lock, Mail, Banknote, ClipboardList, FileSignature,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import FlowBooksLogo from '@/components/FlowBooksLogo';

// ─── Simple fade-up for scroll sections ──────────────────────────────────────
function FadeUp({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(18px)',
        transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

// ─── Accordion ────────────────────────────────────────────────────────────────
function AccordionItem({ question, answer, isOpen, onClick, index }: { question: string; answer: string; isOpen: boolean; onClick: () => void; index: number }) {
  return (
    <div className={`rounded-2xl transition-colors duration-200 ${isOpen ? 'liquid-glass shadow-lg shadow-slate-200/50 dark:shadow-black/20' : 'bg-transparent border border-transparent hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'}`}>
      <button className="flex items-center justify-between w-full px-5 py-4 text-left focus:outline-none" onClick={onClick}>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono font-bold transition-colors duration-200 ${isOpen ? 'text-brand-500' : 'text-slate-300 dark:text-[#3D3A37]'}`}>0{index + 1}</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{question}</span>
        </div>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${isOpen ? 'bg-brand-500' : 'bg-slate-100 dark:bg-[#2D2B28]'}`}>
          {isOpen ? <Minus className="w-3.5 h-3.5 text-white" /> : <Plus className="w-3.5 h-3.5 text-slate-400 dark:text-[#78736D]" />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p className="px-5 pb-5 pl-[52px] text-slate-600 dark:text-[#A8A29E] leading-relaxed text-sm">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const DEMO_MSG_1 = 'Create invoice for Acme Inc, web design $3,500';
const DEMO_MSG_2 = 'Record AWS subscription — $199/month';
const DEMO_MSG_3 = 'Acme Inc just sent payment!';

const faqs = [
  { q: "Is my financial data secure?", a: "Absolutely. Your data is encrypted in transit and at rest using 256-bit AES encryption, secured by Google Cloud infrastructure. We never sell your data to third parties." },
  { q: "Do I need to know accounting to use this?", a: "Not at all. Flowbooks is designed for non-accountants. If you can send a text message, you can do your bookkeeping." },
  { q: "Can I export my data to other software?", a: "Yes, you can export all your data to CSV, PDF, or Excel formats at any time. We believe in data portability." },
  { q: "How does the AI handle tax calculations?", a: "Flowbooks automatically applies default tax rates based on your location settings. You can also customize tax rules for specific items or clients." },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { user } = useAuth();
  const { mode, toggleMode } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [demoPhase, setDemoPhase] = useState(0);
  const [invoiceStatus, setInvoiceStatus] = useState<'draft' | 'sent' | 'paid'>('draft');
  const [emailFlying, setEmailFlying] = useState(false);
  const [demoFading, setDemoFading] = useState(false);
  const [typedMsg, setTypedMsg] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const typerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const runDemo = () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      if (typerRef.current) clearInterval(typerRef.current);
      const wait = (fn: () => void, ms: number) => { timersRef.current.push(setTimeout(fn, ms)); };

      setDemoPhase(0); setInvoiceStatus('draft'); setEmailFlying(false); setDemoFading(false);
      setTypedMsg(''); setIsTyping(true);

      let i = 0;
      typerRef.current = setInterval(() => {
        if (i < DEMO_MSG_1.length) { setTypedMsg(DEMO_MSG_1.slice(0, ++i)); }
        else { clearInterval(typerRef.current!); typerRef.current = null; setIsTyping(false); }
      }, 45);

      wait(() => setDemoPhase(1), 3000);
      wait(() => setEmailFlying(true), 4500);
      wait(() => { setEmailFlying(false); setInvoiceStatus('sent'); setDemoPhase(3); }, 6300);
      wait(() => setDemoPhase(4), 7800);
      wait(() => setDemoPhase(5), 9300);
      wait(() => setDemoPhase(6), 10800);
      wait(() => { setDemoPhase(7); setInvoiceStatus('paid'); }, 12300);
      wait(() => setDemoFading(true), 15500);
      wait(runDemo, 16400);
    };

    runDemo();
    return () => {
      timersRef.current.forEach(clearTimeout);
      if (typerRef.current) clearInterval(typerRef.current);
    };
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [demoPhase, emailFlying]);

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#1A1915] font-sans text-slate-900 dark:text-[#EEECE8] selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden text-[15px]">

      {/* Static background — no animation */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full opacity-[0.05] dark:opacity-[0.03]" style={{ background: 'var(--brand-500)', filter: 'blur(150px)', transform: 'translate(30%, -40%)' }} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-[0.04] dark:opacity-[0.02]" style={{ background: 'var(--brand-500)', filter: 'blur(150px)', transform: 'translate(-30%, 40%)' }} />
      </div>

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-1.5 liquid-glass-strong' : 'py-3 bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <FlowBooksLogo size="sm" />

            <div className="hidden lg:flex items-center gap-0.5 liquid-glass-subtle rounded-full px-1.5 py-1">
              <Link href="/pricing" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-colors flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" />Pricing</Link>
              <Link href="/about" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-colors flex items-center gap-1.5"><Info className="w-3.5 h-3.5" />About</Link>
              <Link href="/blog" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-colors flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />Blog</Link>
              <Link href="/contact" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-colors flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Contact</Link>
              <div className="relative">
                <button onClick={() => setIsMoreOpen(!isMoreOpen)} onBlur={() => setTimeout(() => setIsMoreOpen(false), 150)} className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-white/[0.06] transition-colors flex items-center gap-1.5">
                  More <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isMoreOpen && (
                    <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }} className="absolute right-0 top-full mt-2 w-52 liquid-glass-strong rounded-2xl overflow-hidden">
                      <div className="p-2">
                        <Link href="/privacy" className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"><Shield className="w-4 h-4" />Privacy Policy</Link>
                        <Link href="/terms" className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"><FileText className="w-4 h-4" />Terms of Service</Link>
                        <Link href="/security" className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"><Lock className="w-4 h-4" />Security</Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2.5">
              <button onClick={toggleMode} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-[#A8A29E] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors" aria-label="Toggle theme">
                {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {user ? (
                <Link href="/companies" className="px-5 py-2 text-[13px] font-semibold text-white rounded-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 transition-all hover:-translate-y-0.5 flex items-center gap-1.5"><LayoutDashboard className="w-3.5 h-3.5" /> Dashboard</Link>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white transition-colors">Sign In</Link>
                  <Link href="/signup" className="px-5 py-2 text-[13px] font-semibold text-white rounded-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 transition-all hover:-translate-y-0.5 flex items-center gap-1.5">Get Started <ArrowRight className="w-3 h-3" /></Link>
                </>
              )}
            </div>

            <div className="flex lg:hidden items-center gap-1.5">
              <button onClick={toggleMode} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-[#A8A29E] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
                {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-[#A8A29E] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }} className="lg:hidden liquid-glass-strong overflow-hidden">
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
                  {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}{mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
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
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative pt-32 pb-8 lg:pt-40 lg:pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Hero text — CSS animation, no JS overhead */}
          <style>{`
            @keyframes heroFadeUp {
              from { opacity: 0; transform: translateY(18px); }
              to   { opacity: 1; transform: none; }
            }
            .hero-anim { animation: heroFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both; }
          `}</style>

          <div className="text-center">
            <div className="flex justify-center mb-5 hero-anim" style={{ animationDelay: '0.05s' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50/80 dark:bg-brand-500/10 border border-brand-200/50 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 text-[11px] font-semibold tracking-wide backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                AI-FIRST ACCOUNTING PLATFORM
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.08] mb-5 max-w-3xl mx-auto hero-anim" style={{ animationDelay: '0.12s' }}>
              Your finances,{' '}
              <span className="relative inline-block">
                <span style={{ background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  one conversation.
                </span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 8" fill="none">
                  <path d="M1 5.5C60 2 120 2 150 4C180 6 240 3 299 5.5" stroke="var(--brand-500)" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
                </svg>
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-500 dark:text-[#A8A29E] max-w-lg mx-auto mb-8 leading-relaxed hero-anim" style={{ animationDelay: '0.2s' }}>
              Invoices, expenses, reports, and bookkeeping — managed through simple chat. No spreadsheets, no complexity.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5 hero-anim" style={{ animationDelay: '0.27s' }}>
              {user ? (
                <Link href="/companies" className="w-full sm:w-auto px-7 py-3 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"><LayoutDashboard className="w-4 h-4" /> Go to Dashboard</Link>
              ) : (
                <>
                  <Link href="/signup" className="group w-full sm:w-auto px-7 py-3 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
                    Start Free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <a href="#how-it-works" className="w-full sm:w-auto px-7 py-3 rounded-full font-semibold text-sm text-slate-700 dark:text-[#DBD8D0] bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.12] hover:shadow-md transition-all flex items-center justify-center gap-2">
                    Explore
                  </a>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-xs text-slate-500 dark:text-[#78736D] hero-anim" style={{ animationDelay: '0.34s' }}>
              {['256-bit AES encryption', 'Real-time data', 'Set up in minutes'].map((t, i) => (
                <span key={i} className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-brand-500" /> {t}</span>
              ))}
            </div>
          </div>

          {/* Enhanced Chat Preview */}
          <div className="mt-14 relative max-w-3xl mx-auto hero-anim" style={{ animationDelay: '0.42s' }}>
            <div className="absolute -inset-px rounded-[20px] bg-gradient-to-b from-brand-500/20 via-brand-500/5 to-transparent pointer-events-none" />
            <div className="absolute -inset-8 bg-gradient-to-b from-brand-500/8 to-transparent rounded-3xl blur-2xl pointer-events-none" />
            <div className="relative rounded-[20px] overflow-hidden liquid-glass-strong">

              {/* Title bar */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50/80 dark:bg-[#232220] border-b border-slate-200/60 dark:border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                </div>
                <div className="flex-1 h-6 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] flex items-center px-3 text-[11px] text-slate-400 dark:text-[#5C5752]">flowbooks.com/chat</div>
                <AnimatePresence>
                  {demoPhase >= 3 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7, x: 8 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/30 flex-shrink-0"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-blue-500"
                      />
                      <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 whitespace-nowrap">Email sent</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-col">
                {/* Messages */}
                <div
                  ref={chatScrollRef}
                  className="p-4 sm:p-5 space-y-3 [&::-webkit-scrollbar]:hidden"
                  style={{
                    opacity: demoFading ? 0 : 1,
                    transition: 'opacity 0.7s ease',
                    height: 380,
                    overflowY: 'auto',
                    scrollbarWidth: 'none',
                  }}
                >
                  {/* User message 1 — invoice request (typed) */}
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-md text-[13px] shadow-md shadow-brand-500/15 max-w-[82%]">
                      {typedMsg}
                      {isTyping && <span className="inline-block w-0.5 h-3.5 ml-0.5 bg-white/70 animate-pulse align-middle rounded-full" />}
                    </div>
                  </div>

                  {/* AI Invoice response */}
                  <AnimatePresence>
                    {demoPhase >= 1 && (
                      <motion.div
                        key="invoice-response"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="flex gap-2.5"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2.5">
                          <div className="bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] px-4 py-3 rounded-2xl rounded-tl-md text-[13px] text-slate-600 dark:text-[#A8A29E]">
                            <div className="flex items-center gap-1.5 mb-1 text-brand-600 dark:text-brand-400 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </div>
                            Invoice created for <strong className="text-slate-800 dark:text-[#EEECE8]">Acme Inc</strong>. Due in 30 days.
                          </div>
                          {/* Invoice card with live status badge */}
                          <div className="border border-slate-200 dark:border-[#3D3A37] rounded-xl overflow-hidden bg-white dark:bg-[#232220]/50">
                            <div className="px-4 py-3 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[13px] font-semibold text-slate-800 dark:text-[#EEECE8]">INV-0042</span>
                                  <AnimatePresence mode="wait">
                                    {invoiceStatus === 'draft' && (
                                      <motion.span key="draft" initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.75 }} transition={{ duration: 0.22 }}
                                        className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Draft</motion.span>
                                    )}
                                    {invoiceStatus === 'sent' && (
                                      <motion.span key="sent" initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.75 }} transition={{ duration: 0.22 }}
                                        className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Sent</motion.span>
                                    )}
                                    {invoiceStatus === 'paid' && (
                                      <motion.span key="paid" initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.75 }} transition={{ duration: 0.22 }}
                                        className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Paid</motion.span>
                                    )}
                                  </AnimatePresence>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-[#78736D] mt-0.5">
                                  <span>Acme Inc</span>
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due Mar 15</span>
                                </div>
                              </div>
                              <div className="text-[15px] font-bold text-slate-800 dark:text-[#EEECE8] flex-shrink-0">$3,500.00</div>
                            </div>
                          </div>
                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-1.5">
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-200/60 dark:border-brand-700/30">
                              <Eye className="w-3 h-3" /> View
                            </button>
                            <motion.button
                              animate={emailFlying ? { scale: [1, 0.95, 1], opacity: [1, 0.6, 1] } : {}}
                              transition={{ duration: 0.65, repeat: emailFlying ? Infinity : 0 }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-700/30"
                            >
                              <Send className="w-3 h-3" />
                              {emailFlying ? 'Sending...' : 'Send Invoice'}
                            </motion.button>
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-700/30">
                              <Download className="w-3 h-3" /> Download PDF
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email sending animation */}
                  <AnimatePresence>
                    {emailFlying && (
                      <motion.div
                        key="email-fly"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: [0, 1, 1, 0], y: [6, 0, -6, -36] }}
                        transition={{ duration: 1.9, times: [0, 0.15, 0.72, 1] }}
                        className="flex justify-center"
                      >
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400">
                          <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 0.55, repeat: Infinity }}>
                            <Mail className="w-4 h-4" />
                          </motion.div>
                          <span className="text-[12px] font-medium">Sending to billing@acme.com</span>
                          <div className="flex gap-0.5">
                            {[0, 1, 2].map(i => (
                              <motion.div key={i} className="w-1 h-1 rounded-full bg-blue-500"
                                animate={{ opacity: [0.25, 1, 0.25] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.22 }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email delivered notification */}
                  <AnimatePresence>
                    {demoPhase >= 3 && (
                      <motion.div
                        key="email-delivered"
                        initial={{ opacity: 0, y: -10, scale: 0.93 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className="flex justify-center"
                      >
                        <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/40">
                          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                            <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="text-[12px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                              Invoice delivered <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                            <div className="text-[10px] text-blue-500/70 dark:text-blue-400/60 mt-0.5">billing@acme.com · just now · via Flow AI</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* User message 2 — expense */}
                  <AnimatePresence>
                    {demoPhase >= 4 && (
                      <motion.div key="expense-msg" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="flex justify-end">
                        <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-md text-[13px] shadow-md shadow-brand-500/15">
                          {DEMO_MSG_2}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Expense card */}
                  <AnimatePresence>
                    {demoPhase >= 5 && (
                      <motion.div key="expense-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] px-4 py-3 rounded-2xl rounded-tl-md text-[13px] text-slate-600 dark:text-[#A8A29E]">
                            <div className="flex items-center gap-1.5 mb-1 text-brand-600 dark:text-brand-400 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> Expense logged
                            </div>
                            <strong className="text-slate-800 dark:text-[#EEECE8]">AWS subscription</strong> added under <span className="text-violet-600 dark:text-violet-400 font-medium">Cloud Services</span>.
                          </div>
                          <div className="border border-slate-200 dark:border-[#3D3A37] rounded-xl bg-white dark:bg-[#232220]/50 px-4 py-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                              <Receipt className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-semibold text-slate-800 dark:text-[#EEECE8]">AWS Subscription</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-[9px] font-semibold">Cloud Services</span>
                                <span className="text-[11px] text-slate-500 dark:text-[#78736D]">Recurring · Monthly</span>
                              </div>
                            </div>
                            <div className="text-[15px] font-bold text-slate-800 dark:text-[#EEECE8] flex-shrink-0">$199.00</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* User message 3 — payment */}
                  <AnimatePresence>
                    {demoPhase >= 6 && (
                      <motion.div key="payment-msg" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="flex justify-end">
                        <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-md text-[13px] shadow-md shadow-brand-500/15">
                          {DEMO_MSG_3}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Payment confirmation */}
                  <AnimatePresence>
                    {demoPhase >= 7 && (
                      <motion.div key="payment-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] px-4 py-3 rounded-2xl rounded-tl-md text-[13px] text-slate-600 dark:text-[#A8A29E]">
                            <div className="flex items-center gap-1.5 mb-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> Payment received!
                            </div>
                            <strong className="text-slate-800 dark:text-[#EEECE8]">$3,500</strong> from Acme Inc recorded. INV-0042 marked as <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Paid</span>.
                          </div>
                          <div className="border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                              <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-semibold text-slate-800 dark:text-[#EEECE8]">Payment Received</div>
                              <div className="text-[11px] text-slate-500 dark:text-[#78736D] mt-0.5">Acme Inc · INV-0042 · just now</div>
                            </div>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.6 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ type: 'spring', delay: 0.3, stiffness: 300, damping: 22 }}
                              className="text-[15px] font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0"
                            >
                              +$3,500
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="h-1" />
                </div>

                {/* Input bar */}
                <div className="px-4 sm:px-5 pb-3 pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                  <div className="flex flex-wrap gap-1.5 mb-2.5 justify-center">
                    {[{ icon: FileText, label: 'Create Invoice' }, { icon: Receipt, label: 'Record Expense' }, { icon: BarChart3, label: 'View Reports' }, { icon: Users, label: 'Add Customer' }].map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border border-slate-200 dark:border-[#3D3A37] text-slate-500 dark:text-[#78736D] bg-white dark:bg-transparent hover:border-brand-400 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer select-none">
                        <a.icon className="w-3 h-3" />{a.label}
                      </span>
                    ))}
                  </div>
                  <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 dark:text-[#5C5752] flex-shrink-0" />
                    <div className="flex-1 text-[12px] text-slate-400 dark:text-[#5C5752] truncate">Ask Flow AI anything...</div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium text-slate-400 dark:text-[#5C5752] bg-slate-100 dark:bg-white/[0.04]"><Zap className="w-2.5 h-2.5" /> Flow AI v1</span>
                      <Mic className="w-3.5 h-3.5 text-slate-400 dark:text-[#5C5752]" />
                      <div className="w-7 h-7 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center text-white"><ArrowRight className="w-3 h-3" /></div>
                    </div>
                  </div>
                  <p className="text-center text-[9px] text-slate-400 dark:text-[#5C5752] mt-1.5">Flow AI can make mistakes. Please verify important information.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="features" className="relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          <FadeUp className="max-w-2xl mb-16">
            <p className="text-brand-600 dark:text-brand-400 text-xs font-semibold tracking-widest uppercase mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-4">Talk to your books,<br />they talk back.</h2>
            <p className="text-base text-slate-500 dark:text-[#A8A29E] leading-relaxed">No forms, no dropdowns, no spreadsheet headaches. Just tell Flowbooks what happened and it handles the rest.</p>
          </FadeUp>

          {/* Feature 1 */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center mb-24">
            <FadeUp className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/20 border border-brand-200/50 dark:border-brand-700/30">
                <MessageCircle className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span className="text-[11px] font-semibold text-brand-700 dark:text-brand-400">Natural Language Input</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-snug">Just text your accountant. <span className="text-slate-400 dark:text-[#5C5752]">(Except it&apos;s AI)</span></h3>
              <p className="text-base text-slate-600 dark:text-[#A8A29E] leading-relaxed">Send a message like you would to a friend. Flowbooks parses natural language to categorize transactions, create invoices, and update your ledger instantly.</p>
              <div className="space-y-3 pt-1">
                {['Recognizes vendors and categories automatically', 'Handles multi-step commands', 'Learns your business context over time'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-[#DBD8D0]">
                    <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-brand-600 dark:text-brand-400" /></div>
                    {item}
                  </div>
                ))}
              </div>
            </FadeUp>

            <FadeUp delay={0.1} className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-brand-500/8 to-transparent rounded-3xl blur-xl pointer-events-none" />
              <div className="relative liquid-glass rounded-2xl p-5 space-y-3">
                <div className="flex justify-end">
                  <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-[13px] max-w-[80%] shadow-lg shadow-brand-500/15">Spent $150 at Office Depot for printer paper and ink</div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-slate-50 dark:bg-[#2D2B28] text-slate-800 dark:text-[#EEECE8] rounded-2xl rounded-bl-sm px-4 py-3 text-[13px] max-w-[80%] border border-slate-100 dark:border-[#3D3A37]">
                    <div className="font-semibold mb-1.5 text-brand-700 dark:text-brand-400 text-xs flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Expense Recorded</div>
                    <div className="flex justify-between gap-4 text-[11px] text-slate-500 dark:text-[#A8A29E] border-t border-slate-200 dark:border-[#3D3A37] pt-2 mt-1.5">
                      <span>Amount: $150.00</span><span>Cat: Office Supplies</span>
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Feature 2 */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
            <FadeUp delay={0.1} className="order-2 lg:order-1 relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/8 to-transparent rounded-3xl blur-xl pointer-events-none" />
              <div className="relative liquid-glass-strong rounded-2xl overflow-hidden">
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
                    <thead><tr className="bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-semibold"><td className="py-1.5 px-2 rounded-l-lg">Description</td><td className="py-1.5 px-2 text-center">Qty</td><td className="py-1.5 px-2 text-right">Rate</td><td className="py-1.5 px-2 text-right rounded-r-lg">Amount</td></tr></thead>
                    <tbody className="text-slate-600 dark:text-[#A8A29E]">
                      <tr className="border-b border-slate-100 dark:border-[#2D2B28]"><td className="py-1.5 px-2 text-slate-800 dark:text-[#EEECE8]">Website Redesign</td><td className="py-1.5 px-2 text-center">1</td><td className="py-1.5 px-2 text-right">$3,000.00</td><td className="py-1.5 px-2 text-right font-medium text-slate-800 dark:text-[#EEECE8]">$3,000.00</td></tr>
                      <tr className="border-b border-slate-100 dark:border-[#2D2B28]"><td className="py-1.5 px-2 text-slate-800 dark:text-[#EEECE8]">SEO Optimization</td><td className="py-1.5 px-2 text-center">5</td><td className="py-1.5 px-2 text-right">$200.00</td><td className="py-1.5 px-2 text-right font-medium text-slate-800 dark:text-[#EEECE8]">$1,000.00</td></tr>
                      <tr><td className="py-1.5 px-2 text-slate-800 dark:text-[#EEECE8]">Hosting (Annual)</td><td className="py-1.5 px-2 text-center">1</td><td className="py-1.5 px-2 text-right">$500.00</td><td className="py-1.5 px-2 text-right font-medium text-slate-800 dark:text-[#EEECE8]">$500.00</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-5 pb-4">
                  <div className="flex justify-end">
                    <div className="w-48 space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-500 dark:text-[#A8A29E]"><span>Subtotal</span><span>$4,500.00</span></div>
                      <div className="flex justify-between text-slate-500 dark:text-[#A8A29E]"><span>Tax (0%)</span><span>$0.00</span></div>
                      <div className="border-t border-slate-200 dark:border-[#3D3A37] pt-1.5 mt-1.5 flex justify-between font-bold text-[13px] text-slate-900 dark:text-white"><span>Total</span><span className="text-brand-600 dark:text-brand-400">$4,500.00</span></div>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-2.5 border-t border-slate-100 dark:border-[#2D2B28] bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 dark:text-[#5C5752]">Powered by Flowbooks</span>
                  <div className="flex gap-1.5">
                    <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-200/60 dark:border-brand-700/30"><Eye className="w-2.5 h-2.5" /> View</button>
                    <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-700/30"><Download className="w-2.5 h-2.5" /> PDF</button>
                  </div>
                </div>
              </div>
            </FadeUp>

            <FadeUp className="order-1 lg:order-2 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/30">
                <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">Smart Invoicing</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-snug">Invoices that chase payments for you</h3>
              <p className="text-base text-slate-600 dark:text-[#A8A29E] leading-relaxed">Create professional invoices in seconds. Let Flowbooks automatically follow up with clients who are late on payments using polite, customizable email sequences.</p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-4 liquid-glass-subtle rounded-2xl">
                  <RefreshCw className="w-4 h-4 text-brand-500 mb-2" />
                  <h4 className="font-bold text-slate-900 dark:text-white mb-0.5 text-sm">Recurring Bills</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A8A29E]">Set it and forget it for retainers.</p>
                </div>
                <div className="p-4 liquid-glass-subtle rounded-2xl">
                  <Zap className="w-4 h-4 text-brand-500 mb-2" />
                  <h4 className="font-bold text-slate-900 dark:text-white mb-0.5 text-sm">Pay Links</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A8A29E]">One-click payment for clients.</p>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ═══════════ BENTO GRID ═══════════ */}
      <section id="how-it-works" className="relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeUp className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-brand-600 dark:text-brand-400 text-xs font-semibold tracking-widest uppercase mb-3">Capabilities</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">Everything you need to run your business</h2>
            <p className="text-base text-slate-500 dark:text-[#A8A29E]">From day one to IPO, we&apos;ve got the tools to keep your finances healthy.</p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[180px]">
            {/* 1 — Financial Reporting */}
            <FadeUp className="md:col-span-2 md:row-span-2 liquid-glass p-5 rounded-2xl hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-black/20 transition-shadow group overflow-hidden relative">
              <div className="relative z-10">
                <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-3"><BarChart3 className="w-[18px] h-[18px] text-purple-600 dark:text-purple-400" /></div>
                <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Real-time Financial Reporting</h3>
                <p className="text-slate-500 dark:text-[#A8A29E] max-w-xs text-[13px] leading-relaxed">Generate P&L, Balance Sheets, and Cash Flow statements instantly.</p>
              </div>
              <div className="absolute right-4 bottom-4 w-52 h-36 liquid-glass-subtle rounded-xl p-3 transform group-hover:-translate-x-1 transition-transform duration-300">
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
            </FadeUp>

            {/* 2 — Expense Tracking */}
            <FadeUp delay={0.05} className="liquid-glass p-5 rounded-2xl hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-black/20 transition-shadow overflow-hidden relative group">
              <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-2.5"><Receipt className="w-[18px] h-[18px] text-amber-600 dark:text-amber-400" /></div>
              <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Expense Tracking</h3>
              <p className="text-slate-500 dark:text-[#A8A29E] text-[13px]">Snap receipts. AI extracts the data.</p>
              <div className="absolute bottom-3 right-3 w-20 h-24 liquid-glass-subtle rounded-lg p-2 rotate-3 group-hover:rotate-0 transition-transform duration-300">
                <div className="h-1.5 w-10 bg-amber-200 dark:bg-amber-700/40 rounded mb-1.5" />
                <div className="h-1 w-14 bg-amber-100 dark:bg-amber-800/30 rounded mb-1" />
                <div className="h-1 w-12 bg-amber-100 dark:bg-amber-800/30 rounded mb-1" />
                <div className="border-t border-dashed border-amber-200 dark:border-amber-700/40 my-1.5" />
                <div className="h-1.5 w-8 bg-amber-200 dark:bg-amber-700/40 rounded ml-auto" />
              </div>
            </FadeUp>

            {/* 3 — Bank Sync */}
            <FadeUp delay={0.08} className="liquid-glass p-5 rounded-2xl hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-black/20 transition-shadow overflow-hidden relative">
              <div className="w-9 h-9 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center mb-2.5"><Wallet className="w-[18px] h-[18px] text-rose-600 dark:text-rose-400" /></div>
              <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Bank Sync</h3>
              <p className="text-slate-500 dark:text-[#A8A29E] text-[13px]">10,000+ banks connected securely.</p>
              <div className="absolute bottom-4 right-4 flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/30" />
                <div className="w-6 h-0.5 bg-rose-200 dark:bg-rose-700/40" />
                <div className="w-5 h-5 rounded-full bg-rose-200 dark:bg-rose-800/30 border border-rose-300 dark:border-rose-700/30" />
                <div className="w-6 h-0.5 bg-rose-200 dark:bg-rose-700/40" />
                <div className="w-5 h-5 rounded-full bg-rose-300 dark:bg-rose-700/40 border border-rose-300 dark:border-rose-700/30 flex items-center justify-center"><Check className="w-3 h-3 text-rose-600 dark:text-rose-400" /></div>
              </div>
            </FadeUp>

            {/* 4 — Customer Management */}
            <FadeUp delay={0.1} className="md:row-span-2 liquid-glass p-5 rounded-2xl hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-black/20 transition-shadow">
              <div className="h-full flex flex-col">
                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-2.5"><Users className="w-[18px] h-[18px] text-blue-600 dark:text-blue-400" /></div>
                <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Customer Management</h3>
                <p className="text-slate-500 dark:text-[#A8A29E] text-[13px] mb-3">Track details and payment history.</p>
                <div className="flex-1 space-y-2">
                  {[{ name: 'Sarah Chen', amount: '$12,400', color: 'bg-blue-500' }, { name: 'Alex Rivera', amount: '$8,750', color: 'bg-emerald-500' }, { name: 'Jordan Lee', amount: '$5,200', color: 'bg-purple-500' }, { name: 'Morgan Taylor', amount: '$3,800', color: 'bg-amber-500' }].map((c, i) => (
                    <div key={i} className="flex items-center gap-2.5 liquid-glass-subtle p-2 rounded-lg">
                      <div className={`w-6 h-6 rounded-full ${c.color} flex items-center justify-center text-[9px] font-bold text-white`}>{c.name[0]}</div>
                      <div className="flex-1 min-w-0 text-[11px] font-medium text-slate-700 dark:text-[#DBD8D0] truncate">{c.name}</div>
                      <div className="text-[11px] font-semibold text-slate-600 dark:text-[#A8A29E]">{c.amount}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>

            {/* 5 — Recurring Billing */}
            <FadeUp delay={0.06} className="liquid-glass p-5 rounded-2xl hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-black/20 transition-shadow overflow-hidden relative">
              <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-2.5"><RefreshCw className="w-[18px] h-[18px] text-emerald-600 dark:text-emerald-400" /></div>
              <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Recurring Billing</h3>
              <p className="text-slate-500 dark:text-[#A8A29E] text-[13px]">Automate retainer invoices.</p>
              <div className="absolute bottom-3 right-3 grid grid-cols-4 gap-1">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i === 2 || i === 6 || i === 10 ? 'bg-emerald-400 dark:bg-emerald-500' : 'liquid-glass-subtle'}`} />
                ))}
              </div>
            </FadeUp>

            {/* 6 — Multi-Currency */}
            <FadeUp delay={0.07} className="md:col-span-2 liquid-glass p-5 rounded-2xl hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-black/20 transition-shadow overflow-hidden relative">
              <div className="flex items-start gap-4">
                <div>
                  <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-2.5"><CreditCard className="w-[18px] h-[18px] text-indigo-600 dark:text-indigo-400" /></div>
                  <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Multi-Currency Support</h3>
                  <p className="text-slate-500 dark:text-[#A8A29E] text-[13px]">Invoice and track in any currency. Auto-conversion at real-time rates.</p>
                </div>
                <div className="flex items-center gap-2 ml-auto flex-shrink-0 mt-1">
                  {[{ code: 'USD', symbol: '$', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30' }, { code: 'EUR', symbol: '€', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/30' }, { code: 'GBP', symbol: '£', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/30' }].map((cur, i) => (
                    <div key={i} className={`px-2.5 py-2 rounded-lg border text-center hover:-translate-y-1 transition-transform duration-200 ${cur.color}`}>
                      <div className="text-base font-bold">{cur.symbol}</div>
                      <div className="text-[9px] font-semibold mt-0.5">{cur.code}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>

            {/* 7 — Audit Trail */}
            <FadeUp delay={0.05} className="liquid-glass p-5 rounded-2xl hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-black/20 transition-shadow overflow-hidden relative">
              <div className="w-9 h-9 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center mb-2.5"><Shield className="w-[18px] h-[18px] text-brand-600 dark:text-brand-400" /></div>
              <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Audit Proof</h3>
              <p className="text-slate-500 dark:text-[#A8A29E] text-[13px]">Every change is logged.</p>
              <div className="absolute bottom-3 left-5 right-5 space-y-1">
                {['Invoice created', 'Payment received', 'Status updated'].map((log, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[9px]">
                    <div className="w-1 h-1 rounded-full bg-brand-400" />
                    <span className="text-slate-400 dark:text-[#5C5752]">{log}</span>
                  </div>
                ))}
              </div>
            </FadeUp>

            {/* 8 — Tax Ready */}
            <FadeUp delay={0.06} className="liquid-glass p-5 rounded-2xl hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-black/20 transition-shadow overflow-hidden relative">
              <div className="w-9 h-9 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center mb-2.5"><Calculator className="w-[18px] h-[18px] text-cyan-600 dark:text-cyan-400" /></div>
              <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Tax Ready</h3>
              <p className="text-slate-500 dark:text-[#A8A29E] text-[13px]">Auto-calculate and file on time.</p>
              <div className="absolute bottom-4 left-5 right-5">
                <div className="flex justify-between text-[9px] text-cyan-600 dark:text-cyan-400 font-medium mb-1"><span>Tax Report</span><span>92%</span></div>
                <div className="h-1.5 bg-slate-100 dark:bg-[#2D2B28] rounded-full"><div className="h-full w-[92%] bg-cyan-400 dark:bg-cyan-500 rounded-full" /></div>
              </div>
            </FadeUp>

            {/* 9 — Payroll */}
            <FadeUp delay={0.07} className="liquid-glass p-5 rounded-2xl hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-black/20 transition-shadow overflow-hidden relative">
              <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center mb-2.5"><Banknote className="w-[18px] h-[18px] text-violet-600 dark:text-violet-400" /></div>
              <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Payroll</h3>
              <p className="text-slate-500 dark:text-[#A8A29E] text-[13px]">Generate salary slips instantly.</p>
              <div className="absolute bottom-3 left-5 right-5 space-y-1">
                <div className="flex items-center justify-between liquid-glass-subtle px-2 py-1.5 rounded-md"><span className="text-[9px] font-medium text-slate-600 dark:text-[#A8A29E]">Basic + HRA</span><span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">$4,200</span></div>
                <div className="flex items-center justify-between liquid-glass-subtle px-2 py-1.5 rounded-md"><span className="text-[9px] font-medium text-slate-600 dark:text-[#A8A29E]">Deductions</span><span className="text-[9px] font-bold text-red-500 dark:text-red-400">-$680</span></div>
                <div className="flex items-center justify-between px-2 pt-1"><span className="text-[9px] font-semibold text-slate-700 dark:text-[#DBD8D0]">Net Pay</span><span className="text-[9px] font-bold text-violet-600 dark:text-violet-400">$3,520</span></div>
              </div>
            </FadeUp>

            {/* 10 — Purchase Orders */}
            <FadeUp delay={0.08} className="liquid-glass p-5 rounded-2xl hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-black/20 transition-shadow overflow-hidden relative">
              <div className="w-9 h-9 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center mb-2.5"><ClipboardList className="w-[18px] h-[18px] text-pink-600 dark:text-pink-400" /></div>
              <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Purchase Orders</h3>
              <p className="text-slate-500 dark:text-[#A8A29E] text-[13px]">Track procurement end-to-end.</p>
              <div className="absolute bottom-3 left-5 right-5">
                <div className="flex items-center gap-1 mb-1.5">
                  {['Draft', 'Sent', 'Confirmed', 'Received'].map((s, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= 2 ? 'bg-pink-400 dark:bg-pink-500' : 'bg-slate-200 dark:bg-[#2D2B28]'}`} />
                  ))}
                </div>
                <div className="flex justify-between text-[8px] text-slate-400 dark:text-[#5C5752]"><span>Draft</span><span className="text-pink-500 dark:text-pink-400 font-semibold">Confirmed</span><span>Received</span></div>
              </div>
            </FadeUp>

            {/* 11 — Quotes */}
            <FadeUp delay={0.09} className="liquid-glass p-5 rounded-2xl hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-black/20 transition-shadow overflow-hidden relative">
              <div className="w-9 h-9 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-2.5"><FileSignature className="w-[18px] h-[18px] text-teal-600 dark:text-teal-400" /></div>
              <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">Quotes</h3>
              <p className="text-slate-500 dark:text-[#A8A29E] text-[13px]">Send estimates, convert to invoices.</p>
              <div className="absolute bottom-3 left-5 right-5 liquid-glass-subtle rounded-lg p-2">
                <div className="flex items-center justify-between mb-1"><span className="text-[9px] font-medium text-slate-600 dark:text-[#A8A29E]">Quote #1042</span><span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">Accepted</span></div>
                <div className="flex items-center justify-between"><span className="text-[8px] text-slate-400 dark:text-[#5C5752]">→ Converted to Invoice</span><span className="text-[9px] font-bold text-teal-600 dark:text-teal-400">$8,500</span></div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section className="relative z-10 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Free Trial', price: '$0', desc: 'Perfect for trying out Flowbooks', features: ['1 company', '3-day Pro trial', 'Full AI access'], href: '/signup', cta: 'Start Free' },
              { name: 'Pro', price: '$29', desc: 'For freelancers & small businesses', features: ['3 companies', 'Extended AI assistant', 'All reports & payroll'], href: '/signup?plan=pro', cta: 'Start Free Trial', popular: true },
              { name: 'Max', price: '$99', desc: 'For teams & organizations', features: ['10 companies', '3x AI + advanced models', 'Unlimited everything'], href: '/signup?plan=max', cta: 'Start Free Trial' },
            ].map((plan, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className={`relative rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 ${plan.popular ? 'liquid-glass-strong shadow-xl shadow-brand-500/10 ring-2 ring-brand-500/20' : 'liquid-glass hover:shadow-lg'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-lg shadow-brand-500/25">Most Popular</div>
                  )}
                  <h3 className={`text-lg font-bold mb-1 ${plan.popular ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-white'}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                    {plan.price !== '$0' && <span className="text-slate-500 dark:text-[#78736D] text-xs">/month</span>}
                  </div>
                  <p className="text-[13px] text-slate-500 dark:text-[#A8A29E] mb-5">{plan.desc}</p>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-[#DBD8D0]"><Check className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />{f}</li>
                    ))}
                  </ul>
                  <Link href={plan.href} className={`group w-full py-2.5 rounded-full font-semibold text-sm text-center block transition-all ${plan.popular ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:-translate-y-0.5' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 hover:-translate-y-0.5'}`}>{plan.cta}</Link>
                </div>
              </FadeUp>
            ))}
          </div>
          <FadeUp delay={0.2} className="text-center mt-6">
            <Link href="/pricing" className="group inline-flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
              Compare all features <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="relative z-10 py-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }),
          }}
        />
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <FadeUp className="text-center mb-12">
            <p className="text-brand-600 dark:text-brand-400 text-xs font-semibold tracking-widest uppercase mb-3">Support</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">Frequently Asked Questions</h2>
          </FadeUp>
          <FadeUp className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} question={faq.q} answer={faq.a} isOpen={openFaqIndex === index} onClick={() => setOpenFaqIndex(index === openFaqIndex ? -1 : index)} index={index} />
            ))}
          </FadeUp>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="relative z-10 py-20 px-4 sm:px-6">
        <FadeUp>
          <div className="max-w-4xl mx-auto relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 shadow-2xl shadow-brand-500/20">
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] transform translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/10 rounded-full blur-[80px] transform -translate-x-1/3 translate-y-1/3" />
            <div className="relative z-10 px-6 py-16 md:py-20 text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-white/90 text-[11px] font-semibold mb-6" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)' }}>
                <Sparkles className="w-3 h-3" /> Join 12,000+ businesses
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-5 leading-tight max-w-lg mx-auto">Start your financial freedom today</h2>
              <p className="text-base text-white/80 mb-8 max-w-xl mx-auto">Join thousands of business owners who have traded spreadsheet headaches for AI-powered clarity.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/signup" className="group bg-white text-slate-900 px-7 py-3.5 rounded-full font-bold text-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 flex items-center gap-2 shadow-lg">
                  Get Started Free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/login" className="px-7 py-3.5 rounded-full font-bold text-sm text-white flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}>Sign In</Link>
              </div>
              <p className="mt-6 text-xs text-white/50">Encrypted in transit &amp; at rest &bull; Set up in minutes &bull; Cancel anytime</p>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="relative z-10 py-8 border-t border-slate-200/60 dark:border-[#2D2B28]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <FlowBooksLogo size="xs" />
            <p className="text-slate-500 dark:text-[#A8A29E] text-xs">&copy; {new Date().getFullYear()} Flowbooks Inc. All rights reserved.</p>
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
