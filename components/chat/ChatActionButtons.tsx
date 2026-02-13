'use client';

import { Button, Stack, IconButton, Tooltip } from '@mui/joy';
import {
  Eye,
  Edit,
  Trash2,
  Download,
  ExternalLink,
  FileText,
  Plus,
} from 'lucide-react';
import { ActionButton } from '@/lib/ai-config';

interface ChatActionButtonsProps {
  actions: ActionButton[];
  onAction: (action: ActionButton) => void;
  compact?: boolean;
}

const actionIcons: Record<string, React.ReactNode> = {
  view: <Eye size={14} />,
  edit: <Edit size={14} />,
  delete: <Trash2 size={14} />,
  download: <Download size={14} />,
  navigate: <ExternalLink size={14} />,
};

const actionColors: Record<string, 'primary' | 'success' | 'danger' | 'neutral' | 'warning'> = {
  view: 'primary',
  edit: 'neutral',
  delete: 'danger',
  download: 'success',
  navigate: 'neutral',
};

export default function ChatActionButtons({
  actions,
  onAction,
  compact = false,
}: ChatActionButtonsProps) {
  if (!actions || actions.length === 0) return null;

  // In compact mode, only show first 2-3 actions as icon buttons
  if (compact) {
    const displayActions = actions.slice(0, 3);

    return (
      <Stack direction="row" spacing={0.5}>
        {displayActions.map((action, index) => (
          <Tooltip key={index} title={action.label} placement="top">
            <IconButton
              size="sm"
              variant="soft"
              color={actionColors[action.type] || 'neutral'}
              onClick={() => onAction(action)}
              sx={{
                '--IconButton-size': '28px',
              }}
            >
              {actionIcons[action.type] || <FileText size={14} />}
            </IconButton>
          </Tooltip>
        ))}
      </Stack>
    );
  }

  // Full mode with labeled buttons
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
      {actions.map((action, index) => (
        <Button
          key={index}
          size="sm"
          variant="soft"
          color={actionColors[action.type] || 'neutral'}
          startDecorator={actionIcons[action.type] || <FileText size={14} />}
          onClick={() => onAction(action)}
          sx={{
            fontWeight: 500,
            fontSize: '13px',
          }}
        >
          {action.label}
        </Button>
      ))}
    </Stack>
  );
}
