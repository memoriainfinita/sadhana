# Sadhana Functional App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current Sadhana visual prototype into a functional first pass where every visible control has observable behavior, modes feel distinct, cues can be managed, presets can be reused, and session audio scheduling is testable.

**Architecture:** Keep the current React/Vite structure and add small domain modules for cue CRUD, preset/session storage operations, and cue scheduling. Keep browser APIs at the app boundary: domain tests use pure functions and injected clocks/storage, while React components receive handlers and state from `App.jsx`.

**Tech Stack:** React 19, Vite 6, Vitest, lucide-react, browser `localStorage`, browser `Audio`.

**Execution Note:** This project is not currently inside a Git repository, so worktree and commit steps are not available. Execute in place and use tests/build/browser verification as checkpoints.

---

### Task 1: Cue CRUD Domain

**Files:**
- Modify: `src/domain/cues.js`
- Test: `src/domain/cues.test.js`

- [ ] **Step 1: Write failing tests**

Add tests for creating, duplicating, deleting, and selecting fallback cues:

```js
test('creates a cue clamped inside the session duration', () => {
  const cue = createCue({ atTime: 2000, durationSeconds: 1440 });

  expect(cue).toMatchObject({
    name: 'Nueva cue',
    kind: 'bell',
    icon: 'bell',
    sound: 'bells/meditation-bell.mp3',
    time: 1440,
    duration: 30,
    volume: 70,
    fadeIn: 2,
    fadeOut: 2,
  });
  expect(cue.id).toMatch(/^cue-/);
});

test('duplicates a cue with a readable name and offset time', () => {
  const copy = duplicateCue(DEFAULT_CUES[1], { durationSeconds: 1440 });

  expect(copy).toMatchObject({
    name: 'Bosque suave copia',
    sound: DEFAULT_CUES[1].sound,
    time: 510,
  });
  expect(copy.id).not.toBe(DEFAULT_CUES[1].id);
});

test('removes a cue and chooses a nearby selection', () => {
  const result = removeCue(DEFAULT_CUES, 'forest');

  expect(result.cues.map((cue) => cue.id)).toEqual(['start', 'final']);
  expect(result.selectedCueId).toBe('final');
});
```

- [ ] **Step 2: Verify tests fail**

Run: `npm test -- --run src/domain/cues.test.js`

Expected: FAIL because `createCue`, `duplicateCue`, and `removeCue` are not exported.

- [ ] **Step 3: Implement cue domain functions**

Add exports:

```js
export function createCue({ atTime = 0, durationSeconds = 24 * 60 } = {}) {
  return {
    id: `cue-${crypto.randomUUID?.() ?? Date.now()}`,
    name: 'Nueva cue',
    kind: 'bell',
    icon: 'bell',
    color: '#f6a133',
    sound: SOUND_OPTIONS[0].value,
    time: clampCueTime(atTime, durationSeconds),
    duration: 30,
    volume: 70,
    fadeIn: 2,
    fadeOut: 2,
    notes: '',
  };
}

export function duplicateCue(cue, { durationSeconds = 24 * 60, offsetSeconds = 30 } = {}) {
  return {
    ...cue,
    id: `cue-${crypto.randomUUID?.() ?? Date.now()}`,
    name: `${cue.name} copia`,
    time: clampCueTime(cue.time + offsetSeconds, durationSeconds),
  };
}

export function removeCue(cues, cueId) {
  if (cues.length <= 1) return { cues, selectedCueId: cues[0]?.id ?? null };
  const index = cues.findIndex((cue) => cue.id === cueId);
  const next = cues.filter((cue) => cue.id !== cueId);
  const fallback = next[Math.min(Math.max(index, 0), next.length - 1)] ?? next[0] ?? null;
  return { cues: next, selectedCueId: fallback?.id ?? null };
}
```

- [ ] **Step 4: Verify tests pass**

Run: `npm test -- --run src/domain/cues.test.js`

Expected: PASS.

### Task 2: Storage Operations

**Files:**
- Modify: `src/domain/storage.js`
- Test: `src/domain/storage.test.js`

- [ ] **Step 1: Write failing tests**

Add tests:

```js
test('deletes saved presets by id', () => {
  const storage = memoryStorage({
    'sadhana-next.presets': JSON.stringify([{ id: 'a' }, { id: 'b' }]),
  });

  const next = deletePreset(storage, 'a');

  expect(next).toEqual([{ id: 'b' }]);
});

test('deletes saved sessions by id', () => {
  const storage = memoryStorage({
    'sadhana-next.sessions': JSON.stringify([{ id: 'a' }, { id: 'b' }]),
  });

  const next = deleteSession(storage, 'b');

  expect(next).toEqual([{ id: 'a' }]);
});
```

- [ ] **Step 2: Verify tests fail**

Run: `npm test -- --run src/domain/storage.test.js`

Expected: FAIL because delete helpers are not exported.

- [ ] **Step 3: Implement delete helpers**

Add:

```js
export function deletePreset(storage, presetId) {
  const next = readJson(storage, STORAGE_KEYS.presets, []).filter((preset) => preset.id !== presetId);
  writeJson(storage, STORAGE_KEYS.presets, next);
  return next;
}

export function deleteSession(storage, sessionId) {
  const next = readJson(storage, STORAGE_KEYS.sessions, []).filter((session) => session.id !== sessionId);
  writeJson(storage, STORAGE_KEYS.sessions, next);
  return next;
}
```

- [ ] **Step 4: Verify tests pass**

Run: `npm test -- --run src/domain/storage.test.js`

Expected: PASS.

### Task 3: Cue Scheduler Domain

**Files:**
- Create: `src/domain/scheduler.js`
- Create: `src/domain/scheduler.test.js`

- [ ] **Step 1: Write failing scheduler tests**

Create tests for due cues and reset behavior:

```js
import { describe, expect, test } from 'vitest';
import { createCueSchedulerState, getDueCues, resetCueScheduler } from './scheduler.js';

describe('cue scheduler domain', () => {
  test('returns each cue once when elapsed time crosses its cue time', () => {
    const cues = [
      { id: 'start', time: 0 },
      { id: 'forest', time: 10 },
      { id: 'final', time: 20 },
    ];
    let state = createCueSchedulerState();

    let result = getDueCues(cues, state, 0);
    expect(result.due.map((cue) => cue.id)).toEqual(['start']);
    state = result.state;

    result = getDueCues(cues, state, 15);
    expect(result.due.map((cue) => cue.id)).toEqual(['forest']);
    state = result.state;

    result = getDueCues(cues, state, 25);
    expect(result.due.map((cue) => cue.id)).toEqual(['final']);
    expect(getDueCues(cues, result.state, 25).due).toEqual([]);
  });

  test('resetCueScheduler clears played cue ids', () => {
    const state = createCueSchedulerState(['start']);

    expect(resetCueScheduler(state)).toEqual(createCueSchedulerState());
  });
});
```

- [ ] **Step 2: Verify tests fail**

Run: `npm test -- --run src/domain/scheduler.test.js`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement scheduler**

Create:

```js
export function createCueSchedulerState(playedCueIds = []) {
  return {
    playedCueIds: new Set(playedCueIds),
  };
}

export function resetCueScheduler() {
  return createCueSchedulerState();
}

export function getDueCues(cues, schedulerState, elapsedSeconds) {
  const playedCueIds = new Set(schedulerState.playedCueIds);
  const due = cues
    .filter((cue) => cue.time <= elapsedSeconds && !playedCueIds.has(cue.id))
    .sort((a, b) => a.time - b.time);

  due.forEach((cue) => playedCueIds.add(cue.id));

  return {
    due,
    state: { playedCueIds },
  };
}
```

- [ ] **Step 4: Verify tests pass**

Run: `npm test -- --run src/domain/scheduler.test.js`

Expected: PASS.

### Task 4: Connect App Behavior

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/AppShell.jsx`
- Modify: `src/components/Timeline.jsx`
- Modify: `src/components/CueInspector.jsx`
- Modify: `src/components/RecentSessions.jsx`
- Create: `src/components/ModePanel.jsx`
- Create: `src/components/GlobalPanel.jsx`
- Create: `src/components/PresetLibrary.jsx`

- [ ] **Step 1: Add app state and handlers**

Connect:
- `activeMode` changes to visible mode panels.
- `addCue`, `duplicateCue`, `deleteCue`.
- `savePreset`, `loadPreset`, `deletePreset`.
- `deleteSession`.
- `setDuration`.
- `getDueCues` in a `useEffect` while session runs.
- `masterVolume` and `muteAudio`.

- [ ] **Step 2: Add UI components**

Create:
- `ModePanel`: visible explanation and actions for current mode.
- `GlobalPanel`: one panel used by topbar buttons for duration/theme/audio/settings.
- `PresetLibrary`: visible saved presets with load/delete buttons.

- [ ] **Step 3: Wire button handlers**

Every visible button should either mutate state, open a panel, or be hidden until implemented.

- [ ] **Step 4: Manual browser expectation**

Expected behavior:
- Modes visibly change content.
- Topbar buttons open panels.
- Add/duplicate/delete cues changes timeline immediately.
- Save preset shows visible feedback and appears under Recordar.
- Recent session menu exposes repeat/delete actions.
- Timer plays due cues once.

### Task 5: Styling and Responsive QA

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Make mode layouts distinct**

Use mode-specific classes:
- `.mode-practice`: session-first layout.
- `.mode-design`: timeline/editor-first layout.
- `.mode-remember`: memory/preset-first layout.

- [ ] **Step 2: Remove permanently hidden mode note**

Delete or override `.mode-note { display: none; }`.

- [ ] **Step 3: Style panels and feedback**

Add styles for:
- global panel
- mode panel
- preset library
- visible save status
- disabled/secondary actions

- [ ] **Step 4: Verify mobile viewport**

Use browser viewport `390x844`.

Expected: no overlapping controls; mode panel, preset library, and inspector remain usable.

### Task 6: Final Verification

**Files:**
- No production file changes unless verification finds defects.

- [ ] **Step 1: Run all tests**

Run: `npm test -- --run`

Expected: all tests pass.

- [ ] **Step 2: Build**

Run: `npm run build`

Expected: Vite build completes.

- [ ] **Step 3: Browser smoke test**

Open `http://127.0.0.1:5173/` and verify:
- console has no errors
- every visible button has behavior
- modes are visually distinct
- mobile viewport works

