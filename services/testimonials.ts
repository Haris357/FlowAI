import {
  collection, doc, getDocs,
  query, orderBy, where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { adminFetch } from '@/lib/admin-fetch';
import type { Testimonial, TestimonialInput } from '@/types/testimonial';

const COLLECTION = 'testimonials';

// ==========================================
// PUBLIC reads — client SDK (rules: allow read: if true)
// ==========================================

export async function getTestimonials(): Promise<Testimonial[]> {
  const q = query(collection(db, COLLECTION), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Testimonial));
}

export async function getFeaturedTestimonials(): Promise<Testimonial[]> {
  const q = query(
    collection(db, COLLECTION),
    where('featured', '==', true),
    orderBy('order', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Testimonial));
}

// ==========================================
// ADMIN writes — server API (rules: allow write: if false on client)
// ==========================================

export async function addTestimonial(data: TestimonialInput): Promise<string> {
  const res = await adminFetch('/api/admin/testimonials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create testimonial');
  }
  const json = await res.json();
  return json.id;
}

export async function updateTestimonial(id: string, data: Partial<TestimonialInput>): Promise<void> {
  const res = await adminFetch(`/api/admin/testimonials/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update testimonial');
  }
}

export async function deleteTestimonial(id: string): Promise<void> {
  const res = await adminFetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete testimonial');
  }
}
