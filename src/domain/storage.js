export const STORAGE_KEYS = {
  presets: 'sadhana-next.presets',
  sessions: 'sadhana-next.sessions',
};

export function readJson(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJson(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}

export function savePreset(storage, preset) {
  const presets = readJson(storage, STORAGE_KEYS.presets, []);
  const next = [preset, ...presets.filter((item) => item.id !== preset.id)].slice(0, 12);
  writeJson(storage, STORAGE_KEYS.presets, next);
  return next;
}

export function saveSession(storage, session) {
  const sessions = readJson(storage, STORAGE_KEYS.sessions, []);
  const next = [session, ...sessions].slice(0, 8);
  writeJson(storage, STORAGE_KEYS.sessions, next);
  return next;
}

export function deletePreset(storage, presetId) {
  const next = readJson(storage, STORAGE_KEYS.presets, []).filter((preset) => preset.id !== presetId);
  writeJson(storage, STORAGE_KEYS.presets, next);
  return next;
}

export function deleteSession(storage, sessionId) {
  const next = readJson(storage, STORAGE_KEYS.sessions, []).filter((session) => session.id !== sessionId);
  writeJson(storage, STORAGE_KEYS.sessions, next);
  return next;
}
