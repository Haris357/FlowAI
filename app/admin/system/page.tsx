'use client';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Divider,
} from '@mui/joy';
import { Settings, Server, Database, Shield, Globe, Code2, CreditCard, Mail } from 'lucide-react';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';
import { CHANGELOG } from '@/lib/changelog';
import { ADMIN_EMAILS } from '@/lib/admin';

const APP_INFO = [
  { label: 'Version', value: '', icon: Code2 },
  { label: 'Framework', value: 'Next.js 14 (App Router)', icon: Globe },
  { label: 'UI Library', value: 'MUI Joy UI', icon: Code2 },
  { label: 'Runtime', value: 'Node.js', icon: Server },
];

const SERVICE_INFO = [
  { label: 'Database', value: 'Firebase Firestore', icon: Database },
  { label: 'Authentication', value: 'Firebase Auth', icon: Shield },
  { label: 'Storage', value: 'Firebase Storage', icon: Database },
  { label: 'Payments', value: 'Lemon Squeezy', icon: CreditCard },
  { label: 'AI Provider', value: 'OpenAI (GPT-4 family)', icon: Server },
  { label: 'Email', value: 'Resend', icon: Mail },
];

export default function AdminSystemPage() {
  const latestVersion = CHANGELOG[0]?.version || '1.0.0';
  APP_INFO[0].value = `v${latestVersion}`;

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={3}>
        <Box>
          <Typography level="h3" fontWeight={700}>System</Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            System information and configuration.
          </Typography>
        </Box>

        {/* Application Info */}
        <Card sx={{ ...adminCard as Record<string, unknown> }}>
          <CardContent sx={{ p: 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 3, pt: 2.5, pb: 2 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Server size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
              </Box>
              <Typography level="title-md" fontWeight={700}>Application</Typography>
            </Stack>
            <Divider />
            {APP_INFO.map((item, i) => {
              const Icon = item.icon;
              return (
                <Box key={item.label}>
                  {i > 0 && <Divider />}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 1.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{
                        width: 28, height: 28, borderRadius: 'md', bgcolor: 'neutral.softBg',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon size={12} style={{ color: 'var(--joy-palette-neutral-500)' }} />
                      </Box>
                      <Typography level="body-sm" fontWeight={600}>{item.label}</Typography>
                    </Stack>
                    <Typography level="body-sm" sx={{ color: 'text.secondary' }}>{item.value}</Typography>
                  </Stack>
                </Box>
              );
            })}
          </CardContent>
        </Card>

        {/* Services */}
        <Card sx={{ ...adminCard as Record<string, unknown> }}>
          <CardContent sx={{ p: 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 3, pt: 2.5, pb: 2 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 'md', bgcolor: 'success.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Database size={16} style={{ color: 'var(--joy-palette-success-500)' }} />
              </Box>
              <Typography level="title-md" fontWeight={700}>Services</Typography>
            </Stack>
            <Divider />
            {SERVICE_INFO.map((item, i) => {
              const Icon = item.icon;
              return (
                <Box key={item.label}>
                  {i > 0 && <Divider />}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 1.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{
                        width: 28, height: 28, borderRadius: 'md', bgcolor: 'neutral.softBg',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon size={12} style={{ color: 'var(--joy-palette-neutral-500)' }} />
                      </Box>
                      <Typography level="body-sm" fontWeight={600}>{item.label}</Typography>
                    </Stack>
                    <Typography level="body-sm" sx={{ color: 'text.secondary' }}>{item.value}</Typography>
                  </Stack>
                </Box>
              );
            })}
          </CardContent>
        </Card>

        {/* Admin Access */}
        <Card sx={{ ...adminCard as Record<string, unknown>, borderColor: 'danger.200' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 'md', bgcolor: 'danger.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Shield size={16} style={{ color: 'var(--joy-palette-danger-500)' }} />
              </Box>
              <Box>
                <Typography level="title-md" fontWeight={700}>Admin Access</Typography>
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                  Only these email addresses can access the admin panel.
                </Typography>
              </Box>
            </Stack>
            <Stack spacing={1}>
              {ADMIN_EMAILS.map(email => (
                <Card key={email} sx={{ ...liquidGlassSubtle as Record<string, unknown>, p: 0 }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{
                        width: 28, height: 28, borderRadius: '50%', bgcolor: 'danger.softBg',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Mail size={12} style={{ color: 'var(--joy-palette-danger-500)' }} />
                      </Box>
                      <Typography level="body-sm" fontWeight={500}>{email}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 2 }}>
              To add or remove admins, edit <code>lib/admin.ts</code>.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
