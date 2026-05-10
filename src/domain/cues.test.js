import { describe, expect, test } from 'vitest';
import {
  DEFAULT_CUES,
  createCue,
  duplicateCue,
  formatClockTime,
  getCueById,
  removeCue,
  sortCuesByTime,
  updateCue,
} from './cues.js';

describe('cues domain', () => {
  test('formats seconds as m:ss labels', () => {
    expect(formatClockTime(0)).toBe('0:00');
    expect(formatClockTime(480)).toBe('8:00');
    expect(formatClockTime(1320)).toBe('22:00');
  });

  test('sorts cues by time without mutating the input', () => {
    const cues = [
      { id: 'final', time: 1320 },
      { id: 'start', time: 0 },
      { id: 'forest', time: 480 },
    ];

    expect(sortCuesByTime(cues).map((cue) => cue.id)).toEqual(['start', 'forest', 'final']);
    expect(cues.map((cue) => cue.id)).toEqual(['final', 'start', 'forest']);
  });

  test('updates one cue and leaves the others unchanged', () => {
    const next = updateCue(DEFAULT_CUES, 'forest', { name: 'Bosque nocturno', volume: 42 });

    expect(getCueById(next, 'forest')).toMatchObject({ name: 'Bosque nocturno', volume: 42 });
    expect(getCueById(next, 'start')).toEqual(getCueById(DEFAULT_CUES, 'start'));
  });

  test('creates a cue clamped inside the session duration', () => {
    const cue = createCue({ atTime: 2000, durationSeconds: 1440 });

    expect(cue).toMatchObject({
      name: 'Nueva cue',
      kind: 'bell',
      icon: 'bell',
      color: '#f6a133',
      sound: 'bells/meditation-bell.mp3',
      time: 1440,
      duration: 30,
      volume: 70,
      fadeIn: 2,
      fadeOut: 2,
      notes: '',
    });
    expect(cue.id).toMatch(/^cue-/);
  });

  test('duplicates a cue with a readable name and offset time', () => {
    const copy = duplicateCue(DEFAULT_CUES[1], { durationSeconds: 1440 });

    expect(copy).toMatchObject({
      name: 'Bosque suave copia',
      sound: DEFAULT_CUES[1].sound,
      time: 510,
    });
    expect(copy.id).not.toBe(DEFAULT_CUES[1].id);
  });

  test('removes a cue and chooses a nearby selection', () => {
    const result = removeCue(DEFAULT_CUES, 'forest');

    expect(result.cues.map((cue) => cue.id)).toEqual(['start', 'final']);
    expect(result.selectedCueId).toBe('final');
  });
});
