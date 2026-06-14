import { describe, expect, test } from 'vitest';
import {
  createSessionState,
  getRemainingSeconds,
  sessionReducer,
  sessionDisplay,
} from './session.js';

describe('sessionDisplay', () => {
  const t = (key, vars) => (key === 'sessions.withCue' ? `Sesion con ${vars.name}`
    : key === 'sessions.defaultName' ? 'Sesion completada' : key);
  const fmtDuration = (s) => `${Math.round(s / 60)} min`;
  const fmtDate = () => 'hace 1 hora';

  test('formats a new raw session', () => {
    const item = { cueName: 'Bosque', durationSeconds: 1200, createdAt: '2026-06-14T10:00:00Z' };
    expect(sessionDisplay(item, t, fmtDuration, fmtDate)).toEqual({
      name: 'Sesion con Bosque', duration: '20 min', when: 'hace 1 hora',
    });
  });

  test('falls back to old preformatted fields for legacy sessions', () => {
    const item = { name: 'Sesion vieja', duration: '15 min', when: 'Hoy, 09:00' };
    expect(sessionDisplay(item, t, fmtDuration, fmtDate)).toEqual({
      name: 'Sesion vieja', duration: '15 min', when: 'Hoy, 09:00',
    });
  });

  test('uses default name when neither cueName nor legacy name present', () => {
    expect(sessionDisplay({ durationSeconds: 600 }, t, fmtDuration, fmtDate).name)
      .toBe('Sesion completada');
  });
});

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
