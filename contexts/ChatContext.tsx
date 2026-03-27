'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Chat, ChatMessage, ChatAttachment, ChatMessageRichData, ChatSettings, ToolCall, ThinkingStep } from '@/types';
import {
  getChats,
  createChat,
  updateChat,
  deleteChat as deleteChatService,
  deleteAllChats,
  getMessages,
  addMessage,
  updateMessageCompletedActions,
  updateChatTitleFromMessage,
  generateDefaultChatTitle,
} from '@/services/chats';
import toast from 'react-hot-toast';
import { executeAITool, ToolResult } from '@/services/ai-tools';
import { RichResponse, ActionButton } from '@/lib/ai-config';
import { useSubscription } from '@/contexts/SubscriptionContext';

// ==========================================
// SESSION USAGE TRACKING
// ==========================================

export interface SessionUsage {
  totalMessages: number;
  requestCount: number;
}

const EMPTY_SESSION_USAGE: SessionUsage = {
  totalMessages: 0,
  requestCount: 0,
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function sanitizeForFirestore(data: any): any {
  if (data === null || data === undefined) return data;
  if (data && typeof data === 'object' && typeof data.toDate === 'function') return data.toDate().toISOString();
  if (data && typeof data === 'object' && data._methodName === 'serverTimestamp') return new Date().toISOString();
  if (data instanceof Date) return data.toISOString();
  if (Array.isArray(data)) return data.map(item => sanitizeForFirestore(item));
  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      sanitized[key] = sanitizeForFirestore(data[key]);
    }
    return sanitized;
  }
  return data;
}

// ==========================================
// CONTEXT INTERFACE
// ==========================================

// ==========================================
// TOOL LABEL MAPPING
// ==========================================

const TOOL_LABELS: Record<string, string | ((args: Record<string, any>) => string)> = {
  add_customer: (a) => `Adding customer${a?.name ? ` "${a.name}"` : ''}`,
  get_customer: () => 'Looking up customer',
  list_customers: () => 'Fetching customers',
  search_customers: (a) => `Searching customers${a?.query ? ` for "${a.query}"` : ''}`,
  update_customer: () => 'Updating customer',
  delete_customer: () => 'Deleting customer',
  add_vendor: (a) => `Adding vendor${a?.name ? ` "${a.name}"` : ''}`,
  get_vendor: () => 'Looking up vendor',
  list_vendors: () => 'Fetching vendors',
  search_vendors: (a) => `Searching vendors${a?.query ? ` for "${a.query}"` : ''}`,
  update_vendor: () => 'Updating vendor',
  delete_vendor: () => 'Deleting vendor',
  add_employee: (a) => `Adding employee${a?.name ? ` "${a.name}"` : ''}`,
  get_employee: () => 'Looking up employee',
  list_employees: () => 'Fetching employees',
  update_employee: () => 'Updating employee',
  delete_employee: () => 'Deleting employee',
  create_invoice: (a) => `Creating invoice${a?.customerName ? ` for ${a.customerName}` : ''}`,
  get_invoice: () => 'Loading invoice',
  list_invoices: () => 'Fetching invoices',
  search_invoices: () => 'Searching invoices',
  update_invoice: () => 'Updating invoice',
  delete_invoice: () => 'Deleting invoice',
  change_invoice_status: (a) => `Updating invoice status${a?.status ? ` to ${a.status}` : ''}`,
  send_invoice: () => 'Sending invoice to customer',
  create_bill: (a) => `Creating bill${a?.vendorName ? ` from ${a.vendorName}` : ''}`,
  get_bill: () => 'Loading bill',
  list_bills: () => 'Fetching bills',
  update_bill: () => 'Updating bill',
  delete_bill: () => 'Deleting bill',
  change_bill_status: (a) => `Updating bill status${a?.status ? ` to ${a.status}` : ''}`,
  record_transaction: (a) => `Recording ${a?.type || ''} transaction`,
  list_transactions: () => 'Fetching transactions',
  get_account_balance: () => 'Checking account balance',
  list_accounts: () => 'Fetching accounts',
  generate_report: (a) => `Generating ${a?.reportType || ''} report`,
  generate_salary_slip: (a) => `Generating salary slip${a?.employeeName ? ` for ${a.employeeName}` : ''}`,
  list_salary_slips: () => 'Fetching salary slips',
};

function getToolLabel(name: string, args?: Record<string, any>): string {
  const entry = TOOL_LABELS[name];
  if (typeof entry === 'function') return entry(args || {});
  if (typeof entry === 'string') return entry;
  return `Processing ${name.replace(/_/g, ' ')}`;
}

/** Strip [Action: ...] patterns from AI response text */
function stripActionPatterns(text: string): string {
  return text
    .replace(/\[Action:\s*[^\]]*\]/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface ChatContextType {
  sessions: Chat[];
  currentSessionId: string | null;
  currentMessages: ChatMessage[];
  isLoadingSessions: boolean;
  sessionsLoaded: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  isAITyping: boolean;
  thinkingSteps: ThinkingStep[];
  startNewChat: () => void;
  createNewChat: () => Promise<string>;
  selectChat: (sessionId: string) => Promise<void>;
  renameChat: (sessionId: string, newTitle: string) => Promise<void>;
  deleteChat: (sessionId: string) => Promise<void>;
  sendMessage: (content: string, onChatCreated?: (chatId: string) => void, files?: File[]) => Promise<void>;
  executeToolAction: (toolName: string, args: Record<string, any>, sourceMessageId?: string, actionKey?: string) => Promise<void>;
  processAllDocumentEntries: () => Promise<void>;
  pendingDocumentEntries: any[];
  clearAllChats: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  chatSettings: ChatSettings;
  updateChatSettings: (settings: Partial<ChatSettings>) => void;
  sessionUsage: SessionUsage;
  resetSessionUsage: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredSessions: Chat[];
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  messageLimitReached: boolean;
  dismissMessageLimit: () => void;
}

const defaultSettings: ChatSettings = {
  showTimestamps: true,
  voiceInputEnabled: true,
  defaultGreeting: true,
};

const ChatContext = createContext<ChatContextType | null>(null);

// ==========================================
// PROVIDER COMPONENT
// ==========================================

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { company, refreshData } = useCompany();
  const { refreshSubscription, refreshUsage } = useSubscription();

  const [sessions, setSessions] = useState<Chat[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chat_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const [chatSettings, setChatSettings] = useState<ChatSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat_settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    }
    return defaultSettings;
  });

  const [sessionUsage, setSessionUsage] = useState<SessionUsage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flow_ai_session_usage');
      return saved ? JSON.parse(saved) : EMPTY_SESSION_USAGE;
    }
    return EMPTY_SESSION_USAGE;
  });

  const [searchTerm, setSearchTerm] = useState('');

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('flow_ai_model') || 'gpt-4.1-mini';
    }
    return 'gpt-4.1-mini';
  });

  const [messageLimitReached, setMessageLimitReached] = useState(false);
  const dismissMessageLimit = useCallback(() => setMessageLimitReached(false), []);

  // Document context persistence — tracks unprocessed entries from uploaded documents
  const [pendingDocumentEntries, setPendingDocumentEntries] = useState<any[]>([]);
  const [processedEntryTypes, setProcessedEntryTypes] = useState<Set<string>>(new Set());

  const filteredSessions = searchTerm
    ? sessions.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : sessions;

  // Persistence effects
  useEffect(() => {
    if (company?.id && user?.uid) loadSessions();
  }, [company?.id, user?.uid]);

  useEffect(() => { localStorage.setItem('chat_sidebar_collapsed', String(sidebarCollapsed)); }, [sidebarCollapsed]);
  useEffect(() => { localStorage.setItem('chat_settings', JSON.stringify(chatSettings)); }, [chatSettings]);
  useEffect(() => { localStorage.setItem('flow_ai_session_usage', JSON.stringify(sessionUsage)); }, [sessionUsage]);
  useEffect(() => { localStorage.setItem('flow_ai_model', selectedModel); }, [selectedModel]);

  const resetSessionUsage = useCallback(() => {
    setSessionUsage(EMPTY_SESSION_USAGE);
    localStorage.removeItem('flow_ai_session_usage');
  }, []);

  const loadSessions = useCallback(async () => {
    if (!company?.id || !user?.uid) return;
    setIsLoadingSessions(true);
    try {
      const loadedSessions = await getChats(company.id, user.uid);
      setSessions(loadedSessions);
      setSessionsLoaded(true);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast.error('Failed to load chat history');
      setSessionsLoaded(true);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [company?.id, user?.uid]);

  const startNewChat = useCallback(() => {
    setCurrentSessionId(null);
    setCurrentMessages([]);
    if (company?.id) localStorage.removeItem(`last_chat_session_${company.id}`);
  }, [company?.id]);

  const createNewChat = useCallback(async (): Promise<string> => {
    if (!company?.id || !user?.uid) throw new Error('No company or user context');
    try {
      const title = generateDefaultChatTitle();
      const chatId = await createChat(company.id, { title, ownerId: user.uid });
      await loadSessions();
      setCurrentSessionId(chatId);
      setCurrentMessages([]);
      localStorage.setItem(`last_chat_session_${company.id}`, chatId);
      return chatId;
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create new chat');
      throw error;
    }
  }, [company?.id, user?.uid, loadSessions]);

  const selectChat = useCallback(async (sessionId: string) => {
    if (!company?.id) return;
    setIsLoadingMessages(true);
    setCurrentSessionId(sessionId);
    localStorage.setItem(`last_chat_session_${company.id}`, sessionId);
    try {
      const messages = await getMessages(company.id, sessionId);
      setCurrentMessages(messages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
      setCurrentMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [company?.id]);

  const renameChat = useCallback(async (sessionId: string, newTitle: string) => {
    if (!company?.id) return;
    try {
      await updateChat(company.id, sessionId, { title: newTitle });
      setSessions(prev => prev.map(s => (s.id === sessionId ? { ...s, title: newTitle } : s)));
      toast.success('Chat renamed');
    } catch (error) {
      console.error('Error renaming chat:', error);
      toast.error('Failed to rename chat');
    }
  }, [company?.id]);

  const deleteChat = useCallback(async (sessionId: string) => {
    if (!company?.id) return;
    try {
      await deleteChatService(company.id, sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setCurrentMessages([]);
        localStorage.removeItem(`last_chat_session_${company.id}`);
      }
      toast.success('Chat deleted');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  }, [company?.id, currentSessionId]);

  const clearAllChats = useCallback(async () => {
    if (!company?.id || !user?.uid) return;
    try {
      const count = await deleteAllChats(company.id, user.uid);
      setSessions([]);
      setCurrentSessionId(null);
      setCurrentMessages([]);
      localStorage.removeItem(`last_chat_session_${company.id}`);
      toast.success(`Deleted ${count} chat${count !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error clearing chats:', error);
      toast.error('Failed to clear chats');
    }
  }, [company?.id, user?.uid]);

  const sendMessage = useCallback(
    async (content: string, onChatCreated?: (chatId: string) => void, files?: File[]) => {
      if (!company?.id || !user?.uid || (!content.trim() && (!files || files.length === 0))) return;
      if (isSendingMessage) return; // Prevent concurrent sends

      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = await createNewChat();
        if (onChatCreated) onChatCreated(sessionId);
      }

      setIsSendingMessage(true);

      // Upload files if any
      let attachments: ChatAttachment[] | undefined;
      if (files && files.length > 0) {
        setIsAITyping(true);
        setThinkingSteps([{ id: 'upload', label: `Uploading ${files.length} file${files.length > 1 ? 's' : ''}`, status: 'in_progress' }]);
        try {
          const { uploadChatFile } = await import('@/lib/chat-upload');
          attachments = [];
          for (const file of files) {
            const att = await uploadChatFile(file, company.id, sessionId);
            attachments.push(att);
          }
          setThinkingSteps(prev => prev.map(s => s.id === 'upload' ? { ...s, status: 'completed' as const } : s));
        } catch (uploadErr) {
          console.error('File upload error:', uploadErr);
          setIsAITyping(false);
          setThinkingSteps([]);
          setIsSendingMessage(false);
          const { default: toast } = await import('react-hot-toast');
          toast.error(uploadErr instanceof Error ? uploadErr.message : 'Failed to upload file');
          return;
        }
      }

      const displayContent = content.trim() || (attachments ? `Attached ${attachments.map(a => a.name).join(', ')}` : '');

      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: displayContent,
        attachments,
        createdAt: { toDate: () => new Date() } as any,
      };
      setCurrentMessages(prev => [...prev, userMessage]);

      // Start typing indicator (no accordion — only shown when tool calls are detected)
      setIsAITyping(true);
      setThinkingSteps(prev => prev.length > 0 ? prev : []);

      try {
        await addMessage(company.id, sessionId, { role: 'user', content: displayContent, attachments });

        const currentChat = sessions.find(s => s.id === sessionId);
        if (currentChat?.title.startsWith('New Chat -')) {
          await updateChatTitleFromMessage(company.id, sessionId, displayContent);
          await loadSessions();
        }

        // Analyze attachments if present
        let documentContext = '';
        let documentAnalyses: any[] = [];
        if (attachments && attachments.length > 0) {
          setThinkingSteps(prev => [
            ...prev.filter(s => s.status === 'completed'),
            { id: 'analyze', label: `Analyzing ${attachments!.length > 1 ? 'documents' : attachments![0].name}`, status: 'in_progress' as const },
          ]);

          try {
            for (const att of attachments) {
              const res = await fetch('/api/chat/analyze-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fileUrl: att.url,
                  fileName: att.name,
                  mimeType: att.mimeType,
                  companyId: company.id,
                  userId: user.uid,
                }),
              });
              if (res.ok) {
                const data = await res.json();
                console.log('[ChatContext] Document analysis response:', JSON.stringify(data.analysis).substring(0, 500));
                if (data.analysis) {
                  documentAnalyses.push(data.analysis);
                  att.extractedData = data.analysis;
                }
              } else {
                const errText = await res.text().catch(() => 'unknown');
                console.error('[ChatContext] Document analysis failed:', res.status, errText.substring(0, 300));
              }
            }

            if (documentAnalyses.length > 0) {
              documentContext = '\n\n[ATTACHED DOCUMENT ANALYSIS]\n' +
                'IMPORTANT: Present a BRIEF summary of the document (2-3 sentences max). ' +
                'Do NOT list individual entries — the data is shown in a table below your message. ' +
                'Simply say what the document contains and ask the user what they want to do. ' +
                'If multiple entry types exist (invoices + journal entries + bills etc.), offer a "Process all entries" option. ' +
                'Do NOT auto-execute tool calls yet. Wait for the user to confirm.\n\n' +
                documentAnalyses.map((a, i) => {
                  let docInfo = `Document ${i + 1}: ${attachments![i].name}\nType: ${a.documentType}\nSummary: ${a.summary}\nSuggested action: ${a.suggestedAction}`;
                  if (a.entries && a.entries.length > 0) {
                    docInfo += `\nEntries count: ${a.entries.length}`;
                    docInfo += `\nEntries: ${JSON.stringify(a.entries, null, 2)}`;
                  }
                  if (a.rawText) {
                    docInfo += `\n\nRaw document content:\n${a.rawText}`;
                  }
                  return docInfo;
                }).join('\n\n');
            }

            setThinkingSteps(prev => prev.map(s => s.id === 'analyze' ? { ...s, status: 'completed' as const } : s));
          } catch (analyzeErr) {
            console.warn('Document analysis failed:', analyzeErr);
            setThinkingSteps(prev => prev.map(s => s.id === 'analyze' ? { ...s, status: 'error' as const, label: 'Analysis failed — sending without context' } : s));
          }
        }

        // Build the message to send to AI (include document context if any)
        const aiMessage = (content.trim() || (attachments ? `I've attached ${attachments.map(a => a.name).join(', ')}. Please analyze and process this document.` : '')) + documentContext;

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: aiMessage,
            companyId: company.id,
            userId: user.uid,
            chatId: sessionId,
            model: selectedModel,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

          // Handle usage limit (session or weekly)
          if (response.status === 403 && errorData.error === 'message_limit_reached') {
            refreshSubscription();
            refreshUsage();
            setMessageLimitReached(true);
            setIsAITyping(false);
            setThinkingSteps([]);
            const limitMsg: ChatMessage = {
              id: `temp-limit-${Date.now()}`,
              role: 'assistant',
              content: errorData.message || "You've reached your usage limit. Please wait for it to reset or upgrade your plan.",
              createdAt: { toDate: () => new Date() } as any,
            };
            setCurrentMessages(prev => [...prev, limitMsg]);
            setIsSendingMessage(false);
            return;
          }

          throw new Error(errorData.error || 'Failed to get AI response');
        }

        let data = await response.json();

        // Track token usage
        if (data.usage) {
          setSessionUsage(prev => ({
            totalMessages: prev.totalMessages + 1,
            requestCount: prev.requestCount + 1,
          }));
        }

        let finalMessage = stripActionPatterns(data.message || '');
        let richData: ChatMessage['richData'] | undefined;
        let richDataList: ChatMessage['richDataList'] | undefined;
        let actions: ChatMessage['actions'] | undefined;
        let followUp: string | undefined;

        // Build rich data grid from document analysis results
        if (documentAnalyses.length > 0 && (!data.toolCalls || data.toolCalls.length === 0)) {
          const allEntries = documentAnalyses.flatMap(a => a.entries || []);
          if (allEntries.length > 0) {
            // Build grid items from extracted entries
            const gridItems = allEntries.map((entry: any, idx: number) => {
              const d = entry.data || {};
              const type = entry.type || 'unknown';
              // Normalize different entry types into table rows
              if (type === 'invoice' || type === 'bill') {
                return {
                  '#': idx + 1,
                  type: type.charAt(0).toUpperCase() + type.slice(1),
                  name: d.customerName || d.vendorName || '-',
                  description: d.items?.[0]?.description || d.description || '-',
                  amount: d.total || d.subtotal || 0,
                  date: d.dueDate || d.date || '-',
                  reference: d.invoiceNumber || d.billNumber || '-',
                };
              } else if (type === 'expense' || type === 'payment') {
                return {
                  '#': idx + 1,
                  type: type.charAt(0).toUpperCase() + type.slice(1),
                  name: d.vendor || d.from || d.to || '-',
                  description: d.description || d.category || '-',
                  amount: d.amount || 0,
                  date: d.date || '-',
                  reference: d.reference || '-',
                };
              } else if (type === 'journal_entry') {
                const totalDebits = (d.debits || []).reduce((sum: number, db: any) => sum + (db.amount || 0), 0);
                return {
                  '#': idx + 1,
                  type: 'Journal Entry',
                  name: (d.debits?.[0]?.account || '') + ' / ' + (d.credits?.[0]?.account || ''),
                  description: d.description || '-',
                  amount: totalDebits,
                  date: d.date || '-',
                  reference: '-',
                };
              } else if (type === 'customer' || type === 'vendor') {
                return {
                  '#': idx + 1,
                  type: type.charAt(0).toUpperCase() + type.slice(1),
                  name: d.name || '-',
                  description: d.email || d.phone || '-',
                  amount: 0,
                  date: '-',
                  reference: d.address || '-',
                };
              }
              return {
                '#': idx + 1,
                type: type,
                name: d.name || d.customerName || d.vendorName || '-',
                description: d.description || '-',
                amount: d.total || d.amount || 0,
                date: d.date || '-',
                reference: '-',
              };
            });

            const docType = documentAnalyses[0].documentType || 'document';
            richData = {
              type: 'list' as const,
              entityType: docType,
              items: gridItems,
              columns: [
                { key: '#', label: '#', type: 'text' as const },
                { key: 'type', label: 'Type', type: 'text' as const },
                { key: 'name', label: 'Name', type: 'text' as const },
                { key: 'description', label: 'Description', type: 'text' as const },
                { key: 'amount', label: 'Amount', type: 'currency' as const },
                { key: 'date', label: 'Date', type: 'text' as const },
                { key: 'reference', label: 'Reference', type: 'text' as const },
              ],
              summary: {
                total: gridItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0),
                count: gridItems.length,
                documentType: docType,
                suggestedAction: documentAnalyses[0].suggestedAction,
              },
            };

            // Store all entries for document context persistence
            setPendingDocumentEntries(allEntries);
            setProcessedEntryTypes(new Set());

            // Add suggestion buttons for processing the entries
            followUp = `Would you like me to process all ${allEntries.length} entries?`;
          }
        }

        // Retry once if AI narrated actions without calling tools
        if ((!data.toolCalls || data.toolCalls.length === 0) && finalMessage &&
            /\b(execut|proceed|start|begin|work on|carry out|handl)(ing|e)\b/i.test(finalMessage)) {
          setThinkingSteps([{ id: 'retry', label: 'Processing actions', status: 'in_progress' as const }]);
          try {
            const retryRes = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: 'Execute the tool calls now. Do not describe what you will do — call the functions.',
                companyId: company.id,
                userId: user.uid,
                chatId: sessionId,
                model: selectedModel,
              }),
            });
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              if (retryData.usage) {
                setSessionUsage(prev => ({
                  totalMessages: prev.totalMessages + 1,
                  requestCount: prev.requestCount + 1,
                }));
              }
              if (retryData.toolCalls && retryData.toolCalls.length > 0) {
                data = retryData;
                finalMessage = stripActionPatterns(data.message || '');
              }
            }
          } catch (retryErr) {
            console.warn('Retry failed:', retryErr);
          }
          setThinkingSteps(prev => prev.map(s => s.id === 'retry' ? { ...s, status: 'completed' as const } : s));
        }

        if (data.toolCalls && data.toolCalls.length > 0) {
          // Set tool call steps (accordion only appears now)
          const toolSteps: ThinkingStep[] = data.toolCalls.map((tc: any, i: number) => ({
            id: `tool-${i}`,
            label: getToolLabel(tc.name, tc.args || tc.input),
            status: 'pending' as const,
          }));
          setThinkingSteps(toolSteps);

          // Execute tool calls in parallel for speed (batch operations like "create all invoices")
          const results: ToolResult[] = [];
          const PARALLEL_BATCH_SIZE = 5; // Process up to 5 tools concurrently
          for (let batchStart = 0; batchStart < data.toolCalls.length; batchStart += PARALLEL_BATCH_SIZE) {
            const batch = data.toolCalls.slice(batchStart, batchStart + PARALLEL_BATCH_SIZE);
            const batchIndices = batch.map((_: any, i: number) => batchStart + i);

            // Mark batch as in_progress
            setThinkingSteps(prev => prev.map(s => {
              const idx = parseInt(s.id.replace('tool-', ''));
              return batchIndices.includes(idx) ? { ...s, status: 'in_progress' as const } : s;
            }));

            const batchResults = await Promise.all(
              batch.map((toolCall: any) =>
                executeAITool(
                  toolCall.name,
                  toolCall.args || toolCall.input,
                  { companyId: company.id, userId: user.uid }
                )
              )
            );
            results.push(...batchResults);

            // Mark batch as completed
            setThinkingSteps(prev => prev.map(s => {
              const idx = parseInt(s.id.replace('tool-', ''));
              return batchIndices.includes(idx) ? { ...s, status: 'completed' as const } : s;
            }));
          }

          // === FOLLOW-UP ROUND ===
          // Send tool results back to AI for potential follow-up actions (e.g., create invoice → send invoice)
          // Skip follow-up for simple CRUD tools that never need a second AI turn
          const NO_FOLLOWUP_TOOLS = new Set([
            // Simple CRUD / read-only — never need a second AI turn
            'add_customer', 'update_customer', 'add_vendor', 'update_vendor',
            'record_expense', 'record_payment', 'add_account', 'update_account',
            'list_invoices', 'list_customers', 'list_vendors', 'list_accounts',
            'list_transactions', 'list_expenses', 'list_payments',
            'get_invoice', 'get_customer', 'get_vendor', 'get_account',
            'get_transaction', 'get_expense',
            'send_payment_reminder', 'send_payment_reminders',
            'delete_invoice', 'delete_customer', 'delete_vendor',
            // NOTE: create_invoice is intentionally NOT listed here so the AI can
            // chain send_invoice in the follow-up when the user asked for it.
          ]);
          const toolCallNames: string[] = (data.toolCalls || []).map((tc: any) => tc.name as string);
          const needsFollowUp = toolCallNames.some((name: string) => !NO_FOLLOWUP_TOOLS.has(name));

          let allResults = [...results];
          let hasFollowUpMessage = false;
          if (needsFollowUp && data.rawToolCalls && data.rawToolCalls.length > 0 && results.some(r => r.success)) {
            const followUpPayload = results.map((r, i) => ({
              toolCallId: data.rawToolCalls[i]?.id || data.toolCalls[i].id,
              result: JSON.stringify({
                success: r.success,
                message: r.message,
                entityId: r.data?.entity?.id,
                entityType: r.data?.entityType,
                // Include invoiceId explicitly so the AI can chain send_invoice
                ...(r.data?.entityType === 'invoice' && r.data?.entity?.id
                  ? { invoiceId: r.data.entity.id }
                  : {}),
              }),
            }));

            // Mark all tool steps as done — don't show a separate "Checking next steps" indicator
            setThinkingSteps(prev => prev.map(s => ({ ...s, status: 'completed' as const })));

            try {
              const followUpRes = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  companyId: company.id,
                  userId: user.uid,
                  chatId: sessionId,
                  model: selectedModel,
                  toolResults: followUpPayload,
                  originalAssistant: {
                    content: data.rawContent,
                    toolCalls: data.rawToolCalls,
                  },
                }),
              });

              if (followUpRes.ok) {
                const followUpData = await followUpRes.json();

                // Track message usage from follow-up
                if (followUpData.usage) {
                  setSessionUsage(prev => ({
                    totalMessages: prev.totalMessages + 1,
                    requestCount: prev.requestCount + 1,
                  }));
                }

                // followup step already removed from UI

                if (followUpData.toolCalls && followUpData.toolCalls.length > 0) {
                  // Execute follow-up tool calls
                  const fSteps: ThinkingStep[] = followUpData.toolCalls.map((tc: any, i: number) => ({
                    id: `ftool-${i}`,
                    label: getToolLabel(tc.name, tc.args || tc.input),
                    status: 'pending' as const,
                  }));
                  setThinkingSteps(prev => [
                    ...prev.map(s => ({ ...s, status: 'completed' as const })),
                    ...fSteps,
                  ]);

                  for (let i = 0; i < followUpData.toolCalls.length; i++) {
                    const tc = followUpData.toolCalls[i];
                    setThinkingSteps(prev => prev.map(s => s.id === `ftool-${i}` ? { ...s, status: 'in_progress' as const } : s));
                    const fResult = await executeAITool(
                      tc.name,
                      tc.args || tc.input,
                      { companyId: company.id, userId: user.uid }
                    );
                    allResults.push(fResult);
                    setThinkingSteps(prev => prev.map(s => s.id === `ftool-${i}` ? { ...s, status: 'completed' as const } : s));
                  }
                }

                // Use follow-up AI message if meaningful
                if (followUpData.message && followUpData.message.trim()) {
                  finalMessage = stripActionPatterns(followUpData.message);
                  hasFollowUpMessage = true;
                }
              }
            } catch (followUpErr) {
              console.warn('Follow-up round failed:', followUpErr);
              setThinkingSteps(prev => prev.map(s => s.id === 'followup' ? { ...s, status: 'completed' as const } : s));
            }
          }

          const successResults = allResults.filter(r => r.success);

          if (successResults.length > 1) {
            // Use tool result messages unless we have a follow-up AI message
            if (!hasFollowUpMessage) {
              finalMessage = successResults.map(r => r.message).join('\n\n');
            }

            // Separate results by data type
            const entityResults = successResults.filter(r => r.data?.type === 'entity' && r.data?.entity);
            const nonEntityResults = successResults.filter(r => r.data && r.data.type !== 'entity');

            // Build richDataList — collect ALL rich data blocks (entities, lists, summaries)
            const collectedRichData: ChatMessageRichData[] = [];

            // Combine entity results into one block with entities array
            if (entityResults.length > 1) {
              collectedRichData.push({
                type: 'entity',
                entities: entityResults.map(r => ({
                  entityType: r.data!.entityType || 'unknown',
                  entity: r.data!.entity!,
                  actions: r.actions || [],
                })),
              });
            } else if (entityResults.length === 1) {
              const er = entityResults[0];
              collectedRichData.push({
                ...er.data!,
                // Attach actions to single entity via entities array for consistency
                entities: [{
                  entityType: er.data!.entityType || 'unknown',
                  entity: er.data!.entity!,
                  actions: er.actions || [],
                }],
              });
            }

            // Add all non-entity results (lists, summaries, reports)
            nonEntityResults.forEach(r => {
              if (r.data) collectedRichData.push(r.data);
            });

            if (collectedRichData.length > 1) {
              // Multiple different rich data blocks — use richDataList
              richDataList = collectedRichData;
              richData = collectedRichData[0]; // Primary for backward compat
            } else if (collectedRichData.length === 1) {
              richData = collectedRichData[0];
            }

            // Collect actions from entity results (if not already in entities array)
            // and from non-entity results
            const allFlatActions = [
              ...entityResults.flatMap(r => r.actions || []),
              ...nonEntityResults.flatMap(r => r.actions || []),
            ];
            // Only include actions from non-entity results in flat list (entity actions are in entities array)
            const nonEntityActions = nonEntityResults.flatMap(r => r.actions || []);
            actions = nonEntityActions.length > 0 ? nonEntityActions as ChatMessage['actions'] : undefined;

            const lastResult = successResults[successResults.length - 1];
            followUp = lastResult.followUp;
          } else if (successResults.length === 1) {
            finalMessage = successResults[0].message;
            richData = successResults[0].data;
            actions = successResults[0].actions as ChatMessage['actions'];
            followUp = successResults[0].followUp;
          } else {
            finalMessage = results.map(r => r.message).join('\n\n');
          }

          refreshData();
        }

        // Brief pause then clear thinking
        await new Promise(resolve => setTimeout(resolve, 150));
        setIsAITyping(false);
        setThinkingSteps([]);

        // Strip any remaining action patterns from final message
        finalMessage = stripActionPatterns(finalMessage);

        const assistantMessage: ChatMessage = {
          id: `temp-${Date.now() + 1}`,
          role: 'assistant',
          content: finalMessage,
          toolCalls: data.toolCalls,
          richData,
          richDataList,
          actions,
          followUp,
          createdAt: { toDate: () => new Date() } as any,
        };
        setCurrentMessages(prev => [...prev, assistantMessage]);

        await addMessage(company.id, sessionId, {
          role: 'assistant',
          content: finalMessage,
          toolCalls: sanitizeForFirestore(data.toolCalls),
          richData: sanitizeForFirestore(richData),
          richDataList: sanitizeForFirestore(richDataList),
          actions: sanitizeForFirestore(actions),
          followUp,
        });

        // Increment session counters for periodic modals
        if (typeof window !== 'undefined') {
          const fbCount = parseInt(localStorage.getItem('fb_chats_since_show') || '0');
          localStorage.setItem('fb_chats_since_show', String(fbCount + 1));
          const premiumCount = parseInt(localStorage.getItem('premium_chats_since_show') || '0');
          localStorage.setItem('premium_chats_since_show', String(premiumCount + 1));
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
        console.error('Error sending message:', error);
        toast.error(errorMessage);
        setIsAITyping(false);
        setThinkingSteps([]);

        const errorMsg: ChatMessage = {
          id: `temp-error-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorMessage}`,
          createdAt: { toDate: () => new Date() } as any,
        };
        setCurrentMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsSendingMessage(false);
      }
    },
    [company?.id, user?.uid, currentSessionId, currentMessages, sessions, isSendingMessage, createNewChat, loadSessions, refreshData, selectedModel]
  );

  // Direct tool execution — bypasses AI for action button clicks (send invoice, etc.)
  const executeToolAction = useCallback(
    async (toolName: string, args: Record<string, any>, sourceMessageId?: string, actionKey?: string) => {
      if (!company?.id || !user?.uid) return;
      if (isSendingMessage) return;

      const sessionId = currentSessionId;
      if (!sessionId) return;

      setIsSendingMessage(true);
      setIsAITyping(true);
      setThinkingSteps([{ id: 'tool-0', label: getToolLabel(toolName, args), status: 'in_progress' }]);

      try {
        const result = await executeAITool(toolName, args, { companyId: company.id, userId: user.uid });

        setThinkingSteps(prev => prev.map(s => ({ ...s, status: 'completed' as const })));
        await new Promise(resolve => setTimeout(resolve, 200));
        setIsAITyping(false);
        setThinkingSteps([]);

        // Mark the action as completed on the source message (persists across reloads)
        if (result.success && sourceMessageId && actionKey) {
          setCurrentMessages(prev => prev.map(m => {
            if (m.id === sourceMessageId) {
              const updated = [...(m.completedActions || []), actionKey];
              return { ...m, completedActions: updated };
            }
            return m;
          }));

          // Persist to Firestore (non-blocking)
          const srcMsg = currentMessages.find(m => m.id === sourceMessageId);
          const updatedActions = [...(srcMsg?.completedActions || []), actionKey];
          updateMessageCompletedActions(company.id, sessionId, sourceMessageId, updatedActions).catch(err =>
            console.warn('Failed to persist completedActions:', err)
          );
        }

        const finalMessage = stripActionPatterns(result.message || '');
        const richData = result.data;
        const actions = result.actions as ChatMessage['actions'];
        let followUp = result.followUp;

        // Check for remaining unprocessed document entries after this action
        if (pendingDocumentEntries.length > 0) {
          // Determine what type was just processed from the tool name
          const typeMap: Record<string, string> = {
            create_invoice: 'invoice', create_bill: 'bill', record_transaction: 'expense',
            record_expense: 'expense', create_journal_entry: 'journal_entry',
            add_customer: 'customer', add_vendor: 'vendor',
          };
          const processedType = typeMap[toolName] || '';
          if (processedType) {
            const newProcessed = new Set(processedEntryTypes);
            newProcessed.add(processedType);
            setProcessedEntryTypes(newProcessed);

            // Find remaining unprocessed entry types
            const entryTypes = new Set(pendingDocumentEntries.map((e: any) => e.type));
            const remainingTypes = Array.from(entryTypes).filter(t => !newProcessed.has(t));

            if (remainingTypes.length > 0) {
              const typeLabels: Record<string, string> = {
                invoice: 'invoices', bill: 'bills', expense: 'expenses',
                journal_entry: 'journal entries', customer: 'customers', vendor: 'vendors',
                payment: 'payments',
              };
              const remainingLabels = remainingTypes.map(t => typeLabels[t] || t);
              const remainingCounts = remainingTypes.map(t => {
                const count = pendingDocumentEntries.filter((e: any) => e.type === t).length;
                return `${count} ${typeLabels[t] || t}`;
              });
              followUp = `The document also contains ${remainingCounts.join(', ')}. Would you like me to process those too?`;
            } else {
              // All entry types processed — clear pending
              setPendingDocumentEntries([]);
              setProcessedEntryTypes(new Set());
              followUp = 'All entries from the document have been processed!';
            }
          }
        }

        const assistantMessage: ChatMessage = {
          id: `temp-${Date.now() + 1}`,
          role: 'assistant',
          content: finalMessage,
          richData,
          actions,
          followUp,
          createdAt: { toDate: () => new Date() } as any,
        };
        setCurrentMessages(prev => [...prev, assistantMessage]);

        await addMessage(company.id, sessionId, {
          role: 'assistant',
          content: finalMessage,
          richData: sanitizeForFirestore(richData),
          actions: sanitizeForFirestore(actions),
          followUp,
        });

        refreshData();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Action failed';
        console.error('Error executing tool action:', error);
        toast.error(errorMessage);
        setIsAITyping(false);
        setThinkingSteps([]);

        const errorMsg: ChatMessage = {
          id: `temp-error-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorMessage}`,
          createdAt: { toDate: () => new Date() } as any,
        };
        setCurrentMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsSendingMessage(false);
      }
    },
    [company?.id, user?.uid, currentSessionId, currentMessages, isSendingMessage, refreshData, pendingDocumentEntries, processedEntryTypes]
  );

  // Process ALL document entries at once (invoices + bills + journal entries + expenses etc.)
  const processAllDocumentEntries = useCallback(
    async () => {
      if (!company?.id || !user?.uid || pendingDocumentEntries.length === 0) return;
      if (isSendingMessage) return;

      const sessionId = currentSessionId;
      if (!sessionId) return;

      setIsSendingMessage(true);
      setIsAITyping(true);

      try {
        // Group entries by type
        const entriesByType: Record<string, any[]> = {};
        for (const entry of pendingDocumentEntries) {
          const type = entry.type || 'unknown';
          if (!entriesByType[type]) entriesByType[type] = [];
          entriesByType[type].push(entry);
        }

        // Map entry types to tool names
        const typeToTool: Record<string, string> = {
          invoice: 'create_invoice',
          bill: 'create_bill',
          expense: 'record_transaction',
          payment: 'record_transaction',
          journal_entry: 'record_transaction',
          customer: 'add_customer',
          vendor: 'add_vendor',
        };

        // Build all tool calls
        const allToolCalls: { name: string; args: any; label: string }[] = [];
        for (const [type, entries] of Object.entries(entriesByType)) {
          const toolName = typeToTool[type];
          if (!toolName) continue;

          for (const entry of entries) {
            const d = entry.data || {};
            let args: any = {};

            if (type === 'invoice') {
              args = {
                customerName: d.customerName || d.name || 'Unknown',
                items: d.items || [{ description: d.description || 'Item', quantity: 1, rate: d.total || d.amount || 0 }],
                dueDate: d.dueDate || d.date,
                status: 'draft',
              };
            } else if (type === 'bill') {
              args = {
                vendorName: d.vendorName || d.name || 'Unknown',
                items: d.items || [{ description: d.description || 'Item', quantity: 1, rate: d.total || d.amount || 0 }],
                dueDate: d.dueDate || d.date,
                status: 'draft',
              };
            } else if (type === 'journal_entry') {
              args = {
                type: 'journal_entry',
                date: d.date,
                description: d.description || 'Journal entry from document',
                debits: d.debits || [],
                credits: d.credits || [],
              };
            } else if (type === 'expense' || type === 'payment') {
              args = {
                type: 'expense',
                amount: d.amount || d.total || 0,
                description: d.description || d.category || 'Expense from document',
                date: d.date,
                category: d.category,
              };
            } else if (type === 'customer') {
              args = { name: d.name || 'Unknown', email: d.email, phone: d.phone, address: d.address };
            } else if (type === 'vendor') {
              args = { name: d.name || 'Unknown', email: d.email, phone: d.phone, address: d.address };
            }

            const typeLabels: Record<string, string> = {
              invoice: 'Invoice', bill: 'Bill', expense: 'Expense',
              journal_entry: 'Journal Entry', customer: 'Customer', vendor: 'Vendor', payment: 'Payment',
            };
            allToolCalls.push({
              name: toolName,
              args,
              label: `Creating ${typeLabels[type] || type}: ${d.customerName || d.vendorName || d.name || d.description || ''}`,
            });
          }
        }

        if (allToolCalls.length === 0) {
          setIsAITyping(false);
          setIsSendingMessage(false);
          return;
        }

        // Set thinking steps
        const toolSteps: ThinkingStep[] = allToolCalls.map((tc, i) => ({
          id: `tool-${i}`,
          label: tc.label,
          status: 'pending' as const,
        }));
        setThinkingSteps(toolSteps);

        // Execute in parallel batches
        const BATCH_SIZE = 5;
        const results: ToolResult[] = [];
        for (let batchStart = 0; batchStart < allToolCalls.length; batchStart += BATCH_SIZE) {
          const batch = allToolCalls.slice(batchStart, batchStart + BATCH_SIZE);
          const batchIndices = batch.map((_, i) => batchStart + i);

          setThinkingSteps(prev => prev.map(s => {
            const idx = parseInt(s.id.replace('tool-', ''));
            return batchIndices.includes(idx) ? { ...s, status: 'in_progress' as const } : s;
          }));

          const batchResults = await Promise.all(
            batch.map(tc => executeAITool(tc.name, tc.args, { companyId: company.id, userId: user.uid }))
          );
          results.push(...batchResults);

          setThinkingSteps(prev => prev.map(s => {
            const idx = parseInt(s.id.replace('tool-', ''));
            return batchIndices.includes(idx) ? { ...s, status: 'completed' as const } : s;
          }));
        }

        await new Promise(resolve => setTimeout(resolve, 150));
        setIsAITyping(false);
        setThinkingSteps([]);

        // Build summary message
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        const typeLabels: Record<string, string> = {
          invoice: 'invoices', bill: 'bills', expense: 'expenses',
          journal_entry: 'journal entries', customer: 'customers', vendor: 'vendors', payment: 'payments',
        };
        const typeSummaries = Object.entries(entriesByType).map(([type, entries]) => {
          const count = entries.length;
          return `${count} ${typeLabels[type] || type}`;
        });

        let summaryMessage = `✓ Successfully processed ${successCount} of ${allToolCalls.length} entries (${typeSummaries.join(', ')}).`;
        if (failCount > 0) {
          summaryMessage += `\n⚠️ ${failCount} entries failed to process.`;
        }

        // Collect rich data from results
        const successResults = results.filter(r => r.success);
        let richData: ChatMessageRichData | undefined;
        const entityResults = successResults.filter(r => r.data?.type === 'entity' && r.data?.entity);
        if (entityResults.length > 0) {
          richData = {
            type: 'entity',
            entities: entityResults.map(r => ({
              entityType: r.data!.entityType || 'unknown',
              entity: r.data!.entity!,
              actions: r.actions || [],
            })),
          };
        }

        // Clear pending entries
        setPendingDocumentEntries([]);
        setProcessedEntryTypes(new Set());

        const assistantMessage: ChatMessage = {
          id: `temp-${Date.now() + 1}`,
          role: 'assistant',
          content: summaryMessage,
          richData,
          followUp: 'All entries from the document have been processed!',
          createdAt: { toDate: () => new Date() } as any,
        };
        setCurrentMessages(prev => [...prev, assistantMessage]);

        await addMessage(company.id, sessionId, {
          role: 'assistant',
          content: summaryMessage,
          richData: sanitizeForFirestore(richData),
          followUp: 'All entries from the document have been processed!',
        });

        refreshData();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Batch processing failed';
        console.error('Error in processAllDocumentEntries:', error);
        toast.error(errorMessage);
        setIsAITyping(false);
        setThinkingSteps([]);
      } finally {
        setIsSendingMessage(false);
      }
    },
    [company?.id, user?.uid, currentSessionId, isSendingMessage, pendingDocumentEntries, refreshData]
  );

  const toggleSidebar = useCallback(() => { setSidebarCollapsed(prev => !prev); }, []);
  const updateChatSettings = useCallback((newSettings: Partial<ChatSettings>) => { setChatSettings(prev => ({ ...prev, ...newSettings })); }, []);
  const refreshSessions = useCallback(async () => { await loadSessions(); }, [loadSessions]);

  const value: ChatContextType = {
    sessions,
    currentSessionId,
    currentMessages,
    isLoadingSessions,
    sessionsLoaded,
    isLoadingMessages,
    isSendingMessage,
    isAITyping,
    thinkingSteps,
    startNewChat,
    createNewChat,
    selectChat,
    renameChat,
    deleteChat,
    sendMessage,
    executeToolAction,
    processAllDocumentEntries,
    pendingDocumentEntries,
    clearAllChats,
    refreshSessions,
    sidebarCollapsed,
    toggleSidebar,
    sessionUsage,
    resetSessionUsage,
    chatSettings,
    updateChatSettings,
    searchTerm,
    setSearchTerm,
    filteredSessions,
    selectedModel,
    setSelectedModel,
    messageLimitReached,
    dismissMessageLimit,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
}
