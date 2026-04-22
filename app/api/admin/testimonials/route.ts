import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();

export async function GET(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    const snap = await db.collection('testimonials').orderBy('order', 'asc').get();
    const testimonials = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    const { name, role, company, content, rating, imageUrl, featured, order } = await req.json();

    if (!name || !content) {
      return NextResponse.json({ error: 'name and content are required' }, { status: 400 });
    }

    const now = FieldValue.serverTimestamp();
    const ref = await db.collection('testimonials').add({
      name,
      role: role || '',
      company: company || '',
      content,
      rating: rating ?? 5,
      imageUrl: imageUrl || '',
      featured: !!featured,
      order: order ?? 0,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id: ref.id, message: 'Testimonial created' });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}
