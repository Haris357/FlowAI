'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box } from '@mui/joy';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { ChatSidebar, ChatMain, ChatSettings, ToolkitPanel, CustomizePanel } from '@/components/chat';
import { BusinessProfileProvider } from '@/contexts/BusinessProfileContext';

export default function ChatWithIdPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const chatId = params.chatId as string;

  const { user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toolkitOpen, setToolkitOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [focusTrigger, setFocusTrigger] = useState(0);

  const {
    sessions,
    currentSessionId,
    currentMessages,
    isAITyping,
    isSendingMessage,
    thinkingSteps,
    isLoadingSessions,
    isLoadingMessages,
    sessionsLoaded,
    sidebarCollapsed,
    chatSettings,
    startNewChat,
    selectChat,
    renameChat,
    deleteChat,
    starChat,
    archiveChat,
    sendMessage,
    executeToolAction,
    clearAllChats,
    toggleSidebar,
    updateChatSettings,
    sessionUsage,
  } = useChat();

  // Stable refs — read inside effects without adding to deps
  const sessionsRef = useRef(sessions);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);

  // Track which chatId we last initiated a load for, so we never double-call selectChat
  const initiatedForRef = useRef<string | null>(null);

  // Load the chat when URL chatId doesn't match what's in context (deep link, page refresh, navigation)
  useEffect(() => {
    if (!sessionsLoaded || !chatId) return;
    // Already the right chat and not loading — nothing to do
    if (currentSessionId === chatId && !isLoadingMessages) return;
    // Already initiated a load for this chatId — wait for it to finish
    if (initiatedForRef.current === chatId) return;

    initiatedForRef.current = chatId;
    const chatExists = sessionsRef.current.some(s => s.id === chatId);
    if (chatExists) {
      selectChat(chatId);
    } else {
      router.replace(`/companies/${companyId}/chat`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionsLoaded, chatId, currentSessionId]);

  const handleNewChat = () => {
    startNewChat();
    setInputValue('');
    router.push(`/companies/${companyId}/chat`);
  };

  const handleSelectChat = (sessionId: string) => {
    initiatedForRef.current = sessionId; // mark as initiated so effect doesn't double-call
    selectChat(sessionId);
    router.push(`/companies/${companyId}/chat/${sessionId}`);
    setInputValue('');
  };

  const handleDeleteChat = async (sessionId: string) => {
    await deleteChat(sessionId);
    if (sessionId === chatId) {
      router.push(`/companies/${companyId}/chat`);
    }
  };

  const handleRenameChat = async (sessionId: string, newTitle: string) => {
    await renameChat(sessionId, newTitle);
  };

  const handleSendMessage = async (content: string, files?: File[], entityContext?: string, mentionedEntities?: { type: string; label: string; id: string }[]) => {
    await sendMessage(content, (newChatId) => {
      router.push(`/companies/${companyId}/chat/${newChatId}`);
    }, files, entityContext, mentionedEntities);
    setInputValue('');
  };

  const handleSelectAction = (prompt: string) => {
    setInputValue(prompt);
  };

  // Skeleton shows whenever: sessions not ready, messages loading, or URL chatId ≠ loaded chatId.
  // This is purely derived — no local hasInitialized state needed, no race conditions.
  const isInitializing = !sessionsLoaded || isLoadingMessages || currentSessionId !== chatId;

  return (
    <BusinessProfileProvider>
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onStarChat={starChat}
        onArchiveChat={archiveChat}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenToolkit={() => setToolkitOpen(true)}
        onOpenCustomize={() => setCustomizeOpen(true)}
        isLoadingSessions={isLoadingSessions}
      />

      {/* Main Chat Area */}
      <ChatMain
        messages={currentMessages}
        isAITyping={isAITyping}
        isSendingMessage={isSendingMessage}
        thinkingSteps={thinkingSteps}
        userName={user?.displayName || user?.email || undefined}
        userPhotoUrl={user?.photoURL || undefined}
        showTimestamps={chatSettings.showTimestamps}
        voiceEnabled={chatSettings.voiceInputEnabled}
        inputValue={inputValue}
        onSendMessage={handleSendMessage}
        onExecuteToolAction={executeToolAction}
        onSelectAction={handleSelectAction}
        sessionUsage={sessionUsage}
        isLoading={isInitializing}
        isLoadingMessages={isLoadingMessages}
        focusTrigger={focusTrigger}
      />

      {/* Settings Modal */}
      <ChatSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={chatSettings}
        onUpdateSettings={updateChatSettings}
        onClearAllChats={clearAllChats}
        chatCount={sessions.length}
      />

      {/* Toolkit Panel */}
      <ToolkitPanel
        open={toolkitOpen}
        onClose={() => setToolkitOpen(false)}
        onSendMessage={(msg) => { handleSendMessage(msg); setToolkitOpen(false); }}
        onSelectTemplate={(prompt) => { setInputValue(prompt); setToolkitOpen(false); }}
      />

      {/* Customize Panel */}
      <CustomizePanel
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
      />
    </Box>
    </BusinessProfileProvider>
  );
}
