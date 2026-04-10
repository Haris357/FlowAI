'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Modal,
  ModalClose,
  ModalDialog,
  Option,
  Select,
  Sheet,
  Stack,
  Textarea,
  Typography,
} from '@mui/joy';
import {
  X,
  Settings,
  Building2,
  Bot,
  BookMarked,
  Plus,
  Pencil,
  Trash2,
  Save,
  Folder,
  Check,
} from 'lucide-react';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import {
  Industry,
  BusinessSize,
  AIMode,
  FiscalYearStart,
  TaxSystem,
  ChatDensity,
  INDUSTRY_LABELS,
  FISCAL_MONTH_LABELS,
  TemplateFolder,
  TEMPLATE_FOLDERS,
  SavedTemplate,
} from '@/types/businessProfile';

type Section = 'business' | 'ai' | 'templates';

interface CustomizePanelProps {
  open: boolean;
  onClose: () => void;
}

const SECTION_TABS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'business', label: 'Business Profile', icon: <Building2 size={15} /> },
  { id: 'ai', label: 'AI Behavior', icon: <Bot size={15} /> },
  { id: 'templates', label: 'Prompt Templates', icon: <BookMarked size={15} /> },
];

const FOLDER_EMOJIS: Record<TemplateFolder, string> = {
  General: '📁', Reports: '📊', Clients: '👥', Payroll: '💼', Daily: '📅', Custom: '✨',
};

// ─────────────────────────────────────────────────────────────────────────────
// Template Editor Modal
// ─────────────────────────────────────────────────────────────────────────────

interface TemplateEditorProps {
  initial?: Partial<SavedTemplate>;
  onSave: (data: Omit<SavedTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

const EMOJI_OPTIONS = ['📊', '📬', '💰', '🚨', '📈', '💼', '📅', '📋', '🔍', '💡', '📝', '🎯', '⚡', '🛠️', '📌', '🔔'];

function TemplateEditor({ initial, onSave, onClose }: TemplateEditorProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [prompt, setPrompt] = useState(initial?.prompt ?? '');
  const [folder, setFolder] = useState<TemplateFolder>(initial?.folder ?? 'General');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '📝');

  const handleSave = () => {
    if (!name.trim() || !prompt.trim()) return;
    onSave({ name: name.trim(), prompt: prompt.trim(), folder, emoji });
  };

  return (
    <ModalDialog sx={{ width: 480, maxWidth: '95vw' }}>
      <ModalClose />
      <Typography level="title-md">{initial?.id ? 'Edit Template' : 'New Template'}</Typography>
      <Divider sx={{ my: 1.5 }} />

      <Stack spacing={2}>
        <FormControl required>
          <FormLabel>Template Name</FormLabel>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Weekly Revenue Summary"
          />
        </FormControl>

        <FormControl required>
          <FormLabel>Prompt</FormLabel>
          <Textarea
            minRows={3}
            maxRows={6}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="What do you want the AI to do when this template is used?"
          />
        </FormControl>

        <Stack direction="row" spacing={1.5}>
          <FormControl sx={{ flex: 1 }}>
            <FormLabel>Folder</FormLabel>
            <Select value={folder} onChange={(_, v) => v && setFolder(v as TemplateFolder)}>
              {TEMPLATE_FOLDERS.map(f => (
                <Option key={f} value={f}>{FOLDER_EMOJIS[f]} {f}</Option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Icon</FormLabel>
            <Select value={emoji} onChange={(_, v) => v && setEmoji(v as string)} sx={{ minWidth: 80 }}>
              {EMOJI_OPTIONS.map(e => <Option key={e} value={e}>{e}</Option>)}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="plain" color="neutral" onClick={onClose}>Cancel</Button>
          <Button
            startDecorator={<Save size={14} />}
            onClick={handleSave}
            disabled={!name.trim() || !prompt.trim()}
          >
            Save Template
          </Button>
        </Stack>
      </Stack>
    </ModalDialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Business Profile
// ─────────────────────────────────────────────────────────────────────────────

function BusinessSection() {
  const { profile, updateProfile, isSaving } = useBusinessProfile();
  const [local, setLocal] = useState(profile);
  const [serviceInput, setServiceInput] = useState('');
  const [saved, setSaved] = useState(false);

  // Sync if profile changes externally
  const set = <K extends keyof typeof local>(key: K, value: typeof local[K]) => {
    setLocal(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await updateProfile(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addService = () => {
    const s = serviceInput.trim();
    if (!s || local.commonServices.includes(s)) return;
    set('commonServices', [...local.commonServices, s]);
    setServiceInput('');
  };

  const removeService = (svc: string) => {
    set('commonServices', local.commonServices.filter(s => s !== svc));
  };

  return (
    <Stack spacing={2.5} sx={{ pb: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <FormControl sx={{ flex: 1 }}>
          <FormLabel>Industry</FormLabel>
          <Select value={local.industry} onChange={(_, v) => v && set('industry', v as Industry)}>
            {(Object.entries(INDUSTRY_LABELS) as [Industry, string][]).map(([k, v]) => (
              <Option key={k} value={k}>{v}</Option>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ flex: 1 }}>
          <FormLabel>Business Size</FormLabel>
          <Select value={local.businessSize} onChange={(_, v) => v && set('businessSize', v as BusinessSize)}>
            <Option value="solo">Solo / Freelancer</Option>
            <Option value="small">Small Business</Option>
            <Option value="medium">Medium Business</Option>
            <Option value="enterprise">Enterprise</Option>
          </Select>
        </FormControl>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <FormControl sx={{ flex: 1 }}>
          <FormLabel>Tax System</FormLabel>
          <Select value={local.taxSystem} onChange={(_, v) => v && set('taxSystem', v as TaxSystem)}>
            <Option value="None">None</Option>
            <Option value="GST">GST</Option>
            <Option value="VAT">VAT</Option>
            <Option value="SalesTax">Sales Tax</Option>
          </Select>
        </FormControl>

        <FormControl sx={{ flex: 1 }}>
          <FormLabel>Tax Rate (%)</FormLabel>
          <Input
            type="number"
            value={local.taxRate}
            onChange={e => set('taxRate', Number(e.target.value))}
            slotProps={{ input: { min: 0, max: 100, step: 0.5 } }}
          />
        </FormControl>

        <FormControl sx={{ flex: 1 }}>
          <FormLabel>Fiscal Year Start</FormLabel>
          <Select value={local.fiscalYearStart} onChange={(_, v) => v && set('fiscalYearStart', v as FiscalYearStart)}>
            {(Object.entries(FISCAL_MONTH_LABELS) as [FiscalYearStart, string][]).map(([k, v]) => (
              <Option key={k} value={k}>{v}</Option>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <FormControl>
        <FormLabel>Default Payment Terms (days)</FormLabel>
        <Input
          type="number"
          value={local.defaultPaymentTerms}
          onChange={e => set('defaultPaymentTerms', Number(e.target.value))}
          slotProps={{ input: { min: 0, max: 365 } }}
          sx={{ maxWidth: 140 }}
          endDecorator={<Typography level="body-xs" sx={{ color: 'text.tertiary' }}>days</Typography>}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Business Description</FormLabel>
        <Textarea
          minRows={2}
          maxRows={4}
          value={local.businessDescription}
          onChange={e => set('businessDescription', e.target.value)}
          placeholder="Describe your business — this helps the AI give more relevant responses. e.g. 'Karachi-based software agency specializing in fintech products...'"
        />
      </FormControl>

      <FormControl>
        <FormLabel>Common Services / Products</FormLabel>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Input
            value={serviceInput}
            onChange={e => setServiceInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addService(); } }}
            placeholder="e.g. Web Development"
            sx={{ flex: 1 }}
          />
          <Button variant="outlined" size="sm" onClick={addService}>Add</Button>
        </Stack>
        {local.commonServices.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {local.commonServices.map(svc => (
              <Chip
                key={svc}
                size="sm"
                variant="soft"
                endDecorator={
                  <Box
                    component="span"
                    onClick={() => removeService(svc)}
                    sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', ml: 0.25 }}
                  >
                    <X size={11} />
                  </Box>
                }
              >
                {svc}
              </Chip>
            ))}
          </Box>
        )}
      </FormControl>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          startDecorator={saved ? <Check size={14} /> : <Save size={14} />}
          onClick={handleSave}
          loading={isSaving}
          color={saved ? 'success' : 'primary'}
          sx={{ minWidth: 120 }}
        >
          {saved ? 'Saved!' : 'Save Profile'}
        </Button>
      </Box>
    </Stack>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: AI Behavior
// ─────────────────────────────────────────────────────────────────────────────

function AISection() {
  const { profile, updateProfile, isSaving } = useBusinessProfile();
  const [local, setLocal] = useState(profile);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof typeof local>(key: K, value: typeof local[K]) => {
    setLocal(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await updateProfile(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const AI_MODES: { value: AIMode; label: string; desc: string }[] = [
    { value: 'conversational', label: 'Conversational', desc: 'Natural, friendly tone (default)' },
    { value: 'formal', label: 'Formal', desc: 'Professional & structured responses' },
    { value: 'brief', label: 'Brief', desc: 'Short, to-the-point answers' },
    { value: 'detailed', label: 'Detailed', desc: 'Thorough explanations with context' },
  ];

  const TIME_SCOPES = [
    { value: '', label: 'None (let AI decide)' },
    { value: 'thisweek', label: 'This Week' },
    { value: 'thismonth', label: 'This Month' },
    { value: 'thisyear', label: 'This Year' },
  ];

  const LANGUAGES = ['English', 'Urdu', 'Arabic', 'French', 'Spanish', 'Hindi', 'Bengali', 'Turkish', 'German', 'Chinese'];

  return (
    <Stack spacing={2.5} sx={{ pb: 2 }}>
      <FormControl>
        <FormLabel>Default AI Response Style</FormLabel>
        <Stack spacing={1} sx={{ mt: 0.5 }}>
          {AI_MODES.map(mode => (
            <Box
              key={mode.value}
              onClick={() => set('defaultAIMode', mode.value)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 'sm',
                border: '1px solid',
                borderColor: local.defaultAIMode === mode.value ? 'primary.400' : 'divider',
                bgcolor: local.defaultAIMode === mode.value ? 'primary.softBg' : 'background.surface',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Box
                sx={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid',
                  borderColor: local.defaultAIMode === mode.value ? 'primary.400' : 'neutral.300',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {local.defaultAIMode === mode.value && (
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.400' }} />
                )}
              </Box>
              <Box>
                <Typography level="body-sm" fontWeight={600}>{mode.label}</Typography>
                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{mode.desc}</Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </FormControl>

      <FormControl>
        <FormLabel>Response Language</FormLabel>
        <Select
          value={local.responseLanguage}
          onChange={(_, v) => v && set('responseLanguage', v as string)}
        >
          {LANGUAGES.map(lang => <Option key={lang} value={lang}>{lang}</Option>)}
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Default Time Scope</FormLabel>
        <Select
          value={local.defaultTimeScope}
          onChange={(_, v) => set('defaultTimeScope', v as string ?? '')}
        >
          {TIME_SCOPES.map(s => <Option key={s.value} value={s.value}>{s.label}</Option>)}
        </Select>
        <Typography level="body-xs" sx={{ mt: 0.5, color: 'text.tertiary' }}>
          When you ask about data (reports, invoices, etc.) the AI assumes this time period unless you specify otherwise.
        </Typography>
      </FormControl>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          startDecorator={saved ? <Check size={14} /> : <Save size={14} />}
          onClick={handleSave}
          loading={isSaving}
          color={saved ? 'success' : 'primary'}
          sx={{ minWidth: 120 }}
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </Box>
    </Stack>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Prompt Templates
// ─────────────────────────────────────────────────────────────────────────────

function TemplatesSection({ onUseTemplate }: { onUseTemplate?: (prompt: string) => void }) {
  const { templates, addTemplate, editTemplate, removeTemplate } = useBusinessProfile();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SavedTemplate | undefined>(undefined);
  const [activeFolder, setActiveFolder] = useState<TemplateFolder | 'All'>('All');

  const folders = ['All', ...TEMPLATE_FOLDERS] as const;
  const filtered = activeFolder === 'All'
    ? templates
    : templates.filter(t => t.folder === activeFolder);

  const handleSave = async (data: Omit<SavedTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editing) {
      await editTemplate(editing.id, data);
    } else {
      await addTemplate(data);
    }
    setEditorOpen(false);
    setEditing(undefined);
  };

  return (
    <Stack spacing={2} sx={{ pb: 2 }}>
      {/* Folder tabs */}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {folders.map(f => (
          <Chip
            key={f}
            size="sm"
            variant={activeFolder === f ? 'solid' : 'outlined'}
            color={activeFolder === f ? 'primary' : 'neutral'}
            onClick={() => setActiveFolder(f as typeof activeFolder)}
            sx={{ cursor: 'pointer' }}
          >
            {f !== 'All' && FOLDER_EMOJIS[f as TemplateFolder]}{' '}{f}
          </Chip>
        ))}
      </Box>

      {/* Template list */}
      {filtered.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>No templates in this folder</Typography>
        </Box>
      ) : (
        <Stack spacing={0.75}>
          {filtered.map(t => (
            <Box
              key={t.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                p: 1.5,
                borderRadius: 'sm',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.surface',
                '&:hover': { bgcolor: 'background.level1' },
                transition: 'background 0.1s ease',
              }}
            >
              <Typography sx={{ fontSize: '1.1rem', flexShrink: 0, mt: 0.1 }}>{t.emoji}</Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography level="body-sm" fontWeight={600}>{t.name}</Typography>
                <Typography
                  level="body-xs"
                  sx={{
                    color: 'text.tertiary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    mt: 0.25,
                  }}
                >
                  {t.prompt}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
                <IconButton
                  size="sm"
                  variant="plain"
                  color="neutral"
                  onClick={() => { setEditing(t); setEditorOpen(true); }}
                >
                  <Pencil size={13} />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="plain"
                  color="danger"
                  onClick={() => removeTemplate(t.id)}
                >
                  <Trash2 size={13} />
                </IconButton>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          size="sm"
          variant="outlined"
          startDecorator={<Plus size={14} />}
          onClick={() => { setEditing(undefined); setEditorOpen(true); }}
        >
          New Template
        </Button>
      </Box>

      <Modal open={editorOpen} onClose={() => { setEditorOpen(false); setEditing(undefined); }}>
        <TemplateEditor
          initial={editing}
          onSave={handleSave}
          onClose={() => { setEditorOpen(false); setEditing(undefined); }}
        />
      </Modal>
    </Stack>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Panel
// ─────────────────────────────────────────────────────────────────────────────

export default function CustomizePanel({ open, onClose }: CustomizePanelProps) {
  const [section, setSection] = useState<Section>('business');

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      size="md"
      slotProps={{
        content: { sx: { maxWidth: 520, width: '100%' } },
      }}
    >
      <Sheet
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          bgcolor: 'background.body',
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Settings size={18} />
            <Typography level="title-md">Customize</Typography>
          </Stack>
          <IconButton size="sm" variant="plain" color="neutral" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </Stack>

        {/* Tabs */}
        <Box sx={{ px: 2, pt: 1.5, pb: 0, flexShrink: 0 }}>
          <Stack direction="row" spacing={0.5}>
            {SECTION_TABS.map(tab => (
              <Button
                key={tab.id}
                size="sm"
                variant={section === tab.id ? 'solid' : 'plain'}
                color={section === tab.id ? 'primary' : 'neutral'}
                startDecorator={tab.icon}
                onClick={() => setSection(tab.id)}
                sx={{ borderRadius: 'sm', fontSize: '12px', px: 1.5 }}
              >
                {tab.label}
              </Button>
            ))}
          </Stack>
          <Divider sx={{ mt: 1.5 }} />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, pt: 2 }}>
          {section === 'business' && <BusinessSection />}
          {section === 'ai' && <AISection />}
          {section === 'templates' && <TemplatesSection />}
        </Box>
      </Sheet>
    </Drawer>
  );
}
