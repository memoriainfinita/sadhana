import { describe, expect, test } from 'vitest';
import { DEFAULT_PRESETS, presetDurationSeconds, resolvePresetName } from './presets.js';
import { SOUND_OPTIONS } from './sounds.js';

describe('resolvePresetName', () => {
  // t stub: returns translated name for known default ids, echoes the key otherwise
  const t = (key) => (key === 'presets.default-yoga-nidra' ? 'Yoga Nidra' : key);

  test('returns translated name for a default preset id', () => {
    expect(resolvePresetName({ id: 'default-yoga-nidra', name: 'X' }, t)).toBe('Yoga Nidra');
  });

  test('falls back to literal name for a user preset (key echoes back)', () => {
    expect(resolvePresetName({ id: 'abc-123', name: 'Mi preset' }, t)).toBe('Mi preset');
  });
});

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

  test('every preset has a durationSeconds covering its last cue', () => {
    DEFAULT_PRESETS.forEach((preset) => {
      const lastCueStart = Math.max(...preset.cues.map((cue) => cue.time));
      expect(preset.durationSeconds, `${preset.name} missing durationSeconds`).toBeGreaterThan(0);
      expect(preset.durationSeconds, `${preset.name} duration shorter than last cue`).toBeGreaterThanOrEqual(lastCueStart);
    });
  });

  test('presetDurationSeconds uses the stored durationSeconds when present', () => {
    const preset = { durationSeconds: 900, cues: [{ time: 1800, duration: 60 }] };
    expect(presetDurationSeconds(preset)).toBe(900);
  });

  test('presetDurationSeconds derives from last cue end, rounded up to a minute', () => {
    const preset = { cues: [{ time: 60, duration: 30 }, { time: 1770, duration: 120 }] };
    // last cue ends at 1890s -> rounds up to 1920s (32 min)
    expect(presetDurationSeconds(preset)).toBe(1920);
  });

  test('presetDurationSeconds falls back to a 60s minimum for empty cues', () => {
    expect(presetDurationSeconds({ cues: [] })).toBe(60);
    expect(presetDurationSeconds({})).toBe(60);
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
