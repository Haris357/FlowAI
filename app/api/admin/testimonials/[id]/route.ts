import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAdminRequest(req, 'testimonials:manage');
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const data = await req.json();

    await db.collection('testimonials').doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ message: 'Testimonial updated' });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAdminRequest(req, 'testimonials:manage');
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    await db.collection('testimonials').doc(id).delete();
    return NextResponse.json({ message: 'Testimonial deleted' });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 });
  }
}
