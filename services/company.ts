import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  updateDoc,
  writeBatch,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { initializeCompanySettings } from './settings';
import {
  getMasterAccountTypes,
  initializeCompanySubtypes,
  initializeCompanyAccounts,
} from './account-init';
import {
  DEFAULT_ACCOUNT_SUBTYPES,
  DEFAULT_ACCOUNTS,
} from '@/lib/account-seed-data';

interface DeleteProgress {
  collection: string;
  deleted: number;
  total: number;
}

type ProgressCallback = (progress: DeleteProgress) => void;

/**
 * Delete all user-created company data while preserving system/master data
 * This includes:
 * - All invoices
 * - All bills
 * - All customers
 * - All vendors
 * - All employees
 * - All transactions
 * - All journal entries
 * - All salary slips
 * - Non-system accounts (preserves isSystem: true accounts)
 * - Non-system account subtypes (preserves isSystem: true subtypes)
 * - Resets settings to defaults
 * - Resets invoice/bill numbering to 1
 */
export async function deleteCompanyData(
  companyId: string,
  onProgress?: ProgressCallback
): Promise<{ success: boolean; deletedCounts: Record<string, number> }> {
  const deletedCounts: Record<string, number> = {};

  try {
    // Define collections to delete completely
    const collectionsToDelete = [
      'invoices',
      'bills',
      'customers',
      'vendors',
      'employees',
      'transactions',
      'journalEntries',
      'salarySlips',
    ];

    // Delete each collection completely
    for (const collectionName of collectionsToDelete) {
      const deleted = await deleteCollection(
        companyId,
        collectionName,
        onProgress
      );
      deletedCounts[collectionName] = deleted;
    }

    // Delete ALL accounts and subtypes, then reinitialize with proper mappings
    const accountsDeleted = await deleteCollection(
      companyId,
      'chartOfAccounts',
      onProgress
    );
    deletedCounts['accounts'] = accountsDeleted;

    const subtypesDeleted = await deleteCollection(
      companyId,
      'accountSubtypes',
      onProgress
    );
    deletedCounts['accountSubtypes'] = subtypesDeleted;

    // Reinitialize chart of accounts with proper type -> subtype -> account mappings
    await reinitializeChartOfAccounts(companyId, onProgress);
    deletedCounts['accountsReinitialized'] = 1;

    // Delete all settings and reinitialize with defaults
    await resetSettingsToDefaults(companyId, onProgress);
    deletedCounts['settings'] = 1; // Mark as done

    // Reset company numbering counters
    await resetCompanyCounters(companyId);
    deletedCounts['counters'] = 1;

    return { success: true, deletedCounts };
  } catch (error) {
    console.error('Error deleting company data:', error);
    throw error;
  }
}

/**
 * Delete all documents in a collection
 */
async function deleteCollection(
  companyId: string,
  collectionName: string,
  onProgress?: ProgressCallback
): Promise<number> {
  const collRef = collection(db, `companies/${companyId}/${collectionName}`);
  const snapshot = await getDocs(collRef);

  if (snapshot.empty) {
    onProgress?.({ collection: collectionName, deleted: 0, total: 0 });
    return 0;
  }

  const total = snapshot.docs.length;
  let deleted = 0;

  // Use batched writes for efficiency (max 500 per batch)
  const batchSize = 500;
  const batches = [];

  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = snapshot.docs.slice(i, i + batchSize);

    chunk.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });

    batches.push(batch);
  }

  // Execute batches sequentially
  for (const batch of batches) {
    await batch.commit();
    deleted += Math.min(batchSize, total - deleted + batchSize);
    onProgress?.({ collection: collectionName, deleted: Math.min(deleted, total), total });
  }

  onProgress?.({ collection: collectionName, deleted: total, total });
  return total;
}

/**
 * Delete only non-system documents (where isSystem !== true)
 */
async function deleteNonSystemDocuments(
  companyId: string,
  collectionName: string,
  onProgress?: ProgressCallback
): Promise<number> {
  const collRef = collection(db, `companies/${companyId}/${collectionName}`);
  const snapshot = await getDocs(collRef);

  if (snapshot.empty) {
    onProgress?.({ collection: collectionName, deleted: 0, total: 0 });
    return 0;
  }

  // Filter to only non-system documents
  const nonSystemDocs = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return data.isSystem !== true;
  });

  const total = nonSystemDocs.length;

  if (total === 0) {
    onProgress?.({ collection: collectionName, deleted: 0, total: 0 });
    return 0;
  }

  let deleted = 0;

  // Use batched writes
  const batchSize = 500;
  const batches = [];

  for (let i = 0; i < nonSystemDocs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = nonSystemDocs.slice(i, i + batchSize);

    chunk.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });

    batches.push(batch);
  }

  for (const batch of batches) {
    await batch.commit();
    deleted += Math.min(batchSize, total - deleted + batchSize);
    onProgress?.({ collection: collectionName, deleted: Math.min(deleted, total), total });
  }

  onProgress?.({ collection: collectionName, deleted: total, total });
  return total;
}

/**
 * Delete all settings and reinitialize with defaults
 */
async function resetSettingsToDefaults(
  companyId: string,
  onProgress?: ProgressCallback
): Promise<void> {
  const settingsRef = collection(db, `companies/${companyId}/settings`);
  const snapshot = await getDocs(settingsRef);

  // Delete existing settings
  if (!snapshot.empty) {
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  onProgress?.({ collection: 'settings', deleted: 1, total: 1 });

  // Reinitialize with defaults
  await initializeCompanySettings(companyId);
}

/**
 * Reset company invoice/bill numbering counters
 */
async function resetCompanyCounters(companyId: string): Promise<void> {
  const companyRef = doc(db, 'companies', companyId);
  await updateDoc(companyRef, {
    invoiceNextNumber: 1,
    billNextNumber: 1,
  });
}

/**
 * Reinitialize the chart of accounts with proper type -> subtype -> account mappings
 */
async function reinitializeChartOfAccounts(
  companyId: string,
  onProgress?: ProgressCallback
): Promise<void> {
  onProgress?.({ collection: 'accountsInit', deleted: 0, total: 2 });

  // Get master account types
  const accountTypes = await getMasterAccountTypes();
  const typeMap = new Map(accountTypes.map(t => [t.code, t]));

  // Create subtypes with proper type mappings
  const subtypesRef = collection(db, `companies/${companyId}/accountSubtypes`);
  const subtypeMap = new Map<string, { id: string; typeId: string; typeName: string; typeCode: string; name: string }>();

  for (const subtype of DEFAULT_ACCOUNT_SUBTYPES) {
    const type = typeMap.get(subtype.typeCode);
    if (!type) {
      console.warn(`Type ${subtype.typeCode} not found for subtype ${subtype.name}`);
      continue;
    }

    const docRef = await addDoc(subtypesRef, {
      name: subtype.name,
      code: subtype.code,
      typeId: type.id,
      typeName: type.name,
      typeCode: type.code,
      order: subtype.order,
      isSystem: subtype.isSystem,
      createdAt: serverTimestamp(),
    });

    subtypeMap.set(subtype.code, {
      id: docRef.id,
      typeId: type.id,
      typeName: type.name,
      typeCode: type.code,
      name: subtype.name,
    });
  }

  onProgress?.({ collection: 'accountsInit', deleted: 1, total: 2 });

  // Create accounts with proper subtype and type mappings
  const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);

  for (const account of DEFAULT_ACCOUNTS) {
    const subtypeInfo = subtypeMap.get(account.subtypeCode);
    if (!subtypeInfo) {
      console.warn(`Subtype ${account.subtypeCode} not found for account ${account.name}`);
      continue;
    }

    await addDoc(accountsRef, {
      code: account.code,
      name: account.name,
      typeId: subtypeInfo.typeId,
      typeName: subtypeInfo.typeName,
      typeCode: subtypeInfo.typeCode,
      subtypeId: subtypeInfo.id,
      subtypeName: subtypeInfo.name,
      subtypeCode: account.subtypeCode,
      description: '',
      isActive: true,
      isSystem: account.isSystem,
      balance: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  onProgress?.({ collection: 'accountsInit', deleted: 2, total: 2 });
  console.log(`Chart of accounts reinitialized for company ${companyId}`);
}

/**
 * Get counts of all data that would be deleted (for preview)
 */
export async function getCompanyDataCounts(
  companyId: string
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  const collections = [
    'invoices',
    'bills',
    'customers',
    'vendors',
    'employees',
    'transactions',
    'journalEntries',
    'salarySlips',
  ];

  for (const collectionName of collections) {
    const collRef = collection(db, `companies/${companyId}/${collectionName}`);
    const snapshot = await getDocs(collRef);
    counts[collectionName] = snapshot.size;
  }

  // Count all accounts (will be deleted and reinitialized)
  const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);
  const accountsSnapshot = await getDocs(accountsRef);
  counts['accounts'] = accountsSnapshot.size;
  counts['customAccounts'] = accountsSnapshot.docs.filter(
    (doc) => doc.data().isSystem !== true
  ).length;

  // Count all subtypes (will be deleted and reinitialized)
  const subtypesRef = collection(db, `companies/${companyId}/accountSubtypes`);
  const subtypesSnapshot = await getDocs(subtypesRef);
  counts['accountSubtypes'] = subtypesSnapshot.size;
  counts['customSubtypes'] = subtypesSnapshot.docs.filter(
    (doc) => doc.data().isSystem !== true
  ).length;

  return counts;
}
