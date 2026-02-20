'use client';
import { Box, Card, CardContent, Typography, Stack, Chip } from '@mui/joy';
import { Plus, Wrench, Bug } from 'lucide-react';
import { CHANGELOG } from '@/lib/changelog';

const TYPE_CONFIG: Record<string, { label: string; color: 'success' | 'primary' | 'warning'; icon: React.ElementType }> = {
  feature: { label: 'New', color: 'success', icon: Plus },
  improvement: { label: 'Improved', color: 'primary', icon: Wrench },
  fix: { label: 'Fix', color: 'warning', icon: Bug },
};

export default function WhatsNewSection() {
  return (
    <Stack spacing={2}>
      {CHANGELOG.map((entry, i) => (
        <Card key={entry.version} variant="outlined"
          sx={{ borderLeft: i === 0 ? '3px solid' : undefined, borderLeftColor: i === 0 ? 'success.400' : undefined }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              <Chip size="sm" variant="soft" color="primary" sx={{ fontWeight: 700 }}>v{entry.version}</Chip>
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{entry.date}</Typography>
              {i === 0 && <Chip size="sm" variant="solid" color="success" sx={{ fontSize: '10px' }}>Latest</Chip>}
            </Stack>

            <Typography level="title-md" fontWeight={700} sx={{ mb: 0.5 }}>{entry.title}</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 2 }}>{entry.description}</Typography>

            <Stack spacing={1}>
              {entry.changes.map((change, j) => {
                const config = TYPE_CONFIG[change.type];
                return (
                  <Stack key={j} direction="row" spacing={1.5} alignItems="flex-start">
                    <Chip size="sm" variant="soft" color={config.color}
                      sx={{ fontSize: '10px', minWidth: 70, justifyContent: 'center', flexShrink: 0 }}>
                      {config.label}
                    </Chip>
                    <Typography level="body-sm">{change.text}</Typography>
                  </Stack>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
