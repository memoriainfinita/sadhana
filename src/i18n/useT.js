// src/i18n/useT.js
import { useLang } from './LanguageContext.jsx';

// Returns t(key, vars). Components that also need the active language or the
// setter use useLang() directly.
export function useT() {
  return useLang().t;
}
