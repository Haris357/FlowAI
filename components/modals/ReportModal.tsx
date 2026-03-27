'use client';

import { useState } from 'react';
import {
  Modal, ModalDialog, ModalClose, Typography, Stack, Textarea,
  Button, Select, Option, Box,
} from '@mui/joy';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'bug', label: 'Bug / Error' },
  { value: 'ui_issue', label: 'UI / Display Issue' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'other', label: 'Other' },
];

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  screenshotDataUrl: string | null;
  userId: string;
  userEmail: string;
  userName: string;
  companyId: string;
  pageUrl: string;
}

export default function ReportModal({
  open, onClose, screenshotDataUrl, userId, userEmail, userName, companyId, pageUrl,
}: ReportModalProps) {
  const [category, setCategory] = useState<string>('bug');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Please describe the issue');
      return;
    }
    setSubmitting(true);
    try {
      let screenshotUrl = '';
      let screenshotPath = '';

      if (screenshotDataUrl) {
        const timestamp = Date.now();
        screenshotPath = `reports/${userId}/${timestamp}.png`;
        const storageRef = ref(storage, screenshotPath);
        await uploadString(storageRef, screenshotDataUrl, 'data_url');
        screenshotUrl = await getDownloadURL(storageRef);
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, userEmail, userName, companyId, pageUrl,
          category, description: description.trim(),
          screenshotUrl, screenshotPath,
        }),
      });

      if (!res.ok) throw new Error();
      toast.success('Report submitted. Thank you!');
      setDescription('');
      setCategory('bug');
      onClose();
    } catch {
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setCategory('bug');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog sx={{ maxWidth: { xs: '95vw', sm: 500 }, width: '100%', borderRadius: 'lg', p: 2.5 }}>
        <ModalClose />
        <Typography level="title-md" fontWeight="lg" sx={{ mb: 0.5 }}>
          Report an Issue
        </Typography>
        <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 2 }}>
          Describe the problem and we'll look into it.
        </Typography>

        {screenshotDataUrl && (
          <Box sx={{ mb: 2, borderRadius: 'sm', overflow: 'hidden', border: '1px solid', borderColor: 'neutral.200' }}>
            <img
              src={screenshotDataUrl}
              alt="Screenshot"
              style={{ width: '100%', display: 'block', maxHeight: 180, objectFit: 'cover', objectPosition: 'top' }}
            />
            <Typography level="body-xs" sx={{ px: 1.5, py: 0.75, color: 'text.tertiary', bgcolor: 'background.level1' }}>
              Screenshot of the current page will be attached
            </Typography>
          </Box>
        )}

        <Stack spacing={1.5}>
          <Select
            value={category}
            onChange={(_, val) => setCategory(val as string)}
            size="sm"
          >
            {CATEGORIES.map(c => (
              <Option key={c.value} value={c.value}>{c.label}</Option>
            ))}
          </Select>

          <Textarea
            placeholder="Describe the issue in detail..."
            minRows={3}
            maxRows={6}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button variant="plain" color="neutral" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button size="sm" loading={submitting} onClick={handleSubmit}>
              Submit Report
            </Button>
          </Stack>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
