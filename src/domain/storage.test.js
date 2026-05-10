import { describe, expect, test } from 'vitest';
import { deletePreset, deleteSession, readJson, writeJson } from './storage.js';

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
});
