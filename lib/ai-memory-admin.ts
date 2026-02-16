/**
 * AI Memory & Compaction System (Server-Side Admin SDK)
 * For use in API routes and server-side code
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from './firebase-admin';

initAdmin();
const adminDb = getFirestore();

// Re-export types and config from client version
export type { ConversationMessage, ConversationMemory } from './ai-memory';
export { MEMORY_CONFIG, estimateTokens } from './ai-memory';

import { MEMORY_CONFIG } from './ai-memory';

// ==========================================
// ADMIN MEMORY RETRIEVAL
// ==========================================

export async function getConversationMemory(
  companyId: string,
  userId: string,
  chatId?: string
): Promise<any | null> {
  try {
    const conversationsRef = adminDb.collection(`companies/${companyId}/conversations`);

    // If chatId provided, look for conversation tied to this specific chat session
    if (chatId) {
      const chatSnapshot = await conversationsRef
        .where('chatId', '==', chatId)
        .limit(1)
        .get();

      if (!chatSnapshot.empty) {
        const doc = chatSnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
    }

    // Fallback: get most recent conversation for this user
    const snapshot = await conversationsRef
      .where('userId', '==', userId)
      .orderBy('lastActivity', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('[Memory Admin] Error getting conversation:', error);
    return null;
  }
}

export async function createConversationMemory(
  companyId: string,
  userId: string,
  initialMessage?: any,
  chatId?: string
): Promise<string> {
  const conversationsRef = adminDb.collection(`companies/${companyId}/conversations`);
  const messages = initialMessage ? [initialMessage] : [];
  const totalTokens = initialMessage ? Math.ceil(initialMessage.content.length / 3.5) : 0;

  const docRef = await conversationsRef.add({
    companyId,
    userId,
    chatId: chatId || null,
    messages,
    totalTokens,
    messageCount: messages.length,
    compactionCount: 0,
    lastActivity: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return docRef.id;
}

export async function addMessageToMemory(
  companyId: string,
  conversationId: string,
  message: any
): Promise<void> {
  const conversationRef = adminDb
    .collection(`companies/${companyId}/conversations`)
    .doc(conversationId);

  const conversationSnap = await conversationRef.get();
  if (!conversationSnap.exists) {
    throw new Error('Conversation not found');
  }

  const conversation = conversationSnap.data()!;
  const messageTokens = message.tokens || Math.ceil(message.content.length / 3.5);
  const updatedMessages = [...(conversation.messages || []), message];

  await conversationRef.update({
    messages: updatedMessages,
    totalTokens: (conversation.totalTokens || 0) + messageTokens,
    messageCount: updatedMessages.length,
    lastActivity: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

// ==========================================
// CONTEXT CONSTRUCTION
// ==========================================

export function buildContextFromMemory(
  memory: any
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const context: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  if (memory.summary) {
    context.push({
      role: 'user',
      content: `[Previous conversation summary]\n${memory.summary}\n[End of summary]\n\nLet's continue our conversation:`,
    });
  }

  // Apply sliding window
  const allMessages = memory.messages || [];
  const windowMessages = allMessages.slice(-MEMORY_CONFIG.SLIDING_WINDOW);
  windowMessages.forEach((msg: any) => {
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
// COMPACTION
// ==========================================

export function needsCompaction(memory: any): boolean {
  return (
    (memory.messages?.length || 0) > MEMORY_CONFIG.COMPACT_TRIGGER_MESSAGES ||
    (memory.totalTokens || 0) > MEMORY_CONFIG.COMPACT_TRIGGER_TOKENS
  );
}

async function generateSummary(
  messages: any[],
  existingSummary?: string
): Promise<string> {
  const messagesText = messages
    .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n\n');

  const summaryPrompt = existingSummary
    ? `Previous summary:\n${existingSummary}\n\nNew messages:\n${messagesText}\n\nCombine into a comprehensive updated summary. You MUST preserve ALL details from the previous summary and add new information.`
    : `Create a detailed summary of this conversation.\n\nConversation:\n${messagesText}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: MEMORY_CONFIG.MAX_SUMMARY_TOKENS,
        temperature: 0.2,
        messages: [
          { role: 'system', content: `Create a detailed conversation summary for an AI accounting assistant. You MUST capture ALL of the following:
1. CUSTOMER/VENDOR NAMES: Every name mentioned and their relationship (e.g., "Jonas - script writing client")
2. PRICING & RATES: All pricing structures, per-unit rates, discount rules (e.g., "$0.025/word for 3000+ word scripts")
3. SERVICES & ITEMS: What services/products were discussed, with quantities and amounts
4. ACTIONS TAKEN: What was created, updated, deleted (with IDs if available)
5. PENDING TASKS: Any incomplete requests or tasks the user mentioned but haven't been completed
6. USER PREFERENCES: Patterns in how the user works, preferred payment methods, recurring clients
7. BUSINESS RULES: Any business rules the user stated (e.g., pricing tiers, payment terms)
Be thorough — if you omit a detail, the AI will permanently forget it.` },
          { role: 'user', content: summaryPrompt },
        ],
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('[Memory Admin] Summary generation failed:', error);
    return `Summary of ${messages.length} messages: ${messagesText.slice(0, 400)}...`;
  }
}

export async function compactConversation(
  companyId: string,
  conversationId: string
): Promise<any> {
  const conversationRef = adminDb
    .collection(`companies/${companyId}/conversations`)
    .doc(conversationId);

  const conversationSnap = await conversationRef.get();
  if (!conversationSnap.exists) {
    throw new Error('Conversation not found');
  }

  const conversation = conversationSnap.data()!;
  const messagesToSummarize = (conversation.messages || []).slice(0, -MEMORY_CONFIG.MESSAGES_TO_KEEP);
  const recentMessages = (conversation.messages || []).slice(-MEMORY_CONFIG.MESSAGES_TO_KEEP);

  const summary = await generateSummary(messagesToSummarize, conversation.summary);
  const summaryTokens = Math.ceil(summary.length / 3.5);
  const recentTokens = recentMessages.reduce(
    (total: number, msg: any) => total + (msg.tokens || Math.ceil(msg.content.length / 3.5)),
    0
  );
  const newTotalTokens = summaryTokens + recentTokens;

  await conversationRef.update({
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
    id: conversationId,
    messages: recentMessages,
    summary,
    summaryTokens,
    totalTokens: newTotalTokens,
  };
}
