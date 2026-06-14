// src/i18n/index.js
// Implemented (have a dictionary): es, en, pi. The rest are registered so the
// selector lists them; their dictionaries are added later (each falls back to es).
export const LANGUAGES = [
  { code: 'es', native: 'Espanol', dir: 'ltr' },
  { code: 'en', native: 'English', dir: 'ltr' },
  { code: 'fr', native: 'Francais', dir: 'ltr' },
  { code: 'de', native: 'Deutsch', dir: 'ltr' },
  { code: 'it', native: 'Italiano', dir: 'ltr' },
  { code: 'pt', native: 'Portugues', dir: 'ltr' },
  { code: 'nl', native: 'Nederlands', dir: 'ltr' },
  { code: 'pl', native: 'Polski', dir: 'ltr' },
  { code: 'el', native: 'Ellinika', dir: 'ltr' },
  { code: 'ru', native: 'Russkiy', dir: 'ltr' },
  { code: 'zh', native: 'Zhongwen', dir: 'ltr' },
  { code: 'ja', native: 'Nihongo', dir: 'ltr' },
  { code: 'hi', native: 'Hindi', dir: 'ltr' },
  { code: 'si', native: 'Sinhala', dir: 'ltr' },
  { code: 'ar', native: 'al-Arabiyya', dir: 'rtl' },
  { code: 'pi', native: 'Pali', dir: 'ltr' },
];

export const BASE_LANG = 'es';

const CODES = new Set(LANGUAGES.map((l) => l.code));

export function resolveDir(lang) {
  return LANGUAGES.find((l) => l.code === lang)?.dir ?? 'ltr';
}

// Stored choice wins; else match navigator language prefix; else base.
export function pickInitialLang(stored, navigatorLang) {
  if (stored && CODES.has(stored)) return stored;
  const prefix = (navigatorLang ?? '').slice(0, 2).toLowerCase();
  if (CODES.has(prefix)) return prefix;
  return BASE_LANG;
}
