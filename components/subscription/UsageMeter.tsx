'use client';
import { useState } from 'react';
import { Box, LinearProgress, Typography, Stack, Divider } from '@mui/joy';
import { ChevronDown } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { formatTokens } from '@/lib/plans';

interface UsageMeterProps {
  compact?: boolean;
}

export default function UsageMeter({ compact = false }: UsageMeterProps) {
  const { usage, plan, tokenPercentUsed, tokensRemaining, loading } = useSubscription();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (loading || !usage) return null;

  const color = tokenPercentUsed > 80 ? 'danger' : tokenPercentUsed > 50 ? 'warning' : 'primary';

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
              Token Usage
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography level="body-xs" sx={{ color: 'text.secondary', fontSize: '11px', fontWeight: 500 }}>
                {formatTokens(tokensRemaining)} left
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
            value={Math.min(100, tokenPercentUsed)}
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
              Token Usage Details
            </Typography>

            <Stack spacing={0.75}>
              {/* Used / Total */}
              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Used</Typography>
                <Typography level="body-xs" fontWeight={600}>
                  {formatTokens(usage.tokensUsed)} / {formatTokens(plan.tokenAllocation)}
                </Typography>
              </Stack>

              {/* Remaining */}
              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Remaining</Typography>
                <Typography level="body-xs" fontWeight={600} sx={{ color: color === 'danger' ? 'danger.500' : color === 'warning' ? 'warning.600' : 'text.primary' }}>
                  {formatTokens(tokensRemaining)}
                </Typography>
              </Stack>

              {/* Bonus Tokens */}
              {(usage.bonusTokens || 0) > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Bonus Tokens</Typography>
                  <Typography level="body-xs" fontWeight={600} sx={{ color: 'success.600' }}>
                    +{formatTokens(usage.bonusTokens)}
                  </Typography>
                </Stack>
              )}

              <Divider sx={{ my: 0.25 }} />

              {/* Requests */}
              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Requests</Typography>
                <Typography level="body-xs" fontWeight={600}>
                  {usage.requestCount.toLocaleString()}
                </Typography>
              </Stack>

              {/* Plan */}
              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Plan</Typography>
                <Typography level="body-xs" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                  {plan.name}
                </Typography>
              </Stack>

              {/* Period */}
              {usage.period && (
                <>
                  <Divider sx={{ my: 0.25 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Period</Typography>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                      {usage.period}
                    </Typography>
                  </Stack>
                </>
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
        <Typography level="body-sm" fontWeight={600}>
          Token Usage
        </Typography>
        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
          {formatTokens(usage.tokensUsed)} / {formatTokens(plan.tokenAllocation)}
        </Typography>
      </Stack>
      <LinearProgress
        determinate
        value={Math.min(100, tokenPercentUsed)}
        color={color}
        sx={{ height: 8, borderRadius: 4, bgcolor: 'neutral.100' }}
      />
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
          {formatTokens(tokensRemaining)} remaining
        </Typography>
        {(usage.bonusTokens || 0) > 0 && (
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            +{formatTokens(usage.bonusTokens)} bonus
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
