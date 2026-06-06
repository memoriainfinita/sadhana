# Audio Fixes Design

**Date:** 2026-06-07
**Scope:** Two bug fixes in the audio layer — cue overlap on backward seek, and fade/master-volume conflict.

---

## Problem 1 — Cue overlap on backward seek

When the user seeks backward past a cue that is currently playing, the scheduler removes that cue from `playedCueIds` so it will re-fire on the next tick. The previous `Audio` instance for that cue is still tracked in `AudioRegistry` and keeps playing. The next tick fires `playCue` again, creating a second instance. Both play simultaneously.

### Fix

Before calling `playCue(cue, ...)` for any due cue, call `audioRegistry.current.stopInstance(cue.id, previousAudio)` to stop only the specific previous instance — not all instances under that ID.

**Why `stopInstance` and not `stopCue`:**
`stopCue(cue.id)` stops everything tracked under that ID. On first trigger there is nothing to stop (safe), but on re-trigger after seek, a stale `duration` setTimeout from the first play would eventually call `stopCue(cue.id)` and kill the new instance prematurely (see Duration setTimeout race below).

#### New method: `stopInstance(cueId, audio)`

```js
stopInstance(cueId, audio) {
  const group = this.sources.get(cueId);
  if (!group) return;
  const entry = [...group].find((e) => e.audio === audio);
  if (!entry) return;
  audio.pause();
  audio.currentTime = 0;
  this.untrack(cueId, entry);
}
```

#### Duration setTimeout race — fix

Currently in App.jsx:
```js
if (audio && cue.duration > 0) {
  window.setTimeout(() => audioRegistry.current.stopCue(cue.id), cue.duration * 1000);
}
```

This closes over `cue.id` but calls `stopCue`, which stops all instances. After a backward seek + re-trigger, the old timeout kills the new audio.

**Fix:** close over the specific `audio` instance and use `stopInstance`:
```js
if (audio && cue.duration > 0) {
  const captured = audio;
  window.setTimeout(
    () => audioRegistry.current.stopInstance(cue.id, captured),
    cue.duration * 1000
  );
}
```

**Changed files:** `src/domain/audio.js` (new `stopInstance` method), `src/App.jsx` (scheduler effect + duration timeout)

---

## Problem 2 — Fade ramp and master volume conflict

`AudioRegistry._rampVolume` runs a `requestAnimationFrame` loop that writes `audio.volume` using values captured at the time `playCue` is called. `applyMasterVolume` also writes `audio.volume` directly. When the user moves the master volume slider during a fade, both compete: `applyMasterVolume` sets the correct value, then the rAF step overwrites it with a stale master scale. The result is one-frame volume glitches on rapid slider movement.

### Fix — Registry holds master state; rAF reads it live

The `AudioRegistry` instance stores `_masterVolumeScale` (default `1`) and `_muted` (default `false`). `applyMasterVolume` updates these fields before iterating entries. `_rampVolume` reads `this._masterVolumeScale` and `this._muted` at every rAF step — no capture at call time. The two code paths always agree on the master value.

#### Registry state fields

```js
constructor({ basePath = '/audio/' } = {}) {
  this.basePath = basePath;
  this.sources = new Map();
  this._masterVolumeScale = 1;
  this._muted = false;
}
```

#### `applyMasterVolume` change

```js
applyMasterVolume(volumeScale, muted) {
  this._masterVolumeScale = volumeScale;
  this._muted = muted;
  this.sources.forEach((group) => {
    group.forEach((entry) => {
      entry.audio.volume = muted ? 0 : entry.cueVolumeScale * volumeScale;
    });
  });
}
```

#### Entry data model

`track` now receives a pre-built entry object:

```js
track(cueId, entry) {
  if (!this.sources.has(cueId)) this.sources.set(cueId, new Set());
  this.sources.get(cueId).add(entry);
  entry.audio.addEventListener?.('ended', () => this.untrack(cueId, entry), { once: true });
}
```

Entry shape: `{ audio, baseVolume, cueVolumeScale }`

- `cueVolumeScale` starts at `0` if `fadeIn > 0`, otherwise at `cue.volume / 100`
- `baseVolume` is retained for potential display use but no longer drives volume calculation

#### `_rampVolume` signature change

```js
_rampVolume(entry, fromScale, toScale, durationMs)
```

Each rAF step:
1. Interpolates `entry.cueVolumeScale` from `fromScale` to `toScale`
2. Sets `entry.audio.volume = this._muted ? 0 : entry.cueVolumeScale * this._masterVolumeScale`

Reading `this._masterVolumeScale` live at each step means rAF and `applyMasterVolume` never compete.

#### `playCue` changes

```js
playCue(cue, { volumeScale = 1, muted = false } = {}) {
  // ...
  const entry = {
    audio,
    baseVolume: cue.volume,
    cueVolumeScale: fadeIn > 0 ? 0 : cue.volume / 100,
  };
  // apply initial volume before tracking
  audio.volume = muted ? 0 : entry.cueVolumeScale * volumeScale;
  this.track(cue.id, entry);
  audio.play?.().catch(() => {});

  if (fadeIn > 0) {
    this._rampVolume(entry, 0, cue.volume / 100, fadeIn * 1000);
  }
  // fadeOut setTimeout uses entry.audio — no change needed
  return audio;
}
```

`playCue` still calls `applyMasterVolume`-compatible initial state: the registry's `_masterVolumeScale` and `_muted` are already set from the last `applyMasterVolume` call — but `playCue` receives `volumeScale`/`muted` as params for the first frame. To avoid a chicken-and-egg problem on first play, `playCue` sets `audio.volume` directly before calling `track`, then `_rampVolume` takes over.

#### Mute during fade — defined behavior

If the user mutes while a fade-in is in progress:
- `applyMasterVolume(scale, true)` sets `audio.volume = 0` for all entries
- The rAF loop continues updating `entry.cueVolumeScale` toward the target
- At each step, `_muted === true` → `audio.volume` stays `0`
- On unmute, `applyMasterVolume(scale, false)` is called → `audio.volume = entry.cueVolumeScale * scale`

Result: audio comes back at the current fade progress (wherever the ramp is at that moment). If the fade finished while muted, audio comes back at full cue volume. This is the expected behavior for a meditation app — mute/unmute should not reset fades.

**Changed files:** `src/domain/audio.js` only (for Problem 2)

---

## Out of scope

- **`duration === 0` clips:** Play to natural end of file. `stopAll` on stop and session complete is sufficient. No change.
- **Timing precision (250ms interval):** Acceptable for a meditation app. No change.
- **Audio pause on session pause:** Intentional — ambient audio continues during short pauses.

---

## Testing

**Problem 1:**
- `stopInstance` stops only the target audio, leaves others under the same cueId intact
- Duration timeout closes over the audio instance and uses `stopInstance`, not `stopCue`
- Backward seek + re-trigger does not produce two overlapping instances

**Problem 2:**
- `_rampVolume` reads `this._masterVolumeScale` live — changing master mid-fade takes effect within one rAF frame
- `applyMasterVolume` updates `_masterVolumeScale` before iterating entries
- Mute during fade-in: audio silenced immediately, fade progress preserved, unmute restores correct volume
- Existing audio tests pass
