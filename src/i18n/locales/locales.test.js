// src/i18n/locales/locales.test.js
import { describe, expect, test } from 'vitest';
import es from './es.js';
import en from './en.js';

function keyPaths(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    // plural objects ({ one, other }) are leaves
    if (v && typeof v === 'object' && !('other' in v)) return keyPaths(v, path);
    return [path];
  });
}

describe('locale integrity', () => {
  test('en covers every key in es (es is canonical)', () => {
    const esKeys = keyPaths(es);
    const enKeys = new Set(keyPaths(en));
    const missing = esKeys.filter((k) => !enKeys.has(k));
    expect(missing).toEqual([]);
  });
});
