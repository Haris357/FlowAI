'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box } from '@mui/joy';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { ChatSidebar, ChatMain, ChatSettings } from '@/components/chat';
import { FormShortcut } from '@/components/chat/FormShortcuts';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  const { user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormShortcut | null>(null);
  const [inputValue, setInputValue] = useState('');

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
    sendMessage,
    executeToolAction,
    clearAllChats,
    toggleSidebar,
    updateChatSettings,
    sessionUsage,
  } = useChat();

  const handleNewChat = () => {
    startNewChat();
    setSelectedForm(null);
    setInputValue('');
  };

  const handleSelectChat = async (sessionId: string) => {
    await selectChat(sessionId);
    setSelectedForm(null);
    setInputValue('');
    router.push(`/companies/${companyId}/chat/${sessionId}`);
  };

  const handleDeleteChat = async (sessionId: string) => {
    await deleteChat(sessionId);
  };

  const handleRenameChat = async (sessionId: string, newTitle: string) => {
    await renameChat(sessionId, newTitle);
  };

  const handleSendMessage = async (content: string, files?: File[]) => {
    // sendMessage will create a chat if none exists
    await sendMessage(content, (newChatId) => {
      // Replace URL to new chat (no back button to empty state)
      router.replace(`/companies/${companyId}/chat/${newChatId}`);
    }, files);
    setSelectedForm(null);
    setInputValue('');
  };

  const handleSelectShortcut = (shortcut: FormShortcut) => {
    setSelectedForm(shortcut);
    setInputValue(shortcut.prompt);
  };

  const handleClearForm = () => {
    setSelectedForm(null);
    setInputValue('');
  };

  const handleSelectAction = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
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
        onSelectShortcut={handleSelectShortcut}
        onOpenSettings={() => setSettingsOpen(true)}
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
        selectedForm={selectedForm}
        inputValue={inputValue}
        onSendMessage={handleSendMessage}
        onExecuteToolAction={executeToolAction}
        onSelectAction={handleSelectAction}
        onClearForm={handleClearForm}
        sessionUsage={sessionUsage}
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
    </Box>
  );
}
