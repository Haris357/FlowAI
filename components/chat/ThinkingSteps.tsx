'use client';

import { useState } from 'react';
import { Box, Stack, Typography } from '@mui/joy';
import { ChevronDown, ChevronRight, Check, Circle, Loader2 } from 'lucide-react';
import { ThinkingStep } from '@/types';
import FlowAIAvatar from './FlowAIAvatar';

interface ThinkingStepsProps {
  steps: ThinkingStep[];
}

function StepIcon({ status }: { status: ThinkingStep['status'] }) {
  if (status === 'completed') {
    return (
      <Box
        sx={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          bgcolor: 'success.500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Check size={10} color="#fff" strokeWidth={3} />
      </Box>
    );
  }
  if (status === 'in_progress') {
    return (
      <Box
        sx={{
          width: 16,
          height: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          animation: 'spin 1s linear infinite',
          '@keyframes spin': {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' },
          },
        }}
      >
        <Loader2 size={14} style={{ color: 'var(--joy-palette-primary-500)' }} />
      </Box>
    );
  }
  return (
    <Box
      sx={{
        width: 16,
        height: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Circle size={8} style={{ color: 'var(--joy-palette-neutral-400)' }} />
    </Box>
  );
}

export default function ThinkingSteps({ steps }: ThinkingStepsProps) {
  const [expanded, setExpanded] = useState(true);

  const activeStep = steps.find(s => s.status === 'in_progress');
  const allDone = steps.length > 0 && steps.every(s => s.status === 'completed');
  const headerLabel = allDone
    ? 'Finishing up...'
    : activeStep?.label || 'Thinking...';

  return (
    <Box
      sx={{
        maxWidth: 768,
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: 2,
        animation: 'fadeIn 0.25s ease-out',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box sx={{ flexShrink: 0, width: 56, height: 56 }}>
          <FlowAIAvatar size={56} isThinking />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography level="title-sm" fontWeight="lg" sx={{ mb: 0.75 }}>
            Flow AI
          </Typography>

          {/* Thinking accordion */}
          <Box
            sx={{
              bgcolor: 'background.level1',
              borderRadius: 'lg',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'neutral.200',
            }}
          >
            {/* Header row */}
            <Box
              onClick={() => setExpanded(prev => !prev)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 1.25,
                cursor: 'pointer',
                userSelect: 'none',
                '&:hover': { bgcolor: 'background.level2' },
                transition: 'background 0.15s',
              }}
            >
              {expanded ? (
                <ChevronDown size={14} style={{ color: 'var(--joy-palette-neutral-500)', flexShrink: 0 }} />
              ) : (
                <ChevronRight size={14} style={{ color: 'var(--joy-palette-neutral-500)', flexShrink: 0 }} />
              )}
              <Typography
                level="body-sm"
                sx={{
                  flex: 1,
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                {headerLabel}
              </Typography>
              {!allDone && (
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: 'primary.400',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 0.4 },
                      '50%': { opacity: 1 },
                    },
                  }}
                />
              )}
            </Box>

            {/* Steps list */}
            {expanded && steps.length > 0 && (
              <Box
                sx={{
                  px: 1.5,
                  pb: 1.25,
                  borderTop: '1px solid',
                  borderColor: 'neutral.100',
                }}
              >
                {steps.map((step) => (
                  <Stack
                    key={step.id}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{
                      py: 0.5,
                      animation: 'stepIn 0.2s ease-out',
                      '@keyframes stepIn': {
                        from: { opacity: 0, transform: 'translateX(-4px)' },
                        to: { opacity: 1, transform: 'translateX(0)' },
                      },
                    }}
                  >
                    <StepIcon status={step.status} />
                    <Typography
                      level="body-xs"
                      sx={{
                        color: step.status === 'completed'
                          ? 'text.tertiary'
                          : step.status === 'in_progress'
                          ? 'text.primary'
                          : 'text.tertiary',
                        fontWeight: step.status === 'in_progress' ? 500 : 400,
                      }}
                    >
                      {step.label}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
