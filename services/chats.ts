import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chat, ChatMessage, ChatMessageRichData, ChatMessageAction, ToolCall } from '@/types';

// ==========================================
// CHAT SESSION OPERATIONS
// ==========================================

/**
 * Get all chat sessions for a user in a company
 */
export async function getChats(companyId: string, userId: string): Promise<Chat[]> {
  const chatsRef = collection(db, `companies/${companyId}/chats`);
  const q = query(
    chatsRef,
    where('ownerId', '==', userId),
    orderBy('lastMessageAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Chat[];
}

/**
 * Get a single chat session by ID
 */
export async function getChatById(companyId: string, chatId: string): Promise<Chat | null> {
  const chatRef = doc(db, `companies/${companyId}/chats`, chatId);
  const snapshot = await getDoc(chatRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Chat;
}

/**
 * Create a new chat session
 */
export async function createChat(
  companyId: string,
  data: { title: string; ownerId: string }
): Promise<string> {
  const chatsRef = collection(db, `companies/${companyId}/chats`);
  const now = serverTimestamp();
  const docRef = await addDoc(chatsRef, {
    title: data.title,
    ownerId: data.ownerId,
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
    messageCount: 0,
  });
  return docRef.id;
}

/**
 * Update a chat session (e.g., rename title)
 */
export async function updateChat(
  companyId: string,
  chatId: string,
  data: Partial<Pick<Chat, 'title'>>
): Promise<void> {
  const chatRef = doc(db, `companies/${companyId}/chats`, chatId);
  await updateDoc(chatRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a chat session and all its messages
 */
export async function deleteChat(companyId: string, chatId: string): Promise<void> {
  // First delete all messages in the chat
  const messagesRef = collection(db, `companies/${companyId}/chats/${chatId}/messages`);
  const messagesSnapshot = await getDocs(messagesRef);

  const batch = writeBatch(db);

  messagesSnapshot.docs.forEach((msgDoc) => {
    batch.delete(msgDoc.ref);
  });

  // Delete the chat document itself
  const chatRef = doc(db, `companies/${companyId}/chats`, chatId);
  batch.delete(chatRef);

  await batch.commit();
}

/**
 * Delete all chats for a user in a company
 */
export async function deleteAllChats(companyId: string, userId: string): Promise<number> {
  const chats = await getChats(companyId, userId);

  for (const chat of chats) {
    await deleteChat(companyId, chat.id);
  }

  return chats.length;
}

// ==========================================
// MESSAGE OPERATIONS
// ==========================================

/**
 * Get all messages for a chat session
 */
export async function getMessages(
  companyId: string,
  chatId: string,
  messageLimit?: number
): Promise<ChatMessage[]> {
  const messagesRef = collection(db, `companies/${companyId}/chats/${chatId}/messages`);
  const q = messageLimit
    ? query(messagesRef, orderBy('createdAt', 'asc'), limit(messageLimit))
    : query(messagesRef, orderBy('createdAt', 'asc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as ChatMessage[];
}

/**
 * Add a message to a chat session
 */
export async function addMessage(
  companyId: string,
  chatId: string,
  message: {
    role: 'user' | 'assistant';
    content: string;
    toolCalls?: ToolCall[];
    richData?: ChatMessageRichData;
    actions?: ChatMessageAction[];
    followUp?: string;
  }
): Promise<string> {
  const messagesRef = collection(db, `companies/${companyId}/chats/${chatId}/messages`);
  const chatRef = doc(db, `companies/${companyId}/chats`, chatId);

  // Add the message with optional rich data
  const docRef = await addDoc(messagesRef, {
    role: message.role,
    content: message.content,
    toolCalls: message.toolCalls || null,
    richData: message.richData || null,
    actions: message.actions || null,
    followUp: message.followUp || null,
    createdAt: serverTimestamp(),
  });

  // Update the chat's lastMessageAt and messageCount
  await updateDoc(chatRef, {
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messageCount: increment(1),
  });

  return docRef.id;
}

/**
 * Update chat title based on first user message
 */
export async function updateChatTitleFromMessage(
  companyId: string,
  chatId: string,
  message: string
): Promise<void> {
  // Generate title from first 50 chars of message
  const title = message.length > 50
    ? `${message.slice(0, 50).trim()}...`
    : message.trim();

  await updateChat(companyId, chatId, { title });
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Generate a default title for a new chat
 */
export function generateDefaultChatTitle(): string {
  const now = new Date();
  return `New Chat - ${now.toLocaleDateString()}`;
}

/**
 * Search chats by title
 */
export async function searchChats(
  companyId: string,
  userId: string,
  searchTerm: string
): Promise<Chat[]> {
  const chats = await getChats(companyId, userId);
  const lowerSearch = searchTerm.toLowerCase();
  return chats.filter(chat =>
    chat.title.toLowerCase().includes(lowerSearch)
  );
}
