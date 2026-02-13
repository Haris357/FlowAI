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
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

// --- Constants & Styles (Inlined to fix missing imports) ---

const BRAND_COLORS = {
  primary: 'var(--brand-500)',
  secondary: 'var(--brand-600)',
};

// --- Custom Animations Style Block ---
const CustomStyles = () => (
  <style>{`
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .animate-fade-in-up {
      animation: fade-in-up 0.6s ease-out forwards;
    }
    .animate-scroll {
      animation: scroll 30s linear infinite;
    }
    .text-gradient {
      background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .bg-gradient-brand {
      background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%);
    }
  `}</style>
);

// --- Components ---

const BrandName = ({ className = '', light = false }) => (
  <span className={`font-bold tracking-tight ${className}`}>
    <span className={light ? 'text-white' : ''} style={!light ? { background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : {}}>
      Flow<em className="not-italic font-normal" style={{ fontStyle: 'italic' }}>books</em>
    </span>
  </span>
);

const AccordionItem = ({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) => (
  <div className="border-b border-slate-200 dark:border-slate-700">
    <button
      className="flex items-center justify-between w-full py-5 text-left focus:outline-none"
      onClick={onClick}
    >
      <span className="text-base font-semibold text-slate-900 dark:text-white">{question}</span>
      {isOpen ? (
        <Minus className="w-5 h-5 text-slate-400" />
      ) : (
        <Plus className="w-5 h-5 text-slate-400" />
      )}
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-5' : 'max-h-0 opacity-0'}`}
    >
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{answer}</p>
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
    ai: 'Last month\'s Net Profit was $8,300. Revenue increased by 12% compared to the previous period.',
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

// --- Main Page Component ---

export default function LandingPage() {
  // Mock Auth and Router for single-file demo
  const user = null;
  const router = { push: (path: string) => console.log(`Navigating to ${path}`) };
  const { mode, toggleMode } = useTheme();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Chat Animation State
  const [currentExample, setCurrentExample] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  // FAQ State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Typing animation effect
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
    <div className="min-h-screen w-full bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden">
      <CustomStyles />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 bg-gradient-brand">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <BrandName className="text-2xl" />
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">How it Works</a>
              <a href="#pricing" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">Pricing</a>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
              <button
                onClick={toggleMode}
                className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <a href="/login" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">Log in</a>
              <a
                href="/signup"
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                Get Started
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-600 dark:text-slate-400"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 py-6 space-y-4">
            <a href="#features" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-slate-600 dark:text-slate-400">Features</a>
            <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-slate-600 dark:text-slate-400">Pricing</a>
            <hr className="border-slate-100 dark:border-slate-800" />
            <button onClick={toggleMode} className="flex items-center gap-2 text-lg font-medium text-slate-600 dark:text-slate-400">
              {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <a href="/login" className="block text-lg font-medium text-slate-600 dark:text-slate-400">Log in</a>
            <a href="/signup" className="block w-full text-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-lg font-medium">Get Started Free</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full opacity-20 blur-[100px]" style={{ background: BRAND_COLORS.secondary }}></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[600px] h-[600px] rounded-full opacity-20 blur-[100px]" style={{ background: BRAND_COLORS.primary }}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">

            {/* Hero Copy */}
            <div className="flex-1 text-center lg:text-left animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-700/30 text-brand-700 dark:text-brand-300 text-sm font-medium mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
                New: Multi-currency support is here
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
                Accounting that <br />
                <span className="text-gradient">speaks your language</span>
              </h1>

              <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Stop wrestling with complex spreadsheets. Just tell <BrandName /> what you need in plain English, and watch your bookkeeping happen on autopilot.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href="/signup"
                  className="w-full sm:w-auto px-8 py-4 rounded-full text-white font-semibold text-lg hover:shadow-xl hover:shadow-brand-500/20 transition-all duration-300 hover:-translate-y-1 bg-gradient-brand flex items-center justify-center gap-2"
                >
                  Start Free Trial <ArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <MousePointer className="w-5 h-5" /> Live Demo
                </a>
              </div>

              <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                      {String.fromCharCode(64+i)}
                    </div>
                  ))}
                </div>
                <p>Trusted by 1,000+ businesses</p>
              </div>
            </div>

            {/* Hero Interactive Demo */}
            <div className="flex-1 w-full max-w-lg lg:max-w-xl perspective-1000 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative group">
                <div className="absolute -inset-1 rounded-[2rem] bg-gradient-brand opacity-30 blur-xl group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">

                  {/* Fake Browser UI */}
                  <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                      <div className="w-3 h-3 rounded-full bg-brand-400/80"></div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-700 h-8 rounded-md border border-slate-200 dark:border-slate-600 flex items-center px-3 text-xs text-slate-400">
                      flowbooks.com/chat
                    </div>
                  </div>

                  {/* Chat Interface */}
                  <div className="p-6 h-[400px] flex flex-col bg-slate-50/30 dark:bg-slate-900/50">
                    <div className="flex-1 space-y-4 overflow-hidden">
                      {/* Welcome Bubble */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-tl-none text-sm text-slate-600 dark:text-slate-300 shadow-sm max-w-[85%]">
                          Hi there! I'm ready to help with your finances. Try saying "Create an invoice" or "Show me my expenses".
                        </div>
                      </div>

                      {/* User Input Bubble */}
                      <div className="flex justify-end">
                        <div className="bg-gradient-brand text-white px-4 py-3 rounded-2xl rounded-tr-none text-sm shadow-md max-w-[85%]">
                          {typedText}
                          {isTyping && <span className="inline-block w-1.5 h-4 ml-1 bg-white/70 animate-pulse align-middle"></span>}
                        </div>
                      </div>

                      {/* AI Response Bubble */}
                      <div className={`flex gap-3 transition-all duration-500 transform ${showResponse ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-tl-none text-sm text-slate-600 dark:text-slate-300 shadow-sm max-w-[85%]">
                          <div className="flex items-center gap-2 mb-1 text-brand-600 dark:text-brand-400 font-medium">
                            <CheckCircle2 className="w-4 h-4" /> Done
                          </div>
                          {chatExamples[currentExample].ai}
                        </div>
                      </div>
                    </div>

                    {/* Input Area */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 relative">
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                        <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-700 rounded animate-pulse w-3/4"></div>
                        <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Ticker */}
      <section className="py-10 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
        <p className="text-center text-sm font-semibold text-slate-400 mb-6 uppercase tracking-wider">Powering the next generation of business</p>
        <div className="relative w-full overflow-hidden">
          <div className="flex animate-scroll whitespace-nowrap w-[200%]">
             {[...Array(2)].map((_, setIndex) => (
                <div key={setIndex} className="flex space-x-16 mx-8 items-center">
                  {['Acme Corp', 'GlobalTech', 'Nebula Inc', 'FastScale', 'GreenLeaf', 'Stark Ind', 'Wayne Ent', 'Cyberdyne'].map((company, i) => (
                    <div key={i} className="text-xl font-bold text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors cursor-default select-none">
                      {company}
                    </div>
                  ))}
                </div>
             ))}
          </div>
          <div className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent pointer-events-none"></div>
          <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent pointer-events-none"></div>
        </div>
      </section>

      {/* Feature Deep Dives (Zig-Zag Layout) */}
      <section id="features" className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">

          {/* Feature 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                Just text your accountant. <br/>
                <span className="text-slate-400">(Except it's AI)</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                Send a message like you would to a friend. Flowbooks parses natural language to categorize transactions, create invoices, and update your ledger instantly. No forms, no dropdowns.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  'Recognizes vendors and categories automatically',
                  'Handles multi-step commands',
                  'Learns your business context over time'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-100 dark:from-brand-900/20 to-transparent rounded-3xl transform rotate-3 scale-95 opacity-50"></div>
              <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-4">
                 <div className="flex justify-end">
                   <div className="bg-brand-600 text-white rounded-2xl rounded-br-sm px-4 py-2 text-sm max-w-[80%] shadow-lg">
                     Spent $150 at Office Depot for printer paper and ink
                   </div>
                 </div>
                 <div className="flex justify-start">
                   <div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 text-sm max-w-[80%] border border-slate-200 dark:border-slate-700">
                     <div className="font-semibold mb-1 text-brand-700 dark:text-brand-400">Expense Recorded</div>
                     <div className="flex justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2 mt-1">
                       <span>Amount: $150.00</span>
                       <span>Cat: Office Supplies</span>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                Invoices that chase <br/>
                payments for you
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                Create professional invoices in seconds. Better yet, let Flowbooks automatically follow up with clients who are late on payments using polite, customizable email sequences.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Recurring Bills</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Set it and forget it for retainers.</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Pay Links</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">One-click payment for clients.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 relative group cursor-pointer">
              <div className="absolute -inset-2 bg-gradient-brand rounded-3xl opacity-20 blur-lg group-hover:opacity-30 transition"></div>
              <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transform group-hover:scale-[1.01] transition duration-500">
                <div className="h-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center px-4 space-x-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">INVOICE</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">#INV-2024-001</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-500 dark:text-slate-400">Amount Due</div>
                      <div className="text-3xl font-bold text-brand-600 dark:text-brand-400">$4,500.00</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Bento Grid Capabilities */}
      <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Everything you need to run your business</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">From day one to IPO, we've got the tools to keep your finances healthy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
             {/* Large Item */}
             <div className="md:col-span-2 row-span-1 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
                   <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                 </div>
                 <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Real-time Financial Reporting</h3>
                 <p className="text-slate-500 dark:text-slate-400 max-w-sm">Generate P&L, Balance Sheets, and Cash Flow statements instantly. Understand your burn rate and runway at a glance.</p>
               </div>
               <div className="absolute right-0 bottom-0 w-64 h-48 bg-purple-50 dark:bg-purple-900/20 rounded-tl-3xl border-t border-l border-purple-100 dark:border-purple-800/30 transform translate-y-4 translate-x-4 group-hover:translate-x-2 transition-transform">
                 {/* Abstract Chart */}
                 <div className="flex items-end justify-around h-full pb-8 px-6 gap-2">
                   <div className="w-8 bg-purple-200 dark:bg-purple-700 h-[40%] rounded-t-md"></div>
                   <div className="w-8 bg-purple-300 dark:bg-purple-600 h-[60%] rounded-t-md"></div>
                   <div className="w-8 bg-purple-400 dark:bg-purple-500 h-[50%] rounded-t-md"></div>
                   <div className="w-8 bg-purple-500 dark:bg-purple-400 h-[80%] rounded-t-md"></div>
                 </div>
               </div>
             </div>

             {/* Small Item */}
             <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-4">
                  <Receipt className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Expense Tracking</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Snap photos of receipts. AI extracts the data automatically.</p>
             </div>

             {/* Tall Item */}
             <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all md:row-span-2">
                <div className="h-full flex flex-col">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">CRM Integration</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Keep track of customer details and payment history in one place.</p>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                        <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
             </div>

             {/* Medium Item */}
             <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Bank Sync</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Connects to 10,000+ banks worldwide securely.</p>
             </div>

             {/* Medium Item */}
             <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Audit Proof</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Every change is logged. Your accountant will love you.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Loved by businesses everywhere</h2>
            <div className="flex items-center justify-center gap-1 text-amber-400">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-current" />)}
              <span className="text-slate-600 dark:text-slate-400 text-sm ml-2 font-medium">4.9/5 from 500+ reviews</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 relative hover:-translate-y-1 transition-transform duration-300">
                <div className="text-5xl text-brand-200 dark:text-brand-800 absolute top-4 left-6 font-serif">"</div>
                <p className="text-slate-700 dark:text-slate-300 relative z-10 mb-6 italic pt-4">{t.content}</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-300">
                    {t.image}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500 rounded-full blur-[128px]"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[128px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-400">No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-center">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-3xl p-8 border relative ${
                  plan.popular
                    ? 'bg-white/10 border-brand-500/50 backdrop-blur-sm shadow-2xl shadow-brand-500/10 scale-105 z-10'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 transition-colors'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-brand text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-slate-400">/month</span>
                </div>
                <p className="text-slate-400 text-sm mb-8">{plan.description}</p>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-brand-400" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-brand text-white hover:shadow-lg hover:shadow-brand-500/20'
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
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-2">
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
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto relative rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-brand opacity-90"></div>
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

          <div className="relative z-10 px-8 py-20 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Start your financial freedom today
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              Join thousands of business owners who have traded spreadsheet headaches for AI-powered clarity.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/signup"
                className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                Get Started Free
              </a>
              <a
                href="/login"
                className="px-8 py-4 rounded-full font-bold text-lg text-white border border-white/30 hover:bg-white/10 transition-all duration-300"
              >
                Sign In
              </a>
            </div>
            <p className="mt-6 text-sm text-white/60">No credit card required • 14-day free trial</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-900 pt-20 pb-10 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <BrandName className="text-xl" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
                AI-powered accounting for the modern business. We make bookkeeping as easy as sending a text.
              </p>
              <div className="flex gap-4">
                {/* Social Placeholders */}
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-brand-500 hover:text-white transition-colors cursor-pointer flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">API</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} Flowbooks Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
              System Operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
