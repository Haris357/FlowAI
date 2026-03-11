import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  query, where, Timestamp, orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Invitation, CompanyRole } from '@/types';

const invitationsCol = () => collection(db, 'invitations');

// ==========================================
// READ
// ==========================================

/** Get invitations for a company sent by a specific user */
export async function getCompanyInvitations(companyId: string, invitedByUid: string): Promise<Invitation[]> {
  const q = query(
    invitationsCol(),
    where('companyId', '==', companyId),
    where('invitedByUid', '==', invitedByUid),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Invitation);
}

/** Get all pending invitations for a user (by email) */
export async function getPendingInvitationsForUser(email: string): Promise<Invitation[]> {
  const q = query(
    invitationsCol(),
    where('invitedEmail', '==', email.toLowerCase()),
    where('status', '==', 'pending'),
  );
  const snap = await getDocs(q);
  // Filter out expired ones client-side
  const now = Date.now();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as Invitation)
    .filter(inv => {
      const expiresMs = inv.expiresAt?.toMillis?.() || inv.expiresAt?.seconds * 1000 || 0;
      return expiresMs > now;
    });
}

/** Get a single invitation by ID */
export async function getInvitation(invitationId: string): Promise<Invitation | null> {
  const snap = await getDoc(doc(db, 'invitations', invitationId));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Invitation : null;
}

// ==========================================
// WRITE (client-side — for simple operations)
// ==========================================

/** Cancel a pending invitation (by the inviter) */
export async function cancelInvitation(invitationId: string): Promise<void> {
  await updateDoc(doc(db, 'invitations', invitationId), {
    status: 'expired',
    respondedAt: Timestamp.now(),
  });
}
