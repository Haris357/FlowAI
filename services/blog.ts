import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  increment,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { adminFetch } from '@/lib/admin-fetch';
import type { BlogPost } from '@/types/blog';

const COLLECTION = 'blogPosts';

// ==========================================
// PUBLIC — client SDK (rules: allow read: if true)
// ==========================================

/** Get all published blog posts ordered by publishedAt desc */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  try {
    const ref = collection(db, COLLECTION);
    const q = query(
      ref,
      where('published', '==', true),
      orderBy('publishedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BlogPost);
  } catch (error) {
    console.error('Error fetching published posts:', error);
    return [];
  }
}

/** Get a single post by its slug */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const ref = collection(db, COLLECTION);
    const q = query(ref, where('slug', '==', slug));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as BlogPost;
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return null;
  }
}

/** Increment view count for a post (public, silently fails if blocked) */
export async function incrementViews(id: string): Promise<void> {
  try {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, { views: increment(1) });
  } catch {
    // Silently ignore — rules block client writes; counts are best-effort
  }
}

// ==========================================
// ADMIN reads — client SDK (rules: allow read: if true)
// ==========================================

/** Get all posts (published + drafts) ordered by updatedAt desc */
export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const ref = collection(db, COLLECTION);
    const q = query(ref, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BlogPost);
  } catch (error) {
    console.error('Error fetching all posts:', error);
    return [];
  }
}

/** Get a single post by its Firestore document id */
export async function getPostById(id: string): Promise<BlogPost | null> {
  try {
    const ref = doc(db, COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as BlogPost;
  } catch (error) {
    console.error('Error fetching post by id:', error);
    return null;
  }
}

// ==========================================
// ADMIN writes — server API (rules: allow write: if false on client)
// ==========================================

/** Create a new blog post and return its id */
export async function createPost(
  data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'views'>
): Promise<string> {
  // Strip publishedAt — the API sets it server-side based on the published flag
  const { publishedAt, ...payload } = data as any;
  const res = await adminFetch('/api/admin/blogs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create post');
  }
  const json = await res.json();
  return json.id;
}

/** Update an existing blog post */
export async function updatePost(
  id: string,
  data: Partial<Omit<BlogPost, 'id' | 'createdAt'>>
): Promise<void> {
  // publishedAt from serverTimestamp() cannot be JSON-serialised.
  // Strip it and send a clearPublishedAt flag when explicitly nulled.
  // The API derives publishedAt transitions from the published field change.
  const { publishedAt, ...rest } = data as any;
  const payload: Record<string, any> = { ...rest };
  if (publishedAt === null) {
    payload.clearPublishedAt = true;
  }
  const res = await adminFetch(`/api/admin/blogs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update post');
  }
}

/** Delete a blog post */
export async function deletePost(id: string): Promise<void> {
  const res = await adminFetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete post');
  }
}
