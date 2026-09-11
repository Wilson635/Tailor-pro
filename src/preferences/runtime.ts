import type { DeviseCode } from '@constants/currencies';
import { DEFAULT_DEVISE } from '@constants/currencies';

export type AppLangue = 'fr' | 'en';
export type UniteMesure = 'cm' | 'pouces';

export type RuntimePrefs = {
  locale: AppLangue;
  currency: DeviseCode;
  unit: UniteMesure;
};

let prefs: RuntimePrefs = {
  locale: 'fr',
  currency: DEFAULT_DEVISE,
  unit: 'cm',
};

const listeners = new Set<() => void>();

export const getRuntimePrefs = (): RuntimePrefs => prefs;

export const setRuntimePrefs = (next: Partial<RuntimePrefs>) => {
  prefs = { ...prefs, ...next };
  listeners.forEach(fn => fn());
};

export const subscribeRuntimePrefs = (fn: () => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};
