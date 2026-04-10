'use client';

import { useEffect, useState } from 'react';
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
  const [hasInitialized, setHasInitialized] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState(0);

  const {
    sessions,
    currentSessionId,
    currentMessages,
    isAITyping,
    isSendingMessage,
    thinkingSteps,
    isLoadingSessions,
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

  // Load the chat from URL when sessions are loaded
  useEffect(() => {
    if (!sessionsLoaded || !chatId || hasInitialized) return;

    const chatExists = sessions.some(s => s.id === chatId);
    if (chatExists) {
      if (currentSessionId !== chatId) {
        selectChat(chatId);
      }
    } else {
      // Chat not found, redirect to main chat page
      router.replace(`/companies/${companyId}/chat`);
    }
    setHasInitialized(true);
  }, [sessionsLoaded, sessions, chatId, currentSessionId, selectChat, hasInitialized, router, companyId]);

  const handleNewChat = () => {
    startNewChat();
    setInputValue('');
    router.push(`/companies/${companyId}/chat`);
  };

  const handleSelectChat = async (sessionId: string) => {
    await selectChat(sessionId);
    setInputValue('');
    router.push(`/companies/${companyId}/chat/${sessionId}`);
  };

  const handleDeleteChat = async (sessionId: string) => {
    await deleteChat(sessionId);
    // If we deleted the current chat, go back to main chat page
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

  // Show loading state while sessions load or chat initializes (prevents welcome screen flash)
  // But don't show skeleton if we already have messages — e.g. when navigating from a new chat
  const isInitializing = !sessionsLoaded || (!hasInitialized && !!chatId && currentMessages.length === 0 && !isSendingMessage);

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
