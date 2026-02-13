'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box } from '@mui/joy';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { ChatSidebar, ChatMain, ChatSettings } from '@/components/chat';
import { FormShortcut } from '@/components/chat/FormShortcuts';

export default function ChatWithIdPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const chatId = params.chatId as string;

  const { user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormShortcut | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  const {
    sessions,
    currentSessionId,
    currentMessages,
    isAITyping,
    isSendingMessage,
    isLoadingSessions,
    sidebarCollapsed,
    chatSettings,
    startNewChat,
    selectChat,
    renameChat,
    deleteChat,
    sendMessage,
    clearAllChats,
    toggleSidebar,
    updateChatSettings,
    tokenUsage,
  } = useChat();

  // Load the chat from URL when sessions are loaded
  useEffect(() => {
    if (!isLoadingSessions && sessions.length >= 0 && chatId && !hasInitialized) {
      const chatExists = sessions.some(s => s.id === chatId);
      if (chatExists) {
        if (currentSessionId !== chatId) {
          selectChat(chatId);
        }
        setHasInitialized(true);
      } else if (sessions.length > 0) {
        // Chat not found, redirect to main chat page
        router.replace(`/companies/${companyId}/chat`);
      }
      setHasInitialized(true);
    }
  }, [isLoadingSessions, sessions, chatId, currentSessionId, selectChat, hasInitialized, router]);

  const handleNewChat = () => {
    startNewChat();
    setSelectedForm(null);
    setInputValue('');
    router.push(`/companies/${companyId}/chat`);
  };

  const handleSelectChat = async (sessionId: string) => {
    await selectChat(sessionId);
    setSelectedForm(null);
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

  const handleSendMessage = async (content: string) => {
    await sendMessage(content, (newChatId) => {
      // Navigate to the new chat URL when a chat is created
      router.push(`/companies/${companyId}/chat/${newChatId}`);
    });
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
        userName={user?.displayName || user?.email || undefined}
        userPhotoUrl={user?.photoURL || undefined}
        showTimestamps={chatSettings.showTimestamps}
        voiceEnabled={chatSettings.voiceInputEnabled}
        selectedForm={selectedForm}
        inputValue={inputValue}
        onSendMessage={handleSendMessage}
        onSelectAction={handleSelectAction}
        onClearForm={handleClearForm}
        tokenUsage={tokenUsage}
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
