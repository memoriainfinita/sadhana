import { describe, expect, test } from 'vitest';
import {
  createSessionState,
  getRemainingSeconds,
  sessionReducer,
} from './session.js';

describe('session domain', () => {
  test('starts a session from idle state', () => {
    const state = createSessionState({ durationSeconds: 1440 });
    const next = sessionReducer(state, { type: 'start', now: 1000 });

    expect(next.status).toBe('running');
    expect(next.startedAt).toBe(1000);
    expect(next.elapsedSeconds).toBe(0);
  });

  test('pauses and resumes without counting paused time', () => {
    let state = createSessionState({ durationSeconds: 120 });
    state = sessionReducer(state, { type: 'start', now: 0 });
    state = sessionReducer(state, { type: 'tick', now: 30_000 });
    state = sessionReducer(state, { type: 'pause', now: 30_000 });
    state = sessionReducer(state, { type: 'resume', now: 90_000 });
    state = sessionReducer(state, { type: 'tick', now: 100_000 });

    expect(state.elapsedSeconds).toBe(40);
    expect(getRemainingSeconds(state)).toBe(80);
  });

  test('stop returns the session to idle timing', () => {
    let state = createSessionState({ durationSeconds: 120 });
    state = sessionReducer(state, { type: 'start', now: 0 });
    state = sessionReducer(state, { type: 'tick', now: 50_000 });
    state = sessionReducer(state, { type: 'stop' });

    expect(state.status).toBe('idle');
    expect(state.elapsedSeconds).toBe(0);
  });

  test('nudges elapsed time within session bounds', () => {
    let state = createSessionState({ durationSeconds: 120 });
    state = sessionReducer(state, { type: 'start', now: 0 });
    state = sessionReducer(state, { type: 'tick', now: 30_000 });

    expect(sessionReducer(state, { type: 'nudge', seconds: 15 }).elapsedSeconds).toBe(45);
    expect(sessionReducer(state, { type: 'nudge', seconds: -60 }).elapsedSeconds).toBe(0);
    expect(sessionReducer(state, { type: 'nudge', seconds: 200 }).elapsedSeconds).toBe(120);
  });
});
