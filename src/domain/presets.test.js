import { describe, expect, test } from 'vitest';
import { CUE_COLORS, DEFAULT_PRESETS, presetDurationSeconds, resolvePresetName } from './presets.js';
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
  test('contains exactly 12 presets with unique ids and names', () => {
    expect(DEFAULT_PRESETS).toHaveLength(12);
    const ids = DEFAULT_PRESETS.map((p) => p.id);
    const names = DEFAULT_PRESETS.map((p) => p.name);
    expect(new Set(ids).size).toBe(12);
    expect(new Set(names).size).toBe(12);
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

  test('every cue starts within its own session, whatever its length', () => {
    DEFAULT_PRESETS.forEach((preset) => {
      preset.cues.forEach((cue) => {
        expect(cue.time, `${preset.name} > ${cue.id} time out of bounds`).toBeGreaterThanOrEqual(0);
        expect(cue.time, `${preset.name} > ${cue.id} starts after the session ends`).toBeLessThanOrEqual(preset.durationSeconds);
      });
    });
  });
});

// The seven semantic colour tokens, pinned to their hex values here so a
// silent edit to the palette breaks the test rather than the design.
const COLOR_TOKENS = {
  opening: '#f6a133',
  closing: '#b886d0',
  transition: '#c97761',
  guidance: '#a0c4e8',
  earth: '#9bb56f',
  water: '#6fa7c4',
  tonal: '#e0c46f',
};
const ALL_TOKENS = new Set(Object.values(COLOR_TOKENS));
// Cues that ring rather than sustain: they carry the opening/closing role.
const RESONANT_KINDS = new Set(['bell', 'bowl', 'gong']);
const CUE_KINDS = new Set(['bell', 'ambient', 'fx', 'bowl', 'gong']);
const CUE_ICONS = new Set(['bell', 'rain', 'breath', 'bowl', 'forest', 'gong']);

const everyCue = (fn) =>
  DEFAULT_PRESETS.forEach((preset) => preset.cues.forEach((cue) => fn(cue, preset)));

describe('default preset data integrity', () => {
  test('the exported palette is exactly the seven contract tokens', () => {
    expect(CUE_COLORS).toEqual(COLOR_TOKENS);
  });

  test('preset ids are unique and namespaced default-<slug>', () => {
    const ids = DEFAULT_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id, `${id} is not a default-<slug> id`).toMatch(/^default-[a-z0-9]+(-[a-z0-9]+)*$/));
  });

  test('cue ids are unique within each preset', () => {
    DEFAULT_PRESETS.forEach((preset) => {
      const ids = preset.cues.map((c) => c.id);
      expect(new Set(ids).size, `${preset.name} has duplicate cue ids`).toBe(ids.length);
    });
  });

  test('every cue respects the clamps the timeline editor enforces', () => {
    everyCue((cue, preset) => {
      const where = `${preset.name} > ${cue.id}`;
      // clampDuration: minimum 5s
      expect(cue.duration, `${where} duration below the 5s minimum`).toBeGreaterThanOrEqual(5);
      // clampFadeIn / clampFadeOut: both ramps must fit inside the clip
      expect(cue.fadeIn + cue.fadeOut, `${where} fades do not fit in the clip`).toBeLessThanOrEqual(cue.duration);
      expect(cue.fadeIn, `${where} negative fadeIn`).toBeGreaterThanOrEqual(0);
      expect(cue.fadeOut, `${where} negative fadeOut`).toBeGreaterThanOrEqual(0);
      expect(cue.volume, `${where} volume out of range`).toBeGreaterThanOrEqual(0);
      expect(cue.volume, `${where} volume out of range`).toBeLessThanOrEqual(100);
      expect(cue.instructionDuration, `${where} instructionDuration out of range`).toBeGreaterThanOrEqual(1);
      expect(cue.instructionDuration, `${where} instructionDuration out of range`).toBeLessThanOrEqual(60);
    });
  });

  test('every cue finishes before its session ends', () => {
    // On status 'complete' the app calls stopAll(), so anything past
    // durationSeconds is cut dead rather than ringing out.
    everyCue((cue, preset) => {
      expect(
        cue.time + cue.duration,
        `${preset.name} > ${cue.id} runs past the end of the session`
      ).toBeLessThanOrEqual(preset.durationSeconds);
    });
  });

  test('every preset declares a positive durationSeconds', () => {
    DEFAULT_PRESETS.forEach((preset) => {
      expect(preset.durationSeconds, `${preset.name} durationSeconds`).toBeGreaterThan(0);
    });
  });

  test('every cue uses an established kind and icon', () => {
    everyCue((cue, preset) => {
      expect(CUE_KINDS, `${preset.name} > ${cue.id} unknown kind "${cue.kind}"`).toContain(cue.kind);
      expect(CUE_ICONS, `${preset.name} > ${cue.id} unknown icon "${cue.icon}"`).toContain(cue.icon);
    });
  });

  test('every cue colour is one of the seven semantic tokens', () => {
    everyCue((cue, preset) => {
      expect(ALL_TOKENS, `${preset.name} > ${cue.id} uses off-palette colour ${cue.color}`).toContain(cue.color);
    });
  });

  test('a preset that ends on a bell, bowl or gong colours it as a close', () => {
    DEFAULT_PRESETS.forEach((preset) => {
      const last = preset.cues[preset.cues.length - 1];
      if (!RESONANT_KINDS.has(last.kind)) return;
      expect(last.color, `${preset.name} > ${last.id} closes the session but is not the closing colour`).toBe(COLOR_TOKENS.closing);
    });
  });

  test('a resonant cue at time zero is coloured as an opening', () => {
    DEFAULT_PRESETS.forEach((preset) => {
      const first = preset.cues[0];
      if (first.time !== 0 || !RESONANT_KINDS.has(first.kind)) return;
      expect(first.color, `${preset.name} > ${first.id} opens the session but is not the opening colour`).toBe(COLOR_TOKENS.opening);
    });
  });
});

// The library has to teach the app, not just fill it: every session-building
// capability must appear somewhere in the set, in a preset where a real
// practice justifies it.
describe('default preset library coverage', () => {
  const allCues = DEFAULT_PRESETS.flatMap((p) => p.cues);
  const overlaps = (a, b) => a.time < b.time + b.duration && b.time < a.time + a.duration;

  test('draws on all three sound groups', () => {
    const folders = new Set(allCues.map((c) => c.sound.split('/')[0]));
    expect(folders).toContain('ambient');
    expect(folders).toContain('bells');
    expect(folders).toContain('fx');
  });

  test('at least one preset crossfades between two ambient beds', () => {
    const crossfades = DEFAULT_PRESETS.filter((preset) => {
      const beds = preset.cues.filter((c) => c.sound.startsWith('ambient/'));
      return beds.some((a, i) =>
        beds.slice(i + 1).some((b) => overlaps(a, b) && a.fadeOut > 0 && b.fadeIn > 0)
      );
    });
    expect(crossfades.map((p) => p.id), 'no preset crossfades two ambient beds').not.toEqual([]);
  });

  test('at least one preset layers three or more cues at once', () => {
    const densest = Math.max(
      ...DEFAULT_PRESETS.map((preset) =>
        Math.max(
          ...preset.cues.map(
            (probe) => preset.cues.filter((c) => overlaps(c, { time: probe.time, duration: 1 })).length
          )
        )
      )
    );
    expect(densest, 'no moment in the library layers 3+ cues').toBeGreaterThanOrEqual(3);
  });

  test('at least one preset carries facilitator notes', () => {
    expect(allCues.filter((c) => (c.notes ?? '').trim()).length, 'no cue uses notes').toBeGreaterThan(0);
  });

  test('spans a short session and a long one', () => {
    const lengths = DEFAULT_PRESETS.map((p) => p.durationSeconds);
    expect(Math.min(...lengths), 'no short session').toBeLessThanOrEqual(300);
    expect(Math.max(...lengths), 'no long session').toBeGreaterThanOrEqual(2700);
  });
});
