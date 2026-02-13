'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';

interface Company {
  id: string;
  name: string;
  businessType: string;
  country: string;
  currency: string;
  fiscalYearStart: number;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  ownerId: string;
  createdAt: any;
  updatedAt: any;
  invoicePrefix?: string;
  invoiceNextNumber?: number;
  invoiceDefaultTerms?: number;
  invoiceDefaultTaxRate?: number;
  invoiceNotes?: string;
  invoiceFooter?: string;
  billPrefix?: string;
  billNextNumber?: number;
  billDefaultTerms?: number;
  enableTax?: boolean;
  showDecimalPlaces?: number;
  dateFormat?: string;
  hasInventory?: boolean;
  hasEmployees?: boolean;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  date: any;
  createdAt: any;
}

interface CompanyContextType {
  company: Company | null;
  transactions: Transaction[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({} as CompanyContextType);

export const useCompany = () => useContext(CompanyContext);

export function CompanyProvider({
  children,
  urlCompanyId
}: {
  children: React.ReactNode;
  urlCompanyId?: string;
}) {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync URL-based company ID to localStorage
  useEffect(() => {
    if (urlCompanyId) {
      localStorage.setItem('selectedCompanyId', urlCompanyId);
    }
  }, [urlCompanyId]);

  const fetchCompanyData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Use URL company ID if provided, otherwise fall back to localStorage
      const selectedCompanyId = urlCompanyId || localStorage.getItem('selectedCompanyId');

      if (selectedCompanyId) {
        // Fetch the selected company
        const companyDocRef = doc(db, 'companies', selectedCompanyId);
        const companyDocSnap = await getDoc(companyDocRef);

        if (companyDocSnap.exists()) {
          const companyData = { id: companyDocSnap.id, ...companyDocSnap.data() } as Company;
          setCompany(companyData);

          // Fetch recent transactions
          const transactionsRef = collection(db, `companies/${selectedCompanyId}/transactions`);
          const transactionsQuery = query(
            transactionsRef,
            orderBy('createdAt', 'desc'),
            limit(10)
          );
          const transactionsSnapshot = await getDocs(transactionsQuery);
          const transactionsData = transactionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Transaction[];

          setTransactions(transactionsData);
        }
      } else {
        // No selected company, just set loading to false
        // User should be redirected to companies page
        setCompany(null);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchCompanyData();
  };

  useEffect(() => {
    fetchCompanyData();
  }, [user]);

  return (
    <CompanyContext.Provider value={{ 
      company, 
      transactions, 
      loading, 
      refreshData 
    }}>
      {children}
    </CompanyContext.Provider>
  );
}