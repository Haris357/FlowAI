'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { ShieldCheck, Moon, Sun, Eye, EyeOff, User, Lock } from 'lucide-react';
import FlowBooksLogo from '@/components/FlowBooksLogo';
import { setAdminSession, getAdminSession } from '@/lib/admin-fetch';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { mode, toggleMode } = useTheme();
  const router = useRouter();
  const { refresh: refreshAdminContext } = useAdminAuth();

  // If already has a valid admin session, redirect to dashboard.
  useEffect(() => {
    const session = getAdminSession();
    if (session) router.replace('/admin');
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed.');
        return;
      }

      setAdminSession({
        token: data.token,
        expiresAt: Date.now() + data.expiresIn * 1000,
        admin: data.admin,
      });

      // Populate the admin context BEFORE navigating so /admin doesn't see a
      // stale `admin=null` and bounce us back here (redirect loop guard).
      await refreshAdminContext();

      router.replace('/admin');
    } catch {
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#1A1915] relative overflow-hidden px-4">
      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none">
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

      {/* Theme toggle */}
      <button
        onClick={toggleMode}
        className="absolute top-5 right-5 z-10 p-2 rounded-full text-slate-500 dark:text-[#A8A29E] hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors"
        aria-label="Toggle dark mode"
      >
        {mode === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
      </button>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <FlowBooksLogo showIcon={false} size="sm" />
              <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider block">
                Admin Panel
              </span>
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">Admin Login</h1>
            <p className="text-sm text-slate-500 dark:text-[#A8A29E]">Sign in with your admin credentials</p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-[#A8A29E] mb-1.5">Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#5C5752]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  spellCheck={false}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] rounded-xl text-sm text-slate-900 dark:text-[#EEECE8] placeholder-slate-400 dark:placeholder-[#5C5752] focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-400 transition-all"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-[#A8A29E] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#5C5752]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] rounded-xl text-sm text-slate-900 dark:text-[#EEECE8] placeholder-slate-400 dark:placeholder-[#5C5752] focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-400 transition-all"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#5C5752] hover:text-slate-600 dark:hover:text-[#A8A29E] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-[#78736D]">
          Restricted access. Authorized personnel only.
        </p>
      </div>
    </div>
  );
}
