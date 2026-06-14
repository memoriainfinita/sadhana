// src/i18n/LanguageContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { BASE_LANG, pickInitialLang, resolveDir } from './index.js';
import { STORAGE_KEYS } from '../domain/storage.js';
import es from './locales/es.js';
import en from './locales/en.js';
import pi from './locales/pi.js';
import { translate } from './translate.js';

const LOCALES = { es, en, pi };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() =>
    pickInitialLang(window.localStorage.getItem(STORAGE_KEYS.lang), navigator.language)
  );

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = resolveDir(lang);
    document.title = translate(LOCALES, lang, BASE_LANG, 'app.title');
  }, [lang]);

  function setLang(next) {
    window.localStorage.setItem(STORAGE_KEYS.lang, next);
    setLangState(next);
  }

  const t = (key, vars) => translate(LOCALES, lang, BASE_LANG, key, vars);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
