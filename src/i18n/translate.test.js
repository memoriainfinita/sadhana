// src/i18n/translate.test.js
import { describe, expect, test, vi } from 'vitest';
import { translate } from './translate.js';

const locales = {
  es: {
    modes: { practice: 'Practicar' },
    library: { cueCount: { one: '{n} senal', other: '{n} senales' } },
    greet: 'Hola {name}',
  },
  en: {
    modes: { practice: 'Practice' },
    library: { cueCount: { one: '{n} cue', other: '{n} cues' } },
  },
};

describe('translate', () => {
  test('resolves a nested key in the active language', () => {
    expect(translate(locales, 'en', 'es', 'modes.practice')).toBe('Practice');
  });

  test('falls back to base language when key missing in active', () => {
    expect(translate(locales, 'en', 'es', 'greet', { name: 'A' })).toBe('Hola A');
  });

  test('interpolates {vars}', () => {
    expect(translate(locales, 'es', 'es', 'greet', { name: 'Ana' })).toBe('Hola Ana');
  });

  test('selects plural category via Intl.PluralRules', () => {
    expect(translate(locales, 'en', 'es', 'library.cueCount', { n: 1 })).toBe('1 cue');
    expect(translate(locales, 'en', 'es', 'library.cueCount', { n: 3 })).toBe('3 cues');
  });

  test('returns the raw key when missing everywhere', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(translate(locales, 'en', 'es', 'does.not.exist')).toBe('does.not.exist');
    warn.mockRestore();
  });

  test('plural key without n does not crash, falls back to other', () => {
    expect(translate(locales, 'en', 'es', 'library.cueCount')).toBe('{n} cues');
  });
});
