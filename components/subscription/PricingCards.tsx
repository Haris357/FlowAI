'use client';
import { Box, Card, CardContent, Typography, Stack, Button, Chip, Divider } from '@mui/joy';
import { Check, Zap, Crown, Bot, Building2, Users, Send, History, Landmark, Repeat, Headphones, Sparkles } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PLANS } from '@/lib/plans';
import type { PlanId, PlanDefinition } from '@/types/subscription';

interface PricingCardsProps {
  onSelectPlan: (planId: PlanId) => void;
  loading?: boolean;
}

export default function PricingCards({ onSelectPlan, loading }: PricingCardsProps) {
  const { plan: currentPlan, isTrial, isTrialExpired: trialExpired } = useSubscription();

  const plans: PlanDefinition[] = [PLANS.pro, PLANS.max];

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
      {plans.map((plan) => {
        const isCurrent = currentPlan.id === plan.id;
        const isPopular = plan.id === 'pro';
        const isMax = plan.id === 'max';

        return (
          <Card
            key={plan.id}
            variant="outlined"
            sx={{
              flex: 1,
              position: 'relative',
              borderColor: isPopular ? 'primary.400' : isCurrent ? 'primary.200' : 'divider',
              transform: isPopular ? 'scale(1.02)' : undefined,
              boxShadow: isPopular ? 'md' : undefined,
            }}
          >
            {isPopular && (
              <Chip
                size="sm"
                variant="solid"
                color="primary"
                sx={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontWeight: 700,
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Most Popular
              </Chip>
            )}
            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Box sx={{
                      width: 28, height: 28, borderRadius: 'sm',
                      bgcolor: isPopular ? 'primary.softBg' : 'warning.softBg',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isPopular
                        ? <Zap size={14} style={{ color: 'var(--joy-palette-primary-500)' }} />
                        : <Crown size={14} style={{ color: 'var(--joy-palette-warning-500)' }} />
                      }
                    </Box>
                    <Typography level="title-md" fontWeight={700}>{plan.name}</Typography>
                    {isCurrent && (
                      <Chip size="sm" variant="outlined" color="neutral" sx={{ fontSize: '10px' }}>Current</Chip>
                    )}
                  </Stack>
                  <Stack direction="row" alignItems="baseline" spacing={0.5}>
                    <Typography level="h3" fontWeight={700}>
                      ${plan.price === 0 ? '0' : plan.price}
                    </Typography>
                    <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>/month</Typography>
                  </Stack>
                  <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    {plan.description}
                  </Typography>
                </Box>

                <Divider />

                {/* Max: "Everything in Pro" callout */}
                {isMax && (
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{
                    px: 1.5, py: 1, borderRadius: 'sm',
                    bgcolor: 'primary.softBg', border: '1px solid', borderColor: 'primary.200',
                  }}>
                    <Check size={13} style={{ color: 'var(--joy-palette-primary-500)', flexShrink: 0 }} />
                    <Typography level="body-xs" fontWeight={700} sx={{ color: 'primary.600' }}>
                      Everything in Pro, plus:
                    </Typography>
                  </Stack>
                )}

                <Stack spacing={1}>
                  {getFeatureList(plan).map((feature, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                      <Check size={14} style={{ color: 'var(--joy-palette-success-500)', marginTop: 2, flexShrink: 0 }} />
                      <Typography level="body-xs">
                        {feature.text}
                        {feature.badge && (
                          <Chip
                            size="sm"
                            variant="soft"
                            color="warning"
                            sx={{ ml: 0.75, fontSize: '9px', height: '16px', fontWeight: 700 }}
                          >
                            {feature.badge}
                          </Chip>
                        )}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                <Button
                  variant={isCurrent && !isTrial ? 'outlined' : isPopular ? 'solid' : 'soft'}
                  color={isCurrent && !isTrial ? 'neutral' : 'primary'}
                  disabled={(isCurrent && !isTrial && !trialExpired) || loading}
                  loading={loading}
                  fullWidth
                  onClick={() => onSelectPlan(plan.id)}
                  sx={{ mt: 'auto' }}
                >
                  {isCurrent && !isTrial && !trialExpired
                    ? 'Current Plan'
                    : isTrial && currentPlan.id === plan.id
                    ? 'Subscribe Now'
                    : trialExpired
                    ? 'Subscribe'
                    : 'Upgrade'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}

interface FeatureItem {
  text: string;
  badge?: string;
}

function getFeatureList(plan: PlanDefinition): FeatureItem[] {
  if (plan.id === 'pro') {
    return [
      { text: 'Extended AI usage per session (4h)' },
      { text: 'Standard weekly AI allowance' },
      { text: 'Fast AI model' },
      { text: `Up to ${plan.maxCompanies} companies` },
      { text: 'Unlimited customers & vendors' },
      { text: 'Unlimited invoices & bills' },
      { text: `${plan.maxCollaboratorsPerCompany} team members/company` },
      { text: 'All financial reports' },
      { text: 'Payroll & salary slips' },
      { text: 'Custom branding' },
    ];
  }

  // Max — only show what's different/better than Pro
  return [
    { text: '3x more AI usage per session', badge: '3x' },
    { text: '3.5x weekly AI allowance', badge: '3.5x' },
    { text: 'Advanced AI models', badge: 'NEW' },
    { text: `Up to ${plan.maxCompanies} companies` },
    { text: 'Unlimited team members' },
    { text: 'Unlimited email sends' },
    { text: 'Unlimited chat history' },
    { text: 'Unlimited bank accounts & recurring txns' },
    { text: 'Priority support (24h)', badge: 'VIP' },
  ];
}
