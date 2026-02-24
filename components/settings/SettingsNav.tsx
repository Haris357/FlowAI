'use client';
import {
  Box, Sheet, List, ListItem, ListItemButton, ListItemDecorator,
  ListItemContent, Typography, Stack,
} from '@mui/joy';
import {
  User, Settings, Bell, Shield, CreditCard, Zap,
  FileText, GraduationCap, HelpCircle, MessageSquare, Sparkles, Info,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FlowBooksLogoJoy } from '@/components/FlowBooksLogo';

export type SettingsSection =
  | 'profile' | 'preferences' | 'notifications' | 'security'
  | 'subscription' | 'usage'
  | 'docs' | 'tutorials' | 'support' | 'feedback'
  | 'whats-new' | 'about';

interface NavGroup {
  label: string;
  items: { id: SettingsSection; label: string; icon: React.ElementType }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'preferences', label: 'Preferences', icon: Settings },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'security', label: 'Security', icon: Shield },
    ],
  },
  {
    label: 'Billing',
    items: [
      { id: 'subscription', label: 'Subscription', icon: CreditCard },
      { id: 'usage', label: 'Usage & AI', icon: Zap },
    ],
  },
  {
    label: 'Help',
    items: [
      { id: 'docs', label: 'Documentation', icon: FileText },
      { id: 'tutorials', label: 'Tutorials', icon: GraduationCap },
      { id: 'support', label: 'Support', icon: HelpCircle },
      { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    ],
  },
  {
    label: 'About',
    items: [
      { id: 'whats-new', label: "What's New", icon: Sparkles },
      { id: 'about', label: 'About', icon: Info },
    ],
  },
];

export const SETTINGS_SIDEBAR_WIDTH = 250;

interface SettingsNavProps {
  active: SettingsSection;
  onSelect: (section: SettingsSection) => void;
}

export default function SettingsNav({ active, onSelect }: SettingsNavProps) {
  const router = useRouter();

  return (
    <Sheet
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: SETTINGS_SIDEBAR_WIDTH,
        height: '100vh',
        bgcolor: 'background.surface',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1100,
      }}
    >
      {/* Header */}
      <Box sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(135deg, var(--joy-palette-primary-50) 0%, var(--joy-palette-primary-100) 100%)',
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Settings size={20} style={{ color: 'var(--joy-palette-primary-600)' }} />
          <Box>
            <FlowBooksLogoJoy showIcon={false} iconSize={20} fontSize="1.1rem" />
            <Typography level="body-xs" sx={{ color: 'primary.500' }}>
              Account Settings
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
        {NAV_GROUPS.map(group => (
          <Box key={group.label} sx={{ mb: 2 }}>
            <Typography level="body-xs" sx={{
              color: 'text.tertiary', textTransform: 'uppercase',
              fontWeight: 700, letterSpacing: '0.06em', px: 1, mb: 0.5,
            }}>
              {group.label}
            </Typography>
            <List size="sm" sx={{ gap: 0.25 }}>
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <ListItem key={item.id}>
                    <ListItemButton
                      selected={isActive}
                      onClick={() => onSelect(item.id)}
                      sx={{
                        borderRadius: 'sm',
                        '&.Mui-selected': {
                          bgcolor: 'primary.softBg',
                          color: 'primary.700',
                        },
                      }}
                    >
                      <ListItemDecorator sx={{ color: isActive ? 'primary.500' : 'text.tertiary' }}>
                        <Icon size={16} />
                      </ListItemDecorator>
                      <ListItemContent>
                        <Typography level="body-sm" fontWeight={isActive ? 600 : 400}>{item.label}</Typography>
                      </ListItemContent>
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Back to Companies */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <ListItemButton
          onClick={() => router.push('/companies')}
          sx={{ borderRadius: 'sm' }}
        >
          <ListItemDecorator>
            <ArrowLeft size={18} />
          </ListItemDecorator>
          <ListItemContent>
            <Typography level="body-sm">Back to Companies</Typography>
          </ListItemContent>
        </ListItemButton>
      </Box>
    </Sheet>
  );
}
