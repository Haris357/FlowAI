'use client';
import { useState } from 'react';
import { Box, LinearProgress, Typography, Stack, Divider, Chip } from '@mui/joy';
import { ChevronDown, Clock } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface UsageMeterProps {
  compact?: boolean;
}

export default function UsageMeter({ compact = false }: UsageMeterProps) {
  const { usage, plan, sessionPercentUsed, sessionRemaining, sessionTimeLeft, weeklyPercentUsed, weeklyRemaining, loading, isTrial, isTrialExpired: trialExpired, trialTimeLeft } = useSubscription();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (loading) return null;

  // Trial expired - show subscribe prompt
  if (trialExpired) {
    if (compact) {
      return (
        <Box sx={{ borderRadius: '6px', p: 1, bgcolor: 'danger.softBg', border: '1px solid', borderColor: 'danger.200' }}>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Clock size={12} style={{ color: 'var(--joy-palette-danger-500)' }} />
            <Typography level="body-xs" sx={{ color: 'danger.600', fontWeight: 700, fontSize: '11px' }}>
              Trial Expired
            </Typography>
          </Stack>
          <Typography level="body-xs" sx={{ color: 'danger.500', fontSize: '10px' }}>
            Subscribe to continue
          </Typography>
        </Box>
      );
    }
    return (
      <Box sx={{ p: 1.5, borderRadius: 'md', bgcolor: 'danger.softBg', border: '1px solid', borderColor: 'danger.200' }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          <Clock size={14} style={{ color: 'var(--joy-palette-danger-500)' }} />
          <Typography level="body-sm" fontWeight={700} sx={{ color: 'danger.600' }}>
            Trial Expired
          </Typography>
        </Stack>
        <Typography level="body-xs" sx={{ color: 'danger.500' }}>
          Your free trial has ended. Subscribe to continue using Flowbooks.
        </Typography>
      </Box>
    );
  }

  // Trial active but no usage yet - show trial timer
  if (isTrial && !usage) {
    if (compact) {
      return (
        <Box sx={{ borderRadius: '6px', p: 1, bgcolor: 'primary.softBg', border: '1px solid', borderColor: 'primary.200' }}>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Clock size={12} style={{ color: 'var(--joy-palette-primary-500)' }} />
            <Typography level="body-xs" sx={{ color: 'primary.600', fontWeight: 700, fontSize: '11px' }}>
              Pro Trial
            </Typography>
          </Stack>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px' }}>
            {trialTimeLeft ? `${trialTimeLeft} left` : 'Active'}
          </Typography>
        </Box>
      );
    }
    return (
      <Box sx={{ p: 1.5, borderRadius: 'md', bgcolor: 'primary.softBg', border: '1px solid', borderColor: 'primary.200' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Clock size={14} style={{ color: 'var(--joy-palette-primary-500)' }} />
          <Typography level="body-sm" fontWeight={700} sx={{ color: 'primary.600' }}>
            Pro Trial
          </Typography>
          <Chip size="sm" variant="soft" color="primary" sx={{ fontSize: '10px' }}>
            {trialTimeLeft ? `${trialTimeLeft} left` : 'Active'}
          </Chip>
        </Stack>
      </Box>
    );
  }

  if (!usage) return null;

  const color = sessionPercentUsed > 80 ? 'danger' : sessionPercentUsed > 50 ? 'warning' : 'primary';
  const weeklyColor = weeklyPercentUsed > 80 ? 'danger' : weeklyPercentUsed > 50 ? 'warning' : 'primary';

  if (compact) {
    return (
      <Box sx={{ position: 'relative' }}>
        {/* Trial badge */}
        {isTrial && trialTimeLeft && (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.75 }}>
            <Clock size={11} style={{ color: 'var(--joy-palette-primary-500)' }} />
            <Typography level="body-xs" sx={{ color: 'primary.600', fontWeight: 600, fontSize: '10px' }}>
              Trial: {trialTimeLeft} left
            </Typography>
          </Stack>
        )}

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
              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Session</Typography>
                <Typography level="body-xs" fontWeight={600}>
                  {usage.sessionMessagesUsed} / {plan.sessionMessageLimit}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Remaining</Typography>
                <Typography level="body-xs" fontWeight={600} sx={{ color: color === 'danger' ? 'danger.500' : color === 'warning' ? 'warning.600' : 'text.primary' }}>
                  {sessionRemaining}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Resets in</Typography>
                <Typography level="body-xs" fontWeight={600}>
                  {sessionTimeLeft || 'New session'}
                </Typography>
              </Stack>

              <Divider sx={{ my: 0.25 }} />

              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>This Week</Typography>
                <Typography level="body-xs" fontWeight={600}>
                  {usage.weeklyMessagesUsed} / {plan.weeklyMessageLimit}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Weekly Left</Typography>
                <Typography level="body-xs" fontWeight={600} sx={{ color: weeklyColor === 'danger' ? 'danger.500' : weeklyColor === 'warning' ? 'warning.600' : 'text.primary' }}>
                  {weeklyRemaining}
                </Typography>
              </Stack>

              {(usage.bonusMessages || 0) > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Bonus Messages</Typography>
                  <Typography level="body-xs" fontWeight={600} sx={{ color: 'success.600' }}>
                    +{usage.bonusMessages}
                  </Typography>
                </Stack>
              )}

              <Divider sx={{ my: 0.25 }} />

              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Plan</Typography>
                <Typography level="body-xs" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                  {isTrial ? `${plan.name} (Trial)` : plan.name}
                </Typography>
              </Stack>

              {isTrial && trialTimeLeft && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Trial ends in</Typography>
                  <Typography level="body-xs" fontWeight={600} sx={{ color: 'warning.600' }}>
                    {trialTimeLeft}
                  </Typography>
                </Stack>
              )}
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
      {isTrial && trialTimeLeft && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Clock size={14} style={{ color: 'var(--joy-palette-primary-500)' }} />
          <Typography level="body-xs" fontWeight={600} sx={{ color: 'primary.600' }}>
            Pro Trial - {trialTimeLeft} remaining
          </Typography>
        </Stack>
      )}

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
