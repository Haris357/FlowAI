'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Button, Skeleton,
  FormControl, FormLabel, Input, Select, Option, Textarea, Modal,
  ModalDialog, ModalClose, Divider, CircularProgress,
} from '@mui/joy';
import {
  Mail, Send, Eye, Search, Users, CreditCard, Zap, AlertTriangle,
  MessageCircle, Megaphone, PenTool, Receipt, XCircle, KeyRound,
  Handshake, CheckCircle, Inbox,
} from 'lucide-react';
import { EMAIL_TEMPLATE_OPTIONS, type EmailTemplateType } from '@/lib/email-templates';
import StatCard from '@/components/admin/StatCard';
import toast from 'react-hot-toast';

// ==========================================
// TEMPLATE UI CONFIG
// ==========================================

const TEMPLATE_UI: Record<EmailTemplateType, {
  icon: React.ElementType;
  color: string;
  fields: { key: string; label: string; type: 'text' | 'textarea'; required?: boolean; placeholder?: string }[];
}> = {
  welcome: {
    icon: Handshake,
    color: '#10B981',
    fields: [
      { key: 'userName', label: 'User Name', type: 'text', required: true, placeholder: 'John Doe' },
    ],
  },
  plan_changed: {
    icon: CreditCard,
    color: '#6366F1',
    fields: [
      { key: 'userName', label: 'User Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'previousPlan', label: 'Previous Plan', type: 'text', required: true, placeholder: 'Free' },
      { key: 'planName', label: 'New Plan', type: 'text', required: true, placeholder: 'Pro' },
    ],
  },
  tokens_granted: {
    icon: Zap,
    color: '#F59E0B',
    fields: [
      { key: 'userName', label: 'User Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'tokenAmount', label: 'Token Amount', type: 'text', required: true, placeholder: '50000' },
    ],
  },
  account_warning: {
    icon: AlertTriangle,
    color: '#EF4444',
    fields: [
      { key: 'userName', label: 'User Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'warningType', label: 'Warning Type', type: 'text', placeholder: 'Token Limit Reached' },
      { key: 'warningMessage', label: 'Warning Message', type: 'textarea', required: true, placeholder: 'We noticed unusual activity on your account...' },
    ],
  },
  support_reply: {
    icon: MessageCircle,
    color: '#3B82F6',
    fields: [
      { key: 'userName', label: 'User Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'ticketSubject', label: 'Ticket Subject', type: 'text', required: true, placeholder: 'Re: Issue with invoices' },
      { key: 'replyMessage', label: 'Reply Message', type: 'textarea', required: true, placeholder: 'Thank you for reaching out...' },
    ],
  },
  announcement: {
    icon: Megaphone,
    color: '#D97757',
    fields: [
      { key: 'announcementTitle', label: 'Announcement Title', type: 'text', required: true, placeholder: 'New Feature: Bank Reconciliation' },
      { key: 'announcementBody', label: 'Announcement Body', type: 'textarea', required: true, placeholder: 'We are excited to announce...' },
      { key: 'userName', label: 'Greeting Name (optional)', type: 'text', placeholder: 'Leave blank for generic greeting' },
    ],
  },
  custom: {
    icon: PenTool,
    color: '#8B5CF6',
    fields: [
      { key: 'customSubject', label: 'Subject', type: 'text', required: true, placeholder: 'Email subject line' },
      { key: 'customMessage', label: 'Message Body', type: 'textarea', required: true, placeholder: 'Write your message here...' },
      { key: 'userName', label: 'Greeting Name (optional)', type: 'text', placeholder: 'Leave blank for generic greeting' },
    ],
  },
  payment_receipt: {
    icon: Receipt,
    color: '#10B981',
    fields: [
      { key: 'userName', label: 'User Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'amount', label: 'Amount', type: 'text', required: true, placeholder: '$29.99' },
      { key: 'planName', label: 'Plan Name', type: 'text', required: true, placeholder: 'Pro' },
      { key: 'invoiceId', label: 'Invoice ID (optional)', type: 'text', placeholder: 'INV-001' },
    ],
  },
  subscription_cancelled: {
    icon: XCircle,
    color: '#EF4444',
    fields: [
      { key: 'userName', label: 'User Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'planName', label: 'Plan Name', type: 'text', required: true, placeholder: 'Pro' },
    ],
  },
  password_reset: {
    icon: KeyRound,
    color: '#F59E0B',
    fields: [
      { key: 'userName', label: 'User Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'resetLink', label: 'Reset Link', type: 'text', required: true, placeholder: 'https://flowbooks.app/reset?token=...' },
    ],
  },
};

// ==========================================
// TYPES
// ==========================================

type RecipientType = 'individual' | 'all' | 'by_plan';

interface UserSearchResult {
  id: string;
  email: string;
  name?: string;
  planId?: string;
}

// ==========================================
// PAGE
// ==========================================

export default function AdminEmailCenterPage() {
  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateType | null>(null);
  const [templateData, setTemplateData] = useState<Record<string, string>>({});

  // Recipient state
  const [recipientType, setRecipientType] = useState<RecipientType>('individual');
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [searching, setSearching] = useState(false);

  // UI state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  // ==========================================
  // USER SEARCH
  // ==========================================

  useEffect(() => {
    if (recipientType !== 'individual' || userSearch.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}`);
        const data = await res.json();
        setSearchResults((data.users || []).slice(0, 8).map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          planId: u.planId || u.subscription?.planId,
        })));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearch, recipientType]);

  // ==========================================
  // TEMPLATE SELECTION
  // ==========================================

  const handleSelectTemplate = (type: EmailTemplateType) => {
    setSelectedTemplate(type);
    setTemplateData({});
    setSendResult(null);
  };

  const selectedOption = EMAIL_TEMPLATE_OPTIONS.find(t => t.value === selectedTemplate);
  const selectedUI = selectedTemplate ? TEMPLATE_UI[selectedTemplate] : null;

  // ==========================================
  // FIELD HANDLER
  // ==========================================

  const handleFieldChange = (key: string, value: string) => {
    setTemplateData(prev => ({ ...prev, [key]: value }));
  };

  // ==========================================
  // VALIDATION
  // ==========================================

  const isFormValid = useCallback(() => {
    if (!selectedTemplate || !selectedUI) return false;

    // Check required fields
    for (const field of selectedUI.fields) {
      if (field.required && !templateData[field.key]?.trim()) return false;
    }

    // Check recipient
    if (recipientType === 'individual' && !selectedUser) return false;

    return true;
  }, [selectedTemplate, selectedUI, templateData, recipientType, selectedUser]);

  // ==========================================
  // PREVIEW
  // ==========================================

  const handlePreview = async () => {
    if (!selectedTemplate) return;
    setLoadingPreview(true);
    setPreviewOpen(true);

    try {
      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: selectedTemplate,
          templateData,
          recipients: { type: recipientType },
          preview: true,
        }),
      });
      const data = await res.json();
      setPreviewSubject(data.subject || '');
      setPreviewHtml(data.html || '');
    } catch {
      toast.error('Failed to generate preview');
      setPreviewOpen(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  // ==========================================
  // SEND
  // ==========================================

  const handleSend = async () => {
    if (!isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const recipientLabel =
      recipientType === 'all' ? 'ALL users' :
      recipientType === 'by_plan' ? `all ${selectedPlan.toUpperCase()} plan users` :
      selectedUser?.email || 'the selected user';

    if (!confirm(`Are you sure you want to send this email to ${recipientLabel}? This action cannot be undone.`)) {
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const recipients: any = { type: recipientType };
      if (recipientType === 'individual' && selectedUser) {
        recipients.userId = selectedUser.id;
      }
      if (recipientType === 'by_plan') {
        recipients.planId = selectedPlan;
      }

      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: selectedTemplate,
          templateData,
          recipients,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send');
      }

      setSendResult({ sent: data.sent || 0, failed: data.failed || 0 });
      toast.success(`Email sent to ${data.sent} recipient${data.sent !== 1 ? 's' : ''}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography level="h3" fontWeight={700}>Email Center</Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            Send template-based emails and in-app notifications to users.
          </Typography>
        </Box>

        {/* Stats row */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <StatCard title="Templates" value={EMAIL_TEMPLATE_OPTIONS.length} subtitle="Available templates" icon={Mail} color="primary" />
          <StatCard title="Delivery" value="SMTP" subtitle="Nodemailer transport" icon={Send} color="success" />
          <StatCard title="Notifications" value="In-App" subtitle="Auto-created per send" icon={Inbox} color="warning" />
        </Stack>

        {/* Main Content: Two columns */}
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems="flex-start">

          {/* LEFT COLUMN: Template Picker */}
          <Box sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
            <Card variant="outlined">
              <CardContent sx={{ p: 0 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Mail size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                  </Box>
                  <Box>
                    <Typography level="title-sm" fontWeight={700}>Email Templates</Typography>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                      Select a template to get started
                    </Typography>
                  </Box>
                </Stack>
                <Divider />
                <Stack sx={{ p: 1.5 }} spacing={0.75}>
                  {EMAIL_TEMPLATE_OPTIONS.map(template => {
                    const ui = TEMPLATE_UI[template.value];
                    const Icon = ui?.icon || Mail;
                    const color = ui?.color || '#D97757';
                    const isSelected = selectedTemplate === template.value;
                    return (
                      <Card
                        key={template.value}
                        variant={isSelected ? 'soft' : 'plain'}
                        sx={{
                          cursor: 'pointer',
                          p: 0,
                          transition: 'all 0.15s',
                          border: '1.5px solid',
                          borderColor: isSelected ? '#D97757' : 'transparent',
                          bgcolor: isSelected ? 'rgba(217, 119, 87, 0.06)' : 'transparent',
                          '&:hover': {
                            bgcolor: isSelected ? 'rgba(217, 119, 87, 0.06)' : 'neutral.softBg',
                          },
                        }}
                        onClick={() => handleSelectTemplate(template.value)}
                      >
                        <CardContent sx={{ p: 1.5 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{
                              width: 32, height: 32, borderRadius: 'md',
                              bgcolor: `${color}14`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <Icon size={14} style={{ color }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography level="body-sm" fontWeight={600} noWrap>{template.label}</Typography>
                              <Typography level="body-xs" sx={{ color: 'text.tertiary' }} noWrap>
                                {template.description}
                              </Typography>
                            </Box>
                            {isSelected && (
                              <CheckCircle size={14} style={{ color: '#D97757', flexShrink: 0 }} />
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* RIGHT COLUMN: Form + Recipients + Actions */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {!selectedTemplate ? (
              <Card variant="soft" sx={{ minHeight: 400 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 10 }}>
                  <Mail size={40} style={{ color: 'var(--joy-palette-neutral-400)', marginBottom: 12 }} />
                  <Typography level="title-md" fontWeight={600} sx={{ color: 'text.secondary' }}>
                    Select an email template
                  </Typography>
                  <Typography level="body-sm" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                    Choose a template from the left to start composing your email.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={2.5}>
                {/* Template Fields Card */}
                <Card variant="outlined">
                  <CardContent sx={{ p: 0 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
                      <Box sx={{
                        width: 36, height: 36, borderRadius: 'md',
                        bgcolor: `${selectedUI?.color || '#D97757'}14`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {(() => {
                          const Icon = selectedUI?.icon || Mail;
                          return <Icon size={16} style={{ color: selectedUI?.color || '#D97757' }} />;
                        })()}
                      </Box>
                      <Box>
                        <Typography level="title-sm" fontWeight={700}>
                          {selectedOption?.label} Template
                        </Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                          {selectedOption?.description}
                        </Typography>
                      </Box>
                    </Stack>
                    <Divider />
                    <Stack spacing={2.5} sx={{ p: 2.5 }}>
                      {selectedUI?.fields.map(field => (
                        <FormControl key={field.key} size="sm">
                          <FormLabel>
                            {field.label}
                            {field.required && <Typography component="span" sx={{ color: 'danger.500', ml: 0.25 }}>*</Typography>}
                          </FormLabel>
                          {field.type === 'textarea' ? (
                            <Textarea
                              minRows={3}
                              maxRows={8}
                              size="sm"
                              placeholder={field.placeholder}
                              value={templateData[field.key] || ''}
                              onChange={e => handleFieldChange(field.key, e.target.value)}
                            />
                          ) : (
                            <Input
                              size="sm"
                              placeholder={field.placeholder}
                              value={templateData[field.key] || ''}
                              onChange={e => handleFieldChange(field.key, e.target.value)}
                            />
                          )}
                        </FormControl>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                {/* Recipients Card */}
                <Card variant="outlined">
                  <CardContent sx={{ p: 0 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
                      <Box sx={{
                        width: 36, height: 36, borderRadius: 'md', bgcolor: 'warning.softBg',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Users size={16} style={{ color: 'var(--joy-palette-warning-500)' }} />
                      </Box>
                      <Box>
                        <Typography level="title-sm" fontWeight={700}>Recipients</Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                          Choose who will receive this email
                        </Typography>
                      </Box>
                    </Stack>
                    <Divider />
                    <Stack spacing={2.5} sx={{ p: 2.5 }}>
                      <FormControl size="sm">
                        <FormLabel>Send To</FormLabel>
                        <Select
                          size="sm"
                          value={recipientType}
                          onChange={(_, v) => {
                            if (v) {
                              setRecipientType(v as RecipientType);
                              setSelectedUser(null);
                              setSearchResults([]);
                              setUserSearch('');
                            }
                          }}
                        >
                          <Option value="individual">Individual User</Option>
                          <Option value="all">All Users</Option>
                          <Option value="by_plan">By Plan</Option>
                        </Select>
                      </FormControl>

                      {/* Individual user search */}
                      {recipientType === 'individual' && (
                        <Box>
                          <FormControl size="sm">
                            <FormLabel>Search User</FormLabel>
                            <Input
                              size="sm"
                              placeholder="Search by email or name..."
                              startDecorator={searching ? <CircularProgress size="sm" sx={{ '--CircularProgress-size': '16px' }} /> : <Search size={14} />}
                              value={userSearch}
                              onChange={e => {
                                setUserSearch(e.target.value);
                                setSelectedUser(null);
                              }}
                            />
                          </FormControl>

                          {/* Selected user chip */}
                          {selectedUser && (
                            <Card variant="soft" color="success" sx={{ mt: 1.5, p: 0 }}>
                              <CardContent sx={{ p: 1.5 }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                  <CheckCircle size={14} style={{ color: 'var(--joy-palette-success-600)', flexShrink: 0 }} />
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography level="body-sm" fontWeight={600}>
                                      {selectedUser.name || selectedUser.email}
                                    </Typography>
                                    {selectedUser.name && (
                                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                                        {selectedUser.email}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Button
                                    size="sm" variant="plain" color="neutral"
                                    onClick={() => { setSelectedUser(null); setUserSearch(''); }}
                                    sx={{ minWidth: 'auto', px: 1 }}
                                  >
                                    <XCircle size={14} />
                                  </Button>
                                </Stack>
                              </CardContent>
                            </Card>
                          )}

                          {/* Search results dropdown */}
                          {!selectedUser && searchResults.length > 0 && (
                            <Card variant="outlined" sx={{ mt: 1, p: 0 }}>
                              <CardContent sx={{ p: 0 }}>
                                {searchResults.map((user, i) => (
                                  <Box key={user.id}>
                                    {i > 0 && <Divider />}
                                    <Box
                                      sx={{
                                        px: 2, py: 1.25, cursor: 'pointer',
                                        transition: 'background 0.1s',
                                        '&:hover': { bgcolor: 'neutral.softBg' },
                                      }}
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setSearchResults([]);
                                        setUserSearch(user.email);
                                      }}
                                    >
                                      <Typography level="body-sm" fontWeight={500}>
                                        {user.name || user.email}
                                      </Typography>
                                      {user.name && (
                                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                          {user.email}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                ))}
                              </CardContent>
                            </Card>
                          )}

                          {!selectedUser && userSearch.length >= 2 && !searching && searchResults.length === 0 && (
                            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 1 }}>
                              No users found matching &quot;{userSearch}&quot;
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Plan filter */}
                      {recipientType === 'by_plan' && (
                        <FormControl size="sm">
                          <FormLabel>Plan</FormLabel>
                          <Select
                            size="sm"
                            value={selectedPlan}
                            onChange={(_, v) => v && setSelectedPlan(v)}
                          >
                            <Option value="free">Free</Option>
                            <Option value="pro">Pro</Option>
                            <Option value="max">Max</Option>
                          </Select>
                        </FormControl>
                      )}

                      {/* Warning for bulk sends */}
                      {recipientType === 'all' && (
                        <Card variant="soft" color="warning" sx={{ p: 0 }}>
                          <CardContent sx={{ p: 1.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <AlertTriangle size={14} style={{ color: 'var(--joy-palette-warning-600)', flexShrink: 0 }} />
                              <Typography level="body-xs" sx={{ color: 'warning.700' }}>
                                This will send an email to <strong>every registered user</strong>. Use with caution.
                              </Typography>
                            </Stack>
                          </CardContent>
                        </Card>
                      )}

                      {recipientType === 'by_plan' && (
                        <Card variant="soft" color="primary" sx={{ p: 0 }}>
                          <CardContent sx={{ p: 1.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <CreditCard size={14} style={{ color: 'var(--joy-palette-primary-600)', flexShrink: 0 }} />
                              <Typography level="body-xs" sx={{ color: 'primary.700' }}>
                                This will send to all users on the <strong>{selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}</strong> plan.
                              </Typography>
                            </Stack>
                          </CardContent>
                        </Card>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                {/* Success result */}
                {sendResult && (
                  <Card variant="soft" color="success" sx={{ p: 0 }}>
                    <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                      <CheckCircle size={28} style={{ color: 'var(--joy-palette-success-600)', margin: '0 auto 8px' }} />
                      <Typography level="title-sm" fontWeight={700} sx={{ color: 'success.700' }}>
                        Emails Sent Successfully
                      </Typography>
                      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1.5 }}>
                        <Chip size="sm" variant="soft" color="success">{sendResult.sent} sent</Chip>
                        {sendResult.failed > 0 && (
                          <Chip size="sm" variant="soft" color="danger">{sendResult.failed} failed</Chip>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                  <Button
                    variant="soft"
                    color="neutral"
                    size="sm"
                    startDecorator={<Eye size={14} />}
                    onClick={handlePreview}
                    disabled={!selectedTemplate}
                  >
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    startDecorator={<Send size={14} />}
                    onClick={handleSend}
                    loading={sending}
                    disabled={!isFormValid()}
                    sx={{
                      bgcolor: '#D97757',
                      '&:hover': { bgcolor: '#C4694D' },
                      '&:disabled': { bgcolor: 'neutral.200' },
                    }}
                  >
                    Send Email
                  </Button>
                </Stack>
              </Stack>
            )}
          </Box>
        </Stack>
      </Stack>

      {/* Preview Modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <ModalDialog
          variant="outlined"
          sx={{
            maxWidth: 680,
            width: '95vw',
            maxHeight: '90vh',
            overflow: 'hidden',
            p: 0,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 2 }}>
            <Box>
              <Typography level="title-sm" fontWeight={700}>Email Preview</Typography>
              {previewSubject && (
                <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }}>
                  Subject: {previewSubject}
                </Typography>
              )}
            </Box>
            <ModalClose sx={{ position: 'static' }} />
          </Stack>
          <Divider />
          <Box sx={{ overflow: 'auto', flex: 1 }}>
            {loadingPreview ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10 }}>
                <CircularProgress size="md" />
              </Box>
            ) : (
              <Box
                sx={{
                  p: 0,
                  bgcolor: '#F1F5F9',
                  minHeight: 400,
                  '& iframe': {
                    width: '100%',
                    minHeight: 500,
                    border: 'none',
                  },
                }}
              >
                <iframe
                  srcDoc={previewHtml}
                  title="Email Preview"
                  sandbox="allow-same-origin"
                  style={{ width: '100%', minHeight: 500, border: 'none' }}
                />
              </Box>
            )}
          </Box>
        </ModalDialog>
      </Modal>
    </Box>
  );
}
