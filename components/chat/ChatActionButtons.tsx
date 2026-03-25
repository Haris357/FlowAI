'use client';

import { Button, Stack, IconButton, Tooltip, Box, Typography } from '@mui/joy';
import {
  Eye,
  Download,
  Send,
  Check,
  X,
  FileText,
  CreditCard,
  Ban,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { ActionButton } from '@/lib/ai-config';

interface ChatActionButtonsProps {
  actions: ActionButton[];
  onAction: (action: ActionButton) => void;
  compact?: boolean;
  disabledActions?: Set<string>;
}

const actionIcons: Record<string, React.ReactNode> = {
  view: <Eye size={14} />,
  edit: <Edit size={14} />,
  delete: <Trash2 size={14} />,
  download: <Download size={14} />,
  navigate: <ExternalLink size={14} />,
  send: <Send size={14} />,
  pay: <CreditCard size={14} />,
  cancel: <Ban size={14} />,
  confirm: <Check size={14} />,
  reject: <X size={14} />,
};

const actionColors: Record<string, 'primary' | 'success' | 'danger' | 'neutral' | 'warning'> = {
  view: 'neutral',
  edit: 'neutral',
  delete: 'danger',
  download: 'neutral',
  navigate: 'neutral',
  send: 'primary',
  pay: 'success',
  cancel: 'danger',
  confirm: 'success',
  reject: 'danger',
};

function isDisabled(action: ActionButton, disabledActions?: Set<string>): boolean {
  if (!disabledActions || !action.toolCall || !action.entityId) return false;
  return disabledActions.has(`${action.toolCall}-${action.entityId}`);
}

export default function ChatActionButtons({
  actions,
  onAction,
  compact = false,
  disabledActions,
}: ChatActionButtonsProps) {
  if (!actions || actions.length === 0) return null;

  // Compact mode: inline text actions shown next to entity cards
  if (compact) {
    return (
      <Stack direction="row" spacing={0.25} alignItems="center">
        {actions.slice(0, 3).map((action, index) => {
          const disabled = isDisabled(action, disabledActions);
          const color = actionColors[action.type] || 'neutral';
          return (
            <Tooltip key={index} title={disabled ? 'Done' : action.label} placement="top" size="sm">
              <IconButton
                size="sm"
                variant="plain"
                color={disabled ? 'success' : color}
                onClick={() => !disabled && onAction(action)}
                sx={{
                  '--IconButton-size': '32px',
                  borderRadius: '8px',
                  color: disabled
                    ? 'var(--joy-palette-success-500)'
                    : color === 'primary'
                    ? 'var(--joy-palette-primary-500)'
                    : color === 'danger'
                    ? 'var(--joy-palette-danger-400)'
                    : 'var(--joy-palette-neutral-500)',
                  opacity: disabled ? 0.5 : 0.75,
                  transition: 'all 0.15s',
                  '&:hover': {
                    opacity: 1,
                    bgcolor: `${color}.softBg`,
                  },
                }}
              >
                {disabled ? <Check size={14} /> : (actionIcons[action.type] || <FileText size={14} />)}
              </IconButton>
            </Tooltip>
          );
        })}
      </Stack>
    );
  }

  // Full mode: question-style option buttons
  // Detect if these look like yes/no question answers (short labels, 2-3 actions)
  const isQuestionStyle = actions.length <= 4 && actions.every(a => a.label.length < 40);

  if (isQuestionStyle) {
    return (
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
        {actions.map((action, index) => {
          const disabled = isDisabled(action, disabledActions);
          const color = actionColors[action.type] || 'neutral';
          const isPrimary = index === 0 || action.type === 'send' || action.type === 'confirm' || action.type === 'pay';
          return (
            <Button
              key={index}
              size="sm"
              variant={disabled ? 'soft' : isPrimary ? 'outlined' : 'outlined'}
              color={disabled ? 'success' : color}
              startDecorator={disabled ? <Check size={13} /> : (actionIcons[action.type] || <FileText size={13} />)}
              onClick={() => !disabled && onAction(action)}
              sx={{
                fontWeight: 500,
                fontSize: '13px',
                borderRadius: '8px',
                px: 1.75,
                py: 0.625,
                minHeight: 34,
                borderColor: disabled ? 'transparent' : 'neutral.outlinedBorder',
                color: disabled ? 'success.600' : 'text.primary',
                bgcolor: 'background.surface',
                transition: 'all 0.15s',
                '&:hover': disabled ? {} : {
                  borderColor: `${color}.outlinedBorder`,
                  bgcolor: `${color}.softBg`,
                  color: `${color}.plainColor`,
                },
                '&.Mui-disabled': {
                  opacity: 0.7,
                  pointerEvents: 'none',
                },
              }}
            >
              {disabled ? 'Done' : action.label}
            </Button>
          );
        })}
      </Stack>
    );
  }

  // Fallback for many actions
  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
      {actions.map((action, index) => {
        const disabled = isDisabled(action, disabledActions);
        const color = actionColors[action.type] || 'neutral';
        return (
          <Button
            key={index}
            size="sm"
            variant="outlined"
            color={disabled ? 'success' : color}
            startDecorator={disabled ? <Check size={13} /> : (actionIcons[action.type] || <FileText size={13} />)}
            onClick={() => !disabled && onAction(action)}
            sx={{
              fontWeight: 500,
              fontSize: '13px',
              borderRadius: '8px',
              px: 1.75,
              borderColor: 'neutral.outlinedBorder',
              color: 'text.primary',
              bgcolor: 'background.surface',
              '&:hover': { bgcolor: `${color}.softBg`, borderColor: `${color}.outlinedBorder` },
              '&.Mui-disabled': { opacity: 0.6 },
            }}
          >
            {disabled ? 'Done' : action.label}
          </Button>
        );
      })}
    </Stack>
  );
}
