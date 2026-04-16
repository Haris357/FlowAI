/**
 * AI Memory & Compaction System
 * Professional conversation memory management with sliding window optimization
 *
 * Architecture:
 * - Sliding window: Keep last N messages in full context
 * - Auto-compaction: Summarize old messages when threshold hit
 * - Token tracking: Accurate estimation for cost optimization
 * - Context budget: Stay within GPT-4o-mini's 128K context window
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ==========================================
// TYPES
// ==========================================

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Timestamp;
  tokens?: number;
}

export interface ConversationMemory {
  id: string;
  companyId: string;
  userId: string;
  messages: ConversationMessage[];
  summary?: string;
  summaryTokens?: number;
  totalTokens: number;
  messageCount: number;
  compactionCount: number;
  lastActivity: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==========================================
// CONFIGURATION
// ==========================================

export const MEMORY_CONFIG = {
  // Context window management (GPT-4o-mini: 128K context)
  CONTEXT_BUDGET: 20000,         // Max tokens to send as context
  SLIDING_WINDOW: 50,            // Keep last 50 messages in full
  COMPACT_TRIGGER_MESSAGES: 60,  // Compact when exceeding 60 messages
  COMPACT_TRIGGER_TOKENS: 25000, // Compact when exceeding 25K estimated tokens
  MESSAGES_TO_KEEP: 30,          // Keep last 30 messages after compaction
  MAX_SUMMARY_TOKENS: 1000,      // Summary up to 1000 tokens for richer context
} as const;

// ==========================================
// TOKEN ESTIMATION
// ==========================================

/**
 * Estimate tokens using OpenAI's ~4 chars per token heuristic
 * Slightly over-estimates for safety margin
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.5);
}

/**
 * Calculate total tokens in a message array
 */
export function calculateTotalTokens(messages: ConversationMessage[]): number {
  return messages.reduce((total, msg) => {
    return total + (msg.tokens || estimateTokens(msg.content));
  }, 0);
}

// ==========================================
// MEMORY RETRIEVAL
// ==========================================

export async function getConversationMemory(
  companyId: string,
  userId: string
): Promise<ConversationMemory | null> {
  try {
    const conversationsRef = collection(db, `companies/${companyId}/conversations`);
    const q = query(
      conversationsRef,
      where('userId', '==', userId),
      orderBy('lastActivity', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as ConversationMemory;
  } catch (error) {
    console.error('[Memory] Error getting conversation:', error);
    return null;
  }
}

export async function createConversationMemory(
  companyId: string,
  userId: string,
  initialMessage?: ConversationMessage
): Promise<string> {
  const conversationsRef = collection(db, `companies/${companyId}/conversations`);
  const messages = initialMessage ? [initialMessage] : [];
  const totalTokens = initialMessage ? estimateTokens(initialMessage.content) : 0;

  const newDocRef = doc(conversationsRef);
  await setDoc(newDocRef, {
    companyId,
    userId,
    messages,
    totalTokens,
    messageCount: messages.length,
    compactionCount: 0,
    lastActivity: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return newDocRef.id;
}

// ==========================================
// MEMORY UPDATE
// ==========================================

export async function addMessageToMemory(
  companyId: string,
  conversationId: string,
  message: ConversationMessage
): Promise<void> {
  const conversationRef = doc(db, `companies/${companyId}/conversations`, conversationId);
  const conversationSnap = await getDoc(conversationRef);

  if (!conversationSnap.exists()) {
    throw new Error('Conversation not found');
  }

  const conversation = conversationSnap.data() as ConversationMemory;
  const messageTokens = message.tokens || estimateTokens(message.content);
  const updatedMessages = [...conversation.messages, message];

  await updateDoc(conversationRef, {
    messages: updatedMessages,
    totalTokens: (conversation.totalTokens || 0) + messageTokens,
    messageCount: updatedMessages.length,
    lastActivity: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

// ==========================================
// COMPACTION
// ==========================================

export function needsCompaction(memory: ConversationMemory): boolean {
  return (
    (memory.messages?.length || 0) > MEMORY_CONFIG.COMPACT_TRIGGER_MESSAGES ||
    (memory.totalTokens || 0) > MEMORY_CONFIG.COMPACT_TRIGGER_TOKENS
  );
}

export async function compactConversation(
  companyId: string,
  conversationId: string
): Promise<ConversationMemory> {
  const conversationRef = doc(db, `companies/${companyId}/conversations`, conversationId);
  const conversationSnap = await getDoc(conversationRef);

  if (!conversationSnap.exists()) {
    throw new Error('Conversation not found');
  }

  const conversation = conversationSnap.data() as ConversationMemory;
  const messagesToSummarize = conversation.messages.slice(0, -MEMORY_CONFIG.MESSAGES_TO_KEEP);
  const recentMessages = conversation.messages.slice(-MEMORY_CONFIG.MESSAGES_TO_KEEP);

  const summary = await generateSummary(messagesToSummarize, conversation.summary);
  const summaryTokens = estimateTokens(summary);
  const recentTokens = calculateTotalTokens(recentMessages);
  const newTotalTokens = summaryTokens + recentTokens;

  await updateDoc(conversationRef, {
    messages: recentMessages,
    summary,
    summaryTokens,
    totalTokens: newTotalTokens,
    messageCount: recentMessages.length,
    compactionCount: (conversation.compactionCount || 0) + 1,
    updatedAt: Timestamp.now(),
  });

  return {
    ...conversation,
    messages: recentMessages,
    summary,
    summaryTokens,
    totalTokens: newTotalTokens,
  };
}

async function generateSummary(
  messages: ConversationMessage[],
  existingSummary?: string
): Promise<string> {
  const messagesText = messages
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n\n');

  try {
    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.APP_URL || 'http://localhost:3000');
    const response = await fetch(`${baseUrl}/api/memory/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, existingSummary }),
    });

    const data = await response.json();
    if (!response.ok || !data.summary) {
      throw new Error(data.error || `Summarize API error ${response.status}`);
    }
    return data.summary;
  } catch (error) {
    console.error('[Memory] Summary generation failed:', error);
    return `Summary of ${messages.length} messages: ${messagesText.slice(0, 400)}...`;
  }
}

// ==========================================
// CONTEXT CONSTRUCTION
// ==========================================

export function buildContextFromMemory(
  memory: ConversationMemory
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const context: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  if (memory.summary) {
    context.push({
      role: 'user',
      content: `[Previous conversation summary]\n${memory.summary}\n[End of summary]\n\nLet's continue our conversation:`,
    });
  }

  // Apply sliding window - only include last N messages
  const windowMessages = memory.messages?.slice(-MEMORY_CONFIG.SLIDING_WINDOW) || [];
  windowMessages.forEach((msg) => {
    if (msg.role !== 'system') {
      context.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }
  });

  return context;
}

// ==========================================
// MEMORY MANAGEMENT
// ==========================================

export async function clearOldConversations(
  companyId: string,
  daysOld: number = 90
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const conversationsRef = collection(db, `companies/${companyId}/conversations`);
  const q = query(conversationsRef, where('lastActivity', '<', Timestamp.fromDate(cutoffDate)));
  const snapshot = await getDocs(q);

  let deletedCount = 0;
  for (const docSnapshot of snapshot.docs) {
    await deleteDoc(docSnapshot.ref);
    deletedCount++;
  }
  return deletedCount;
}

export async function deleteConversationMemory(
  companyId: string,
  conversationId: string
): Promise<void> {
  const conversationRef = doc(db, `companies/${companyId}/conversations`, conversationId);
  await deleteDoc(conversationRef);
}

export async function clearAllConversationMemory(
  companyId: string,
  userId: string
): Promise<number> {
  const conversationsRef = collection(db, `companies/${companyId}/conversations`);
  const q = query(conversationsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);

  let deletedCount = 0;
  for (const docSnapshot of snapshot.docs) {
    await deleteDoc(docSnapshot.ref);
    deletedCount++;
  }
  return deletedCount;
}

export async function getMemoryStats(
  companyId: string,
  userId: string
): Promise<{
  totalConversations: number;
  totalMessages: number;
  totalTokens: number;
  compactionCount: number;
  hasActiveMemory: boolean;
}> {
  const conversationsRef = collection(db, `companies/${companyId}/conversations`);
  const q = query(conversationsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);

  let totalMessages = 0;
  let totalTokens = 0;
  let compactionCount = 0;

  snapshot.docs.forEach((doc) => {
    const conv = doc.data();
    totalMessages += conv.messages?.length || 0;
    totalTokens += conv.totalTokens || 0;
    compactionCount += conv.compactionCount || 0;
  });

  return {
    totalConversations: snapshot.size,
    totalMessages,
    totalTokens,
    compactionCount,
    hasActiveMemory: snapshot.size > 0,
  };
}
