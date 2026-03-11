'use client';

import { useState, useEffect } from 'react';
import {
  Modal, ModalDialog, ModalClose, Typography, Stack, Button, Box, Input,
  Select, Option, Avatar, Chip, Divider, IconButton, Sheet, Tooltip,
  CircularProgress,
} from '@mui/joy';
import {
  Users, UserPlus, Mail, Shield, Crown, Eye, Edit3, Trash2,
  Clock, Check, X, Send, ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyMembers } from '@/services/members';
import { getCompanyInvitations, cancelInvitation } from '@/services/invitations';
import { updateMemberRole, removeCompanyMember } from '@/services/members';
import {
  ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_COLORS, ASSIGNABLE_ROLES,
  canManageRole, getAssignableRoles,
} from '@/lib/permissions';
import type { CompanyMember, CompanyRole, Invitation } from '@/types';
import toast from 'react-hot-toast';

interface TeamManagementModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  ownerId: string;
  currentUserRole: CompanyRole;
}

export default function TeamManagementModal({
  open, onClose, companyId, companyName, ownerId, currentUserRole,
}: TeamManagementModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CompanyRole>('editor');
  const [sending, setSending] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  useEffect(() => {
    if (open) fetchTeamData();
  }, [open, companyId]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const [m, inv] = await Promise.all([
        getCompanyMembers(companyId).catch(() => []),
        canManage && user?.uid ? getCompanyInvitations(companyId, user.uid).catch(() => []) : Promise.resolve([]),
      ]);

      // Add owner if not already in members
      const hasOwner = m.some(mem => mem.userId === ownerId);
      if (!hasOwner && user) {
        // Owner might not be in members subcollection yet (legacy)
        if (ownerId === user.uid) {
          m.unshift({
            id: user.uid,
            userId: user.uid,
            email: user.email || '',
            name: user.displayName || user.email?.split('@')[0] || 'Owner',
            photoURL: user.photoURL || undefined,
            role: 'owner',
            joinedAt: {} as any,
            invitedBy: user.uid,
          });
        }
      }

      // Sort: owner first, then by role
      const roleOrder: Record<string, number> = { owner: 0, admin: 1, editor: 2, viewer: 3 };
      m.sort((a, b) => (roleOrder[a.role] ?? 4) - (roleOrder[b.role] ?? 4));

      setMembers(m);
      setInvitations(inv.filter(i => i.status === 'pending'));
    } catch (err) {
      console.error('Failed to load team data:', err);
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast.error('Enter an email address'); return; }
    const email = inviteEmail.trim().toLowerCase();

    if (email === user?.email?.toLowerCase()) {
      toast.error("You can't invite yourself"); return;
    }
    if (members.some(m => m.email === email)) {
      toast.error('Already a team member'); return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          invitedEmail: email,
          role: inviteRole,
          invitedByUid: user?.uid,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');

      toast.success(`Invitation sent to ${email}`);
      setInviteEmail('');
      fetchTeamData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: CompanyRole) => {
    try {
      await updateMemberRole(companyId, memberId, newRole);
      toast.success('Role updated');
      fetchTeamData();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    setRemovingId(memberId);
    try {
      await removeCompanyMember(companyId, memberId);
      toast.success(`${memberName} removed from team`);
      fetchTeamData();
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setRemovingId(null);
    }
  };

  const handleCancelInvite = async (invId: string) => {
    try {
      await cancelInvitation(invId);
      toast.success('Invitation cancelled');
      fetchTeamData();
    } catch {
      toast.error('Failed to cancel invitation');
    }
  };

  const assignableRoles = getAssignableRoles(currentUserRole);

  const getRoleIcon = (role: CompanyRole) => {
    switch (role) {
      case 'owner': return <Crown size={13} />;
      case 'admin': return <Shield size={13} />;
      case 'editor': return <Edit3 size={13} />;
      case 'viewer': return <Eye size={13} />;
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        variant="outlined"
        sx={{
          maxWidth: 560, width: '95%', borderRadius: '16px', p: 0,
          overflow: 'hidden', maxHeight: '85vh',
        }}
      >
        {/* Header */}
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          <ModalClose />
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              width: 40, height: 40, borderRadius: '10px',
              bgcolor: 'primary.softBg', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={20} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Box>
              <Typography level="title-lg" fontWeight={700}>Team Members</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                {companyName}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider />

        <Box sx={{ overflow: 'auto', maxHeight: 'calc(85vh - 160px)' }}>
          {/* Invite Section */}
          {canManage && (
            <Box sx={{ px: 3, py: 2.5 }}>
              <Typography level="body-sm" fontWeight={600} sx={{ mb: 1.5, color: 'text.secondary' }}>
                <UserPlus size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                Invite a new member
              </Typography>
              <Stack direction="row" spacing={1}>
                <Input
                  placeholder="Email address"
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  startDecorator={<Mail size={14} />}
                  sx={{ flex: 1 }}
                  size="sm"
                />
                <Select
                  value={inviteRole}
                  onChange={(_, v) => v && setInviteRole(v)}
                  size="sm"
                  sx={{ minWidth: 100 }}
                >
                  {assignableRoles.map(r => (
                    <Option key={r} value={r}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        {getRoleIcon(r)}
                        <span>{ROLE_LABELS[r]}</span>
                      </Stack>
                    </Option>
                  ))}
                </Select>
                <Button
                  size="sm"
                  loading={sending}
                  onClick={handleInvite}
                  startDecorator={<Send size={13} />}
                >
                  Invite
                </Button>
              </Stack>
            </Box>
          )}

          {canManage && <Divider />}

          {/* Members List */}
          <Box sx={{ px: 3, py: 2 }}>
            {loading ? (
              <Stack alignItems="center" py={4}>
                <CircularProgress size="sm" />
              </Stack>
            ) : (
              <>
                <Typography level="body-xs" fontWeight={700} sx={{ mb: 1.5, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Members ({members.length})
                </Typography>
                <Stack spacing={0.5}>
                  {members.map(member => {
                    const isCurrentUser = member.userId === user?.uid;
                    const isMemberOwner = member.role === 'owner';
                    const canChangeThisMember = canManage && !isMemberOwner && !isCurrentUser && canManageRole(currentUserRole, member.role);

                    return (
                      <Sheet
                        key={member.userId}
                        variant="outlined"
                        sx={{
                          p: 1.5, borderRadius: '10px',
                          display: 'flex', alignItems: 'center', gap: 1.5,
                        }}
                      >
                        <Avatar
                          src={member.photoURL || undefined}
                          size="sm"
                          sx={{ width: 34, height: 34, fontSize: '0.8rem' }}
                        >
                          {member.name?.charAt(0)?.toUpperCase()}
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Typography level="body-sm" fontWeight={600} noWrap>
                              {member.name}
                            </Typography>
                            {isCurrentUser && (
                              <Chip size="sm" variant="soft" color="neutral" sx={{ fontSize: '9px', height: 16 }}>
                                You
                              </Chip>
                            )}
                          </Stack>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary' }} noWrap>
                            {member.email}
                          </Typography>
                        </Box>

                        {/* Role chip or selector */}
                        {canChangeThisMember ? (
                          <Select
                            value={member.role}
                            onChange={(_, v) => v && handleRoleChange(member.userId, v)}
                            size="sm"
                            variant="soft"
                            sx={{ minWidth: 90 }}
                          >
                            {assignableRoles.map(r => (
                              <Option key={r} value={r}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  {getRoleIcon(r)}
                                  <span>{ROLE_LABELS[r]}</span>
                                </Stack>
                              </Option>
                            ))}
                          </Select>
                        ) : (
                          <Chip
                            size="sm"
                            variant="soft"
                            color={ROLE_COLORS[member.role]}
                            startDecorator={getRoleIcon(member.role)}
                            sx={{ fontWeight: 600, fontSize: '11px' }}
                          >
                            {ROLE_LABELS[member.role]}
                          </Chip>
                        )}

                        {/* Remove button */}
                        {canChangeThisMember && (
                          <Tooltip title="Remove member">
                            <IconButton
                              size="sm"
                              variant="plain"
                              color="danger"
                              loading={removingId === member.userId}
                              onClick={() => handleRemoveMember(member.userId, member.name)}
                            >
                              <Trash2 size={14} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Sheet>
                    );
                  })}
                </Stack>

                {/* Pending Invitations */}
                {canManage && invitations.length > 0 && (
                  <>
                    <Typography level="body-xs" fontWeight={700} sx={{ mt: 3, mb: 1.5, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Pending Invitations ({invitations.length})
                    </Typography>
                    <Stack spacing={0.5}>
                      {invitations.map(inv => (
                        <Sheet
                          key={inv.id}
                          variant="soft"
                          color="warning"
                          sx={{
                            p: 1.5, borderRadius: '10px',
                            display: 'flex', alignItems: 'center', gap: 1.5,
                          }}
                        >
                          <Avatar size="sm" sx={{ width: 34, height: 34, bgcolor: 'warning.softBg' }}>
                            <Clock size={14} />
                          </Avatar>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography level="body-sm" fontWeight={600} noWrap>
                              {inv.invitedEmail}
                            </Typography>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                              Invited as {ROLE_LABELS[inv.role]}
                            </Typography>
                          </Box>

                          <Chip size="sm" variant="outlined" color="warning" sx={{ fontSize: '10px' }}>
                            Pending
                          </Chip>

                          <Tooltip title="Cancel invitation">
                            <IconButton
                              size="sm"
                              variant="plain"
                              color="neutral"
                              onClick={() => handleCancelInvite(inv.id)}
                            >
                              <X size={14} />
                            </IconButton>
                          </Tooltip>
                        </Sheet>
                      ))}
                    </Stack>
                  </>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* Footer */}
        <Divider />
        <Box sx={{ px: 3, py: 2 }}>
          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              {canManage ? 'Owner & Admin can manage team members' : `Your role: ${ROLE_LABELS[currentUserRole]}`}
            </Typography>
            <Button variant="plain" color="neutral" size="sm" onClick={onClose}>
              Close
            </Button>
          </Stack>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
