# Timeline Clip Handles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add DAW-style drag handles to timeline clips so a cue's `duration`, `fadeIn`, and `fadeOut` can be edited by dragging, with always-visible fade ramps.

**Architecture:** Pure clamp/conversion logic lives in `src/domain/clip.js` (unit-tested with vitest, matching the project's domain-test pattern). A new `TrackClip.jsx` component owns the drag interaction and visual state. A small `TrackRow` wrapper inside `Timeline.jsx` gives each row its own `.track-line` ref for coordinate math. `App.jsx` wires two new callbacks through `updateCue`.

**Tech Stack:** React 19, Vite 6, vitest 3 (node environment — no jsdom, no testing-library). Pointer Events API with `setPointerCapture`.

**Spec:** `docs/superpowers/specs/2026-06-07-timeline-clip-handles-design.md`

**Divergence from spec — testing:** The spec's "Testing" section lists component integration tests (`TrackClip renders ramps`, `onResizeCue called on pointer up`). The project has **no** component-test infrastructure (no jsdom, no @testing-library/react); all 7 existing test files test pure domain logic. This plan follows the established pattern: the clamp/conversion logic is extracted to `src/domain/clip.js` and unit-tested; `TrackClip.jsx`, `Timeline.jsx`, and CSS are verified manually via the dev server. Adding component-test infra is out of scope (would introduce new dependencies not requested).

---

## File Structure

- `src/domain/clip.js` — **new.** Pure functions: `pxDeltaToSeconds`, `clampDuration`, `clampFadeIn`, `clampFadeOut`.
- `src/domain/clip.test.js` — **new.** Unit tests for the above.
- `src/components/TrackClip.jsx` — **new.** Renders one clip: ramps, content, three handles; owns drag state.
- `src/components/Timeline.jsx` — **modify.** Add `TrackRow` wrapper, switch `track-row` to `div role="button"`, render `TrackClip`, drop the `Math.max(10, ...)` width floor, add `onResizeCue`/`onFadeCue` props.
- `src/App.jsx` — **modify.** Add `handleResizeCue`/`handleFadeCue`, pass them to `Timeline`.
- `src/styles.css` — **modify.** Remove `.track-clip { min-width }`, add handle + ramp + `.dragging` styles.

---

## Task 1: Domain logic — clip.js

**Files:**
- Create: `src/domain/clip.js`
- Test: `src/domain/clip.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/domain/clip.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { pxDeltaToSeconds, clampDuration, clampFadeIn, clampFadeOut } from './clip.js';

describe('pxDeltaToSeconds', () => {
  it('converts pixel delta to seconds relative to total duration', () => {
    expect(pxDeltaToSeconds(100, 200, 600)).toBe(300);
  });
  it('returns 0 when lineWidth is 0 (avoids divide-by-zero)', () => {
    expect(pxDeltaToSeconds(100, 0, 600)).toBe(0);
  });
  it('handles negative deltas', () => {
    expect(pxDeltaToSeconds(-50, 200, 600)).toBe(-150);
  });
});

describe('clampDuration', () => {
  it('floors at 5 seconds', () => {
    expect(clampDuration(2, 0, 600)).toBe(5);
  });
  it('caps at durationSeconds - cue.time', () => {
    expect(clampDuration(999, 540, 600)).toBe(60);
  });
  it('passes through a valid value', () => {
    expect(clampDuration(120, 0, 600)).toBe(120);
  });
});

describe('clampFadeIn', () => {
  it('floors at 0', () => {
    expect(clampFadeIn(-3, 60, 10)).toBe(0);
  });
  it('caps at duration - fadeOut', () => {
    expect(clampFadeIn(999, 60, 10)).toBe(50);
  });
  it('passes through a valid value', () => {
    expect(clampFadeIn(20, 60, 10)).toBe(20);
  });
});

describe('clampFadeOut', () => {
  it('floors at 0', () => {
    expect(clampFadeOut(-3, 60, 10)).toBe(0);
  });
  it('caps at duration - fadeIn', () => {
    expect(clampFadeOut(999, 60, 10)).toBe(50);
  });
  it('passes through a valid value', () => {
    expect(clampFadeOut(20, 60, 10)).toBe(20);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/domain/clip.test.js`
Expected: FAIL — `Failed to resolve import "./clip.js"`.

- [ ] **Step 3: Write minimal implementation**

Create `src/domain/clip.js`:

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/domain/clip.test.js`
Expected: PASS — 12 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/domain/clip.js src/domain/clip.test.js
git commit -m "feat: add clip.js domain helpers for timeline clip drag"
```

---

## Task 2: App.jsx callbacks

**Files:**
- Modify: `src/App.jsx` (add handlers near `handleMoveCue` at line ~357; add props to `<Timeline>` at line ~384)

No automated test (App wiring is verified via build + manual run in Task 6). The handlers reuse `updateCue` and `setCuesWithHistory`, both already imported/defined.

- [ ] **Step 1: Add the two handlers**

In `src/App.jsx`, immediately after the `handleMoveCue` function (ends at line ~360), add:

```js
  function handleResizeCue(cueId, newDuration) {
    setCuesWithHistory((current) =>
      current.map((cue) => {
        if (cue.id !== cueId) return cue;
        // Keep fades within the new duration so audio stays valid.
        const fadeOut = Math.min(cue.fadeOut, newDuration);
        const fadeIn = Math.min(cue.fadeIn, newDuration - fadeOut);
        return { ...cue, duration: newDuration, fadeIn, fadeOut };
      })
    );
  }

  function handleFadeCue(cueId, updates) {
    setCuesWithHistory((current) => updateCue(current, cueId, updates));
  }
```

- [ ] **Step 2: Pass the handlers to Timeline**

In the `<Timeline ... />` JSX (line ~384), add two props after `onMoveCue={handleMoveCue}`:

```jsx
      onMoveCue={handleMoveCue}
      onResizeCue={handleResizeCue}
      onFadeCue={handleFadeCue}
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: build succeeds (no unused-var or syntax errors). The new props are not yet consumed by `Timeline` — that is Task 4.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add resize/fade cue handlers in App"
```

---

## Task 3: TrackClip component

**Files:**
- Create: `src/components/TrackClip.jsx`

No automated test (no component-test infra — see plan header). Verified in Task 6.

- [ ] **Step 1: Create the component**

Create `src/components/TrackClip.jsx`:

```jsx
import { useRef, useState } from 'react';
import { formatClockTime } from '../domain/cues.js';
import { pxDeltaToSeconds, clampDuration, clampFadeIn, clampFadeOut } from '../domain/clip.js';

export function TrackClip({
  cue,
  durationSeconds,
  selected,
  trackLineRef,
  onSelect,
  onResizeCue,
  onFadeCue,
}) {
  const [dragType, setDragType] = useState(null); // null | 'resize' | 'fadeIn' | 'fadeOut'
  const [localDuration, setLocalDuration] = useState(cue.duration);
  const [localFadeIn, setLocalFadeIn] = useState(cue.fadeIn);
  const [localFadeOut, setLocalFadeOut] = useState(cue.fadeOut);
  const dragOrigin = useRef({
    startX: 0,
    startDuration: 0,
    startFadeIn: 0,
    startFadeOut: 0,
    lineWidth: 0,
  });

  // While dragging, render from local state; otherwise from the cue.
  const duration = dragType ? localDuration : cue.duration;
  const fadeIn = dragType ? localFadeIn : cue.fadeIn;
  const fadeOut = dragType ? localFadeOut : cue.fadeOut;

  function beginDrag(type, event) {
    event.stopPropagation();
    onSelect();
    const lineWidth = trackLineRef.current?.getBoundingClientRect().width ?? 0;
    dragOrigin.current = {
      startX: event.clientX,
      startDuration: cue.duration,
      startFadeIn: cue.fadeIn,
      startFadeOut: cue.fadeOut,
      lineWidth,
    };
    setLocalDuration(cue.duration);
    setLocalFadeIn(cue.fadeIn);
    setLocalFadeOut(cue.fadeOut);
    setDragType(type);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragType) return;
    const { startX, startDuration, startFadeIn, startFadeOut, lineWidth } = dragOrigin.current;
    const delta = pxDeltaToSeconds(event.clientX - startX, lineWidth, durationSeconds);
    // Only one handle drags at a time, so the other fields stay at their start values.
    if (dragType === 'resize') {
      setLocalDuration(clampDuration(startDuration + delta, cue.time, durationSeconds));
    } else if (dragType === 'fadeIn') {
      setLocalFadeIn(clampFadeIn(startFadeIn + delta, startDuration, startFadeOut));
    } else if (dragType === 'fadeOut') {
      setLocalFadeOut(clampFadeOut(startFadeOut - delta, startDuration, startFadeIn));
    }
  }

  function endDrag() {
    if (!dragType) return;
    if (dragType === 'resize') onResizeCue(cue.id, Math.round(localDuration));
    else if (dragType === 'fadeIn') onFadeCue(cue.id, { fadeIn: Math.round(localFadeIn) });
    else if (dragType === 'fadeOut') onFadeCue(cue.id, { fadeOut: Math.round(localFadeOut) });
    setDragType(null);
  }

  function cancelDrag() {
    setDragType(null);
  }

  const clipWidth = (duration / durationSeconds) * 100;
  const rampInWidth = duration > 0 ? (fadeIn / duration) * 100 : 0;
  const rampOutWidth = duration > 0 ? (fadeOut / duration) * 100 : 0;

  const handleEvents = (type) => ({
    onPointerDown: (e) => beginDrag(type, e),
    onPointerMove: handlePointerMove,
    onPointerUp: endDrag,
    onPointerCancel: cancelDrag,
  });

  const className = `track-clip${selected ? ' selected' : ''}${dragType ? ' dragging' : ''}`;

  return (
    <div
      className={className}
      style={{
        left: `${(cue.time / durationSeconds) * 100}%`,
        width: `${clipWidth}%`,
        '--cue-color': cue.color,
      }}
    >
      <div className="clip-ramp-in" style={{ width: `${rampInWidth}%` }} />
      <div className="clip-ramp-out" style={{ width: `${rampOutWidth}%` }} />
      <span>{formatClockTime(cue.time)}</span>
      <strong>{cue.name}</strong>
      <div className="clip-fade-in-handle" {...handleEvents('fadeIn')} />
      <div className="clip-fade-out-handle" {...handleEvents('fadeOut')} />
      <div className="clip-resize-handle" {...handleEvents('resize')} />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: build succeeds. Component is not yet rendered (Task 4 wires it).

- [ ] **Step 3: Commit**

```bash
git add src/components/TrackClip.jsx
git commit -m "feat: add TrackClip component with resize and fade drag handles"
```

---

## Task 4: Wire TrackClip into Timeline

**Files:**
- Modify: `src/components/Timeline.jsx` (import, props, the `.tracks` block at lines 135-158)

- [ ] **Step 1: Add import and props**

At the top of `src/components/Timeline.jsx`, add the import after the existing imports:

```js
import { TrackClip } from './TrackClip.jsx';
```

Add `onResizeCue` and `onFadeCue` to the destructured props of `Timeline` (after `onMoveCue`):

```js
  onMoveCue,
  onResizeCue,
  onFadeCue,
```

- [ ] **Step 2: Add the TrackRow subcomponent**

At the bottom of `src/components/Timeline.jsx`, after the `Timeline` function's closing brace, add:

```jsx
function TrackRow({ cue, selected, durationSeconds, onSelectCue, onResizeCue, onFadeCue }) {
  const lineRef = useRef(null);

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectCue(cue.id);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={selected ? 'track-row selected' : 'track-row'}
      onClick={() => onSelectCue(cue.id)}
      onKeyDown={handleKeyDown}
    >
      <div className="track-line" ref={lineRef}>
        <TrackClip
          cue={cue}
          durationSeconds={durationSeconds}
          selected={selected}
          trackLineRef={lineRef}
          onSelect={() => onSelectCue(cue.id)}
          onResizeCue={onResizeCue}
          onFadeCue={onFadeCue}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace the `.tracks` map**

Replace the entire `.tracks` block (lines 135-158, the `<div className="tracks">...</div>`) with:

```jsx
      <div className="tracks">
        {visibleCues.map((cue) => (
          <TrackRow
            key={cue.id}
            cue={cue}
            selected={cue.id === selectedCueId}
            durationSeconds={durationSeconds}
            onSelectCue={onSelectCue}
            onResizeCue={onResizeCue}
            onFadeCue={onFadeCue}
          />
        ))}
      </div>
```

This drops the old inline `.track-clip` (which used `width: Math.max(10, ...)`). `TrackClip` now renders width as the exact `(duration / durationSeconds) * 100%`.

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: build succeeds, no unused-import warnings (`useRef` is already imported on line 1).

- [ ] **Step 5: Run the full test suite (regression)**

Run: `pnpm test -- --run`
Expected: all existing tests still pass plus the 12 new clip tests (61 total).

- [ ] **Step 6: Commit**

```bash
git add src/components/Timeline.jsx
git commit -m "feat: render TrackClip with per-row track-line ref in Timeline"
```

---

## Task 5: CSS — handles, ramps, remove min-width

**Files:**
- Modify: `src/styles.css` (the `.track-clip` block at lines 710-738)

- [ ] **Step 1: Remove the min-width floor**

In `src/styles.css`, in the `.track-clip` rule (starts line 710), delete the line:

```css
  min-width: 92px;
```

- [ ] **Step 2: Add handle, ramp, and dragging styles**

After the `.track-clip strong { ... }` rule (ends ~line 738), add:

```css
.track-clip.selected {
  border-color: color-mix(in srgb, var(--cue-color) 90%, transparent);
}

.clip-ramp-in,
.clip-ramp-out {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
}

.clip-ramp-in {
  left: 0;
  background: linear-gradient(to right, transparent, color-mix(in srgb, var(--cue-color) 40%, transparent));
}

.clip-ramp-out {
  right: 0;
  background: linear-gradient(to left, transparent, color-mix(in srgb, var(--cue-color) 40%, transparent));
}

.track-clip span,
.track-clip strong {
  position: relative;
  z-index: 1;
}

.clip-resize-handle,
.clip-fade-in-handle,
.clip-fade-out-handle {
  position: absolute;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.12s ease;
  touch-action: none;
}

.track-clip:hover .clip-resize-handle,
.track-clip:hover .clip-fade-in-handle,
.track-clip:hover .clip-fade-out-handle,
.track-clip.dragging .clip-resize-handle,
.track-clip.dragging .clip-fade-in-handle,
.track-clip.dragging .clip-fade-out-handle {
  opacity: 1;
}

.clip-resize-handle {
  top: 14px;
  bottom: 0;
  right: 0;
  width: 8px;
  cursor: ew-resize;
  background: color-mix(in srgb, var(--cue-color) 70%, transparent);
}

.clip-fade-in-handle {
  top: 0;
  left: 0;
  width: 14px;
  height: 14px;
  cursor: ew-resize;
  background: color-mix(in srgb, var(--cue-color) 70%, transparent);
  border-bottom-right-radius: 4px;
}

.clip-fade-out-handle {
  top: 0;
  right: 0;
  width: 14px;
  height: 14px;
  cursor: ew-resize;
  background: color-mix(in srgb, var(--cue-color) 70%, transparent);
  border-bottom-left-radius: 4px;
}
```

- [ ] **Step 2b: Verify build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "style: add clip handle and fade ramp styles, drop clip min-width"
```

---

## Task 6: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Per project memory (Windows), launch with PowerShell `Start-Process`, not the Bash background runner:

```powershell
Start-Process pnpm -ArgumentList 'dev' -WorkingDirectory 'D:\DOCS\CODELAB\1_in-progress\sadhana-v0'
```

Open `http://127.0.0.1:5173/` and go to the **Diseñar** mode.

- [ ] **Step 2: Verify each interaction**

Check, for a cue in the timeline tracks:
- Hovering a clip reveals three handles (top-left, top-right, right edge).
- Dragging the **right edge** changes the clip width; releasing updates the cue duration (visible in the inspector and on the clip time/width).
- Dragging the **top-left** handle right grows the left fade ramp; the inspector `fadeIn` updates on release.
- Dragging the **top-right** handle left grows the right fade ramp; the inspector `fadeOut` updates on release.
- Fade ramps are visible at all times (not only on hover), shaded in the cue color.
- A short cue renders as a thin clip (no artificial min-width), and its right edge sits at the correct time on the ruler.
- Clicking a clip/row (without dragging) still selects the cue; keyboard Tab + Enter/Space on a row selects it.
- The marker drag (top `cue-map`) and playhead seek still work unchanged.
- Resizing a clip smaller than its fades does not produce `fadeIn`/`fadeOut` larger than `duration` (inspector values stay valid).

- [ ] **Step 3: Stop the dev server**

Close the PowerShell window / stop the process started in Step 1.

- [ ] **Step 4: Update state.md**

Add a History entry (date 2026-06-13) summarizing: clip handles implemented (resize + fadeIn/fadeOut drag), `src/domain/clip.js` with clamps, `TrackClip.jsx` + `TrackRow`, min-width removed, test count. Mark the two timeline TODOs (`clips redimensionables`, `handles de fade`) as `[x]`.

- [ ] **Step 5: Commit**

```bash
git add state.md
git commit -m "docs: update state after timeline clip handles"
```
```

---

## Notes on edge cases (already handled in tasks)

- **Divide-by-zero:** `pxDeltaToSeconds` returns 0 if `lineWidth` is 0 (Task 1).
- **Resize below fades:** `handleResizeCue` (Task 2) shrinks `fadeOut` then `fadeIn` to fit the new duration.
- **Stale state during drag:** fade clamps read start values from `dragOrigin` (constants during a single-handle drag), not live local state (Task 3).
- **Nested interactive elements:** `track-row` becomes `div role="button"` so handle `div`s are not illegally nested inside a `<button>` (Task 4).
