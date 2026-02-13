'use client';
import {
  Modal,
  ModalDialog,
  Typography,
  Button,
  Stack,
  Divider,
} from '@mui/joy';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  loading = false,
}: ConfirmDialogProps) {
  const colorMap = {
    danger: 'danger',
    warning: 'warning',
    info: 'primary',
  } as const;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog variant="outlined" role="alertdialog" sx={{ maxWidth: 400 }}>
        <Stack spacing={2}>
          {variant === 'danger' && (
            <AlertTriangle size={24} style={{ color: 'var(--joy-palette-danger-500)' }} />
          )}
          <Typography level="title-lg">{title}</Typography>
          <Typography level="body-md" sx={{ color: 'text.secondary' }}>
            {description}
          </Typography>
          <Divider />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button variant="plain" color="neutral" onClick={onClose} disabled={loading}>
              {cancelText}
            </Button>
            <Button
              variant="solid"
              color={colorMap[variant]}
              onClick={onConfirm}
              loading={loading}
            >
              {confirmText}
            </Button>
          </Stack>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
