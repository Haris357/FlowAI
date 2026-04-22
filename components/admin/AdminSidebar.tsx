'use client';
import {
  Box, Sheet, List, ListItem, ListItemButton, ListItemDecorator,
  ListItemContent, Typography, IconButton, Tooltip, Chip,
} from '@mui/joy';
import {
  LayoutDashboard, Users, CreditCard, Zap, HelpCircle,
  MessageSquare, Settings, ArrowLeft, ShieldCheck,
  PanelLeftClose, PanelLeftOpen, FileText, Star, LogOut,
  Mail, Bell, Activity, Megaphone, Newspaper, BarChart3, Flag, Radio,
  UserCog,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { FlowBooksLogoJoy } from '@/components/FlowBooksLogo';
import { liquidGlassStrong } from '@/lib/admin-theme';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { ROLE_COLORS, ROLE_LABELS, type Permission } from '@/lib/admin-roles';

interface NavItem {
  label: string;
  path: string;
  icon: any;
  permission: Permission;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, permission: 'dashboard:view' },
  { label: 'Users', path: '/admin/users', icon: Users, permission: 'users:view' },
  { label: 'Email Center', path: '/admin/emails', icon: Mail, permission: 'emails:send' },
  { label: 'Newsletter', path: '/admin/newsletter', icon: Newspaper, permission: 'newsletter:manage' },
  { label: 'Announcements', path: '/admin/announcements', icon: Megaphone, permission: 'announcements:view' },
  { label: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard, permission: 'subscriptions:view' },
  { label: 'AI Usage', path: '/admin/ai-usage', icon: Zap, permission: 'ai_usage:view' },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3, permission: 'analytics:view' },
  { label: 'Notifications', path: '/admin/notifications', icon: Bell, permission: 'notifications:view' },
  { label: 'Blogs', path: '/admin/blogs', icon: FileText, permission: 'blogs:view' },
  { label: 'Testimonials', path: '/admin/testimonials', icon: Star, permission: 'testimonials:view' },
  { label: 'Support', path: '/admin/support', icon: HelpCircle, permission: 'support:view' },
  { label: 'Feedback', path: '/admin/feedback', icon: MessageSquare, permission: 'feedback:view' },
  { label: 'Bug Reports', path: '/admin/reports', icon: Flag, permission: 'reports:view' },
  { label: 'Status Page', path: '/admin/status', icon: Radio, permission: 'status:view' },
  { label: 'Activity Log', path: '/admin/activity', icon: Activity, permission: 'activity:view' },
  { label: 'Admin Users', path: '/admin/admin-users', icon: UserCog, permission: 'admin_users:view' },
  { label: 'System', path: '/admin/system', icon: Settings, permission: 'system:view' },
];

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  /** When 'static', sidebar renders inline (used by mobile drawer) instead of `position: fixed`. */
  positioning?: 'fixed' | 'static';
}

export default function AdminSidebar({ collapsed = false, onToggle, positioning = 'fixed' }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, can, signOut } = useAdminAuth();

  const handleAdminLogout = () => {
    signOut();
    router.push('/admin/login');
  };

  const sidebarWidth = collapsed ? 68 : 240;
  const visibleItems = NAV_ITEMS.filter(item => can(item.permission));

  const baseSx = positioning === 'fixed'
    ? {
        position: 'fixed' as const, top: 0, left: 0,
        width: sidebarWidth, height: '100vh',
        zIndex: 1100,
        transition: 'width 0.2s ease',
      }
    : {
        width: '100%', height: '100%',
      };

  return (
    <Sheet
      sx={{
        ...baseSx,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        ...liquidGlassStrong as Record<string, unknown>,
        borderRight: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 0,
      }}
    >
      {/* Header */}
      <Box sx={{
        p: collapsed ? 1.5 : 2,
        borderBottom: '1px solid', borderColor: 'divider',
        background: 'linear-gradient(135deg, var(--joy-palette-primary-50, #fef3ed) 0%, var(--joy-palette-primary-100, #fde3d5) 100%)',
        display: 'flex', alignItems: 'center',
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

      {/* Current admin info */}
      {admin && !collapsed && (
        <Box sx={{
          px: 2, py: 1.5,
          borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', alignItems: 'center', gap: 1.25,
        }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
            bgcolor: 'primary.softBg',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.78rem', fontWeight: 700, color: 'primary.600',
          }}>
            {(admin.name || admin.username).charAt(0).toUpperCase()}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography level="body-sm" fontWeight={600} noWrap>
              {admin.name || admin.username}
            </Typography>
            <Chip size="sm" variant="soft" color={ROLE_COLORS[admin.role]} sx={{
              fontSize: '0.62rem', fontWeight: 700, '--Chip-minHeight': '16px',
              px: 0.75, mt: 0.25,
            }}>
              {ROLE_LABELS[admin.role]}
            </Chip>
          </Box>
        </Box>
      )}

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', p: collapsed ? 0.75 : 1.5 }}>
        <List size="sm" sx={{ gap: 0.5 }}>
          {visibleItems.map(item => {
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
                  component="a"
                  href="https://flowbooksai.com/companies"
                  sx={{ borderRadius: 'sm', justifyContent: 'center', px: 1 }}
                >
                  <ListItemDecorator sx={{ minInlineSize: 'auto' }}>
                    <ArrowLeft size={18} />
                  </ListItemDecorator>
                </ListItemButton>
              </Tooltip>
            ) : (
              <ListItemButton
                component="a"
                href="https://flowbooksai.com/companies"
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
