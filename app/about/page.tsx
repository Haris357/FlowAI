'use client';
import React from 'react';
import { Sparkles, Moon, Sun, ArrowLeft, ArrowRight, Lightbulb, Minimize2, Shield, Heart, Target, Users, BarChart3, Zap } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';

const BrandName = () => (
  <span className="font-bold tracking-tight">
    <span style={{ background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
      Flow<em className="not-italic" style={{ fontStyle: 'italic' }}>books</em>
    </span>
  </span>
);

const values = [
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'We believe accounting should evolve with technology. By putting AI at the core of everything we build, we turn traditionally complex financial tasks into intuitive conversations.',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  },
  {
    icon: Minimize2,
    title: 'Simplicity',
    description: 'Great software disappears into the workflow. We obsess over removing friction so business owners can focus on what they do best, not wrestling with spreadsheets and ledgers.',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  },
  {
    icon: Shield,
    title: 'Security',
    description: 'Financial data is some of the most sensitive information a business holds. We treat its protection as a non-negotiable priority with bank-grade encryption and strict access controls.',
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Heart,
    title: 'Trust',
    description: 'We earn trust through transparency. From our clear pricing to our privacy practices, we believe our users should always know exactly how their data is handled and what they are paying for.',
    color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
  },
];

const stats = [
  { value: '10,000+', label: 'Businesses served' },
  { value: '2M+', label: 'Invoices generated' },
  { value: '99.99%', label: 'Platform uptime' },
  { value: '4.9/5', label: 'Average rating' },
];

export default function AboutPage() {
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
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/25">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <BrandName />
              </Link>
            </div>
            <div className="flex items-center gap-2.5">
              <Link href="/" className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-all flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Home
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
            <Sparkles className="w-3 h-3" />
            OUR STORY
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight mb-5">
            About{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-600) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Flowbooks
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-[#A8A29E] max-w-2xl mx-auto leading-relaxed">
            We started Flowbooks with a simple belief: managing your business finances should be as easy as sending a text message. No accounting degree required.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 py-8 border-y border-slate-200 dark:border-[#2D2B28] bg-slate-50/50 dark:bg-[#232220]/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-[12px] text-slate-500 dark:text-[#78736D] mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="relative z-10 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Our Mission</h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-[#A8A29E] leading-relaxed mb-4">
                Flowbooks exists to democratize financial management for small businesses and freelancers. We believe that every entrepreneur deserves access to professional-grade accounting tools without the steep learning curve or the high price tag.
              </p>
              <p className="text-sm text-slate-600 dark:text-[#A8A29E] leading-relaxed mb-4">
                Our AI-first approach means you interact with your finances the same way you talk to a colleague. Tell Flowbooks what you need in plain English, and it handles the rest: categorizing expenses, generating invoices, reconciling accounts, and producing financial reports.
              </p>
              <p className="text-sm text-slate-600 dark:text-[#A8A29E] leading-relaxed">
                We are building the future of bookkeeping, one where the software works for you, not the other way around.
              </p>
            </div>
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-br from-brand-500/10 to-brand-600/5 rounded-2xl blur-xl" />
              <div className="relative bg-white dark:bg-[#232220] border border-slate-200/60 dark:border-[#3D3A37] rounded-2xl p-6 space-y-4">
                {[
                  { icon: Users, label: 'Built for non-accountants', desc: 'No jargon, no complexity' },
                  { icon: Zap, label: 'AI-powered efficiency', desc: 'Tasks that took hours now take seconds' },
                  { icon: BarChart3, label: 'Real-time insights', desc: 'Always know where your business stands' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</div>
                      <div className="text-[12px] text-slate-500 dark:text-[#A8A29E]">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative z-10 py-16 bg-slate-50/50 dark:bg-[#232220]/30 border-y border-slate-200 dark:border-[#2D2B28]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">What We Stand For</h2>
            <p className="text-sm text-slate-600 dark:text-[#A8A29E] max-w-xl mx-auto">
              Our values guide every decision we make, from the features we build to how we handle your data.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map((value, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#232220] border border-slate-200/60 dark:border-[#3D3A37] rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl ${value.color} flex items-center justify-center mb-4`}>
                  <value.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{value.title}</h3>
                <p className="text-[13px] text-slate-600 dark:text-[#A8A29E] leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="relative z-10 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Our Story</h2>
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#232220] border border-slate-200/60 dark:border-[#3D3A37] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 text-xs font-bold">1</div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">The Problem We Saw</h3>
              </div>
              <p className="text-[13px] text-slate-600 dark:text-[#A8A29E] leading-relaxed">
                As small business owners ourselves, we experienced firsthand how painful traditional accounting software could be. The interfaces were built for CPAs, not entrepreneurs. Simple tasks like recording an expense or sending an invoice required navigating through layers of menus and understanding accounting terminology. We watched colleagues and friends avoid their books entirely, leading to tax season panic and missed financial insights.
              </p>
            </div>
            <div className="bg-white dark:bg-[#232220] border border-slate-200/60 dark:border-[#3D3A37] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 text-xs font-bold">2</div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">The Breakthrough</h3>
              </div>
              <p className="text-[13px] text-slate-600 dark:text-[#A8A29E] leading-relaxed">
                When large language models became powerful enough to truly understand context and intent, we realized we could reimagine accounting from scratch. Instead of forcing users to learn the software, we could build software that understands the user. The concept was simple: what if managing your finances was as easy as texting a friend? That idea became Flowbooks.
              </p>
            </div>
            <div className="bg-white dark:bg-[#232220] border border-slate-200/60 dark:border-[#3D3A37] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 text-xs font-bold">3</div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Where We Are Today</h3>
              </div>
              <p className="text-[13px] text-slate-600 dark:text-[#A8A29E] leading-relaxed">
                Today, Flowbooks serves thousands of businesses worldwide, from solo freelancers to growing startups. Our users have generated millions of invoices, tracked countless expenses, and gained real-time financial clarity, all through simple conversation. We are backed by a passionate team of engineers, designers, and financial experts who wake up every day determined to make business finance accessible to everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto relative rounded-[2rem] overflow-hidden bg-slate-900 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-600 opacity-90" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10 px-6 py-14 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to simplify your finances?
            </h2>
            <p className="text-base text-white/80 mb-7 max-w-xl mx-auto">
              Join thousands of businesses that have already made the switch to AI-powered bookkeeping with Flowbooks.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="bg-white text-slate-900 px-7 py-3 rounded-full font-bold text-sm hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="px-7 py-3 rounded-full font-bold text-sm text-white border border-white/30 hover:bg-white/10 transition-all duration-300"
              >
                Contact Us
              </Link>
            </div>
            <p className="mt-5 text-xs text-white/60">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-50 dark:bg-[#232220]/50 py-8 border-t border-slate-200 dark:border-[#2D2B28]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <BrandName />
            </div>
            <p className="text-slate-500 dark:text-[#A8A29E] text-xs">
              &copy; {new Date().getFullYear()} Flowbooks Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-[#A8A29E]">
              <Link href="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Terms</Link>
              <Link href="/security" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Security</Link>
              <Link href="/contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
