import { describe, expect, test } from 'vitest';
import { DEFAULT_PRESETS } from './presets.js';
import { SOUND_OPTIONS } from './sounds.js';

const REQUIRED_CUE_FIELDS = ['id', 'name', 'sound', 'time', 'duration', 'volume', 'fadeIn', 'fadeOut', 'instruction', 'instructionDuration'];
const validSounds = new Set(SOUND_OPTIONS.map((o) => o.value));

describe('default presets', () => {
  test('contains exactly 5 presets with unique ids and names', () => {
    expect(DEFAULT_PRESETS).toHaveLength(5);
    const ids = DEFAULT_PRESETS.map((p) => p.id);
    const names = DEFAULT_PRESETS.map((p) => p.name);
    expect(new Set(ids).size).toBe(5);
    expect(new Set(names).size).toBe(5);
  });

  test('every preset has at least 4 cues', () => {
    DEFAULT_PRESETS.forEach((preset) => {
      expect(preset.cues.length).toBeGreaterThanOrEqual(4);
    });
  });

  test('every cue has all required fields', () => {
    DEFAULT_PRESETS.forEach((preset) => {
      preset.cues.forEach((cue) => {
        REQUIRED_CUE_FIELDS.forEach((field) => {
          expect(cue, `${preset.name} > ${cue.id} missing "${field}"`).toHaveProperty(field);
        });
      });
    });
  });

  test('every cue references a registered sound', () => {
    DEFAULT_PRESETS.forEach((preset) => {
      preset.cues.forEach((cue) => {
        expect(validSounds, `${preset.name} > ${cue.id} uses unknown sound "${cue.sound}"`).toContain(cue.sound);
      });
    });
  });

  test('every cue time is within a 30-minute session', () => {
    const MAX = 30 * 60;
    DEFAULT_PRESETS.forEach((preset) => {
      preset.cues.forEach((cue) => {
        expect(cue.time, `${preset.name} > ${cue.id} time out of bounds`).toBeGreaterThanOrEqual(0);
        expect(cue.time, `${preset.name} > ${cue.id} time out of bounds`).toBeLessThanOrEqual(MAX);
      });
    });
  });
});
