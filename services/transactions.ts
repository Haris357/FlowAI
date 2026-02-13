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
  serverTimestamp,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Transaction, JournalEntryLine } from '@/types';
import { createJournalEntry } from './journalEntries';
import { getAccountById, updateAccountBalance } from './accounts';
import { QUERY_LIMITS } from '@/lib/firestore-helpers';

/**
 * Get recent transactions with optional limit
 * @param companyId - Company ID
 * @param maxResults - Maximum number of results (default: 100)
 * @returns Array of transactions sorted by date (newest first)
 */
export async function getTransactions(companyId: string, maxResults: number = QUERY_LIMITS.TRANSACTIONS): Promise<Transaction[]> {
  const transactionsRef = collection(db, `companies/${companyId}/transactions`);
  const q = query(transactionsRef, orderBy('date', 'desc'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[];
}

export async function getRecentTransactions(companyId: string, count: number = 10): Promise<Transaction[]> {
  const transactionsRef = collection(db, `companies/${companyId}/transactions`);
  const q = query(transactionsRef, orderBy('date', 'desc'), limit(count));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[];
}

export async function getTransactionById(companyId: string, transactionId: string): Promise<Transaction | null> {
  const transactionRef = doc(db, `companies/${companyId}/transactions`, transactionId);
  const snapshot = await getDoc(transactionRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Transaction;
}

/**
 * Get transactions by type
 * @param companyId - Company ID
 * @param type - Transaction type (income/expense/transfer)
 * @param maxResults - Maximum number of results (default: 100)
 * @returns Array of transactions of specified type
 */
export async function getTransactionsByType(
  companyId: string,
  type: Transaction['type'],
  maxResults: number = QUERY_LIMITS.TRANSACTIONS
): Promise<Transaction[]> {
  const transactionsRef = collection(db, `companies/${companyId}/transactions`);
  const q = query(transactionsRef, where('type', '==', type), orderBy('date', 'desc'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[];
}

export async function getTransactionsByDateRange(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<Transaction[]> {
  const transactionsRef = collection(db, `companies/${companyId}/transactions`);
  const q = query(
    transactionsRef,
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[];
}

export async function getTransactionsByCategory(
  companyId: string,
  category: string
): Promise<Transaction[]> {
  const transactionsRef = collection(db, `companies/${companyId}/transactions`);
  const q = query(transactionsRef, where('category', '==', category), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[];
}

export async function createTransaction(
  companyId: string,
  data: Omit<Transaction, 'id' | 'createdAt'>,
  accountingConfig?: {
    revenueAccountId?: string;
    revenueAccountCode?: string;
    revenueAccountName?: string;
    expenseAccountId?: string;
    expenseAccountCode?: string;
    expenseAccountName?: string;
    createdBy: string;
  }
): Promise<string> {
  // Get the primary account (Cash/Bank account)
  const primaryAccount = await getAccountById(companyId, data.accountId);
  if (!primaryAccount) {
    throw new Error('Primary account not found');
  }

  let journalEntryId = '';

  // Create journal entry if accounting config is provided
  if (accountingConfig) {
    const transactionDate = data.date instanceof Date ? data.date : data.date.toDate();
    const lines: JournalEntryLine[] = [];

    if (data.type === 'income') {
      // INCOME: Debit Cash/Bank, Credit Revenue
      const revenueAccountId = accountingConfig.revenueAccountId;
      const revenueAccountCode = accountingConfig.revenueAccountCode;
      const revenueAccountName = accountingConfig.revenueAccountName;

      if (!revenueAccountId || !revenueAccountCode || !revenueAccountName) {
        throw new Error('Revenue account information is required for income transactions');
      }

      lines.push(
        // Debit Cash/Bank
        {
          accountId: primaryAccount.id,
          accountCode: primaryAccount.code,
          accountName: primaryAccount.name,
          description: data.description,
          debit: data.amount,
          credit: 0,
        },
        // Credit Revenue
        {
          accountId: revenueAccountId,
          accountCode: revenueAccountCode,
          accountName: revenueAccountName,
          description: data.description,
          debit: 0,
          credit: data.amount,
        }
      );

      // Update account balances
      // Cash/Bank increases with debit
      await updateAccountBalance(companyId, primaryAccount.id, data.amount, 'add');
      // Revenue increases with credit (but revenue is a credit account, so we add to balance)
      await updateAccountBalance(companyId, revenueAccountId, data.amount, 'add');

    } else if (data.type === 'expense') {
      // EXPENSE: Debit Expense, Credit Cash/Bank
      const expenseAccountId = accountingConfig.expenseAccountId;
      const expenseAccountCode = accountingConfig.expenseAccountCode;
      const expenseAccountName = accountingConfig.expenseAccountName;

      if (!expenseAccountId || !expenseAccountCode || !expenseAccountName) {
        throw new Error('Expense account information is required for expense transactions');
      }

      lines.push(
        // Debit Expense
        {
          accountId: expenseAccountId,
          accountCode: expenseAccountCode,
          accountName: expenseAccountName,
          description: data.description,
          debit: data.amount,
          credit: 0,
        },
        // Credit Cash/Bank
        {
          accountId: primaryAccount.id,
          accountCode: primaryAccount.code,
          accountName: primaryAccount.name,
          description: data.description,
          debit: 0,
          credit: data.amount,
        }
      );

      // Update account balances
      // Expense increases with debit
      await updateAccountBalance(companyId, expenseAccountId, data.amount, 'add');
      // Cash/Bank decreases with credit
      await updateAccountBalance(companyId, primaryAccount.id, data.amount, 'subtract');
    }

    // Create the journal entry
    if (lines.length > 0) {
      journalEntryId = await createJournalEntry(companyId, {
        date: transactionDate,
        description: data.description,
        lines,
        reference: data.reference || 'Transaction',
        referenceType: data.type === 'income' ? 'invoice' : 'expense',
        referenceId: '',
        createdBy: accountingConfig.createdBy,
      });
    }
  }

  // Create the transaction with journal entry ID
  const transactionsRef = collection(db, `companies/${companyId}/transactions`);
  const docRef = await addDoc(transactionsRef, {
    ...data,
    journalEntryId,
    date: data.date instanceof Date ? Timestamp.fromDate(data.date) : data.date,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateTransaction(
  companyId: string,
  transactionId: string,
  data: Partial<Transaction>
): Promise<void> {
  const transactionRef = doc(db, `companies/${companyId}/transactions`, transactionId);
  await updateDoc(transactionRef, data);
}

export async function deleteTransaction(companyId: string, transactionId: string): Promise<void> {
  const transactionRef = doc(db, `companies/${companyId}/transactions`, transactionId);
  await deleteDoc(transactionRef);
}

export async function searchTransactions(
  companyId: string,
  searchTerm: string
): Promise<Transaction[]> {
  const transactions = await getTransactions(companyId);
  const lowerSearch = searchTerm.toLowerCase();

  return transactions.filter(
    t => t.description.toLowerCase().includes(lowerSearch) ||
      t.category?.toLowerCase().includes(lowerSearch)
  );
}

export async function getTotalIncome(companyId: string, startDate?: Date, endDate?: Date): Promise<number> {
  let transactions: Transaction[];

  if (startDate && endDate) {
    transactions = await getTransactionsByDateRange(companyId, startDate, endDate);
  } else {
    transactions = await getTransactionsByType(companyId, 'income');
  }

  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

export async function getTotalExpenses(companyId: string, startDate?: Date, endDate?: Date): Promise<number> {
  let transactions: Transaction[];

  if (startDate && endDate) {
    transactions = await getTransactionsByDateRange(companyId, startDate, endDate);
  } else {
    transactions = await getTransactionsByType(companyId, 'expense');
  }

  return transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
}

export async function getExpensesByCategory(
  companyId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ category: string; amount: number }[]> {
  let transactions: Transaction[];

  if (startDate && endDate) {
    transactions = await getTransactionsByDateRange(companyId, startDate, endDate);
  } else {
    transactions = await getTransactionsByType(companyId, 'expense');
  }

  const expenses = transactions.filter(t => t.type === 'expense');

  const categoryMap = new Map<string, number>();
  expenses.forEach(t => {
    const category = t.category || 'Uncategorized';
    const current = categoryMap.get(category) || 0;
    categoryMap.set(category, current + t.amount);
  });

  return Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export async function getIncomeByCategory(
  companyId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ category: string; amount: number }[]> {
  let transactions: Transaction[];

  if (startDate && endDate) {
    transactions = await getTransactionsByDateRange(companyId, startDate, endDate);
  } else {
    transactions = await getTransactionsByType(companyId, 'income');
  }

  const income = transactions.filter(t => t.type === 'income');

  const categoryMap = new Map<string, number>();
  income.forEach(t => {
    const category = t.category || 'Uncategorized';
    const current = categoryMap.get(category) || 0;
    categoryMap.set(category, current + t.amount);
  });

  return Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}
