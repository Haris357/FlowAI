'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, FormControl, FormLabel, Select, Option,
  Button, Card, CardContent, Skeleton,
} from '@mui/joy';
import { Save, Sun, Moon, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getUserSettings, updateUserSettings } from '@/services/userSettings';
import type { UserSettings } from '@/services/userSettings';

export default function PreferencesSection() {
  const { user } = useAuth();
  const { mode, toggleMode } = useTheme();
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
      toast.success('Preferences saved');
      if (settings.theme !== mode && settings.theme !== 'system') toggleMode();
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            {[1, 2, 3].map(i => (
              <Box key={i}>
                <Skeleton variant="text" width={100} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 'sm' }} />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <FormControl>
              <FormLabel>Theme</FormLabel>
              <Select value={settings.theme} onChange={(_, value) => setSettings({ ...settings, theme: value as any })}>
                <Option value="light">
                  <Stack direction="row" spacing={1} alignItems="center"><Sun size={16} /> <span>Light</span></Stack>
                </Option>
                <Option value="dark">
                  <Stack direction="row" spacing={1} alignItems="center"><Moon size={16} /> <span>Dark</span></Stack>
                </Option>
                <Option value="system">
                  <Stack direction="row" spacing={1} alignItems="center"><Monitor size={16} /> <span>System Default</span></Stack>
                </Option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Date Format</FormLabel>
              <Select value={settings.dateFormat} onChange={(_, value) => setSettings({ ...settings, dateFormat: value as any })}>
                <Option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</Option>
                <Option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</Option>
                <Option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</Option>
              </Select>
            </FormControl>
          </Stack>
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
