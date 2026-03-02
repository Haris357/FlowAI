'use client';
import {
  Box, Sheet, List, ListItem, ListItemButton, ListItemDecorator,
  ListItemContent, Typography, IconButton, Tooltip, Stack,
} from '@mui/joy';
import {
  LayoutDashboard, Users, CreditCard, Zap, HelpCircle,
  MessageSquare, Settings, ArrowLeft, ShieldCheck,
  PanelLeftClose, PanelLeftOpen, FileText, Star, LogOut,
  Mail, Bell, Activity, Megaphone, Newspaper,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { FlowBooksLogoJoy } from '@/components/FlowBooksLogo';
import { liquidGlassStrong } from '@/lib/admin-theme';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Email Center', path: '/admin/emails', icon: Mail },
  { label: 'Newsletter', path: '/admin/newsletter', icon: Newspaper },
  { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  { label: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard },
  { label: 'AI Usage', path: '/admin/ai-usage', icon: Zap },
  { label: 'Notifications', path: '/admin/notifications', icon: Bell },
  { label: 'Blogs', path: '/admin/blogs', icon: FileText },
  { label: 'Testimonials', path: '/admin/testimonials', icon: Star },
  { label: 'Support', path: '/admin/support', icon: HelpCircle },
  { label: 'Feedback', path: '/admin/feedback', icon: MessageSquare },
  { label: 'Activity Log', path: '/admin/activity', icon: Activity },
  { label: 'System', path: '/admin/system', icon: Settings },
];

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function AdminSidebar({ collapsed = false, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleAdminLogout = () => {
    sessionStorage.removeItem('adminSession');
    router.push('/admin/login');
  };

  const sidebarWidth = collapsed ? 68 : 240;

  return (
    <Sheet
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: sidebarWidth,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1100,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
        ...liquidGlassStrong as Record<string, unknown>,
        borderRight: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 0,
      }}
    >
      {/* Header */}
      <Box sx={{
        p: collapsed ? 1.5 : 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(135deg, var(--joy-palette-primary-50, #fef3ed) 0%, var(--joy-palette-primary-100, #fde3d5) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: 56,
      }}>
        {collapsed ? (
          <Tooltip title="Expand sidebar" placement="right">
            <IconButton size="sm" variant="plain" onClick={onToggle} sx={{ color: 'primary.600' }}>
              <PanelLeftOpen size={18} />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShieldCheck size={20} style={{ color: 'var(--joy-palette-primary-600)' }} />
              <Box>
                <FlowBooksLogoJoy showIcon={false} iconSize={20} fontSize="1.1rem" />
                <Typography level="body-xs" sx={{ color: 'primary.500' }}>
                  Admin Panel
                </Typography>
              </Box>
            </Box>
            <IconButton size="sm" variant="plain" onClick={onToggle} sx={{ color: 'primary.500' }}>
              <PanelLeftClose size={16} />
            </IconButton>
          </>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', p: collapsed ? 0.75 : 1.5 }}>
        <List size="sm" sx={{ gap: 0.5 }}>
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.path ||
              (item.path !== '/admin' && pathname.startsWith(item.path));
            const Icon = item.icon;

            const button = (
              <ListItemButton
                component={NextLink}
                href={item.path}
                selected={isActive}
                sx={{
                  borderRadius: 'sm',
                  textDecoration: 'none',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1 : 1.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.softBg',
                    color: 'primary.700',
                  },
                  '&.Mui-selected:hover': {
                    bgcolor: 'primary.softHoverBg',
                  },
                }}
              >
                <ListItemDecorator sx={{
                  color: isActive ? 'primary.500' : 'text.tertiary',
                  minInlineSize: collapsed ? 'auto' : undefined,
                }}>
                  <Icon size={18} />
                </ListItemDecorator>
                {!collapsed && (
                  <ListItemContent>
                    <Typography level="body-sm" fontWeight={isActive ? 600 : 400}>
                      {item.label}
                    </Typography>
                  </ListItemContent>
                )}
              </ListItemButton>
            );

            return (
              <ListItem key={item.path}>
                {collapsed ? (
                  <Tooltip title={item.label} placement="right">
                    {button}
                  </Tooltip>
                ) : (
                  button
                )}
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Bottom Actions */}
      <Box sx={{ p: collapsed ? 0.75 : 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <List size="sm" sx={{ gap: 0.5, '--ListItemDecorator-size': collapsed ? 'auto' : undefined }}>
          <ListItem>
            {collapsed ? (
              <Tooltip title="Back to Flowbooks" placement="right">
                <ListItemButton
                  component={NextLink}
                  href="/companies"
                  sx={{ borderRadius: 'sm', justifyContent: 'center', px: 1 }}
                >
                  <ListItemDecorator sx={{ minInlineSize: 'auto' }}>
                    <ArrowLeft size={18} />
                  </ListItemDecorator>
                </ListItemButton>
              </Tooltip>
            ) : (
              <ListItemButton
                component={NextLink}
                href="/companies"
                sx={{ borderRadius: 'sm' }}
              >
                <ListItemDecorator>
                  <ArrowLeft size={18} />
                </ListItemDecorator>
                <ListItemContent>
                  <Typography level="body-sm">Back to Flowbooks</Typography>
                </ListItemContent>
              </ListItemButton>
            )}
          </ListItem>
          <ListItem>
            {collapsed ? (
              <Tooltip title="Logout Admin" placement="right">
                <ListItemButton
                  onClick={handleAdminLogout}
                  sx={{ borderRadius: 'sm', justifyContent: 'center', px: 1 }}
                  color="danger"
                >
                  <ListItemDecorator sx={{ minInlineSize: 'auto' }}>
                    <LogOut size={18} />
                  </ListItemDecorator>
                </ListItemButton>
              </Tooltip>
            ) : (
              <ListItemButton
                onClick={handleAdminLogout}
                sx={{ borderRadius: 'sm' }}
                color="danger"
              >
                <ListItemDecorator>
                  <LogOut size={18} />
                </ListItemDecorator>
                <ListItemContent>
                  <Typography level="body-sm">Logout Admin</Typography>
                </ListItemContent>
              </ListItemButton>
            )}
          </ListItem>
        </List>
      </Box>
    </Sheet>
  );
}
