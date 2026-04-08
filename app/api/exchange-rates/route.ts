// Exchange Rates API Route
// GET  ?companyId=X          → returns cached rates (refreshes if >24h old)
// POST { companyId, base }   → force-refresh from Frankfurter

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();
const adminDb = getFirestore();

const RATES_PATH = (companyId: string) =>
  `companies/${companyId}/settings/exchangeRates`;

const STALE_HOURS = 24;

// Currencies that Frankfurter supports (ECB-tracked)
const FRANKFURTER_SUPPORTED = new Set([
  'AUD','BGN','BRL','CAD','CHF','CNY','CZK','DKK','EUR','GBP',
  'HKD','HUF','IDR','ILS','INR','ISK','JPY','KRW','MXN','MYR',
  'NOK','NZD','PHP','PLN','RON','SEK','SGD','THB','TRY','USD','ZAR',
]);

// Currencies we approximate via a relay (not in ECB, but in exchangerate-api)
const RELAY_CURRENCIES = ['PKR','AED','SAR','QAR','KWD','BHD','OMR','EGP','NGN','KES','GHS','BDT','LKR','NPR'];

async function fetchFromFrankfurter(base: string): Promise<Record<string, number> | null> {
  try {
    // If base is not in Frankfurter, use USD as intermediate
    const fetchBase = FRANKFURTER_SUPPORTED.has(base) ? base : 'USD';
    const url = `https://api.frankfurter.app/latest?from=${fetchBase}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const data = await res.json();
    let rates: Record<string, number> = { ...data.rates };

    // Add base currency itself = 1
    rates[fetchBase] = 1;

    // If original base is not USD, we fetched from USD — convert all rates
    // e.g. base=PKR: rates currently are "1 USD = X currency"
    // We need "1 PKR = X currency" → divide by rates[PKR]
    if (fetchBase !== base && rates[base]) {
      const basePer1USD = rates[base]; // e.g. 277.5 PKR per 1 USD
      const converted: Record<string, number> = {};
      for (const [cur, val] of Object.entries(rates)) {
        // 1 PKR = val/basePer1USD currency
        converted[cur] = val / basePer1USD;
      }
      converted[base] = 1;
      return converted;
    }

    return rates;
  } catch {
    return null;
  }
}

async function fetchFromFallback(base: string): Promise<Record<string, number> | null> {
  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) return null;
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.result !== 'success') return null;
    return { ...data.conversion_rates, [base]: 1 };
  } catch {
    return null;
  }
}

async function buildRatesForBase(base: string): Promise<Record<string, number>> {
  // Try Frankfurter first
  let rates = await fetchFromFrankfurter(base);

  // Fall back to exchangerate-api if available
  if (!rates) {
    rates = await fetchFromFallback(base);
  }

  // If all else fails, return identity rates
  if (!rates) {
    const fallback: Record<string, number> = {};
    // Keep everything as 1 (no conversion) - user can override manually
    fallback[base] = 1;
    return fallback;
  }

  // For RELAY currencies not returned by Frankfurter, try to fetch via USD bridge
  if (FRANKFURTER_SUPPORTED.has(base) || base === 'USD') {
    const missing = RELAY_CURRENCIES.filter(c => c !== base && !rates![c]);
    if (missing.length > 0) {
      // Fetch USD rates to get relay currencies
      try {
        const usdRes = await fetch('https://api.frankfurter.app/latest?from=USD', { next: { revalidate: 0 } });
        if (usdRes.ok) {
          const usdData = await usdRes.json();
          const usdRates: Record<string, number> = { ...usdData.rates, USD: 1 };

          // Try secondary source for relay currencies
          const apiKey = process.env.EXCHANGE_RATE_API_KEY;
          if (apiKey) {
            const relayRes = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`, { next: { revalidate: 0 } });
            if (relayRes.ok) {
              const relayData = await relayRes.json();
              if (relayData.result === 'success') {
                const relayRates = relayData.conversion_rates;
                // rates[X] = "1 base = X units of currency"
                // relayRates[X] = "1 USD = X units of currency"
                // rates[USD] = "1 base = X USD"
                const baseToUSD = rates!['USD'] || 1; // 1 base = baseToUSD USD
                for (const relay of missing) {
                  if (relayRates[relay]) {
                    // 1 base = baseToUSD USD = baseToUSD * relayRates[relay] relay-currency
                    rates![relay] = baseToUSD * relayRates[relay];
                  }
                }
              }
            }
          }
        }
      } catch { /* ignore */ }
    }
  }

  return rates;
}

// ==========================================
// GET — return cached rates
// ==========================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });

  try {
    const snap = await adminDb.doc(RATES_PATH(companyId)).get();

    if (snap.exists) {
      const data = snap.data()!;
      const updatedAt: Timestamp = data.updatedAt;
      const ageHours = updatedAt
        ? (Date.now() - updatedAt.toMillis()) / (1000 * 60 * 60)
        : 999;

      // Return cached if fresh
      if (ageHours < STALE_HOURS) {
        return NextResponse.json({ ...data, cached: true });
      }
    }

    // Stale or missing — auto-refresh
    const companySnap = await adminDb.doc(`companies/${companyId}`).get();
    const base = (companySnap.data()?.currency as string) || 'USD';
    const rates = await buildRatesForBase(base);

    await adminDb.doc(RATES_PATH(companyId)).set({
      base,
      rates,
      updatedAt: Timestamp.now(),
      source: 'auto',
    });

    return NextResponse.json({ base, rates, updatedAt: new Date().toISOString(), source: 'auto', cached: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// POST — force refresh or save manual rates
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, base, manualRates } = body;

    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });

    if (manualRates) {
      // Save manual rate overrides
      const existing = (await adminDb.doc(RATES_PATH(companyId)).get()).data() || {};
      const merged = { ...(existing.rates || {}), ...manualRates };
      await adminDb.doc(RATES_PATH(companyId)).set({
        base: base || existing.base || 'USD',
        rates: merged,
        updatedAt: Timestamp.now(),
        source: 'manual',
      });
      return NextResponse.json({ base: base || existing.base, rates: merged, source: 'manual' });
    }

    // Force fetch from Frankfurter
    const fetchBase = base || (await adminDb.doc(`companies/${companyId}`).get()).data()?.currency || 'USD';
    const rates = await buildRatesForBase(fetchBase);

    await adminDb.doc(RATES_PATH(companyId)).set({
      base: fetchBase,
      rates,
      updatedAt: Timestamp.now(),
      source: 'auto',
    });

    return NextResponse.json({ base: fetchBase, rates, source: 'auto' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
