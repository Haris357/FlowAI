'use client';
import { useState, useRef } from 'react';
import {
  Box, Typography, Stack, FormControl, FormLabel, Input, Button,
  Avatar, IconButton, FormHelperText, CircularProgress, Card, CardContent,
} from '@mui/joy';
import { Save, Camera, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/services/userSettings';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export default function ProfileSection() {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || user?.email?.split('@')[0] || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File size must be less than 5MB'); return; }

    setUploadingPhoto(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setPhotoURL(downloadURL);
      toast.success('Photo uploaded');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(displayName, photoURL || undefined);
      await updateUserProfile(user.uid, { name: displayName, ...(photoURL && { photoURL }) });
      toast.success('Profile saved');
    } catch {} finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
            <Box sx={{ position: 'relative', alignSelf: { xs: 'center', sm: 'flex-start' } }}>
              <Avatar src={photoURL || undefined} size="lg" sx={{ width: 88, height: 88, fontSize: '2rem' }}>
                {displayName?.charAt(0) || user?.email?.charAt(0)}
              </Avatar>
              <IconButton
                size="sm"
                variant="solid"
                color="primary"
                sx={{
                  position: 'absolute', bottom: -2, right: -2,
                  borderRadius: '50%', width: 30, height: 30, minWidth: 30, minHeight: 30,
                  boxShadow: 'sm',
                }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? <CircularProgress size="sm" sx={{ '--CircularProgress-size': '16px' }} /> : <Camera size={14} />}
              </IconButton>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
            </Box>
            <Box>
              <Typography level="title-md" fontWeight={600}>Profile Photo</Typography>
              <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.25 }}>
                JPG, PNG or GIF. Max 5MB.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <FormControl>
              <FormLabel>Display Name</FormLabel>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                startDecorator={<User size={16} />}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Email Address</FormLabel>
              <Input value={user?.email || ''} disabled startDecorator={<Mail size={16} />} />
              <FormHelperText>Email cannot be changed.</FormHelperText>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      <Box>
        <Button startDecorator={<Save size={16} />} onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      </Box>
    </Stack>
  );
}
