'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Chat, ChatMessage, ChatSettings, ToolCall } from '@/types';
import {
  getChats,
  createChat,
  updateChat,
  deleteChat as deleteChatService,
  deleteAllChats,
  getMessages,
  addMessage,
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

interface ChatContextType {
  sessions: Chat[];
  currentSessionId: string | null;
  currentMessages: ChatMessage[];
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  isAITyping: boolean;
  startNewChat: () => void;
  createNewChat: () => Promise<string>;
  selectChat: (sessionId: string) => Promise<void>;
  renameChat: (sessionId: string, newTitle: string) => Promise<void>;
  deleteChat: (sessionId: string) => Promise<void>;
  sendMessage: (content: string, onChatCreated?: (chatId: string) => void) => Promise<void>;
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
      setTimeout(() => setIsAITyping(true), 300);

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
            model: selectedModel,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to get AI response');
        }

        const data = await response.json();

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

        await new Promise(resolve => setTimeout(resolve, 500));
        setIsAITyping(false);

        let finalMessage = data.message;
        let richData: ChatMessage['richData'] | undefined;
        let actions: ChatMessage['actions'] | undefined;
        let followUp: string | undefined;

        if (data.toolCalls && data.toolCalls.length > 0) {
          const results: ToolResult[] = [];
          for (const toolCall of data.toolCalls) {
            const result = await executeAITool(
              toolCall.name,
              toolCall.args || toolCall.input,
              { companyId: company.id, userId: user.uid }
            );
            results.push(result);
          }

          const successResults = results.filter(r => r.success);
          if (successResults.length > 1) {
            // Multiple successful results — combine all messages and entities
            finalMessage = successResults.map(r => r.message).join('\n\n');
            const entityResults = successResults.filter(r => r.data?.type === 'entity' && r.data?.entity);
            if (entityResults.length > 1) {
              richData = {
                type: 'entity',
                entities: entityResults.map(r => ({
                  entityType: r.data!.entityType || 'unknown',
                  entity: r.data!.entity!,
                })),
              };
            } else if (entityResults.length === 1) {
              richData = entityResults[0].data;
            }
            // If no entity results, use the first result that has any data (report, summary, list)
            if (!richData) {
              const dataResult = successResults.find(r => r.data);
              if (dataResult) richData = dataResult.data;
            }
            // Collect all actions from all results
            const allActions = successResults.flatMap(r => r.actions || []);
            actions = allActions.length > 0 ? allActions as ChatMessage['actions'] : undefined;
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

        const assistantMessage: ChatMessage = {
          id: `temp-${Date.now() + 1}`,
          role: 'assistant',
          content: finalMessage,
          toolCalls: data.toolCalls,
          richData,
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
          actions: sanitizeForFirestore(actions),
          followUp,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
        console.error('Error sending message:', error);
        toast.error(errorMessage);
        setIsAITyping(false);

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
    [company?.id, user?.uid, currentSessionId, currentMessages, sessions, createNewChat, loadSessions, refreshData, selectedModel]
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
    startNewChat,
    createNewChat,
    selectChat,
    renameChat,
    deleteChat,
    sendMessage,
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
