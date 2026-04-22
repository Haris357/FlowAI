import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';
import { DEFAULT_COMPONENT_GROUPS } from '@/lib/status-page';

initAdmin();
const db = getFirestore();

export async function GET(req: Request) {
  const auth = await verifyAdminRequest(req, 'status:view');
  if (!auth.authorized) return auth.response;

  const snap = await db.collection('statusComponents').orderBy('order', 'asc').get();
  const components = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ components });
}

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(req, 'status:manage');
  if (!auth.authorized) return auth.response;

  const body = await req.json();

  // Seed default components
  if (body.seed) {
    const batch = db.batch();
    let order = 1;
    for (const grp of DEFAULT_COMPONENT_GROUPS) {
      for (const comp of grp.components) {
        const ref = db.collection('statusComponents').doc();
        batch.set(ref, {
          name:        comp.name,
          description: comp.description,
          group:       grp.group,
          checkKey:    comp.checkKey,
          status:      'operational',
          order:       order++,
          createdAt:   FieldValue.serverTimestamp(),
          updatedAt:   FieldValue.serverTimestamp(),
        });
      }
    }
    await batch.commit();
    return NextResponse.json({ success: true, message: 'Default components seeded' });
  }

  // Create a single component
  const { name, description, group, status, order } = body;
  if (!name || !group) {
    return NextResponse.json({ error: 'name and group are required' }, { status: 400 });
  }

  const ref = await db.collection('statusComponents').add({
    name,
    description: description ?? '',
    group,
    status:    status ?? 'operational',
    order:     order ?? 99,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id });
}
