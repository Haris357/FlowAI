'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Button, Chip, Skeleton,
  Modal, ModalDialog, ModalClose, FormControl, FormLabel, Input, Select, Option,
  Switch, Divider, IconButton, Sheet, Table, Tooltip, Checkbox,
} from '@mui/joy';
import {
  UserCog, Plus, Trash2, Edit3, Key, Power, Shield, Search,
  CheckCircle2, XCircle, AlertCircle, Save, Eye, EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/admin-fetch';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { adminCard, liquidGlassSubtle } from '@/lib/admin-theme';
import {
  ADMIN_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_COLORS,
  ROLE_PERMISSIONS, PERMISSION_GROUPS, PERMISSION_LABELS,
  type AdminRole, type Permission,
} from '@/lib/admin-roles';

interface AdminUserRow {
  id: string;
  username: string;
  name: string;
  role: AdminRole;
  permissionsOverride: Permission[] | null;
  active: boolean;
  createdAt: any;
  updatedAt: any;
  lastLoginAt: any;
  createdBy: string | null;
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts._seconds ? new Date(ts._seconds * 1000)
    : ts.toDate ? ts.toDate()
    : new Date(ts);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminUsersPage() {
  const { admin: currentAdmin, can } = useAdminAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);

  // Edit modal
  const [editing, setEditing] = useState<AdminUserRow | null>(null);

  // Password reset modal
  const [pwdResetUser, setPwdResetUser] = useState<AdminUserRow | null>(null);

  // Delete confirm
  const [deleting, setDeleting] = useState<AdminUserRow | null>(null);

  const canManage = can('admin_users:manage');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/admin-users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load admin users');
      setUsers(data.users || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search) return users;
    const s = search.toLowerCase();
    return users.filter(u =>
      u.username.toLowerCase().includes(s) ||
      (u.name || '').toLowerCase().includes(s) ||
      u.role.toLowerCase().includes(s)
    );
  }, [users, search]);

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <UserCog size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Box>
              <Typography level="h3" fontWeight={700}>Admin Users</Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                Manage who can access the admin panel and what they can do.
              </Typography>
            </Box>
          </Stack>
          {canManage && (
            <Button
              startDecorator={<Plus size={16} />}
              onClick={() => setCreateOpen(true)}
              sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px', fontWeight: 700 }}
            >
              New admin user
            </Button>
          )}
        </Stack>

        {/* Search */}
        <Input
          startDecorator={<Search size={16} />}
          placeholder="Search by username, name, or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ maxWidth: 380, borderRadius: '10px' }}
        />

        {/* Table */}
        <Card sx={{ ...adminCard as Record<string, unknown>, p: 0, overflow: 'hidden' }}>
          <Sheet sx={{ overflow: 'auto' }}>
            <Table sx={{
              '& thead th': { py: 1.5, fontSize: '0.72rem', fontWeight: 700, color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.04em' },
              '& tbody td': { py: 1.5, verticalAlign: 'middle' },
            }}>
              <thead>
                <tr>
                  <th style={{ width: '24%' }}>User</th>
                  <th style={{ width: '14%' }}>Role</th>
                  <th style={{ width: '12%' }}>Status</th>
                  <th style={{ width: '15%' }}>Last login</th>
                  <th style={{ width: '15%' }}>Created</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td><Skeleton variant="text" width="80%" /></td>
                      <td><Skeleton variant="rectangular" width={70} height={20} sx={{ borderRadius: 10 }} /></td>
                      <td><Skeleton variant="text" width={50} /></td>
                      <td><Skeleton variant="text" width={70} /></td>
                      <td><Skeleton variant="text" width={70} /></td>
                      <td><Skeleton variant="text" width={120} sx={{ ml: 'auto' }} /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <Box sx={{ textAlign: 'center', py: 6, color: 'text.tertiary' }}>
                        <UserCog size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
                        <Typography level="body-sm">
                          {search ? 'No admin users match your search.' : 'No admin users yet.'}
                        </Typography>
                      </Box>
                    </td>
                  </tr>
                ) : (
                  filtered.map(u => {
                    const isMe = u.id === currentAdmin?.id;
                    return (
                      <tr key={u.id}>
                        <td>
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <Box sx={{
                              width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                              bgcolor: 'primary.softBg', color: 'primary.600',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.78rem', fontWeight: 700,
                            }}>
                              {(u.name || u.username).charAt(0).toUpperCase()}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <Typography level="body-sm" fontWeight={600} noWrap>
                                  {u.name || u.username}
                                </Typography>
                                {isMe && (
                                  <Chip size="sm" variant="soft" color="primary" sx={{ fontSize: '0.6rem', '--Chip-minHeight': '16px', px: 0.625 }}>
                                    You
                                  </Chip>
                                )}
                              </Stack>
                              <Typography level="body-xs" sx={{ color: 'text.tertiary' }} noWrap>
                                @{u.username}
                              </Typography>
                            </Box>
                          </Stack>
                        </td>
                        <td>
                          <Chip size="sm" variant="soft" color={ROLE_COLORS[u.role]} sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                            {ROLE_LABELS[u.role]}
                          </Chip>
                          {u.permissionsOverride && u.permissionsOverride.length > 0 && (
                            <Tooltip title="Has custom permission overrides">
                              <Chip size="sm" variant="outlined" sx={{ ml: 0.5, fontSize: '0.62rem', '--Chip-minHeight': '18px' }}>
                                custom
                              </Chip>
                            </Tooltip>
                          )}
                        </td>
                        <td>
                          {u.active ? (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.500' }} />
                              <Typography level="body-xs" fontWeight={600}>Active</Typography>
                            </Stack>
                          ) : (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'neutral.400' }} />
                              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Disabled</Typography>
                            </Stack>
                          )}
                        </td>
                        <td>
                          <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                            {formatDate(u.lastLoginAt)}
                          </Typography>
                        </td>
                        <td>
                          <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                            {formatDate(u.createdAt)}
                          </Typography>
                        </td>
                        <td>
                          <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                            <Tooltip title={isMe ? 'Change my password' : 'Reset password'}>
                              <IconButton
                                size="sm" variant="plain" color="neutral"
                                onClick={() => setPwdResetUser(u)}
                                disabled={!isMe && !canManage}
                              >
                                <Key size={14} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit role / permissions">
                              <IconButton
                                size="sm" variant="plain" color="primary"
                                onClick={() => setEditing(u)}
                                disabled={!canManage}
                              >
                                <Edit3 size={14} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={isMe ? 'You cannot delete yourself' : 'Delete'}>
                              <span>
                                <IconButton
                                  size="sm" variant="plain" color="danger"
                                  onClick={() => setDeleting(u)}
                                  disabled={isMe || !canManage}
                                >
                                  <Trash2 size={14} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </Sheet>
        </Card>

        {/* Footer note */}
        {!loading && (
          <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'right' }}>
            {users.length} admin user{users.length !== 1 ? 's' : ''} total
          </Typography>
        )}
      </Stack>

      {/* Create modal */}
      {createOpen && (
        <CreateAdminModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); load(); }}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <EditAdminModal
          user={editing}
          isSelf={editing.id === currentAdmin?.id}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {/* Password reset modal */}
      {pwdResetUser && (
        <PasswordResetModal
          user={pwdResetUser}
          isSelf={pwdResetUser.id === currentAdmin?.id}
          onClose={() => setPwdResetUser(null)}
          onSaved={() => setPwdResetUser(null)}
        />
      )}

      {/* Delete confirm */}
      {deleting && (
        <DeleteConfirmModal
          user={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => { setDeleting(null); load(); }}
        />
      )}
    </Box>
  );
}

// ============================================================
// Create admin modal
// ============================================================

function CreateAdminModal({
  onClose, onCreated,
}: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    username: '', name: '', password: '', role: 'admin' as AdminRole,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Client-side validation surfaced inline so users see exactly what's wrong
  // before they ever hit the server.
  const usernameOk = /^[a-z0-9._-]{3,32}$/.test(form.username);
  const passwordLenOk = form.password.length >= 8 && form.password.length <= 128;
  const passwordComboOk = /[A-Za-z]/.test(form.password) && /[0-9]/.test(form.password);
  const nameOk = form.name.trim().length >= 1 && form.name.trim().length <= 80;
  const canSubmit = usernameOk && passwordLenOk && passwordComboOk && nameOk;

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setServerError(null);
    try {
      const res = await adminFetch('/api/admin/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || 'Failed to create admin user');
        toast.error(data.error || 'Failed to create admin user');
        return;
      }
      toast.success('Admin user created');
      onCreated();
    } catch {
      toast.error('Failed to create admin user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 480 }, width: '100%', borderRadius: '16px' }}>
        <ModalClose />
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px',
            bgcolor: '#FFF0E8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus size={18} color="#D97757" />
          </Box>
          <Box>
            <Typography level="title-lg" fontWeight={700}>New admin user</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              They'll log in with this username and password.
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {serverError && (
          <Box sx={{
            p: 1.5, mb: 2, borderRadius: '8px',
            bgcolor: 'danger.softBg', border: '1px solid', borderColor: 'danger.outlinedBorder',
          }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <AlertCircle size={14} style={{ color: 'var(--joy-palette-danger-500)', flexShrink: 0 }} />
              <Typography level="body-xs" sx={{ color: 'danger.700' }}>
                {serverError}
              </Typography>
            </Stack>
          </Box>
        )}

        <Stack spacing={2}>
          <FormControl required error={form.username.length > 0 && !usernameOk}>
            <FormLabel>Username</FormLabel>
            <Input
              size="sm" value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
              placeholder="e.g. jane_admin"
              sx={{ borderRadius: '8px' }}
            />
            <Typography level="body-xs" sx={{
              color: form.username.length > 0 && !usernameOk ? 'danger.500' : 'text.tertiary',
              mt: 0.5,
            }}>
              3–32 chars · lowercase letters, digits, dot, underscore, hyphen
            </Typography>
          </FormControl>

          <FormControl required>
            <FormLabel>Display name</FormLabel>
            <Input
              size="sm" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Jane Admin"
              sx={{ borderRadius: '8px' }}
            />
          </FormControl>

          <FormControl required error={form.password.length > 0 && (!passwordLenOk || !passwordComboOk)}>
            <FormLabel>Initial password</FormLabel>
            <Input
              size="sm" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              type={showPwd ? 'text' : 'password'}
              placeholder="Min 8 chars, letters + numbers"
              endDecorator={
                <IconButton size="sm" variant="plain" onClick={() => setShowPwd(s => !s)}>
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </IconButton>
              }
              sx={{ borderRadius: '8px' }}
            />
            <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
              <Typography level="body-xs" sx={{
                color: form.password.length === 0 ? 'text.tertiary' : passwordLenOk ? 'success.600' : 'danger.500',
                display: 'flex', alignItems: 'center', gap: 0.5,
              }}>
                {passwordLenOk ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                8+ characters
              </Typography>
              <Typography level="body-xs" sx={{
                color: form.password.length === 0 ? 'text.tertiary' : passwordComboOk ? 'success.600' : 'danger.500',
                display: 'flex', alignItems: 'center', gap: 0.5,
              }}>
                {passwordComboOk ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                letters + numbers
              </Typography>
            </Stack>
          </FormControl>

          <FormControl required>
            <FormLabel>Role</FormLabel>
            <Select
              size="sm" value={form.role}
              onChange={(_, v) => v && setForm(f => ({ ...f, role: v as AdminRole }))}
              sx={{ borderRadius: '8px' }}
            >
              {ADMIN_ROLES.map(r => (
                <Option key={r} value={r}>{ROLE_LABELS[r]}</Option>
              ))}
            </Select>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
              {ROLE_DESCRIPTIONS[form.role]}
            </Typography>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button variant="plain" color="neutral" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave} loading={saving}
            disabled={!canSubmit}
            startDecorator={<Save size={14} />}
            sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px' }}
          >
            Create user
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}

// ============================================================
// Edit admin modal (role + permissions + active)
// ============================================================

function EditAdminModal({
  user, isSelf, onClose, onSaved,
}: { user: AdminUserRow; isSelf: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(user.name || '');
  const [role, setRole] = useState<AdminRole>(user.role);
  const [active, setActive] = useState(user.active);
  const [useCustom, setUseCustom] = useState(!!(user.permissionsOverride && user.permissionsOverride.length > 0));
  const [overrides, setOverrides] = useState<Permission[]>(user.permissionsOverride || []);
  const [saving, setSaving] = useState(false);

  const togglePermission = (p: Permission) => {
    setOverrides(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const setRolePreset = (r: AdminRole) => {
    setRole(r);
    if (useCustom) {
      // Pre-fill the override list with the role's default permissions for editing convenience.
      const defaults = ROLE_PERMISSIONS[r].includes('*' as Permission)
        ? [] // super_admin has '*' — clearer to use the role itself, not overrides
        : (ROLE_PERMISSIONS[r] as Permission[]);
      setOverrides(defaults);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, any> = {
        name, role, active,
        permissionsOverride: useCustom ? overrides : null,
      };
      const res = await adminFetch(`/api/admin/admin-users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update admin user');
        return;
      }
      toast.success('Admin user updated');
      onSaved();
    } catch {
      toast.error('Failed to update admin user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 600 }, width: '100%', borderRadius: '16px', maxHeight: '90vh', overflow: 'auto' }}>
        <ModalClose />

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px',
            bgcolor: '#FFF0E8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={18} color="#D97757" />
          </Box>
          <Box>
            <Typography level="title-lg" fontWeight={700}>Edit admin user</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              @{user.username}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2.5}>
          <FormControl>
            <FormLabel>Display name</FormLabel>
            <Input
              size="sm" value={name}
              onChange={e => setName(e.target.value)}
              sx={{ borderRadius: '8px' }}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Role</FormLabel>
            <Select
              size="sm" value={role}
              onChange={(_, v) => v && setRolePreset(v as AdminRole)}
              sx={{ borderRadius: '8px' }}
            >
              {ADMIN_ROLES.map(r => (
                <Option key={r} value={r}>{ROLE_LABELS[r]}</Option>
              ))}
            </Select>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
              {ROLE_DESCRIPTIONS[role]}
            </Typography>
          </FormControl>

          <Box sx={{
            p: 2, borderRadius: '10px',
            border: '1px solid', borderColor: 'divider',
            bgcolor: 'background.level1',
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography level="body-sm" fontWeight={600}>Account active</Typography>
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                  Disabled accounts cannot sign in.
                </Typography>
              </Box>
              <Switch
                checked={active} onChange={e => setActive(e.target.checked)}
                disabled={isSelf}
              />
            </Stack>
            {isSelf && (
              <Typography level="body-xs" sx={{ color: 'warning.600', mt: 1 }}>
                You cannot disable your own account.
              </Typography>
            )}
          </Box>

          <Box sx={{
            p: 2, borderRadius: '10px',
            border: '1px solid', borderColor: 'divider',
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: useCustom ? 1.5 : 0 }}>
              <Box>
                <Typography level="body-sm" fontWeight={600}>Custom permissions</Typography>
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                  Override the role's defaults for this user.
                </Typography>
              </Box>
              <Switch checked={useCustom} onChange={e => setUseCustom(e.target.checked)} />
            </Stack>

            {useCustom && (
              <Stack spacing={1.5}>
                <Divider />
                {PERMISSION_GROUPS.map(group => (
                  <Box key={group.label}>
                    <Typography level="body-xs" fontWeight={700} sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.75 }}>
                      {group.label}
                    </Typography>
                    <Stack spacing={0.5} sx={{ pl: 0.5 }}>
                      {group.permissions.map(p => (
                        <Stack key={p} direction="row" alignItems="center" spacing={1}>
                          <Checkbox
                            size="sm"
                            checked={overrides.includes(p)}
                            onChange={() => togglePermission(p as Permission)}
                          />
                          <Typography level="body-sm">
                            {PERMISSION_LABELS[p as Exclude<Permission, '*'>]}
                          </Typography>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary', ml: 'auto' }}>
                            {p}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button variant="plain" color="neutral" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave} loading={saving}
            startDecorator={<Save size={14} />}
            sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px' }}
          >
            Save changes
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}

// ============================================================
// Password reset modal (self or admin reset)
// ============================================================

function PasswordResetModal({
  user, isSelf, onClose, onSaved,
}: { user: AdminUserRow; isSelf: boolean; onClose: () => void; onSaved: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, any> = { newPassword };
      if (isSelf) body.currentPassword = currentPassword;
      const res = await adminFetch(`/api/admin/admin-users/${user.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update password');
        return;
      }
      toast.success('Password updated');
      onSaved();
    } catch {
      toast.error('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 420 }, width: '100%', borderRadius: '16px' }}>
        <ModalClose />

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px',
            bgcolor: '#FFF0E8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Key size={18} color="#D97757" />
          </Box>
          <Box>
            <Typography level="title-lg" fontWeight={700}>
              {isSelf ? 'Change my password' : 'Reset password'}
            </Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              {isSelf ? 'Update your sign-in password.' : `Reset password for @${user.username}`}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          {isSelf && (
            <FormControl required>
              <FormLabel>Current password</FormLabel>
              <Input
                size="sm" type={show ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                sx={{ borderRadius: '8px' }}
              />
            </FormControl>
          )}
          <FormControl required>
            <FormLabel>New password</FormLabel>
            <Input
              size="sm" type={show ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              endDecorator={
                <IconButton size="sm" variant="plain" onClick={() => setShow(s => !s)}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </IconButton>
              }
              sx={{ borderRadius: '8px' }}
            />
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
              Min 8 characters · must include letters and numbers
            </Typography>
          </FormControl>
          <FormControl required>
            <FormLabel>Confirm new password</FormLabel>
            <Input
              size="sm" type={show ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              sx={{ borderRadius: '8px' }}
            />
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button variant="plain" color="neutral" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave} loading={saving}
            startDecorator={<Save size={14} />}
            sx={{ bgcolor: '#D97757', '&:hover': { bgcolor: '#C4694D' }, borderRadius: '10px' }}
          >
            Update password
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}

// ============================================================
// Delete confirmation modal
// ============================================================

function DeleteConfirmModal({
  user, onClose, onDeleted,
}: { user: AdminUserRow; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await adminFetch(`/api/admin/admin-users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete admin user');
        return;
      }
      toast.success('Admin user deleted');
      onDeleted();
    } catch {
      toast.error('Failed to delete admin user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <ModalDialog variant="outlined" role="alertdialog" sx={{ maxWidth: { xs: '95vw', sm: 400 }, width: '100%', borderRadius: '16px' }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
            bgcolor: 'danger.softBg',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertCircle size={18} style={{ color: 'var(--joy-palette-danger-500)' }} />
          </Box>
          <Box>
            <Typography level="title-md" fontWeight={700}>Delete admin user?</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.5 }}>
              <strong>@{user.username}</strong> will permanently lose access to the admin panel. This cannot be undone.
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2.5 }}>
          <Button variant="plain" color="neutral" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button color="danger" onClick={handleDelete} loading={deleting} startDecorator={<Trash2 size={14} />} sx={{ borderRadius: '10px' }}>
            Delete user
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
