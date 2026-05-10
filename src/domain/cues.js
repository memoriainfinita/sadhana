export const DEFAULT_CUES = [
  {
    id: 'start',
    name: 'Campana inicial',
    kind: 'bell',
    icon: 'bell',
    color: '#f6a133',
    sound: 'bells/meditation-bell.mp3',
    time: 0,
    duration: 18,
    volume: 70,
    fadeIn: 5,
    fadeOut: 5,
    notes: '',
  },
  {
    id: 'forest',
    name: 'Bosque suave',
    kind: 'ambient',
    icon: 'forest',
    color: '#9bb56f',
    sound: 'ambient/forest-day.mp3',
    time: 480,
    duration: 270,
    volume: 70,
    fadeIn: 5,
    fadeOut: 5,
    notes: '',
  },
  {
    id: 'final',
    name: 'Cuenco final',
    kind: 'bowl',
    icon: 'bowl',
    color: '#b886d0',
    sound: 'bells/tibetan-bowl-resonant.mp3',
    time: 1320,
    duration: 120,
    volume: 70,
    fadeIn: 5,
    fadeOut: 5,
    notes: '',
  },
];

export const SOUND_OPTIONS = [
  { label: 'Campana de meditacion', value: 'bells/meditation-bell.mp3' },
  { label: 'Bosque suave', value: 'ambient/forest-day.mp3' },
  { label: 'Cuenco tibetano', value: 'bells/tibetan-bowl-resonant.mp3' },
  { label: 'Lluvia distante', value: 'ambient/rain-distant-thunder.mp3' },
  { label: 'Gong profundo', value: 'bells/gong-deep.mp3' },
  { label: 'Respiracion', value: 'fx/breath-cue.mp3' },
];

export function formatClockTime(seconds) {
  const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function sortCuesByTime(cues) {
  return [...cues].sort((a, b) => a.time - b.time);
}

export function getCueById(cues, cueId) {
  return cues.find((cue) => cue.id === cueId);
}

export function updateCue(cues, cueId, updates) {
  return cues.map((cue) => (cue.id === cueId ? { ...cue, ...updates } : cue));
}

export function clampCueTime(seconds, durationSeconds) {
  return Math.min(Math.max(0, Number(seconds) || 0), durationSeconds);
}

function createCueId() {
  return `cue-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

export function createCue({ atTime = 0, durationSeconds = 24 * 60 } = {}) {
  return {
    id: createCueId(),
    name: 'Nueva cue',
    kind: 'bell',
    icon: 'bell',
    color: '#f6a133',
    sound: SOUND_OPTIONS[0].value,
    time: clampCueTime(atTime, durationSeconds),
    duration: 30,
    volume: 70,
    fadeIn: 2,
    fadeOut: 2,
    notes: '',
  };
}

export function duplicateCue(cue, { durationSeconds = 24 * 60, offsetSeconds = 30 } = {}) {
  return {
    ...cue,
    id: createCueId(),
    name: `${cue.name} copia`,
    time: clampCueTime(cue.time + offsetSeconds, durationSeconds),
  };
}

export function removeCue(cues, cueId) {
  if (cues.length <= 1) {
    return { cues, selectedCueId: cues[0]?.id ?? null };
  }

  const index = cues.findIndex((cue) => cue.id === cueId);
  const next = cues.filter((cue) => cue.id !== cueId);
  const fallback = next[Math.min(Math.max(index, 0), next.length - 1)] ?? next[0] ?? null;

  return { cues: next, selectedCueId: fallback?.id ?? null };
}
