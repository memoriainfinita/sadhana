# Instruction Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional `instruction` text field to each cue that displays near the timer when the cue fires, with configurable visibility duration and a global toggle for sound name display.

**Architecture:** Extend the cue data model with two new fields (`instruction`, `instructionDuration`), add parallel display state in App.jsx (`playingInstruction`, `showSoundNames`), and thread the new props through TimerPanel, GlobalPanel, and CueInspector. The scheduler effect sets both display states independently; `showSoundNames` is persisted to localStorage and only used at render time (not in the effect).

**Tech Stack:** React 19, Vite, Vitest, plain CSS

---

### Task 1: Extend cue data model

**Files:**
- Modify: `src/domain/cues.js`
- Modify: `src/domain/cues.test.js`

- [ ] **Step 1: Write failing tests**

Add to the `describe('cues domain')` block in `src/domain/cues.test.js`:

```js
test('createCue includes instruction fields with empty defaults', () => {
  const cue = createCue({ atTime: 0, durationSeconds: 1440 });
  expect(cue.instruction).toBe('');
  expect(cue.instructionDuration).toBe(5);
});

test('duplicateCue preserves instruction fields', () => {
  const source = { ...DEFAULT_CUES[0], instruction: 'Inhala', instructionDuration: 8 };
  const copy = duplicateCue(source, { durationSeconds: 1440 });
  expect(copy.instruction).toBe('Inhala');
  expect(copy.instructionDuration).toBe(8);
});

test('updateCue can update instruction fields independently', () => {
  const cues = updateCue(DEFAULT_CUES, 'start', { instruction: 'Exhala', instructionDuration: 6 });
  expect(getCueById(cues, 'start')).toMatchObject({ instruction: 'Exhala', instructionDuration: 6 });
  expect(getCueById(cues, 'rain')).not.toHaveProperty('instruction', 'Exhala');
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
pnpm test --run src/domain/cues.test.js
```

Expected: 3 failures — `instruction` and `instructionDuration` undefined.

- [ ] **Step 3: Add fields to `createCue` in `src/domain/cues.js`**

```js
export function createCue({ atTime = 0, durationSeconds = 24 * 60 } = {}) {
  return {
    id: createCueId(),
    name: 'Nueva cue',
    kind: 'bell',
    icon: 'bell',
    color: '#f6a133',
    sound: 'bells/meditation-bell.mp3',
    time: clampCueTime(atTime, durationSeconds),
    duration: 30,
    volume: 70,
    fadeIn: 2,
    fadeOut: 2,
    instruction: '',
    instructionDuration: 5,
    notes: '',
  };
}
```

`duplicateCue` uses spread (`{ ...cue }`) so it automatically preserves the new fields. `updateCue` uses `{ ...cue, ...updates }` so it also works without changes.

- [ ] **Step 4: Run tests to verify they pass**

```
pnpm test --run src/domain/cues.test.js
```

Expected: all 10 tests pass.

- [ ] **Step 5: Commit**

```
git add src/domain/cues.js src/domain/cues.test.js
git commit -m "feat: add instruction and instructionDuration fields to cue model"
```

---

### Task 2: Add showSoundNames to storage keys

**Files:**
- Modify: `src/domain/storage.js`
- Modify: `src/domain/storage.test.js`

- [ ] **Step 1: Write failing test**

Add to the `describe('storage domain')` block in `src/domain/storage.test.js`:

```js
test('showSoundNames key exists and round-trips correctly', () => {
  const storage = memoryStorage();
  writeJson(storage, STORAGE_KEYS.showSoundNames, false);
  expect(readJson(storage, STORAGE_KEYS.showSoundNames, true)).toBe(false);
  expect(readJson(memoryStorage(), STORAGE_KEYS.showSoundNames, true)).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

```
pnpm test --run src/domain/storage.test.js
```

Expected: fail — `STORAGE_KEYS.showSoundNames` is undefined.

- [ ] **Step 3: Add key to `STORAGE_KEYS` in `src/domain/storage.js`**

```js
export const STORAGE_KEYS = {
  presets: 'sadhana-next.presets',
  sessions: 'sadhana-next.sessions',
  showSoundNames: 'sadhana-next.showSoundNames',
};
```

- [ ] **Step 4: Run tests to verify they pass**

```
pnpm test --run src/domain/storage.test.js
```

Expected: all 9 tests pass.

- [ ] **Step 5: Commit**

```
git add src/domain/storage.js src/domain/storage.test.js
git commit -m "feat: add showSoundNames storage key"
```

---

### Task 3: App state and trigger logic

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add `readJson` to the storage import**

At the top of `src/App.jsx`, the storage import currently is:

```js
import {
  STORAGE_KEYS,
  cleanStoredExamples,
  deletePreset,
  deleteSession,
  savePreset,
  saveSession,
  writeJson,
} from './domain/storage.js';
```

Change to:

```js
import {
  STORAGE_KEYS,
  cleanStoredExamples,
  deletePreset,
  deleteSession,
  readJson,
  savePreset,
  saveSession,
  writeJson,
} from './domain/storage.js';
```

- [ ] **Step 2: Add the two new state declarations**

After the `playingCueName` state line (currently around line 58):

```js
const [playingCueName, setPlayingCueName] = useState(null);
```

Add immediately after:

```js
const [playingInstruction, setPlayingInstruction] = useState(null);
const [showSoundNames, setShowSoundNames] = useState(
  () => readJson(window.localStorage, STORAGE_KEYS.showSoundNames, true)
);
```

- [ ] **Step 3: Update the scheduler effect to handle instruction**

Find the `useEffect` that calls `getDueCues` (currently around line 97). Inside the `result.due.forEach` callback, replace:

```js
setPlayingCueId(cue.id);
setPlayingCueName(cue.name);
window.setTimeout(() => setPlayingCueName(null), 3000);
```

With:

```js
setPlayingCueId(cue.id);

const instruction = cue.instruction ?? '';
const instructionDuration = cue.instructionDuration ?? 5;
if (instruction) {
  setPlayingInstruction(instruction);
  window.setTimeout(() => setPlayingInstruction(null), instructionDuration * 1000);
}

setPlayingCueName(cue.name);
window.setTimeout(() => setPlayingCueName(null), 3000);
```

- [ ] **Step 4: Add showSoundNames handler and pass props**

Add this function with the other handlers:

```js
function handleShowSoundNamesChange(value) {
  setShowSoundNames(value);
  writeJson(window.localStorage, STORAGE_KEYS.showSoundNames, value);
}
```

- [ ] **Step 5: Pass new props to TimerPanel (normal mode)**

In the `timerPanelProps` object, the props are spread to TimerPanel. The normal-mode TimerPanel JSX (inside `activeMode === 'practice'`) currently ends with:

```jsx
<TimerPanel
  {...timerPanelProps}
  onZen={() => setZenMode(true)}
  presetName={loadedPreset?.name}
  playingCueName={playingCueName}
  cues={cues}
  playingCueId={playingCueId}
  cuesVisible={cuesVisible}
  onToggleCues={() => setCuesVisible((v) => !v)}
  onEditCues={() => setActiveMode('design')}
/>
```

Add two props:

```jsx
<TimerPanel
  {...timerPanelProps}
  onZen={() => setZenMode(true)}
  presetName={loadedPreset?.name}
  playingCueName={playingCueName}
  playingInstruction={playingInstruction}
  showSoundNames={showSoundNames}
  cues={cues}
  playingCueId={playingCueId}
  cuesVisible={cuesVisible}
  onToggleCues={() => setCuesVisible((v) => !v)}
  onEditCues={() => setActiveMode('design')}
/>
```

- [ ] **Step 6: Pass new props to TimerPanel (zen overlay)**

The zen overlay TimerPanel currently is:

```jsx
<TimerPanel {...timerPanelProps} onZen={() => setZenMode(false)} zenMode playingCueName={playingCueName} />
```

Change to:

```jsx
<TimerPanel
  {...timerPanelProps}
  onZen={() => setZenMode(false)}
  zenMode
  playingCueName={playingCueName}
  playingInstruction={playingInstruction}
  showSoundNames={showSoundNames}
/>
```

- [ ] **Step 7: Pass props to GlobalPanel**

Find the `<GlobalPanel` JSX and add two props:

```jsx
<GlobalPanel
  activePanel={activePanel}
  onClose={() => setActivePanel(null)}
  theme={theme}
  onThemeToggle={() => setTheme((current) => (current === 'dim' ? 'contrast' : 'dim'))}
  accentColor={accentColor}
  onAccentColorChange={setAccentColor}
  masterVolume={masterVolume}
  onMasterVolumeChange={setMasterVolume}
  muted={muted}
  onMutedChange={setMuted}
  onStopAudio={() => audioRegistry.current.stopAll()}
  onExportData={handleExportData}
  onImportData={handleImportData}
  showSoundNames={showSoundNames}
  onShowSoundNamesChange={handleShowSoundNamesChange}
/>
```

- [ ] **Step 8: Commit**

```
git add src/App.jsx
git commit -m "feat: add playingInstruction and showSoundNames state to App"
```

---

### Task 4: TimerPanel display zones

**Files:**
- Modify: `src/components/TimerPanel.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Update TimerPanel props and render**

In `src/components/TimerPanel.jsx`, update the function signature:

```js
export function TimerPanel({ session, onStart, onPause, onResume, onStop, onNudge, onZen, zenMode = false, presetName, playingCueName, playingInstruction, showSoundNames = true, cues, playingCueId, cuesVisible, onToggleCues, onEditCues }) {
```

Then find the current single display zone:

```jsx
<div className={`playing-cue-label${playingCueName ? ' visible' : ''}`}>
  {playingCueName}
</div>
```

Replace with two zones:

```jsx
<div className={`playing-instruction-label${playingInstruction ? ' visible' : ''}`}>
  {playingInstruction}
</div>
{showSoundNames && (
  <div className={`playing-cue-label${playingCueName ? ' visible' : ''}`}>
    {playingCueName}
  </div>
)}
```

- [ ] **Step 2: Add CSS for instruction label**

In `src/styles.css`, immediately after the `.playing-cue-label.visible` rule (around line 296), add:

```css
.playing-instruction-label {
  font-size: 22px;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.02em;
  min-height: 30px;
  margin-bottom: 4px;
  opacity: 0;
  transition: opacity 1.4s ease;
  text-align: center;
}

.playing-instruction-label.visible {
  opacity: 1;
  transition: opacity 0.4s ease;
}
```

- [ ] **Step 3: Commit**

```
git add src/components/TimerPanel.jsx src/styles.css
git commit -m "feat: add instruction and sound name display zones to TimerPanel"
```

---

### Task 5: GlobalPanel settings toggle

**Files:**
- Modify: `src/components/GlobalPanel.jsx`

- [ ] **Step 1: Add props and checkbox**

Update the function signature in `src/components/GlobalPanel.jsx`:

```js
export function GlobalPanel({
  activePanel,
  onClose,
  theme,
  onThemeToggle,
  accentColor,
  onAccentColorChange,
  masterVolume,
  onMasterVolumeChange,
  muted,
  onMutedChange,
  onStopAudio,
  onExportData,
  onImportData,
  showSoundNames,
  onShowSoundNamesChange,
}) {
```

In the `{activePanel === 'settings'}` block, add the checkbox before the export button:

```jsx
{activePanel === 'settings' && (
  <>
    <h2>Configuracion</h2>
    <label className="check-row">
      <input
        type="checkbox"
        checked={showSoundNames}
        onChange={(event) => onShowSoundNamesChange(event.target.checked)}
      />
      Mostrar nombre del sonido al dispararse
    </label>
    <button type="button" title="Copiar presets y sesiones al portapapeles como JSON" onClick={onExportData}>Exportar datos</button>
    <textarea
      placeholder="Pega aqui un JSON exportado"
      onBlur={(event) => {
        if (event.target.value.trim()) onImportData(event.target.value);
      }}
    />
  </>
)}
```

- [ ] **Step 2: Commit**

```
git add src/components/GlobalPanel.jsx
git commit -m "feat: add show sound names toggle to settings panel"
```

---

### Task 6: CueInspector new fields

**Files:**
- Modify: `src/components/CueInspector.jsx`

- [ ] **Step 1: Add instruction fields to the inspector form**

In `src/components/CueInspector.jsx`, find the sound selector label block (ends with `</label>`). After it, and before the `<label>` block for Tiempo, insert:

```jsx
<label>
  Instruccion
  <input
    value={cue.instruction ?? ''}
    onChange={(event) => onChange({ instruction: event.target.value })}
    placeholder="ej. Inhala, Reten, Exhala..."
  />
</label>

<label>
  Visibilidad (s)
  <input
    type="number"
    min="1"
    max="60"
    value={cue.instructionDuration ?? 5}
    onChange={(event) => onChange({ instructionDuration: Number(event.target.value) })}
  />
</label>
```

- [ ] **Step 2: Commit**

```
git add src/components/CueInspector.jsx
git commit -m "feat: add instruction fields to CueInspector"
```

---

### Task 7: Full test run and smoke test

- [ ] **Step 1: Run full test suite**

```
pnpm test --run
```

Expected: all 24 tests pass (plus the 3 new ones from Task 1 = 27 total).

- [ ] **Step 2: Start dev server and verify visually**

Start the dev server:
```
pnpm dev
```

Open `http://localhost:5173/`, go to **Diseñar**, select a cue, set `instruction` to "Inhala" and `instructionDuration` to 4. Go to **Practicar**, start the session, wait for the cue to fire. Verify:
- "Inhala" appears large in accent color above the sound name
- Sound name appears smaller below
- After 4 seconds the instruction fades; after 3 seconds the sound name fades

Open the settings panel (⚙), uncheck "Mostrar nombre del sonido al dispararse". Fire a cue again — only the instruction should appear, no sound name.

Reload the app — the toggle state should be remembered.

- [ ] **Step 3: Final commit if any cleanup needed**

```
git add -p
git commit -m "chore: cleanup after instruction field implementation"
```
