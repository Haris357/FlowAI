'use client';

import { useState, useCallback, useRef } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { searchCustomers, getCustomers } from '@/services/customers';
import { searchVendors, getVendors } from '@/services/vendors';
import { searchTransactions } from '@/services/transactions';
import { getInvoices } from '@/services/invoices';
import { getBills } from '@/services/bills';
import { getEmployees } from '@/services/employees';
import { getQuotes } from '@/services/quotes';
import { getAccounts } from '@/services/accounts';
import type { Customer, Vendor, Employee } from '@/types';

export type EntityType =
  | 'customer'
  | 'vendor'
  | 'invoice'
  | 'bill'
  | 'employee'
  | 'quote'
  | 'transaction'
  | 'account';

export interface EntityResult {
  id: string;
  type: EntityType;
  label: string;        // primary display name
  sub?: string;         // secondary info (email, number, amount)
  badge?: string;       // status badge text
  badgeColor?: 'success' | 'warning' | 'danger' | 'neutral' | 'primary';
  amount?: number;
  currency?: string;
  raw: Record<string, any>;
}

const ENTITY_TYPE_META: Record<EntityType, { label: string; color: string }> = {
  customer:    { label: 'Customer',    color: 'var(--joy-palette-primary-500)' },
  vendor:      { label: 'Vendor',      color: 'var(--joy-palette-warning-500)' },
  invoice:     { label: 'Invoice',     color: 'var(--joy-palette-success-500)' },
  bill:        { label: 'Bill',        color: 'var(--joy-palette-danger-400)' },
  employee:    { label: 'Employee',    color: 'var(--joy-palette-neutral-600)' },
  quote:       { label: 'Quote',       color: 'var(--joy-palette-primary-400)' },
  transaction: { label: 'Transaction', color: 'var(--joy-palette-neutral-500)' },
  account:     { label: 'Account',     color: 'var(--joy-palette-neutral-600)' },
};

export { ENTITY_TYPE_META };

function statusColor(status: string): EntityResult['badgeColor'] {
  const s = status?.toLowerCase();
  if (['paid', 'active', 'accepted', 'completed'].includes(s)) return 'success';
  if (['overdue', 'cancelled', 'rejected', 'expired'].includes(s)) return 'danger';
  if (['pending', 'sent', 'draft', 'partial'].includes(s)) return 'warning';
  return 'neutral';
}

function mapCustomer(c: Customer): EntityResult {
  return {
    id: c.id, type: 'customer',
    label: c.name,
    sub: c.email || c.phone || '',
    badge: c.outstandingBalance > 0 ? `${c.outstandingBalance > 0 ? '+' : ''}${c.outstandingBalance.toLocaleString()}` : undefined,
    badgeColor: c.outstandingBalance > 0 ? 'warning' : 'neutral',
    raw: c as any,
  };
}

function mapVendor(v: Vendor): EntityResult {
  return {
    id: v.id, type: 'vendor',
    label: v.name,
    sub: v.email || v.phone || '',
    badge: v.outstandingBalance > 0 ? `${v.outstandingBalance.toLocaleString()}` : undefined,
    badgeColor: v.outstandingBalance > 0 ? 'danger' : 'neutral',
    raw: v as any,
  };
}

function mapEmployee(e: Employee): EntityResult {
  return {
    id: e.id, type: 'employee',
    label: e.name,
    sub: e.designation || e.department || e.email || '',
    badge: e.isActive ? 'Active' : 'Inactive',
    badgeColor: e.isActive ? 'success' : 'neutral',
    raw: e as any,
  };
}

function mapInvoice(inv: any): EntityResult {
  return {
    id: inv.id, type: 'invoice',
    label: inv.invoiceNumber || inv.id,
    sub: inv.customerName || '',
    badge: inv.status,
    badgeColor: statusColor(inv.status),
    amount: inv.total,
    currency: inv.currency,
    raw: inv,
  };
}

function mapBill(b: any): EntityResult {
  return {
    id: b.id, type: 'bill',
    label: b.billNumber || b.id,
    sub: b.vendorName || '',
    badge: b.status,
    badgeColor: statusColor(b.status),
    amount: b.total,
    currency: b.currency,
    raw: b,
  };
}

function mapQuote(q: any): EntityResult {
  return {
    id: q.id, type: 'quote',
    label: q.quoteNumber || q.id,
    sub: q.customerName || '',
    badge: q.status,
    badgeColor: statusColor(q.status),
    amount: q.total,
    raw: q,
  };
}

function mapTransaction(t: any): EntityResult {
  return {
    id: t.id, type: 'transaction',
    label: t.description || t.reference || t.id,
    sub: t.category || t.type || '',
    badge: t.type,
    badgeColor: t.type === 'income' ? 'success' : t.type === 'expense' ? 'danger' : 'neutral',
    amount: t.amount,
    raw: t,
  };
}

function mapAccount(a: any): EntityResult {
  return {
    id: a.id, type: 'account',
    label: `${a.code ? a.code + ' · ' : ''}${a.name}`,
    sub: a.typeName || a.subtypeName || '',
    badge: a.balance !== undefined ? a.balance.toLocaleString() : undefined,
    badgeColor: 'neutral',
    raw: a,
  };
}

// ─── Cache so Firestore isn't hit on every keystroke ─────────────────────────
const entityCache: Partial<Record<EntityType, { ts: number; data: EntityResult[] }>> = {};
const CACHE_TTL_MS = 30_000; // 30 seconds

function isCacheValid(type: EntityType) {
  const entry = entityCache[type];
  return entry && Date.now() - entry.ts < CACHE_TTL_MS;
}

export function useEntitySearch() {
  const { company } = useCompany();
  const companyId = company?.id;
  const [results, setResults] = useState<EntityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchType = useCallback(async (type: EntityType): Promise<EntityResult[]> => {
    if (!companyId) return [];
    if (isCacheValid(type)) return entityCache[type]!.data;

    let data: EntityResult[] = [];
    try {
      switch (type) {
        case 'customer': {
          const list = await getCustomers(companyId, 200);
          data = list.map(mapCustomer);
          break;
        }
        case 'vendor': {
          const list = await getVendors(companyId, 200);
          data = list.map(mapVendor);
          break;
        }
        case 'employee': {
          const list = await getEmployees(companyId, 200);
          data = list.map(mapEmployee);
          break;
        }
        case 'invoice': {
          const list = await getInvoices(companyId, 200);
          data = list.map(mapInvoice);
          break;
        }
        case 'bill': {
          const list = await getBills(companyId, 200);
          data = list.map(mapBill);
          break;
        }
        case 'quote': {
          const list = await getQuotes(companyId, 200);
          data = list.map(mapQuote);
          break;
        }
        case 'transaction': {
          const list = await searchTransactions(companyId, '');
          data = list.map(mapTransaction);
          break;
        }
        case 'account': {
          const list = await getAccounts(companyId, 500);
          data = list.map(mapAccount);
          break;
        }
      }
    } catch (e) {
      console.error(`[EntitySearch] Failed to fetch ${type}:`, e);
    }

    entityCache[type] = { ts: Date.now(), data };
    return data;
  }, [companyId]);

  /** Search across specific entity types or all if types is empty */
  const search = useCallback(async (
    query: string,
    types: EntityType[] = ['customer', 'vendor', 'invoice', 'bill', 'employee', 'quote', 'transaction', 'account'],
  ) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const all: EntityResult[] = [];
        await Promise.all(types.map(async (type) => {
          const list = await fetchType(type);
          const q = query.toLowerCase();
          const filtered = q
            ? list.filter(r =>
                r.label.toLowerCase().includes(q) ||
                (r.sub || '').toLowerCase().includes(q) ||
                (r.badge || '').toLowerCase().includes(q)
              )
            : list.slice(0, 5); // default top 5 per type when no query
          all.push(...filtered);
        }));

        // Sort: exact label matches first, then by type order
        const typeOrder: EntityType[] = ['customer', 'vendor', 'invoice', 'bill', 'employee', 'quote', 'transaction', 'account'];
        all.sort((a, b) => {
          const q = query.toLowerCase();
          const aExact = a.label.toLowerCase().startsWith(q) ? 0 : 1;
          const bExact = b.label.toLowerCase().startsWith(q) ? 0 : 1;
          if (aExact !== bExact) return aExact - bExact;
          return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
        });

        setResults(all.slice(0, 50));
      } finally {
        setLoading(false);
      }
    }, 120);
  }, [fetchType]);

  const clear = useCallback(() => {
    setResults([]);
    setLoading(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  /** Pre-warm the cache on mount so first @ is instant */
  const prewarm = useCallback(async (types: EntityType[] = ['customer', 'vendor', 'invoice']) => {
    if (!companyId) return;
    for (const type of types) {
      if (!isCacheValid(type)) fetchType(type);
    }
  }, [companyId, fetchType]);

  return { results, loading, search, clear, prewarm };
}
