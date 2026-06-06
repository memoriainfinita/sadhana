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

**Backward compatibility:** existing stored presets will not have these fields. All cue consumers must read them defensively: `cue.instruction ?? ''` and `cue.instructionDuration ?? 5`.

## State (App.jsx)

- `playingInstruction` (string | null) — set when a cue with a non-empty `instruction` fires, cleared after `(cue.instructionDuration ?? 5) * 1000` ms
- `showSoundNames` (boolean) — global toggle controlling visibility of sound name labels. Persisted to localStorage under key `sadhana-next.showSoundNames`. Default `true`.

`playingCueName` continues to work as-is (3s fixed), now conditioned on `showSoundNames`.

## Trigger Logic

When a cue fires (inside the existing scheduler effect):

```js
const instruction = cue.instruction ?? '';
const instructionDuration = cue.instructionDuration ?? 5;

if (instruction) {
  setPlayingInstruction(instruction);
  window.setTimeout(() => setPlayingInstruction(null), instructionDuration * 1000);
}
setPlayingCueName(cue.name);
window.setTimeout(() => setPlayingCueName(null), 3000);
```

Note: `playingCueName` is always set (the name is always known); `showSoundNames` only controls whether TimerPanel renders it. This avoids needing `showSoundNames` as a dependency in the scheduler effect.

## TimerPanel

Two display zones below the progress bar, in order:

1. **Instruction** (first) — large, prominent text in accent color. New class `playing-instruction-label`, same opacity fade pattern as `playing-cue-label`. Receives `playingInstruction` prop.
2. **Sound name** (second) — smaller, muted secondary text. Existing `playing-cue-label` element. Only rendered when `showSoundNames` prop is `true`.

Both zones reserve their space to avoid layout shift (min-height or fixed height).

Props added to TimerPanel: `playingInstruction`, `showSoundNames`.

**Zen mode:** both `TimerPanel` instances (normal and zen overlay) receive the same props — instruction and sound name behave identically in zen mode.

## GlobalPanel (Settings)

New checkbox in the `settings` panel:

```
[x] Mostrar nombre del sonido al dispararse
```

Controlled by `showSoundNames` / `onShowSoundNamesChange` props passed from App. Change is persisted to localStorage immediately on toggle.

## CueInspector

Two new fields in the inspector form:

- Text input for `instruction` (placeholder: "ej. Inhala, Retén, Exhala...")
- Number input for `instructionDuration` (min 1, max 60, suffix "s")

Placed after the sound selector, before the time slider.

## Storage

`STORAGE_KEYS` gains a new entry: `showSoundNames: 'sadhana-next.showSoundNames'`. Read once on app init; written on every toggle.

## Tests

- `createCue` returns `instruction: ''` and `instructionDuration: 5`
- `duplicateCue` preserves both fields from the source cue
- `updateCue` can update both fields independently
- `showSoundNames` persists correctly via `readJson` / `writeJson`
