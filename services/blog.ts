import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  increment,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BlogPost } from '@/types/blog';

const COLLECTION = 'blogPosts';

// ==========================================
// PUBLIC
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

/** Increment view count for a post */
export async function incrementViews(id: string): Promise<void> {
  try {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, { views: increment(1) });
  } catch (error) {
    console.error('Error incrementing views:', error);
  }
}

// ==========================================
// ADMIN
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

/** Create a new blog post and return its id */
export async function createPost(
  data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'views'>
): Promise<string> {
  const ref = doc(collection(db, COLLECTION));
  const now = serverTimestamp();
  await setDoc(ref, {
    ...data,
    views: 0,
    publishedAt: data.published ? (data.publishedAt ?? now) : null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

/** Update an existing blog post */
export async function updatePost(
  id: string,
  data: Partial<Omit<BlogPost, 'id' | 'createdAt'>>
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/** Delete a blog post */
export async function deletePost(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}
