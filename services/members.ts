import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, Timestamp, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CompanyMember, CompanyRole } from '@/types';

const membersCol = (companyId: string) => collection(db, `companies/${companyId}/members`);
const membershipCol = (userId: string) => collection(db, `users/${userId}/companyMemberships`);

// ==========================================
// READ
// ==========================================

/** Get all members of a company */
export async function getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
  const snap = await getDocs(membersCol(companyId));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as CompanyMember);
}

/** Get a specific member */
export async function getCompanyMember(companyId: string, userId: string): Promise<CompanyMember | null> {
  const docRef = doc(db, `companies/${companyId}/members`, userId);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } as CompanyMember : null;
}

/** Get all companies a user is a member of (via denormalized memberships) */
export async function getUserMemberships(userId: string): Promise<Array<{ companyId: string; companyName: string; role: CompanyRole }>> {
  const snap = await getDocs(membershipCol(userId));
  return snap.docs.map(d => ({
    companyId: d.id,
    companyName: d.data().companyName,
    role: d.data().role as CompanyRole,
  }));
}

// ==========================================
// WRITE
// ==========================================

/** Add a member to a company (called after invitation is accepted) */
export async function addCompanyMember(
  companyId: string,
  companyName: string,
  member: {
    userId: string;
    email: string;
    name: string;
    photoURL?: string;
    role: CompanyRole;
    invitedBy: string;
  }
): Promise<void> {
  const now = Timestamp.now();

  // Add to company's members subcollection (doc ID = userId for easy lookups)
  await setDoc(doc(db, `companies/${companyId}/members`, member.userId), {
    userId: member.userId,
    email: member.email,
    name: member.name,
    photoURL: member.photoURL || null,
    role: member.role,
    invitedBy: member.invitedBy,
    joinedAt: now,
  });

  // Denormalized membership on the user doc for fast "my companies" queries
  await setDoc(doc(db, `users/${member.userId}/companyMemberships`, companyId), {
    companyName,
    role: member.role,
    joinedAt: now,
  });
}

/** Update a member's role */
export async function updateMemberRole(
  companyId: string,
  userId: string,
  newRole: CompanyRole,
): Promise<void> {
  await updateDoc(doc(db, `companies/${companyId}/members`, userId), { role: newRole });
  await updateDoc(doc(db, `users/${userId}/companyMemberships`, companyId), { role: newRole });
}

/** Remove a member from a company */
export async function removeCompanyMember(
  companyId: string,
  userId: string,
): Promise<void> {
  await deleteDoc(doc(db, `companies/${companyId}/members`, userId));
  await deleteDoc(doc(db, `users/${userId}/companyMemberships`, companyId));
}

/** Add owner as the first member when creating a company */
export async function addOwnerAsMember(
  companyId: string,
  companyName: string,
  owner: { userId: string; email: string; name: string; photoURL?: string },
): Promise<void> {
  await addCompanyMember(companyId, companyName, {
    ...owner,
    role: 'owner',
    invitedBy: owner.userId,
  });
}
