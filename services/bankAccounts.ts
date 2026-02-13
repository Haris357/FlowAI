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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BankAccount, BankAccountType, BankTransaction, BankReconciliation, JournalEntryLine } from '@/types';
import { createJournalEntry } from './journalEntries';
import { QUERY_LIMITS } from '@/lib/firestore-helpers';

// ==========================================
// BANK ACCOUNTS
// ==========================================

/**
 * Get bank accounts with optional limit
 * @param companyId - Company ID
 * @param maxResults - Maximum number of results (default: 50)
 * @returns Array of bank accounts sorted by name
 */
export async function getBankAccounts(companyId: string, maxResults: number = QUERY_LIMITS.DEFAULT): Promise<BankAccount[]> {
  const accountsRef = collection(db, `companies/${companyId}/bankAccounts`);
  const q = query(accountsRef, orderBy('name'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as BankAccount[];
}

/**
 * Get active bank accounts
 * @param companyId - Company ID
 * @param maxResults - Maximum number of results (default: 50)
 * @returns Array of active bank accounts
 */
export async function getActiveBankAccounts(companyId: string, maxResults: number = QUERY_LIMITS.DEFAULT): Promise<BankAccount[]> {
  const accountsRef = collection(db, `companies/${companyId}/bankAccounts`);
  const q = query(accountsRef, where('isActive', '==', true), orderBy('name'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as BankAccount[];
}

export async function getBankAccountById(companyId: string, accountId: string): Promise<BankAccount | null> {
  const accountRef = doc(db, `companies/${companyId}/bankAccounts`, accountId);
  const snapshot = await getDoc(accountRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as BankAccount;
}

export async function getDefaultBankAccount(companyId: string): Promise<BankAccount | null> {
  const accountsRef = collection(db, `companies/${companyId}/bankAccounts`);
  const q = query(accountsRef, where('isDefault', '==', true));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
  } as BankAccount;
}

export async function createBankAccount(
  companyId: string,
  data: {
    name: string;
    accountType: BankAccountType;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    currency: string;
    openingBalance: number;
    linkedAccountId: string;
    linkedAccountName: string;
    linkedAccountCode: string;
    openingBalanceAccountId?: string;
    openingBalanceAccountCode?: string;
    openingBalanceAccountName?: string;
    isDefault?: boolean;
    notes?: string;
    createdBy: string;
  }
): Promise<string> {
  // If this is marked as default, unset other defaults first
  if (data.isDefault) {
    const existingDefault = await getDefaultBankAccount(companyId);
    if (existingDefault) {
      await updateBankAccount(companyId, existingDefault.id, { isDefault: false });
    }
  }

  const accountsRef = collection(db, `companies/${companyId}/bankAccounts`);
  const docRef = await addDoc(accountsRef, {
    name: data.name,
    accountType: data.accountType,
    bankName: data.bankName || '',
    accountNumber: data.accountNumber || '',
    routingNumber: data.routingNumber || '',
    currency: data.currency,
    openingBalance: data.openingBalance,
    currentBalance: data.openingBalance,
    linkedAccountId: data.linkedAccountId,
    linkedAccountName: data.linkedAccountName,
    linkedAccountCode: data.linkedAccountCode || '',
    isActive: true,
    isDefault: data.isDefault || false,
    notes: data.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Create opening balance journal entry if there's an opening balance
  if (data.openingBalance !== 0 && data.openingBalanceAccountId) {
    const lines: JournalEntryLine[] = data.openingBalance > 0
      ? [
          // Debit the bank account (asset increases)
          {
            accountId: data.linkedAccountId,
            accountCode: data.linkedAccountCode,
            accountName: data.linkedAccountName,
            description: `Opening balance for ${data.name}`,
            debit: Math.abs(data.openingBalance),
            credit: 0,
          },
          // Credit the opening balance equity account
          {
            accountId: data.openingBalanceAccountId,
            accountCode: data.openingBalanceAccountCode || '',
            accountName: data.openingBalanceAccountName || 'Opening Balance Equity',
            description: `Opening balance for ${data.name}`,
            debit: 0,
            credit: Math.abs(data.openingBalance),
          },
        ]
      : [
          // Credit the bank account (for negative balance like credit card)
          {
            accountId: data.linkedAccountId,
            accountCode: data.linkedAccountCode,
            accountName: data.linkedAccountName,
            description: `Opening balance for ${data.name}`,
            debit: 0,
            credit: Math.abs(data.openingBalance),
          },
          // Debit the opening balance equity account
          {
            accountId: data.openingBalanceAccountId,
            accountCode: data.openingBalanceAccountCode || '',
            accountName: data.openingBalanceAccountName || 'Opening Balance Equity',
            description: `Opening balance for ${data.name}`,
            debit: Math.abs(data.openingBalance),
            credit: 0,
          },
        ];

    await createJournalEntry(companyId, {
      date: new Date(),
      description: `Opening balance - ${data.name}`,
      lines,
      reference: docRef.id,
      referenceType: 'bank_account',
      createdBy: data.createdBy,
    });
  }

  return docRef.id;
}

export async function updateBankAccount(
  companyId: string,
  accountId: string,
  data: Partial<BankAccount>
): Promise<void> {
  // If setting as default, unset other defaults first
  if (data.isDefault) {
    const existingDefault = await getDefaultBankAccount(companyId);
    if (existingDefault && existingDefault.id !== accountId) {
      const defaultRef = doc(db, `companies/${companyId}/bankAccounts`, existingDefault.id);
      await updateDoc(defaultRef, { isDefault: false });
    }
  }

  const accountRef = doc(db, `companies/${companyId}/bankAccounts`, accountId);
  await updateDoc(accountRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function updateBankAccountBalance(
  companyId: string,
  accountId: string,
  amount: number
): Promise<void> {
  const account = await getBankAccountById(companyId, accountId);
  if (!account) throw new Error('Bank account not found');

  await updateBankAccount(companyId, accountId, {
    currentBalance: account.currentBalance + amount,
  });
}

export async function deleteBankAccount(companyId: string, accountId: string): Promise<void> {
  const accountRef = doc(db, `companies/${companyId}/bankAccounts`, accountId);
  await deleteDoc(accountRef);
}

// ==========================================
// BANK TRANSACTIONS
// ==========================================

/**
 * Get bank transactions with optional filtering and limit
 * @param companyId - Company ID
 * @param bankAccountId - Optional bank account ID to filter by
 * @param maxResults - Maximum number of results (default: 100)
 * @returns Array of bank transactions sorted by date (newest first)
 */
export async function getBankTransactions(companyId: string, bankAccountId?: string, maxResults: number = QUERY_LIMITS.TRANSACTIONS): Promise<BankTransaction[]> {
  const txnsRef = collection(db, `companies/${companyId}/bankTransactions`);
  let q;

  if (bankAccountId) {
    q = query(txnsRef, where('bankAccountId', '==', bankAccountId), orderBy('date', 'desc'), limit(maxResults));
  } else {
    q = query(txnsRef, orderBy('date', 'desc'), limit(maxResults));
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as BankTransaction[];
}

export async function getBankTransactionById(companyId: string, txnId: string): Promise<BankTransaction | null> {
  const txnRef = doc(db, `companies/${companyId}/bankTransactions`, txnId);
  const snapshot = await getDoc(txnRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as BankTransaction;
}

export async function getUnreconciledTransactions(companyId: string, bankAccountId: string): Promise<BankTransaction[]> {
  const txnsRef = collection(db, `companies/${companyId}/bankTransactions`);
  const q = query(
    txnsRef,
    where('bankAccountId', '==', bankAccountId),
    where('reconciliationStatus', '==', 'unreconciled'),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as BankTransaction[];
}

export async function createBankTransaction(
  companyId: string,
  data: {
    bankAccountId: string;
    bankAccountName: string;
    linkedAccountId: string;
    linkedAccountCode: string;
    linkedAccountName: string;
    type: BankTransaction['type'];
    date: Date;
    amount: number;
    description: string;
    payee?: string;
    checkNumber?: string;
    reference?: string;
    category?: string;
    categoryAccountId?: string;
    categoryAccountCode?: string;
    categoryAccountName?: string;
    invoiceId?: string;
    billId?: string;
    paymentId?: string;
    transferToAccountId?: string;
    createdBy: string;
  }
): Promise<string> {
  const txnsRef = collection(db, `companies/${companyId}/bankTransactions`);
  const docRef = await addDoc(txnsRef, {
    bankAccountId: data.bankAccountId,
    bankAccountName: data.bankAccountName,
    linkedAccountId: data.linkedAccountId,
    linkedAccountCode: data.linkedAccountCode,
    linkedAccountName: data.linkedAccountName,
    type: data.type,
    date: Timestamp.fromDate(data.date),
    amount: data.amount,
    description: data.description,
    payee: data.payee || '',
    checkNumber: data.checkNumber || '',
    reference: data.reference || '',
    category: data.category || '',
    categoryAccountId: data.categoryAccountId || '',
    categoryAccountCode: data.categoryAccountCode || '',
    categoryAccountName: data.categoryAccountName || '',
    status: 'cleared',
    reconciliationStatus: 'unreconciled',
    invoiceId: data.invoiceId || '',
    billId: data.billId || '',
    paymentId: data.paymentId || '',
    transferToAccountId: data.transferToAccountId || '',
    importedFrom: 'manual',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Update bank account balance
  await updateBankAccountBalance(companyId, data.bankAccountId, data.amount);

  // Create journal entry if category account is specified (for double-entry)
  if (data.categoryAccountId && data.linkedAccountId) {
    const absAmount = Math.abs(data.amount);
    const isDeposit = data.amount > 0;

    const lines: JournalEntryLine[] = isDeposit
      ? [
          // Deposit: Debit bank account, Credit income/category account
          {
            accountId: data.linkedAccountId,
            accountCode: data.linkedAccountCode,
            accountName: data.linkedAccountName,
            description: data.description,
            debit: absAmount,
            credit: 0,
          },
          {
            accountId: data.categoryAccountId,
            accountCode: data.categoryAccountCode || '',
            accountName: data.categoryAccountName || '',
            description: data.description,
            debit: 0,
            credit: absAmount,
          },
        ]
      : [
          // Withdrawal: Debit expense/category account, Credit bank account
          {
            accountId: data.categoryAccountId,
            accountCode: data.categoryAccountCode || '',
            accountName: data.categoryAccountName || '',
            description: data.description,
            debit: absAmount,
            credit: 0,
          },
          {
            accountId: data.linkedAccountId,
            accountCode: data.linkedAccountCode,
            accountName: data.linkedAccountName,
            description: data.description,
            debit: 0,
            credit: absAmount,
          },
        ];

    const journalEntryId = await createJournalEntry(companyId, {
      date: data.date,
      description: data.description,
      lines,
      reference: docRef.id,
      referenceType: 'bank_transaction',
      createdBy: data.createdBy,
    });

    // Link journal entry to transaction
    await updateDoc(docRef, { journalEntryId });
  }

  return docRef.id;
}

export async function updateBankTransaction(
  companyId: string,
  txnId: string,
  data: Partial<BankTransaction>
): Promise<void> {
  const txnRef = doc(db, `companies/${companyId}/bankTransactions`, txnId);
  await updateDoc(txnRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function reconcileTransaction(companyId: string, txnId: string): Promise<void> {
  await updateBankTransaction(companyId, txnId, {
    reconciliationStatus: 'reconciled',
    reconciledAt: Timestamp.now(),
  });
}

export async function deleteBankTransaction(companyId: string, txnId: string): Promise<void> {
  const txn = await getBankTransactionById(companyId, txnId);
  if (txn) {
    // Reverse the balance change
    await updateBankAccountBalance(companyId, txn.bankAccountId, -txn.amount);
  }

  const txnRef = doc(db, `companies/${companyId}/bankTransactions`, txnId);
  await deleteDoc(txnRef);
}

// ==========================================
// BANK RECONCILIATION
// ==========================================

export async function getReconciliations(companyId: string, bankAccountId?: string): Promise<BankReconciliation[]> {
  const recsRef = collection(db, `companies/${companyId}/bankReconciliations`);
  let q;

  if (bankAccountId) {
    q = query(recsRef, where('bankAccountId', '==', bankAccountId), orderBy('statementDate', 'desc'));
  } else {
    q = query(recsRef, orderBy('statementDate', 'desc'));
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as BankReconciliation[];
}

export async function getReconciliationById(companyId: string, recId: string): Promise<BankReconciliation | null> {
  const recRef = doc(db, `companies/${companyId}/bankReconciliations`, recId);
  const snapshot = await getDoc(recRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as BankReconciliation;
}

export async function startReconciliation(
  companyId: string,
  data: {
    bankAccountId: string;
    bankAccountName: string;
    statementDate: Date;
    statementEndingBalance: number;
  }
): Promise<string> {
  const account = await getBankAccountById(companyId, data.bankAccountId);
  if (!account) throw new Error('Bank account not found');

  // Get the last reconciled balance or use opening balance
  const lastRec = await getReconciliations(companyId, data.bankAccountId);
  const openingBalance = lastRec.length > 0 && lastRec[0].status === 'completed'
    ? lastRec[0].statementEndingBalance
    : account.openingBalance;

  const recsRef = collection(db, `companies/${companyId}/bankReconciliations`);
  const docRef = await addDoc(recsRef, {
    bankAccountId: data.bankAccountId,
    bankAccountName: data.bankAccountName,
    statementDate: Timestamp.fromDate(data.statementDate),
    statementEndingBalance: data.statementEndingBalance,
    openingBalance,
    clearedDeposits: 0,
    clearedWithdrawals: 0,
    reconciledBalance: openingBalance,
    difference: data.statementEndingBalance - openingBalance,
    status: 'in_progress',
    transactionIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateReconciliation(
  companyId: string,
  recId: string,
  data: Partial<BankReconciliation>
): Promise<void> {
  const recRef = doc(db, `companies/${companyId}/bankReconciliations`, recId);
  await updateDoc(recRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function addTransactionToReconciliation(
  companyId: string,
  recId: string,
  txnId: string
): Promise<void> {
  const rec = await getReconciliationById(companyId, recId);
  if (!rec) throw new Error('Reconciliation not found');

  const txn = await getBankTransactionById(companyId, txnId);
  if (!txn) throw new Error('Transaction not found');

  const newTransactionIds = [...rec.transactionIds, txnId];

  // Recalculate totals
  let clearedDeposits = rec.clearedDeposits;
  let clearedWithdrawals = rec.clearedWithdrawals;

  if (txn.amount > 0) {
    clearedDeposits += txn.amount;
  } else {
    clearedWithdrawals += Math.abs(txn.amount);
  }

  const reconciledBalance = rec.openingBalance + clearedDeposits - clearedWithdrawals;
  const difference = rec.statementEndingBalance - reconciledBalance;

  await updateReconciliation(companyId, recId, {
    transactionIds: newTransactionIds,
    clearedDeposits,
    clearedWithdrawals,
    reconciledBalance,
    difference,
  });

  // Mark transaction as matched
  await updateBankTransaction(companyId, txnId, {
    reconciliationStatus: 'matched',
  });
}

export async function completeReconciliation(
  companyId: string,
  recId: string,
  completedBy: string
): Promise<void> {
  const rec = await getReconciliationById(companyId, recId);
  if (!rec) throw new Error('Reconciliation not found');

  if (Math.abs(rec.difference) > 0.01) {
    throw new Error('Reconciliation does not balance');
  }

  // Mark all matched transactions as reconciled
  await Promise.all(
    rec.transactionIds.map(txnId => reconcileTransaction(companyId, txnId))
  );

  // Update bank account's last reconciled info
  await updateBankAccount(companyId, rec.bankAccountId, {
    lastReconciledDate: rec.statementDate,
    lastReconciledBalance: rec.statementEndingBalance,
  });

  // Complete the reconciliation
  await updateReconciliation(companyId, recId, {
    status: 'completed',
    completedAt: Timestamp.now(),
    completedBy,
  });
}

export async function abandonReconciliation(companyId: string, recId: string): Promise<void> {
  const rec = await getReconciliationById(companyId, recId);
  if (!rec) throw new Error('Reconciliation not found');

  // Reset matched transactions to unreconciled
  await Promise.all(
    rec.transactionIds.map(txnId =>
      updateBankTransaction(companyId, txnId, {
        reconciliationStatus: 'unreconciled',
      })
    )
  );

  await updateReconciliation(companyId, recId, { status: 'abandoned' });
}

// ==========================================
// STATS
// ==========================================

export async function getBankStats(companyId: string): Promise<{
  totalAccounts: number;
  activeAccounts: number;
  totalBalance: number;
  unreconciledTransactions: number;
}> {
  const [accounts, transactions] = await Promise.all([
    getBankAccounts(companyId),
    getBankTransactions(companyId),
  ]);

  const activeAccounts = accounts.filter(a => a.isActive);

  return {
    totalAccounts: accounts.length,
    activeAccounts: activeAccounts.length,
    totalBalance: activeAccounts.reduce((sum, a) => sum + a.currentBalance, 0),
    unreconciledTransactions: transactions.filter(t => t.reconciliationStatus === 'unreconciled').length,
  };
}
