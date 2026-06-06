# Instruction Field on Cues

**Date:** 2026-06-06  
**Status:** Approved

## Summary

Add an optional `instruction` text field to each cue (e.g. "Inhala", "Retén", "Exhala") that appears near the timer when the cue fires, with a configurable visibility duration. Useful for pranayama, movement guides, and posture reminders. A global toggle controls whether sound names are shown alongside instructions.

## Data Model

Two new fields added to every cue object:

```js
instruction: '',          // short optional text, empty = not shown
instructionDuration: 5,   // seconds the instruction stays visible
```

Both fields are included in `createCue` defaults and preserved by `duplicateCue` and `updateCue`.

## State (App.jsx)

- `playingInstruction` (string | null) — set when a cue with a non-empty `instruction` fires, cleared after `cue.instructionDuration * 1000` ms
- `showSoundNames` (boolean, default `true`) — global toggle controlling visibility of sound name labels

`playingCueName` continues to work as-is (3s fixed), now conditioned on `showSoundNames`.

## Trigger Logic

When a cue fires (inside the existing scheduler effect):

```js
if (cue.instruction) {
  setPlayingInstruction(cue.instruction);
  window.setTimeout(() => setPlayingInstruction(null), cue.instructionDuration * 1000);
}
if (showSoundNames) {
  setPlayingCueName(cue.name);
  window.setTimeout(() => setPlayingCueName(null), 3000);
}
```

## TimerPanel

Two display zones below the timer readout:

- **Instruction** — large, prominent text (accent color, larger size). Uses existing `playing-cue-label` fade pattern with a new `playing-instruction-label` class.
- **Sound name** — smaller, muted secondary text. Existing `playing-cue-label` element, conditionally rendered based on `showSoundNames` prop.

Both zones use the existing CSS fade pattern (opacity transition on `.visible` class).

Props added to TimerPanel: `playingInstruction`, `showSoundNames`.

## GlobalPanel (Settings)

New checkbox in the `settings` panel:

```
[ ] Mostrar nombre del sonido al dispararse
```

Controlled by `showSoundNames` / `onShowSoundNamesChange` props passed from App.

## CueInspector

Two new fields in the inspector form:

- Text input for `instruction` (placeholder: "ej. Inhala, Retén, Exhala...")
- Number input for `instructionDuration` (min 1, max 60, suffix "s")

Placed after the sound selector, before the time slider.

## Tests

- `createCue` returns `instruction: ''` and `instructionDuration: 5`
- `duplicateCue` preserves both fields from the source cue
- `updateCue` can update both fields independently
