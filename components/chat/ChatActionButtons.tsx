'use client';

import { Button, Stack, IconButton, Tooltip } from '@mui/joy';
import {
  Eye,
  Edit,
  Trash2,
  Download,
  ExternalLink,
  FileText,
  Send,
  Check,
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
};

const actionColors: Record<string, 'primary' | 'success' | 'danger' | 'neutral' | 'warning'> = {
  view: 'primary',
  edit: 'neutral',
  delete: 'danger',
  download: 'success',
  navigate: 'neutral',
  send: 'primary',
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

  if (compact) {
    const displayActions = actions.slice(0, 3);

    return (
      <Stack direction="row" spacing={0.5}>
        {displayActions.map((action, index) => {
          const disabled = isDisabled(action, disabledActions);
          return (
            <Tooltip key={index} title={disabled ? 'Done' : action.label} placement="top">
              <IconButton
                size="sm"
                variant={disabled ? 'plain' : 'outlined'}
                color={disabled ? 'success' : (actionColors[action.type] || 'neutral')}
                onClick={() => !disabled && onAction(action)}
                disabled={disabled}
                sx={{
                  '--IconButton-size': '30px',
                  borderRadius: '8px',
                  transition: 'all 0.15s',
                  ...(disabled ? {
                    '&.Mui-disabled': {
                      opacity: 0.6,
                      color: 'success.500',
                    },
                  } : {
                    borderColor: 'neutral.outlinedBorder',
                    color: `${actionColors[action.type] || 'neutral'}.plainColor`,
                    '&:hover': {
                      bgcolor: `${actionColors[action.type] || 'neutral'}.softBg`,
                      borderColor: `${actionColors[action.type] || 'neutral'}.outlinedBorder`,
                    },
                  }),
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

  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
      {actions.map((action, index) => {
        const disabled = isDisabled(action, disabledActions);
        return (
          <Button
            key={index}
            size="sm"
            variant={disabled ? 'plain' : 'outlined'}
            color={disabled ? 'success' : (actionColors[action.type] || 'neutral')}
            startDecorator={disabled ? <Check size={14} /> : (actionIcons[action.type] || <FileText size={14} />)}
            onClick={() => !disabled && onAction(action)}
            disabled={disabled}
            sx={{
              fontWeight: 500,
              fontSize: '13px',
              borderRadius: '20px',
              px: 2,
              ...(disabled ? {
                '&.Mui-disabled': {
                  opacity: 0.6,
                  color: 'success.500',
                },
              } : {
                borderColor: 'neutral.outlinedBorder',
                color: 'text.primary',
                '&:hover': {
                  bgcolor: `${actionColors[action.type] || 'neutral'}.softBg`,
                  borderColor: `${actionColors[action.type] || 'neutral'}.outlinedBorder`,
                },
              }),
            }}
          >
            {disabled ? 'Sent' : action.label}
          </Button>
        );
      })}
    </Stack>
  );
}
