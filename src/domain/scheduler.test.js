import { describe, expect, test } from 'vitest';
import { createCueSchedulerState, getDueCues, resetCueScheduler } from './scheduler.js';

describe('cue scheduler domain', () => {
  test('returns each cue once when elapsed time crosses its cue time', () => {
    const cues = [
      { id: 'start', time: 0 },
      { id: 'forest', time: 10 },
      { id: 'final', time: 20 },
    ];
    let state = createCueSchedulerState();

    let result = getDueCues(cues, state, 0);
    expect(result.due.map((cue) => cue.id)).toEqual(['start']);
    state = result.state;

    result = getDueCues(cues, state, 15);
    expect(result.due.map((cue) => cue.id)).toEqual(['forest']);
    state = result.state;

    result = getDueCues(cues, state, 25);
    expect(result.due.map((cue) => cue.id)).toEqual(['final']);
    expect(getDueCues(cues, result.state, 25).due).toEqual([]);
  });

  test('resetCueScheduler returns an empty scheduler state', () => {
    expect(resetCueScheduler()).toEqual(createCueSchedulerState());
  });
});
