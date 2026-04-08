// Exchange Rate Service
// Uses Frankfurter (api.frankfurter.app) - free, no API key needed, ECB rates
// Falls back to exchangerate-api.com if EXCHANGE_RATE_API_KEY is set in env

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// ==========================================
// SUPPORTED CURRENCIES
// ==========================================

export const SUPPORTED_CURRENCIES: Record<string, { name: string; symbol: string }> = {
  USD: { name: 'US Dollar',          symbol: '$'    },
  EUR: { name: 'Euro',               symbol: '€'    },
  GBP: { name: 'British Pound',      symbol: '£'    },
  PKR: { name: 'Pakistani Rupee',    symbol: 'Rs'   },
  INR: { name: 'Indian Rupee',       symbol: '₹'    },
  AED: { name: 'UAE Dirham',         symbol: 'د.إ'  },
  SAR: { name: 'Saudi Riyal',        symbol: '﷼'    },
  AUD: { name: 'Australian Dollar',  symbol: 'A$'   },
  CAD: { name: 'Canadian Dollar',    symbol: 'C$'   },
  SGD: { name: 'Singapore Dollar',   symbol: 'S$'   },
  MYR: { name: 'Malaysian Ringgit',  symbol: 'RM'   },
  JPY: { name: 'Japanese Yen',       symbol: '¥'    },
  CNY: { name: 'Chinese Yuan',       symbol: '¥'    },
  CHF: { name: 'Swiss Franc',        symbol: 'Fr'   },
  SEK: { name: 'Swedish Krona',      symbol: 'kr'   },
  NOK: { name: 'Norwegian Krone',    symbol: 'kr'   },
  DKK: { name: 'Danish Krone',       symbol: 'kr'   },
  BDT: { name: 'Bangladeshi Taka',   symbol: '৳'    },
  LKR: { name: 'Sri Lankan Rupee',   symbol: 'Rs'   },
  NPR: { name: 'Nepalese Rupee',     symbol: 'Rs'   },
  QAR: { name: 'Qatari Riyal',       symbol: 'QR'   },
  KWD: { name: 'Kuwaiti Dinar',      symbol: 'KD'   },
  BHD: { name: 'Bahraini Dinar',     symbol: 'BD'   },
  OMR: { name: 'Omani Rial',         symbol: 'ر.ع.' },
  EGP: { name: 'Egyptian Pound',     symbol: 'E£'   },
  ZAR: { name: 'South African Rand', symbol: 'R'    },
  NGN: { name: 'Nigerian Naira',     symbol: '₦'    },
  KES: { name: 'Kenyan Shilling',    symbol: 'KSh'  },
  GHS: { name: 'Ghanaian Cedi',      symbol: '₵'    },
  MXN: { name: 'Mexican Peso',       symbol: '$'    },
  BRL: { name: 'Brazilian Real',     symbol: 'R$'   },
};

export const CURRENCY_CODES = Object.keys(SUPPORTED_CURRENCIES);

// ==========================================
// TYPES
// ==========================================

export interface ExchangeRateStore {
  base: string;
  rates: Record<string, number>; // rates[foreignCurrency] = how many base-currency units per 1 foreign
  updatedAt: any;
  source: 'auto' | 'manual';
}

// ==========================================
// FIRESTORE PATH
// ==========================================

const ratesDocPath = (companyId: string) =>
  `companies/${companyId}/settings/exchangeRates`;

// ==========================================
// GET CACHED RATES (client-side)
// ==========================================

export async function getExchangeRates(companyId: string): Promise<ExchangeRateStore | null> {
  try {
    const snap = await getDoc(doc(db, ratesDocPath(companyId)));
    if (!snap.exists()) return null;
    return snap.data() as ExchangeRateStore;
  } catch {
    return null;
  }
}

// ==========================================
// RATE UTILITIES
// ==========================================

/**
 * Get exchange rate: how many base-currency units is 1 unit of foreignCurrency worth?
 * e.g. base=PKR, foreign=USD → rate≈277.5 (1 USD = 277.5 PKR)
 */
export function getRate(
  foreignCurrency: string,
  baseCurrency: string,
  rates: Record<string, number>
): number {
  if (foreignCurrency === baseCurrency) return 1;
  // rates[foreign] = how many base per 1 foreign
  return rates[foreignCurrency] ?? 1;
}

/**
 * Convert amount from one currency to another
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  // rates stores: 1 foreignCurrency = X baseCurrency
  // To go from => to:
  //   amount (from) → base → to
  const toBase = rates[fromCurrency] ?? 1;    // 1 from = toBase base
  const toTarget = rates[toCurrency] ?? 1;    // 1 to = toTarget base
  return (amount * toBase) / toTarget;
}

/**
 * Format amount with currency symbol
 */
export function formatWithCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const info = SUPPORTED_CURRENCIES[currency];
    return `${info?.symbol || currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  return SUPPORTED_CURRENCIES[currency]?.symbol || currency;
}

// ==========================================
// SAVE RATES (client-side, from API response)
// ==========================================

export async function saveExchangeRates(
  companyId: string,
  base: string,
  rates: Record<string, number>,
  source: 'auto' | 'manual' = 'auto'
): Promise<void> {
  await setDoc(doc(db, ratesDocPath(companyId)), {
    base,
    rates,
    updatedAt: serverTimestamp(),
    source,
  });
}
