'use client';
import React, { useState } from 'react';
import { Moon, Sun, Home, Mail, MapPin, Phone, Send, MessageCircle, HelpCircle, FileText, Shield, CreditCard, ChevronRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import FlowBooksLogo from '@/components/FlowBooksLogo';

const faqLinks = [
  { icon: HelpCircle, title: 'Getting Started', description: 'Learn the basics of setting up your account and first steps.', href: '/#how-it-works' },
  { icon: CreditCard, title: 'Billing & Plans', description: 'Questions about pricing, upgrades, refunds, and invoices.', href: '/#pricing' },
  { icon: Shield, title: 'Security & Privacy', description: 'How we protect your data and handle your information.', href: '/security' },
  { icon: FileText, title: 'Reports & Exports', description: 'Generating financial reports and exporting your data.', href: '/#features' },
];

export default function ContactPage() {
  const { mode, toggleMode } = useTheme();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate sending
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }, 1500);
  };

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
      <section className="relative pt-16 pb-10">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[250px] rounded-full opacity-[0.08] blur-[100px] pointer-events-none"
          style={{ background: 'var(--brand-500)' }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50/80 dark:bg-brand-500/10 border border-brand-200/60 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 text-xs font-medium mb-5">
            <MessageCircle className="w-3 h-3" />
            GET IN TOUCH
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
            We&apos;d love to hear from you
          </h1>
          <p className="text-base text-slate-600 dark:text-[#A8A29E] leading-relaxed max-w-xl mx-auto">
            Have a question, feedback, or need support? Our team is ready to help. Reach out and we&apos;ll get back to you within one business day.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative z-10 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Company Info Card */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white dark:bg-[#232220] border border-slate-200/60 dark:border-[#3D3A37] rounded-2xl p-6">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Email</div>
                      <a href="mailto:support@flowbooks.com" className="text-[13px] text-brand-600 dark:text-brand-400 hover:underline">support@flowbooks.com</a>
                      <p className="text-[11px] text-slate-500 dark:text-[#78736D] mt-0.5">We typically respond within 24 hours</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Phone</div>
                      <p className="text-[13px] text-slate-600 dark:text-[#A8A29E]">+1 (415) 555-0132</p>
                      <p className="text-[11px] text-slate-500 dark:text-[#78736D] mt-0.5">Mon-Fri, 9am-6pm PST</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Office</div>
                      <p className="text-[13px] text-slate-600 dark:text-[#A8A29E]">548 Market Street, Suite 36879</p>
                      <p className="text-[13px] text-slate-600 dark:text-[#A8A29E]">San Francisco, CA 94104</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Response times */}
              <div className="bg-slate-50/80 dark:bg-[#232220] border border-slate-200/60 dark:border-[#3D3A37] rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Average Response Times</h3>
                <div className="space-y-2.5">
                  {[
                    { label: 'General inquiries', time: '< 24 hours', color: 'bg-emerald-400' },
                    { label: 'Technical support', time: '< 12 hours', color: 'bg-blue-400' },
                    { label: 'Billing questions', time: '< 6 hours', color: 'bg-purple-400' },
                    { label: 'Security issues', time: '< 2 hours', color: 'bg-rose-400' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-[13px] text-slate-600 dark:text-[#A8A29E]">{item.label}</span>
                      </div>
                      <span className="text-[12px] font-semibold text-slate-800 dark:text-[#EEECE8]">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-[#232220] border border-slate-200/60 dark:border-[#3D3A37] rounded-2xl p-6">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Send us a message</h2>
                <p className="text-[13px] text-slate-500 dark:text-[#78736D] mb-6">Fill out the form below and we&apos;ll get back to you as soon as possible.</p>

                {/* Success toast */}
                {submitted && (
                  <div className="mb-5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                      <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Message sent successfully!</div>
                      <div className="text-[12px] text-emerald-600 dark:text-emerald-400">We&apos;ll get back to you within 24 hours.</div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 dark:text-[#DBD8D0] mb-1.5">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="John Smith"
                        className="w-full px-3 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#1A1915] border border-slate-200 dark:border-[#3D3A37] text-slate-900 dark:text-[#EEECE8] placeholder:text-slate-400 dark:placeholder:text-[#5C5752] focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 dark:text-[#DBD8D0] mb-1.5">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="john@company.com"
                        className="w-full px-3 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#1A1915] border border-slate-200 dark:border-[#3D3A37] text-slate-900 dark:text-[#EEECE8] placeholder:text-slate-400 dark:placeholder:text-[#5C5752] focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-[#DBD8D0] mb-1.5">Subject</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#1A1915] border border-slate-200 dark:border-[#3D3A37] text-slate-900 dark:text-[#EEECE8] focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                    >
                      <option value="">Select a topic...</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing Question</option>
                      <option value="feature">Feature Request</option>
                      <option value="partnership">Partnership Opportunity</option>
                      <option value="security">Security Concern</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-[#DBD8D0] mb-1.5">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder="Tell us how we can help..."
                      className="w-full px-3 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#1A1915] border border-slate-200 dark:border-[#3D3A37] text-slate-900 dark:text-[#EEECE8] placeholder:text-slate-400 dark:placeholder:text-[#5C5752] focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-white font-semibold text-sm bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Quick Links */}
      <section className="relative z-10 py-16 bg-slate-50/50 dark:bg-[#232220]/30 border-y border-slate-200 dark:border-[#2D2B28]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Looking for quick answers?</h2>
            <p className="text-sm text-slate-600 dark:text-[#A8A29E]">Browse our most popular help topics before reaching out.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {faqLinks.map((faq, i) => (
              <Link
                key={i}
                href={faq.href}
                className="flex items-center gap-4 bg-white dark:bg-[#232220] border border-slate-200/60 dark:border-[#3D3A37] rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0">
                  <faq.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{faq.title}</div>
                  <div className="text-[12px] text-slate-500 dark:text-[#A8A29E]">{faq.description}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-[#5C5752] group-hover:text-brand-500 transition-colors flex-shrink-0" />
              </Link>
            ))}
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
