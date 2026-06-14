// Pure keyboard step resolver shared by the timeline playhead and cue markers.
// Returns the next clamped value, or null if the key is not one we handle
// (so the caller can let the event bubble / do nothing).
export function stepFromKey(current, key, { min, max, step }) {
  let next;
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      next = current + step;
      break;
    case 'ArrowLeft':
    case 'ArrowDown':
      next = current - step;
      break;
    case 'Home':
      next = min;
      break;
    case 'End':
      next = max;
      break;
    default:
      return null;
  }
  return Math.max(min, Math.min(max, next));
}
