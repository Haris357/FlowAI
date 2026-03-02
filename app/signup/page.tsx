'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Zap, MessageSquare, Shield, ArrowLeft, Lock, Sparkles, Check } from 'lucide-react';
import FlowBooksLogo from '@/components/FlowBooksLogo';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle } = useAuth();
  const { mode, toggleMode } = useTheme();

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#1A1915] relative overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/[0.06] dark:bg-brand-500/[0.03] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-brand-600/[0.05] dark:bg-brand-600/[0.02] blur-[100px]" />
      </div>

      {/* Top bar */}
      <div className="absolute top-5 left-5 right-5 z-10 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-slate-500 dark:text-[#A8A29E] liquid-glass-subtle hover:shadow-md transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <button
          onClick={toggleMode}
          className="p-2.5 rounded-full text-slate-500 dark:text-[#A8A29E] liquid-glass-subtle hover:shadow-md transition-all"
          aria-label="Toggle dark mode"
        >
          {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <FlowBooksLogo size="md" />
          </Link>
        </div>

        {/* Content card */}
        <div className="liquid-glass rounded-3xl p-8">
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-subtle text-[10px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-4">
              <Sparkles className="w-3 h-3" /> Free to start
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1.5">Create your account</h1>
            <p className="text-sm text-slate-500 dark:text-[#A8A29E]">Get started with Flowbooks in seconds</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Google button */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 rounded-full font-semibold text-sm text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#fff" fillOpacity="0.8" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#fff" fillOpacity="0.9" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#fff" fillOpacity="0.7" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#fff" fillOpacity="0.85" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Sign up with Google</span>
              </>
            )}
          </button>

          {/* Benefits */}
          <div className="mt-6 space-y-2">
            {[
              { icon: Zap, text: 'Set up in under 5 minutes' },
              { icon: MessageSquare, text: 'AI-powered bookkeeping assistant' },
              { icon: Shield, text: 'Bank-grade encryption & security' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 liquid-glass-subtle px-3 py-2 rounded-xl">
                <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                </div>
                <span className="text-[12px] text-slate-600 dark:text-[#A8A29E]">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 mt-5 mb-5">
            <div className="flex-1 h-px bg-slate-200/60 dark:bg-white/[0.06]" />
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-[#5C5752]">
              <Lock className="w-3 h-3" />
              <span>256-bit encrypted</span>
            </div>
            <div className="flex-1 h-px bg-slate-200/60 dark:bg-white/[0.06]" />
          </div>

          {/* Already have account */}
          <p className="text-center text-sm text-slate-500 dark:text-[#A8A29E]">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-[#78736D]">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-brand-600 dark:text-brand-400 hover:underline">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-brand-600 dark:text-brand-400 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
