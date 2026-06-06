# Audio Fixes Design

**Date:** 2026-06-07
**Scope:** Two bug fixes in the audio layer — cue overlap on backward seek, and fade/master-volume conflict.

---

## Problem 1 — Cue overlap on backward seek

When the user seeks backward past a cue that is currently playing a long audio file, the scheduler removes that cue from `playedCueIds` so it will re-fire on the next tick. However, the previous `Audio` instance for that cue is still tracked in `AudioRegistry` and keeps playing. The next tick fires `playCue` again, creating a second instance. Both play simultaneously.

### Fix

In the scheduler `useEffect` in `App.jsx`, before calling `audioRegistry.current.playCue(cue, ...)` for any due cue, call `audioRegistry.current.stopCue(cue.id)` first. This guarantees at most one active audio instance per cue at any time, whether it is a first trigger or a re-trigger after seek.

**Changed files:** `src/App.jsx` (1 line added in the scheduler effect)

---

## Problem 2 — Fade ramp and master volume conflict

`AudioRegistry._rampVolume(audio, from, to, durationMs)` runs a `requestAnimationFrame` loop that directly writes `audio.volume`. The `from`/`to` values are pre-multiplied by `volumeScale` at the time `playCue` is called.

`AudioRegistry.applyMasterVolume(volumeScale, muted)` also directly writes `audio.volume` using `(baseVolume / 100) * volumeScale`.

When the user moves the master volume slider while a fade is in progress, both loops compete: `applyMasterVolume` sets the correct value, then the rAF from `_rampVolume` overwrites it with a stale calculation. The result is an incorrect or stuttering volume level.

### Fix — Separate `cueVolumeScale` from master volume

Each tracked entry stores its own `cueVolumeScale` (0–1), representing the cue's current volume contribution independent of the master. The actual `audio.volume` is always:

```
audio.volume = entry.cueVolumeScale * masterVolumeScale
```

Both `_rampVolume` and `applyMasterVolume` write to `audio.volume` via this formula, reading `cueVolumeScale` and the current master value respectively — they never compete.

#### Data model change

`track(cueId, audio, baseVolume)` → entry becomes:

```js
{ audio, baseVolume, cueVolumeScale }
```

- `cueVolumeScale` starts at `0` if `fadeIn > 0`, otherwise at `cue.volume / 100`

#### `_rampVolume` signature change

```js
_rampVolume(entry, fromScale, toScale, durationMs, masterVolumeScale)
```

Each rAF step:
1. Interpolates `entry.cueVolumeScale` from `fromScale` to `toScale`
2. Sets `audio.volume = entry.cueVolumeScale * masterVolumeScale`

`masterVolumeScale` is passed at call time (at the moment the fade starts). It does not track subsequent master changes mid-fade — that is handled by `applyMasterVolume` reading `entry.cueVolumeScale`.

#### `applyMasterVolume` change

```js
applyMasterVolume(volumeScale, muted) {
  this.sources.forEach((group) => {
    group.forEach((entry) => {
      entry.audio.volume = muted ? 0 : entry.cueVolumeScale * volumeScale;
    });
  });
}
```

No longer uses `baseVolume` for volume calculation. `baseVolume` is retained on entry only for potential future use (e.g., display).

#### `playCue` changes

- Passes the entry reference to `_rampVolume` instead of the raw `audio` object
- Passes `volumeScale` as `masterVolumeScale` to `_rampVolume`
- Sets `entry.cueVolumeScale` before calling `track` so the entry is consistent from the start

**Changed files:** `src/domain/audio.js` only

---

## Out of scope

- **`duration === 0` clips:** Play to natural end of file. `stopAll` is called on stop and session complete. No change needed.
- **Timing precision (250ms interval):** Acceptable for a meditation app. No change.
- **Audio pause on session pause:** Intentional — ambient audio continues during short pauses.

---

## Testing

- Existing audio tests in `src/domain/audio.test.js` must continue to pass
- New tests for `_rampVolume`: verify `cueVolumeScale` is updated correctly and `audio.volume` reflects master scale
- New test for seek overlap: verify `stopCue` is called before `playCue` in the scheduler effect (or integration test via AudioRegistry mock)
