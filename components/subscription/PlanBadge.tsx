'use client';
import { Chip } from '@mui/joy';
import { useSubscription } from '@/contexts/SubscriptionContext';

const PLAN_COLORS: Record<string, 'neutral' | 'primary' | 'success'> = {
  free: 'neutral',
  pro: 'primary',
  max: 'success',
};

interface PlanBadgeProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function PlanBadge({ size = 'sm' }: PlanBadgeProps) {
  const { plan, loading } = useSubscription();

  if (loading) return null;

  return (
    <Chip
      size={size}
      variant="soft"
      color={PLAN_COLORS[plan.id] || 'neutral'}
      sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: size === 'sm' ? '10px' : undefined }}
    >
      {plan.name}
    </Chip>
  );
}
