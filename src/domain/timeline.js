export function createTimelineTicks(durationSeconds, divisions = 4) {
  const safeDuration = Math.max(60, Number(durationSeconds) || 60);
  const safeDivisions = Math.max(1, Number(divisions) || 1);

  return Array.from({ length: safeDivisions + 1 }, (_, index) =>
    Math.round((safeDuration / safeDivisions) * index)
  );
}
