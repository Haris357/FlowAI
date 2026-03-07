'use client';
import { Chip } from '@mui/joy';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface PlanBadgeProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function PlanBadge({ size = 'sm' }: PlanBadgeProps) {
  const { plan, loading, isTrial, isTrialExpired: trialExpired } = useSubscription();

  if (loading) return null;

  const color = trialExpired ? 'danger' : isTrial ? 'warning' : plan.id === 'max' ? 'success' : 'primary';
  const label = trialExpired ? 'Expired' : isTrial ? `${plan.name} Trial` : plan.name;

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
