'use client';
import { useState, useEffect } from 'react';
import { Box, Typography, Stack, Switch, Button, Card, CardContent, Divider, Skeleton } from '@mui/joy';
import { Save, Bell, BarChart3, Newspaper } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSettings, updateUserSettings } from '@/services/userSettings';
import type { UserSettings } from '@/services/userSettings';

const TOGGLES: { key: keyof UserSettings; title: string; desc: string; icon: React.ElementType }[] = [
  { key: 'notifyEmail', title: 'Email Notifications', desc: 'Master switch for all email notifications', icon: Bell },
  { key: 'notifyWeekly', title: 'Flowbooks Newsletter', desc: 'Tips, product updates, and accounting insights — sent twice a week', icon: BarChart3 },
  { key: 'notifyBlogs', title: 'New Blog Posts', desc: 'Email me when a new blog post is published', icon: Newspaper },
];

export default function NotificationsSection() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'system', dateFormat: 'MM/DD/YYYY',
    notifyEmail: true, notifyWeekly: true, notifyBlogs: true,
  });

  useEffect(() => {
    if (!user) return;
    getUserSettings(user.uid)
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserSettings(user.uid, settings);
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 0 }}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i}>
              {i > 1 && <Divider />}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                  <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 'md' }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="35%" />
                    <Skeleton variant="text" width="60%" sx={{ mt: 0.5 }} />
                  </Box>
                </Stack>
                <Skeleton variant="rectangular" width={44} height={24} sx={{ borderRadius: 12 }} />
              </Stack>
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent sx={{ p: 0 }}>
          {TOGGLES.map((t, i) => {
            const Icon = t.icon;
            const isDisabled = t.key !== 'notifyEmail' && !settings.notifyEmail;
            return (
              <Box key={t.key}>
                {i > 0 && <Divider />}
                <Stack
                  direction="row" justifyContent="space-between" alignItems="center"
                  sx={{ px: 3, py: 2, opacity: isDisabled ? 0.5 : 1 }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                    </Box>
                    <Box>
                      <Typography level="body-sm" fontWeight={600}>{t.title}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{t.desc}</Typography>
                    </Box>
                  </Stack>
                  <Switch
                    checked={settings[t.key] as boolean}
                    onChange={(e) => setSettings({ ...settings, [t.key]: e.target.checked })}
                    disabled={isDisabled}
                  />
                </Stack>
              </Box>
            );
          })}
        </CardContent>
      </Card>
      <Box>
        <Button startDecorator={<Save size={16} />} onClick={handleSave} loading={saving}>
          Save Preferences
        </Button>
      </Box>
    </Stack>
  );
}
