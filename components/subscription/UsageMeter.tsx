'use client';
import { useState } from 'react';
import { Box, LinearProgress, Typography, Stack, Divider } from '@mui/joy';
import { ChevronDown } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface UsageMeterProps {
  compact?: boolean;
}

export default function UsageMeter({ compact = false }: UsageMeterProps) {
  const { usage, plan, sessionPercentUsed, sessionRemaining, sessionTimeLeft, weeklyPercentUsed, weeklyRemaining, loading } = useSubscription();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (loading || !usage) return null;

  const color = sessionPercentUsed > 80 ? 'danger' : sessionPercentUsed > 50 ? 'warning' : 'primary';
  const weeklyColor = weeklyPercentUsed > 80 ? 'danger' : weeklyPercentUsed > 50 ? 'warning' : 'primary';

  if (compact) {
    return (
      <Box sx={{ position: 'relative' }}>
        {/* Clickable bar */}
        <Box
          onClick={() => setDropdownOpen(prev => !prev)}
          sx={{
            cursor: 'pointer',
            borderRadius: '6px',
            p: 0.5,
            mx: -0.5,
            transition: 'background 0.15s ease',
            '&:hover': { bgcolor: 'background.level1' },
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', fontWeight: 600, fontSize: '11px' }}>
              Session Usage
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography level="body-xs" sx={{ color: 'text.secondary', fontSize: '11px', fontWeight: 500 }}>
                {sessionRemaining} left
              </Typography>
              <ChevronDown
                size={12}
                style={{
                  color: 'var(--joy-palette-text-tertiary)',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </Stack>
          </Stack>
          <LinearProgress
            determinate
            value={Math.min(100, sessionPercentUsed)}
            color={color}
            sx={{ height: 4, borderRadius: 2, bgcolor: 'neutral.200' }}
          />
        </Box>

        {/* Dropdown Details */}
        {dropdownOpen && (
          <Box
            sx={{
              position: 'absolute',
              bottom: '100%',
              left: -8,
              right: -8,
              mb: 0.5,
              bgcolor: 'background.surface',
              border: '1px solid',
              borderColor: 'neutral.300',
              borderRadius: 'md',
              boxShadow: 'lg',
              p: 1.5,
              zIndex: 10,
            }}
          >
            <Typography level="body-xs" fontWeight={700} sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.tertiary', fontSize: '10px' }}>
              Session Usage
            </Typography>

            <Stack spacing={0.75}>
              {/* Session Used / Total */}
              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Session</Typography>
                <Typography level="body-xs" fontWeight={600}>
                  {usage.sessionMessagesUsed} / {plan.sessionMessageLimit}
                </Typography>
              </Stack>

              {/* Session Remaining */}
              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Remaining</Typography>
                <Typography level="body-xs" fontWeight={600} sx={{ color: color === 'danger' ? 'danger.500' : color === 'warning' ? 'warning.600' : 'text.primary' }}>
                  {sessionRemaining}
                </Typography>
              </Stack>

              {/* Session Timer */}
              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Resets in</Typography>
                <Typography level="body-xs" fontWeight={600}>
                  {sessionTimeLeft || 'New session'}
                </Typography>
              </Stack>

              <Divider sx={{ my: 0.25 }} />

              {/* Weekly */}
              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>This Week</Typography>
                <Typography level="body-xs" fontWeight={600}>
                  {usage.weeklyMessagesUsed} / {plan.weeklyMessageLimit}
                </Typography>
              </Stack>

              {/* Weekly Remaining */}
              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Weekly Left</Typography>
                <Typography level="body-xs" fontWeight={600} sx={{ color: weeklyColor === 'danger' ? 'danger.500' : weeklyColor === 'warning' ? 'warning.600' : 'text.primary' }}>
                  {weeklyRemaining}
                </Typography>
              </Stack>

              {/* Bonus Messages */}
              {(usage.bonusMessages || 0) > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Bonus Messages</Typography>
                  <Typography level="body-xs" fontWeight={600} sx={{ color: 'success.600' }}>
                    +{usage.bonusMessages}
                  </Typography>
                </Stack>
              )}

              <Divider sx={{ my: 0.25 }} />

              {/* Plan */}
              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Plan</Typography>
                <Typography level="body-xs" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                  {plan.name}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        )}

        {/* Click-away overlay */}
        {dropdownOpen && (
          <Box
            onClick={() => setDropdownOpen(false)}
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9,
            }}
          />
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
        <Typography level="body-sm" fontWeight={600}>
          Session Usage
        </Typography>
        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
          {usage.sessionMessagesUsed} / {plan.sessionMessageLimit}
        </Typography>
      </Stack>
      <LinearProgress
        determinate
        value={Math.min(100, sessionPercentUsed)}
        color={color}
        sx={{ height: 8, borderRadius: 4, bgcolor: 'neutral.100' }}
      />
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
          {sessionRemaining} remaining · {sessionTimeLeft ? `resets in ${sessionTimeLeft}` : 'new session'}
        </Typography>
        {(usage.bonusMessages || 0) > 0 && (
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            +{usage.bonusMessages} bonus
          </Typography>
        )}
      </Stack>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75 }}>
        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
          Weekly: {usage.weeklyMessagesUsed} / {plan.weeklyMessageLimit}
        </Typography>
        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
          Resets Monday
        </Typography>
      </Stack>
    </Box>
  );
}
