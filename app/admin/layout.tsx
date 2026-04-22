'use client';
import { useEffect, useState } from 'react';
import { Box, IconButton, Sheet, Typography } from '@mui/joy';
import { Menu, X, ShieldCheck } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { adminPageBg } from '@/lib/admin-theme';
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext';
import { getAdminSession } from '@/lib/admin-fetch';
import { FlowBooksLogoJoy } from '@/components/FlowBooksLogo';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, loading, refresh } = useAdminAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;
    if (loading) return;

    const session = getAdminSession();
    if (!session) {
      // No session at all → send to login.
      router.replace('/admin/login');
      return;
    }
    if (!admin) {
      // Session exists but admin context is empty (e.g., just logged in or
      // navigated directly to an admin URL). Re-fetch instead of redirecting —
      // this prevents a login↔admin redirect loop.
      refresh();
    }
  }, [isLoginPage, loading, admin, router, pathname, refresh]);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || !admin) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Box sx={{ width: 24, height: 24, border: '2px solid', borderColor: 'neutral.300', borderTopColor: 'primary.500', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar (hidden on mobile) */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </Box>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <Box
          onClick={() => setMobileOpen(false)}
          sx={{
            display: { xs: 'block', md: 'none' },
            position: 'fixed', inset: 0, zIndex: 1200,
            bgcolor: 'rgba(0,0,0,0.45)',
            transition: 'opacity 0.2s ease',
          }}
        />
      )}

      {/* Mobile drawer */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed', top: 0, left: 0,
          width: mobileOpen ? 260 : 0,
          height: '100vh',
          zIndex: 1300,
          overflow: 'hidden',
          transition: 'width 0.22s ease',
          boxShadow: mobileOpen ? '4px 0 24px rgba(0,0,0,0.15)' : 'none',
        }}
      >
        {mobileOpen && (
          <Box sx={{ width: 260, height: '100vh' }}>
            <AdminSidebar
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              positioning="static"
            />
          </Box>
        )}
      </Box>

      {/* Main content area */}
      <Box sx={{
        flex: 1, minWidth: 0,
        ml: {
          xs: 0,
          md: sidebarCollapsed ? '68px' : '240px',
        },
        transition: 'margin-left 0.2s ease',
        ...adminPageBg as Record<string, unknown>,
      }}>
        {/* Mobile top bar */}
        <Sheet
          variant="outlined"
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'sticky', top: 0, zIndex: 1100,
            alignItems: 'center', gap: 1,
            px: 2, py: 1.25,
            bgcolor: 'background.surface',
            borderLeft: 'none', borderRight: 'none', borderTop: 'none',
          }}
        >
          <IconButton
            size="sm" variant="plain"
            onClick={() => setMobileOpen(o => !o)}
            sx={{ borderRadius: '8px' }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </IconButton>
          <Stack_ShieldLogo />
        </Sheet>

        {children}
      </Box>
    </Box>
  );
}

function Stack_ShieldLogo() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ShieldCheck size={16} style={{ color: 'var(--joy-palette-primary-600)' }} />
      <Box>
        <FlowBooksLogoJoy showIcon={false} iconSize={16} fontSize="0.95rem" />
        <Typography level="body-xs" sx={{ color: 'primary.500', fontSize: '0.6rem', lineHeight: 1 }}>
          Admin Panel
        </Typography>
      </Box>
    </Box>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminAuthProvider>
  );
}
