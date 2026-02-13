import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  QueryConstraint,
  DocumentData,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UseCollectionOptions {
  constraints?: QueryConstraint[];
  enabled?: boolean;
}

interface UseDocumentOptions {
  enabled?: boolean;
}

// Hook for real-time collection subscription
export function useCollection<T = DocumentData>(
  path: string,
  options: UseCollectionOptions = {}
) {
  const { constraints = [], enabled = true } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !path) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const collectionRef = collection(db, path) as CollectionReference<T>;
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore collection error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path, enabled, JSON.stringify(constraints)]);

  return { data, loading, error };
}

// Hook for real-time document subscription
export function useDocument<T = DocumentData>(
  path: string,
  options: UseDocumentOptions = {}
) {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !path) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const docRef = doc(db, path) as DocumentReference<T>;

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({
            id: snapshot.id,
            ...snapshot.data(),
          } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore document error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path, enabled]);

  return { data, loading, error };
}

// Hook for company-specific collections
export function useCompanyCollection<T = DocumentData>(
  companyId: string | undefined,
  collectionName: string,
  options: UseCollectionOptions = {}
) {
  const path = companyId ? `companies/${companyId}/${collectionName}` : '';
  return useCollection<T>(path, { ...options, enabled: !!companyId && options.enabled !== false });
}

// Hook for company-specific documents
export function useCompanyDocument<T = DocumentData>(
  companyId: string | undefined,
  collectionName: string,
  documentId: string | undefined,
  options: UseDocumentOptions = {}
) {
  const path = companyId && documentId ? `companies/${companyId}/${collectionName}/${documentId}` : '';
  return useDocument<T>(path, { ...options, enabled: !!companyId && !!documentId && options.enabled !== false });
}
