import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import fr from './fr';
import en from './en';
import type { AppLangue } from '@/src/preferences/runtime';

export const i18n = new I18n({ fr, en });
i18n.enableFallback = true;
i18n.defaultLocale = 'fr';

const deviceLang = Localization.getLocales()?.[0]?.languageCode;
i18n.locale = deviceLang === 'en' ? 'en' : 'fr';

export const setI18nLocale = (langue: AppLangue) => {
  i18n.locale = langue;
};

export const t = (key: string, options?: Record<string, unknown>) =>
  i18n.t(key, options);

export const getLocale = (): AppLangue =>
  (i18n.locale.startsWith('en') ? 'en' : 'fr');
