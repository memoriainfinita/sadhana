# Timeline Clip Handles — Design Spec

**Date:** 2026-06-07
**Status:** approved

## Overview

Add interactive handles to timeline track clips:
- **Resize handle** (right edge): drag horizontally to change `duration`
- **FadeIn handle** (top-left corner): drag right to increase `fadeIn`
- **FadeOut handle** (top-right corner): drag left to increase `fadeOut`

Fade ramps (shaded overlays) are always visible inside the clip. Handles appear on hover.

## Architecture

### New component: `TrackClip.jsx`

Extracted from the `.track-clip` of `Timeline.jsx`. The real DOM hierarchy is three levels: `.track-row` > `.track-line` > `.track-clip`. `TrackClip` renders the clip and owns all drag logic and visual state.

**Props:**
```js
{
  cue,             // full cue object
  durationSeconds, // total preset duration
  selected,        // boolean
  trackLineRef,    // ref to THIS row's .track-line (for coordinate math)
  onSelect,        // () => void
  onResizeCue,     // (id, newDuration) => void
  onFadeCue,       // (id, { fadeIn?, fadeOut? }) => void
}
```

**Coordinate container:** px→seconds conversion uses the `.track-line` rect, not `.tracks`. `.track-row` has `padding: 0 30px` (styles.css), so `.tracks` width includes 60px of padding that does not represent time. `.track-line` is the element whose full width maps to `durationSeconds`. The ref is per-row (created inside the row `.map()` or via a callback ref), not a single shared container ref.

**Local state:**
```js
dragType: null | 'resize' | 'fadeIn' | 'fadeOut'
localDuration: number   // mirrors cue.duration during drag
localFadeIn:   number   // mirrors cue.fadeIn during drag
localFadeOut:  number   // mirrors cue.fadeOut during drag
```

**Drag origin ref** (not state — avoids re-renders):
```js
dragOrigin = useRef({ startX: 0, startDuration: 0, startFadeIn: 0, startFadeOut: 0, lineWidth: 0 })
```
Populated on `pointerDown` with `event.clientX`, the cue's current values, and `trackLineRef.current.getBoundingClientRect().width` (captured once at drag start). Read on every `pointerMove` to compute deltas — no further `getBoundingClientRect` calls during the drag.

Local state (`localDuration`, `localFadeIn`, `localFadeOut`) is initialized from `cue` on `pointerDown` and cleared on `pointerUp`/`pointerCancel`. On `pointerUp`, the relevant callback is called with the final value.

### Changes to `Timeline.jsx`

- `track-row` changes from `<button>` to `<div role="button" tabIndex={0}>` with `onClick` and `onKeyDown` (Enter/Space) — required to allow nested interactive elements (div-based handles).
- The `.track-clip` (currently rendered inline inside `.track-line`) is replaced by `<TrackClip ... />`. The `.track-line` wrapper stays.
- The clip width drops the `Math.max(10, ...)` floor: `width: (cue.duration / durationSeconds) * 100%`. So the clip's right edge corresponds exactly to `time + duration`, which the resize handle and fade ramps depend on.
- Two new props added to `Timeline`: `onResizeCue`, `onFadeCue`.
- Each row gets its own `.track-line` ref (callback ref or per-row ref), passed to that row's `TrackClip` as `trackLineRef`. No shared `tracksRef`.

### Changes to `App.jsx`

```js
function handleResizeCue(id, newDuration) {
  setCues(updateCue(cues, id, { duration: newDuration }));
}

function handleFadeCue(id, updates) {
  setCues(updateCue(cues, id, updates));
}
```

Both use the existing `updateCue` utility from `cues.js`.

## Handles

Three `<div>` elements inside `.track-clip`, each with `onPointerDown`. Pointer capture (`setPointerCapture`) is used for reliable drag across the full track width.

**Event handler placement:** `onPointerMove` and `onPointerUp`/`onPointerCancel` are registered on each handle element (same element that holds `onPointerDown`). With pointer capture active, all pointer events are routed to the capturing element regardless of where the pointer moves. `onPointerCancel` clears `dragType` and local state the same way as `onPointerUp` (without calling any callback).

**Selection on handle click:** each handle calls `onSelect()` in its `onPointerDown` before capturing the pointer. This ensures the cue is selected even when the user clicks a handle without dragging. No `stopPropagation` needed — pointer capture redirects subsequent events to the handle, so the row div's `onClick` never fires during a drag.

### Resize handle (`.clip-resize-handle`)
- Position: `right: 0`, full height, ~8px wide
- Cursor: `ew-resize`
- Drag calculation (`lineWidth` and `startX` captured in `dragOrigin` at pointerDown):
  ```
  deltaSeconds = (event.clientX - startX) / lineWidth * durationSeconds
  newDuration = clamp(startDuration + deltaSeconds, 5, durationSeconds - cue.time)
  ```

### FadeIn handle (`.clip-fade-in-handle`)
- Position: `left: 0, top: 0`, ~14×14px
- Cursor: `ew-resize`
- Drag right increases fadeIn:
  ```
  deltaSeconds = (event.clientX - startX) / lineWidth * durationSeconds
  newFadeIn = clamp(startFadeIn + deltaSeconds, 0, localDuration - localFadeOut)
  ```

### FadeOut handle (`.clip-fade-out-handle`)
- Position: `right: 0, top: 0`, ~14×14px (behind resize handle in z-index, or offset)
- Cursor: `ew-resize`
- Drag left increases fadeOut:
  ```
  deltaSeconds = -(event.clientX - startX) / lineWidth * durationSeconds
  newFadeOut = clamp(startFadeOut + deltaSeconds, 0, localDuration - localFadeIn)
  ```

**Handle visibility:** `opacity: 0` by default. Visible (`opacity: 1`) when `.track-clip:hover` or when `dragType !== null` (via a `.dragging` class on the clip root).

## Fade Ramp Visualization

Two absolutely-positioned `<div>` elements inside `.track-clip`, always visible. The clip has `overflow: hidden` so ramps are clipped naturally.

```
.clip-ramp-in
  position: absolute
  left: 0, top: 0, bottom: 0
  width: (fadeIn / duration) * 100%
  background: linear-gradient(to right, transparent, rgba(cueColor, 0.4))
  pointer-events: none

.clip-ramp-out
  position: absolute
  right: 0, top: 0, bottom: 0
  width: (fadeOut / duration) * 100%
  background: linear-gradient(to left, transparent, rgba(cueColor, 0.4))
  pointer-events: none
```

During drag, ramp widths update from local state.

## Constraints

| Field | Min | Max |
|-------|-----|-----|
| `duration` | 5s | `durationSeconds - cue.time` |
| `fadeIn` | 0 | `duration - fadeOut` |
| `fadeOut` | 0 | `duration - fadeIn` |

All clamps applied on every pointer move during drag.

## Handle z-index and overlap

The resize handle (right edge) and fadeOut handle (top-right corner) share the right side of the clip. FadeOut handle sits at `top: 0` with limited height (~14px); resize handle covers full height. The top-right 14×14 zone is reserved for fadeOut — the resize handle starts below it (`top: 14px`) to avoid conflict. If the clip is shorter than ~28px tall, handles collapse gracefully (not a concern at current 30px clip height).

## CSS additions

```css
.clip-ramp-in, .clip-ramp-out   /* fade overlays, always visible */
.clip-resize-handle              /* right edge drag zone */
.clip-fade-in-handle             /* top-left corner drag zone */
.clip-fade-out-handle            /* top-right corner drag zone */
.track-clip.dragging             /* applied during any drag — keeps handles visible */
```

`.track-clip { min-width: 92px }` is removed (or set to a small value like the handle widths) so the clip's rendered width equals `(duration / durationSeconds) * 100%`. With min-width in place, short cues would render wider than their real duration and the right-edge resize handle would not sit at `time + duration`. The clip text already uses `overflow: hidden` + ellipsis, so thin clips degrade gracefully.

**Z-index stacking order** (lowest to highest inside `.track-clip`):
1. Ramp divs (`z-index: 0`, `pointer-events: none`) — always below everything
2. Content (time label, name) — natural flow
3. Handles (`z-index: 1`) — above ramps, receive pointer events

## Accessibility

Handles are **not keyboard accessible** — drag interactions are pointer-only. This is intentional; DAW-style handles have no meaningful keyboard equivalent. The `track-row` div (selection) retains full keyboard support via `role="button"`, `tabIndex={0}`, and `onKeyDown` (Enter/Space).

## Testing

- Unit: `clampFade(fadeIn, fadeOut, duration)` — constraint logic
- Unit: coordinate → seconds conversion utility (if extracted)
- Integration: `TrackClip` renders ramps with correct widths from cue data
- Integration: `onResizeCue` called with clamped value on pointer up
- Integration: `onFadeCue` called with correct field on pointer up
- Regression: existing marker drag and playhead drag unaffected
