'use client';
import { useState, useEffect } from 'react';
import {
  Modal,
  ModalDialog,
  Typography,
  Button,
  Stack,
  Divider,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  Box,
} from '@mui/joy';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DangerousConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmPhrase: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  warningItems?: string[];
}

export default function DangerousConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmPhrase,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  loading = false,
  warningItems = [],
}: DangerousConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setInputValue('');
      setStep(1);
    }
  }, [open]);

  const isConfirmPhraseMatch = inputValue === confirmPhrase;

  const handleProceedToStep2 = () => {
    setStep(2);
  };

  const handleConfirm = () => {
    if (isConfirmPhraseMatch) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog
        variant="outlined"
        role="alertdialog"
        sx={{
          maxWidth: { xs: '95vw', sm: 480 },
          width: '100%',
          borderColor: 'danger.300',
          boxShadow: '0 0 20px rgba(211, 47, 47, 0.1)',
        }}
      >
        <Stack spacing={2}>
          {/* Header with warning icon */}
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box
              sx={{
                p: 1.5,
                borderRadius: 'sm',
                bgcolor: 'danger.100',
                color: 'danger.600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={24} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography level="title-lg" sx={{ color: 'danger.700' }}>
                {title}
              </Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {description}
              </Typography>
            </Box>
          </Stack>

          <Divider />

          {step === 1 ? (
            // Step 1: Warning about what will be deleted
            <>
              <Box
                sx={{
                  bgcolor: 'danger.50',
                  border: '1px solid',
                  borderColor: 'danger.200',
                  borderRadius: 'sm',
                  p: 2,
                }}
              >
                <Typography level="title-sm" sx={{ color: 'danger.700', mb: 1 }}>
                  This action will permanently delete:
                </Typography>
                <Stack spacing={0.5}>
                  {warningItems.map((item, index) => (
                    <Stack key={index} direction="row" spacing={1} alignItems="center">
                      <Trash2 size={14} style={{ color: 'var(--joy-palette-danger-500)' }} />
                      <Typography level="body-sm" sx={{ color: 'danger.600' }}>
                        {item}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <Box
                sx={{
                  bgcolor: 'warning.50',
                  border: '1px solid',
                  borderColor: 'warning.200',
                  borderRadius: 'sm',
                  p: 2,
                }}
              >
                <Typography level="body-sm" sx={{ color: 'warning.700' }}>
                  <strong>Note:</strong> System accounts and master data will be preserved. Only user-created data will be deleted.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} justifyContent="flex-end">
                <Button variant="plain" color="neutral" onClick={handleClose}>
                  {cancelText}
                </Button>
                <Button
                  variant="solid"
                  color="danger"
                  onClick={handleProceedToStep2}
                >
                  I understand, continue
                </Button>
              </Stack>
            </>
          ) : (
            // Step 2: Type confirmation phrase
            <>
              <Box
                sx={{
                  bgcolor: 'danger.50',
                  border: '1px solid',
                  borderColor: 'danger.200',
                  borderRadius: 'sm',
                  p: 2,
                }}
              >
                <Typography level="body-sm" sx={{ color: 'danger.700' }}>
                  To confirm this action, please type{' '}
                  <Typography
                    component="span"
                    sx={{
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                      bgcolor: 'danger.100',
                      px: 0.5,
                      borderRadius: 'xs',
                    }}
                  >
                    {confirmPhrase}
                  </Typography>{' '}
                  in the field below.
                </Typography>
              </Box>

              <FormControl sx={{ minHeight: 80 }}>
                <FormLabel>Confirmation</FormLabel>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Type "${confirmPhrase}" to confirm`}
                  color={inputValue && !isConfirmPhraseMatch ? 'danger' : undefined}
                  autoFocus
                  disabled={loading}
                />
                <FormHelperText sx={{ minHeight: 20 }}>
                  {inputValue && !isConfirmPhraseMatch ? (
                    <Typography level="body-xs" sx={{ color: 'danger.500' }}>
                      Text does not match. Please type exactly: {confirmPhrase}
                    </Typography>
                  ) : (
                    ' '
                  )}
                </FormHelperText>
              </FormControl>

              <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} justifyContent="flex-end">
                <Button
                  variant="plain"
                  color="neutral"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  variant="solid"
                  color="danger"
                  onClick={handleConfirm}
                  loading={loading}
                  disabled={!isConfirmPhraseMatch}
                  startDecorator={<Trash2 size={16} />}
                >
                  {confirmText}
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
