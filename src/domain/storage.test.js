import { describe, expect, test } from 'vitest';
import {
  cleanStoredExamples,
  cleanStoredExamplesOnce,
  deletePreset,
  deleteSession,
  readJson,
  savePreset,
  saveSession,
  seedDefaultPresets,
  STORAGE_KEYS,
  writeJson,
} from './storage.js';

function memoryStorage(initial = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
  };
}

describe('storage domain', () => {
  test('returns fallback when storage has invalid json', () => {
    const storage = {
      getItem: () => '{broken',
      setItem: () => {},
    };

    expect(readJson(storage, 'sadhana', [])).toEqual([]);
  });

  test('writes json payloads', () => {
    const writes = new Map();
    const storage = {
      getItem: (key) => writes.get(key) ?? null,
      setItem: (key, value) => writes.set(key, value),
    };

    writeJson(storage, 'preset', { name: 'Mañana tranquila' });

    expect(JSON.parse(writes.get('preset'))).toEqual({ name: 'Mañana tranquila' });
  });

  test('deletes saved presets by id', () => {
    const storage = memoryStorage({
      'sadhana-next.presets': JSON.stringify([{ id: 'a' }, { id: 'b' }]),
    });

    const next = deletePreset(storage, 'a');

    expect(next).toEqual([{ id: 'b' }]);
  });

  test('deletes saved sessions by id', () => {
    const storage = memoryStorage({
      'sadhana-next.sessions': JSON.stringify([{ id: 'a' }, { id: 'b' }]),
    });

    const next = deleteSession(storage, 'b');

    expect(next).toEqual([{ id: 'a' }]);
  });

  test('savePreset prepends, deduplicates by id, and caps at 12', () => {
    const storage = memoryStorage();
    const existing = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, name: `Preset ${i}` }));
    existing.forEach((p) => savePreset(storage, p));

    const updated = savePreset(storage, { id: 'p0', name: 'Preset 0 editado' });

    expect(updated[0]).toMatchObject({ id: 'p0', name: 'Preset 0 editado' });
    expect(updated.length).toBe(12);
    expect(updated.filter((p) => p.id === 'p0').length).toBe(1);
  });

  test('saveSession prepends and caps at 8', () => {
    const storage = memoryStorage();
    Array.from({ length: 8 }, (_, i) => saveSession(storage, { id: `s${i}`, name: `Sesion ${i}` }));

    const next = saveSession(storage, { id: 'new', name: 'Nueva sesion' });

    expect(next[0]).toMatchObject({ id: 'new' });
    expect(next.length).toBe(8);
  });

  test('cleanStoredExamples preserves presets with default cue names', () => {
    const storage = memoryStorage({
      'sadhana-next.presets': JSON.stringify([
        { id: 'user-preset', name: 'Nueva cue' },
        { id: 'user-preset-2', name: 'Nueva cue copia' },
      ]),
      'sadhana-next.sessions': JSON.stringify([]),
    });

    const result = cleanStoredExamples(storage);

    expect(result.presets).toHaveLength(2);
  });

  test('cleans old sample presets and sessions from storage', () => {
    const storage = memoryStorage({
      'sadhana-next.presets': JSON.stringify([
        { id: 'sample-ritual', name: 'Ritual base' },
        { id: 'manual', name: 'Trabajo real' },
        { id: 'old', name: 'Bosque prueba browser' },
      ]),
      'sadhana-next.sessions': JSON.stringify([
        { id: 'morning', name: 'Mañana tranquila' },
        { id: 'real-session', name: 'Sesion guardada' },
      ]),
    });

    const result = cleanStoredExamples(storage);

    expect(result.presets).toEqual([{ id: 'manual', name: 'Trabajo real' }]);
    expect(result.sessions).toEqual([{ id: 'real-session', name: 'Sesion guardada' }]);
  });

  test('cleanStoredExamplesOnce filters on first run and sets the cleaned flag', () => {
    const storage = memoryStorage({
      'sadhana-next.presets': JSON.stringify([
        { id: 'sample-ritual', name: 'Ritual base' },
        { id: 'manual', name: 'Trabajo real' },
      ]),
      'sadhana-next.sessions': JSON.stringify([]),
    });

    const result = cleanStoredExamplesOnce(storage);

    expect(result.presets).toEqual([{ id: 'manual', name: 'Trabajo real' }]);
    expect(readJson(storage, STORAGE_KEYS.examplesCleaned, false)).toBe(true);
  });

  test('cleanStoredExamplesOnce does not filter again once the flag is set', () => {
    const storage = memoryStorage({
      'sadhana-next.examplesCleaned': JSON.stringify(true),
      'sadhana-next.presets': JSON.stringify([
        { id: 'whatever', name: 'Relajación profunda' },
      ]),
      'sadhana-next.sessions': JSON.stringify([]),
    });

    const result = cleanStoredExamplesOnce(storage);

    expect(result.presets).toEqual([{ id: 'whatever', name: 'Relajación profunda' }]);
  });

  test('seedDefaultPresets writes defaults when storage is empty', () => {
    const storage = memoryStorage();
    const defaults = [{ id: 'p1', name: 'Preset 1', cues: [] }];

    const result = seedDefaultPresets(storage, defaults);

    expect(result).toEqual(defaults);
    expect(readJson(storage, STORAGE_KEYS.presets, [])).toEqual(defaults);
  });

  test('seedDefaultPresets does not overwrite existing presets', () => {
    const existing = [{ id: 'user', name: 'Mi preset', cues: [] }];
    const storage = memoryStorage({
      'sadhana-next.presets': JSON.stringify(existing),
    });

    const result = seedDefaultPresets(storage, [{ id: 'default', name: 'Default', cues: [] }]);

    expect(result).toEqual(existing);
  });

  test('showSoundNames key exists and round-trips correctly', () => {
    const storage = memoryStorage();
    writeJson(storage, STORAGE_KEYS.showSoundNames, false);
    expect(readJson(storage, STORAGE_KEYS.showSoundNames, true)).toBe(false);
    expect(readJson(memoryStorage(), STORAGE_KEYS.showSoundNames, true)).toBe(true);
  });
});
