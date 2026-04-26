'use client';

import { useState, useEffect, useRef, KeyboardEvent, useCallback } from 'react';
import {
  Box, Chip, IconButton, Stack, Textarea, Typography, Tooltip, CircularProgress,
} from '@mui/joy';
import {
  Send, Paperclip, X, FileText, Receipt, Users, Calculator, Zap,
  AlertCircle, CheckCircle, Clock, Bell, FileSpreadsheet, Image, File, Check, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MemoryIndicator from './MemoryIndicator';
import { FormShortcut } from './FormShortcuts';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { validateFile, getFileCategory, getAcceptString } from '@/lib/chat-upload';
import { ActionButton } from '@/lib/ai-config';
import { searchCommands, SlashCommand } from '@/lib/commands';
import { useEntitySearch, EntityResult, EntityType } from '@/hooks/useEntitySearch';
import { ContextTag } from './ContextTagPicker';
import CommandPalette from './CommandPalette';
import EntityMentionPicker from './EntityMentionPicker';
import ContextTagPicker from './ContextTagPicker';

// ─── Quick Actions ────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Overdue Invoices', icon: AlertCircle, prompt: 'Show me all overdue invoices' },
  { label: 'Unpaid Invoices',  icon: Clock,        prompt: 'Show all unpaid and sent invoices' },
  { label: 'Send Reminder',   icon: Bell,          prompt: 'Send payment reminders for overdue invoices' },
  { label: 'Create Invoice',  icon: FileText,      prompt: 'Help me create an invoice for ' },
  { label: 'Record Payment',  icon: CheckCircle,   prompt: 'Record a payment received for invoice ' },
  { label: 'Record Expense',  icon: Receipt,       prompt: 'I need to record an expense for ' },
  { label: 'Add Customer',    icon: Users,         prompt: 'Add a new customer named ' },
  { label: 'View Accounts',   icon: Calculator,    prompt: 'Show me the list of accounts' },
];

const FILE_TYPE_ICON: Record<string, React.ElementType> = {
  spreadsheet: FileSpreadsheet,
  document: FileText,
  pdf: FileText,
  image: Image,
};

// ─── Inline Question Panel ────────────────────────────────────────────────────
interface QuestionPanelProps {
  question: string;
  actions: ActionButton[];
  onAction: (action: ActionButton) => void;
  onDismiss: () => void;
}

function InlineQuestionPanel({ question, actions, onAction, onDismiss }: QuestionPanelProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  if (done) return null;
  const isBinary = actions.length <= 2;
  const handleClick = (i: number, action: ActionButton) => {
    if (isBinary) { setDone(true); onAction(action); }
    else setSelected(i);
  };
  const handleSubmit = () => {
    if (selected === null) return;
    setDone(true); onAction(actions[selected]);
  };
  return (
    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', animation: 'slideDown 0.18s ease-out', '@keyframes slideDown': { from: { opacity: 0, transform: 'translateY(-6px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1.25, pb: 0.75 }}>
        <Typography level="body-xs" fontWeight={600} sx={{ color: 'text.primary' }}>{question}</Typography>
        <IconButton size="sm" variant="plain" color="neutral" onClick={onDismiss} sx={{ '--IconButton-size': '20px', borderRadius: '6px', opacity: 0.5, '&:hover': { opacity: 1 } }}>
          <X size={12} />
        </IconButton>
      </Box>
      <Stack spacing={0} sx={{ pb: isBinary ? 0.75 : 0 }}>
        {actions.map((action, i) => {
          const isSelected = selected === i;
          return (
            <Box key={i} onClick={() => handleClick(i, action)} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 0.75, cursor: 'pointer', bgcolor: isSelected ? 'primary.softBg' : 'transparent', transition: 'background 0.1s', '&:hover': { bgcolor: isSelected ? 'primary.softBg' : 'background.level1' } }}>
              <Box sx={{ width: 15, height: 15, borderRadius: isBinary ? '50%' : '3px', flexShrink: 0, border: '1.5px solid', borderColor: isSelected ? 'primary.500' : 'neutral.outlinedBorder', bgcolor: isSelected ? 'primary.500' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s' }}>
                {isSelected && <Check size={9} color="#fff" strokeWidth={3} />}
              </Box>
              <Typography level="body-xs" sx={{ color: isSelected ? 'primary.700' : 'text.secondary', fontWeight: isSelected ? 600 : 400 }}>{action.label}</Typography>
            </Box>
          );
        })}
      </Stack>
      {!isBinary && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 0.75, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.level1' }}>
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{selected !== null ? '1 selected' : '0 selected'}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography level="body-xs" onClick={onDismiss} sx={{ color: 'text.tertiary', cursor: 'pointer', '&:hover': { color: 'text.secondary' } }}>Skip</Typography>
            <IconButton size="sm" variant="solid" color="primary" onClick={handleSubmit} disabled={selected === null} sx={{ '--IconButton-size': '24px', borderRadius: '6px' }}><ArrowRight size={13} /></IconButton>
          </Stack>
        </Box>
      )}
      {isBinary && (
        <Box sx={{ px: 2, pb: 0.75 }}>
          <Typography level="body-xs" onClick={onDismiss} sx={{ color: 'text.tertiary', cursor: 'pointer', display: 'inline', '&:hover': { color: 'text.secondary' } }}>Skip</Typography>
        </Box>
      )}
    </Box>
  );
}

// ─── Active Chip type ─────────────────────────────────────────────────────────
type ActiveChip =
  | { kind: 'entity'; result: EntityResult }
  | { kind: 'tag';    tag: ContextTag };

// ─── Picker mode ─────────────────────────────────────────────────────────────
type PickerMode = 'command' | 'mention' | 'tag' | null;

// ─── Props ────────────────────────────────────────────────────────────────────
interface ChatInputProps {
  onSend: (message: string, attachments?: File[], entityContext?: string, mentionedEntities?: { type: string; label: string; id: string }[]) => void;
  disabled?: boolean;
  placeholder?: string;
  voiceEnabled?: boolean;
  centered?: boolean;
  selectedForm?: FormShortcut | null;
  onClearForm?: () => void;
  initialValue?: string;
  showQuickActions?: boolean;
  onSelectAction?: (prompt: string) => void;
  /** @deprecated */
  sessionUsage?: any;
  questionPanel?: QuestionPanelProps;
  chatId?: string | null;
  onCompacting?: (isCompacting: boolean) => void;
  focusTrigger?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Find the trigger query after `/`, `@`, or `#` from a text + caret position.
 *  Triggers ONLY when the character is at the start of a word (preceded by space/newline or at position 0).
 *  This prevents email addresses like "user@gmail.com" from firing the mention picker.
 */
function getTriggerState(text: string, caret: number): { mode: PickerMode; query: string; triggerStart: number } | null {
  const before = text.slice(0, caret);
  // Walk backwards to find trigger character
  for (let i = before.length - 1; i >= 0; i--) {
    const ch = before[i];
    if (ch === ' ' || ch === '\n') break;  // word boundary — stop
    if (ch === '/') {
      // Only trigger if / is at word start (preceded by space/newline or is first char)
      if (i === 0 || before[i - 1] === ' ' || before[i - 1] === '\n') {
        return { mode: 'command', query: before.slice(i + 1), triggerStart: i };
      }
      break;
    }
    if (ch === '@') {
      // Only trigger if @ is at word start (preceded by space/newline or is first char)
      // This prevents email addresses like "user@gmail.com" from triggering
      if (i === 0 || before[i - 1] === ' ' || before[i - 1] === '\n') {
        return { mode: 'mention', query: before.slice(i + 1), triggerStart: i };
      }
      break;
    }
    if (ch === '#') {
      // Only trigger if # is at word start
      if (i === 0 || before[i - 1] === ' ' || before[i - 1] === '\n') {
        return { mode: 'tag', query: before.slice(i + 1), triggerStart: i };
      }
      break;
    }
  }
  return null;
}

/** Replace the trigger+query in text with a new string, returning new text + caret */
function replaceTrigger(
  text: string,
  caret: number,
  triggerStart: number,
  replacement: string,
): { text: string; caret: number } {
  const newText = text.slice(0, triggerStart) + replacement + text.slice(caret);
  return { text: newText, caret: triggerStart + replacement.length };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChatInput({
  onSend, disabled = false,
  placeholder = 'How can I help you today?',
  centered = false, selectedForm, onClearForm,
  initialValue = '', showQuickActions = false, onSelectAction,
  questionPanel, chatId, onCompacting, focusTrigger,
}: ChatInputProps) {
  const { usage, plan, sessionRemaining, sessionPercentUsed, weeklyPercentUsed, sessionTimeLeft, weeklyRemaining, isPaidSubscriber, isTrial, isTrialExpired: trialExpired, trialTimeLeft } = useSubscription();

  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Injected chips (entity mentions + context tags)
  const [chips, setChips] = useState<ActiveChip[]>([]);
  // Hidden context string injected before the message
  const [injectedContext, setInjectedContext] = useState('');

  // Picker state
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [triggerStart, setTriggerStart] = useState(0);

  // Entity search hook
  const { results: entityResults, loading: entityLoading, search: searchEntities, clear: clearEntitySearch, prewarm } = useEntitySearch();

  // Pre-warm entity cache on mount
  useEffect(() => { prewarm(['customer', 'vendor', 'invoice']); }, [prewarm]);

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [initialValue]);

  // Auto-focus on mount
  useEffect(() => { setTimeout(() => textareaRef.current?.focus(), 100); }, []);

  // Focus when parent signals (e.g. new chat clicked)
  useEffect(() => {
    if (focusTrigger) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [focusTrigger]);

  // Focus when AI finishes responding (disabled goes true→false)
  const prevDisabledRef = useRef(disabled);
  useEffect(() => {
    if (prevDisabledRef.current && !disabled) {
      textareaRef.current?.focus();
    }
    prevDisabledRef.current = disabled;
  }, [disabled]);

  // ─── Input change handler — detect trigger characters ─────────────────────
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setValue(newVal);

    const caret = e.target.selectionStart ?? newVal.length;
    const trigger = getTriggerState(newVal, caret);

    if (!trigger) {
      setPickerMode(null);
      clearEntitySearch();
      return;
    }

    setPickerMode(trigger.mode);
    setPickerQuery(trigger.query);
    setTriggerStart(trigger.triggerStart);

    if (trigger.mode === 'mention') {
      const types: EntityType[] = ['customer', 'vendor', 'invoice', 'bill', 'employee', 'quote', 'transaction', 'account'];
      searchEntities(trigger.query, types);
    }
  }, [clearEntitySearch, searchEntities]);

  // Also update picker on selection change (arrow keys)
  const handleSelect = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const caret = ta.selectionStart ?? value.length;
    const trigger = getTriggerState(value, caret);
    if (!trigger) {
      setPickerMode(null);
      return;
    }
    if (trigger.mode !== pickerMode || trigger.query !== pickerQuery) {
      setPickerMode(trigger.mode);
      setPickerQuery(trigger.query);
      setTriggerStart(trigger.triggerStart);
      if (trigger.mode === 'mention') {
        const types: EntityType[] = ['customer', 'vendor', 'invoice', 'bill', 'employee', 'quote', 'transaction', 'account'];
        searchEntities(trigger.query, types);
      }
    }
  }, [value, pickerMode, pickerQuery, searchEntities]);

  // ─── Command selected ─────────────────────────────────────────────────────
  const handleCommandSelect = useCallback((cmd: SlashCommand) => {
    if (cmd.action === 'function' && cmd.fn === 'clearChat') {
      setValue('');
      setPickerMode(null);
      return;
    }
    if (cmd.prompt) {
      const ta = textareaRef.current;
      const caret = ta?.selectionStart ?? value.length;
      const { text, caret: newCaret } = replaceTrigger(value, caret, triggerStart, cmd.prompt);
      setValue(text);
      setPickerMode(null);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = newCaret;
          textareaRef.current.selectionEnd = newCaret;
          textareaRef.current.focus();
        }
      }, 0);
    }
  }, [value, triggerStart]);

  // ─── Entity mention selected ───────────────────────────────────────────────
  const handleEntitySelect = useCallback((result: EntityResult) => {
    const ta = textareaRef.current;
    const caret = ta?.selectionStart ?? value.length;
    // Remove the @query from textarea — entity shown as chip above input
    const { text, caret: newCaret } = replaceTrigger(value, caret, triggerStart, '');
    setValue(text);

    // Add chip
    const newChips = [...chips, { kind: 'entity' as const, result }];
    setChips(newChips);

    // Rebuild injected context from all chips (source of truth)
    const ctx = newChips.map(c =>
      c.kind === 'entity' ? buildEntityContext(c.result) : c.tag.context
    ).join('\n');
    setInjectedContext(ctx);

    setPickerMode(null);
    clearEntitySearch();
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCaret;
        textareaRef.current.selectionEnd = newCaret;
        textareaRef.current.focus();
      }
    }, 0);
  }, [value, triggerStart, clearEntitySearch]);

  // ─── Context tag selected ──────────────────────────────────────────────────
  const handleTagSelect = useCallback((tag: ContextTag) => {
    const ta = textareaRef.current;
    const caret = ta?.selectionStart ?? value.length;
    // Remove the #query from textarea — tags are invisible chips
    const { text, caret: newCaret } = replaceTrigger(value, caret, triggerStart, '');
    setValue(text);

    const newChips = [...chips, { kind: 'tag' as const, tag }];
    setChips(newChips);
    // Rebuild context from all chips (source of truth)
    const ctx = newChips.map(c =>
      c.kind === 'entity' ? buildEntityContext(c.result) : c.tag.context
    ).join('\n');
    setInjectedContext(ctx);
    setPickerMode(null);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCaret;
        textareaRef.current.selectionEnd = newCaret;
        textareaRef.current.focus();
      }
    }, 0);
  }, [value, triggerStart]);

  // ─── Remove chip ──────────────────────────────────────────────────────────
  const removeChip = useCallback((idx: number) => {
    const remaining = chips.filter((_, i) => i !== idx);
    setChips(remaining);
    // Rebuild context from remaining chips — no string fragility
    const ctx = remaining.map(c =>
      c.kind === 'entity' ? buildEntityContext(c.result) : c.tag.context
    ).join('\n');
    setInjectedContext(ctx);
  }, [chips]);

  // ─── Send ─────────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if ((!value.trim() && pendingFiles.length === 0 && chips.length === 0) || disabled || uploading) return;
    const entityChips = chips
      .filter((c): c is { kind: 'entity'; result: EntityResult } => c.kind === 'entity')
      .map(c => ({ type: c.result.type, label: c.result.label, id: c.result.id }));
    onSend(
      value.trim(),
      pendingFiles.length > 0 ? pendingFiles : undefined,
      injectedContext.trim() || undefined,
      entityChips.length > 0 ? entityChips : undefined,
    );
    setValue('');
    setPendingFiles([]);
    setChips([]);
    setInjectedContext('');
    onClearForm?.();
    // Re-focus textarea after send so user can type next message immediately
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [value, pendingFiles, chips, injectedContext, disabled, uploading, onSend, onClearForm]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Let pickers handle arrow keys / enter / escape when open
    if (pickerMode && ['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
      // Pickers listen to window keydown — just prevent default textarea behavior
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [pickerMode, handleSend]);

  const handleSelectQuickAction = (prompt: string) => {
    if (onSelectAction) onSelectAction(prompt);
    if (value.trim() && prompt.endsWith(' ')) setValue(prompt + value.trim());
    else if (value.trim()) setValue(value.trim() + ' ' + prompt);
    else setValue(prompt);
  };

  const handleFileSelect = (accept?: string) => {
    if (!fileInputRef.current) return;
    fileInputRef.current.accept = accept || getAcceptString();
    fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    for (const file of files) {
      const error = validateFile(file);
      if (error) { toast.error(error); return; }
    }
    setPendingFiles(prev => [...prev, ...files]);
  };

  const removePendingFile = (index: number) => setPendingFiles(prev => prev.filter((_, i) => i !== index));
  const handleClearForm = () => { setValue(''); onClearForm?.(); };

  const hasContent = value.trim() || pendingFiles.length > 0 || chips.length > 0;

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
      <input ref={fileInputRef} type="file" hidden multiple onChange={handleFileChange} />

      <Box ref={wrapperRef} sx={{ position: 'relative' }}>
        {/* ── Command Palette ── */}
        {pickerMode === 'command' && (
          <CommandPalette
            query={pickerQuery}
            onSelect={handleCommandSelect}
            onClose={() => setPickerMode(null)}
            anchorRef={wrapperRef as React.RefObject<HTMLElement>}
          />
        )}

        {/* ── Entity Mention Picker ── */}
        {pickerMode === 'mention' && (
          <EntityMentionPicker
            query={pickerQuery}
            results={entityResults}
            loading={entityLoading}
            onSelect={handleEntitySelect}
            onClose={() => { setPickerMode(null); clearEntitySearch(); }}
            anchorRef={wrapperRef as React.RefObject<HTMLElement>}
          />
        )}

        {/* ── Context Tag Picker ── */}
        {pickerMode === 'tag' && (
          <ContextTagPicker
            query={pickerQuery}
            onSelect={handleTagSelect}
            onClose={() => setPickerMode(null)}
            anchorRef={wrapperRef as React.RefObject<HTMLElement>}
          />
        )}

        {/* ── Input Box ── */}
        <Box
          sx={{
            position: 'relative',
            bgcolor: 'transparent',
            borderRadius: 'xl',
            border: '1px solid',
            borderColor: isFocused ? 'primary.400' : 'divider',
            boxShadow: isFocused ? '0 0 0 3px rgba(217, 119, 87, 0.1)' : 'none',
            transition: 'all 0.2s ease',
            overflow: 'hidden',
          }}
        >
          {/* Question Panel */}
          {questionPanel && <InlineQuestionPanel {...questionPanel} />}

          {/* Chips row — entity mentions + context tags + selected form */}
          {(selectedForm || chips.length > 0) && (
            <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              {/* Form shortcut chip */}
              {selectedForm && (
                <Chip
                  size="sm" variant="soft" color="primary"
                  sx={{ '--Chip-gap': '4px', '--Chip-paddingInline': '8px', fontWeight: 600 }}
                  endDecorator={
                    <IconButton size="sm" variant="plain" color="neutral"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClearForm(); }}
                      sx={{ '--IconButton-size': '16px', borderRadius: 'sm' }}
                    >
                      <X size={11} />
                    </IconButton>
                  }
                >
                  {selectedForm.label}
                </Chip>
              )}

              {/* Entity + Tag chips */}
              {chips.map((chip, idx) => {
                // Fire on mousedown so removal lands before the textarea
                // re-grabs focus and any picker logic re-runs on blur.
                const removeHandler = (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeChip(idx);
                };
                if (chip.kind === 'entity') {
                  return (
                    <Chip
                      key={`entity-${idx}`}
                      size="sm" variant="soft" color="success"
                      sx={{ '--Chip-gap': '4px', '--Chip-paddingInline': '8px', fontWeight: 500, maxWidth: 180 }}
                      endDecorator={
                        <IconButton size="sm" variant="plain" color="neutral"
                          onMouseDown={removeHandler}
                          onClick={removeHandler}
                          sx={{ '--IconButton-size': '16px', borderRadius: 'sm' }}
                        >
                          <X size={11} />
                        </IconButton>
                      }
                    >
                      <Typography noWrap level="body-xs" sx={{ fontWeight: 500 }}>
                        @{chip.result.label}
                      </Typography>
                    </Chip>
                  );
                }
                return (
                  <Chip
                    key={`tag-${idx}`}
                    size="sm" variant="soft" color="warning"
                    sx={{ '--Chip-gap': '4px', '--Chip-paddingInline': '8px', fontWeight: 500 }}
                    endDecorator={
                      <IconButton size="sm" variant="plain" color="neutral"
                        onMouseDown={removeHandler}
                        onClick={removeHandler}
                        sx={{ '--IconButton-size': '16px', borderRadius: 'sm' }}
                      >
                        <X size={11} />
                      </IconButton>
                    }
                  >
                    #{chip.tag.label}
                  </Chip>
                );
              })}
            </Box>
          )}

          {/* Pending files */}
          {pendingFiles.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ px: 2, pt: selectedForm || chips.length > 0 ? 0.5 : 1.5, pb: 0.5, flexWrap: 'wrap', gap: 0.75 }}>
              {pendingFiles.map((file, i) => {
                const category = getFileCategory(file.type) || 'document';
                const FileIcon = FILE_TYPE_ICON[category] || File;
                return (
                  <Chip key={`${file.name}-${i}`} size="sm" variant="outlined" color="neutral"
                    startDecorator={<FileIcon size={14} />}
                    endDecorator={
                      <IconButton size="sm" variant="plain" color="neutral" onClick={() => removePendingFile(i)}
                        sx={{ '--IconButton-size': '18px', borderRadius: '50%' }}
                      >
                        <X size={12} />
                      </IconButton>
                    }
                    sx={{ fontWeight: 500, fontSize: '0.75rem', maxWidth: 220, borderColor: 'divider' }}
                  >
                    <Typography noWrap level="body-xs" sx={{ maxWidth: 160 }}>{file.name}</Typography>
                  </Chip>
                );
              })}
            </Stack>
          )}

          {/* Textarea */}
          <Textarea
            slotProps={{ textarea: { ref: textareaRef } }}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            placeholder={
              pendingFiles.length > 0
                ? 'Add a message or send to analyze the file...'
                : selectedForm
                  ? `Fill in the ${selectedForm.label.toLowerCase()} details...`
                  : `${placeholder}  ·  / commands  ·  @ mention  ·  # context`
            }
            minRows={1}
            maxRows={6}
            sx={{
              border: 'none', bgcolor: 'transparent', background: 'transparent',
              '--joy-palette-background-surface': 'transparent',
              px: 2,
              pt: (selectedForm || chips.length > 0 || pendingFiles.length > 0) ? 0.5 : 1.5,
              pb: 5.5,
              resize: 'none',
              '&:focus-within': { outline: 'none', background: 'transparent' },
              '--Textarea-focusedThickness': '0px',
              '--Textarea-focusedHighlight': 'transparent',
              '& textarea': { background: 'transparent', '&::placeholder': { color: 'text.tertiary' } },
            }}
          />

          {/* Bottom action bar */}
          <Stack
            direction="row" alignItems="center" justifyContent="space-between"
            sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, px: 1.5, py: 1, bgcolor: 'transparent' }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              {/* Attach */}
              <Tooltip title="Attach file" placement="top">
                <IconButton size="sm" variant="plain" color="neutral" disabled={disabled || uploading}
                  onClick={() => handleFileSelect()}
                  sx={{ borderRadius: 'md', '&:hover': { bgcolor: 'background.level1' } }}
                >
                  {uploading ? <CircularProgress size="sm" sx={{ '--CircularProgress-size': '18px' }} /> : <Paperclip size={18} />}
                </IconButton>
              </Tooltip>

              <MemoryIndicator chatId={chatId} onCompacting={onCompacting} />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              {/* Usage badge */}
              <Tooltip
                title={
                  usage && (usage.sessionTokensUsed || 0) > 0 ? (
                    <Box sx={{ p: 0.5, minWidth: 180 }}>
                      <Typography level="body-xs" fontWeight={700} sx={{ mb: 1 }}>Usage</Typography>
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
                          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '10px', mt: 0.25 }}>Resets Monday</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ) : 'Flow AI v1'
                }
                placement="top" variant="outlined"
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.375, borderRadius: 'md', color: 'text.tertiary', fontSize: '12px', fontWeight: 500, cursor: 'default', transition: 'color 0.15s', '&:hover': { color: 'text.secondary' } }}>
                  <Zap size={12} />
                  <Typography level="body-xs" sx={{ fontWeight: 500, color: 'inherit' }}>Flow AI v1</Typography>
                  {isPaidSubscriber && (
                    <Chip size="sm" variant="soft" color={plan.id === 'max' ? 'success' : 'primary'} sx={{ fontSize: '10px', height: 18 }}>{plan.name}</Chip>
                  )}
                  {!isPaidSubscriber && isTrial && trialTimeLeft && (
                    <Typography level="body-xs" sx={{ color: 'primary.500', fontSize: '11px', fontWeight: 600 }}>· Trial: {trialTimeLeft}</Typography>
                  )}
                  {!isPaidSubscriber && trialExpired && (
                    <Typography level="body-xs" sx={{ color: 'danger.500', fontSize: '11px', fontWeight: 600 }}>· Trial Expired</Typography>
                  )}
                  {!trialExpired && usage && (usage.sessionTokensUsed || 0) > 0 && (
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '11px' }}>· {Math.round(sessionPercentUsed)}%</Typography>
                  )}
                </Box>
              </Tooltip>

              <IconButton
                size="sm" variant="solid" color="primary"
                onClick={handleSend}
                disabled={!hasContent || disabled || uploading}
                sx={{ borderRadius: 'md', transition: 'all 0.2s', '&:not(:disabled):hover': { transform: 'scale(1.05)' }, '&:not(:disabled):active': { transform: 'scale(0.95)' } }}
              >
                <Send size={18} />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* Quick Action Chips */}
      {showQuickActions && (
        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ mt: 2, gap: 1 }}>
          {QUICK_ACTIONS.map((action) => (
            <Chip
              key={action.label} variant="outlined" color="neutral" size="md"
              startDecorator={<action.icon size={14} />}
              onClick={() => handleSelectQuickAction(action.prompt)}
              sx={{ cursor: 'pointer', borderColor: 'divider', fontWeight: 500, fontSize: '13px', transition: 'all 0.15s', '&:hover': { borderColor: 'primary.400', bgcolor: 'background.level1', color: 'primary.plainColor' } }}
            >
              {action.label}
            </Chip>
          ))}
        </Stack>
      )}

      {!showQuickActions && (
        <Typography level="body-xs" sx={{ textAlign: 'center', color: 'text.tertiary', mt: 1, opacity: 0.7 }}>
          Flow AI can make mistakes. Please verify important information.
        </Typography>
      )}
    </Box>
  );
}

// ─── Build entity context string injected before message ───────────────────────
// Includes the entity's actionable IDs explicitly so the AI can use them in tool calls
// without asking the user to provide them again.
function buildEntityContext(result: EntityResult): string {
  const lines: string[] = [`Type: ${result.type}`, `Name: ${result.label}`];
  const r = result.raw;

  // Always include the document ID — this is what AI tools need
  if (result.id) lines.push(`ID: ${result.id}`);

  switch (result.type) {
    case 'customer':
      if (r.id) lines.push(`Customer ID: ${r.id}`);
      if (r.email) lines.push(`Email: ${r.email}`);
      if (r.phone) lines.push(`Phone: ${r.phone}`);
      if (r.outstandingBalance !== undefined) lines.push(`Outstanding Balance: ${r.outstandingBalance}`);
      if (r.totalInvoiced !== undefined) lines.push(`Total Invoiced: ${r.totalInvoiced}`);
      if (r.totalPaid !== undefined) lines.push(`Total Paid: ${r.totalPaid}`);
      break;
    case 'vendor':
      if (r.id) lines.push(`Vendor ID: ${r.id}`);
      if (r.email) lines.push(`Email: ${r.email}`);
      if (r.phone) lines.push(`Phone: ${r.phone}`);
      if (r.outstandingBalance !== undefined) lines.push(`Outstanding Balance: ${r.outstandingBalance}`);
      break;
    case 'invoice':
      // invoiceId is the primary key for change_invoice_status / send_invoice
      if (r.invoiceNumber) lines.push(`Invoice Number: ${r.invoiceNumber}`);
      if (r.id) lines.push(`Invoice ID: ${r.id}`);
      if (r.customerName) lines.push(`Customer: ${r.customerName}`);
      if (r.status) lines.push(`Status: ${r.status}`);
      if (r.total !== undefined) lines.push(`Total: ${r.total}`);
      if (r.amountDue !== undefined) lines.push(`Amount Due: ${r.amountDue}`);
      if (r.dueDate) lines.push(`Due Date: ${typeof r.dueDate === 'string' ? r.dueDate : r.dueDate?.toDate?.()?.toLocaleDateString?.() || ''}`);
      lines.push(`Use Invoice Number "${r.invoiceNumber || result.id}" as the invoiceId parameter in tool calls.`);
      break;
    case 'bill':
      // billId is the primary key for change_bill_status
      if (r.billNumber) lines.push(`Bill Number: ${r.billNumber}`);
      if (r.id) lines.push(`Bill ID: ${r.id}`);
      if (r.vendorName) lines.push(`Vendor: ${r.vendorName}`);
      if (r.status) lines.push(`Status: ${r.status}`);
      if (r.total !== undefined) lines.push(`Total: ${r.total}`);
      if (r.amountDue !== undefined) lines.push(`Amount Due: ${r.amountDue}`);
      if (r.dueDate) lines.push(`Due Date: ${typeof r.dueDate === 'string' ? r.dueDate : r.dueDate?.toDate?.()?.toLocaleDateString?.() || ''}`);
      lines.push(`Use Bill Number "${r.billNumber || result.id}" as the billId parameter in tool calls.`);
      break;
    case 'employee':
      if (r.id) lines.push(`Employee ID (use for salary slip): ${r.id}`);
      if (r.employeeId) lines.push(`Staff ID: ${r.employeeId}`);
      if (r.designation) lines.push(`Designation: ${r.designation}`);
      if (r.department) lines.push(`Department: ${r.department}`);
      if (r.salary !== undefined) lines.push(`Salary: ${r.salary}`);
      if (r.isActive !== undefined) lines.push(`Status: ${r.isActive ? 'Active' : 'Inactive'}`);
      break;
    case 'quote':
      if (r.quoteNumber) lines.push(`Quote Number: ${r.quoteNumber}`);
      if (r.id) lines.push(`Quote ID: ${r.id}`);
      if (r.customerName) lines.push(`Customer: ${r.customerName}`);
      if (r.status) lines.push(`Status: ${r.status}`);
      if (r.total !== undefined) lines.push(`Total: ${r.total}`);
      lines.push(`Use Quote ID "${r.id || result.id}" as the quoteId parameter in tool calls.`);
      break;
    case 'transaction':
      if (r.id) lines.push(`Transaction ID: ${r.id}`);
      if (r.type) lines.push(`Type: ${r.type}`);
      if (r.amount !== undefined) lines.push(`Amount: ${r.amount}`);
      if (r.category) lines.push(`Category: ${r.category}`);
      if (r.date) lines.push(`Date: ${typeof r.date === 'string' ? r.date : r.date?.toDate?.()?.toLocaleDateString?.() || ''}`);
      break;
    case 'account':
      if (r.code) lines.push(`Code: ${r.code}`);
      if (r.typeName) lines.push(`Type: ${r.typeName}`);
      if (r.balance !== undefined) lines.push(`Balance: ${r.balance}`);
      break;
  }

  return lines.join('\n');
}
