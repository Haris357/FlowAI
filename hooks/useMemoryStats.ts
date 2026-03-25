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
 * Retries up to 3 times with backoff on permission-denied errors (transient auth timing).
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
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let cancelled = false;

    const start = async () => {
      if (cancelled) return;

      const { collection, query, where, onSnapshot, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      if (chatId) {
        const docRef = doc(db, `companies/${company.id}/conversations`, chatId);
        unsubscribe = onSnapshot(
          docRef,
          (snap) => {
            if (cancelled) return;
            attempts = 0;
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
          },
          (err) => {
            if (cancelled) return;
            console.warn('[Memory] Snapshot error, retrying...', err.code);
            unsubscribe?.();
            if (attempts < 3) {
              retryTimer = setTimeout(start, 1000 * ++attempts);
            } else {
              setLoading(false);
            }
          }
        );
      } else {
        const convsRef = collection(db, `companies/${company.id}/conversations`);
        const q = query(convsRef, where('userId', '==', user.uid));
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (cancelled) return;
            attempts = 0;
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
          },
          (err) => {
            if (cancelled) return;
            console.warn('[Memory] Snapshot error, retrying...', err.code);
            unsubscribe?.();
            if (attempts < 3) {
              retryTimer = setTimeout(start, 1000 * ++attempts);
            } else {
              setLoading(false);
            }
          }
        );
      }
    };

    start();

    return () => {
      cancelled = true;
      unsubscribe?.();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [company?.id, user?.uid, chatId]);

  return { stats, loading, refresh: () => {} };
}
