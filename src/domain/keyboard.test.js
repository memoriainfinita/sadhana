import { describe, it, expect } from 'vitest';
import { stepFromKey } from './keyboard.js';

describe('stepFromKey', () => {
  const opts = { min: 0, max: 100, step: 5 };

  it('ArrowRight increments by step', () => {
    expect(stepFromKey(10, 'ArrowRight', opts)).toBe(15);
  });
  it('ArrowUp is an alias for increment', () => {
    expect(stepFromKey(10, 'ArrowUp', opts)).toBe(15);
  });
  it('ArrowLeft decrements by step', () => {
    expect(stepFromKey(10, 'ArrowLeft', opts)).toBe(5);
  });
  it('ArrowDown is an alias for decrement', () => {
    expect(stepFromKey(10, 'ArrowDown', opts)).toBe(5);
  });
  it('clamps to max on increment', () => {
    expect(stepFromKey(98, 'ArrowRight', opts)).toBe(100);
  });
  it('clamps to min on decrement', () => {
    expect(stepFromKey(2, 'ArrowLeft', opts)).toBe(0);
  });
  it('Home returns min', () => {
    expect(stepFromKey(50, 'Home', opts)).toBe(0);
  });
  it('End returns max', () => {
    expect(stepFromKey(50, 'End', opts)).toBe(100);
  });
  it('returns null for keys it does not handle', () => {
    expect(stepFromKey(50, 'Enter', opts)).toBeNull();
    expect(stepFromKey(50, ' ', opts)).toBeNull();
    expect(stepFromKey(50, 'a', opts)).toBeNull();
  });
});
