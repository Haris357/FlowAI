'use client';
import { useState } from 'react';
import { Box, Typography, Stack, Divider, Chip, Tooltip } from '@mui/joy';
import { ChevronDown, Clock, Zap, CalendarDays } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface UsageMeterProps {
  compact?: boolean;
  collapsed?: boolean;
}

/** Terracotta-colored progress bar matching the app's brand */
function ProgressBar({ value, height = 5 }: { value: number; height?: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#D97757';
  return (
    <Box sx={{ height, borderRadius: height / 2, bgcolor: 'neutral.200', overflow: 'hidden' }}>
      <Box sx={{ height: '100%', width: `${pct}%`, borderRadius: height / 2, bgcolor: color, transition: 'width 0.3s ease' }} />
    </Box>
  );
}

export default function UsageMeter({ compact = false, collapsed = false }: UsageMeterProps) {
  const { usage, plan, sessionPercentUsed, sessionRemaining, sessionTimeLeft, weeklyPercentUsed, weeklyRemaining, loading, isPaidSubscriber, isTrial, isTrialExpired: trialExpired, trialTimeLeft } = useSubscription();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (loading) return null;

  // Trial expired
  if (!isPaidSubscriber && trialExpired) {
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

  // Trial active but no usage yet
  if (!isPaidSubscriber && isTrial && !usage) {
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

  if (!usage) {
    // Collapsed state with no usage — show empty bars
    if (collapsed) {
      return (
        <Tooltip title="No usage yet" placement="right">
          <Stack spacing={0.75} alignItems="center" sx={{ py: 0.5 }}>
            <Zap size={14} style={{ color: 'var(--joy-palette-text-tertiary)' }} />
            <ProgressBar value={0} height={3} />
            <ProgressBar value={0} height={3} />
          </Stack>
        </Tooltip>
      );
    }
    return null;
  }

  const sessionPct = Math.min(100, sessionPercentUsed);
  const weeklyPct = Math.min(100, weeklyPercentUsed);

  // Collapsed sidebar — just two thin progress bars with a tooltip
  if (collapsed) {
    return (
      <Tooltip
        title={`Session: ${Math.round(sessionPct)}% | Weekly: ${Math.round(weeklyPct)}%`}
        placement="right"
      >
        <Stack spacing={0.75} alignItems="center" sx={{ py: 0.5 }}>
          <ProgressBar value={sessionPct} height={4} />
          <ProgressBar value={weeklyPct} height={4} />
        </Stack>
      </Tooltip>
    );
  }

  const pctColor = (pct: number) => pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#D97757';

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
          {/* Session bar */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.4 }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Zap size={10} style={{ color: 'var(--joy-palette-text-tertiary)' }} />
              <Typography level="body-xs" sx={{ color: 'text.tertiary', fontWeight: 600, fontSize: '10px' }}>
                Session
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography level="body-xs" sx={{ color: pctColor(sessionPct), fontSize: '10px', fontWeight: 600 }}>
                {Math.round(sessionPct)}%
              </Typography>
              <ChevronDown
                size={11}
                style={{
                  color: 'var(--joy-palette-text-tertiary)',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </Stack>
          </Stack>
          <ProgressBar value={sessionPct} height={6} />

          <Box sx={{ mb: 0.75 }} />

          {/* Weekly bar */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.4 }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CalendarDays size={10} style={{ color: 'var(--joy-palette-text-tertiary)' }} />
              <Typography level="body-xs" sx={{ color: 'text.tertiary', fontWeight: 600, fontSize: '10px' }}>
                Weekly
              </Typography>
            </Stack>
            <Typography level="body-xs" sx={{ color: pctColor(weeklyPct), fontSize: '10px', fontWeight: 600 }}>
              {Math.round(weeklyPct)}%
            </Typography>
          </Stack>
          <ProgressBar value={weeklyPct} height={6} />
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
              Usage Details
            </Typography>

            <Stack spacing={0.75}>
              {/* Session section */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Zap size={11} style={{ color: '#D97757' }} />
                  <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 600 }}>Session</Typography>
                </Stack>
                <Typography level="body-xs" fontWeight={600} sx={{ color: pctColor(sessionPct) }}>
                  {Math.round(sessionPct)}%
                </Typography>
              </Stack>
              <ProgressBar value={sessionPct} height={5} />
              <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px' }}>
                {sessionTimeLeft ? `Resets in ${sessionTimeLeft}` : 'New session'}
              </Typography>

              <Divider sx={{ my: 0.25 }} />

              {/* Weekly section */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <CalendarDays size={11} style={{ color: '#D97757' }} />
                  <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 600 }}>This Week</Typography>
                </Stack>
                <Typography level="body-xs" fontWeight={600} sx={{ color: pctColor(weeklyPct) }}>
                  {Math.round(weeklyPct)}%
                </Typography>
              </Stack>
              <ProgressBar value={weeklyPct} height={5} />
              <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px' }}>
                Resets Monday
              </Typography>

              {(usage.bonusTokens || 0) > 0 && (
                <>
                  <Divider sx={{ my: 0.25 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Bonus</Typography>
                    <Typography level="body-xs" fontWeight={600} sx={{ color: 'success.600' }}>
                      Active
                    </Typography>
                  </Stack>
                </>
              )}

              <Divider sx={{ my: 0.25 }} />

              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Plan</Typography>
                <Typography level="body-xs" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                  {isPaidSubscriber ? plan.name : isTrial ? `${plan.name} (Trial)` : plan.name}
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

  // Full size (non-compact)
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

      {/* Session bar */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Zap size={13} style={{ color: '#D97757' }} />
          <Typography level="body-sm" fontWeight={600}>Session</Typography>
        </Stack>
        <Typography level="body-xs" fontWeight={600} sx={{ color: pctColor(sessionPct) }}>
          {Math.round(sessionPct)}%
        </Typography>
      </Stack>
      <ProgressBar value={sessionPct} height={6} />
      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.4, fontSize: '10px' }}>
        {sessionTimeLeft ? `Resets in ${sessionTimeLeft}` : 'New session'}
      </Typography>

      {/* Weekly bar */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.25, mb: 0.5 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <CalendarDays size={13} style={{ color: '#D97757' }} />
          <Typography level="body-sm" fontWeight={600}>Weekly</Typography>
        </Stack>
        <Typography level="body-xs" fontWeight={600} sx={{ color: pctColor(weeklyPct) }}>
          {Math.round(weeklyPct)}%
        </Typography>
      </Stack>
      <ProgressBar value={weeklyPct} height={6} />
      <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.4, fontSize: '10px' }}>
        Resets Monday
      </Typography>
    </Box>
  );
}
