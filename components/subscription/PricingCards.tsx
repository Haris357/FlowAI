'use client';
import { Box, Card, CardContent, Typography, Stack, Button, Chip, Divider } from '@mui/joy';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PLANS, formatTokens } from '@/lib/plans';
import type { PlanId, PlanDefinition } from '@/types/subscription';

interface PricingCardsProps {
  onSelectPlan: (planId: PlanId) => void;
  loading?: boolean;
}

const PLAN_ICONS: Record<string, any> = {
  free: Sparkles,
  pro: Zap,
  max: Crown,
};

export default function PricingCards({ onSelectPlan, loading }: PricingCardsProps) {
  const { plan: currentPlan } = useSubscription();

  const plans: PlanDefinition[] = [PLANS.free, PLANS.pro, PLANS.max];

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
      {plans.map((plan) => {
        const Icon = PLAN_ICONS[plan.id];
        const isCurrent = currentPlan.id === plan.id;
        const isPopular = plan.id === 'pro';

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
                      bgcolor: isPopular ? 'primary.softBg' : 'neutral.softBg',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={14} style={{ color: isPopular ? 'var(--joy-palette-primary-500)' : undefined }} />
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

                <Stack spacing={1}>
                  {getFeatureList(plan).map((feature, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                      <Check size={14} style={{ color: 'var(--joy-palette-success-500)', marginTop: 2, flexShrink: 0 }} />
                      <Typography level="body-xs">{feature}</Typography>
                    </Stack>
                  ))}
                </Stack>

                <Button
                  variant={isCurrent ? 'outlined' : isPopular ? 'solid' : 'soft'}
                  color={isCurrent ? 'neutral' : 'primary'}
                  disabled={isCurrent || loading}
                  loading={loading}
                  fullWidth
                  onClick={() => onSelectPlan(plan.id)}
                  sx={{ mt: 'auto' }}
                >
                  {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}

function getFeatureList(plan: PlanDefinition): string[] {
  const features: string[] = [];

  features.push(`~${formatTokens(plan.tokenAllocation)} AI tokens/month`);
  features.push(`${plan.allowedModels.length === 1 ? 'Basic AI' : plan.allowedModels.length <= 2 ? 'Enhanced AI' : 'Advanced AI capabilities'}`);
  features.push(`${plan.maxCompanies === 1 ? '1 company' : `Up to ${plan.maxCompanies} companies`}`);

  if (plan.maxCollaboratorsPerCompany === 0) {
    features.push('Owner only (no collaborators)');
  } else if (plan.maxCollaboratorsPerCompany === -1) {
    features.push('Unlimited collaborators');
  } else {
    features.push(`${plan.maxCollaboratorsPerCompany} collaborators/company`);
  }

  if (plan.maxCustomers === -1) {
    features.push('Unlimited customers & vendors');
  } else {
    features.push(`${plan.maxCustomers} customers & vendors`);
  }

  if (plan.maxInvoicesPerMonth === -1) {
    features.push('Unlimited invoices');
  } else {
    features.push(`${plan.maxInvoicesPerMonth} invoices/month`);
  }

  if (plan.features.allReports) features.push('All financial reports');
  else features.push('Basic reports (P&L)');

  if (plan.features.payroll) features.push('Payroll & salary slips');
  if (plan.features.tokenPurchases) features.push('Buy extra AI tokens');

  return features;
}
