'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useParams } from 'next/navigation';
import {
  getBusinessProfile,
  saveBusinessProfile,
  getSavedTemplates,
  addSavedTemplate,
  updateSavedTemplate,
  deleteSavedTemplate,
  seedDefaultTemplates,
} from '@/services/businessProfile';
import {
  BusinessProfile,
  DEFAULT_BUSINESS_PROFILE,
  SavedTemplate,
  TemplateFolder,
} from '@/types/businessProfile';

interface BusinessProfileContextType {
  profile: BusinessProfile;
  templates: SavedTemplate[];
  isLoading: boolean;
  isSaving: boolean;
  updateProfile: (updates: Partial<BusinessProfile>) => Promise<void>;
  addTemplate: (template: Omit<SavedTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  editTemplate: (id: string, updates: Partial<Omit<SavedTemplate, 'id' | 'createdAt'>>) => Promise<void>;
  removeTemplate: (id: string) => Promise<void>;
}

const BusinessProfileContext = createContext<BusinessProfileContextType>({
  profile: DEFAULT_BUSINESS_PROFILE,
  templates: [],
  isLoading: true,
  isSaving: false,
  updateProfile: async () => {},
  addTemplate: async () => '',
  editTemplate: async () => {},
  removeTemplate: async () => {},
});

export function BusinessProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const params = useParams();
  const companyId = (params?.companyId as string) || '';

  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_BUSINESS_PROFILE);
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!user || !companyId) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const [prof, tmpl] = await Promise.all([
          getBusinessProfile(companyId, user.uid),
          getSavedTemplates(companyId, user.uid),
        ]);
        if (cancelled) return;
        setProfile(prof);

        // Seed default templates once if none exist
        if (tmpl.length === 0 && !seededRef.current) {
          seededRef.current = true;
          await seedDefaultTemplates(companyId, user.uid);
          const seeded = await getSavedTemplates(companyId, user.uid);
          if (!cancelled) setTemplates(seeded);
        } else {
          setTemplates(tmpl);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, companyId]);

  const updateProfile = useCallback(async (updates: Partial<BusinessProfile>) => {
    if (!user || !companyId) return;
    setIsSaving(true);
    try {
      const merged = { ...profile, ...updates };
      setProfile(merged);
      await saveBusinessProfile(companyId, user.uid, updates);
    } finally {
      setIsSaving(false);
    }
  }, [user, companyId, profile]);

  const addTemplate = useCallback(async (
    template: Omit<SavedTemplate, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> => {
    if (!user || !companyId) return '';
    const id = await addSavedTemplate(companyId, user.uid, template);
    const now = { toDate: () => new Date() } as any;
    setTemplates(prev => [...prev, { id, ...template, createdAt: now, updatedAt: now }]);
    return id;
  }, [user, companyId]);

  const editTemplate = useCallback(async (
    id: string,
    updates: Partial<Omit<SavedTemplate, 'id' | 'createdAt'>>,
  ) => {
    if (!user || !companyId) return;
    await updateSavedTemplate(companyId, user.uid, id, updates);
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, [user, companyId]);

  const removeTemplate = useCallback(async (id: string) => {
    if (!user || !companyId) return;
    await deleteSavedTemplate(companyId, user.uid, id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, [user, companyId]);

  return (
    <BusinessProfileContext.Provider value={{
      profile, templates, isLoading, isSaving,
      updateProfile, addTemplate, editTemplate, removeTemplate,
    }}>
      {children}
    </BusinessProfileContext.Provider>
  );
}

export function useBusinessProfile() {
  return useContext(BusinessProfileContext);
}
