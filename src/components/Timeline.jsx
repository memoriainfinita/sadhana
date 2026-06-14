import { useRef, useState } from 'react';
import { Plus, Search, Undo2 } from 'lucide-react';
import { formatClockTime, sortCuesByTime } from '../domain/cues.js';
import { createTimelineTicks } from '../domain/timeline.js';
import { stepFromKey } from '../domain/keyboard.js';
import { TrackClip } from './TrackClip.jsx';
import { useT } from '../i18n/useT.js';

export function Timeline({
  cues,
  selectedCueId,
  durationSeconds,
  elapsedSeconds,
  onSelectCue,
  onMoveCue,
  onResizeCue,
  onFadeCue,
  onSeek,
  onAddCue,
  onUndo,
  canUndo,
  onDurationChange,
}) {
  const t = useT();
  const sorted = sortCuesByTime(cues);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [playheadDragging, setPlayheadDragging] = useState(false);
  const mapRef = useRef(null);
  const visibleCues = sorted.filter((cue) => cue.name.toLowerCase().includes(query.toLowerCase()));
  const ticks = createTimelineTicks(durationSeconds);
  const progress = Math.min(1, elapsedSeconds / durationSeconds) * 100;
  const markerPosition = (cue) => Math.min(100, Math.max(0, (cue.time / durationSeconds) * 100));
  const markerClassName = (cue) => {
    const base = cue.id === draggingId ? 'cue-marker dragging' : 'cue-marker';
    if (cue.time <= 0) return `${base} edge-start`;
    if (cue.time >= durationSeconds) return `${base} edge-end`;
    return cue.id === selectedCueId ? `${base} selected` : base;
  };

  function handleMarkerPointerDown(cue, event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingId(cue.id);
    onSelectCue(cue.id);
  }

  function handleMarkerPointerMove(cue, event) {
    if (draggingId !== cue.id) return;
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    onMoveCue(cue.id, Math.round(ratio * durationSeconds));
  }

  function handleMarkerPointerUp() {
    setDraggingId(null);
  }

  function handlePlayheadPointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setPlayheadDragging(true);
  }

  function handlePlayheadPointerMove(event) {
    if (!playheadDragging) return;
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    onSeek(Math.round(ratio * durationSeconds));
  }

  function handlePlayheadPointerUp() {
    setPlayheadDragging(false);
  }

  function handlePlayheadKeyDown(event) {
    const next = stepFromKey(Math.round(elapsedSeconds), event.key, {
      min: 0,
      max: durationSeconds,
      step: 5,
    });
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    onSeek(next);
  }

  return (
    <section className="timeline-panel" aria-label={t('timeline.panelLabel')}>
      <div className="timeline-header">
        <h2>{t('timeline.heading')}</h2>
        <div className="timeline-header-actions">
          <button type="button" title={t('timeline.addTitle')} onClick={onAddCue}><Plus size={16} />{t('timeline.add')}</button>
          <button type="button" className="icon-button small" aria-label={t('timeline.undo')} title={t('timeline.undoTitle')} onClick={onUndo} disabled={!canUndo}><Undo2 size={15} /></button>
          <button type="button" className="icon-button small" aria-label={t('timeline.search')} title={t('timeline.searchTitle')} onClick={() => setSearchOpen((open) => !open)}><Search size={15} /></button>
        </div>
        <label className="duration-control">
          <span>{t('timeline.duration')}</span>
          <input
            type="number"
            min="1"
            max="180"
            value={Math.round(durationSeconds / 60)}
            onChange={(event) => onDurationChange(Number(event.target.value))}
          />
          <span>{t('timeline.min')}</span>
        </label>
      </div>

      <div className="scale-lane ruler" aria-hidden="true">
        {ticks.map((tick) => (
          <span key={tick}>{formatClockTime(tick)}</span>
        ))}
      </div>

      <div className="cue-map" ref={mapRef}>
        <div className="map-line" />
        {visibleCues.map((cue) => (
          <button
            key={cue.id}
            className={markerClassName(cue)}
            style={{ left: `${markerPosition(cue)}%`, '--cue-color': cue.color }}
            type="button"
            aria-label={t('timeline.cueAria', { name: cue.name })}
            onPointerDown={(e) => handleMarkerPointerDown(cue, e)}
            onPointerMove={(e) => handleMarkerPointerMove(cue, e)}
            onPointerUp={handleMarkerPointerUp}
          >
            <span />
            <strong>{formatClockTime(cue.time)}</strong>
            <em>{cue.name}</em>
          </button>
        ))}
        <div
          className={playheadDragging ? 'playhead dragging' : 'playhead'}
          style={{ left: `${progress}%` }}
          role="slider"
          tabIndex={0}
          aria-label={t('timeline.playheadAria')}
          aria-valuemin={0}
          aria-valuemax={durationSeconds}
          aria-valuenow={Math.round(elapsedSeconds)}
          aria-valuetext={formatClockTime(Math.round(elapsedSeconds))}
          onPointerDown={handlePlayheadPointerDown}
          onPointerMove={handlePlayheadPointerMove}
          onPointerUp={handlePlayheadPointerUp}
          onKeyDown={handlePlayheadKeyDown}
        >
          <span>{formatClockTime(elapsedSeconds)}</span>
        </div>
      </div>

      {searchOpen && (
        <label className="timeline-search">
          {t('timeline.searchLabel')}
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('timeline.searchPlaceholder')} />
        </label>
      )}

      <div className="tracks">
        {visibleCues.map((cue) => (
          <TrackRow
            key={cue.id}
            cue={cue}
            selected={cue.id === selectedCueId}
            durationSeconds={durationSeconds}
            onSelectCue={onSelectCue}
            onResizeCue={onResizeCue}
            onFadeCue={onFadeCue}
          />
        ))}
      </div>
    </section>
  );
}

function TrackRow({ cue, selected, durationSeconds, onSelectCue, onResizeCue, onFadeCue }) {
  const lineRef = useRef(null);

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectCue(cue.id);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={selected ? 'track-row selected' : 'track-row'}
      onClick={() => onSelectCue(cue.id)}
      onKeyDown={handleKeyDown}
    >
      <div className="track-line" ref={lineRef}>
        <TrackClip
          cue={cue}
          durationSeconds={durationSeconds}
          selected={selected}
          trackLineRef={lineRef}
          onSelect={() => onSelectCue(cue.id)}
          onResizeCue={onResizeCue}
          onFadeCue={onFadeCue}
        />
      </div>
    </div>
  );
}
