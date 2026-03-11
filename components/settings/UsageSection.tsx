'use client';
import { Box, Card, CardContent, Typography, Stack, Chip } from '@mui/joy';
import { Zap, Cpu } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import UsageMeter from '@/components/subscription/UsageMeter';

export default function UsageSection() {
  const { plan } = useSubscription();

  return (
    <Stack spacing={3}>
      {/* Usage Meter */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Typography level="title-md" fontWeight={700}>Session Usage</Typography>
          </Stack>
          <UsageMeter />
        </CardContent>
      </Card>

      {/* AI Tier */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 'md', bgcolor: 'neutral.softBg',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Cpu size={16} style={{ color: 'var(--joy-palette-neutral-500)' }} />
            </Box>
            <Typography level="title-md" fontWeight={700}>AI Capabilities</Typography>
          </Stack>
          <Chip size="sm" variant="soft" color="primary">
            {plan.allowedModels.length === 1 ? 'Basic AI' : plan.allowedModels.length <= 2 ? 'Fast AI' : 'Fast + Advanced AI'}
          </Chip>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 1.5 }}>
            Upgrade your plan to unlock more powerful AI capabilities.
          </Typography>
        </CardContent>
      </Card>

    </Stack>
  );
}
