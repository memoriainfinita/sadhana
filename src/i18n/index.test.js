// src/i18n/index.test.js
import { describe, expect, test } from 'vitest';
import { LANGUAGES, BASE_LANG, pickInitialLang, resolveDir } from './index.js';

describe('language registry', () => {
  test('base language is es and is registered', () => {
    expect(BASE_LANG).toBe('es');
    expect(LANGUAGES.some((l) => l.code === 'es')).toBe(true);
  });

  test('resolveDir returns rtl for ar, ltr otherwise', () => {
    expect(resolveDir('ar')).toBe('rtl');
    expect(resolveDir('es')).toBe('ltr');
    expect(resolveDir('unknown')).toBe('ltr');
  });
});

describe('pickInitialLang', () => {
  test('prefers a valid stored value', () => {
    expect(pickInitialLang('en', 'fr-FR')).toBe('en');
  });

  test('falls back to navigator language prefix when no stored value', () => {
    expect(pickInitialLang(null, 'en-US')).toBe('en');
  });

  test('falls back to base when nothing matches', () => {
    expect(pickInitialLang(null, 'xx-XX')).toBe('es');
  });

  test('ignores an unregistered stored value', () => {
    expect(pickInitialLang('zz', 'en-US')).toBe('en');
  });
});
