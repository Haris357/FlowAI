'use client';
import { Box, Typography, Stack, Card, CardContent, Chip, Divider } from '@mui/joy';
import { Zap, Cpu, Package } from 'lucide-react';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';
import { PLANS, formatMessages } from '@/lib/plans';

const PLAN_COLORS: Record<string, string> = {
  free: 'neutral', pro: 'primary', max: 'success',
};

export default function AdminAIUsagePage() {
  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={3}>
        <Box>
          <Typography level="h3" fontWeight={700}>AI Usage</Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            AI message allocation and model information.
          </Typography>
        </Box>

        {/* Message Allocations */}
        <Card sx={{ ...adminCard as Record<string, unknown> }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 'md', bgcolor: 'warning.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Zap size={16} style={{ color: 'var(--joy-palette-warning-500)' }} />
              </Box>
              <Typography level="title-md" fontWeight={700}>Message Allocations by Plan</Typography>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {Object.values(PLANS).map(plan => (
                <Card key={plan.id} sx={{
                  ...liquidGlassSubtle as Record<string, unknown>,
                  flex: 1, p: 2.5,
                  borderLeft: '3px solid',
                  borderLeftColor: `${PLAN_COLORS[plan.id] || 'neutral'}.400`,
                }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: 'md', bgcolor: 'background.surface',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Package size={14} style={{ color: `var(--joy-palette-${PLAN_COLORS[plan.id] || 'neutral'}-500)` }} />
                    </Box>
                    <Typography level="title-sm" fontWeight={700}>{plan.name}</Typography>
                  </Stack>
                  <Typography level="h4" fontWeight={700}>{formatMessages(plan.sessionMessageLimit)}</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.secondary', mb: 0.5 }}>msgs/session ({plan.sessionDurationHours}h)</Typography>
                  <Typography level="body-sm" fontWeight={600} sx={{ color: 'text.secondary', mb: 1.5 }}>
                    {formatMessages(plan.weeklyMessageLimit)}/week
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {plan.allowedModels.map(model => (
                      <Chip key={model} size="sm" variant="soft" color="primary" sx={{ fontSize: '10px' }}>
                        {model}
                      </Chip>
                    ))}
                  </Stack>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Available Models */}
        <Card sx={{ ...adminCard as Record<string, unknown> }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Cpu size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
              </Box>
              <Typography level="title-md" fontWeight={700}>Available Models</Typography>
            </Stack>
            <Card sx={{ ...adminCard as Record<string, unknown>, overflow: 'hidden' }}>
              <CardContent sx={{ p: 0 }}>
                {['gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4o-mini', 'gpt-4o'].map((model, i) => (
                  <Box key={model}>
                    {i > 0 && <Divider />}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 1.5 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{
                          width: 28, height: 28, borderRadius: 'md', bgcolor: 'neutral.softBg',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Cpu size={12} style={{ color: 'var(--joy-palette-neutral-500)' }} />
                        </Box>
                        <Typography level="body-sm" fontWeight={600}>{model}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5}>
                        {Object.values(PLANS)
                          .filter(p => p.allowedModels.includes(model))
                          .map(p => (
                            <Chip key={p.id} size="sm" variant="outlined" sx={{ fontSize: '10px' }}>{p.name}</Chip>
                          ))}
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
