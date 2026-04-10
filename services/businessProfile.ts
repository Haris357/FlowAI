import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  BusinessProfile,
  DEFAULT_BUSINESS_PROFILE,
  SavedTemplate,
  DEFAULT_TEMPLATES,
} from '@/types/businessProfile';

// ── Business Profile ──────────────────────────────────────────────────────────

function profileRef(companyId: string, userId: string) {
  return doc(db, `companies/${companyId}/businessProfiles`, userId);
}

export async function getBusinessProfile(
  companyId: string,
  userId: string,
): Promise<BusinessProfile> {
  try {
    const snap = await getDoc(profileRef(companyId, userId));
    if (snap.exists()) return snap.data() as BusinessProfile;
    return DEFAULT_BUSINESS_PROFILE;
  } catch {
    return DEFAULT_BUSINESS_PROFILE;
  }
}

export async function saveBusinessProfile(
  companyId: string,
  userId: string,
  profile: Partial<BusinessProfile>,
): Promise<void> {
  const ref = profileRef(companyId, userId);
  const snap = await getDoc(ref);
  const data = { ...profile, updatedAt: serverTimestamp() };
  if (snap.exists()) {
    await updateDoc(ref, data);
  } else {
    await setDoc(ref, { ...DEFAULT_BUSINESS_PROFILE, ...data });
  }
}

// ── Saved Templates ───────────────────────────────────────────────────────────

function templatesRef(companyId: string, userId: string) {
  return collection(db, `companies/${companyId}/businessProfiles/${userId}/templates`);
}

function templateDocRef(companyId: string, userId: string, templateId: string) {
  return doc(db, `companies/${companyId}/businessProfiles/${userId}/templates`, templateId);
}

export async function getSavedTemplates(
  companyId: string,
  userId: string,
): Promise<SavedTemplate[]> {
  try {
    const q = query(templatesRef(companyId, userId), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as SavedTemplate);
  } catch {
    return [];
  }
}

export async function addSavedTemplate(
  companyId: string,
  userId: string,
  template: Omit<SavedTemplate, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const now = serverTimestamp();
  const ref = await addDoc(templatesRef(companyId, userId), {
    ...template,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateSavedTemplate(
  companyId: string,
  userId: string,
  templateId: string,
  updates: Partial<Omit<SavedTemplate, 'id' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(templateDocRef(companyId, userId, templateId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSavedTemplate(
  companyId: string,
  userId: string,
  templateId: string,
): Promise<void> {
  await deleteDoc(templateDocRef(companyId, userId, templateId));
}

/** Seed default templates for a new user (call once on first load if empty) */
export async function seedDefaultTemplates(
  companyId: string,
  userId: string,
): Promise<void> {
  const now = serverTimestamp();
  for (const t of DEFAULT_TEMPLATES) {
    await addDoc(templatesRef(companyId, userId), { ...t, createdAt: now, updatedAt: now });
  }
}
