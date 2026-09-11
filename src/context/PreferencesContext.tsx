import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Appearance, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '@/src/theme';
import type { ResolvedTheme, ThemeScheme } from '@/src/theme';
import { setI18nLocale } from '@/src/i18n';
import { setRuntimePrefs, type AppLangue, type UniteMesure } from '@/src/preferences/runtime';
import { DEFAULT_DEVISE, type DeviseCode } from '@constants/currencies';
import { useAppStore, type UserProfile } from '@store/useAppStore';

const THEME_KEY = '@tailorpro_theme_scheme';

type PreferencesContextValue = {
  langue: AppLangue;
  devise: DeviseCode;
  uniteMesure: UniteMesure;
  setLangue: (langue: AppLangue) => Promise<void>;
  setDevise: (devise: DeviseCode) => Promise<void>;
  setUniteMesure: (unite: UniteMesure) => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const resolveTheme = (scheme: ThemeScheme): ResolvedTheme => {
  if (scheme === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return scheme;
};

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const profile = useAppStore(s => s.profile);
  const [scheme, setSchemeState] = useState<ThemeScheme>('light');
  const [resolved, setResolved] = useState<ResolvedTheme>('light');
  const [langue, setLangueState] = useState<AppLangue>('fr');
  const [devise, setDeviseState] = useState<DeviseCode>(DEFAULT_DEVISE);
  const [uniteMesure, setUniteState] = useState<UniteMesure>('cm');

  const applyLocale = (next: AppLangue) => {
    setLangueState(next);
    setI18nLocale(next);
    setRuntimePrefs({ locale: next });
  };

  const applyDevise = (next: DeviseCode) => {
    setDeviseState(next);
    setRuntimePrefs({ currency: next });
  };

  const applyUnite = (next: UniteMesure) => {
    setUniteState(next);
    setRuntimePrefs({ unit: next });
  };

  const setScheme = useCallback(async (next: ThemeScheme) => {
    setSchemeState(next);
    setResolved(resolveTheme(next));
    await AsyncStorage.setItem(THEME_KEY, next);
  }, []);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setSchemeState(stored);
        setResolved(resolveTheme(stored));
      }
    })();
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      setResolved(current => {
        // re-read scheme via closure — use functional by storing scheme in ref
        return resolveTheme(scheme);
      });
    });
    const appSub = AppState.addEventListener('change', () => {
      setResolved(resolveTheme(scheme));
    });
    return () => {
      sub.remove();
      appSub.remove();
    };
  }, [scheme]);

  useEffect(() => {
    if (!profile) return;
    const nextLangue: AppLangue = profile.langue === 'en' ? 'en' : 'fr';
    const nextDevise = (profile.devise as DeviseCode) || DEFAULT_DEVISE;
    const nextUnite: UniteMesure = profile.unite_mesure === 'pouces' ? 'pouces' : 'cm';
    applyLocale(nextLangue);
    applyDevise(nextDevise);
    applyUnite(nextUnite);
  }, [profile?.id, profile?.langue, profile?.devise, profile?.unite_mesure]);

  const persistProfile = async (updates: Partial<UserProfile>) => {
    try {
      await useAppStore.getState().updateProfile(updates);
    } catch {
      // persist best-effort
    }
  };

  const setLangue = async (next: AppLangue) => {
    applyLocale(next);
    await persistProfile({ langue: next });
  };

  const setDevise = async (next: DeviseCode) => {
    applyDevise(next);
    await persistProfile({ devise: next });
  };

  const setUniteMesure = async (next: UniteMesure) => {
    applyUnite(next);
    await persistProfile({ unite_mesure: next });
  };

  return (
    <PreferencesContext.Provider
      value={{ langue, devise, uniteMesure, setLangue, setDevise, setUniteMesure }}
    >
      <ThemeProvider scheme={scheme} resolved={resolved} setScheme={setScheme}>
        {children}
      </ThemeProvider>
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesContextValue => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return ctx;
};
