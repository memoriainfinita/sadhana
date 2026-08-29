// src/i18n/locales/locales.test.js
import { describe, expect, test } from 'vitest';
import es from './es.js';
import en from './en.js';
import { translate } from '../translate.js';
import { DEFAULT_PRESETS, resolvePresetName } from '../../domain/presets.js';
import { resolveInstruction } from '../../domain/cues.js';

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

// End-to-end through the real dictionaries: every piece of default-preset text
// a user sees must come out in the active language, not just exist as a key.
describe('default preset content resolves in both languages', () => {
  const LOCALES = { es, en };
  const t = (lang) => (key) => translate(LOCALES, lang, 'es', key);

  test('every default preset name resolves in es and en', () => {
    DEFAULT_PRESETS.forEach((preset) => {
      ['es', 'en'].forEach((lang) => {
        const name = resolvePresetName(preset, t(lang));
        expect(name, `${preset.id} name unresolved in ${lang}`).not.toContain('presets.');
        expect(name.length, `${preset.id} name empty in ${lang}`).toBeGreaterThan(0);
      });
    });
  });

  test('every default preset instruction resolves in es and en', () => {
    DEFAULT_PRESETS.flatMap((p) => p.cues).filter((c) => c.instruction).forEach((cue) => {
      ['es', 'en'].forEach((lang) => {
        const text = resolveInstruction(cue, t(lang));
        expect(text, `${cue.id} instruction unresolved in ${lang}`).not.toContain('cueInstructions.');
        expect(text.length, `${cue.id} instruction empty in ${lang}`).toBeGreaterThan(0);
      });
    });
  });

  test('English is actually English, not the Spanish literal falling through', () => {
    // Spot-check cues whose two languages must differ; a fallback would make them equal.
    const differing = DEFAULT_PRESETS.flatMap((p) => p.cues)
      .filter((c) => c.instruction)
      .filter((c) => resolveInstruction(c, t('en')) !== resolveInstruction(c, t('es')));
    expect(differing.length, 'no instruction differs between es and en').toBeGreaterThan(30);
  });
});
