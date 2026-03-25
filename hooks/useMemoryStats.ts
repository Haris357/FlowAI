import { useState, useEffect } from 'react';
import { MEMORY_CONFIG } from '@/lib/ai-memory';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';

export interface MemoryStats {
  totalConversations: number;
  totalMessages: number;
  totalTokens: number;
  compactionCount: number;
  hasActiveMemory: boolean;
  usagePercentage: number;
  memoryHealth: 'healthy' | 'warning' | 'critical';
}

const CONTEXT_BUDGET = MEMORY_CONFIG.CONTEXT_BUDGET;
const WARNING_THRESHOLD = 0.6;
const CRITICAL_THRESHOLD = 0.85;

function toStats(raw: { totalMessages: number; totalTokens: number; compactionCount: number; hasActiveMemory: boolean; totalConversations: number }): MemoryStats {
  const usagePercentage = Math.min(raw.totalTokens / CONTEXT_BUDGET, 1);
  const memoryHealth: MemoryStats['memoryHealth'] =
    usagePercentage >= CRITICAL_THRESHOLD ? 'critical' :
    usagePercentage >= WARNING_THRESHOLD ? 'warning' : 'healthy';
  return { ...raw, usagePercentage, memoryHealth };
}

/**
 * Real-time memory stats for a single conversation (chatId) or all conversations.
 * Uses Firestore onSnapshot so stats update live without polling.
 */
export function useMemoryStats(chatId?: string | null) {
  const { company } = useCompany();
  const { user } = useAuth();
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id || !user?.uid) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    (async () => {
      const { collection, query, where, onSnapshot, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      if (chatId) {
        // Single-chat real-time listener
        const docRef = doc(db, `companies/${company.id}/conversations`, chatId);
        unsubscribe = onSnapshot(docRef, (snap) => {
          if (!snap.exists()) {
            setStats(null);
            setLoading(false);
            return;
          }
          const conv = snap.data();
          setStats(toStats({
            totalConversations: 1,
            totalMessages: conv.messages?.length || 0,
            totalTokens: conv.totalTokens || 0,
            compactionCount: conv.compactionCount || 0,
            hasActiveMemory: true,
          }));
          setLoading(false);
        });
      } else {
        // All conversations for this user
        const convsRef = collection(db, `companies/${company.id}/conversations`);
        const q = query(convsRef, where('userId', '==', user.uid));
        unsubscribe = onSnapshot(q, (snapshot) => {
          let totalMessages = 0, totalTokens = 0, compactionCount = 0;
          snapshot.docs.forEach((d) => {
            const conv = d.data();
            totalMessages += conv.messages?.length || 0;
            totalTokens += conv.totalTokens || 0;
            compactionCount += conv.compactionCount || 0;
          });
          setStats(toStats({
            totalConversations: snapshot.size,
            totalMessages,
            totalTokens,
            compactionCount,
            hasActiveMemory: snapshot.size > 0,
          }));
          setLoading(false);
        });
      }
    })();

    return () => unsubscribe?.();
  }, [company?.id, user?.uid, chatId]);

  // refresh is a no-op — onSnapshot keeps stats live automatically
  return { stats, loading, refresh: () => {} };
}
