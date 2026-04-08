// Currency Change API Route
// POST { companyId, oldCurrency, newCurrency }
// → fetches fresh rates for newCurrency, batch-updates all documents

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, WriteBatch } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();
const adminDb = getFirestore();

const BATCH_SIZE = 400; // Firestore limit is 500

/** Flush a batch and start a fresh one */
async function commitBatch(batch: WriteBatch): Promise<WriteBatch> {
  await batch.commit();
  return adminDb.batch();
}

/** Fetch rates with newCurrency as base from Frankfurter (+ fallback) */
async function fetchRates(base: string): Promise<Record<string, number> | null> {
  const FRANKFURTER = new Set([
    'AUD','BGN','BRL','CAD','CHF','CNY','CZK','DKK','EUR','GBP',
    'HKD','HUF','IDR','ILS','INR','ISK','JPY','KRW','MXN','MYR',
    'NOK','NZD','PHP','PLN','RON','SEK','SGD','THB','TRY','USD','ZAR',
  ]);

  try {
    const fetchBase = FRANKFURTER.has(base) ? base : 'USD';
    const res = await fetch(`https://api.frankfurter.app/latest?from=${fetchBase}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Frankfurter failed');
    const data = await res.json();
    let rates: Record<string, number> = { ...data.rates, [fetchBase]: 1 };

    // If base isn't directly supported, cross-divide via USD
    if (fetchBase !== base && rates[base]) {
      const basePer1USD = rates[base];
      const converted: Record<string, number> = {};
      for (const [cur, val] of Object.entries(rates)) {
        converted[cur] = (val as number) / basePer1USD;
      }
      converted[base] = 1;
      return converted;
    }

    // Augment with relay currencies via exchangerate-api if key available
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (apiKey) {
      try {
        const relayRes = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`, { cache: 'no-store' });
        if (relayRes.ok) {
          const rd = await relayRes.json();
          if (rd.result === 'success') {
            for (const [cur, val] of Object.entries(rd.conversion_rates as Record<string, number>)) {
              if (!rates[cur]) rates[cur] = val;
            }
          }
        }
      } catch { /* ignore */ }
    }

    return rates;
  } catch {
    // Try full fallback
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) return null;
    try {
      const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.result !== 'success') return null;
      return { ...data.conversion_rates, [base]: 1 };
    } catch {
      return null;
    }
  }
}

/** Update a collection: set exchangeRate + totalInBaseCurrency on every doc */
async function updateCollection(
  collPath: string,
  rates: Record<string, number>,
  newCurrency: string,
  oldCurrency: string,
  totalField: string = 'total',
): Promise<number> {
  const snap = await adminDb.collection(collPath).get();
  if (snap.empty) return 0;

  let batch = adminDb.batch();
  let ops = 0;
  let count = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const docCurrency: string = data.currency || oldCurrency;
    const total: number = data[totalField] || 0;

    let exchangeRate: number;
    if (docCurrency === newCurrency) {
      exchangeRate = 1;
    } else {
      exchangeRate = rates[docCurrency] ?? 1;
    }

    const totalInBaseCurrency = total * exchangeRate;

    batch.update(docSnap.ref, {
      currency: docCurrency,
      exchangeRate,
      totalInBaseCurrency,
      updatedAt: Timestamp.now(),
    });
    ops++;
    count++;

    if (ops >= BATCH_SIZE) {
      batch = await commitBatch(batch);
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
  return count;
}

export async function POST(request: NextRequest) {
  try {
    const { companyId, oldCurrency, newCurrency } = await request.json();

    if (!companyId || !newCurrency) {
      return NextResponse.json({ error: 'companyId and newCurrency are required' }, { status: 400 });
    }

    const effectiveOldCurrency = oldCurrency || 'USD';

    // Fetch fresh rates for new base currency
    const rates = await fetchRates(newCurrency);
    if (!rates) {
      return NextResponse.json({ error: 'Could not fetch exchange rates' }, { status: 502 });
    }

    // Store new rates in Firestore
    await adminDb.doc(`companies/${companyId}/settings/exchangeRates`).set({
      base: newCurrency,
      rates,
      updatedAt: Timestamp.now(),
      source: 'auto',
    });

    // Batch-update all document collections
    const base = `companies/${companyId}`;
    const [invoices, bills, quotes, pos] = await Promise.all([
      updateCollection(`${base}/invoices`, rates, newCurrency, effectiveOldCurrency),
      updateCollection(`${base}/bills`, rates, newCurrency, effectiveOldCurrency),
      updateCollection(`${base}/quotes`, rates, newCurrency, effectiveOldCurrency),
      updateCollection(`${base}/purchaseOrders`, rates, newCurrency, effectiveOldCurrency),
    ]);

    // Update company currency
    await adminDb.doc(`companies/${companyId}`).update({
      currency: newCurrency,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      newCurrency,
      rates,
      updated: { invoices, bills, quotes, purchaseOrders: pos },
    });
  } catch (error: any) {
    console.error('Currency change error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
