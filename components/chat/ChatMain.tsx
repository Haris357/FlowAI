'use client';

import { useRef, useEffect, useState } from 'react';
import { Box, Stack, Typography } from '@mui/joy';
import { ChatMessage as ChatMessageType, ThinkingStep } from '@/types';
import ChatMessage from './ChatMessage';
import ThinkingSteps from './ThinkingSteps';
import ChatWelcome from './ChatWelcome';
import ChatInput from './ChatInput';
import MemoryIndicator from './MemoryIndicator';
import FlowAIAvatar from './FlowAIAvatar';
import { FormShortcut } from './FormShortcuts';
import { TokenUsage } from '@/contexts/ChatContext';

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
  onSendMessage: (content: string) => void;
  onExecuteToolAction?: (toolName: string, args: Record<string, any>, sourceMessageId?: string, actionKey?: string) => void;
  onSelectAction?: (prompt: string) => void;
  onClearForm?: () => void;
  tokenUsage?: TokenUsage;
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
  tokenUsage,
}: ChatMainProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  const handleSend = (content: string) => {
    onSendMessage(content);
  };

  const handleSelectAction = (prompt: string) => {
    onSelectAction?.(prompt);
  };

  const hasMessages = messages.length > 0;

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
          tokenUsage={tokenUsage}
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
          {messages.filter(m => !m.hidden).map((message, index) => (
            <Box
              key={message.id}
              sx={{
                animation: `messageSlideIn 0.3s ease-out ${index * 0.05}s both`,
                '@keyframes messageSlideIn': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(10px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              <ChatMessage
                message={message}
                showTimestamp={showTimestamps}
                userPhotoUrl={userPhotoUrl}
                userName={userName}
                richData={message.richData}
                actions={message.actions}
                followUp={message.followUp}
                onSendMessage={onSendMessage}
                onExecuteToolAction={onExecuteToolAction}
              />
            </Box>
          ))}

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
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.surface',
          pb: 2,
        }}
      >
        {/* Memory Indicator */}
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1, pb: 1 }}>
          <MemoryIndicator />
        </Box>

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
          tokenUsage={tokenUsage}
        />
      </Box>
    </Box>
  );
}
