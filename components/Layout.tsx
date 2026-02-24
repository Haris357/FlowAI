'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Sheet,
  Stack,
  Typography,
  IconButton,
  Avatar,
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  ListItemDecorator,
  Tooltip,
} from '@mui/joy';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import PlanBadge from '@/components/subscription/PlanBadge';
import UsageMeter from '@/components/subscription/UsageMeter';
import UpgradeModal from '@/components/subscription/UpgradeModal';
import NotificationBell from '@/components/notifications/NotificationBell';
import NotificationPanel from '@/components/notifications/NotificationPanel';
import WelcomeTutorialModal from '@/components/settings/WelcomeTutorialModal';
import FeedbackPromptModal from '@/components/modals/FeedbackPromptModal';
import PremiumModal from '@/components/modals/PremiumModal';
import SettingsModal from '@/components/settings/SettingsModal';
import { FlowBooksLogoJoy } from '@/components/FlowBooksLogo';
import { usePathname, useRouter, useParams } from 'next/navigation';
import NextLink from 'next/link';
import {
  LogOut,
  Settings,
  User,
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  UserCheck,
  ArrowLeftRight,
  BarChart3,
  Menu as MenuIcon,
  X,
  Wallet,
  Receipt,
  BookOpen,
  DollarSign,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShoppingCart,
  Briefcase,
  Calculator,
  ClipboardList,
  Package,
  CreditCard,
  Landmark,
  RefreshCw,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react';

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 70;

interface NavItem {
  label: string;
  path?: string;
  icon: React.ElementType;
  tourId?: string;
  children?: NavItem[];
}

const getNavItems = (companyId: string): NavItem[] => [
  { label: 'Dashboard', path: `/companies/${companyId}/dashboard`, icon: LayoutDashboard, tourId: 'dashboard' },
  { label: 'Flow AI', path: `/companies/${companyId}/chat`, icon: MessageCircle, tourId: 'flow-ai' },
  {
    label: 'Sales',
    icon: ShoppingCart,
    tourId: 'sales',
    children: [
      { label: 'Invoices', path: `/companies/${companyId}/invoices`, icon: FileText },
      { label: 'Quotes', path: `/companies/${companyId}/quotes`, icon: ClipboardList },
      { label: 'Customers', path: `/companies/${companyId}/customers`, icon: Users },
      { label: 'Credit Notes', path: `/companies/${companyId}/credit-notes`, icon: CreditCard },
    ],
  },
  {
    label: 'Purchases',
    icon: Receipt,
    tourId: 'purchases',
    children: [
      { label: 'Bills', path: `/companies/${companyId}/bills`, icon: Receipt },
      { label: 'Purchase Orders', path: `/companies/${companyId}/purchase-orders`, icon: Package },
      { label: 'Vendors', path: `/companies/${companyId}/vendors`, icon: Building2 },
    ],
  },
  {
    label: 'Banking',
    icon: Landmark,
    tourId: 'banking',
    children: [
      { label: 'Bank Accounts', path: `/companies/${companyId}/bank-accounts`, icon: Landmark },
      { label: 'Transactions', path: `/companies/${companyId}/transactions`, icon: ArrowLeftRight },
    ],
  },
  {
    label: 'People',
    icon: Briefcase,
    tourId: 'people',
    children: [
      { label: 'Employees', path: `/companies/${companyId}/employees`, icon: UserCheck },
      { label: 'Payroll', path: `/companies/${companyId}/payroll`, icon: DollarSign },
    ],
  },
  {
    label: 'Accounting',
    icon: Calculator,
    tourId: 'accounting',
    children: [
      { label: 'Chart of Accounts', path: `/companies/${companyId}/accounts`, icon: Wallet },
      { label: 'Journal Entries', path: `/companies/${companyId}/journal-entries`, icon: BookOpen },
      { label: 'Recurring', path: `/companies/${companyId}/recurring`, icon: RefreshCw },
    ],
  },
  { label: 'Reports', path: `/companies/${companyId}/reports`, icon: BarChart3, tourId: 'reports' },
  { label: 'Company Settings', path: `/companies/${companyId}/settings`, icon: Settings },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const { mode, toggleMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Get companyId from URL params
  const companyId = params?.companyId as string | undefined;

  // Generate nav items with company ID
  const navItems = companyId ? getNavItems(companyId) : [];

  // Find which parent menu contains the current path
  const activeParentMenu = useMemo(() => {
    for (const item of navItems) {
      if (item.children) {
        const hasActiveChild = item.children.some(child => child.path === pathname);
        if (hasActiveChild) {
          return item.label;
        }
      }
    }
    return null;
  }, [pathname]);

  // Expand only the menu containing the current page on mount/navigation
  useEffect(() => {
    if (activeParentMenu) {
      setExpandedMenus(prev => {
        if (!prev.includes(activeParentMenu)) {
          return [activeParentMenu];
        }
        return prev;
      });
    } else {
      // No parent menu (Dashboard, Reports, Settings) - close all
      setExpandedMenus([]);
    }
  }, [activeParentMenu]);

  // Pages that should not show the sidebar
  const noSidebarPages = ['/', '/login', '/signup', '/onboarding', '/companies'];
  const isCompanyRoute = pathname.startsWith('/companies/') && companyId;
  const showSidebar = user && isCompanyRoute;

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  const isMenuExpanded = (label: string) => expandedMenus.includes(label);

  const isChildActive = (item: NavItem): boolean => {
    if (item.path && pathname === item.path) return true;
    if (item.children) {
      return item.children.some(child => pathname === child.path);
    }
    return false;
  };

  const NavItemComponent = ({ item, collapsed = false, depth = 0 }: { item: NavItem; collapsed?: boolean; depth?: number }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = isMenuExpanded(item.label);
    const isActive = item.path ? pathname === item.path : isChildActive(item);
    const Icon = item.icon;

    if (hasChildren) {
      const menuContent = (
        <>
          <ListItemButton
            onClick={() => {
              if (collapsed) {
                // In collapsed mode, navigate to first child
                if (item.children && item.children[0]?.path) {
                  handleNavigation(item.children[0].path);
                }
              } else {
                toggleMenu(item.label);
              }
            }}
            sx={{
              borderRadius: 'sm',
              transition: 'all 0.15s ease-in-out',
              justifyContent: collapsed ? 'center' : 'flex-start',
              pl: collapsed ? undefined : depth * 2 + 1,
              bgcolor: isActive && !collapsed ? 'primary.50' : undefined,
              '&:hover': {
                bgcolor: isActive ? 'primary.100' : 'neutral.100',
              },
            }}
          >
            <ListItemDecorator sx={{ minInlineSize: collapsed ? 'auto' : undefined, color: isActive ? 'primary.600' : 'inherit' }}>
              <Icon size={18} />
            </ListItemDecorator>
            {!collapsed && (
              <>
                <ListItemContent>
                  <Typography level="body-sm" fontWeight={isActive ? 600 : 400} sx={{ color: isActive ? 'primary.700' : 'inherit' }}>
                    {item.label}
                  </Typography>
                </ListItemContent>
                <ChevronDown
                  size={16}
                  style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    color: 'var(--joy-palette-text-secondary)',
                  }}
                />
              </>
            )}
          </ListItemButton>
          {!collapsed && isExpanded && (
            <List size="sm" sx={{ gap: 0.25, mt: 0.5, mb: 0.5 }}>
              {item.children?.map((child) => (
                <NavItemComponent key={child.path} item={child} collapsed={collapsed} depth={depth + 1} />
              ))}
            </List>
          )}
        </>
      );

      if (collapsed) {
        return (
          <ListItem data-tour={item.tourId || undefined}>
            <Dropdown>
              <Tooltip title={item.label} placement="right">
                <MenuButton
                  slots={{ root: ListItemButton }}
                  slotProps={{
                    root: {
                      sx: {
                        borderRadius: 'sm',
                        justifyContent: 'center',
                        bgcolor: isActive ? 'primary.50' : undefined,
                        color: isActive ? 'primary.600' : undefined,
                      }
                    }
                  }}
                >
                  <Icon size={18} />
                </MenuButton>
              </Tooltip>
              <Menu placement="right-start" sx={{ minWidth: 180, zIndex: 1200 }}>
                <Typography level="body-xs" sx={{ px: 1.5, py: 0.5, fontWeight: 600, color: 'text.secondary' }}>
                  {item.label}
                </Typography>
                <Divider />
                {item.children?.map((child) => (
                  <MenuItem
                    key={child.path}
                    component={NextLink}
                    href={child.path || '#'}
                    selected={pathname === child.path}
                    sx={{ textDecoration: 'none' }}
                  >
                    <child.icon size={16} />
                    {child.label}
                  </MenuItem>
                ))}
              </Menu>
            </Dropdown>
          </ListItem>
        );
      }

      return <ListItem data-tour={item.tourId || undefined} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>{menuContent}</ListItem>;
    }

    // Leaf item (no children) - use NextLink for prefetching
    const button = (
      <ListItemButton
        component={NextLink}
        href={item.path || '#'}
        selected={isActive}
        prefetch={true}
        onClick={() => setMobileOpen(false)}
        sx={{
          borderRadius: 'sm',
          transition: 'all 0.15s ease-in-out',
          justifyContent: collapsed ? 'center' : 'flex-start',
          pl: collapsed ? undefined : depth * 2 + 1,
          textDecoration: 'none',
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, var(--joy-palette-primary-100) 0%, var(--joy-palette-primary-200) 100%)',
            color: 'primary.700',
            '&:hover': {
              background: 'linear-gradient(135deg, var(--joy-palette-primary-200) 0%, var(--joy-palette-primary-300) 100%)',
            },
          },
        }}
      >
        <ListItemDecorator sx={{ minInlineSize: collapsed ? 'auto' : undefined }}>
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
      <ListItem data-tour={item.tourId || undefined}>
        {collapsed ? (
          <Tooltip title={item.label} placement="right">
            {button}
          </Tooltip>
        ) : (
          button
        )}
      </ListItem>
    );
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <List size="sm" sx={{ gap: 0.5 }}>
      {/* Switch Company Button */}
      <ListItem>
        {collapsed ? (
          <Tooltip title="Switch Company" placement="right">
            <ListItemButton
              onClick={() => router.push('/companies')}
              sx={{
                borderRadius: 'sm',
                justifyContent: 'center',
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'neutral.100',
                },
              }}
            >
              <ArrowLeft size={18} />
            </ListItemButton>
          </Tooltip>
        ) : (
          <ListItemButton
            onClick={() => router.push('/companies')}
            sx={{
              borderRadius: 'sm',
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'neutral.100',
              },
            }}
          >
            <ListItemDecorator>
              <ArrowLeft size={18} />
            </ListItemDecorator>
            <ListItemContent>
              <Typography level="body-sm">Switch Company</Typography>
            </ListItemContent>
          </ListItemButton>
        )}
      </ListItem>
      <Divider sx={{ my: 0.5 }} />
      {navItems.map((item) => (
        <NavItemComponent key={item.label} item={item} collapsed={collapsed} />
      ))}
    </List>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.body', overflowX: 'hidden' }}>
      {/* Sidebar - Desktop */}
      {showSidebar && (
        <Sheet
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
            height: '100vh',
            bgcolor: 'background.surface',
            borderRight: '1px solid',
            borderColor: 'divider',
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            zIndex: 1100,
            transition: 'width 0.3s ease',
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, var(--joy-palette-primary-50) 0%, var(--joy-palette-primary-100) 100%)',
              position: 'relative',
            }}
          >
            {!sidebarCollapsed ? (
              <Box>
                <FlowBooksLogoJoy iconSize={30} fontSize="1.35rem" />
                <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }}>
                  AI-First Accounting
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <FlowBooksLogoJoy showText={false} iconSize={34} />
              </Box>
            )}
            <Tooltip title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
              <IconButton
                size="sm"
                variant="soft"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                sx={{
                  position: 'absolute',
                  right: -14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: 'background.surface',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 'sm',
                  '&:hover': {
                    bgcolor: 'background.level1',
                  },
                }}
              >
                {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Navigation */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
            <SidebarContent collapsed={sidebarCollapsed} />
          </Box>

          {/* User Section */}
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            {!sidebarCollapsed ? (
              <>
                {/* Token Usage — top */}
                <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                  <UsageMeter compact />
                </Box>

                {/* Quick Actions Row */}
                <Stack
                  direction="row"
                  justifyContent="center"
                  spacing={0.5}
                  sx={{ px: 1.5, pb: 1 }}
                >
                  <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
                    <IconButton
                      variant="plain"
                      size="sm"
                      onClick={toggleMode}
                      sx={{
                        borderRadius: '8px',
                        width: 34,
                        height: 34,
                        transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: 'background.level2', transform: 'rotate(180deg)' },
                      }}
                    >
                      {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    </IconButton>
                  </Tooltip>
                  <NotificationBell onClick={() => setNotificationPanelOpen(true)} />
                  <Tooltip title="Account Settings">
                    <IconButton
                      variant="plain"
                      size="sm"
                      onClick={() => setSettingsModalOpen(true)}
                      sx={{
                        borderRadius: '8px',
                        width: 34,
                        height: 34,
                        transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: 'background.level2' },
                      }}
                    >
                      <Settings size={16} />
                    </IconButton>
                  </Tooltip>
                </Stack>

                <Divider />

                {/* User Profile Card */}
                <Dropdown>
                  <MenuButton
                    variant="plain"
                    sx={{
                      p: 0,
                      width: '100%',
                      border: 'none',
                      '&:hover': { bgcolor: 'transparent' },
                    }}
                  >
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        '&:hover': { bgcolor: 'background.level1' },
                      }}
                    >
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar
                          src={user?.photoURL || undefined}
                          size="sm"
                          sx={{
                            width: 34,
                            height: 34,
                            border: '2px solid',
                            borderColor: 'primary.200',
                          }}
                        >
                          {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Typography level="body-sm" fontWeight={600} noWrap sx={{ fontSize: '13px' }}>
                              {user?.displayName || user?.email?.split('@')[0]}
                            </Typography>
                            <PlanBadge />
                          </Stack>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '11px' }} noWrap>
                            {user?.email}
                          </Typography>
                        </Box>
                        <ChevronDown size={14} style={{ color: 'var(--joy-palette-text-tertiary)', flexShrink: 0 }} />
                      </Stack>
                    </Box>
                  </MenuButton>
                  <Menu placement="top-end" sx={{ minWidth: 200, zIndex: 1200 }}>
                    <MenuItem onClick={() => companyId && router.push(`/companies/${companyId}/settings`)}>
                      <User size={16} />
                      Company Settings
                    </MenuItem>
                    <MenuItem onClick={() => setSettingsModalOpen(true)}>
                      <Settings size={16} />
                      Account Settings
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={signOut} color="danger">
                      <LogOut size={16} />
                      Sign out
                    </MenuItem>
                  </Menu>
                </Dropdown>
              </>
            ) : (
              <Stack spacing={0.75} alignItems="center" sx={{ py: 1.5 }}>
                <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'} placement="right">
                  <IconButton
                    variant="plain"
                    size="sm"
                    onClick={toggleMode}
                    sx={{
                      borderRadius: '8px',
                      width: 34,
                      height: 34,
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: 'background.level2', transform: 'rotate(180deg)' },
                    }}
                  >
                    {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                  </IconButton>
                </Tooltip>
                <NotificationBell onClick={() => setNotificationPanelOpen(true)} collapsed />
                <Dropdown>
                  <Tooltip title={user?.displayName || user?.email?.split('@')[0]} placement="right">
                    <MenuButton
                      slots={{ root: Avatar }}
                      slotProps={{
                        root: {
                          size: 'sm',
                          src: user?.photoURL || undefined,
                          sx: {
                            cursor: 'pointer',
                            border: '2px solid',
                            borderColor: 'primary.200',
                          },
                        },
                      }}
                    >
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                    </MenuButton>
                  </Tooltip>
                  <Menu placement="right-end" sx={{ minWidth: 200, zIndex: 1200 }}>
                    <Box sx={{ px: 2, py: 1 }}>
                      <Typography level="body-sm" fontWeight={600}>
                        {user?.displayName || user?.email?.split('@')[0]}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        {user?.email}
                      </Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={() => companyId && router.push(`/companies/${companyId}/settings`)}>
                      <User size={16} />
                      Company Settings
                    </MenuItem>
                    <MenuItem onClick={() => setSettingsModalOpen(true)}>
                      <Settings size={16} />
                      Account Settings
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={signOut} color="danger">
                      <LogOut size={16} />
                      Sign out
                    </MenuItem>
                  </Menu>
                </Dropdown>
              </Stack>
            )}
          </Box>
        </Sheet>
      )}

      {/* Mobile Sidebar Overlay */}
      {showSidebar && mobileOpen && (
        <Box
          onClick={() => setMobileOpen(false)}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1200,
            display: { xs: 'block', md: 'none' },
          }}
        />
      )}

      {/* Mobile Sidebar */}
      {showSidebar && (
        <Sheet
          sx={{
            position: 'fixed',
            top: 0,
            left: mobileOpen ? 0 : -SIDEBAR_WIDTH,
            width: SIDEBAR_WIDTH,
            height: '100vh',
            bgcolor: 'background.surface',
            borderRight: '1px solid',
            borderColor: 'divider',
            display: { xs: 'flex', md: 'none' },
            flexDirection: 'column',
            transition: 'left 0.2s ease-in-out',
            zIndex: 1300,
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, var(--joy-palette-primary-50) 0%, var(--joy-palette-primary-100) 100%)',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <FlowBooksLogoJoy iconSize={30} fontSize="1.35rem" />
              <IconButton size="sm" variant="plain" onClick={() => setMobileOpen(false)}>
                <X size={18} />
              </IconButton>
            </Stack>
          </Box>

          {/* Navigation */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
            <SidebarContent collapsed={false} />
          </Box>

          {/* User Section */}
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            {/* Token Usage — top */}
            <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
              <UsageMeter compact />
            </Box>

            {/* Quick Actions Row */}
            <Stack
              direction="row"
              justifyContent="center"
              spacing={0.5}
              sx={{ px: 1.5, pb: 1 }}
            >
              <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
                <IconButton
                  variant="plain"
                  size="sm"
                  onClick={toggleMode}
                  sx={{
                    borderRadius: '8px',
                    width: 34,
                    height: 34,
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: 'background.level2', transform: 'rotate(180deg)' },
                  }}
                >
                  {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </IconButton>
              </Tooltip>
              <NotificationBell onClick={() => { setMobileOpen(false); setNotificationPanelOpen(true); }} />
              <Tooltip title="Account Settings">
                <IconButton
                  variant="plain"
                  size="sm"
                  onClick={() => { setMobileOpen(false); setSettingsModalOpen(true); }}
                  sx={{
                    borderRadius: '8px',
                    width: 34,
                    height: 34,
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: 'background.level2' },
                  }}
                >
                  <Settings size={16} />
                </IconButton>
              </Tooltip>
            </Stack>

            <Divider />

            {/* User Profile */}
            <Box
              sx={{
                px: 1.5,
                py: 1,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                '&:hover': { bgcolor: 'background.level1' },
              }}
              onClick={() => { setMobileOpen(false); setSettingsModalOpen(true); }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Avatar
                  src={user?.photoURL || undefined}
                  size="sm"
                  sx={{ width: 34, height: 34, border: '2px solid', borderColor: 'primary.200' }}
                >
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography level="body-sm" fontWeight={600} noWrap sx={{ fontSize: '13px' }}>
                      {user?.displayName || user?.email?.split('@')[0]}
                    </Typography>
                    <PlanBadge />
                  </Stack>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '11px' }} noWrap>
                    {user?.email}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Sheet>
      )}

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          width: showSidebar ? undefined : '100%',
          ml: showSidebar ? { xs: 0, md: sidebarCollapsed ? `${SIDEBAR_COLLAPSED_WIDTH}px` : `${SIDEBAR_WIDTH}px` } : 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
          overflowX: 'hidden',
        }}
      >
        {/* Mobile Header */}
        {showSidebar && (
          <Sheet
            sx={{
              position: 'sticky',
              top: 0,
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              zIndex: 1000,
              background: 'linear-gradient(135deg, var(--joy-palette-primary-50) 0%, var(--joy-palette-primary-100) 100%)',
            }}
          >
            <IconButton variant="plain" onClick={() => setMobileOpen(true)}>
              <MenuIcon size={20} />
            </IconButton>
            <FlowBooksLogoJoy iconSize={24} fontSize="1.1rem" />
            <Stack direction="row" spacing={1} alignItems="center">
              <NotificationBell onClick={() => setNotificationPanelOpen(true)} />
              <IconButton
                size="sm"
                variant="soft"
                onClick={toggleMode}
              >
                {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </IconButton>
              <Avatar src={user?.photoURL || undefined} size="sm">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
              </Avatar>
            </Stack>
          </Sheet>
        )}

        {/* Page Content */}
        <Box sx={{ flex: 1 }}>
          {children}
        </Box>
      </Box>

      <UpgradeModal />
      <NotificationPanel open={notificationPanelOpen} onClose={() => setNotificationPanelOpen(false)} />
      <SettingsModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
      <WelcomeTutorialModal />
      <FeedbackPromptModal />
      <PremiumModal />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: mode === 'light' ? '#fff' : '#232220',
            color: mode === 'light' ? '#1A1915' : '#EEECE8',
            borderRadius: '8px',
            border: `1px solid ${mode === 'light' ? '#E8E5DE' : '#3D3A37'}`,
            boxShadow: mode === 'light'
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.08)'
              : '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: mode === 'light' ? '#fff' : '#232220',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: mode === 'light' ? '#fff' : '#232220',
            },
          },
        }}
      />
    </Box>
  );
}
