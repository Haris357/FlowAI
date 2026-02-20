'use client';
import { useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, Button, Chip, Divider } from '@mui/joy';
import { Zap, Package, Cpu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { TOKEN_PACKS, formatTokens } from '@/lib/plans';
import UsageMeter from '@/components/subscription/UsageMeter';
import toast from 'react-hot-toast';

export default function UsageSection() {
  const { user } = useAuth();
  const { plan } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleBuyTokenPack = async (packId: string) => {
    if (!user?.uid) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/subscription/token-pack', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId, userId: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to create checkout'); return; }
      window.location.href = data.checkoutUrl;
    } catch { toast.error('Failed to initiate purchase'); }
    finally { setCheckoutLoading(false); }
  };

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
            <Typography level="title-md" fontWeight={700}>Monthly Usage</Typography>
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
            {plan.allowedModels.length === 1 ? 'Basic AI' : plan.allowedModels.length <= 2 ? 'Enhanced AI' : 'Advanced AI'}
          </Chip>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 1.5 }}>
            Upgrade your plan to unlock more powerful AI capabilities.
          </Typography>
        </CardContent>
      </Card>

      {/* Token Packs */}
      {plan.features.tokenPurchases && (
        <Card variant="outlined">
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 'md', bgcolor: 'warning.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Package size={16} style={{ color: 'var(--joy-palette-warning-500)' }} />
              </Box>
              <Typography level="title-md" fontWeight={700}>Buy Extra AI Tokens</Typography>
            </Stack>
            <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 2.5, pl: 6.5 }}>
              Bonus tokens carry over until used or expire after 12 months.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {TOKEN_PACKS.map(pack => (
                <Card key={pack.id} variant="outlined" sx={{ flex: 1, transition: 'border-color 0.2s', '&:hover': { borderColor: 'primary.300' } }}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Typography level="title-sm" fontWeight={700}>{pack.name}</Typography>
                    <Typography level="h4" fontWeight={700} sx={{ my: 0.5 }}>${pack.price}</Typography>
                    <Typography level="body-xs" sx={{ color: 'text.secondary', mb: 2 }}>
                      {formatTokens(pack.tokens)} tokens
                    </Typography>
                    <Button size="sm" variant="soft" color="primary" fullWidth
                      loading={checkoutLoading} onClick={() => handleBuyTokenPack(pack.id)}>
                      Buy Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
