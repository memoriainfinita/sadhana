import { ChevronDown, ChevronUp, Maximize2, Minimize2, Pause, Pencil, Play, RotateCcw, RotateCw, Square } from 'lucide-react';
import { getRemainingSeconds } from '../domain/session.js';
import { useT } from '../i18n/useT.js';

function formatRemaining(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function TimerPanel({ session, onStart, onPause, onResume, onStop, onNudge, onZen, zenMode = false, presetName, playingCueName, playingInstruction, showSoundNames = true, cues, playingCueId, cuesVisible, onToggleCues, onEditCues }) {
  const t = useT();
  const remaining = getRemainingSeconds(session);
  const isRunning = session.status === 'running';
  const isPaused = session.status === 'paused';
  const isIdle = session.status === 'idle';
  const progress = session.durationSeconds > 0
    ? (session.elapsedSeconds / session.durationSeconds) * 100
    : 0;

  return (
    <section className="timer-panel" aria-label={t('timer.panelLabel')}>
      <div className="timer-panel-header">
        <span className="duration-label">{Math.round(session.durationSeconds / 60)} min</span>
        <button className="icon-button small" type="button" onClick={onZen} aria-label={zenMode ? t('timer.zenExit') : t('timer.zenEnter')} title={zenMode ? t('timer.zenExitTitle') : t('timer.zenEnterTitle')}>
          {zenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
      {presetName && <div className="timer-preset-name">{presetName}</div>}
      <div className="timer-readout">{formatRemaining(remaining)}</div>
      <div className="timer-progress">
        <div className="timer-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className={`playing-instruction-label${playingInstruction ? ' visible' : ''}`}>
        {playingInstruction}
      </div>
      {showSoundNames && (
        <div className={`playing-cue-label${playingCueName ? ' visible' : ''}`}>
          {playingCueName}
        </div>
      )}
      <div className="timer-controls">
        <button className="round-button secondary" type="button" onClick={() => onNudge(-15)} aria-label={t('timer.back')} title={t('timer.back')}>
          <RotateCcw size={20} />
          <span>15</span>
        </button>
        {isRunning ? (
          <button className="round-button primary" type="button" onClick={onPause} aria-label={t('timer.pauseSession')} title={t('timer.pauseSession')}>
            <Pause size={34} fill="currentColor" />
          </button>
        ) : (
          <button className="round-button primary" type="button" onClick={isPaused ? onResume : onStart} aria-label={t('timer.startResume')} title={isPaused ? t('timer.resumeTitle') : t('timer.startTitle')}>
            <Play size={32} fill="currentColor" />
          </button>
        )}
        <button className="round-button secondary" type="button" onClick={() => onNudge(15)} aria-label={t('timer.forward')} title={t('timer.forward')}>
          <RotateCw size={20} />
          <span>15</span>
        </button>
      </div>
      <div className="timer-bottom">
        <button className="stop-button" type="button" onClick={onStop} disabled={isIdle} title={t('timer.stopTitle')}>
          <Square size={15} fill="currentColor" />
          {t('timer.stop')}
        </button>
        {onToggleCues && (
          <div className="timer-cue-actions">
            <button type="button" className="icon-button small" title={cuesVisible ? t('timer.hideCues') : t('timer.showCues')} onClick={onToggleCues}>
              {cuesVisible ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            <button type="button" className="icon-button small" title={t('timer.editCues')} onClick={onEditCues}>
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
