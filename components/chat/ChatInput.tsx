'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Textarea,
  Typography,
  Tooltip,
  CircularProgress,
} from '@mui/joy';
import {
  Send,
  Plus,
  X,
  FileText,
  Receipt,
  Users,
  Calculator,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Bell,
  FileSpreadsheet,
  Image,
  File,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FormShortcut } from './FormShortcuts';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ChatAttachment } from '@/types';
import { validateFile, getFileCategory, getAcceptString } from '@/lib/chat-upload';

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

const FILE_TYPE_ICON: Record<string, React.ElementType> = {
  spreadsheet: FileSpreadsheet,
  document: FileText,
  pdf: FileText,
  image: Image,
};

interface ChatInputProps {
  onSend: (message: string, attachments?: File[]) => void;
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
  centered = false,
  selectedForm,
  onClearForm,
  initialValue = '',
  showQuickActions = false,
  onSelectAction,
}: ChatInputProps) {
  const { usage, plan, sessionRemaining, sessionPercentUsed, weeklyPercentUsed, sessionTimeLeft, weeklyRemaining, isPaidSubscriber, isTrial, isTrialExpired: trialExpired, trialTimeLeft } = useSubscription();
  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValue) setValue(initialValue);
  }, [initialValue]);

  const handleSend = () => {
    if ((!value.trim() && pendingFiles.length === 0) || disabled || uploading) return;
    onSend(value.trim(), pendingFiles.length > 0 ? pendingFiles : undefined);
    setValue('');
    setPendingFiles([]);
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

  const handleFileSelect = (accept?: string) => {
    if (!fileInputRef.current) return;
    fileInputRef.current.accept = accept || getAcceptString();
    fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // Reset so same file can be selected again

    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
    }

    setPendingFiles(prev => [...prev, ...files]);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        onChange={handleFileChange}
      />

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

        {/* Pending file previews */}
        {pendingFiles.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ px: 2, pt: 1.5, pb: 0.5, flexWrap: 'wrap', gap: 0.75 }}>
            {pendingFiles.map((file, i) => {
              const category = getFileCategory(file.type) || 'document';
              const FileIcon = FILE_TYPE_ICON[category] || File;
              return (
                <Chip
                  key={`${file.name}-${i}`}
                  size="sm"
                  variant="outlined"
                  color="neutral"
                  startDecorator={<FileIcon size={14} />}
                  endDecorator={
                    <IconButton
                      size="sm"
                      variant="plain"
                      color="neutral"
                      onClick={() => removePendingFile(i)}
                      sx={{ '--IconButton-size': '18px', minWidth: 18, minHeight: 18, borderRadius: '50%' }}
                    >
                      <X size={12} />
                    </IconButton>
                  }
                  sx={{ fontWeight: 500, fontSize: '0.75rem', maxWidth: 220, borderColor: 'divider' }}
                >
                  <Typography noWrap level="body-xs" sx={{ maxWidth: 160 }}>
                    {file.name}
                  </Typography>
                </Chip>
              );
            })}
          </Stack>
        )}

        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={
            pendingFiles.length > 0
              ? 'Add a message or send to analyze the file...'
              : selectedForm
                ? `Fill in the ${selectedForm.label.toLowerCase()} details...`
                : placeholder
          }
          minRows={1}
          maxRows={6}
          sx={{
            border: 'none',
            bgcolor: 'transparent',
            px: 2,
            pt: selectedForm || pendingFiles.length > 0 ? 0.5 : 1.5,
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
            {/* Attach file button */}
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              disabled={disabled || uploading}
              onClick={() => handleFileSelect()}
              sx={{ borderRadius: 'md', '&:hover': { bgcolor: 'background.level1' } }}
            >
              {uploading ? <CircularProgress size="sm" sx={{ '--CircularProgress-size': '18px' }} /> : <Plus size={18} />}
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {/* Flow AI v1 Badge with Usage Tooltip */}
            <Tooltip
              title={
                usage && (usage.sessionTokensUsed || 0) > 0 ? (
                  <Box sx={{ p: 0.5, minWidth: 180 }}>
                    <Typography level="body-xs" fontWeight={700} sx={{ mb: 1 }}>
                      Usage
                    </Typography>
                    <Stack spacing={1}>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                          <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Session</Typography>
                          <Typography level="body-xs" fontWeight={600}>{Math.round(sessionPercentUsed)}%</Typography>
                        </Stack>
                        <Box sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', width: `${Math.min(100, sessionPercentUsed)}%`, borderRadius: 2, bgcolor: sessionPercentUsed > 80 ? '#ef4444' : sessionPercentUsed > 50 ? '#f59e0b' : '#D97757', transition: 'width 0.3s ease' }} />
                        </Box>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px', mt: 0.25 }}>
                          {sessionTimeLeft ? `Resets in ${sessionTimeLeft}` : 'New session'}
                        </Typography>
                      </Box>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                          <Typography level="body-xs" sx={{ color: 'text.secondary' }}>Weekly</Typography>
                          <Typography level="body-xs" fontWeight={600}>{Math.round(weeklyPercentUsed)}%</Typography>
                        </Stack>
                        <Box sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', width: `${Math.min(100, weeklyPercentUsed)}%`, borderRadius: 2, bgcolor: weeklyPercentUsed > 80 ? '#ef4444' : '#D97757', transition: 'width 0.3s ease' }} />
                        </Box>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px', mt: 0.25 }}>
                          Resets Monday
                        </Typography>
                      </Box>
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
                {!trialExpired && usage && (usage.sessionTokensUsed || 0) > 0 && (
                  <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '11px' }}>
                    · {Math.round(sessionPercentUsed)}%
                  </Typography>
                )}
              </Box>
            </Tooltip>

            <IconButton
              size="sm"
              variant="solid"
              color="primary"
              onClick={handleSend}
              disabled={(!value.trim() && pendingFiles.length === 0) || disabled || uploading}
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
