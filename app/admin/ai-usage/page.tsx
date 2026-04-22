'use client';

import {
  Box, Typography, Stack, Card, CardContent, Chip, Divider,
  Sheet, Table,
} from '@mui/joy';
import { Zap, Cpu, Package, Clock, TrendingUp, Database } from 'lucide-react';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';
import { PLANS, formatMessages } from '@/lib/plans';

const PLAN_COLORS: Record<string, 'neutral' | 'primary' | 'success'> = {
  free: 'neutral', pro: 'primary', max: 'success',
};

const ALL_MODELS = ['gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4o-mini', 'gpt-4o'];

export default function AdminAIUsagePage() {
  const totalPlans = Object.keys(PLANS).length;
  const maxSessionTokens = Math.max(...Object.values(PLANS).map(p => p.sessionTokenLimit));
  const maxWeeklyTokens = Math.max(...Object.values(PLANS).map(p => p.weeklyTokenLimit));
  const uniqueModels = new Set(Object.values(PLANS).flatMap(p => p.allowedModels)).size;

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{
            width: 36, height: 36, borderRadius: 'md', bgcolor: 'warning.softBg',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Zap size={16} style={{ color: 'var(--joy-palette-warning-500)' }} />
          </Box>
          <Box>
            <Typography level="h3" fontWeight={700}>AI Usage</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              Token allocation, session limits, and AI model availability per plan.
            </Typography>
          </Box>
        </Stack>

        {/* Stat row */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <StatTile
            icon={Package} color="primary"
            label="Plans" value={totalPlans}
            sub="Active subscription plans"
          />
          <StatTile
            icon={Zap} color="warning"
            label="Max session" value={formatMessages(maxSessionTokens)}
            sub="Tokens per session (top plan)"
          />
          <StatTile
            icon={TrendingUp} color="success"
            label="Max weekly" value={formatMessages(maxWeeklyTokens)}
            sub="Tokens per week (top plan)"
          />
          <StatTile
            icon={Cpu} color="neutral"
            label="AI Models" value={uniqueModels}
            sub="Available across all plans"
          />
        </Stack>

        {/* Plan allocation cards */}
        <Card sx={{ ...adminCard as Record<string, unknown> }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: 'md', bgcolor: 'warning.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Zap size={14} style={{ color: 'var(--joy-palette-warning-500)' }} />
              </Box>
              <Typography level="title-md" fontWeight={700}>Plan allocations</Typography>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              {Object.values(PLANS).map(plan => {
                const color = PLAN_COLORS[plan.id] || 'neutral';
                return (
                  <Card key={plan.id} sx={{
                    ...liquidGlassSubtle as Record<string, unknown>,
                    flex: 1, p: 0, overflow: 'hidden',
                    borderLeft: '3px solid',
                    borderLeftColor: `${color}.400`,
                  }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                        <Box>
                          <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>
                            {plan.id === 'free' ? 'Free tier' : 'Paid plan'}
                          </Typography>
                          <Typography level="title-md" fontWeight={700}>{plan.name}</Typography>
                        </Box>
                        <Chip size="sm" variant="soft" color={color}>
                          ${plan.price}{plan.id !== 'free' ? '/mo' : ''}
                        </Chip>
                      </Stack>

                      <Stack spacing={1.5}>
                        <Box>
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
                            <Clock size={11} style={{ color: 'var(--joy-palette-text-tertiary)' }} />
                            <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Session
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="baseline" spacing={0.75}>
                            <Typography level="h4" fontWeight={800}>{formatMessages(plan.sessionTokenLimit)}</Typography>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                              tokens / {plan.sessionDurationHours}h
                            </Typography>
                          </Stack>
                        </Box>

                        <Divider />

                        <Box>
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
                            <TrendingUp size={11} style={{ color: 'var(--joy-palette-text-tertiary)' }} />
                            <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Weekly
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="baseline" spacing={0.75}>
                            <Typography level="h4" fontWeight={800}>{formatMessages(plan.weeklyTokenLimit)}</Typography>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                              tokens
                            </Typography>
                          </Stack>
                        </Box>

                        <Divider />

                        <Box>
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                            <Cpu size={11} style={{ color: 'var(--joy-palette-text-tertiary)' }} />
                            <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Models ({plan.allowedModels.length})
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {plan.allowedModels.map(model => (
                              <Chip
                                key={model} size="sm" variant="soft" color={color}
                                sx={{ fontSize: '0.65rem', '--Chip-minHeight': '20px' }}
                              >
                                {model}
                              </Chip>
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </CardContent>
        </Card>

        {/* Models availability matrix */}
        <Card sx={{ ...adminCard as Record<string, unknown>, p: 0, overflow: 'hidden' }}>
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{
                width: 32, height: 32, borderRadius: 'md', bgcolor: 'primary.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Cpu size={14} style={{ color: 'var(--joy-palette-primary-500)' }} />
              </Box>
              <Box>
                <Typography level="title-md" fontWeight={700}>Model availability</Typography>
                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                  Which AI models are available on each plan.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Sheet sx={{ overflow: 'auto' }}>
            <Table hoverRow sx={{
              '& thead th': {
                py: 1.25, fontSize: '0.7rem', fontWeight: 700,
                color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em',
                bgcolor: 'background.surface',
              },
              '& tbody td': { py: 1.75, verticalAlign: 'middle' },
              minWidth: 600,
            }}>
              <thead>
                <tr>
                  <th>Model</th>
                  {Object.values(PLANS).map(p => (
                    <th key={p.id} style={{ textAlign: 'center', width: '7rem' }}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_MODELS.map(model => (
                  <tr key={model}>
                    <td>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Box sx={{
                          width: 28, height: 28, borderRadius: '8px',
                          bgcolor: 'neutral.softBg',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Cpu size={12} style={{ color: 'var(--joy-palette-neutral-500)' }} />
                        </Box>
                        <Typography level="body-sm" fontWeight={600}>{model}</Typography>
                      </Stack>
                    </td>
                    {Object.values(PLANS).map(p => (
                      <td key={p.id} style={{ textAlign: 'center' }}>
                        {p.allowedModels.includes(model) ? (
                          <Box sx={{
                            display: 'inline-flex', width: 22, height: 22, borderRadius: '50%',
                            bgcolor: `${PLAN_COLORS[p.id] || 'neutral'}.softBg`,
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Typography sx={{
                              fontSize: '12px', lineHeight: 1,
                              color: `var(--joy-palette-${PLAN_COLORS[p.id] || 'neutral'}-600)`,
                            }}>
                              ✓
                            </Typography>
                          </Box>
                        ) : (
                          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>—</Typography>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Sheet>
        </Card>

        {/* Info card */}
        <Card sx={{ ...liquidGlassSubtle as Record<string, unknown> }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box sx={{
                width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                bgcolor: 'primary.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Database size={14} style={{ color: 'var(--joy-palette-primary-500)' }} />
              </Box>
              <Box>
                <Typography level="body-sm" fontWeight={700} sx={{ mb: 0.5 }}>
                  Tokens vs. messages
                </Typography>
                <Typography level="body-xs" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                  Limits are measured in <strong>tokens</strong> (roughly 4 characters each). A typical
                  short user message uses ~50–200 tokens; an AI response can use 500–2000+ tokens.
                  Session limits reset after the configured duration; weekly limits reset every Monday.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

// ============================================================
// Stat tile
// ============================================================

function StatTile({
  icon: Icon, color, label, value, sub,
}: {
  icon: React.ElementType;
  color: 'primary' | 'warning' | 'success' | 'neutral';
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <Card sx={{
      ...adminCard as Record<string, unknown>,
      flex: 1, minWidth: 0,
      borderLeft: '3px solid',
      borderLeftColor: `${color}.400`,
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography level="body-xs" sx={{
              color: 'text.tertiary', textTransform: 'uppercase',
              fontWeight: 700, letterSpacing: '0.05em', mb: 0.5,
            }}>
              {label}
            </Typography>
            <Typography level="h3" fontWeight={700}>{value}</Typography>
            <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {sub}
            </Typography>
          </Box>
          <Box sx={{
            width: 40, height: 40, borderRadius: 'md',
            bgcolor: `${color}.softBg`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={20} style={{ color: `var(--joy-palette-${color}-500)` }} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
