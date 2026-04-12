'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Box, Stack, Typography } from '@mui/joy';

// ── Thinking word pool ──────────────────────────────────────────────────────
const THINKING_WORDS = [
  'analyzing', 'processing', 'querying', 'reviewing', 'calculating',
  'checking', 'loading', 'reading', 'indexing', 'scanning', 'fetching',
  'invoices', 'accounts', 'transactions', 'customers', 'vendors',
  'balances', 'entries', 'reports', 'payments', 'records', 'figures',
  'data', 'history', 'totals', 'context', 'details', 'numbers',
  'reasoning', 'thinking', 'computing', 'correlating', 'aggregating',
  'journal', 'ledger', 'currency', 'taxes', 'expenses', 'revenue',
  'overview', 'summary', 'matching', 'verifying', 'resolving',
];

function ThinkingAnimation() {
  const COUNT = 5;
  const [words, setWords] = useState<string[]>(() =>
    Array.from({ length: COUNT }, () => THINKING_WORDS[Math.floor(Math.random() * THINKING_WORDS.length)])
  );
  const [fading, setFading] = useState<Set<number>>(new Set());

  useEffect(() => {
    const cycle = () => {
      const idx = Math.floor(Math.random() * COUNT);
      setFading(prev => new Set(prev).add(idx));
      setTimeout(() => {
        setWords(prev => {
          const next = [...prev];
          let w: string;
          do { w = THINKING_WORDS[Math.floor(Math.random() * THINKING_WORDS.length)]; }
          while (w === next[idx]);
          next[idx] = w;
          return next;
        });
        setFading(prev => { const s = new Set(prev); s.delete(idx); return s; });
      }, 90);
    };
    const id = setInterval(cycle, 160);
    return () => clearInterval(id);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.75,
        alignItems: 'center',
        flexWrap: 'wrap',
        py: 0.25,
      }}
    >
      {words.map((word, i) => (
        <Typography
          key={i}
          level="body-xs"
          sx={{
            fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
            color: 'text.tertiary',
            opacity: fading.has(i) ? 0.08 : 0.55,
            transition: 'opacity 0.09s linear',
            letterSpacing: '0.01em',
            userSelect: 'none',
          }}
        >
          {word}
        </Typography>
      ))}
      <Box
        sx={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          bgcolor: 'primary.400',
          flexShrink: 0,
          animation: 'taPulse 1.2s ease-in-out infinite',
          '@keyframes taPulse': {
            '0%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
            '50%': { opacity: 1, transform: 'scale(1)' },
          },
        }}
      />
    </Box>
  );
}
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
  onSendMessage: (content: string, files?: File[], entityContext?: string, mentionedEntities?: { type: string; label: string; id: string }[]) => void;
  onExecuteToolAction?: (toolName: string, args: Record<string, any>, sourceMessageId?: string, actionKey?: string) => void;
  onSelectAction?: (prompt: string) => void;
  onClearForm?: () => void;
  sessionUsage?: SessionUsage;
  isLoading?: boolean;
  isLoadingMessages?: boolean;
  chatId?: string | null;
  focusTrigger?: number;
}

// ── Chat skeleton — shown while sessions load or a chat is being fetched ───────
const SKELETON_ROWS = [
  { isUser: false, lines: [72, 52] },
  { isUser: true,  lines: [48] },
  { isUser: false, lines: [88, 66, 40] },
  { isUser: true,  lines: [58, 36] },
  { isUser: false, lines: [76, 50] },
];

function ChatSkeleton() {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        bgcolor: 'background.body',
        '@keyframes skPulse': {
          '0%, 100%': { opacity: 0.3 },
          '50%': { opacity: 0.65 },
        },
      }}
    >
      <Box sx={{ flex: 1, overflowY: 'hidden', py: 2.5 }}>
        {SKELETON_ROWS.map((row, i) => (
          <Box
            key={i}
            sx={{
              maxWidth: 768,
              mx: 'auto',
              px: { xs: 1.5, sm: 2.5 },
              py: 0.75,
              display: 'flex',
              justifyContent: row.isUser ? 'flex-end' : 'flex-start',
              animation: `skPulse 1.5s ease-in-out ${i * 0.15}s infinite`,
            }}
          >
            {row.isUser ? (
              <Box
                sx={{
                  maxWidth: '60%',
                  bgcolor: 'background.level2',
                  borderRadius: '16px 16px 4px 16px',
                  px: 2,
                  py: 1.25,
                }}
              >
                <Stack spacing={0.65}>
                  {row.lines.map((w, j) => (
                    <Box key={j} sx={{ height: 10, borderRadius: 5, width: `${w}%`, bgcolor: 'neutral.300' }} />
                  ))}
                </Stack>
              </Box>
            ) : (
              <Box sx={{ maxWidth: '70%' }}>
                <Stack spacing={0.65}>
                  {row.lines.map((w, j) => (
                    <Box key={j} sx={{ height: 10, borderRadius: 5, width: `${w}%`, bgcolor: 'background.level2' }} />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        ))}
      </Box>
      <Box sx={{ pb: 2, px: { xs: 1.5, sm: 2.5 }, maxWidth: 768, mx: 'auto', width: '100%' }}>
        <Box
          sx={{
            height: 52,
            borderRadius: 'xl',
            bgcolor: 'background.level1',
            border: '1px solid',
            borderColor: 'neutral.outlinedBorder',
            animation: 'skPulse 1.5s ease-in-out infinite',
          }}
        />
      </Box>
    </Box>
  );
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
  isLoadingMessages = false,
  chatId,
  focusTrigger,
}: ChatMainProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(() => messages.length === 0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [internalFocusTrigger, setInternalFocusTrigger] = useState(0);
  const [cursorMessageId, setCursorMessageId] = useState<string | null>(null);
  const prevTypingRef = useRef(isAITyping);

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
        // Focus the bottom input after transition completes
        setInternalFocusTrigger(prev => prev + 1);
      }, 200);
      return () => clearTimeout(timer);
    } else if (messages.length === 0 && !showWelcome) {
      setShowWelcome(true);
    }
  }, [messages.length, showWelcome]);

  // Show cursor on last AI message when AI finishes responding
  useEffect(() => {
    if (prevTypingRef.current && !isAITyping) {
      const visible = messages.filter(m => !m.hidden);
      const lastAI = [...visible].reverse().find(m => m.role === 'assistant');
      if (lastAI) {
        setCursorMessageId(lastAI.id);
        const t = setTimeout(() => setCursorMessageId(null), 1800);
        return () => clearTimeout(t);
      }
    }
    prevTypingRef.current = isAITyping;
  }, [isAITyping, messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAITyping]);

  const handleSend = (content: string, files?: File[], entityContext?: string, mentionedEntities?: { type: string; label: string; id: string }[]) => {
    onSendMessage(content, files, entityContext, mentionedEntities);
  };

  const handleSelectAction = (prompt: string) => {
    onSelectAction?.(prompt);
  };

  const hasMessages = messages.length > 0;

  if (isLoading || isLoadingMessages) {
    return <ChatSkeleton />;
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
          showQuickActions={false}
          onSelectAction={handleSelectAction}
          sessionUsage={sessionUsage}
          chatId={chatId}
          focusTrigger={focusTrigger}
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
                    showCursor={message.id === cursorMessageId}
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
              animation: 'fadeIn 0.2s ease-out',
              '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(5px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
            }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box sx={{ flexShrink: 0, width: 56, height: 56, mt: 0.25 }}>
                  <FlowAIAvatar size={56} isThinking />
                </Box>
                <Box sx={{ pt: 1.5 }}>
                  <ThinkingAnimation />
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
          focusTrigger={(focusTrigger ?? 0) + internalFocusTrigger}
          questionPanel={panelActions && lastAiMessage ? {
            question: panelQuestion,
            actions: panelActions,
            onAction: (action) => {
              setDismissedIds(prev => { const next = new Set(prev); next.add(lastAiMessage.id); return next; });
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
            onDismiss: () => setDismissedIds(prev => { const next = new Set(prev); next.add(lastAiMessage.id); return next; }),
          } : undefined}
        />
      </Box>
    </Box>
  );
}
