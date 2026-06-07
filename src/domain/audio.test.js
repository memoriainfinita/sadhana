import { describe, expect, test, vi } from 'vitest';
import { AudioRegistry } from './audio.js';

function makeAudio(overrides = {}) {
  return { pause: vi.fn(), currentTime: 0, addEventListener: vi.fn(), ...overrides };
}

function makeEntry(audio, { baseVolume = 100, cueVolumeScale = 1 } = {}) {
  return { audio, baseVolume, cueVolumeScale };
}

describe('AudioRegistry', () => {
  test('tracks active entries and stops all', () => {
    const registry = new AudioRegistry();
    const audioA = makeAudio({ currentTime: 12 });
    const audioB = makeAudio({ currentTime: 8 });

    registry.track('start', makeEntry(audioA));
    registry.track('forest', makeEntry(audioB));
    registry.stopAll();

    expect(audioA.pause).toHaveBeenCalledOnce();
    expect(audioA.currentTime).toBe(0);
    expect(audioB.pause).toHaveBeenCalledOnce();
    expect(audioB.currentTime).toBe(0);
    expect(registry.activeCount).toBe(0);
  });

  test('applyMasterVolume stores state and uses cueVolumeScale', () => {
    const registry = new AudioRegistry();
    const audio = makeAudio();
    const entry = makeEntry(audio, { baseVolume: 80, cueVolumeScale: 0.5 });
    registry.track('bell', entry);

    registry.applyMasterVolume(0.6, false);

    expect(registry._masterVolumeScale).toBe(0.6);
    expect(registry._muted).toBe(false);
    expect(audio.volume).toBeCloseTo(0.5 * 0.6);
  });

  test('applyMasterVolume mutes all audio regardless of cueVolumeScale', () => {
    const registry = new AudioRegistry();
    const audio = makeAudio();
    const entry = makeEntry(audio, { cueVolumeScale: 0.8 });
    registry.track('bell', entry);

    registry.applyMasterVolume(1, true);

    expect(registry._muted).toBe(true);
    expect(audio.volume).toBe(0);
  });
});
