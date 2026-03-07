'use client';
import { Chip } from '@mui/joy';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface PlanBadgeProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function PlanBadge({ size = 'sm' }: PlanBadgeProps) {
  const { plan, loading, isPaidSubscriber, isTrial, isTrialExpired: trialExpired } = useSubscription();

  if (loading) return null;

  const color = isPaidSubscriber
    ? (plan.id === 'max' ? 'success' : 'primary')
    : trialExpired ? 'danger' : isTrial ? 'warning' : 'neutral';

  const label = isPaidSubscriber
    ? plan.name
    : trialExpired ? 'Expired' : isTrial ? `${plan.name} Trial` : plan.name;

  return (
    <Chip
      size={size}
      variant="soft"
      color={color}
      sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: size === 'sm' ? '10px' : undefined }}
    >
      {label}
    </Chip>
  );
}
