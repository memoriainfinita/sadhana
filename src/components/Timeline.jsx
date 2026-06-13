import { useRef, useState } from 'react';
import { Plus, Search, Undo2 } from 'lucide-react';
import { formatClockTime, sortCuesByTime } from '../domain/cues.js';
import { createTimelineTicks } from '../domain/timeline.js';
import { TrackClip } from './TrackClip.jsx';

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

  return (
    <section className="timeline-panel" aria-label="Linea de tiempo">
      <div className="timeline-header">
        <h2>Linea de tiempo</h2>
        <div className="timeline-header-actions">
          <button type="button" title="Añadir nueva cue en la posicion actual" onClick={onAddCue}><Plus size={16} />Añadir</button>
          <button type="button" className="icon-button small" aria-label="Deshacer" title="Deshacer ultimo cambio" onClick={onUndo} disabled={!canUndo}><Undo2 size={15} /></button>
          <button type="button" className="icon-button small" aria-label="Buscar" title="Buscar cue por nombre" onClick={() => setSearchOpen((open) => !open)}><Search size={15} /></button>
        </div>
        <label className="duration-control">
          <span>Duracion</span>
          <input
            type="number"
            min="1"
            max="180"
            value={Math.round(durationSeconds / 60)}
            onChange={(event) => onDurationChange(Number(event.target.value))}
          />
          <span>min</span>
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
            aria-label={`Cue ${cue.name}`}
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
          onPointerDown={handlePlayheadPointerDown}
          onPointerMove={handlePlayheadPointerMove}
          onPointerUp={handlePlayheadPointerUp}
        >
          <span>{formatClockTime(elapsedSeconds)}</span>
        </div>
      </div>

      {searchOpen && (
        <label className="timeline-search">
          Buscar cue
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre de cue" />
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
