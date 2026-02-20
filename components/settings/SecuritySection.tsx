'use client';
import { useState } from 'react';
import {
  Box, Typography, Stack, FormControl, FormLabel, Input, Button,
  Divider, Modal, ModalDialog, ModalClose, Card, CardContent,
} from '@mui/joy';
import { Lock, Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function SecuritySection() {
  const { user, changePassword, deleteAccount } = useAuth();
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const isEmailUser = user?.providerData.some(p => p.providerId === 'password') ?? false;

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields'); return;
    }
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch {} finally { setSaving(false); }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await deleteAccount(isEmailUser ? deletePassword : undefined);
      setDeleteModalOpen(false);
    } catch {}
  };

  const PasswordToggle = (
    <Button variant="plain" size="sm" onClick={() => setShowPasswords(!showPasswords)} sx={{ minWidth: 'auto', px: 0.5 }}>
      {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
    </Button>
  );

  return (
    <>
      <Stack spacing={3}>
        {isEmailUser && (
          <Card variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Lock size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                </Box>
                <Typography level="title-md" fontWeight={700}>Change Password</Typography>
              </Stack>
              <Stack spacing={2}>
                <FormControl>
                  <FormLabel>Current Password</FormLabel>
                  <Input type={showPasswords ? 'text' : 'password'} value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password"
                    endDecorator={PasswordToggle} />
                </FormControl>
                <FormControl>
                  <FormLabel>New Password</FormLabel>
                  <Input type={showPasswords ? 'text' : 'password'} value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 6 characters"
                    endDecorator={PasswordToggle} />
                </FormControl>
                <FormControl>
                  <FormLabel>Confirm New Password</FormLabel>
                  <Input type={showPasswords ? 'text' : 'password'} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password"
                    endDecorator={PasswordToggle} />
                </FormControl>
                <Box>
                  <Button onClick={handleChangePassword} loading={saving}>Update Password</Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}

        <Card variant="outlined" sx={{ borderColor: 'danger.200' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 'md', bgcolor: 'danger.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={16} style={{ color: 'var(--joy-palette-danger-500)' }} />
              </Box>
              <Typography level="title-md" fontWeight={700} sx={{ color: 'danger.600' }}>Danger Zone</Typography>
            </Stack>
            <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 2, pl: 6.5 }}>
              Permanently delete your account and all associated data. This cannot be undone.
            </Typography>
            <Box sx={{ pl: 6.5 }}>
              <Button color="danger" variant="soft" startDecorator={<Trash2 size={16} />}
                onClick={() => setDeleteModalOpen(true)}>
                Delete Account
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Stack>

      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalDialog sx={{ maxWidth: 420 }}>
          <ModalClose />
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              width: 40, height: 40, borderRadius: 'md', bgcolor: 'danger.softBg',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={20} style={{ color: 'var(--joy-palette-danger-500)' }} />
            </Box>
            <Typography level="title-lg" fontWeight={700}>Delete Account</Typography>
          </Stack>
          <Divider sx={{ my: 1.5 }} />
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            This will permanently delete your account, companies, and all data. This cannot be undone.
          </Typography>
          {isEmailUser && (
            <FormControl sx={{ mt: 2 }}>
              <FormLabel>Confirm your password</FormLabel>
              <Input type="password" value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)} placeholder="Enter password" />
            </FormControl>
          )}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button variant="plain" color="neutral" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button color="danger" onClick={handleDeleteAccount} disabled={isEmailUser && !deletePassword}>
              Delete Account
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </>
  );
}
