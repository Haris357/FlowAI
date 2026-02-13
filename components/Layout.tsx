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
  children?: NavItem[];
}

const getNavItems = (companyId: string): NavItem[] => [
  { label: 'Dashboard', path: `/companies/${companyId}/dashboard`, icon: LayoutDashboard },
  { label: 'Flow AI', path: `/companies/${companyId}/chat`, icon: MessageCircle },
  {
    label: 'Sales',
    icon: ShoppingCart,
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
    children: [
      { label: 'Bills', path: `/companies/${companyId}/bills`, icon: Receipt },
      { label: 'Purchase Orders', path: `/companies/${companyId}/purchase-orders`, icon: Package },
      { label: 'Vendors', path: `/companies/${companyId}/vendors`, icon: Building2 },
    ],
  },
  {
    label: 'Banking',
    icon: Landmark,
    children: [
      { label: 'Bank Accounts', path: `/companies/${companyId}/bank-accounts`, icon: Landmark },
      { label: 'Transactions', path: `/companies/${companyId}/transactions`, icon: ArrowLeftRight },
    ],
  },
  {
    label: 'People',
    icon: Briefcase,
    children: [
      { label: 'Employees', path: `/companies/${companyId}/employees`, icon: UserCheck },
      { label: 'Payroll', path: `/companies/${companyId}/payroll`, icon: DollarSign },
    ],
  },
  {
    label: 'Accounting',
    icon: Calculator,
    children: [
      { label: 'Chart of Accounts', path: `/companies/${companyId}/accounts`, icon: Wallet },
      { label: 'Journal Entries', path: `/companies/${companyId}/journal-entries`, icon: BookOpen },
      { label: 'Recurring', path: `/companies/${companyId}/recurring`, icon: RefreshCw },
    ],
  },
  { label: 'Reports', path: `/companies/${companyId}/reports`, icon: BarChart3 },
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
          <ListItem>
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

      return <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch' }}>{menuContent}</ListItem>;
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
      <ListItem>
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
              <>
                <Typography level="h4" fontWeight="bold" color="primary" sx={{ letterSpacing: '-0.03em' }}>
                  Flow<span style={{ fontStyle: 'italic' }}>books</span>
                </Typography>
                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                  AI-First Accounting
                </Typography>
              </>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 'md',
                    bgcolor: 'primary.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BookOpen size={20} style={{ color: 'var(--joy-palette-primary-600)' }} />
                </Box>
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
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            {!sidebarCollapsed ? (
              <>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <IconButton
                    variant="soft"
                    size="sm"
                    onClick={toggleMode}
                    sx={{
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'rotate(180deg)',
                      },
                    }}
                  >
                    {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                  </IconButton>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                    {mode === 'light' ? 'Dark mode' : 'Light mode'}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={user?.photoURL || undefined}
                    size="sm"
                  >
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography level="body-sm" fontWeight={500} noWrap>
                      {user?.displayName || user?.email?.split('@')[0]}
                    </Typography>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }} noWrap>
                      {user?.email}
                    </Typography>
                  </Box>
                  <Dropdown>
                    <MenuButton
                      slots={{ root: IconButton }}
                      slotProps={{ root: { size: 'sm', variant: 'plain', color: 'neutral' } }}
                    >
                      <Settings size={16} />
                    </MenuButton>
                    <Menu placement="top-end" sx={{ minWidth: 180, zIndex: 1200 }}>
                      <MenuItem onClick={() => companyId && router.push(`/companies/${companyId}/settings`)}>
                        <User size={16} />
                        Company Settings
                      </MenuItem>
                      <Divider />
                      <MenuItem onClick={signOut} color="danger">
                        <LogOut size={16} />
                        Sign out
                      </MenuItem>
                    </Menu>
                  </Dropdown>
                </Stack>
              </>
            ) : (
              <Stack spacing={1} alignItems="center">
                <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} placement="right">
                  <IconButton
                    variant="soft"
                    size="sm"
                    onClick={toggleMode}
                    sx={{
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'rotate(180deg)',
                      },
                    }}
                  >
                    {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                  </IconButton>
                </Tooltip>
                <Dropdown>
                  <Tooltip title="Profile & Settings" placement="right">
                    <MenuButton
                      slots={{ root: Avatar }}
                      slotProps={{
                        root: {
                          size: 'sm',
                          src: user?.photoURL || undefined,
                          sx: { cursor: 'pointer' }
                        }
                      }}
                    >
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                    </MenuButton>
                  </Tooltip>
                  <Menu placement="right-end" sx={{ minWidth: 180, zIndex: 1200 }}>
                    <MenuItem onClick={() => companyId && router.push(`/companies/${companyId}/settings`)}>
                      <User size={16} />
                      Company Settings
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
              <Typography level="h4" fontWeight="bold" color="primary" sx={{ letterSpacing: '-0.03em' }}>
                Flow<span style={{ fontStyle: 'italic' }}>books</span>
              </Typography>
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
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton
                  variant="soft"
                  size="sm"
                  onClick={toggleMode}
                  sx={{
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'rotate(180deg)',
                    },
                  }}
                >
                  {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </IconButton>
                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                  {mode === 'light' ? 'Dark mode' : 'Light mode'}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar src={user?.photoURL || undefined} size="sm">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                </Avatar>
                <Typography level="body-sm" fontWeight={500}>
                  {user?.displayName || user?.email?.split('@')[0]}
                </Typography>
              </Stack>

              <ListItemButton
                onClick={() => {
                  setMobileOpen(false);
                  companyId && router.push(`/companies/${companyId}/settings`);
                }}
                sx={{ borderRadius: 'sm' }}
              >
                <ListItemDecorator>
                  <User size={16} />
                </ListItemDecorator>
                <ListItemContent>
                  <Typography level="body-sm">
                    Company Settings
                  </Typography>
                </ListItemContent>
              </ListItemButton>

              <ListItemButton onClick={signOut} sx={{ borderRadius: 'sm' }}>
                <ListItemDecorator>
                  <LogOut size={16} />
                </ListItemDecorator>
                <ListItemContent>
                  <Typography level="body-sm" color="danger">
                    Sign out
                  </Typography>
                </ListItemContent>
              </ListItemButton>
            </Stack>
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
            <Typography level="title-md" fontWeight="bold" color="primary" sx={{ letterSpacing: '-0.03em' }}>
              Flow<span style={{ fontStyle: 'italic' }}>books</span>
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
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

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: mode === 'light' ? '#fff' : '#1e293b',
            color: mode === 'light' ? '#333' : '#f1f5f9',
            borderRadius: '8px',
            border: `1px solid ${mode === 'light' ? '#e5e7eb' : '#475569'}`,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: mode === 'light' ? '#fff' : '#1e293b',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: mode === 'light' ? '#fff' : '#1e293b',
            },
          },
        }}
      />
    </Box>
  );
}
