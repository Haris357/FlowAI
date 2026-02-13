/**
 * Firestore Query Helpers
 * Provides optimized query patterns with default limits
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  getDocs,
  CollectionReference,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Default limits for different data types
 * Prevents loading thousands of records on initial page load
 */
export const QUERY_LIMITS = {
  DEFAULT: 50,          // General default
  TRANSACTIONS: 100,    // Recent transactions
  INVOICES: 50,         // Recent invoices
  CUSTOMERS: 100,       // Customer list
  ACCOUNTS: 200,        // Chart of accounts (usually < 200)
  LARGE_TABLE: 25,      // For paginated tables
} as const;

/**
 * Optimized query builder with automatic limits
 *
 * @example
 * const invoices = await getOptimizedDocs(
 *   `companies/${companyId}/invoices`,
 *   orderBy('createdAt', 'desc'),
 *   limit(50)
 * );
 */
export async function getOptimizedDocs<T = any>(
  collectionPath: string,
  ...queryConstraints: QueryConstraint[]
): Promise<T[]> {
  const collectionRef = collection(db, collectionPath);
  const q = query(collectionRef, ...queryConstraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
}

/**
 * Quick query with default sort and limit
 * Use for list pages that don't need ALL records
 */
export async function getRecentDocs<T = any>(
  collectionPath: string,
  sortField: string = 'createdAt',
  maxResults: number = QUERY_LIMITS.DEFAULT
): Promise<T[]> {
  return getOptimizedDocs<T>(
    collectionPath,
    orderBy(sortField, 'desc'),
    limit(maxResults)
  );
}

/**
 * Get active records only (common pattern)
 */
export async function getActiveRecords<T = any>(
  collectionPath: string,
  sortField: string = 'name',
  maxResults: number = QUERY_LIMITS.DEFAULT
): Promise<T[]> {
  return getOptimizedDocs<T>(
    collectionPath,
    where('isActive', '==', true),
    orderBy(sortField),
    limit(maxResults)
  );
}
