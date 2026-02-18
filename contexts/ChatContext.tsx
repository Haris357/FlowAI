'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Chat, ChatMessage, ChatMessageRichData, ChatSettings, ToolCall, ThinkingStep } from '@/types';
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

// ==========================================
// TOKEN USAGE TRACKING
// ==========================================

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
}

const EMPTY_TOKEN_USAGE: TokenUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  totalCost: 0,
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
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  isAITyping: boolean;
  thinkingSteps: ThinkingStep[];
  startNewChat: () => void;
  createNewChat: () => Promise<string>;
  selectChat: (sessionId: string) => Promise<void>;
  renameChat: (sessionId: string, newTitle: string) => Promise<void>;
  deleteChat: (sessionId: string) => Promise<void>;
  sendMessage: (content: string, onChatCreated?: (chatId: string) => void) => Promise<void>;
  executeToolAction: (toolName: string, args: Record<string, any>, sourceMessageId?: string, actionKey?: string) => Promise<void>;
  clearAllChats: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  chatSettings: ChatSettings;
  updateChatSettings: (settings: Partial<ChatSettings>) => void;
  tokenUsage: TokenUsage;
  resetTokenUsage: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredSessions: Chat[];
  selectedModel: string;
  setSelectedModel: (model: string) => void;
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

  const [sessions, setSessions] = useState<Chat[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
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

  const [tokenUsage, setTokenUsage] = useState<TokenUsage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flow_ai_token_usage');
      return saved ? JSON.parse(saved) : EMPTY_TOKEN_USAGE;
    }
    return EMPTY_TOKEN_USAGE;
  });

  const [searchTerm, setSearchTerm] = useState('');

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('flow_ai_model') || 'gpt-4.1-mini';
    }
    return 'gpt-4.1-mini';
  });

  const filteredSessions = searchTerm
    ? sessions.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : sessions;

  // Persistence effects
  useEffect(() => {
    if (company?.id && user?.uid) loadSessions();
  }, [company?.id, user?.uid]);

  useEffect(() => { localStorage.setItem('chat_sidebar_collapsed', String(sidebarCollapsed)); }, [sidebarCollapsed]);
  useEffect(() => { localStorage.setItem('chat_settings', JSON.stringify(chatSettings)); }, [chatSettings]);
  useEffect(() => { localStorage.setItem('flow_ai_token_usage', JSON.stringify(tokenUsage)); }, [tokenUsage]);
  useEffect(() => { localStorage.setItem('flow_ai_model', selectedModel); }, [selectedModel]);

  const resetTokenUsage = useCallback(() => {
    setTokenUsage(EMPTY_TOKEN_USAGE);
    localStorage.removeItem('flow_ai_token_usage');
  }, []);

  const loadSessions = useCallback(async () => {
    if (!company?.id || !user?.uid) return;
    setIsLoadingSessions(true);
    try {
      const loadedSessions = await getChats(company.id, user.uid);
      setSessions(loadedSessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast.error('Failed to load chat history');
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
    async (content: string, onChatCreated?: (chatId: string) => void) => {
      if (!company?.id || !user?.uid || !content.trim()) return;
      if (isSendingMessage) return; // Prevent concurrent sends

      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = await createNewChat();
        if (onChatCreated) onChatCreated(sessionId);
      }

      setIsSendingMessage(true);

      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        createdAt: { toDate: () => new Date() } as any,
      };
      setCurrentMessages(prev => [...prev, userMessage]);

      // Start thinking steps
      setIsAITyping(true);
      setThinkingSteps([{ id: 'think', label: 'Understanding your request', status: 'in_progress' }]);

      try {
        await addMessage(company.id, sessionId, { role: 'user', content: content.trim() });

        const currentChat = sessions.find(s => s.id === sessionId);
        if (currentChat?.title.startsWith('New Chat -')) {
          await updateChatTitleFromMessage(company.id, sessionId, content.trim());
          await loadSessions();
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content.trim(),
            companyId: company.id,
            userId: user.uid,
            chatId: sessionId,
            model: selectedModel,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to get AI response');
        }

        let data = await response.json();

        // Track token usage
        if (data.usage) {
          setTokenUsage(prev => ({
            promptTokens: prev.promptTokens + (data.usage.promptTokens || 0),
            completionTokens: prev.completionTokens + (data.usage.completionTokens || 0),
            totalTokens: prev.totalTokens + (data.usage.totalTokens || 0),
            totalCost: prev.totalCost + (data.usage.cost || 0),
            requestCount: prev.requestCount + 1,
          }));
        }

        // Mark thinking step as done
        setThinkingSteps(prev => prev.map(s => s.id === 'think' ? { ...s, status: 'completed' as const } : s));

        let finalMessage = stripActionPatterns(data.message || '');
        let richData: ChatMessage['richData'] | undefined;
        let richDataList: ChatMessage['richDataList'] | undefined;
        let actions: ChatMessage['actions'] | undefined;
        let followUp: string | undefined;

        // Retry once if AI narrated actions without calling tools
        if ((!data.toolCalls || data.toolCalls.length === 0) && finalMessage &&
            /\b(execut|proceed|start|begin|work on|carry out|handl)(ing|e)\b/i.test(finalMessage)) {
          setThinkingSteps(prev => [
            ...prev.map(s => ({ ...s, status: 'completed' as const })),
            { id: 'retry', label: 'Processing actions', status: 'in_progress' as const },
          ]);
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
                setTokenUsage(prev => ({
                  promptTokens: prev.promptTokens + (retryData.usage.promptTokens || 0),
                  completionTokens: prev.completionTokens + (retryData.usage.completionTokens || 0),
                  totalTokens: prev.totalTokens + (retryData.usage.totalTokens || 0),
                  totalCost: prev.totalCost + (retryData.usage.cost || 0),
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
          // Add tool call steps
          const toolSteps: ThinkingStep[] = data.toolCalls.map((tc: any, i: number) => ({
            id: `tool-${i}`,
            label: getToolLabel(tc.name, tc.args || tc.input),
            status: 'pending' as const,
          }));
          setThinkingSteps(prev => [
            ...prev.map(s => ({ ...s, status: 'completed' as const })),
            ...toolSteps,
          ]);

          const results: ToolResult[] = [];
          for (let i = 0; i < data.toolCalls.length; i++) {
            const toolCall = data.toolCalls[i];

            // Mark current tool as in_progress
            setThinkingSteps(prev => prev.map(s => s.id === `tool-${i}` ? { ...s, status: 'in_progress' as const } : s));

            const result = await executeAITool(
              toolCall.name,
              toolCall.args || toolCall.input,
              { companyId: company.id, userId: user.uid }
            );
            results.push(result);

            // Mark current tool as completed
            setThinkingSteps(prev => prev.map(s => s.id === `tool-${i}` ? { ...s, status: 'completed' as const } : s));
          }

          // === FOLLOW-UP ROUND ===
          // Send tool results back to AI for potential follow-up actions (e.g., create invoice → send invoice)
          let allResults = [...results];
          let hasFollowUpMessage = false;
          if (data.rawToolCalls && data.rawToolCalls.length > 0 && results.some(r => r.success)) {
            const followUpPayload = results.map((r, i) => ({
              toolCallId: data.rawToolCalls[i]?.id || data.toolCalls[i].id,
              result: JSON.stringify({
                success: r.success,
                message: r.message,
                entityId: r.data?.entity?.id,
                entityType: r.data?.entityType,
              }),
            }));

            setThinkingSteps(prev => [
              ...prev.map(s => ({ ...s, status: 'completed' as const })),
              { id: 'followup', label: 'Checking next steps', status: 'in_progress' as const },
            ]);

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

                // Track token usage from follow-up
                if (followUpData.usage) {
                  setTokenUsage(prev => ({
                    promptTokens: prev.promptTokens + (followUpData.usage.promptTokens || 0),
                    completionTokens: prev.completionTokens + (followUpData.usage.completionTokens || 0),
                    totalTokens: prev.totalTokens + (followUpData.usage.totalTokens || 0),
                    totalCost: prev.totalCost + (followUpData.usage.cost || 0),
                    requestCount: prev.requestCount + 1,
                  }));
                }

                setThinkingSteps(prev => prev.map(s => s.id === 'followup' ? { ...s, status: 'completed' as const } : s));

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
        const followUp = result.followUp;

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
    [company?.id, user?.uid, currentSessionId, currentMessages, isSendingMessage, refreshData]
  );

  const toggleSidebar = useCallback(() => { setSidebarCollapsed(prev => !prev); }, []);
  const updateChatSettings = useCallback((newSettings: Partial<ChatSettings>) => { setChatSettings(prev => ({ ...prev, ...newSettings })); }, []);
  const refreshSessions = useCallback(async () => { await loadSessions(); }, [loadSessions]);

  const value: ChatContextType = {
    sessions,
    currentSessionId,
    currentMessages,
    isLoadingSessions,
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
    clearAllChats,
    refreshSessions,
    sidebarCollapsed,
    toggleSidebar,
    tokenUsage,
    resetTokenUsage,
    chatSettings,
    updateChatSettings,
    searchTerm,
    setSearchTerm,
    filteredSessions,
    selectedModel,
    setSelectedModel,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
}
