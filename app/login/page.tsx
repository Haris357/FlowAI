'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Shield, Moon, Sun, ArrowLeft } from 'lucide-react';
import FlowBooksLogo from '@/components/FlowBooksLogo';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle } = useAuth();
  const { mode, toggleMode } = useTheme();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#1A1915] relative overflow-hidden px-4">
      {/* Boxes background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { w: 64, h: 64, left: '6%', top: '10%', rot: 12, filled: false },
          { w: 48, h: 48, left: '20%', top: '65%', rot: 35, filled: true },
          { w: 80, h: 80, left: '72%', top: '6%', rot: -8, filled: false },
          { w: 44, h: 44, left: '85%', top: '42%', rot: 22, filled: true },
          { w: 56, h: 56, left: '3%', top: '76%', rot: -15, filled: false },
          { w: 100, h: 100, left: '58%', top: '70%', rot: 18, filled: false },
          { w: 36, h: 36, left: '40%', top: '4%', rot: 40, filled: true },
          { w: 72, h: 72, left: '88%', top: '78%', rot: -25, filled: false },
          { w: 52, h: 52, left: '14%', top: '36%', rot: 30, filled: false },
          { w: 44, h: 44, left: '66%', top: '33%', rot: -12, filled: true },
          { w: 60, h: 60, left: '48%', top: '86%', rot: 8, filled: false },
          { w: 32, h: 32, left: '33%', top: '50%', rot: 45, filled: false },
          { w: 90, h: 90, left: '80%', top: '15%', rot: -20, filled: false },
          { w: 42, h: 42, left: '53%', top: '52%', rot: 15, filled: true },
          { w: 70, h: 70, left: '26%', top: '20%', rot: -35, filled: false },
          { w: 50, h: 50, left: '92%', top: '60%', rot: 28, filled: false },
        ].map((box, i) => (
          <div
            key={i}
            className="absolute rounded-xl"
            style={{
              width: box.w,
              height: box.h,
              left: box.left,
              top: box.top,
              transform: `rotate(${box.rot}deg)`,
              border: box.filled ? 'none' : `1.5px solid ${mode === 'dark' ? 'rgba(217,119,87,0.12)' : 'rgba(217,119,87,0.10)'}`,
              background: box.filled
                ? mode === 'dark' ? 'rgba(217,119,87,0.04)' : 'rgba(217,119,87,0.03)'
                : 'none',
            }}
          />
        ))}
        {/* Soft radial glow */}
        <div
          className="absolute inset-0"
          style={{
            background: mode === 'dark'
              ? 'radial-gradient(circle at 25% 35%, rgba(217,119,87,0.03), transparent 55%), radial-gradient(circle at 75% 65%, rgba(217,119,87,0.02), transparent 55%)'
              : 'radial-gradient(circle at 25% 35%, rgba(217,119,87,0.04), transparent 55%), radial-gradient(circle at 75% 65%, rgba(217,119,87,0.03), transparent 55%)',
          }}
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-5 left-5 right-5 z-10 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-[#A8A29E] hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <button
          onClick={toggleMode}
          className="p-2 rounded-full text-slate-500 dark:text-[#A8A29E] hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors"
          aria-label="Toggle dark mode"
        >
          {mode === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <FlowBooksLogo size="md" />
          </Link>
        </div>

        {/* Content card */}
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">Welcome back</h1>
            <p className="text-sm text-slate-500 dark:text-[#A8A29E]">Sign in to continue to Flowbooks</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm text-center animate-fade-in">
              {error}
            </div>
          )}

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] rounded-xl font-medium text-slate-700 dark:text-[#EEECE8] hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-300 dark:border-[#5C5752] border-t-brand-500 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/[0.06]" />
            <Shield className="w-3.5 h-3.5 text-slate-300 dark:text-[#5C5752]" />
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/[0.06]" />
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-slate-500 dark:text-[#A8A29E]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">Sign up</Link>
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
