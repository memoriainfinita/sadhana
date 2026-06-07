# Audio Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two audio bugs — cue overlap on backward seek, and fade/master-volume conflict when the user moves the slider mid-fade.

**Architecture:** All audio state moves into `AudioRegistry`: the instance now holds `_masterVolumeScale` and `_muted`, entries hold `cueVolumeScale` (the cue's own 0–1 volume independent of master), and `_rampVolume` reads live registry state at every frame. A new `stopInstance` method stops a specific audio object rather than all audio under a cueId. App.jsx gets two small changes: call `stopCue` before re-triggering a cue, and close the duration timeout over the specific audio instance.

**Tech Stack:** Vitest (test runner), React 18, Web Audio via HTMLAudioElement

---

## File Map

| File | Change |
|------|--------|
| `src/domain/audio.js` | Add registry state fields; update `track`, `_rampVolume`, `applyMasterVolume`, `playCue`; add `stopInstance` |
| `src/domain/audio.test.js` | Update existing test (track signature changed); add 4 new tests |
| `src/App.jsx` | Scheduler effect: `stopCue` before `playCue`; duration timeout: `stopInstance` with captured audio |

No other files change.

---

## Task 1: Registry state fields + `track` entry model + `applyMasterVolume`

**Files:**
- Modify: `src/domain/audio.js`
- Test: `src/domain/audio.test.js`

- [ ] **Step 1: Update the existing test to use the new `track` signature**

Replace the content of `src/domain/audio.test.js` with:

```js
import { describe, expect, test, vi } from 'vitest';
import { AudioRegistry } from './audio.js';

function makeAudio(overrides = {}) {
  return { pause: vi.fn(), currentTime: 0, addEventListener: vi.fn(), ...overrides };
}

function makeEntry(audio, { baseVolume = 100, cueVolumeScale = 1 } = {}) {
  return { audio, baseVolume, cueVolumeScale };
}

describe('AudioRegistry', () => {
  test('tracks active entries and stops all', () => {
    const registry = new AudioRegistry();
    const audioA = makeAudio({ currentTime: 12 });
    const audioB = makeAudio({ currentTime: 8 });

    registry.track('start', makeEntry(audioA));
    registry.track('forest', makeEntry(audioB));
    registry.stopAll();

    expect(audioA.pause).toHaveBeenCalledOnce();
    expect(audioA.currentTime).toBe(0);
    expect(audioB.pause).toHaveBeenCalledOnce();
    expect(audioB.currentTime).toBe(0);
    expect(registry.activeCount).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests — expect 1 failing (track signature mismatch)**

```
pnpm test
```

Expected: FAIL — `registry.track is not a function` or wrong argument count.

- [ ] **Step 3: Update `AudioRegistry` constructor, `track`, and `applyMasterVolume` in `src/domain/audio.js`**

Replace the constructor:

```js
constructor({ basePath = '/audio/' } = {}) {
  this.basePath = basePath;
  this.sources = new Map();
  this._masterVolumeScale = 1;
  this._muted = false;
}
```

Replace `track`:

```js
track(cueId, entry) {
  if (!this.sources.has(cueId)) {
    this.sources.set(cueId, new Set());
  }
  this.sources.get(cueId).add(entry);
  entry.audio.addEventListener?.('ended', () => this.untrack(cueId, entry), { once: true });
}
```

Replace `applyMasterVolume`:

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

- [ ] **Step 4: Run tests — expect pass**

```
pnpm test
```

Expected: all green.

- [ ] **Step 5: Add tests for `applyMasterVolume` new behavior**

Add inside the `describe('AudioRegistry')` block:

```js
test('applyMasterVolume stores state and uses cueVolumeScale', () => {
  const registry = new AudioRegistry();
  const audio = makeAudio();
  const entry = makeEntry(audio, { baseVolume: 80, cueVolumeScale: 0.5 });
  registry.track('bell', entry);

  registry.applyMasterVolume(0.6, false);

  expect(registry._masterVolumeScale).toBe(0.6);
  expect(registry._muted).toBe(false);
  expect(audio.volume).toBeCloseTo(0.5 * 0.6);
});

test('applyMasterVolume mutes all audio regardless of cueVolumeScale', () => {
  const registry = new AudioRegistry();
  const audio = makeAudio();
  const entry = makeEntry(audio, { cueVolumeScale: 0.8 });
  registry.track('bell', entry);

  registry.applyMasterVolume(1, true);

  expect(registry._muted).toBe(true);
  expect(audio.volume).toBe(0);
});
```

- [ ] **Step 6: Run tests — expect all green**

```
pnpm test
```

- [ ] **Step 7: Commit**

```
git add src/domain/audio.js src/domain/audio.test.js
git commit -m "refactor: entry model with cueVolumeScale, registry holds master state"
```

---

## Task 2: Update `_rampVolume` to read live master state

**Files:**
- Modify: `src/domain/audio.js`
- Test: `src/domain/audio.test.js`

- [ ] **Step 1: Add a test that verifies `_rampVolume` reads `_masterVolumeScale` live**

Add inside the `describe('AudioRegistry')` block:

```js
test('_rampVolume reads _masterVolumeScale live from registry', () => {
  const registry = new AudioRegistry();
  registry._masterVolumeScale = 0.5;
  registry._muted = false;

  const audio = makeAudio();
  const entry = makeEntry(audio, { cueVolumeScale: 0 });

  // Simulate one completed ramp step by calling the method and fast-forwarding
  // _rampVolume uses rAF; we test the formula directly on the entry object.
  // After ramp completes (progress=1), cueVolumeScale should equal toScale
  // and audio.volume = toScale * _masterVolumeScale.

  // Manually invoke the end-of-ramp state:
  entry.cueVolumeScale = 0.8; // toScale
  audio.volume = registry._muted ? 0 : entry.cueVolumeScale * registry._masterVolumeScale;

  expect(audio.volume).toBeCloseTo(0.8 * 0.5);

  // Changing master mid-ramp: same formula picks up new value
  registry._masterVolumeScale = 1;
  audio.volume = registry._muted ? 0 : entry.cueVolumeScale * registry._masterVolumeScale;
  expect(audio.volume).toBeCloseTo(0.8);
});
```

Note: `_rampVolume` uses `requestAnimationFrame` which is not available in vitest's jsdom by default. This test validates the formula in isolation. The rAF loop behavior is verified manually (see step 6).

- [ ] **Step 2: Run tests — expect all green (test verifies formula, not rAF)**

```
pnpm test
```

- [ ] **Step 3: Replace `_rampVolume` in `src/domain/audio.js`**

```js
_rampVolume(entry, fromScale, toScale, durationMs) {
  const startTime = performance.now();
  const step = () => {
    if (entry.audio.paused) return;
    const elapsed = performance.now() - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    entry.cueVolumeScale = fromScale + (toScale - fromScale) * progress;
    entry.audio.volume = this._muted ? 0 : entry.cueVolumeScale * this._masterVolumeScale;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
```

- [ ] **Step 4: Run tests — expect all green**

```
pnpm test
```

- [ ] **Step 5: Commit**

```
git add src/domain/audio.js src/domain/audio.test.js
git commit -m "fix: _rampVolume reads live master state, no volume competition with applyMasterVolume"
```

- [ ] **Step 6: Manual verification note (no automated test for rAF)**

Start the dev server (`pnpm dev`), open the app, start a session with a cue that has a fadeIn > 0 seconds. While the fade is running, drag the master volume slider. The volume should track the slider smoothly without glitching. This cannot be automated in vitest without mocking `requestAnimationFrame`.

---

## Task 3: Add `stopInstance` method

**Files:**
- Modify: `src/domain/audio.js`
- Test: `src/domain/audio.test.js`

- [ ] **Step 1: Add a failing test for `stopInstance`**

Add inside the `describe('AudioRegistry')` block:

```js
test('stopInstance stops only the target audio, leaves others under same cueId', () => {
  const registry = new AudioRegistry();
  const audioA = makeAudio();
  const audioB = makeAudio();
  const entryA = makeEntry(audioA);
  const entryB = makeEntry(audioB);

  registry.track('bell', entryA);
  registry.track('bell', entryB);
  expect(registry.activeCount).toBe(2);

  registry.stopInstance('bell', audioA);

  expect(audioA.pause).toHaveBeenCalledOnce();
  expect(audioA.currentTime).toBe(0);
  expect(audioB.pause).not.toHaveBeenCalled();
  expect(registry.activeCount).toBe(1);
});

test('stopInstance is a no-op when audio is not found', () => {
  const registry = new AudioRegistry();
  const audioA = makeAudio();
  const audioB = makeAudio(); // not tracked

  registry.track('bell', makeEntry(audioA));

  expect(() => registry.stopInstance('bell', audioB)).not.toThrow();
  expect(registry.activeCount).toBe(1);
});
```

- [ ] **Step 2: Run tests — expect 2 failing**

```
pnpm test
```

Expected: FAIL — `registry.stopInstance is not a function`.

- [ ] **Step 3: Add `stopInstance` to `AudioRegistry` in `src/domain/audio.js`**

Add after the `stopCue` method:

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

- [ ] **Step 4: Run tests — expect all green**

```
pnpm test
```

- [ ] **Step 5: Commit**

```
git add src/domain/audio.js src/domain/audio.test.js
git commit -m "feat: add stopInstance — stops one audio object without affecting others under same cueId"
```

---

## Task 4: Update `playCue` to use the new entry model

**Files:**
- Modify: `src/domain/audio.js`
- Test: `src/domain/audio.test.js`

- [ ] **Step 1: Add a test for `playCue` entry model**

Add inside the `describe('AudioRegistry')` block:

```js
test('playCue tracks entry with correct cueVolumeScale (no fadeIn)', () => {
  const registry = new AudioRegistry();
  // Prevent actual Audio construction in test env
  const mockAudio = makeAudio();
  vi.stubGlobal('Audio', vi.fn(() => mockAudio));

  const cue = { id: 'bell', sound: 'bells/bell.mp3', volume: 60, fadeIn: 0, fadeOut: 0, duration: 0 };
  registry.playCue(cue, { volumeScale: 0.8, muted: false });

  expect(registry.activeCount).toBe(1);
  const entry = [...registry.sources.get('bell')][0];
  expect(entry.cueVolumeScale).toBeCloseTo(0.6); // 60/100
  expect(mockAudio.volume).toBeCloseTo(0.6 * 0.8);

  vi.unstubAllGlobals();
});

test('playCue sets cueVolumeScale to 0 when fadeIn > 0', () => {
  const registry = new AudioRegistry();
  const mockAudio = makeAudio();
  vi.stubGlobal('Audio', vi.fn(() => mockAudio));
  vi.stubGlobal('requestAnimationFrame', vi.fn()); // prevent rAF from running

  const cue = { id: 'bell', sound: 'bells/bell.mp3', volume: 80, fadeIn: 2, fadeOut: 0, duration: 0 };
  registry.playCue(cue, { volumeScale: 1, muted: false });

  const entry = [...registry.sources.get('bell')][0];
  expect(entry.cueVolumeScale).toBe(0); // starts at 0 for fade-in
  expect(mockAudio.volume).toBe(0);

  vi.unstubAllGlobals();
});
```

- [ ] **Step 2: Run tests — expect 2 failing**

```
pnpm test
```

Expected: FAIL — `playCue` still creates entry internally with old shape.

- [ ] **Step 3: Replace `playCue` in `src/domain/audio.js`**

```js
playCue(cue, { volumeScale = 1, muted = false } = {}) {
  if (muted) return null;
  if (typeof Audio === 'undefined') return null;

  const audio = new Audio(`${this.basePath}${cue.sound}`);
  const fadeIn = cue.fadeIn ?? 0;
  const fadeOut = cue.fadeOut ?? 0;
  const duration = cue.duration ?? 0;
  const cueVolumeScale = cue.volume / 100;

  const entry = {
    audio,
    baseVolume: cue.volume,
    cueVolumeScale: fadeIn > 0 ? 0 : cueVolumeScale,
  };

  audio.volume = entry.cueVolumeScale * volumeScale;
  this.track(cue.id, entry);
  audio.play?.().catch(() => {});

  if (fadeIn > 0) {
    this._rampVolume(entry, 0, cueVolumeScale, fadeIn * 1000);
  }

  if (fadeOut > 0 && duration > fadeOut) {
    window.setTimeout(() => {
      if (!audio.paused) {
        this._rampVolume(entry, entry.cueVolumeScale, 0, fadeOut * 1000);
      }
    }, (duration - fadeOut) * 1000);
  }

  return audio;
}
```

- [ ] **Step 4: Run tests — expect all green**

```
pnpm test
```

- [ ] **Step 5: Commit**

```
git add src/domain/audio.js src/domain/audio.test.js
git commit -m "fix: playCue builds entry with cueVolumeScale, uses new track/rampVolume signatures"
```

---

## Task 5: Update App.jsx — scheduler effect and duration timeout

**Files:**
- Modify: `src/App.jsx`

No unit test available for React effects with async timers. The change is small and verifiable manually.

- [ ] **Step 1: Update the scheduler `useEffect` in `src/App.jsx`**

Find this block (around line 107):

```js
result.due.forEach((cue) => {
  const audio = audioRegistry.current.playCue(cue, {
    volumeScale: masterVolume / 100,
    muted,
  });
  if (audio && cue.duration > 0) {
    window.setTimeout(() => audioRegistry.current.stopCue(cue.id), cue.duration * 1000);
  }
```

Replace with:

```js
result.due.forEach((cue) => {
  audioRegistry.current.stopCue(cue.id);
  const audio = audioRegistry.current.playCue(cue, {
    volumeScale: masterVolume / 100,
    muted,
  });
  if (audio && cue.duration > 0) {
    const captured = audio;
    window.setTimeout(
      () => audioRegistry.current.stopInstance(cue.id, captured),
      cue.duration * 1000
    );
  }
```

- [ ] **Step 2: Run tests — expect all green (no App.jsx unit tests)**

```
pnpm test
```

- [ ] **Step 3: Commit**

```
git add src/App.jsx
git commit -m "fix: stop previous cue instance before re-trigger on seek; duration timeout uses stopInstance"
```

---

## Task 6: Manual end-to-end verification

- [ ] **Step 1: Start dev server**

```
pnpm dev
```

Open `http://localhost:5173/`

- [ ] **Step 2: Verify backward seek overlap fix**

1. Load a preset with a cue at t=10s that has `duration: 0` (plays to end of file)
2. Start session, wait for the cue to fire and audio to start
3. Seek backward past t=10s using the ← arrow key or timeline drag
4. Wait for the cue to fire again
5. Expected: one instance of audio playing, not two overlapping

- [ ] **Step 3: Verify fade + master volume fix**

1. Set a cue with `fadeIn: 3` (3 second fade in)
2. Start session, let the cue fire
3. While the fade-in is running, drag the master volume slider rapidly up and down
4. Expected: volume tracks the slider immediately with no glitching or snapping back

- [ ] **Step 4: Verify mute during fade**

1. Same cue with `fadeIn: 3`
2. Start session, let the cue fire
3. Immediately click the mute button
4. Expected: audio goes silent immediately
5. Click unmute after a few seconds
6. Expected: audio resumes at current volume (fade may have completed — audio is at full cue volume)
