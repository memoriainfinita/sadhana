import { describe, expect, test } from 'vitest';
import { createTimelineTicks } from './timeline.js';

describe('timeline domain', () => {
  test('creates ruler ticks from the current session duration', () => {
    expect(createTimelineTicks(15 * 60)).toEqual([0, 225, 450, 675, 900]);
  });
});
