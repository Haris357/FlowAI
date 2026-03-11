'use client';

import { useState, useEffect } from 'react';
import {
  Modal, ModalDialog, ModalClose, Box, Typography, Stack,
  List, ListItem, ListItemButton, ListItemDecorator, ListItemContent,
  IconButton, Divider,
} from '@mui/joy';
import {
  User, Settings, Bell, Shield, CreditCard, Zap,
  FileText, GraduationCap, HelpCircle, MessageSquare, Sparkles, Info,
  ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import ProfileSection from './ProfileSection';
import PreferencesSection from './PreferencesSection';
import NotificationsSection from './NotificationsSection';
import SecuritySection from './SecuritySection';
import SubscriptionSection from './SubscriptionSection';
import UsageSection from './UsageSection';
import DocsSection from './DocsSection';
import TutorialsSection from './TutorialsSection';
import SupportSection from './SupportSection';
import FeedbackSection from './FeedbackSection';
import WhatsNewSection from './WhatsNewSection';
import AboutSection from './AboutSection';

type SettingsSection =
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

const SECTION_META: Record<SettingsSection, { label: string; description: string }> = {
  profile: { label: 'Profile', description: 'Manage your personal information and profile photo.' },
  preferences: { label: 'Preferences', description: 'Customize how Flowbooks looks and formats data.' },
  notifications: { label: 'Notifications', description: 'Control which email notifications you receive.' },
  security: { label: 'Security', description: 'Manage your password and account security.' },
  subscription: { label: 'Subscription', description: 'Manage your plan, billing, and payment history.' },
  usage: { label: 'Usage & AI', description: 'Monitor your AI usage and session limits.' },
  docs: { label: 'Documentation', description: 'Learn how to use every feature of Flowbooks.' },
  tutorials: { label: 'Tutorials', description: 'Step-by-step guides to help you get started.' },
  support: { label: 'Support', description: 'Submit a ticket and get help from our team.' },
  feedback: { label: 'Feedback', description: 'Share your thoughts and help us improve Flowbooks.' },
  'whats-new': { label: "What's New", description: 'Latest updates, features, and improvements.' },
  about: { label: 'About', description: 'Application information and version details.' },
};

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  initialSection?: SettingsSection;
}

export default function SettingsModal({ open, onClose, initialSection = 'profile' }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);

  useEffect(() => {
    if (open) setActiveSection(initialSection);
  }, [open, initialSection]);
  const { mode } = useTheme();

  const section = SECTION_META[activeSection];

  const handleSelect = (id: SettingsSection) => {
    setActiveSection(id);
    setMobileNavVisible(false);
  };

  const isLight = mode === 'light';

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        layout="fullscreen"
        sx={{
          p: 0,
          maxWidth: 960,
          maxHeight: '92vh',
          width: '95vw',
          borderRadius: '24px',
          overflow: 'hidden',
          mx: 'auto',
          my: 'auto',
          display: 'flex',
          flexDirection: 'column',
          '--ModalDialog-minWidth': 'unset',
          layout: 'center',
          background: isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(26, 25, 21, 0.8)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid',
          borderColor: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.08)',
          boxShadow: isLight
            ? '0 24px 80px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)'
            : '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Top bar */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: '1px solid',
            borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexShrink: 0,
            background: isLight ? 'rgba(217,119,87,0.03)' : 'rgba(217,119,87,0.04)',
          }}
        >
          {/* Mobile nav toggle */}
          <IconButton
            variant="plain"
            size="sm"
            onClick={() => setMobileNavVisible(!mobileNavVisible)}
            sx={{ display: { xs: 'flex', sm: 'none' }, borderRadius: '10px' }}
          >
            {mobileNavVisible ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </IconButton>
          <Box sx={{
            width: 36, height: 36, borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(217,119,87,0.3)',
            flexShrink: 0,
          }}>
            <Settings size={18} style={{ color: '#fff' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography level="title-md" fontWeight={700}>
              Settings
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', display: { xs: 'none', sm: 'block' } }}>
              Manage your account, preferences, and get help
            </Typography>
          </Box>
          <IconButton
            variant="plain"
            size="sm"
            onClick={onClose}
            sx={{
              borderRadius: '50%',
              width: 32,
              height: 32,
              background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
              '&:hover': {
                background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
              },
            }}
          >
            <X size={16} />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Sidebar nav */}
          <Box
            sx={{
              width: 230,
              flexShrink: 0,
              borderRight: '1px solid',
              borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
              overflow: 'auto',
              py: 2,
              px: 1.25,
              display: { xs: mobileNavVisible ? 'block' : 'none', sm: 'block' },
              position: { xs: 'absolute', sm: 'static' },
              top: { xs: 60, sm: 'unset' },
              left: 0,
              bottom: 0,
              zIndex: 10,
              background: isLight ? 'rgba(245,243,240,0.5)' : 'rgba(20,19,16,0.3)',
            }}
          >
            {NAV_GROUPS.map(group => (
              <Box key={group.label} sx={{ mb: 2 }}>
                <Typography
                  level="body-xs"
                  sx={{
                    color: 'text.tertiary',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    px: 1.25,
                    mb: 0.5,
                    fontSize: '10px',
                  }}
                >
                  {group.label}
                </Typography>
                <List size="sm" sx={{ gap: 0.25, '--ListItem-paddingY': '2px' }}>
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <ListItem key={item.id}>
                        <ListItemButton
                          selected={isActive}
                          onClick={() => handleSelect(item.id)}
                          sx={{
                            borderRadius: '12px',
                            py: 0.85,
                            px: 1.25,
                            transition: 'all 0.2s ease',
                            '&.Mui-selected': {
                              background: isLight
                                ? 'linear-gradient(135deg, rgba(217,119,87,0.1) 0%, rgba(217,119,87,0.06) 100%)'
                                : 'linear-gradient(135deg, rgba(217,119,87,0.15) 0%, rgba(217,119,87,0.08) 100%)',
                              color: isLight ? 'primary.700' : 'primary.300',
                              boxShadow: isLight
                                ? '0 2px 8px rgba(217,119,87,0.1)'
                                : '0 2px 8px rgba(217,119,87,0.08)',
                              '&:hover': {
                                background: isLight
                                  ? 'linear-gradient(135deg, rgba(217,119,87,0.14) 0%, rgba(217,119,87,0.08) 100%)'
                                  : 'linear-gradient(135deg, rgba(217,119,87,0.2) 0%, rgba(217,119,87,0.12) 100%)',
                              },
                            },
                            '&:hover': {
                              background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                            },
                          }}
                        >
                          <ListItemDecorator sx={{ color: isActive ? 'primary.500' : 'text.tertiary', minInlineSize: 28 }}>
                            <Icon size={16} />
                          </ListItemDecorator>
                          <ListItemContent>
                            <Typography level="body-sm" fontWeight={isActive ? 600 : 400} sx={{ fontSize: '13px' }}>
                              {item.label}
                            </Typography>
                          </ListItemContent>
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            ))}
          </Box>

          {/* Content area */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: { xs: 2, sm: 3 },
              display: { xs: mobileNavVisible ? 'none' : 'block', sm: 'block' },
            }}
          >
            {/* Section header */}
            <Box sx={{ mb: 3 }}>
              <Typography level="title-lg" fontWeight={700} sx={{ mb: 0.5, fontSize: '1.25rem' }}>
                {section.label}
              </Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                {section.description}
              </Typography>
            </Box>
            <Divider sx={{
              mb: 3,
              borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
            }} />

            {/* Section content */}
            {activeSection === 'profile' && <ProfileSection />}
            {activeSection === 'preferences' && <PreferencesSection />}
            {activeSection === 'notifications' && <NotificationsSection />}
            {activeSection === 'security' && <SecuritySection />}
            {activeSection === 'subscription' && <SubscriptionSection />}
            {activeSection === 'usage' && <UsageSection />}
            {activeSection === 'docs' && <DocsSection />}
            {activeSection === 'tutorials' && <TutorialsSection />}
            {activeSection === 'support' && <SupportSection />}
            {activeSection === 'feedback' && <FeedbackSection />}
            {activeSection === 'whats-new' && <WhatsNewSection />}
            {activeSection === 'about' && <AboutSection />}
          </Box>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
