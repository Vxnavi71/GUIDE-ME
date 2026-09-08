import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ApiService } from '../services/api';

export interface ConsentState {
  camera_consent: boolean;
  typing_dynamics_consent: boolean;
  memory_consent: boolean;
  facial_analysis_consent: boolean;
}

interface ConsentContextType {
  consent: ConsentState;
  updateConsent: (key: keyof ConsentState, value: boolean) => Promise<void>;
  isConsentLoaded: boolean;
}

const defaultConsent: ConsentState = {
  camera_consent: false,
  typing_dynamics_consent: false,
  memory_consent: false,
  facial_analysis_consent: false,
};

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export const useConsent = (): ConsentContextType => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
};

interface ConsentProviderProps {
  children: ReactNode;
}

export const ConsentProvider: React.FC<ConsentProviderProps> = ({ children }) => {
  const [consent, setConsent] = useState<ConsentState>(defaultConsent);
  const [isConsentLoaded, setIsConsentLoaded] = useState<boolean>(false);

  useEffect(() => {
    const fetchConsent = async () => {
      const token = localStorage.getItem('guideme_token');
      if (!token) {
        setIsConsentLoaded(true);
        return;
      }
      try {
        const data = await ApiService.getConsent();
        if (data) {
          setConsent({
            camera_consent: !!data.camera_consent,
            typing_dynamics_consent: !!data.typing_dynamics_consent,
            memory_consent: !!data.memory_consent,
            facial_analysis_consent: !!data.facial_analysis_consent,
          });
        }
      } catch (error) {
        console.error('Failed to fetch consent settings', error);
      } finally {
        setIsConsentLoaded(true);
      }
    };

    fetchConsent();
  }, []);

  const updateConsent = useCallback(
    async (key: keyof ConsentState, value: boolean) => {
      try {
        const updatedConsent = { ...consent, [key]: value };
        setConsent(updatedConsent);
        await ApiService.updateConsent(updatedConsent);
      } catch (error) {
        console.error(`Failed to update consent for ${key}`, error);
        // Revert on error
        setConsent(consent);
        throw error;
      }
    },
    [consent]
  );

  return (
    <ConsentContext.Provider value={{ consent, updateConsent, isConsentLoaded }}>
      {children}
    </ConsentContext.Provider>
  );
};
