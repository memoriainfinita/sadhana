export const STORAGE_KEYS = {
  presets: 'sadhana-next.presets',
  sessions: 'sadhana-next.sessions',
  showSoundNames: 'sadhana-next.showSoundNames',
  examplesCleaned: 'sadhana-next.examplesCleaned',
};

const OLD_SAMPLE_IDS = new Set([
  'sample-ritual',
  'sample-breath',
  'morning',
  'deep',
  'walk',
  'breath',
]);

const OLD_SAMPLE_NAMES = new Set([
  'Ritual base',
  'Respiracion corta',
  'Bosque suave',
  'Bosque prueba browser',
  'Mañana tranquila',
  'Relajación profunda',
  'Paseo consciente',
  'Respiración',
]);

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

export function seedDefaultPresets(storage, defaults) {
  const existing = readJson(storage, STORAGE_KEYS.presets, []);
  if (existing.length > 0) return existing;
  writeJson(storage, STORAGE_KEYS.presets, defaults);
  return defaults;
}

function isOldSample(item) {
  return OLD_SAMPLE_IDS.has(item?.id) || OLD_SAMPLE_NAMES.has(item?.name);
}

export function cleanStoredExamples(storage) {
  const presets = readJson(storage, STORAGE_KEYS.presets, []).filter((preset) => !isOldSample(preset));
  const sessions = readJson(storage, STORAGE_KEYS.sessions, []).filter((session) => !isOldSample(session));

  writeJson(storage, STORAGE_KEYS.presets, presets);
  writeJson(storage, STORAGE_KEYS.sessions, sessions);

  return { presets, sessions };
}

// One-time migration: purge legacy sample presets/sessions from existing users
// once, then never filter by name again (avoids deleting user data that happens
// to share a name with an old sample).
export function cleanStoredExamplesOnce(storage) {
  if (readJson(storage, STORAGE_KEYS.examplesCleaned, false)) {
    return {
      presets: readJson(storage, STORAGE_KEYS.presets, []),
      sessions: readJson(storage, STORAGE_KEYS.sessions, []),
    };
  }

  const result = cleanStoredExamples(storage);
  writeJson(storage, STORAGE_KEYS.examplesCleaned, true);
  return result;
}
