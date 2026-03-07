'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Textarea,
  Typography,
  Tooltip,
} from '@mui/joy';
import {
  Send,
  Mic,
  MicOff,
  Paperclip,
  X,
  FileText,
  Receipt,
  Users,
  BookOpen,
  Calculator,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Bell,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FormShortcut } from './FormShortcuts';
import { useSubscription } from '@/contexts/SubscriptionContext';

const QUICK_ACTIONS = [
  { label: 'Overdue Invoices', icon: AlertCircle, prompt: 'Show me all overdue invoices' },
  { label: 'Unpaid Invoices', icon: Clock, prompt: 'Show all unpaid and sent invoices' },
  { label: 'Send Reminder', icon: Bell, prompt: 'Send payment reminders for overdue invoices' },
  { label: 'Create Invoice', icon: FileText, prompt: 'Help me create an invoice for ' },
  { label: 'Record Payment', icon: CheckCircle, prompt: 'Record a payment received for invoice ' },
  { label: 'Record Expense', icon: Receipt, prompt: 'I need to record an expense for ' },
  { label: 'Add Customer', icon: Users, prompt: 'Add a new customer named ' },
  { label: 'View Accounts', icon: Calculator, prompt: 'Show me the list of accounts' },
];

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  voiceEnabled?: boolean;
  centered?: boolean;
  selectedForm?: FormShortcut | null;
  onClearForm?: () => void;
  initialValue?: string;
  showQuickActions?: boolean;
  onSelectAction?: (prompt: string) => void;
  /** @deprecated sessionUsage prop ignored — uses SubscriptionContext directly */
  sessionUsage?: any;
}

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'How can I help you today?',
  voiceEnabled = true,
  centered = false,
  selectedForm,
  onClearForm,
  initialValue = '',
  showQuickActions = false,
  onSelectAction,
}: ChatInputProps) {
  const { usage, plan, sessionRemaining, sessionPercentUsed, sessionTimeLeft, weeklyRemaining, isPaidSubscriber, isTrial, isTrialExpired: trialExpired, trialTimeLeft } = useSubscription();
  const [value, setValue] = useState(initialValue);
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (initialValue) setValue(initialValue);
  }, [initialValue]);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
    onClearForm?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectQuickAction = (prompt: string) => {
    if (onSelectAction) onSelectAction(prompt);
    setValue(prompt);
  };

  const startVoiceInput = () => {
    const windowWithSpeech = window as any;
    const SpeechRecognitionAPI =
      windowWithSpeech.webkitSpeechRecognition || windowWithSpeech.SpeechRecognition;

    if (!SpeechRecognitionAPI) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setValue((prev) => prev + transcript);
    };
    recognition.onerror = () => {
      toast.error('Voice input failed. Please try again.');
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleClearForm = () => {
    setValue('');
    onClearForm?.();
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: centered ? 768 : '100%',
        mx: centered ? 'auto' : 0,
        px: { xs: 2, sm: 3 },
        py: 2,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          bgcolor: 'background.surface',
          borderRadius: 'xl',
          border: '1px solid',
          borderColor: isFocused ? 'primary.400' : 'divider',
          boxShadow: isFocused
            ? '0 0 0 3px rgba(217, 119, 87, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08)'
            : '0 2px 8px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s ease',
          overflow: 'hidden',
        }}
      >
        {/* Selected Form Tag */}
        {selectedForm && (
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              size="sm"
              variant="soft"
              color="primary"
              sx={{ '--Chip-gap': '4px', '--Chip-paddingInline': '8px', fontWeight: 600 }}
            >
              {selectedForm.label}
            </Chip>
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClearForm(); }}
              sx={{ '--IconButton-size': '20px', minWidth: 20, minHeight: 20, borderRadius: 'sm' }}
            >
              <X size={14} />
            </IconButton>
          </Box>
        )}

        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={selectedForm ? `Fill in the ${selectedForm.label.toLowerCase()} details...` : placeholder}
          minRows={1}
          maxRows={6}
          sx={{
            border: 'none',
            bgcolor: 'transparent',
            px: 2,
            pt: selectedForm ? 0.5 : 1.5,
            pb: 5.5,
            resize: 'none',
            '&:focus-within': { outline: 'none' },
            '--Textarea-focusedThickness': '0px',
            '--Textarea-focusedHighlight': 'transparent',
            '& textarea': { '&::placeholder': { color: 'text.tertiary' } },
          }}
        />

        {/* Bottom action bar */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            px: 1.5,
            py: 1,
            bgcolor: 'background.surface',
          }}
        >
          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              disabled={disabled}
              sx={{ borderRadius: 'md', '&:hover': { bgcolor: 'background.level1' } }}
            >
              <Paperclip size={18} />
            </IconButton>

            {voiceEnabled && (
              <IconButton
                size="sm"
                variant={isListening ? 'solid' : 'plain'}
                color={isListening ? 'danger' : 'neutral'}
                onClick={startVoiceInput}
                disabled={disabled}
                sx={{
                  borderRadius: 'md',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: isListening ? undefined : 'background.level1' },
                }}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </IconButton>
            )}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {/* Flow AI v1 Badge with Message Tooltip */}
            <Tooltip
              title={
                usage && (usage.sessionMessagesUsed || 0) > 0 ? (
                  <Box sx={{ p: 0.5 }}>
                    <Typography level="body-xs" fontWeight={700} sx={{ mb: 0.75 }}>
                      Session Usage
                    </Typography>
                    <Stack spacing={0.25}>
                      <Stack direction="row" justifyContent="space-between" spacing={3}>
                        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Session</Typography>
                        <Typography level="body-xs">{usage.sessionMessagesUsed} / {plan.sessionMessageLimit}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" spacing={3}>
                        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Remaining</Typography>
                        <Typography level="body-xs">{sessionRemaining}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" spacing={3}>
                        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Resets in</Typography>
                        <Typography level="body-xs">{sessionTimeLeft || 'New session'}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" spacing={3}>
                        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Weekly</Typography>
                        <Typography level="body-xs">{usage.weeklyMessagesUsed} / {plan.weeklyMessageLimit}</Typography>
                      </Stack>
                    </Stack>
                  </Box>
                ) : 'Flow AI v1'
              }
              placement="top"
              variant="outlined"
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.25,
                  py: 0.375,
                  borderRadius: 'md',
                  color: 'text.tertiary',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'default',
                  transition: 'color 0.15s',
                  '&:hover': { color: 'text.secondary' },
                }}
              >
                <Zap size={12} />
                <Typography level="body-xs" sx={{ fontWeight: 500, color: 'inherit' }}>
                  Flow AI v1
                </Typography>
                {isPaidSubscriber && (
                  <Chip size="sm" variant="soft" color={plan.id === 'max' ? 'success' : 'primary'} sx={{ fontSize: '10px', height: 18 }}>
                    {plan.name}
                  </Chip>
                )}
                {!isPaidSubscriber && isTrial && trialTimeLeft && (
                  <Typography level="body-xs" sx={{ color: 'primary.500', fontSize: '11px', fontWeight: 600 }}>
                    · Trial: {trialTimeLeft}
                  </Typography>
                )}
                {!isPaidSubscriber && trialExpired && (
                  <Typography level="body-xs" sx={{ color: 'danger.500', fontSize: '11px', fontWeight: 600 }}>
                    · Trial Expired
                  </Typography>
                )}
                {!trialExpired && usage && (usage.sessionMessagesUsed || 0) > 0 && (
                  <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '11px' }}>
                    · {usage.sessionMessagesUsed} / {plan.sessionMessageLimit}
                  </Typography>
                )}
              </Box>
            </Tooltip>

            <IconButton
              size="sm"
              variant="solid"
              color="primary"
              onClick={handleSend}
              disabled={!value.trim() || disabled}
              sx={{
                borderRadius: 'md',
                transition: 'all 0.2s',
                '&:not(:disabled):hover': { transform: 'scale(1.05)' },
                '&:not(:disabled):active': { transform: 'scale(0.95)' },
              }}
            >
              <Send size={18} />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Quick Action Chips */}
      {showQuickActions && (
        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          flexWrap="wrap"
          sx={{ mt: 2, gap: 1 }}
        >
          {QUICK_ACTIONS.map((action) => (
            <Chip
              key={action.label}
              variant="outlined"
              color="neutral"
              size="md"
              startDecorator={<action.icon size={14} />}
              onClick={() => handleSelectQuickAction(action.prompt)}
              sx={{
                cursor: 'pointer',
                borderColor: 'divider',
                fontWeight: 500,
                fontSize: '13px',
                transition: 'all 0.15s',
                '&:hover': {
                  borderColor: 'primary.400',
                  bgcolor: 'background.level1',
                  color: 'primary.plainColor',
                },
              }}
            >
              {action.label}
            </Chip>
          ))}
        </Stack>
      )}

      {!showQuickActions && (
        <Typography
          level="body-xs"
          sx={{ textAlign: 'center', color: 'text.tertiary', mt: 1, opacity: 0.7 }}
        >
          Flow AI can make mistakes. Please verify important information.
        </Typography>
      )}
    </Box>
  );
}
