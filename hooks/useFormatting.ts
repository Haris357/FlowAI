import { useCallback, useMemo } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { format as dateFnsFormat, parseISO } from 'date-fns';

/**
 * Hook that provides formatting functions based on company preferences
 */
export function useFormatting() {
  const { company } = useCompany();

  // Get company preferences with defaults
  const currency = company?.currency || 'USD';
  const dateFormatPattern = company?.dateFormat || 'MM/dd/yyyy';
  const decimalPlaces = company?.showDecimalPlaces ?? 2;
  const enableTax = company?.enableTax ?? true;

  // Map date format patterns to date-fns format strings
  const getDateFnsFormat = useCallback((pattern: string) => {
    switch (pattern) {
      case 'dd/MM/yyyy':
        return 'dd/MM/yyyy';
      case 'yyyy-MM-dd':
        return 'yyyy-MM-dd';
      case 'dd MMM yyyy':
        return 'dd MMM yyyy';
      case 'MM/dd/yyyy':
      default:
        return 'MM/dd/yyyy';
    }
  }, []);

  // Format currency based on company settings
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(amount);
  }, [currency, decimalPlaces]);

  // Format number with decimal places
  const formatNumber = useCallback((value: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(value);
  }, [decimalPlaces]);

  // Format date based on company settings
  // Accepts Date, string, number, Firestore Timestamp, or null/undefined
  const formatDate = useCallback((date: Date | string | number | { toDate: () => Date } | null | undefined): string => {
    if (!date) return '-';

    try {
      let dateObj: Date;

      if (typeof date === 'string') {
        // Try to parse as ISO string
        dateObj = parseISO(date);
      } else if (typeof date === 'number') {
        dateObj = new Date(date);
      } else if (date instanceof Date) {
        dateObj = date;
      } else if ((date as any)?.toDate) {
        // Handle Firestore Timestamp
        dateObj = (date as any).toDate();
      } else {
        return '-';
      }

      if (isNaN(dateObj.getTime())) {
        return '-';
      }

      return dateFnsFormat(dateObj, getDateFnsFormat(dateFormatPattern));
    } catch {
      return '-';
    }
  }, [dateFormatPattern, getDateFnsFormat]);

  // Format percentage
  const formatPercentage = useCallback((value: number): string => {
    return `${value.toFixed(decimalPlaces)}%`;
  }, [decimalPlaces]);

  // Parse currency input (remove formatting)
  const parseCurrency = useCallback((value: string): number => {
    // Remove all non-numeric characters except decimal point and minus
    const cleaned = value.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  }, []);

  // Get currency symbol
  const currencySymbol = useMemo(() => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      PKR: 'Rs',
      AED: 'د.إ',
      SAR: '﷼',
      AUD: 'A$',
      CAD: 'C$',
      SGD: 'S$',
      MYR: 'RM',
      JPY: '¥',
      CNY: '¥',
    };
    return currencySymbols[currency] || '$';
  }, [currency]);

  return {
    formatCurrency,
    formatNumber,
    formatDate,
    formatPercentage,
    parseCurrency,
    currencySymbol,
    currency,
    dateFormat: dateFormatPattern,
    decimalPlaces,
    enableTax,
  };
}
