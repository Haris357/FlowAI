'use client';
import { useEffect, useState } from 'react';
import { Box } from '@mui/joy';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { adminPageBg } from '@/lib/admin-theme';

function getAdminSession(): { email: string; expiresAt: number } | null {
  try {
    const raw = sessionStorage.getItem('adminSession');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt > Date.now()) return parsed;
    sessionStorage.removeItem('adminSession');
    return null;
  } catch {
    return null;
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checked, setChecked] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setChecked(true);
      return;
    }

    const session = getAdminSession();
    if (session) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
      router.push('/admin/login');
    }
    setChecked(true);
  }, [pathname, isLoginPage, router]);

  // Login page renders without admin layout chrome
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!checked) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Box sx={{ width: 24, height: 24, border: '2px solid', borderColor: 'neutral.300', borderTopColor: 'primary.500', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Box>
    );
  }

  if (!authorized) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Box sx={{ width: 24, height: 24, border: '2px solid', borderColor: 'neutral.300', borderTopColor: 'primary.500', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Box sx={{
        flex: 1,
        ml: sidebarCollapsed ? '68px' : '240px',
        transition: 'margin-left 0.2s ease',
        ...adminPageBg as Record<string, unknown>,
      }}>
        {children}
      </Box>
    </Box>
  );
}
