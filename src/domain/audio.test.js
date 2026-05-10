import { describe, expect, test, vi } from 'vitest';
import { AudioRegistry } from './audio.js';

describe('audio registry', () => {
  test('tracks active cue audio and stops everything', () => {
    const registry = new AudioRegistry();
    const audioA = { pause: vi.fn(), currentTime: 12 };
    const audioB = { pause: vi.fn(), currentTime: 8 };

    registry.track('start', audioA);
    registry.track('forest', audioB);
    registry.stopAll();

    expect(audioA.pause).toHaveBeenCalledOnce();
    expect(audioA.currentTime).toBe(0);
    expect(audioB.pause).toHaveBeenCalledOnce();
    expect(audioB.currentTime).toBe(0);
    expect(registry.activeCount).toBe(0);
  });
});
