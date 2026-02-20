'use client';
import { Box, Card, CardContent, Typography, Stack, Divider } from '@mui/joy';
import { Info, Heart, Code2, Database, Cpu, Globe } from 'lucide-react';
import { CHANGELOG } from '@/lib/changelog';

const INFO_ITEMS: { label: string; value: string; icon: React.ElementType; color: string }[] = [
  { label: 'Version', value: '', icon: Info, color: 'primary' },
  { label: 'Platform', value: 'Web Application', icon: Globe, color: 'success' },
  { label: 'Framework', value: 'Next.js + React', icon: Code2, color: 'warning' },
  { label: 'Database', value: 'Firebase Firestore', icon: Database, color: 'danger' },
  { label: 'AI Engine', value: 'OpenAI GPT Models', icon: Cpu, color: 'primary' },
];

export default function AboutSection() {
  const latestVersion = CHANGELOG[0]?.version || '1.0.0';
  INFO_ITEMS[0].value = `v${latestVersion}`;

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent sx={{ p: 0 }}>
          {INFO_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <Box key={item.label}>
                {i > 0 && <Divider />}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{
                      width: 32, height: 32, borderRadius: 'md', bgcolor: `${item.color}.softBg`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={14} style={{ color: `var(--joy-palette-${item.color}-500)` }} />
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

      <Card variant="soft" sx={{ bgcolor: 'primary.softBg' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{
              width: 40, height: 40, borderRadius: 'md', bgcolor: 'background.surface',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Heart size={18} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Box>
              <Typography level="body-sm" fontWeight={600} sx={{ color: 'primary.700' }}>Built with care</Typography>
              <Typography level="body-xs" sx={{ color: 'primary.600' }}>
                Flowbooks is designed to make accounting simple and intelligent for small businesses.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center' }}>
        &copy; {new Date().getFullYear()} Flowbooks. All rights reserved.
      </Typography>
    </Stack>
  );
}
