// Pure helpers for timeline clip drag interactions.
// All values are in seconds; durationSeconds is the total preset length.

export function pxDeltaToSeconds(deltaPx, lineWidth, durationSeconds) {
  if (!lineWidth || lineWidth <= 0) return 0;
  return (deltaPx / lineWidth) * durationSeconds;
}

export function clampDuration(duration, cueTime, durationSeconds) {
  const max = durationSeconds - cueTime;
  return Math.min(Math.max(5, duration), max);
}

export function clampFadeIn(fadeIn, duration, fadeOut) {
  const max = Math.max(0, duration - fadeOut);
  return Math.min(Math.max(0, fadeIn), max);
}

export function clampFadeOut(fadeOut, duration, fadeIn) {
  const max = Math.max(0, duration - fadeIn);
  return Math.min(Math.max(0, fadeOut), max);
}
