import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AppShell } from './components/AppShell.jsx';
import { CueInspector } from './components/CueInspector.jsx';
import { GlobalPanel } from './components/GlobalPanel.jsx';
import { ModePanel } from './components/ModePanel.jsx';
import { PresetLibrary } from './components/PresetLibrary.jsx';
import { RecentSessions } from './components/RecentSessions.jsx';
import { Timeline } from './components/Timeline.jsx';
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
  deletePreset,
  deleteSession,
  readJson,
  savePreset,
  saveSession,
  writeJson,
} from './domain/storage.js';

const SESSION_DURATION_SECONDS = 24 * 60;

function nowLabel() {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

export function App() {
  const [activeMode, setActiveMode] = useState('design');
  const [activePanel, setActivePanel] = useState(null);
  const [theme, setTheme] = useState('dim');
  const [cues, setCues] = useState(DEFAULT_CUES);
  const [selectedCueId, setSelectedCueId] = useState('forest');
  const [presets, setPresets] = useState(() =>
    readJson(window.localStorage, STORAGE_KEYS.presets, [])
  );
  const [sessions, setSessions] = useState(() =>
    readJson(window.localStorage, STORAGE_KEYS.sessions, [])
  );
  const [notice, setNotice] = useState('');
  const [masterVolume, setMasterVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [session, dispatchSession] = useReducer(
    sessionReducer,
    createSessionState({ durationSeconds: SESSION_DURATION_SECONDS })
  );
  const audioRegistry = useRef(new AudioRegistry());
  const cueHistory = useRef([]);
  const schedulerState = useRef(createCueSchedulerState());

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

  function handleSavePreset() {
    const next = savePreset(window.localStorage, {
      id: crypto.randomUUID(),
      name: selectedCue?.name ?? 'Preset Sadhana',
      createdAt: new Date().toISOString(),
      cues,
    });
    setPresets(next);
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
    setActiveMode('design');
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
    setActiveMode('practice');
    setNotice(`Lista para repetir: ${item.name}`);
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

  const timerPanel = (
    <TimerPanel
      session={session}
      onStart={() => {
        schedulerState.current = resetCueScheduler();
        dispatchSession({ type: 'start', now: Date.now() });
      }}
      onPause={() => dispatchSession({ type: 'pause', now: Date.now() })}
      onResume={() => dispatchSession({ type: 'resume', now: Date.now() })}
      onStop={() => {
        dispatchSession({ type: 'stop' });
        audioRegistry.current.stopAll();
        schedulerState.current = resetCueScheduler();
      }}
      onNudge={handleNudge}
    />
  );

  const timelinePanel = (
    <Timeline
      cues={cues}
      selectedCueId={selectedCueId}
      durationSeconds={session.durationSeconds}
      elapsedSeconds={session.elapsedSeconds}
      onSelectCue={setSelectedCueId}
      onAddCue={handleAddCue}
      onUndo={handleUndoCueChange}
      canUndo={cueHistory.current.length > 0}
    />
  );

  const cueInspector = (
    <CueInspector
      cue={selectedCue}
      onChange={updateSelectedCue}
      onSavePreset={handleSavePreset}
      onPreview={(cue) => audioRegistry.current.playCue(cue, {
        volumeScale: masterVolume / 100,
        muted,
      })}
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
        durationMinutes={Math.round(session.durationSeconds / 60)}
        onDurationChange={handleDurationChange}
        theme={theme}
        onThemeToggle={() => setTheme((current) => (current === 'dim' ? 'contrast' : 'dim'))}
        masterVolume={masterVolume}
        onMasterVolumeChange={setMasterVolume}
        muted={muted}
        onMutedChange={setMuted}
        onStopAudio={() => audioRegistry.current.stopAll()}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />
      <main className={`workspace mode-${activeMode} theme-${theme}`}>
        <ModePanel
          activeMode={activeMode}
          cueCount={cues.length}
          presetCount={presets.length}
          sessionCount={sessions.length}
          onModeChange={setActiveMode}
        />

        {activeMode === 'practice' && (
          <section className="practice-workspace">
            {timerPanel}
            <section className="practice-cues" aria-label="Cues activas">
              <div className="recent-header">
                <h2>Cues activas</h2>
                <button type="button" onClick={() => setActiveMode('design')}>Editar</button>
              </div>
              <div className="practice-cue-list">
                {cues.map((cue) => (
                  <button
                    key={cue.id}
                    type="button"
                    className={cue.id === selectedCueId ? 'practice-cue active' : 'practice-cue'}
                    onClick={() => setSelectedCueId(cue.id)}
                  >
                    <span>{cue.name}</span>
                    <strong>{Math.floor(cue.time / 60)}:{String(cue.time % 60).padStart(2, '0')}</strong>
                  </button>
                ))}
              </div>
            </section>
          </section>
        )}

        {activeMode === 'design' && (
          <section className="design-workspace">
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
