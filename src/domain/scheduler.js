export function createCueSchedulerState(playedCueIds = []) {
  return {
    playedCueIds: new Set(playedCueIds),
  };
}

export function resetCueScheduler() {
  return createCueSchedulerState();
}

export function getDueCues(cues, schedulerState, elapsedSeconds) {
  const playedCueIds = new Set(schedulerState.playedCueIds);
  const due = cues
    .filter((cue) => cue.time <= elapsedSeconds && !playedCueIds.has(cue.id))
    .sort((a, b) => a.time - b.time);

  due.forEach((cue) => playedCueIds.add(cue.id));

  return {
    due,
    state: { playedCueIds },
  };
}
