'use client';

import { forwardRef, useState } from 'react';
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
  Skeleton,
  Stack,
  Textarea,
  Typography,
} from '@mui/joy';
import {
  X,
  Wrench,
  ScanLine,
  Upload,
  Bell,
  Scale,
  FileText,
  BookMarked,
  RefreshCw,
  Calculator,
  Wallet,
  ClipboardCheck,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';

interface ToolkitPanelProps {
  open: boolean;
  onClose: () => void;
  onSendMessage?: (message: string) => void;
  onSelectTemplate?: (prompt: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool definitions
// ─────────────────────────────────────────────────────────────────────────────

interface Tool {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  badge?: string;
  badgeColor?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  action: 'modal' | 'prompt' | 'link';
  prompt?: string;
  href?: string;
}

const TOOLS: Tool[] = [
  {
    id: 'receipt_scanner',
    icon: <ScanLine size={20} />,
    label: 'Receipt Scanner',
    description: 'Snap a photo of a receipt or invoice — the AI extracts vendor, amount, date, and category automatically.',
    badge: 'AI',
    badgeColor: 'primary',
    action: 'modal',
  },
  {
    id: 'bulk_importer',
    icon: <Upload size={20} />,
    label: 'Bulk Importer',
    description: 'Import customers, vendors, invoices, or transactions from a CSV or Excel file.',
    badge: 'Beta',
    badgeColor: 'warning',
    action: 'modal',
  },
  {
    id: 'payment_reminder',
    icon: <Bell size={20} />,
    label: 'Payment Reminder Sender',
    description: 'Send overdue payment reminders to all customers with outstanding invoices in one click.',
    badge: 'AI',
    badgeColor: 'primary',
    action: 'prompt',
    prompt: 'Find all overdue invoices and draft payment reminder messages for each customer. Include the invoice number, amount, and days overdue. Ask me before sending.',
  },
  {
    id: 'bank_recon',
    icon: <Scale size={20} />,
    label: 'Bank Reconciliation',
    description: 'Match your bank transactions with recorded entries and highlight discrepancies.',
    badge: 'AI',
    badgeColor: 'primary',
    action: 'prompt',
    prompt: 'Help me reconcile my bank account. Show me unmatched transactions and suggest which entries they correspond to.',
  },
  {
    id: 'quick_invoice',
    icon: <FileText size={20} />,
    label: 'Quick Invoice Builder',
    description: 'Build and send an invoice by answering a few quick questions — no form filling.',
    badge: 'AI',
    badgeColor: 'primary',
    action: 'prompt',
    prompt: 'Help me create a new invoice quickly. Ask me: (1) customer name, (2) services/items and amounts, (3) due date. Then create it.',
  },
  {
    id: 'saved_templates',
    icon: <BookMarked size={20} />,
    label: 'Saved Templates',
    description: 'Browse and use your saved prompt templates for common tasks.',
    action: 'modal',
  },
  {
    id: 'currency_converter',
    icon: <RefreshCw size={20} />,
    label: 'Currency Converter',
    description: 'Convert amounts between currencies using live exchange rates.',
    action: 'modal',
  },
  {
    id: 'tax_calculator',
    icon: <Calculator size={20} />,
    label: 'Tax Calculator',
    description: 'Calculate GST, VAT, or Sales Tax on any amount using your configured tax rate.',
    action: 'modal',
  },
  {
    id: 'salary_slip',
    icon: <Wallet size={20} />,
    label: 'Salary Slip Generator',
    description: 'Generate a professional salary slip for any employee with deductions and net pay.',
    badge: 'AI',
    badgeColor: 'primary',
    action: 'prompt',
    prompt: 'Generate a salary slip. Ask me for: employee name, basic salary, any allowances, and deductions. Then create a detailed salary slip.',
  },
  {
    id: 'audit_checklist',
    icon: <ClipboardCheck size={20} />,
    label: 'Audit Checklist',
    description: 'Run a financial health check — the AI reviews your books and flags issues.',
    badge: 'AI',
    badgeColor: 'primary',
    action: 'prompt',
    prompt: 'Perform a financial audit checklist on my books. Check for: missing invoice entries, unreconciled transactions, unusual expenses, overdue payables, and any data inconsistencies. Give me a structured report.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Inline tool modals
// ─────────────────────────────────────────────────────────────────────────────

const ReceiptScannerModal = forwardRef<HTMLDivElement, { onClose: () => void; onSend: (msg: string) => void }>(
  function ReceiptScannerModal({ onClose, onSend }, ref) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSend = () => {
    const msg = `[Receipt Scanner] Please extract all details from the attached receipt/invoice image.${note ? ` Additional note: ${note}` : ''}`;
    onSend(msg);
    onClose();
  };

  return (
    <ModalDialog ref={ref} sx={{ width: 460, maxWidth: '95vw' }}>
      <ModalClose />
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <ScanLine size={18} />
        <Typography level="title-md">Receipt Scanner</Typography>
        <Chip size="sm" color="primary">AI</Chip>
      </Stack>
      <Typography level="body-sm" sx={{ mb: 2, color: 'text.secondary' }}>
        Attach a receipt or invoice image. The AI will extract vendor, amount, date, category, and create a transaction.
      </Typography>

      <Box
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('receipt-file-input')?.click()}
        sx={{
          border: '2px dashed',
          borderColor: dragging ? 'primary.400' : file ? 'success.400' : 'divider',
          borderRadius: 'md',
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: dragging ? 'primary.softBg' : file ? 'success.softBg' : 'background.level1',
          transition: 'all 0.15s ease',
          mb: 2,
        }}
      >
        <input
          id="receipt-file-input"
          type="file"
          accept="image/*,.pdf"
          style={{ display: 'none' }}
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <Stack spacing={0.5} alignItems="center">
            <Typography level="body-sm" fontWeight={600} sx={{ color: 'success.700' }}>
              {file.name}
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              {(file.size / 1024).toFixed(1)} KB — click to change
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={0.5} alignItems="center">
            <ScanLine size={28} style={{ opacity: 0.4 }} />
            <Typography level="body-sm">Drop image here or click to browse</Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>JPG, PNG, PDF supported</Typography>
          </Stack>
        )}
      </Box>

      <FormControl sx={{ mb: 2 }}>
        <FormLabel>Optional note</FormLabel>
        <Input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. Office supplies for Q2"
        />
      </FormControl>

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button variant="plain" color="neutral" onClick={onClose}>Cancel</Button>
        <Button startDecorator={<Sparkles size={14} />} onClick={handleSend}>
          Scan with AI
        </Button>
      </Stack>
    </ModalDialog>
  );
});

const CurrencyConverterModal = forwardRef<HTMLDivElement, { onClose: () => void }>(
  function CurrencyConverterModal({ onClose }, ref) {
  const { profile } = useBusinessProfile();
  const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'AED', 'SAR', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'TRY'];
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('PKR');
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const convert = async () => {
    if (!amount || isNaN(Number(amount))) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/exchange-rate?from=${from}&to=${to}`);
      const data = await res.json();
      setResult(Number(amount) * (data.rate ?? 1));
    } catch {
      setResult(Number(amount));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalDialog ref={ref} sx={{ width: 400, maxWidth: '95vw' }}>
      <ModalClose />
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <RefreshCw size={18} />
        <Typography level="title-md">Currency Converter</Typography>
      </Stack>

      <Stack spacing={2}>
        <FormControl>
          <FormLabel>Amount</FormLabel>
          <Input
            type="number"
            value={amount}
            onChange={e => { setAmount(e.target.value); setResult(null); }}
            placeholder="0.00"
          />
        </FormControl>

        <Stack direction="row" spacing={1} alignItems="flex-end">
          <FormControl sx={{ flex: 1 }}>
            <FormLabel>From</FormLabel>
            <Select value={from} onChange={(_, v) => v && setFrom(v)}>
              {CURRENCIES.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </FormControl>
          <IconButton
            variant="plain"
            color="neutral"
            sx={{ mb: 0.25 }}
            onClick={() => { const tmp = from; setFrom(to); setTo(tmp); setResult(null); }}
          >
            <RefreshCw size={16} />
          </IconButton>
          <FormControl sx={{ flex: 1 }}>
            <FormLabel>To</FormLabel>
            <Select value={to} onChange={(_, v) => v && setTo(v)}>
              {CURRENCIES.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </FormControl>
        </Stack>

        <Button onClick={convert} loading={loading}>Convert</Button>

        {result !== null && (
          <Box sx={{ p: 2, borderRadius: 'sm', bgcolor: 'success.softBg', textAlign: 'center' }}>
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Result</Typography>
            <Typography level="h3" fontWeight={700} sx={{ color: 'success.700' }}>
              {result.toLocaleString(undefined, { maximumFractionDigits: 4 })} {to}
            </Typography>
          </Box>
        )}
      </Stack>
    </ModalDialog>
  );
});

const TaxCalculatorModal = forwardRef<HTMLDivElement, { onClose: () => void }>(
  function TaxCalculatorModal({ onClose }, ref) {
  const { profile } = useBusinessProfile();
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState(String(profile.taxRate || 0));
  const [inclusive, setInclusive] = useState(false);

  const num = Number(amount) || 0;
  const r = Number(rate) / 100;
  const taxAmount = inclusive ? num - num / (1 + r) : num * r;
  const total = inclusive ? num : num + taxAmount;
  const base = inclusive ? num - taxAmount : num;

  return (
    <ModalDialog ref={ref} sx={{ width: 400, maxWidth: '95vw' }}>
      <ModalClose />
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Calculator size={18} />
        <Typography level="title-md">Tax Calculator</Typography>
        {profile.taxSystem !== 'None' && <Chip size="sm" color="neutral">{profile.taxSystem}</Chip>}
      </Stack>

      <Stack spacing={2}>
        <Stack direction="row" spacing={1}>
          <FormControl sx={{ flex: 1 }}>
            <FormLabel>Amount</FormLabel>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </FormControl>
          <FormControl sx={{ width: 110 }}>
            <FormLabel>Tax Rate (%)</FormLabel>
            <Input
              type="number"
              value={rate}
              onChange={e => setRate(e.target.value)}
              slotProps={{ input: { min: 0, max: 100 } }}
            />
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            onClick={() => setInclusive(prev => !prev)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
              p: 1, borderRadius: 'sm',
              '&:hover': { bgcolor: 'background.level1' },
            }}
          >
            <Box
              sx={{
                width: 18, height: 18, borderRadius: 'sm', border: '2px solid',
                borderColor: inclusive ? 'primary.400' : 'neutral.300',
                bgcolor: inclusive ? 'primary.400' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {inclusive && <X size={10} style={{ color: 'white' }} />}
            </Box>
            <Typography level="body-sm">Tax inclusive (amount already includes tax)</Typography>
          </Box>
        </Stack>

        {num > 0 && r > 0 && (
          <Box sx={{ p: 2, borderRadius: 'sm', bgcolor: 'background.level1' }}>
            <Stack spacing={0.75}>
              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>Base Amount</Typography>
                <Typography level="body-sm" fontWeight={600}>{base.toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>Tax ({rate}%)</Typography>
                <Typography level="body-sm" fontWeight={600} sx={{ color: 'warning.700' }}>{taxAmount.toFixed(2)}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-sm" fontWeight={700}>Total</Typography>
                <Typography level="body-sm" fontWeight={700} sx={{ color: 'success.700' }}>{total.toFixed(2)}</Typography>
              </Stack>
            </Stack>
          </Box>
        )}
      </Stack>
    </ModalDialog>
  );
});

const SavedTemplatesModal = forwardRef<HTMLDivElement, { onClose: () => void; onUse: (prompt: string) => void }>(
  function SavedTemplatesModal({ onClose, onUse }, ref) {
  const { templates } = useBusinessProfile();
  const [activeFolder, setActiveFolder] = useState<string>('All');
  const folders = ['All', ...Array.from(new Set(templates.map(t => t.folder)))];
  const filtered = activeFolder === 'All' ? templates : templates.filter(t => t.folder === activeFolder);

  return (
    <ModalDialog ref={ref} sx={{ width: 480, maxWidth: '95vw' }}>
      <ModalClose />
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <BookMarked size={18} />
        <Typography level="title-md">Saved Templates</Typography>
      </Stack>

      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
        {folders.map(f => (
          <Chip
            key={f}
            size="sm"
            variant={activeFolder === f ? 'solid' : 'outlined'}
            color={activeFolder === f ? 'primary' : 'neutral'}
            onClick={() => setActiveFolder(f)}
            sx={{ cursor: 'pointer' }}
          >
            {f}
          </Chip>
        ))}
      </Box>

      <Stack spacing={0.75} sx={{ maxHeight: 360, overflowY: 'auto' }}>
        {filtered.map(t => (
          <Box
            key={t.id}
            onClick={() => { onUse(t.prompt); onClose(); }}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              p: 1.5, borderRadius: 'sm', border: '1px solid', borderColor: 'divider',
              cursor: 'pointer', bgcolor: 'background.surface',
              '&:hover': { bgcolor: 'primary.softBg', borderColor: 'primary.300' },
              transition: 'all 0.12s ease',
            }}
          >
            <Typography sx={{ fontSize: '1.1rem', flexShrink: 0 }}>{t.emoji}</Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography level="body-sm" fontWeight={600}>{t.name}</Typography>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.prompt}
              </Typography>
            </Box>
            <ChevronRight size={14} style={{ flexShrink: 0, opacity: 0.4 }} />
          </Box>
        ))}
        {filtered.length === 0 && (
          <Typography level="body-sm" sx={{ color: 'text.tertiary', textAlign: 'center', py: 4 }}>
            No templates in this folder
          </Typography>
        )}
      </Stack>
    </ModalDialog>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Panel
// ─────────────────────────────────────────────────────────────────────────────

export default function ToolkitPanel({ open, onClose, onSendMessage, onSelectTemplate }: ToolkitPanelProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleToolClick = (tool: Tool) => {
    if (tool.action === 'prompt' && tool.prompt) {
      onSendMessage?.(tool.prompt);
      onClose();
    } else if (tool.action === 'link' && tool.href) {
      window.open(tool.href, '_blank');
    } else if (tool.action === 'modal') {
      setActiveModal(tool.id);
    }
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        size="md"
        slotProps={{
          content: { sx: { maxWidth: 480, width: '100%' } },
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
              <Wrench size={18} />
              <Typography level="title-md">Toolkit</Typography>
            </Stack>
            <IconButton size="sm" variant="plain" color="neutral" onClick={onClose}>
              <X size={16} />
            </IconButton>
          </Stack>

          {/* Sub-header */}
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'background.level1', flexShrink: 0 }}>
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              AI-powered tools that work directly with your accounting data. Click any tool to launch it.
            </Typography>
          </Box>

          {/* Tools Grid */}
          <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5 }}>
            <Stack spacing={1}>
              {TOOLS.map(tool => (
                <Box
                  key={tool.id}
                  onClick={() => handleToolClick(tool)}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    p: 1.75,
                    borderRadius: 'md',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.surface',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: 'background.level1',
                      borderColor: 'primary.300',
                      transform: 'translateY(-1px)',
                      boxShadow: 'sm',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 40, height: 40, borderRadius: 'sm', flexShrink: 0,
                      bgcolor: 'primary.softBg', color: 'primary.600',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {tool.icon}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography level="body-sm" fontWeight={700}>{tool.label}</Typography>
                      {tool.badge && (
                        <Chip size="sm" color={tool.badgeColor ?? 'neutral'} variant="soft">
                          {tool.badge}
                        </Chip>
                      )}
                    </Stack>
                    <Typography level="body-xs" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                      {tool.description}
                    </Typography>
                  </Box>
                  <ChevronRight size={16} style={{ flexShrink: 0, opacity: 0.35, marginTop: 4 }} />
                </Box>
              ))}
            </Stack>
          </Box>
        </Sheet>
      </Drawer>

      {/* Tool Modals */}
      <Modal open={activeModal === 'receipt_scanner'} onClose={() => setActiveModal(null)}>
        <ReceiptScannerModal
          onClose={() => setActiveModal(null)}
          onSend={msg => { onSendMessage?.(msg); onClose(); }}
        />
      </Modal>

      <Modal open={activeModal === 'currency_converter'} onClose={() => setActiveModal(null)}>
        <CurrencyConverterModal onClose={() => setActiveModal(null)} />
      </Modal>

      <Modal open={activeModal === 'tax_calculator'} onClose={() => setActiveModal(null)}>
        <TaxCalculatorModal onClose={() => setActiveModal(null)} />
      </Modal>

      <Modal open={activeModal === 'saved_templates'} onClose={() => setActiveModal(null)}>
        <SavedTemplatesModal
          onClose={() => setActiveModal(null)}
          onUse={prompt => { onSelectTemplate?.(prompt); onClose(); }}
        />
      </Modal>

      <Modal open={activeModal === 'bulk_importer'} onClose={() => setActiveModal(null)}>
        <ModalDialog sx={{ width: 440, maxWidth: '95vw' }}>
          <ModalClose />
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Upload size={18} />
            <Typography level="title-md">Bulk Importer</Typography>
            <Chip size="sm" color="warning">Beta</Chip>
          </Stack>
          <Typography level="body-sm" sx={{ mb: 2, color: 'text.secondary' }}>
            Import your data via CSV or Excel. Download a template, fill it in, and upload it back.
          </Typography>
          <Stack spacing={1}>
            {['Customers', 'Vendors', 'Invoices', 'Transactions'].map(type => (
              <Box
                key={type}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  p: 1.5, borderRadius: 'sm', border: '1px solid', borderColor: 'divider',
                  bgcolor: 'background.level1',
                }}
              >
                <Typography level="body-sm" fontWeight={600}>{type}</Typography>
                <Stack direction="row" spacing={0.75}>
                  <Button size="sm" variant="plain" color="neutral" startDecorator={<ExternalLink size={12} />}>
                    Template
                  </Button>
                  <Button size="sm" variant="outlined" startDecorator={<Upload size={12} />}>
                    Upload
                  </Button>
                </Stack>
              </Box>
            ))}
          </Stack>
          <Typography level="body-xs" sx={{ mt: 1.5, color: 'text.tertiary' }}>
            Maximum 500 rows per import. Duplicate detection is automatic.
          </Typography>
        </ModalDialog>
      </Modal>
    </>
  );
}
