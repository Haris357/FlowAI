'use client';

import { useState } from 'react';
import {
  Modal, ModalDialog, ModalClose, Typography, Box, Stack, Button, Chip, Divider, Card, CardContent,
} from '@mui/joy';
import { AlertTriangle, Zap, ArrowRight, Check, ShoppingCart, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { PLANS, TOKEN_PACKS, formatTokens, getPlan } from '@/lib/plans';
import toast from 'react-hot-toast';

function getResetDate(period?: string): string {
  if (!period) return 'next month';
  const [year, month] = period.split('-').map(Number);
  const nextMonth = new Date(year, month, 1); // month is 0-indexed so this gives next month
  return nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getUpgradeFeatures(currentPlanId: string): string[] {
  if (currentPlanId === 'free') {
    const pro = PLANS.pro;
    return [
      `${formatTokens(pro.tokenAllocation)} AI tokens/month`,
      'Unlimited customers & invoices',
      'All financial reports & exports',
      'Payroll & salary slips',
      `Up to ${pro.maxCompanies} companies`,
    ];
  }
  if (currentPlanId === 'pro') {
    const max = PLANS.max;
    return [
      `${formatTokens(max.tokenAllocation)} AI tokens/month`,
      'Advanced AI models (GPT-4o)',
      'Up to 10 companies',
      'Unlimited collaborators',
      'Priority support',
    ];
  }
  return [];
}

export default function TokenLimitModal() {
  const { tokenLimitReached, dismissTokenLimit } = useChat();
  const { plan, usage } = useSubscription();
  const { user } = useAuth();
  const router = useRouter();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  if (!tokenLimitReached) return null;

  const planId = plan.id;
  const canUpgrade = planId !== 'max';
  const canBuyPacks = planId !== 'free';
  const nextPlan = planId === 'free' ? PLANS.pro : planId === 'pro' ? PLANS.max : null;
  const features = getUpgradeFeatures(planId);
  const resetDate = getResetDate(usage?.period);

  const handleUpgrade = () => {
    dismissTokenLimit();
    router.push('/settings/billing');
  };

  const handleBuyPack = async (packId: string) => {
    if (!user?.uid) return;
    setCheckoutLoading(packId);
    try {
      const res = await fetch('/api/subscription/token-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId, userId: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to start checkout');
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      toast.error('Failed to initiate checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <Modal open={tokenLimitReached} onClose={dismissTokenLimit}>
      <ModalDialog
        variant="outlined"
        sx={{
          maxWidth: 520,
          width: '100%',
          borderRadius: 'lg',
          p: 0,
          overflow: 'hidden',
        }}
      >
        <ModalClose sx={{ zIndex: 2 }} />

        {/* Header */}
        <Box sx={{ p: 3, bgcolor: 'warning.softBg', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              width: 44, height: 44, borderRadius: 'md',
              bgcolor: 'warning.softHoverBg', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={22} style={{ color: 'var(--joy-palette-warning-600)' }} />
            </Box>
            <Box>
              <Typography level="title-lg" fontWeight={700}>Token Limit Reached</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                You&apos;ve used all your AI tokens this month
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {/* Usage Stats */}
            <Box sx={{ p: 2, borderRadius: 'md', bgcolor: 'background.level1', border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.25 }}>Tokens Used</Typography>
                  <Typography level="title-md" fontWeight={700}>
                    {formatTokens(usage?.tokensUsed || 0)} / {formatTokens(plan.tokenAllocation)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.25 }}>Resets On</Typography>
                  <Typography level="body-sm" fontWeight={600}>{resetDate}</Typography>
                </Box>
              </Stack>
            </Box>

            {/* Upgrade Section */}
            {canUpgrade && nextPlan && (
              <>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <Crown size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                    <Typography level="title-sm" fontWeight={700}>
                      Upgrade to {nextPlan.name}
                    </Typography>
                    <Chip size="sm" variant="soft" color="primary">${nextPlan.price}/mo</Chip>
                  </Stack>
                  <Stack spacing={0.75}>
                    {features.map((feature, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="center">
                        <Check size={14} style={{ color: 'var(--joy-palette-success-500)', flexShrink: 0 }} />
                        <Typography level="body-sm">{feature}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>

                <Button
                  variant="solid"
                  color="primary"
                  size="lg"
                  endDecorator={<ArrowRight size={16} />}
                  onClick={handleUpgrade}
                  fullWidth
                >
                  Upgrade to {nextPlan.name}
                </Button>
              </>
            )}

            {/* Token Packs Section */}
            {canBuyPacks && (
              <>
                <Divider>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                    {canUpgrade ? 'or buy additional tokens' : 'Purchase additional tokens'}
                  </Typography>
                </Divider>

                <Stack direction="row" spacing={1.5}>
                  {TOKEN_PACKS.map(pack => (
                    <Card
                      key={pack.id}
                      variant="outlined"
                      sx={{ flex: 1, cursor: 'pointer', transition: 'all 0.15s', '&:hover': { borderColor: 'primary.400', transform: 'translateY(-1px)' } }}
                    >
                      <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography level="body-xs" fontWeight={700} sx={{ textTransform: 'uppercase', color: 'text.tertiary', mb: 0.5 }}>
                          {pack.name}
                        </Typography>
                        <Typography level="title-md" fontWeight={700}>
                          {formatTokens(pack.tokens)}
                        </Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 1 }}>tokens</Typography>
                        <Button
                          size="sm"
                          variant="soft"
                          color="primary"
                          fullWidth
                          loading={checkoutLoading === pack.id}
                          onClick={() => handleBuyPack(pack.id)}
                          startDecorator={<ShoppingCart size={14} />}
                        >
                          ${pack.price}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </>
            )}

            {/* Free user - no token packs, just upgrade CTA */}
            {!canBuyPacks && !canUpgrade && (
              <Typography level="body-sm" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                Your tokens will reset on {resetDate}.
              </Typography>
            )}

            {/* Footer Actions */}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="plain" color="neutral" onClick={dismissTokenLimit}>
                Maybe Later
              </Button>
              {canUpgrade && (
                <Button variant="outlined" color="neutral" onClick={handleUpgrade}>
                  View All Plans
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
