'use client';
import { useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, Button, Chip, Divider } from '@mui/joy';
import { Check, Zap, Crown, Bot, Building2, Users, Send, History, Landmark, Repeat, Headphones, Sparkles } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PLANS } from '@/lib/plans';
import type { PlanId, PlanDefinition } from '@/types/subscription';

interface PricingCardsProps {
  onSelectPlan: (planId: PlanId, billingPeriod: 'monthly' | 'yearly') => void;
  loading?: boolean;
  currentBillingPeriod?: 'monthly' | 'yearly';
}

export default function PricingCards({ onSelectPlan, loading, currentBillingPeriod }: PricingCardsProps) {
  const { plan: currentPlan, subscription, isTrial, isPaidSubscriber, isTrialExpired: trialExpired } = useSubscription();

  const detectedPeriod: 'monthly' | 'yearly' =
    currentBillingPeriod
    ?? (currentPlan.yearlyLemonSqueezyVariantId &&
        subscription?.lemonSqueezyVariantId === currentPlan.yearlyLemonSqueezyVariantId
          ? 'yearly'
          : 'monthly');

  const [isAnnual, setIsAnnual] = useState(detectedPeriod === 'yearly');

  const plans: PlanDefinition[] = [PLANS.pro, PLANS.max];

  return (
    <Stack spacing={2}>
      {/* Billing Toggle */}
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
        <Typography
          level="body-sm"
          fontWeight={!isAnnual ? 700 : 400}
          sx={{ color: !isAnnual ? 'text.primary' : 'text.tertiary', cursor: 'pointer' }}
          onClick={() => setIsAnnual(false)}
        >
          Monthly
        </Typography>
        <Box
          onClick={() => setIsAnnual(!isAnnual)}
          sx={{
            width: 44, height: 22, borderRadius: '11px', cursor: 'pointer',
            bgcolor: isAnnual ? 'primary.500' : 'neutral.300',
            position: 'relative', transition: 'background-color 0.2s',
          }}
        >
          <Box
            sx={{
              position: 'absolute', top: 2, left: isAnnual ? 22 : 2,
              width: 18, height: 18, borderRadius: '50%', bgcolor: 'white',
              transition: 'left 0.2s', boxShadow: 'sm',
            }}
          />
        </Box>
        <Typography
          level="body-sm"
          fontWeight={isAnnual ? 700 : 400}
          sx={{ color: isAnnual ? 'text.primary' : 'text.tertiary', cursor: 'pointer' }}
          onClick={() => setIsAnnual(true)}
        >
          Yearly
        </Typography>
        {isAnnual && (
          <Chip size="sm" variant="soft" color="success" sx={{ fontSize: '10px', fontWeight: 700 }}>
            Save 20%
          </Chip>
        )}
      </Stack>

      {/* Plan Cards */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
        {plans.map((plan) => {
          const selectedPeriod: 'monthly' | 'yearly' = isAnnual ? 'yearly' : 'monthly';
          const isSamePlan = currentPlan.id === plan.id;
          const isExactlyCurrent =
            isPaidSubscriber && isSamePlan && detectedPeriod === selectedPeriod;
          const isPeriodSwitch =
            isPaidSubscriber && isSamePlan && detectedPeriod !== selectedPeriod;
          const isPopular = plan.id === 'pro';
          const isMax = plan.id === 'max';
          const displayPrice = isAnnual && plan.yearlyPrice ? plan.yearlyPrice : plan.price;

          return (
            <Card
              key={plan.id}
              variant="outlined"
              sx={{
                flex: 1,
                position: 'relative',
                borderColor: isExactlyCurrent ? 'primary.500' : isPopular ? 'primary.400' : 'divider',
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
                      {isExactlyCurrent && (
                        <Chip size="sm" variant="soft" color="primary" sx={{ fontSize: '10px', fontWeight: 700 }}>Current</Chip>
                      )}
                      {isPeriodSwitch && (
                        <Chip size="sm" variant="outlined" color="neutral" sx={{ fontSize: '10px', fontWeight: 700 }}>
                          Your plan · {detectedPeriod === 'yearly' ? 'annual' : 'monthly'}
                        </Chip>
                      )}
                    </Stack>
                    <Stack direction="row" alignItems="baseline" spacing={0.5}>
                      <Typography level="h3" fontWeight={700}>
                        ${displayPrice}
                      </Typography>
                      <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                        {isAnnual ? '/mo, billed yearly' : '/month'}
                      </Typography>
                    </Stack>
                    {isAnnual && plan.yearlyPrice && (
                      <Typography level="body-xs" sx={{ color: 'success.600', mt: 0.25 }}>
                        Save ${((plan.price - plan.yearlyPrice) * 12).toFixed(0)}/year
                      </Typography>
                    )}
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
                    variant={isExactlyCurrent ? 'outlined' : isPopular ? 'solid' : 'soft'}
                    color={isExactlyCurrent ? 'neutral' : 'primary'}
                    disabled={isExactlyCurrent || loading}
                    loading={loading}
                    fullWidth
                    onClick={() => onSelectPlan(plan.id, selectedPeriod)}
                    sx={{ mt: 'auto' }}
                  >
                    {isExactlyCurrent
                      ? 'Current plan'
                      : isPeriodSwitch
                      ? `Switch to ${selectedPeriod === 'yearly' ? 'annual' : 'monthly'}`
                      : isTrial && isSamePlan
                      ? 'Subscribe now'
                      : trialExpired
                      ? 'Subscribe'
                      : !isPaidSubscriber
                      ? 'Choose plan'
                      : isSamePlan
                      ? 'Current plan'
                      : 'Switch plan'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
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
