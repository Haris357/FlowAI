import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Testimonial, TestimonialInput } from '@/types/testimonial';

const COLLECTION = 'testimonials';

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

export async function addTestimonial(data: TestimonialInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTestimonial(id: string, data: Partial<TestimonialInput>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTestimonial(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
