import { useState } from 'react';
import { Bell, Plus, Search, TreePine, Undo2, Waves, ZoomIn } from 'lucide-react';
import { formatClockTime, sortCuesByTime } from '../domain/cues.js';

const iconMap = {
  bell: Bell,
  forest: TreePine,
  bowl: Waves,
};

export function Timeline({
  cues,
  selectedCueId,
  durationSeconds,
  elapsedSeconds,
  onSelectCue,
  onAddCue,
  onUndo,
  canUndo,
}) {
  const sorted = sortCuesByTime(cues);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [zoomed, setZoomed] = useState(false);
  const visibleCues = sorted.filter((cue) => cue.name.toLowerCase().includes(query.toLowerCase()));
  const progress = Math.min(1, elapsedSeconds / durationSeconds) * 100;
  const markerPosition = (cue) => Math.min(96, Math.max(4, (cue.time / durationSeconds) * 100));

  return (
    <section className="timeline-panel" aria-label="Linea de tiempo">
      <div className="timeline-header">
        <h2>Linea de tiempo</h2>
        <span className="timeline-duration">{formatClockTime(durationSeconds)}</span>
      </div>

      <div className="ruler" aria-hidden="true">
        <span>0:00</span>
        <span>6:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>

      <div className={zoomed ? 'cue-map zoomed' : 'cue-map'}>
        <div className="map-line" />
        {visibleCues.map((cue) => (
          <button
            key={cue.id}
            className={cue.id === selectedCueId ? 'cue-marker selected' : 'cue-marker'}
            style={{ left: `${markerPosition(cue)}%`, '--cue-color': cue.color }}
            type="button"
            onClick={() => onSelectCue(cue.id)}
            aria-label={`Seleccionar ${cue.name}`}
          >
            <span />
            <strong>{formatClockTime(cue.time)}</strong>
            <em>{cue.name}</em>
          </button>
        ))}
        <div className="playhead" style={{ left: `${progress}%` }}>
          <span>{formatClockTime(elapsedSeconds)}</span>
        </div>
      </div>

      <div className="timeline-toolbar" aria-label="Herramientas de timeline">
        <button type="button" onClick={onAddCue}><Plus size={18} />Añadir cue</button>
        <button type="button" aria-label="Deshacer" onClick={onUndo} disabled={!canUndo}><Undo2 size={18} /></button>
        <button type="button" aria-label="Buscar" onClick={() => setSearchOpen((open) => !open)}><Search size={18} /></button>
        <button type="button" aria-label="Ampliar" onClick={() => setZoomed((current) => !current)}><ZoomIn size={18} /></button>
      </div>
      {searchOpen && (
        <label className="timeline-search">
          Buscar cue
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre de cue" />
        </label>
      )}

      <div className="tracks">
        {visibleCues.map((cue) => {
          const Icon = iconMap[cue.icon] ?? Bell;
          return (
            <button
              key={cue.id}
              className={cue.id === selectedCueId ? 'track-row selected' : 'track-row'}
              type="button"
              onClick={() => onSelectCue(cue.id)}
            >
              <div className="track-label">
                <Icon size={23} style={{ color: cue.color }} />
                <span>{cue.name}</span>
              </div>
              <div className="track-line">
                <div
                  className="track-clip"
                  style={{
                    left: `${(cue.time / durationSeconds) * 100}%`,
                    width: `${Math.max(8, (cue.duration / durationSeconds) * 100)}%`,
                    '--cue-color': cue.color,
                  }}
                >
                  <span>{formatClockTime(cue.time)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
