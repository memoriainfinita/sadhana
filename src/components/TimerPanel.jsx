import { Pause, Play, RotateCcw, RotateCw, Square } from 'lucide-react';
import { getRemainingSeconds } from '../domain/session.js';

function formatRemaining(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function TimerPanel({ session, onStart, onPause, onResume, onStop, onNudge }) {
  const remaining = getRemainingSeconds(session);
  const isRunning = session.status === 'running';
  const isPaused = session.status === 'paused';

  return (
    <section className="timer-panel" aria-label="Temporizador de practica">
      <div className="duration-label">{Math.round(session.durationSeconds / 60)} min</div>
      <div className="timer-readout">{formatRemaining(remaining)}</div>
      <div className="timer-controls">
        <button className="round-button secondary" type="button" onClick={() => onNudge(-15)} aria-label="Retroceder 15 segundos">
          <RotateCcw size={22} />
          <span>15</span>
        </button>
        {isRunning ? (
          <button className="round-button primary" type="button" onClick={onPause} aria-label="Pausar sesion">
            <Pause size={34} fill="currentColor" />
          </button>
        ) : (
          <button className="round-button primary" type="button" onClick={isPaused ? onResume : onStart} aria-label="Iniciar o reanudar sesion">
            <Play size={32} fill="currentColor" />
          </button>
        )}
        <button className="round-button secondary" type="button" onClick={() => onNudge(15)} aria-label="Avanzar 15 segundos">
          <RotateCw size={22} />
          <span>15</span>
        </button>
      </div>
      <button className="stop-button" type="button" onClick={onStop}>
        <Square size={15} fill="currentColor" />
        Detener
      </button>
    </section>
  );
}
