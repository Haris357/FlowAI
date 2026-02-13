import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import {
  MASTER_ACCOUNT_TYPES,
  DEFAULT_ACCOUNT_SUBTYPES,
  DEFAULT_ACCOUNTS,
  BUSINESS_SPECIFIC_ACCOUNTS
} from '@/lib/account-seed-data';
import { AccountTypeMaster, AccountSubtype, Account } from '@/types';

// Initialize master account types (run once globally)
export async function initializeMasterAccountTypes(): Promise<void> {
  const accountTypesRef = collection(db, 'accountTypes');
  const snapshot = await getDocs(accountTypesRef);

  // Only initialize if empty
  if (snapshot.empty) {
    for (const type of MASTER_ACCOUNT_TYPES) {
      await setDoc(doc(accountTypesRef, type.code), {
        ...type,
        createdAt: serverTimestamp()
      });
    }
    console.log('Master account types initialized');
  }
}

// Get all master account types
export async function getMasterAccountTypes(): Promise<AccountTypeMaster[]> {
  const accountTypesRef = collection(db, 'accountTypes');
  const snapshot = await getDocs(accountTypesRef);

  if (snapshot.empty) {
    // Initialize if empty
    await initializeMasterAccountTypes();
    const newSnapshot = await getDocs(accountTypesRef);
    return newSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AccountTypeMaster));
  }

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as AccountTypeMaster));
}

// Initialize account subtypes for a company
export async function initializeCompanySubtypes(companyId: string): Promise<Map<string, { id: string; typeId: string; typeName: string; typeCode: string }>> {
  const subtypesRef = collection(db, `companies/${companyId}/accountSubtypes`);
  const existingSnapshot = await getDocs(subtypesRef);

  // Return existing subtypes if already initialized
  if (!existingSnapshot.empty) {
    const subtypeMap = new Map<string, { id: string; typeId: string; typeName: string; typeCode: string }>();
    existingSnapshot.docs.forEach(doc => {
      const data = doc.data();
      subtypeMap.set(data.code, {
        id: doc.id,
        typeId: data.typeId,
        typeName: data.typeName,
        typeCode: data.typeCode
      });
    });
    return subtypeMap;
  }

  // Get master account types
  const accountTypes = await getMasterAccountTypes();
  const typeMap = new Map<string, AccountTypeMaster>();
  accountTypes.forEach(t => typeMap.set(t.code, t));

  // Create subtypes
  const subtypeMap = new Map<string, { id: string; typeId: string; typeName: string; typeCode: string }>();

  for (const subtype of DEFAULT_ACCOUNT_SUBTYPES) {
    const type = typeMap.get(subtype.typeCode);
    if (!type) continue;

    const docRef = await addDoc(subtypesRef, {
      name: subtype.name,
      code: subtype.code,
      typeId: type.id,
      typeName: type.name,
      typeCode: type.code,
      order: subtype.order,
      isSystem: subtype.isSystem,
      createdAt: serverTimestamp()
    });

    subtypeMap.set(subtype.code, {
      id: docRef.id,
      typeId: type.id,
      typeName: type.name,
      typeCode: type.code
    });
  }

  console.log(`Account subtypes initialized for company ${companyId}`);
  return subtypeMap;
}

// Initialize default accounts for a company
export async function initializeCompanyAccounts(
  companyId: string,
  businessType: string = 'other'
): Promise<void> {
  const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);
  const existingSnapshot = await getDocs(accountsRef);

  // Skip if accounts already exist
  if (!existingSnapshot.empty) {
    console.log(`Accounts already exist for company ${companyId}`);
    return;
  }

  // Initialize subtypes first and get the mapping
  const subtypeMap = await initializeCompanySubtypes(companyId);

  // Get all accounts to create (base + business-specific)
  const accountsToCreate = [
    ...DEFAULT_ACCOUNTS,
    ...(BUSINESS_SPECIFIC_ACCOUNTS[businessType] || [])
  ];

  // Create accounts
  for (const account of accountsToCreate) {
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
      subtypeName: DEFAULT_ACCOUNT_SUBTYPES.find(s => s.code === account.subtypeCode)?.name || '',
      subtypeCode: account.subtypeCode,
      description: '',
      isActive: true,
      isSystem: account.isSystem,
      balance: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  console.log(`Default accounts initialized for company ${companyId}`);
}

// Get account subtypes for a company
export async function getCompanySubtypes(companyId: string): Promise<AccountSubtype[]> {
  const subtypesRef = collection(db, `companies/${companyId}/accountSubtypes`);
  const snapshot = await getDocs(subtypesRef);

  if (snapshot.empty) {
    // Initialize if empty
    await initializeCompanySubtypes(companyId);
    const newSnapshot = await getDocs(subtypesRef);
    return newSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AccountSubtype));
  }

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as AccountSubtype));
}

// Get accounts for a company (updated version)
export async function getCompanyAccounts(companyId: string): Promise<Account[]> {
  const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);
  const snapshot = await getDocs(accountsRef);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Account));
}

// Add a new account subtype
export async function addAccountSubtype(
  companyId: string,
  name: string,
  typeCode: string
): Promise<AccountSubtype> {
  const accountTypes = await getMasterAccountTypes();
  const type = accountTypes.find(t => t.code === typeCode);

  if (!type) {
    throw new Error(`Invalid account type: ${typeCode}`);
  }

  const subtypesRef = collection(db, `companies/${companyId}/accountSubtypes`);

  // Get max order for this type
  const existingSubtypes = await getCompanySubtypes(companyId);
  const typeSubtypes = existingSubtypes.filter(s => s.typeCode === typeCode);
  const maxOrder = Math.max(0, ...typeSubtypes.map(s => s.order));

  // Generate code from name
  const code = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

  const docRef = await addDoc(subtypesRef, {
    name,
    code,
    typeId: type.id,
    typeName: type.name,
    typeCode: type.code,
    order: maxOrder + 1,
    isSystem: false,
    createdAt: serverTimestamp()
  });

  return {
    id: docRef.id,
    name,
    code,
    typeId: type.id,
    typeName: type.name,
    typeCode: type.code,
    order: maxOrder + 1,
    isSystem: false,
    createdAt: Timestamp.now()
  };
}

// Add a new account
export async function addAccount(
  companyId: string,
  name: string,
  subtypeId: string,
  code?: string,
  description?: string
): Promise<Account> {
  const subtypes = await getCompanySubtypes(companyId);
  const subtype = subtypes.find(s => s.id === subtypeId);

  if (!subtype) {
    throw new Error(`Invalid subtype: ${subtypeId}`);
  }

  const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);

  // Generate code if not provided
  if (!code) {
    const existingAccounts = await getCompanyAccounts(companyId);
    const typeAccounts = existingAccounts.filter(a => a.typeCode === subtype.typeCode);
    const maxCode = Math.max(0, ...typeAccounts.map(a => parseInt(a.code) || 0));
    code = String(maxCode + 10).padStart(4, '0');
  }

  const docRef = await addDoc(accountsRef, {
    code,
    name,
    typeId: subtype.typeId,
    typeName: subtype.typeName,
    typeCode: subtype.typeCode,
    subtypeId: subtype.id,
    subtypeName: subtype.name,
    subtypeCode: subtype.code,
    description: description || '',
    isActive: true,
    isSystem: false,
    balance: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return {
    id: docRef.id,
    code,
    name,
    typeId: subtype.typeId,
    typeName: subtype.typeName,
    typeCode: subtype.typeCode,
    subtypeId: subtype.id,
    subtypeName: subtype.name,
    subtypeCode: subtype.code,
    description: description || '',
    isActive: true,
    isSystem: false,
    balance: 0,
    createdAt: Timestamp.now()
  };
}

// Find account by name (fuzzy match)
export async function findAccountByName(
  companyId: string,
  name: string
): Promise<Account | null> {
  const accounts = await getCompanyAccounts(companyId);
  const lowerName = name.toLowerCase();

  // Exact match first
  let account = accounts.find(a => a.name.toLowerCase() === lowerName);
  if (account) return account;

  // Partial match
  account = accounts.find(a => a.name.toLowerCase().includes(lowerName));
  if (account) return account;

  // Fuzzy match on words
  const words = lowerName.split(' ');
  account = accounts.find(a => {
    const accountWords = a.name.toLowerCase().split(' ');
    return words.some(w => accountWords.some(aw => aw.includes(w) || w.includes(aw)));
  });

  return account || null;
}
