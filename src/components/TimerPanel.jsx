import { ChevronDown, ChevronUp, Maximize2, Minimize2, Pause, Pencil, Play, RotateCcw, RotateCw, Square } from 'lucide-react';
import { getRemainingSeconds } from '../domain/session.js';

function formatRemaining(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function TimerPanel({ session, onStart, onPause, onResume, onStop, onNudge, onZen, zenMode = false, presetName, playingCueName, cues, playingCueId, cuesVisible, onToggleCues, onEditCues }) {
  const remaining = getRemainingSeconds(session);
  const isRunning = session.status === 'running';
  const isPaused = session.status === 'paused';
  const isIdle = session.status === 'idle';
  const progress = session.durationSeconds > 0
    ? (session.elapsedSeconds / session.durationSeconds) * 100
    : 0;

  return (
    <section className="timer-panel" aria-label="Temporizador de practica">
      <div className="timer-panel-header">
        <span className="duration-label">{Math.round(session.durationSeconds / 60)} min</span>
        <button className="icon-button small" type="button" onClick={onZen} aria-label={zenMode ? 'Salir del modo zen' : 'Modo zen'} title={zenMode ? 'Salir del modo zen' : 'Modo zen — pantalla completa'}>
          {zenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
      {presetName && <div className="timer-preset-name">{presetName}</div>}
      <div className="timer-readout">{formatRemaining(remaining)}</div>
      <div className="timer-progress">
        <div className="timer-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className={`playing-cue-label${playingCueName ? ' visible' : ''}`}>
        {playingCueName}
      </div>
      <div className="timer-controls">
        <button className="round-button secondary" type="button" onClick={() => onNudge(-15)} aria-label="Retroceder 15 segundos" title="Retroceder 15 segundos">
          <RotateCcw size={20} />
          <span>15</span>
        </button>
        {isRunning ? (
          <button className="round-button primary" type="button" onClick={onPause} aria-label="Pausar sesion" title="Pausar sesion">
            <Pause size={34} fill="currentColor" />
          </button>
        ) : (
          <button className="round-button primary" type="button" onClick={isPaused ? onResume : onStart} aria-label="Iniciar o reanudar sesion" title={isPaused ? 'Reanudar sesion' : 'Iniciar sesion'}>
            <Play size={32} fill="currentColor" />
          </button>
        )}
        <button className="round-button secondary" type="button" onClick={() => onNudge(15)} aria-label="Avanzar 15 segundos" title="Avanzar 15 segundos">
          <RotateCw size={20} />
          <span>15</span>
        </button>
      </div>
      <div className="timer-bottom">
        <button className="stop-button" type="button" onClick={onStop} disabled={isIdle} title="Detener sesion y guardar en Recordar">
          <Square size={15} fill="currentColor" />
          Detener
        </button>
        {onToggleCues && (
          <div className="timer-cue-actions">
            <button type="button" className="icon-button small" title={cuesVisible ? 'Ocultar cues' : 'Mostrar cues'} onClick={onToggleCues}>
              {cuesVisible ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            <button type="button" className="icon-button small" title="Editar cues" onClick={onEditCues}>
              <Pencil size={14} />
            </button>
          </div>
        )}
      </div>

      {cues && cuesVisible && (
        <div className="timer-cue-list">
          {cues.map((cue) => (
            <div key={cue.id} className={cue.id === playingCueId ? 'practice-cue active' : 'practice-cue'}>
              <span>{cue.name}</span>
              <strong>{Math.floor(cue.time / 60)}:{String(cue.time % 60).padStart(2, '0')}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
