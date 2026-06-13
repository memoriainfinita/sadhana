import { describe, it, expect } from 'vitest';
import { pxDeltaToSeconds, clampDuration, clampFadeIn, clampFadeOut } from './clip.js';

describe('pxDeltaToSeconds', () => {
  it('converts pixel delta to seconds relative to total duration', () => {
    expect(pxDeltaToSeconds(100, 200, 600)).toBe(300);
  });
  it('returns 0 when lineWidth is 0 (avoids divide-by-zero)', () => {
    expect(pxDeltaToSeconds(100, 0, 600)).toBe(0);
  });
  it('handles negative deltas', () => {
    expect(pxDeltaToSeconds(-50, 200, 600)).toBe(-150);
  });
});

describe('clampDuration', () => {
  it('floors at 5 seconds', () => {
    expect(clampDuration(2, 0, 600)).toBe(5);
  });
  it('caps at durationSeconds - cue.time', () => {
    expect(clampDuration(999, 540, 600)).toBe(60);
  });
  it('passes through a valid value', () => {
    expect(clampDuration(120, 0, 600)).toBe(120);
  });
});

describe('clampFadeIn', () => {
  it('floors at 0', () => {
    expect(clampFadeIn(-3, 60, 10)).toBe(0);
  });
  it('caps at duration - fadeOut', () => {
    expect(clampFadeIn(999, 60, 10)).toBe(50);
  });
  it('passes through a valid value', () => {
    expect(clampFadeIn(20, 60, 10)).toBe(20);
  });
});

describe('clampFadeOut', () => {
  it('floors at 0', () => {
    expect(clampFadeOut(-3, 60, 10)).toBe(0);
  });
  it('caps at duration - fadeIn', () => {
    expect(clampFadeOut(999, 60, 10)).toBe(50);
  });
  it('passes through a valid value', () => {
    expect(clampFadeOut(20, 60, 10)).toBe(20);
  });
});
