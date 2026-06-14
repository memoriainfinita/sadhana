export function createSessionState({ durationSeconds = 24 * 60 } = {}) {
  return {
    status: 'idle',
    durationSeconds,
    startedAt: null,
    pausedAt: null,
    accumulatedPauseMs: 0,
    elapsedSeconds: 0,
  };
}

export function getRemainingSeconds(state) {
  return Math.max(0, state.durationSeconds - state.elapsedSeconds);
}

// Derives display strings for a session card, formatting raw fields with the
// supplied helpers and falling back to legacy preformatted fields for sessions
// saved before the raw model. fmtDuration(seconds) and fmtDate(isoString) are
// passed in so this stays pure (locale lives in the caller).
export function sessionDisplay(item, t, fmtDuration, fmtDate) {
  const name = item.cueName ? t('sessions.withCue', { name: item.cueName })
    : item.name ?? t('sessions.defaultName');
  const duration = item.durationSeconds != null ? fmtDuration(item.durationSeconds)
    : item.duration ?? '';
  const when = item.createdAt ? fmtDate(item.createdAt)
    : item.when ?? '';
  return { name, duration, when };
}

export function sessionReducer(state, action) {
  switch (action.type) {
    case 'setDuration': {
      return {
        ...state,
        durationSeconds: Math.max(60, Number(action.durationSeconds) || state.durationSeconds),
        elapsedSeconds: 0,
      };
    }
    case 'start': {
      if (state.status === 'running') return state;
      return {
        ...state,
        status: 'running',
        startedAt: action.now,
        pausedAt: null,
        accumulatedPauseMs: 0,
        elapsedSeconds: 0,
      };
    }
    case 'pause': {
      if (state.status !== 'running') return state;
      return {
        ...state,
        status: 'paused',
        pausedAt: action.now,
      };
    }
    case 'resume': {
      if (state.status !== 'paused') return state;
      return {
        ...state,
        status: 'running',
        accumulatedPauseMs: state.accumulatedPauseMs + (action.now - state.pausedAt),
        pausedAt: null,
      };
    }
    case 'tick': {
      if (state.status !== 'running' || state.startedAt === null) return state;
      const elapsedSeconds = Math.min(
        state.durationSeconds,
        Math.floor((action.now - state.startedAt - state.accumulatedPauseMs) / 1000)
      );
      return {
        ...state,
        status: elapsedSeconds >= state.durationSeconds ? 'complete' : 'running',
        elapsedSeconds,
      };
    }
    case 'nudge': {
      const elapsedSeconds = Math.max(
        0,
        Math.min(state.durationSeconds, state.elapsedSeconds + action.seconds)
      );
      return {
        ...state,
        elapsedSeconds,
        startedAt:
          state.status === 'running' && state.startedAt !== null
            ? Date.now() - elapsedSeconds * 1000 - state.accumulatedPauseMs
            : state.startedAt,
      };
    }
    case 'stop':
      return createSessionState({ durationSeconds: state.durationSeconds });
    default:
      return state;
  }
}
