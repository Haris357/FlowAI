'use client';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Divider,
} from '@mui/joy';
import { Settings, Server, Database, Shield, Globe, Code2, CreditCard, Mail, UserCog, ArrowRight } from 'lucide-react';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';
import { CHANGELOG } from '@/lib/changelog';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@mui/joy';

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
  const router = useRouter();
  const { can } = useAdminAuth();
  const latestVersion = CHANGELOG[0]?.version || '1.0.0';
  APP_INFO[0].value = `v${latestVersion}`;

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{
            width: 36, height: 36, borderRadius: 'md', bgcolor: 'neutral.softBg',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Settings size={16} style={{ color: 'var(--joy-palette-neutral-500)' }} />
          </Box>
          <Box>
            <Typography level="h3" fontWeight={700}>System</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              System information and configuration.
            </Typography>
          </Box>
        </Stack>

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
        <Card sx={{ ...adminCard as Record<string, unknown> }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 'md', bgcolor: 'danger.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Shield size={16} style={{ color: 'var(--joy-palette-danger-500)' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography level="title-md" fontWeight={700}>Admin Access</Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.25 }}>
                  Admin access is controlled via the <strong>Admin Users</strong> collection.
                  Each admin has a username, password (hashed with bcrypt), and a role that
                  governs which menus and actions they can access.
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ mt: 2 }}
            >
              <Card sx={{ ...liquidGlassSubtle as Record<string, unknown>, flex: 1, p: 2 }}>
                <Stack spacing={0.5}>
                  <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Authentication
                  </Typography>
                  <Typography level="body-sm" fontWeight={600}>JWT · username + password</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                    8-hour sessions, HS256 signed, bcrypt-hashed passwords
                  </Typography>
                </Stack>
              </Card>
              <Card sx={{ ...liquidGlassSubtle as Record<string, unknown>, flex: 1, p: 2 }}>
                <Stack spacing={0.5}>
                  <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Roles
                  </Typography>
                  <Typography level="body-sm" fontWeight={600}>4 roles · 35 permissions</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                    Super Admin, Admin, Editor, Viewer · with per-user overrides
                  </Typography>
                </Stack>
              </Card>
            </Stack>

            {can('admin_users:view') && (
              <Button
                fullWidth
                variant="soft"
                color="danger"
                startDecorator={<UserCog size={16} />}
                endDecorator={<ArrowRight size={14} />}
                onClick={() => router.push('/admin/admin-users')}
                sx={{ mt: 2, borderRadius: '10px', fontWeight: 600 }}
              >
                Manage admin users
              </Button>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
