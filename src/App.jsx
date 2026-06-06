import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AppShell } from './components/AppShell.jsx';
import { CueInspector } from './components/CueInspector.jsx';
import { GlobalPanel } from './components/GlobalPanel.jsx';
import { PresetLibrary } from './components/PresetLibrary.jsx';
import { RecentSessions } from './components/RecentSessions.jsx';
import { Timeline } from './components/Timeline.jsx';
import { PlaybackBar } from './components/PlaybackBar.jsx';
import { TimerPanel } from './components/TimerPanel.jsx';
import { AudioRegistry } from './domain/audio.js';
import {
  DEFAULT_CUES,
  clampCueTime,
  createCue,
  duplicateCue,
  getCueById,
  removeCue,
  updateCue,
} from './domain/cues.js';
import { createCueSchedulerState, getDueCues, resetCueScheduler } from './domain/scheduler.js';
import { createSessionState, sessionReducer } from './domain/session.js';
import {
  STORAGE_KEYS,
  cleanStoredExamples,
  deletePreset,
  deleteSession,
  readJson,
  savePreset,
  saveSession,
  seedDefaultPresets,
  writeJson,
} from './domain/storage.js';
import { DEFAULT_PRESETS } from './domain/presets.js';

const SESSION_DURATION_SECONDS = 24 * 60;

function nowLabel() {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

export function App() {
  const [activeMode, setActiveMode] = useState('practice');
  const [activePanel, setActivePanel] = useState(null);
  const [theme, setTheme] = useState('dim');
  const [cues, setCues] = useState(DEFAULT_CUES);
  const [selectedCueId, setSelectedCueId] = useState('forest');
  const [initialStorage] = useState(() => cleanStoredExamples(window.localStorage));
  const [presets, setPresets] = useState(() => seedDefaultPresets(window.localStorage, DEFAULT_PRESETS));
  const [sessions, setSessions] = useState(() => initialStorage.sessions);
  const [loadedPreset, setLoadedPreset] = useState(null);
  const [notice, setNotice] = useState('');
  const [masterVolume, setMasterVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [accentColor, setAccentColor] = useState('#f6a133');
  const [zenMode, setZenMode] = useState(false);
  const [cuesVisible, setCuesVisible] = useState(true);
  const [playingCueId, setPlayingCueId] = useState(null);
  const [playingCueName, setPlayingCueName] = useState(null);
  const [playingInstruction, setPlayingInstruction] = useState(null);
  const [showSoundNames, setShowSoundNames] = useState(
    () => readJson(window.localStorage, STORAGE_KEYS.showSoundNames, true)
  );
  const [session, dispatchSession] = useReducer(
    sessionReducer,
    createSessionState({ durationSeconds: SESSION_DURATION_SECONDS })
  );
  const audioRegistry = useRef(new AudioRegistry());
  const cueHistory = useRef([]);
  const schedulerState = useRef(createCueSchedulerState());
  const shortcutsRef = useRef({});

  const selectedCue = useMemo(() => getCueById(cues, selectedCueId), [cues, selectedCueId]);

  useEffect(() => {
    if (session.status !== 'running') return undefined;
    const id = window.setInterval(() => {
      dispatchSession({ type: 'tick', now: Date.now() });
    }, 250);
    return () => window.clearInterval(id);
  }, [session.status]);

  useEffect(() => {
    if (!notice) return undefined;
    const id = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(id);
  }, [notice]);

  useEffect(() => {
    audioRegistry.current.applyMasterVolume(masterVolume / 100, muted);
  }, [masterVolume, muted]);

  useEffect(() => {
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);
    const l = (v) => Math.round(v + (255 - v) * 0.28).toString(16).padStart(2, '0');
    const accent2 = `#${l(r)}${l(g)}${l(b)}`;
    document.documentElement.style.setProperty('--accent', accentColor);
    document.documentElement.style.setProperty('--accent-2', accent2);
  }, [accentColor]);

  useEffect(() => {
    if (session.status !== 'running') return;
    const result = getDueCues(cues, schedulerState.current, session.elapsedSeconds);
    schedulerState.current = result.state;
    result.due.forEach((cue) => {
      const audio = audioRegistry.current.playCue(cue, {
        volumeScale: masterVolume / 100,
        muted,
      });
      if (audio && cue.duration > 0) {
        window.setTimeout(() => audioRegistry.current.stopCue(cue.id), cue.duration * 1000);
      }
      setPlayingCueId(cue.id);

      const instruction = cue.instruction ?? '';
      const instructionDuration = cue.instructionDuration ?? 5;
      if (instruction) {
        setPlayingInstruction(instruction);
        window.setTimeout(() => setPlayingInstruction(null), instructionDuration * 1000);
      }

      setPlayingCueName(cue.name);
      window.setTimeout(() => setPlayingCueName(null), 3000);
    });
  }, [cues, masterVolume, muted, session.elapsedSeconds, session.status]);

  useEffect(() => {
    if (session.status !== 'complete') return;
    const next = saveSession(window.localStorage, {
      id: crypto.randomUUID(),
      name: selectedCue?.name ? `Sesion con ${selectedCue.name}` : 'Sesion completada',
      duration: `${Math.round(session.durationSeconds / 60)} min`,
      when: `Hoy, ${nowLabel()}`,
      color: selectedCue?.color ?? '#f6a133',
    });
    setSessions(next);
    audioRegistry.current.stopAll();
    schedulerState.current = resetCueScheduler();
    setNotice('Sesion guardada en Recordar');
  }, [session.status, session.durationSeconds, selectedCue]);

  useEffect(() => {
    if (session.status === 'idle' || session.status === 'complete') return;
    dispatchSession({ type: 'stop' });
    audioRegistry.current.stopAll();
    schedulerState.current = resetCueScheduler();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode]);

  useEffect(() => {
    function handleKey(event) {
      const tag = event.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const { session, activeMode, zenMode, timerPanelProps, handleNudge, setActiveMode, setZenMode } = shortcutsRef.current;
      const inPractice = activeMode === 'practice';

      switch (event.key) {
        case ' ':
          if (activeMode !== 'practice' && activeMode !== 'design') return;
          event.preventDefault();
          if (session.status === 'idle' || session.status === 'complete') timerPanelProps.onStart();
          else if (session.status === 'running') timerPanelProps.onPause();
          else if (session.status === 'paused') timerPanelProps.onResume();
          break;
        case 'ArrowLeft':
          if (!inPractice) return;
          event.preventDefault();
          handleNudge(-15);
          break;
        case 'ArrowRight':
          if (!inPractice) return;
          event.preventDefault();
          handleNudge(15);
          break;
        case 'f':
        case 'F':
          if (!inPractice || zenMode) return;
          setZenMode(true);
          break;
        case 'Escape':
          if (zenMode) setZenMode(false);
          break;
        case '1':
          setActiveMode('practice');
          break;
        case '2':
          setActiveMode('design');
          break;
        case '3':
          setActiveMode('remember');
          break;
        default:
          break;
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  function setCuesWithHistory(updater) {
    setCues((current) => {
      cueHistory.current = [current, ...cueHistory.current].slice(0, 20);
      return typeof updater === 'function' ? updater(current) : updater;
    });
  }

  function updateSelectedCue(updates) {
    const normalizedUpdates = { ...updates };
    if (typeof updates.time === 'number') {
      normalizedUpdates.time = clampCueTime(updates.time, session.durationSeconds);
    }
    setCuesWithHistory((current) => updateCue(current, selectedCueId, normalizedUpdates));
  }

  function handleSavePreset(name) {
    const id = loadedPreset?.id ?? crypto.randomUUID();
    const presetName = name ?? loadedPreset?.name ?? 'Preset Sadhana';
    const next = savePreset(window.localStorage, {
      id,
      name: presetName,
      createdAt: new Date().toISOString(),
      cues,
    });
    setPresets(next);
    setLoadedPreset({ id, name: presetName });
    setNotice('Preset guardado');
  }

  function handleNudge(seconds) {
    if (session.status === 'idle') return;
    dispatchSession({ type: 'nudge', seconds });
  }

  function handleAddCue() {
    const cue = createCue({ atTime: session.elapsedSeconds, durationSeconds: session.durationSeconds });
    setCuesWithHistory((current) => [...current, cue]);
    setSelectedCueId(cue.id);
    setNotice('Cue añadida');
  }

  function handleDuplicateCue() {
    if (!selectedCue) return;
    const cue = duplicateCue(selectedCue, { durationSeconds: session.durationSeconds });
    setCuesWithHistory((current) => [...current, cue]);
    setSelectedCueId(cue.id);
    setNotice('Cue duplicada');
  }

  function handleDeleteCue() {
    const result = removeCue(cues, selectedCueId);
    setCuesWithHistory(result.cues);
    setSelectedCueId(result.selectedCueId);
    setNotice('Cue eliminada');
  }

  function handleUndoCueChange() {
    const [previous, ...rest] = cueHistory.current;
    if (!previous) return;
    cueHistory.current = rest;
    setCues(previous);
    if (!getCueById(previous, selectedCueId)) {
      setSelectedCueId(previous[0]?.id ?? null);
    }
    setNotice('Cambio deshecho');
  }

  function handleLoadPreset(preset) {
    if (!preset.cues?.length) return;
    setCuesWithHistory(preset.cues);
    setSelectedCueId(preset.cues[0].id);
    setLoadedPreset({ id: preset.id, name: preset.name });
    setActiveMode('practice');
    setNotice(`Preset cargado: ${preset.name}`);
  }

  function handleDeletePreset(presetId) {
    setPresets(deletePreset(window.localStorage, presetId));
    setNotice('Preset eliminado');
  }

  function handleDeleteSession(sessionId) {
    setSessions(deleteSession(window.localStorage, sessionId));
    setNotice('Sesion eliminada');
  }

  function handleRepeatSession(item) {
    const minutes = parseInt(item.duration, 10);
    if (minutes > 0) {
      dispatchSession({ type: 'stop' });
      dispatchSession({ type: 'setDuration', durationSeconds: minutes * 60 });
    }
    setActiveMode('practice');
    setNotice(`Repetir: ${item.name}`);
  }

  function handleDurationChange(minutes) {
    const durationSeconds = Math.max(1, Number(minutes) || 1) * 60;
    dispatchSession({ type: 'setDuration', durationSeconds });
    setNotice('Duracion actualizada');
  }

  function handleExportData() {
    const payload = JSON.stringify({ presets, sessions }, null, 2);
    navigator.clipboard?.writeText(payload);
    setNotice('Datos copiados al portapapeles');
  }

  function handleImportData(raw) {
    try {
      const parsed = JSON.parse(raw);
      const nextPresets = Array.isArray(parsed.presets) ? parsed.presets : presets;
      const nextSessions = Array.isArray(parsed.sessions) ? parsed.sessions : sessions;
      writeJson(window.localStorage, STORAGE_KEYS.presets, nextPresets);
      writeJson(window.localStorage, STORAGE_KEYS.sessions, nextSessions);
      setPresets(nextPresets);
      setSessions(nextSessions);
      setNotice('Datos importados');
    } catch {
      setNotice('JSON no valido');
    }
  }

  function handleShowSoundNamesChange(value) {
    setShowSoundNames(value);
    writeJson(window.localStorage, STORAGE_KEYS.showSoundNames, value);
  }

  function handleTriggerCue(cue) {
    setSelectedCueId(cue.id);
    audioRegistry.current.playCue(cue, { volumeScale: masterVolume / 100, muted });
  }

  function handleSeek(seconds) {
    if (seconds < session.elapsedSeconds) {
      const played = schedulerState.current.playedCueIds;
      cues.forEach((cue) => {
        if (cue.time > seconds) played.delete(cue.id);
      });
    }
    dispatchSession({ type: 'nudge', seconds: seconds - session.elapsedSeconds });
  }

  function handleMoveCue(cueId, time) {
    const clampedTime = clampCueTime(time, session.durationSeconds);
    setCuesWithHistory((current) => updateCue(current, cueId, { time: clampedTime }));
  }

  const timerPanelProps = {
    session,
    onStart() {
      schedulerState.current = resetCueScheduler();
      dispatchSession({ type: 'start', now: Date.now() });
    },
    onPause() { dispatchSession({ type: 'pause', now: Date.now() }); },
    onResume() { dispatchSession({ type: 'resume', now: Date.now() }); },
    onStop() {
      if (session.elapsedSeconds >= 60) {
        const next = saveSession(window.localStorage, {
          id: crypto.randomUUID(),
          name: selectedCue?.name ? `Sesion con ${selectedCue.name}` : 'Sesion completada',
          duration: `${Math.round(session.elapsedSeconds / 60)} min`,
          when: `Hoy, ${nowLabel()}`,
          color: selectedCue?.color ?? '#f6a133',
        });
        setSessions(next);
        setNotice('Sesion guardada en Recordar');
      }
      dispatchSession({ type: 'stop' });
      audioRegistry.current.stopAll();
      schedulerState.current = resetCueScheduler();
    },
    onNudge: handleNudge,
  };

  shortcutsRef.current = { session, activeMode, zenMode, timerPanelProps, handleNudge, setActiveMode, setZenMode };

  const timelinePanel = (
    <Timeline
      cues={cues}
      selectedCueId={selectedCueId}
      durationSeconds={session.durationSeconds}
      elapsedSeconds={session.elapsedSeconds}
      onSelectCue={setSelectedCueId}
      onMoveCue={handleMoveCue}
      onSeek={handleSeek}
      onAddCue={handleAddCue}
      onUndo={handleUndoCueChange}
      canUndo={cueHistory.current.length > 0}
      onDurationChange={handleDurationChange}
    />
  );

  const cueInspector = (
    <CueInspector
      cue={selectedCue}
      onChange={updateSelectedCue}
      onPreview={(cue) => audioRegistry.current.playCue(cue, {
        volumeScale: masterVolume / 100,
        muted,
      })}
      onStopPreview={(cue) => audioRegistry.current.stopCue(cue.id)}
      onDuplicate={handleDuplicateCue}
      onDelete={handleDeleteCue}
    />
  );

  const presetLibrary = (
    <PresetLibrary
      presets={presets}
      onLoadPreset={handleLoadPreset}
      onDeletePreset={handleDeletePreset}
    />
  );

  const recentSessions = (
    <RecentSessions
      sessions={sessions}
      onViewAll={() => setActiveMode('remember')}
      onRepeatSession={handleRepeatSession}
      onDeleteSession={handleDeleteSession}
    />
  );

  return (
    <AppShell
      activeMode={activeMode}
      onModeChange={setActiveMode}
      activePanel={activePanel}
      onPanelChange={setActivePanel}
    >
      {notice && <div className="notice" role="status">{notice}</div>}
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

      {zenMode && (
        <div className="zen-overlay">
          <TimerPanel
            {...timerPanelProps}
            onZen={() => setZenMode(false)}
            zenMode
            playingCueName={playingCueName}
            playingInstruction={playingInstruction}
            showSoundNames={showSoundNames}
          />
        </div>
      )}

      <main className={`workspace mode-${activeMode} theme-${theme}`}>
        {activeMode === 'practice' && (
          <section className="practice-workspace">
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
          </section>
        )}

        {activeMode === 'design' && (
          <section className="design-workspace">
            <div className="preset-name-bar">
              <input
                className="preset-name-input"
                type="text"
                placeholder="Nombre del preset"
                value={loadedPreset?.name ?? ''}
                onChange={(e) => setLoadedPreset((p) => ({ id: p?.id ?? null, name: e.target.value }))}
                aria-label="Nombre del preset"
              />
              <button
                type="button"
                className="preset-name-save"
                title="Guardar preset con las cues actuales"
                onClick={() => handleSavePreset(loadedPreset?.name)}
              >
                Guardar preset
              </button>
            </div>
            <PlaybackBar
              session={session}
              onStart={timerPanelProps.onStart}
              onPause={timerPanelProps.onPause}
              onResume={timerPanelProps.onResume}
              onStop={timerPanelProps.onStop}
              onNudge={handleNudge}
            />
            {timelinePanel}
            {cueInspector}
          </section>
        )}

        {activeMode === 'remember' && (
          <section className="remember-workspace">
            {presetLibrary}
            {recentSessions}
          </section>
        )}
      </main>
    </AppShell>
  );
}
