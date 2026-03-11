import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { notifyUser } from '@/lib/notify';

initAdmin();
const adminDb = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const { invitationId, userId, action } = await request.json();

    if (!invitationId || !userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json({ error: 'Action must be accept or decline' }, { status: 400 });
    }

    // Get the invitation
    const invRef = adminDb.doc(`invitations/${invitationId}`);
    const invSnap = await invRef.get();
    if (!invSnap.exists) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const invitation = invSnap.data()!;

    // Verify invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: `Invitation is already ${invitation.status}` }, { status: 400 });
    }

    // Check expiration
    const expiresMs = invitation.expiresAt?.toMillis?.() || invitation.expiresAt?.seconds * 1000 || 0;
    if (Date.now() > expiresMs) {
      await invRef.update({ status: 'expired' });
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Verify user email matches invitation
    const userSnap = await adminDb.doc(`users/${userId}`).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userData = userSnap.data()!;
    if (userData.email?.toLowerCase() !== invitation.invitedEmail) {
      return NextResponse.json({ error: 'This invitation is not for your account' }, { status: 403 });
    }

    const now = Timestamp.now();

    if (action === 'decline') {
      await invRef.update({ status: 'declined', respondedAt: now });

      // Notify inviter
      await notifyUser({
        userId: invitation.invitedByUid,
        templateType: 'custom',
        templateData: {
          customSubject: `Invitation declined`,
          customMessage: `${userData.name || userData.email} has declined your invitation to join "${invitation.companyName}".`,
        },
        notification: {
          type: 'info',
          title: 'Invitation Declined',
          message: `${userData.name || userData.email} declined the invitation to "${invitation.companyName}"`,
          category: 'team',
        },
      });

      return NextResponse.json({ success: true, message: 'Invitation declined' });
    }

    // === ACCEPT ===
    const { companyId, companyName, role } = invitation;

    // Verify company still exists
    const companySnap = await adminDb.doc(`companies/${companyId}`).get();
    if (!companySnap.exists) {
      await invRef.update({ status: 'expired', respondedAt: now });
      return NextResponse.json({ error: 'Company no longer exists' }, { status: 400 });
    }

    // Check if already a member
    const existingMember = await adminDb.doc(`companies/${companyId}/members/${userId}`).get();
    if (existingMember.exists) {
      await invRef.update({ status: 'accepted', respondedAt: now });
      return NextResponse.json({ success: true, message: 'You are already a member' });
    }

    // Add as member
    await adminDb.doc(`companies/${companyId}/members/${userId}`).set({
      userId,
      email: userData.email,
      name: userData.name || userData.email?.split('@')[0] || 'User',
      photoURL: userData.photoURL || null,
      role,
      invitedBy: invitation.invitedByUid,
      joinedAt: now,
    });

    // Denormalized membership for fast queries
    await adminDb.doc(`users/${userId}/companyMemberships/${companyId}`).set({
      companyName,
      role,
      joinedAt: now,
    });

    // Mark invitation as accepted
    await invRef.update({ status: 'accepted', respondedAt: now });

    // Notify inviter
    await notifyUser({
      userId: invitation.invitedByUid,
      templateType: 'custom',
      templateData: {
        customSubject: `${userData.name || userData.email} joined ${companyName}`,
        customMessage: `${userData.name || userData.email} has accepted your invitation and joined "${companyName}" as ${role === 'admin' ? 'an' : 'a'} ${role}.`,
      },
      notification: {
        type: 'success',
        title: 'New Team Member',
        message: `${userData.name || userData.email} joined "${companyName}" as ${role}`,
        category: 'team',
        actionUrl: `/companies`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `You've joined ${companyName}`,
      companyId,
    });
  } catch (error: any) {
    console.error('[invitations/respond] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to respond to invitation' }, { status: 500 });
  }
}
