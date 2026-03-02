'use client';
import { useState } from 'react';
import {
  Modal, ModalDialog, ModalClose, Typography, Stack, FormControl,
  FormLabel, Input, Textarea, Button, Divider, Box, Select, Option,
  Card,
} from '@mui/joy';
import { Send, Mail, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/admin-fetch';

const EMAIL_TEMPLATES = [
  { value: 'custom', label: 'Custom Message', description: 'Write a custom email' },
  { value: 'welcome', label: 'Welcome', description: 'Welcome new user to Flowbooks' },
  { value: 'plan_changed', label: 'Plan Changed', description: 'Notify about plan change' },
  { value: 'messages_granted', label: 'Messages Granted', description: 'Notify about bonus messages' },
  { value: 'account_warning', label: 'Account Warning', description: 'Send account warning' },
  { value: 'support_reply', label: 'Support Reply', description: 'Reply to support ticket' },
];

interface SendEmailModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userName?: string;
}

export default function SendEmailModal({ open, onClose, userId, userEmail, userName }: SendEmailModalProps) {
  const [template, setTemplate] = useState('custom');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [planName, setPlanName] = useState('');
  const [messageAmount, setMessageAmount] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [sending, setSending] = useState(false);

  const resetForm = () => {
    setTemplate('custom');
    setSubject('');
    setMessage('');
    setPlanName('');
    setMessageAmount('');
    setWarningMessage('');
    setTicketSubject('');
  };

  const handleSend = async () => {
    if (template === 'custom' && (!subject.trim() || !message.trim())) {
      toast.error('Please fill in subject and message');
      return;
    }

    setSending(true);
    try {
      const body: Record<string, any> = {
        templateType: template,
        userName: userName || userEmail?.split('@')[0],
        userEmail,
      };

      switch (template) {
        case 'custom':
          body.customSubject = subject.trim();
          body.customMessage = message.trim();
          break;
        case 'plan_changed':
          body.planName = planName || 'Pro';
          break;
        case 'tokens_granted':
          body.messageAmount = parseInt(messageAmount) || 50;
          break;
        case 'account_warning':
          body.warningMessage = warningMessage.trim() || 'Your account requires attention.';
          break;
        case 'support_reply':
          body.ticketSubject = ticketSubject.trim() || 'Your support request';
          body.replyMessage = message.trim();
          break;
      }

      const res = await adminFetch(`/api/admin/users/${userId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(`Email sent to ${userEmail}`);
      resetForm();
      onClose();
    } catch {
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ maxWidth: 520, p: 3, maxHeight: '90vh', overflow: 'auto' }}>
        <ModalClose />
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{
            width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Mail size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
          </Box>
          <Box>
            <Typography level="title-md" fontWeight={700}>Send Email</Typography>
            <Typography level="body-xs" sx={{ color: 'text.secondary' }}>To: {userEmail}</Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Stack spacing={2}>
          <FormControl size="sm">
            <FormLabel>Email Template</FormLabel>
            <Select value={template} onChange={(_, v) => v && setTemplate(v)} size="sm">
              {EMAIL_TEMPLATES.map(t => (
                <Option key={t.value} value={t.value}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <FileText size={12} />
                    <Typography level="body-sm">{t.label}</Typography>
                  </Stack>
                </Option>
              ))}
            </Select>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
              {EMAIL_TEMPLATES.find(t => t.value === template)?.description}
            </Typography>
          </FormControl>

          {template === 'custom' && (
            <>
              <FormControl required size="sm">
                <FormLabel>Subject</FormLabel>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
              </FormControl>
              <FormControl required size="sm">
                <FormLabel>Message</FormLabel>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message..." minRows={4} />
              </FormControl>
            </>
          )}

          {template === 'plan_changed' && (
            <FormControl size="sm">
              <FormLabel>New Plan</FormLabel>
              <Select value={planName} onChange={(_, v) => v && setPlanName(v)} size="sm" placeholder="Select plan">
                <Option value="Free">Free</Option>
                <Option value="Pro">Pro</Option>
                <Option value="Max">Max</Option>
              </Select>
            </FormControl>
          )}

          {template === 'messages_granted' && (
            <FormControl size="sm">
              <FormLabel>Message Amount</FormLabel>
              <Input type="number" value={messageAmount} onChange={(e) => setMessageAmount(e.target.value)}
                placeholder="e.g., 50" />
            </FormControl>
          )}

          {template === 'account_warning' && (
            <FormControl size="sm">
              <FormLabel>Warning Message</FormLabel>
              <Textarea value={warningMessage} onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="Describe the warning..." minRows={3} />
            </FormControl>
          )}

          {template === 'support_reply' && (
            <>
              <FormControl size="sm">
                <FormLabel>Ticket Subject</FormLabel>
                <Input value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Original ticket subject" />
              </FormControl>
              <FormControl size="sm">
                <FormLabel>Reply Message</FormLabel>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your reply..." minRows={4} />
              </FormControl>
            </>
          )}

          {template === 'welcome' && (
            <Card variant="soft" sx={{ p: 2 }}>
              <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                This will send a welcome email to {userName || userEmail} with onboarding instructions
                and feature highlights. No additional input needed.
              </Typography>
            </Card>
          )}

          <Button size="sm" startDecorator={<Send size={14} />} onClick={handleSend} loading={sending}>
            Send Email
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
