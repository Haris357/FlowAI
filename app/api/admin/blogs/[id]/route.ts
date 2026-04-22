import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();
const db = getFirestore();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAdminRequest(req, 'blogs:view');
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const snap = await db.collection('blogPosts').doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json({ post: { id: snap.id, ...snap.data() } });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAdminRequest(req, 'blogs:edit');
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const { clearPublishedAt, ...fields } = await req.json();

    // Fetch current state to determine publishedAt transitions
    const existing = await db.collection('blogPosts').doc(id).get();
    const wasPublished = existing.exists ? !!existing.data()?.published : false;
    const isNowPublished = 'published' in fields ? !!fields.published : wasPublished;

    const updateData: Record<string, any> = { ...fields, updatedAt: FieldValue.serverTimestamp() };

    if (isNowPublished && !wasPublished) {
      updateData.publishedAt = FieldValue.serverTimestamp();
    } else if (!isNowPublished && wasPublished) {
      updateData.publishedAt = null;
    }

    if (clearPublishedAt) {
      updateData.publishedAt = null;
    }

    await db.collection('blogPosts').doc(id).update(updateData);
    return NextResponse.json({ message: 'Post updated' });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAdminRequest(req, 'blogs:delete');
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    await db.collection('blogPosts').doc(id).delete();
    return NextResponse.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
