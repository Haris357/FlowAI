'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box } from '@mui/joy';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { ChatSidebar, ChatMain, ChatSettings, ToolkitPanel, CustomizePanel } from '@/components/chat';
import { BusinessProfileProvider } from '@/contexts/BusinessProfileContext';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
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
    isLoadingSessions,
  } = useChat();

  const handleNewChat = () => {
    startNewChat();
    setInputValue('');
    setFocusTrigger(prev => prev + 1);
  };

  const handleSelectChat = (sessionId: string) => {
    // Navigate first (instant feel), selectChat runs in parallel — skeleton shows on new URL
    router.push(`/companies/${companyId}/chat/${sessionId}`);
    selectChat(sessionId);
    setInputValue('');
  };

  const handleDeleteChat = async (sessionId: string) => {
    await deleteChat(sessionId);
  };

  const handleRenameChat = async (sessionId: string, newTitle: string) => {
    await renameChat(sessionId, newTitle);
  };

  const handleSendMessage = async (content: string, files?: File[], entityContext?: string, mentionedEntities?: { type: string; label: string; id: string }[]) => {
    await sendMessage(content, (newChatId) => {
      router.replace(`/companies/${companyId}/chat/${newChatId}`);
    }, files, entityContext, mentionedEntities);
    setInputValue('');
  };

  const handleSelectAction = (prompt: string) => {
    setInputValue(prompt);
  };

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
        chatId={currentSessionId}
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
