import { Pause, Play, RotateCcw, RotateCw, Square } from 'lucide-react';
import { getRemainingSeconds } from '../domain/session.js';
import { useT } from '../i18n/useT.js';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function PlaybackBar({ session, instruction, onStart, onPause, onResume, onStop, onNudge }) {
  const t = useT();
  const isRunning = session.status === 'running';
  const isPaused = session.status === 'paused';
  const isIdle = session.status === 'idle';
  const elapsed = session.elapsedSeconds;
  const remaining = getRemainingSeconds(session);

  return (
    <div className="playback-bar">
      <div className="playback-controls">
        <button
          className="icon-button small"
          type="button"
          onClick={() => onNudge(-15)}
          disabled={isIdle}
          aria-label={t('playback.back')}
          title={t('playback.backTitle')}
        >
          <RotateCcw size={15} />
        </button>

        {isRunning ? (
          <button className="playback-play" type="button" onClick={onPause} aria-label={t('playback.pause')} title={t('playback.pauseTitle')}>
            <Pause size={18} fill="currentColor" />
          </button>
        ) : (
          <button className="playback-play" type="button" onClick={isPaused ? onResume : onStart} aria-label={t('playback.play')} title={isPaused ? t('playback.resumeTitle') : t('playback.startTitle')}>
            <Play size={18} fill="currentColor" />
          </button>
        )}

        <button
          className="icon-button small"
          type="button"
          onClick={() => onNudge(15)}
          disabled={isIdle}
          aria-label={t('playback.forward')}
          title={t('playback.forwardTitle')}
        >
          <RotateCw size={15} />
        </button>

        <button
          className="icon-button small"
          type="button"
          onClick={onStop}
          disabled={isIdle}
          aria-label={t('playback.stop')}
          title={t('playback.stopTitle')}
        >
          <Square size={14} fill="currentColor" />
        </button>
      </div>

      <div className="playback-time">
        <span className="playback-elapsed">{formatTime(elapsed)}</span>
        <span className="playback-separator">/</span>
        <span className="playback-remaining">{formatTime(remaining)}</span>
      </div>

      {instruction && <p className="playback-instruction">{instruction}</p>}
    </div>
  );
}
