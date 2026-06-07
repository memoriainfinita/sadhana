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

Extracted from the `.tracks` section of `Timeline.jsx`. Encapsulates all clip drag logic and visual state.

**Props:**
```js
{
  cue,             // full cue object
  durationSeconds, // total preset duration
  selected,        // boolean
  trackRef,        // ref to .tracks container (for coordinate math)
  onSelect,        // () => void
  onResizeCue,     // (id, newDuration) => void
  onFadeCue,       // (id, { fadeIn?, fadeOut? }) => void
}
```

**Local state:**
```js
dragType: null | 'resize' | 'fadeIn' | 'fadeOut'
localDuration: number   // mirrors cue.duration during drag
localFadeIn:   number   // mirrors cue.fadeIn during drag
localFadeOut:  number   // mirrors cue.fadeOut during drag
```

Local state is initialized from `cue` on `pointerDown` and cleared on `pointerUp`. This provides live visual feedback without touching global state on every pointer event. On `pointerUp`, the relevant callback is called with the final value.

### Changes to `Timeline.jsx`

- `track-row` changes from `<button>` to `<div role="button" tabIndex={0}>` with `onClick` and `onKeyDown` (Enter/Space) — required to allow nested interactive elements (div-based handles).
- `.track-clip` content is replaced by `<TrackClip ... />`.
- Two new props added to `Timeline`: `onResizeCue`, `onFadeCue`.
- A `tracksRef` is added to the `.tracks` container and passed to each `TrackClip`.

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

### Resize handle (`.clip-resize-handle`)
- Position: `right: 0`, full height, ~8px wide
- Cursor: `ew-resize`
- Drag calculation:
  ```
  rect = trackRef.current.getBoundingClientRect()
  deltaSeconds = (event.clientX - startX) / rect.width * durationSeconds
  newDuration = clamp(startDuration + deltaSeconds, 5, durationSeconds - cue.time)
  ```

### FadeIn handle (`.clip-fade-in-handle`)
- Position: `left: 0, top: 0`, ~14×14px
- Cursor: `ew-resize`
- Drag right increases fadeIn:
  ```
  deltaSeconds = (event.clientX - startX) / rect.width * durationSeconds
  newFadeIn = clamp(startFadeIn + deltaSeconds, 0, localDuration - localFadeOut)
  ```

### FadeOut handle (`.clip-fade-out-handle`)
- Position: `right: 0, top: 0`, ~14×14px (behind resize handle in z-index, or offset)
- Cursor: `ew-resize`
- Drag left increases fadeOut:
  ```
  deltaSeconds = -(event.clientX - startX) / rect.width * durationSeconds
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

## Testing

- Unit: `clampFade(fadeIn, fadeOut, duration)` — constraint logic
- Unit: coordinate → seconds conversion utility (if extracted)
- Integration: `TrackClip` renders ramps with correct widths from cue data
- Integration: `onResizeCue` called with clamped value on pointer up
- Integration: `onFadeCue` called with correct field on pointer up
- Regression: existing marker drag and playhead drag unaffected
