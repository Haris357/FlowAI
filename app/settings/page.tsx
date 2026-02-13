'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  Card,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Button,
  Avatar,
  IconButton,
  Select,
  Option,
  Switch,
  Divider,
  Modal,
  ModalDialog,
  ModalClose,
  FormHelperText,
  CircularProgress,
} from '@mui/joy';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Shield,
  Save,
  Upload,
  Camera,
  Moon,
  Sun,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getUserSettings, updateUserSettings, updateUserProfile } from '@/services/userSettings';
import type { UserSettings } from '@/services/userSettings';
import { LoadingSpinner, DangerousConfirmDialog, PageBreadcrumbs } from '@/components/common';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export default function AccountSettingsPage() {
  const { user, loading: authLoading, updateProfile, changePassword, deleteAccount } = useAuth();
  const { mode, toggleMode } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'system',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'comma',
    notifyEmail: true,
    notifyInvoices: true,
    notifyBills: true,
    notifyWeekly: false,
  });

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      setDisplayName(user.displayName || user.email?.split('@')[0] || '');
      setPhotoURL(user.photoURL || '');
      loadSettings();
    }
  }, [user, authLoading, router]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const userSettings = await getUserSettings(user.uid);
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setPhotoURL(downloadURL);
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);

    try {
      await updateProfile(displayName, photoURL || undefined);
      await updateUserProfile(user.uid, {
        name: displayName,
        ...(photoURL && { photoURL }),
      });
      toast.success('Profile saved successfully');
    } catch (error) {
      // Error already toasted in updateProfile
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    setSaving(true);

    try {
      await updateUserSettings(user.uid, settings);
      toast.success('Preferences saved successfully');

      // Apply theme immediately if changed
      if (settings.theme !== mode && settings.theme !== 'system') {
        toggleMode();
      }
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      // Error already toasted in changePassword
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      // Check if user is email/password user
      const isEmailUser = user.providerData.some(p => p.providerId === 'password');
      await deleteAccount(isEmailUser ? deletePassword : undefined);
      setDeleteModalOpen(false);
    } catch (error) {
      // Error already toasted in deleteAccount
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  const isEmailUser = user.providerData.some(p => p.providerId === 'password');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Breadcrumbs */}
        <PageBreadcrumbs
          items={[
            { label: 'Account Settings', icon: <SettingsIcon size={14} /> },
          ]}
        />

        {/* Header */}
        <Box>
          <Typography level="h2" sx={{ mb: 0.5 }}>
            Account Settings
          </Typography>
          <Typography level="body-md" sx={{ color: 'text.secondary' }}>
            Manage your account preferences and security.
          </Typography>
        </Box>

        {/* Tabs */}
        <Card>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value as number)}>
            <TabList>
              <Tab>
                <Stack direction="row" spacing={1} alignItems="center">
                  <User size={16} />
                  <span>Profile</span>
                </Stack>
              </Tab>
              <Tab>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SettingsIcon size={16} />
                  <span>Preferences</span>
                </Stack>
              </Tab>
              <Tab>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Bell size={16} />
                  <span>Notifications</span>
                </Stack>
              </Tab>
              <Tab>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Shield size={16} />
                  <span>Security</span>
                </Stack>
              </Tab>
            </TabList>

            {/* Profile Tab */}
            <TabPanel value={0}>
              <Stack spacing={3}>
                <Typography level="h4">Profile Information</Typography>

                <Stack direction="row" spacing={3} alignItems="center">
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={photoURL || undefined}
                      size="lg"
                      sx={{ width: 100, height: 100 }}
                    >
                      {displayName?.charAt(0) || user.email?.charAt(0)}
                    </Avatar>
                    <IconButton
                      size="sm"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        borderRadius: '50%',
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? <CircularProgress size="sm" /> : <Camera size={16} />}
                    </IconButton>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handlePhotoUpload}
                    />
                  </Box>

                  <Stack spacing={1}>
                    <Typography level="body-sm" fontWeight={600}>
                      Profile Photo
                    </Typography>
                    <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                      Click the camera icon to upload a new photo
                    </Typography>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                      JPG, PNG or GIF. Max size 5MB.
                    </Typography>
                  </Stack>
                </Stack>

                <FormControl>
                  <FormLabel>Display Name</FormLabel>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Email Address</FormLabel>
                  <Input value={user.email || ''} disabled />
                  <FormHelperText>Email cannot be changed</FormHelperText>
                </FormControl>

                <Box>
                  <Button
                    startDecorator={<Save size={18} />}
                    onClick={handleSaveProfile}
                    loading={saving}
                  >
                    Save Profile
                  </Button>
                </Box>
              </Stack>
            </TabPanel>

            {/* Preferences Tab */}
            <TabPanel value={1}>
              <Stack spacing={3}>
                <Typography level="h4">Display Preferences</Typography>

                <FormControl>
                  <FormLabel>Theme</FormLabel>
                  <Select
                    value={settings.theme}
                    onChange={(_, value) => setSettings({ ...settings, theme: value as any })}
                  >
                    <Option value="light">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Sun size={16} />
                        <span>Light</span>
                      </Stack>
                    </Option>
                    <Option value="dark">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Moon size={16} />
                        <span>Dark</span>
                      </Stack>
                    </Option>
                    <Option value="system">System Default</Option>
                  </Select>
                  <FormHelperText>Choose your preferred color theme</FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>Date Format</FormLabel>
                  <Select
                    value={settings.dateFormat}
                    onChange={(_, value) => setSettings({ ...settings, dateFormat: value as any })}
                  >
                    <Option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</Option>
                    <Option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</Option>
                    <Option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</Option>
                  </Select>
                  <FormHelperText>Choose how dates are displayed</FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>Number Format</FormLabel>
                  <Select
                    value={settings.numberFormat}
                    onChange={(_, value) => setSettings({ ...settings, numberFormat: value as any })}
                  >
                    <Option value="comma">Comma (1,000.00)</Option>
                    <Option value="period">Period (1.000,00)</Option>
                  </Select>
                  <FormHelperText>Choose how numbers are formatted</FormHelperText>
                </FormControl>

                <Box>
                  <Button
                    startDecorator={<Save size={18} />}
                    onClick={handleSavePreferences}
                    loading={saving}
                  >
                    Save Preferences
                  </Button>
                </Box>
              </Stack>
            </TabPanel>

            {/* Notifications Tab */}
            <TabPanel value={2}>
              <Stack spacing={3}>
                <Typography level="h4">Notification Preferences</Typography>

                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                    }}
                  >
                    <Box>
                      <Typography level="body-sm" fontWeight={600}>
                        Email Notifications
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                        Receive email notifications for important updates
                      </Typography>
                    </Box>
                    <Switch
                      checked={settings.notifyEmail}
                      onChange={(e) =>
                        setSettings({ ...settings, notifyEmail: e.target.checked })
                      }
                    />
                  </Box>

                  <Divider />

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                    }}
                  >
                    <Box>
                      <Typography level="body-sm" fontWeight={600}>
                        Invoice Reminders
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                        Get notified about upcoming invoice due dates
                      </Typography>
                    </Box>
                    <Switch
                      checked={settings.notifyInvoices}
                      onChange={(e) =>
                        setSettings({ ...settings, notifyInvoices: e.target.checked })
                      }
                      disabled={!settings.notifyEmail}
                    />
                  </Box>

                  <Divider />

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                    }}
                  >
                    <Box>
                      <Typography level="body-sm" fontWeight={600}>
                        Bill Alerts
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                        Receive alerts when bills are due or overdue
                      </Typography>
                    </Box>
                    <Switch
                      checked={settings.notifyBills}
                      onChange={(e) =>
                        setSettings({ ...settings, notifyBills: e.target.checked })
                      }
                      disabled={!settings.notifyEmail}
                    />
                  </Box>

                  <Divider />

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                    }}
                  >
                    <Box>
                      <Typography level="body-sm" fontWeight={600}>
                        Weekly Summary
                      </Typography>
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                        Get a weekly summary of your business activities
                      </Typography>
                    </Box>
                    <Switch
                      checked={settings.notifyWeekly}
                      onChange={(e) =>
                        setSettings({ ...settings, notifyWeekly: e.target.checked })
                      }
                      disabled={!settings.notifyEmail}
                    />
                  </Box>
                </Stack>

                <Box>
                  <Button
                    startDecorator={<Save size={18} />}
                    onClick={handleSavePreferences}
                    loading={saving}
                  >
                    Save Preferences
                  </Button>
                </Box>
              </Stack>
            </TabPanel>

            {/* Security Tab */}
            <TabPanel value={3}>
              <Stack spacing={4}>
                {isEmailUser && (
                  <>
                    <Box>
                      <Typography level="h4" sx={{ mb: 2 }}>
                        Change Password
                      </Typography>

                      <Stack spacing={2}>
                        <FormControl>
                          <FormLabel>Current Password</FormLabel>
                          <Input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>New Password</FormLabel>
                          <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                          />
                          <FormHelperText>Minimum 6 characters</FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Confirm New Password</FormLabel>
                          <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                          />
                        </FormControl>

                        <Box>
                          <Button onClick={handleChangePassword} loading={saving}>
                            Change Password
                          </Button>
                        </Box>
                      </Stack>
                    </Box>

                    <Divider />
                  </>
                )}

                <Box>
                  <Typography level="h4" sx={{ mb: 1, color: 'danger.500' }}>
                    Danger Zone
                  </Typography>
                  <Typography level="body-sm" sx={{ mb: 2, color: 'text.secondary' }}>
                    Once you delete your account, there is no going back. Please be certain.
                  </Typography>

                  <Button
                    color="danger"
                    variant="outlined"
                    startDecorator={<Trash2 size={18} />}
                    onClick={() => setDeleteModalOpen(true)}
                  >
                    Delete Account
                  </Button>
                </Box>
              </Stack>
            </TabPanel>
          </Tabs>
        </Card>
      </Stack>

      {/* Delete Account Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalDialog>
          <ModalClose />
          <Typography level="h4" startDecorator={<AlertTriangle size={20} />}>
            Delete Account
          </Typography>

          <Divider />

          <Stack spacing={2}>
            <Typography level="body-sm">
              Are you sure you want to delete your account? This action cannot be undone.
            </Typography>

            {isEmailUser && (
              <FormControl>
                <FormLabel>Enter your password to confirm</FormLabel>
                <Input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter password"
                />
              </FormControl>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="plain" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                color="danger"
                onClick={handleDeleteAccount}
                disabled={isEmailUser && !deletePassword}
              >
                Delete Account
              </Button>
            </Box>
          </Stack>
        </ModalDialog>
      </Modal>
    </Container>
  );
}
