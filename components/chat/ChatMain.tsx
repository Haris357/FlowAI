'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Box, Stack } from '@mui/joy';
import { ChatMessage as ChatMessageType, ThinkingStep } from '@/types';
import ChatMessage from './ChatMessage';
import ThinkingSteps from './ThinkingSteps';
import ChatWelcome from './ChatWelcome';
import ChatInput from './ChatInput';
import FlowAIAvatar from './FlowAIAvatar';
import { FormShortcut } from './FormShortcuts';
import { SessionUsage } from '@/contexts/ChatContext';
import { ActionButton } from '@/lib/ai-config';

interface ChatMainProps {
  messages: ChatMessageType[];
  isAITyping: boolean;
  isSendingMessage: boolean;
  thinkingSteps?: ThinkingStep[];
  userName?: string;
  userPhotoUrl?: string;
  showTimestamps?: boolean;
  voiceEnabled?: boolean;
  selectedForm?: FormShortcut | null;
  inputValue?: string;
  onSendMessage: (content: string, files?: File[]) => void;
  onExecuteToolAction?: (toolName: string, args: Record<string, any>, sourceMessageId?: string, actionKey?: string) => void;
  onSelectAction?: (prompt: string) => void;
  onClearForm?: () => void;
  sessionUsage?: SessionUsage;
  isLoading?: boolean;
  chatId?: string | null;
}

export default function ChatMain({
  messages,
  isAITyping,
  isSendingMessage,
  thinkingSteps = [],
  userName,
  userPhotoUrl,
  showTimestamps = true,
  voiceEnabled = true,
  selectedForm,
  inputValue = '',
  onSendMessage,
  onExecuteToolAction,
  onSelectAction,
  onClearForm,
  sessionUsage,
  isLoading = false,
  chatId,
}: ChatMainProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Only show the panel for actions that require a real decision — not just "View Details"
  const ACTIONABLE_TYPES = new Set(['send', 'pay', 'cancel', 'approve', 'confirm']);

  // Detect last AI message with standalone question-type actions — memoized to prevent re-renders
  const { lastAiMessage, panelActions, panelQuestion } = useMemo(() => {
    const visible = messages.filter(m => !m.hidden);
    const last = [...visible].reverse().find(m => m.role === 'assistant') ?? null;

    // Only surface actions that actually require a user decision (send, pay, cancel, etc.)
    // "view" and "navigate" actions are passive — showing them as a question is unnecessary
    const meaningfulActions = last?.actions?.filter(
      a => ACTIONABLE_TYPES.has(a.type) || a.toolCall || a.prompt
    ) ?? [];

    const actions = (meaningfulActions.length > 0 && !isAITyping && !dismissedIds.has(last?.id ?? ''))
      ? meaningfulActions : null;

    let question = 'What would you like to do?';
    if (actions && last?.content) {
      const sentences = last.content.split(/(?<=[.!?])\s+/);
      question = [...sentences].reverse().find(s => s.trim().endsWith('?'))?.trim() || question;
    }
    return { lastAiMessage: last, panelActions: actions, panelQuestion: question };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isAITyping, dismissedIds]);

  // Handle smooth transition from welcome to messages
  useEffect(() => {
    if (messages.length > 0 && showWelcome) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setShowWelcome(false);
        setIsTransitioning(false);
      }, 200);
      return () => clearTimeout(timer);
    } else if (messages.length === 0 && !showWelcome) {
      setShowWelcome(true);
    }
  }, [messages.length, showWelcome]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAITyping]);

  const handleSend = (content: string, files?: File[]) => {
    onSendMessage(content, files);
  };

  const handleSelectAction = (prompt: string) => {
    onSelectAction?.(prompt);
  };

  const hasMessages = messages.length > 0;

  // Loading state: show skeleton while chat is being loaded
  if (isLoading) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          bgcolor: 'background.body',
        }}
      >
        <Box sx={{ flex: 1, py: 3 }}>
          {/* Skeleton message bubbles */}
          {[1, 2, 3].map((i) => (
            <Box
              key={i}
              sx={{
                maxWidth: 768,
                mx: 'auto',
                px: { xs: 1.5, sm: 2.5 },
                py: 1,
                display: 'flex',
                gap: 1.5,
                flexDirection: i % 2 === 0 ? 'row-reverse' : 'row',
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: 'background.level2',
                  flexShrink: 0,
                  animation: 'skeletonPulse 1.5s ease-in-out infinite',
                  '@keyframes skeletonPulse': {
                    '0%, 100%': { opacity: 0.4 },
                    '50%': { opacity: 0.8 },
                  },
                }}
              />
              <Stack spacing={0.75} sx={{ flex: 1, maxWidth: i % 2 === 0 ? '60%' : '70%' }}>
                {[90, 65, i === 3 ? 40 : 0].filter(Boolean).map((w, j) => (
                  <Box
                    key={j}
                    sx={{
                      height: 12,
                      borderRadius: 1,
                      width: `${w}%`,
                      bgcolor: 'background.level2',
                      animation: `skeletonPulse 1.5s ease-in-out ${j * 0.15}s infinite`,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  // Empty state: centered welcome + input
  if (!hasMessages && showWelcome) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          minHeight: 0,
          bgcolor: 'background.body',
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
          transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
        }}
      >
        <ChatWelcome userName={userName} />
        <ChatInput
          onSend={handleSend}
          disabled={isSendingMessage}
          voiceEnabled={voiceEnabled}
          centered={true}
          placeholder="How can I help you today?"
          selectedForm={selectedForm}
          onClearForm={onClearForm}
          initialValue={inputValue}
          showQuickActions={true}
          onSelectAction={handleSelectAction}
          sessionUsage={sessionUsage}
          chatId={chatId}
        />
      </Box>
    );
  }

  // Messages state: messages scroll + input at bottom
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        bgcolor: 'background.body',
      }}
    >
      {/* Messages Area */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'neutral.200',
            borderRadius: 4,
            '&:hover': {
              bgcolor: 'neutral.300',
            },
          },
        }}
      >
        <Box
          sx={{
            py: 2,
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
            transition: 'opacity 0.3s ease-out 0.1s, transform 0.3s ease-out 0.1s',
          }}
        >
          {(() => {
            const visible = messages.filter(m => !m.hidden);
            // Find the index of the last AI message — buttons only show on it
            let lastAiIndex = -1;
            for (let i = visible.length - 1; i >= 0; i--) {
              if (visible[i].role === 'assistant') { lastAiIndex = i; break; }
            }
            return visible.map((message, index) => {
              // Find the nearest preceding user message for feedback context
              const precedingUserMessage = message.role === 'assistant'
                ? [...visible].slice(0, index).reverse().find(m => m.role === 'user')?.content || ''
                : '';
              return (
                <Box
                  key={message.id}
                  sx={{
                    animation: `messageSlideIn 0.3s ease-out ${index * 0.05}s both`,
                    '@keyframes messageSlideIn': {
                      '0%': { opacity: 0, transform: 'translateY(10px)' },
                      '100%': { opacity: 1, transform: 'translateY(0)' },
                    },
                  }}
                >
                  <ChatMessage
                    message={message}
                    showTimestamp={showTimestamps}
                    userPhotoUrl={userPhotoUrl}
                    userName={userName}
                    richData={message.richData}
                    actions={panelActions && message.id === lastAiMessage?.id ? [] : message.actions}
                    followUp={message.followUp}
                    onSendMessage={onSendMessage}
                    onExecuteToolAction={onExecuteToolAction}
                    showSuggestions={index === lastAiIndex && !isAITyping}
                    precedingUserMessage={precedingUserMessage}
                  />
                </Box>
              );
            });
          })()}

          {/* Typing indicator or thinking steps accordion (when tools are running) */}
          {isAITyping && (thinkingSteps.length > 0 ? (
            <ThinkingSteps steps={thinkingSteps} />
          ) : (
            <Box sx={{
              maxWidth: 768, mx: 'auto', px: { xs: 1.5, sm: 2.5 }, py: 0.5,
              animation: 'fadeIn 0.25s ease-out',
              '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
            }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box sx={{ flexShrink: 0, width: 56, height: 56, mt: 0.25 }}>
                  <FlowAIAvatar size={56} isThinking />
                </Box>
                <Box sx={{ pt: 0.5 }}>
                  <Stack spacing={0.75} sx={{ minWidth: 140 }}>
                    {[85, 60, 40].map((w, i) => (
                      <Box key={i} sx={{
                        height: 6, borderRadius: 3, width: `${w}%`,
                        background: 'linear-gradient(90deg, var(--joy-palette-neutral-200) 25%, var(--joy-palette-neutral-100) 50%, var(--joy-palette-neutral-200) 75%)',
                        backgroundSize: '200% 100%',
                        animation: `shimmer 1.5s ease-in-out ${i * 0.15}s infinite`,
                        '@keyframes shimmer': { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
                      }} />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          ))}

          {/* FlowAI Avatar — shown once below the last AI message when not typing */}
          {!isAITyping && messages.filter(m => !m.hidden).length > 0 &&
            messages.filter(m => !m.hidden).slice(-1)[0]?.role === 'assistant' && (
            <Box sx={{ maxWidth: 768, mx: 'auto', px: { xs: 1.5, sm: 2.5 }, pt: 0.5, pb: 1 }}>
              <FlowAIAvatar size={56} />
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>
      </Box>

      {/* Input Area - at bottom */}
      <Box sx={{ bgcolor: 'transparent', pb: 2 }}>
        <ChatInput
          onSend={handleSend}
          disabled={isSendingMessage}
          voiceEnabled={voiceEnabled}
          centered={true}
          placeholder="Message Flowbooks..."
          selectedForm={selectedForm}
          onClearForm={onClearForm}
          initialValue={inputValue}
          showQuickActions={false}
          sessionUsage={sessionUsage}
          chatId={chatId}
          questionPanel={panelActions && lastAiMessage ? {
            question: panelQuestion,
            actions: panelActions,
            onAction: (action) => {
              setDismissedIds(prev => new Set([...prev, lastAiMessage.id]));
              if (action.toolCall && action.entityId && onExecuteToolAction) {
                const toolArgs: Record<string, Record<string, any>> = {
                  send_invoice: { invoiceId: action.entityId },
                  change_invoice_status: { invoiceId: action.entityId, newStatus: 'sent' },
                  mark_invoice_paid: { invoiceId: action.entityId, newStatus: 'paid' },
                  cancel_invoice: { invoiceId: action.entityId, newStatus: 'cancelled' },
                  change_bill_status: { billId: action.entityId, newStatus: 'paid' },
                };
                const args = toolArgs[action.toolCall] || { id: action.entityId };
                onExecuteToolAction(action.toolCall, args, lastAiMessage.id, `${action.toolCall}-${action.entityId}`);
              } else if (action.type === 'navigate') {
                const routes: Record<string, string> = {
                  customer: '/customers', vendor: '/vendors', invoice: '/invoices',
                  bill: '/bills', transaction: '/transactions', account: '/accounts',
                };
                const route = routes[action.entityType || ''];
                if (route) window.location.href = route;
              } else if (action.prompt) {
                onSendMessage(action.prompt);
              }
            },
            onDismiss: () => setDismissedIds(prev => new Set([...prev, lastAiMessage.id])),
          } : undefined}
        />
      </Box>
    </Box>
  );
}
