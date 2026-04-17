'use client';
import { Box, Typography, Stack, Button, Card } from '@mui/joy';
import { CreditCard, ArrowRight, Receipt, Download, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function BillingLinkSection() {
  const router = useRouter();
  const { plan, isPaidSubscriber, isTrial, trialTimeLeft } = useSubscription();

  const handleGoToBilling = () => {
    router.push('/settings/billing');
  };

  return (
    <Stack spacing={2.5}>
      <Card variant="outlined" sx={{ overflow: 'hidden', borderRadius: '14px', p: 0 }}>
        <Box sx={{
          px: 3, py: 3,
          background: 'linear-gradient(135deg, #D97757 0%, #C4694D 100%)',
          color: '#fff',
        }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{
              width: 48, height: 48, borderRadius: '12px',
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Crown size={22} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography level="title-md" fontWeight={800} sx={{ color: '#fff' }}>
                {isPaidSubscriber ? plan.name : isTrial ? `${plan.name} (Trial)` : 'No active plan'}
              </Typography>
              <Typography level="body-sm" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {isPaidSubscriber
                  ? `$${plan.price}/month · Your subscription is active`
                  : isTrial && trialTimeLeft
                  ? `${trialTimeLeft} remaining on your free trial`
                  : 'Subscribe to unlock all features'}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ p: 3 }}>
          <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 2.5 }}>
            Manage your subscription, update payment method, view invoices, download receipts,
            change your plan, and see your full billing history on the dedicated billing page.
          </Typography>

          <Stack spacing={1.25} sx={{ mb: 3 }}>
            {[
              { icon: CreditCard, text: 'Payment methods & billing details' },
              { icon: Receipt, text: 'Full invoice & payment history' },
              { icon: Download, text: 'Download invoices as PDF' },
              { icon: Crown, text: 'Upgrade, downgrade, or cancel your plan' },
            ].map(({ icon: Icon, text }, i) => (
              <Stack key={i} direction="row" spacing={1.25} alignItems="center">
                <Box sx={{
                  width: 28, height: 28, borderRadius: '8px',
                  bgcolor: 'primary.softBg',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} style={{ color: 'var(--joy-palette-primary-600)' }} />
                </Box>
                <Typography level="body-sm">{text}</Typography>
              </Stack>
            ))}
          </Stack>

          <Button
            size="lg"
            fullWidth
            endDecorator={<ArrowRight size={16} />}
            onClick={handleGoToBilling}
            sx={{
              borderRadius: '10px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #D97757 0%, #C4694D 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #C4694D 0%, #B85A3D 100%)' },
            }}
          >
            Go to Billing
          </Button>
        </Box>
      </Card>
    </Stack>
  );
}
