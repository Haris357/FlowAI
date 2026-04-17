'use client';
import { createContext, useContext, useState, useCallback } from 'react';

type SettingsSection =
  | 'profile' | 'preferences' | 'notifications' | 'security'
  | 'billing'
  | 'docs' | 'tutorials' | 'support' | 'feedback';

interface SettingsModalContextType {
  isOpen: boolean;
  section: SettingsSection;
  openSettings: (section?: SettingsSection) => void;
  closeSettings: () => void;
  subscriptionSuccess: boolean;
  showSubscriptionSuccess: () => void;
  dismissSubscriptionSuccess: () => void;
}

const SettingsModalContext = createContext<SettingsModalContextType>({
  isOpen: false,
  section: 'profile',
  openSettings: () => {},
  closeSettings: () => {},
  subscriptionSuccess: false,
  showSubscriptionSuccess: () => {},
  dismissSubscriptionSuccess: () => {},
});

export function SettingsModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [section, setSection] = useState<SettingsSection>('profile');
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);

  const openSettings = useCallback((s: SettingsSection = 'profile') => {
    setSection(s);
    setIsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsOpen(false);
  }, []);

  const showSubscriptionSuccess = useCallback(() => {
    setSubscriptionSuccess(true);
  }, []);

  const dismissSubscriptionSuccess = useCallback(() => {
    setSubscriptionSuccess(false);
  }, []);

  return (
    <SettingsModalContext.Provider value={{
      isOpen, section, openSettings, closeSettings,
      subscriptionSuccess, showSubscriptionSuccess, dismissSubscriptionSuccess,
    }}>
      {children}
    </SettingsModalContext.Provider>
  );
}

export function useSettingsModal() {
  return useContext(SettingsModalContext);
}
