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

// Spanish copy is written with its accents. The list below holds only forms
// that are always wrong in Spanish, never a word whose two spellings are both
// valid depending on the sentence -- "practica"/"practica", "mas"/"mas",
// "tu"/"tu" and "esta"/"esta" are deliberately absent for that reason.
const MISSPELLED = [
  'Disenar', 'Diseno', 'Configuracion', 'reproduccion', 'Ambar',
  'sesion', 'Sesion', 'Linea', 'Anadir', 'Anade', 'anadida',
  'ultimo', 'Ultimo', 'Ultima', 'Ultimas', 'Duracion', 'duracion',
  'Posicion', 'posicion', 'Instruccion', 'instruccion', 'Reten',
  'guardalo', 'apareceran', 'aqui', 'Aqui', 'valido',
  'Acuestate', 'Buho', 'Bano', 'Mandibula', 'mandibula', 'demas',
  'Levantate', 'Sientate', 'Dejalo', 'Quedate', 'tension',
  'indicacion', 'respiracion', 'despues', 'Despues',
  'Meditacion', 'Relajacion',
];
const misspellingsIn = (text) =>
  MISSPELLED.filter((word) => new RegExp(`\\b${word}\\b`).test(text));

function collect(node, path, into) {
  if (typeof node === 'string') {
    const found = misspellingsIn(node);
    if (found.length) into.push(`${path}: "${node}" -> ${found.join(', ')}`);
    return;
  }
  if (node && typeof node === 'object') {
    Object.entries(node).forEach(([k, v]) => collect(v, path ? `${path}.${k}` : k, into));
  }
}

describe('Spanish copy is spelled correctly', () => {
  test('the es dictionary carries its accents', () => {
    const offenders = [];
    collect(es, '', offenders);
    expect(offenders).toEqual([]);
  });

  test('default preset names, instructions and notes carry their accents', () => {
    const offenders = [];
    DEFAULT_PRESETS.forEach((preset) => {
      collect(preset.name, `${preset.id}.name`, offenders);
      preset.cues.forEach((cue) => {
        collect(cue.name, `${preset.id}.${cue.id}.name`, offenders);
        collect(cue.instruction, `${preset.id}.${cue.id}.instruction`, offenders);
        collect(cue.notes, `${preset.id}.${cue.id}.notes`, offenders);
      });
    });
    expect(offenders).toEqual([]);
  });
});
