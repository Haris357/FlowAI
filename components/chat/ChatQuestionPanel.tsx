'use client';

import { useState } from 'react';
import { Box, Typography, Stack, IconButton, Button } from '@mui/joy';
import { X, ArrowRight, Check } from 'lucide-react';
import { ActionButton } from '@/lib/ai-config';

interface ChatQuestionPanelProps {
  question: string;
  actions: ActionButton[];
  onAction: (action: ActionButton) => void;
  onDismiss: () => void;
}

export default function ChatQuestionPanel({
  question,
  actions,
  onAction,
  onDismiss,
}: ChatQuestionPanelProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [executed, setExecuted] = useState(false);

  if (executed || actions.length === 0) return null;

  const handleSelect = (index: number) => {
    setSelected(index);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    setExecuted(true);
    onAction(actions[selected]);
  };

  const handleDirectClick = (index: number, action: ActionButton) => {
    // For binary choices (2 options), clicking executes immediately
    if (actions.length <= 2) {
      setSelected(index);
      setExecuted(true);
      onAction(action);
    } else {
      setSelected(index);
    }
  };

  const isBinary = actions.length <= 2;

  return (
    <Box
      sx={{
        mx: { xs: 2, sm: 3 },
        mb: 1.5,
        maxWidth: 768,
        marginInline: 'auto',
        width: '100%',
        animation: 'panelSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        '@keyframes panelSlideUp': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Box
        sx={{
          borderRadius: '14px',
          border: '1px solid',
          borderColor: 'neutral.outlinedBorder',
          bgcolor: 'background.surface',
          overflow: 'hidden',
          boxShadow: 'sm',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            pt: 1.5,
            pb: 1,
            borderBottom: '1px solid',
            borderColor: 'neutral.outlinedBorder',
          }}
        >
          <Typography
            level="body-sm"
            fontWeight={600}
            sx={{ color: 'text.primary', flex: 1, mr: 1 }}
          >
            {question}
          </Typography>
          <IconButton
            size="sm"
            variant="plain"
            color="neutral"
            onClick={onDismiss}
            sx={{ '--IconButton-size': '24px', borderRadius: '6px', opacity: 0.6, '&:hover': { opacity: 1 } }}
          >
            <X size={14} />
          </IconButton>
        </Box>

        {/* Options */}
        <Box>
          {actions.map((action, index) => {
            const isSelected = selected === index;
            return (
              <Box
                key={index}
                onClick={() => handleDirectClick(index, action)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.25,
                  cursor: 'pointer',
                  borderBottom: index < actions.length - 1 ? '1px solid' : 'none',
                  borderColor: 'neutral.outlinedBorder',
                  bgcolor: isSelected ? 'primary.softBg' : 'transparent',
                  transition: 'background 0.12s',
                  '&:hover': {
                    bgcolor: isSelected ? 'primary.softBg' : 'background.level1',
                  },
                }}
              >
                {/* Checkbox / radio indicator */}
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: isBinary ? '50%' : '4px',
                    border: '1.5px solid',
                    borderColor: isSelected ? 'primary.500' : 'neutral.outlinedBorder',
                    bgcolor: isSelected ? 'primary.500' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.12s',
                  }}
                >
                  {isSelected && <Check size={11} color="#fff" strokeWidth={3} />}
                </Box>

                <Typography
                  level="body-sm"
                  sx={{
                    color: isSelected ? 'primary.700' : 'text.primary',
                    fontWeight: isSelected ? 600 : 400,
                    flex: 1,
                  }}
                >
                  {action.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Footer — only shown for 3+ options */}
        {!isBinary && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.25,
              borderTop: '1px solid',
              borderColor: 'neutral.outlinedBorder',
              bgcolor: 'background.level1',
            }}
          >
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              {selected !== null ? '1 selected' : '0 selected'}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="sm"
                variant="plain"
                color="neutral"
                onClick={onDismiss}
                sx={{ fontWeight: 500, fontSize: '13px', borderRadius: '8px' }}
              >
                Skip
              </Button>
              <IconButton
                size="sm"
                variant="solid"
                color="primary"
                onClick={handleSubmit}
                disabled={selected === null}
                sx={{ '--IconButton-size': '32px', borderRadius: '8px' }}
              >
                <ArrowRight size={15} />
              </IconButton>
            </Stack>
          </Box>
        )}

        {/* Skip link for binary — subtle, below options */}
        {isBinary && (
          <Box sx={{ px: 2, py: 0.75, borderTop: '1px solid', borderColor: 'neutral.outlinedBorder', bgcolor: 'background.level1' }}>
            <Typography
              level="body-xs"
              onClick={onDismiss}
              sx={{ color: 'text.tertiary', cursor: 'pointer', '&:hover': { color: 'text.secondary' } }}
            >
              Skip
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
