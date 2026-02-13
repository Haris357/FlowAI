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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Account } from '@/types';
import { QUERY_LIMITS } from '@/lib/firestore-helpers';

/**
 * Get chart of accounts with optional limit
 * @param companyId - Company ID
 * @param maxResults - Maximum number of results (default: 200)
 * @returns Array of accounts sorted by code
 */
export async function getAccounts(companyId: string, maxResults: number = QUERY_LIMITS.ACCOUNTS): Promise<Account[]> {
  const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);
  const q = query(accountsRef, orderBy('code'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Account[];
}

export async function getAccountById(companyId: string, accountId: string): Promise<Account | null> {
  const accountRef = doc(db, `companies/${companyId}/chartOfAccounts`, accountId);
  const snapshot = await getDoc(accountRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Account;
}

/**
 * Get accounts by type code (e.g., 'asset', 'liability', 'expense')
 * @param companyId - Company ID
 * @param typeCode - Account type code
 * @param maxResults - Maximum number of results (default: 200)
 * @returns Array of accounts of specified type
 */
export async function getAccountsByTypeCode(companyId: string, typeCode: string, maxResults: number = QUERY_LIMITS.ACCOUNTS): Promise<Account[]> {
  const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);
  const q = query(accountsRef, where('typeCode', '==', typeCode), orderBy('code'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Account[];
}

// Get accounts by subtype ID
export async function getAccountsBySubtype(companyId: string, subtypeId: string): Promise<Account[]> {
  const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);
  const q = query(accountsRef, where('subtypeId', '==', subtypeId), orderBy('code'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Account[];
}

// Legacy function - now uses typeCode instead of type
export async function getAccountsByType(companyId: string, typeCode: string): Promise<Account[]> {
  return getAccountsByTypeCode(companyId, typeCode);
}

export async function createAccount(
  companyId: string,
  data: Omit<Account, 'id' | 'createdAt'>
): Promise<string> {
  const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);
  const docRef = await addDoc(accountsRef, {
    ...data,
    balance: data.balance || 0,
    isActive: data.isActive ?? true,
    isSystem: data.isSystem ?? false,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateAccount(
  companyId: string,
  accountId: string,
  data: Partial<Account>
): Promise<void> {
  const accountRef = doc(db, `companies/${companyId}/chartOfAccounts`, accountId);
  await updateDoc(accountRef, data);
}

export async function updateAccountBalance(
  companyId: string,
  accountId: string,
  amount: number,
  operation: 'add' | 'subtract'
): Promise<void> {
  const account = await getAccountById(companyId, accountId);
  if (!account) throw new Error('Account not found');

  const newBalance = operation === 'add'
    ? account.balance + amount
    : account.balance - amount;

  await updateAccount(companyId, accountId, { balance: newBalance });
}

export async function deleteAccount(companyId: string, accountId: string): Promise<void> {
  const account = await getAccountById(companyId, accountId);
  if (account?.isSystem) {
    throw new Error('Cannot delete system accounts');
  }

  const accountRef = doc(db, `companies/${companyId}/chartOfAccounts`, accountId);
  await deleteDoc(accountRef);
}

export async function findAccountByName(companyId: string, name: string): Promise<Account | null> {
  const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);
  const q = query(accountsRef, where('name', '==', name));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as Account;
}

export async function findAccountByCode(companyId: string, code: string): Promise<Account | null> {
  const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);
  const q = query(accountsRef, where('code', '==', code));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as Account;
}
