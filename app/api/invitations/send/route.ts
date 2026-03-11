import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { notifyUser } from '@/lib/notify';

initAdmin();
const adminDb = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const { companyId, invitedEmail, role, invitedByUid } = await request.json();

    if (!companyId || !invitedEmail || !role || !invitedByUid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const email = invitedEmail.trim().toLowerCase();

    // Get company
    const companySnap = await adminDb.doc(`companies/${companyId}`).get();
    if (!companySnap.exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = companySnap.data()!;

    // Verify inviter is owner or admin
    const inviterMemberSnap = await adminDb.doc(`companies/${companyId}/members/${invitedByUid}`).get();
    if (!inviterMemberSnap.exists) {
      // Fallback: check if inviter is the owner
      if (company.ownerId !== invitedByUid) {
        return NextResponse.json({ error: 'Not authorized to invite' }, { status: 403 });
      }
    } else {
      const inviterRole = inviterMemberSnap.data()?.role;
      if (inviterRole !== 'owner' && inviterRole !== 'admin') {
        return NextResponse.json({ error: 'Not authorized to invite' }, { status: 403 });
      }
    }

    // Check if user is already a member
    const membersSnap = await adminDb.collection(`companies/${companyId}/members`)
      .where('email', '==', email).get();
    if (!membersSnap.empty) {
      return NextResponse.json({ error: 'User is already a member of this company' }, { status: 400 });
    }

    // Check for existing pending invitation
    const existingInvites = await adminDb.collection('invitations')
      .where('companyId', '==', companyId)
      .where('invitedEmail', '==', email)
      .where('status', '==', 'pending')
      .get();
    if (!existingInvites.empty) {
      return NextResponse.json({ error: 'An invitation is already pending for this email' }, { status: 400 });
    }

    // Get inviter info
    const inviterSnap = await adminDb.doc(`users/${invitedByUid}`).get();
    const inviterData = inviterSnap.exists ? inviterSnap.data()! : {};
    const inviterName = inviterData.name || inviterData.email?.split('@')[0] || 'A team member';
    const inviterEmail = inviterData.email || '';

    // Create the invitation (expires in 7 days)
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000);

    const invitationRef = await adminDb.collection('invitations').add({
      companyId,
      companyName: company.name,
      role,
      invitedEmail: email,
      invitedByUid,
      invitedByName: inviterName,
      invitedByEmail: inviterEmail,
      status: 'pending',
      createdAt: now,
      expiresAt,
    });

    // Notify the invited user (if they have an account)
    const invitedUserSnap = await adminDb.collection('users')
      .where('email', '==', email).limit(1).get();

    if (!invitedUserSnap.empty) {
      const invitedUserId = invitedUserSnap.docs[0].id;
      await notifyUser({
        userId: invitedUserId,
        templateType: 'custom',
        templateData: {
          customSubject: `You're invited to join ${company.name}`,
          customMessage: `${inviterName} has invited you to join "${company.name}" as ${role === 'admin' ? 'an' : 'a'} ${role}. Open Flowbooks to accept or decline the invitation.`,
        },
        notification: {
          type: 'action',
          title: 'Team Invitation',
          message: `${inviterName} invited you to join "${company.name}" as ${role}`,
          category: 'team',
          actionUrl: '/companies',
        },
      });
    }

    return NextResponse.json({
      success: true,
      invitationId: invitationRef.id,
      message: `Invitation sent to ${email}`,
    });
  } catch (error: any) {
    console.error('[invitations/send] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send invitation' }, { status: 500 });
  }
}
