/**
 * Hook for fetching AI conversation memory statistics
 */

import { useState, useEffect } from 'react';
import { getMemoryStats, MEMORY_CONFIG } from '@/lib/ai-memory';
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

export function useMemoryStats() {
  const { company } = useCompany();
  const { user } = useAuth();
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!company?.id || !user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const memStats = await getMemoryStats(company.id, user.uid);

      const usagePercentage = memStats.totalTokens / CONTEXT_BUDGET;
      let memoryHealth: 'healthy' | 'warning' | 'critical' = 'healthy';

      if (usagePercentage >= CRITICAL_THRESHOLD) {
        memoryHealth = 'critical';
      } else if (usagePercentage >= WARNING_THRESHOLD) {
        memoryHealth = 'warning';
      }

      setStats({
        ...memStats,
        usagePercentage: Math.min(usagePercentage, 1),
        memoryHealth,
      });
    } catch (err) {
      console.error('Error fetching memory stats:', err);
      setError('Failed to load memory statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [company?.id, user?.uid]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}
