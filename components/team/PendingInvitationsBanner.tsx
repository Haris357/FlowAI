'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Button, Avatar, Chip, Sheet,
} from '@mui/joy';
import { Mail, Check, X, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPendingInvitationsForUser } from '@/services/invitations';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions';
import type { Invitation } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  onAccepted?: () => void;
}

export default function PendingInvitationsBanner({ onAccepted }: Props) {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) fetchInvitations();
  }, [user?.email]);

  const fetchInvitations = async () => {
    if (!user?.email) return;
    try {
      const invs = await getPendingInvitationsForUser(user.email);
      setInvitations(invs);
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
    }
  };

  const handleRespond = async (invitationId: string, action: 'accept' | 'decline') => {
    setRespondingId(invitationId);
    try {
      const res = await fetch('/api/invitations/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, userId: user?.uid, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      toast.success(action === 'accept' ? data.message || 'Invitation accepted!' : 'Invitation declined');
      setInvitations(prev => prev.filter(i => i.id !== invitationId));
      if (action === 'accept') onAccepted?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to respond');
    } finally {
      setRespondingId(null);
    }
  };

  if (invitations.length === 0) return null;

  return (
    <Stack spacing={1.5}>
      {invitations.map(inv => (
        <Sheet
          key={inv.id}
          variant="outlined"
          sx={{
            p: 2, borderRadius: '12px',
            border: '1px solid',
            borderColor: 'primary.200',
            bgcolor: 'primary.softBg',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '10px',
              bgcolor: 'primary.softBg', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              border: '1px solid', borderColor: 'primary.200',
              flexShrink: 0,
            }}>
              <Mail size={18} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography level="body-sm" fontWeight={700}>
                  Team Invitation
                </Typography>
                <Chip
                  size="sm"
                  variant="soft"
                  color={ROLE_COLORS[inv.role]}
                  sx={{ fontSize: '10px', height: 18 }}
                >
                  {ROLE_LABELS[inv.role]}
                </Chip>
              </Stack>
              <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.25 }}>
                <strong>{inv.invitedByName}</strong> invited you to join <strong>{inv.companyName}</strong>
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <Button
                size="sm"
                variant="plain"
                color="neutral"
                startDecorator={<X size={13} />}
                loading={respondingId === inv.id}
                onClick={() => handleRespond(inv.id, 'decline')}
              >
                Decline
              </Button>
              <Button
                size="sm"
                variant="solid"
                color="primary"
                startDecorator={<Check size={13} />}
                loading={respondingId === inv.id}
                onClick={() => handleRespond(inv.id, 'accept')}
              >
                Accept
              </Button>
            </Stack>
          </Stack>
        </Sheet>
      ))}
    </Stack>
  );
}
