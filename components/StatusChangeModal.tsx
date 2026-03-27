'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  ModalDialog,
  ModalClose,
  Typography,
  Box,
  Stack,
  Chip,
  Button,
  Divider,
} from '@mui/joy';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useSettingsCategory } from '@/hooks/useSettings';
import {
  EntityType,
  getAllowedTransitions,
  requiresConfirmation,
  getStatusOption,
  getStatusColor,
} from '@/lib/status-management';

// Map entity types to their settings category codes
const ENTITY_CATEGORY_MAP: Record<string, string> = {
  invoice: 'invoice_status',
  bill: 'bill_status',
  quote: 'quote_status',
  purchaseOrder: 'purchase_order_status',
  creditNote: 'credit_note_status',
  debitNote: 'debit_note_status',
  salarySlip: 'salary_slip_status',
  employee: 'employee_status',
};

interface StatusChangeModalProps {
  open: boolean;
  onClose: () => void;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  currentStatus: string;
  onStatusChange: (entityId: string, newStatus: string) => Promise<void>;
}

export default function StatusChangeModal({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
  currentStatus,
  onStatusChange,
}: StatusChangeModalProps) {
  const { company } = useCompany();
  const categoryCode = ENTITY_CATEGORY_MAP[entityType] || '';
  const { options: dbStatuses, getLabel, getColor } = useSettingsCategory(company?.id, categoryCode);

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Get allowed forward transitions from status-management
  const allowedTransitions = getAllowedTransitions(entityType, currentStatus);

  // Filter DB statuses to only show valid forward transitions
  const availableStatuses = dbStatuses.filter(s => allowedTransitions.includes(s.code));

  // Get current status info from DB
  const currentStatusLabel = getLabel(currentStatus);
  const currentStatusColor = (getColor(currentStatus) || 'neutral') as 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

  const handleSelectStatus = (statusCode: string) => {
    const confirmation = requiresConfirmation(entityType, currentStatus, statusCode);
    if (confirmation.required) {
      setSelectedStatus(statusCode);
      setConfirmationMessage(confirmation.message || 'Are you sure you want to change this status?');
      setShowConfirmation(true);
    } else {
      setSelectedStatus(statusCode);
      setShowConfirmation(false);
      setConfirmationMessage('');
    }
  };

  const handleConfirm = async () => {
    if (!selectedStatus) return;

    setIsSaving(true);
    try {
      await onStatusChange(entityId, selectedStatus);
      onClose();
    } catch (error: any) {
      console.error('Error changing status:', error);
    } finally {
      setIsSaving(false);
      setSelectedStatus(null);
      setShowConfirmation(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    setSelectedStatus(null);
    setShowConfirmation(false);
    onClose();
  };

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedStatus(null);
      setShowConfirmation(false);
      setConfirmationMessage('');
    }
  }, [open]);

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog
        variant="outlined"
        sx={{
          maxWidth: { xs: '95vw', sm: 420 },
          width: '100%',
          borderRadius: 'lg',
          p: 3,
        }}
      >
        <ModalClose />
        <Typography level="title-lg" sx={{ mb: 0.5 }}>
          Change Status
        </Typography>
        <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 2 }}>
          {entityName}
        </Typography>

        {/* Current Status */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
            Current:
          </Typography>
          <Chip size="sm" variant="soft" color={currentStatusColor}>
            {currentStatusLabel}
          </Chip>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Available Transitions */}
        {availableStatuses.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
              No status transitions available from current status.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: 1 }}>
              Change to
            </Typography>
            {availableStatuses.map((status) => {
              const isSelected = selectedStatus === status.code;
              const statusColor = (status.color || 'neutral') as 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
              // Get description from status-management (more detailed)
              const statusOption = getStatusOption(entityType, status.code);
              const description = statusOption?.description || '';

              return (
                <Box
                  key={status.code}
                  onClick={() => handleSelectStatus(status.code)}
                  sx={{
                    p: 1.5,
                    borderRadius: 'md',
                    border: '1px solid',
                    borderColor: isSelected ? `${statusColor}.400` : 'divider',
                    bgcolor: isSelected ? `${statusColor}.softBg` : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    '&:hover': {
                      borderColor: `${statusColor}.300`,
                      bgcolor: `${statusColor}.softBg`,
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: `${statusColor}.500`,
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography level="body-sm" fontWeight={isSelected ? 600 : 400}>
                        {status.label}
                      </Typography>
                      {description && (
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                          {description}
                        </Typography>
                      )}
                    </Box>
                    {isSelected && <CheckCircle2 size={16} />}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}

        {/* Confirmation Warning */}
        {showConfirmation && selectedStatus && (
          <Box
            sx={{
              p: 1.5,
              mb: 2,
              borderRadius: 'md',
              bgcolor: 'warning.softBg',
              border: '1px solid',
              borderColor: 'warning.300',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <AlertTriangle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
              <Typography level="body-sm" sx={{ color: 'warning.700' }}>
                {confirmationMessage}
              </Typography>
            </Stack>
          </Box>
        )}

        {/* Actions */}
        {availableStatuses.length > 0 && (
          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} justifyContent="flex-end">
            <Button
              variant="plain"
              color="neutral"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="primary"
              onClick={handleConfirm}
              disabled={!selectedStatus || isSaving}
              loading={isSaving}
              startDecorator={<ArrowRight size={16} />}
            >
              {showConfirmation ? 'Confirm Change' : 'Change Status'}
            </Button>
          </Stack>
        )}
      </ModalDialog>
    </Modal>
  );
}
