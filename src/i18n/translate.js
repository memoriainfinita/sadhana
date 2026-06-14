// src/i18n/translate.js
function getPath(dict, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict);
}

function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  );
}

// Resolves key against the active language, falling back to baseLang, then to
// the raw key (with a dev warning). Supports {var} interpolation and plural
// objects ({ one, other, ... }) selected via Intl.PluralRules.
export function translate(locales, lang, baseLang, key, vars = {}) {
  let value = getPath(locales[lang], key);
  if (value === undefined) value = getPath(locales[baseLang], key);

  if (value === undefined) {
    if (import.meta.env?.DEV) console.warn(`[i18n] missing key: ${key}`);
    return key;
  }

  if (value && typeof value === 'object') {
    const n = Number(vars.n);
    const category = Number.isFinite(n) ? new Intl.PluralRules(lang).select(n) : 'other';
    value = value[category] ?? value.other;
  }

  return typeof value === 'string' ? interpolate(value, vars) : key;
}
