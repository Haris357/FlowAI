'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { adminFetch, clearAdminSession, getAdminSession } from '@/lib/admin-fetch';
import { hasPermission, type AdminRole, type Permission } from '@/lib/admin-roles';

export interface CurrentAdmin {
  id: string;
  username: string;
  name: string;
  role: AdminRole;
  permissions: Permission[];
  permissionsOverride: Permission[] | null;
  active: boolean;
  lastLoginAt: any;
  createdAt: any;
}

interface AdminAuthContextValue {
  admin: CurrentAdmin | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  signOut: () => void;
  can: (permission: Permission) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    const session = getAdminSession();
    if (!session) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      const res = await adminFetch('/api/admin/auth/me');
      if (!res.ok) {
        setAdmin(null);
        setError(res.status === 401 ? 'Session expired' : 'Failed to load admin profile');
        return;
      }
      const data = await res.json();
      setAdmin(data.admin);
    } catch {
      setAdmin(null);
      setError('Failed to load admin profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(() => {
    clearAdminSession();
    setAdmin(null);
  }, []);

  const can = useCallback(
    (permission: Permission) => {
      if (!admin) return false;
      return hasPermission(admin.role, permission, admin.permissionsOverride || null);
    },
    [admin]
  );

  return (
    <AdminAuthContext.Provider value={{ admin, loading, error, refresh, signOut, can }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  }
  return ctx;
}
