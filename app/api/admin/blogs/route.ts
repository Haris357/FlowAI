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

    const snap = await db.collection('blogPosts').orderBy('updatedAt', 'desc').get();
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    const data = await req.json();
    const { title, slug, excerpt, content, coverImage, author, category, tags, published, featured, readTime } = data;

    if (!title || !slug) {
      return NextResponse.json({ error: 'title and slug are required' }, { status: 400 });
    }

    const now = FieldValue.serverTimestamp();
    const postData: Record<string, any> = {
      title,
      slug,
      excerpt: excerpt || '',
      content: content || '',
      coverImage: coverImage || '',
      author: author || { name: 'Admin', email: '', avatar: '' },
      category: category || 'News',
      tags: tags || [],
      published: !!published,
      featured: !!featured,
      views: 0,
      readTime: readTime || 1,
      publishedAt: published ? now : null,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await db.collection('blogPosts').add(postData);
    return NextResponse.json({ id: ref.id, message: 'Post created' });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
