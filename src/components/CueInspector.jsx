import { Copy, Play, Trash2 } from 'lucide-react';
import { SOUND_OPTIONS, formatClockTime } from '../domain/cues.js';

export function CueInspector({ cue, onChange, onSavePreset, onPreview, onDuplicate, onDelete }) {
  if (!cue) return null;

  return (
    <aside className="cue-inspector" aria-label="Editor de cue">
      <div className="inspector-header">
        <h2>Cue</h2>
        <div>
          <button className="icon-button small" type="button" aria-label="Duplicar cue" onClick={onDuplicate}><Copy size={17} /></button>
          <button className="icon-button small" type="button" aria-label="Eliminar cue" onClick={onDelete}><Trash2 size={17} /></button>
        </div>
      </div>

      <label>
        Nombre
        <input value={cue.name} onChange={(event) => onChange({ name: event.target.value })} />
      </label>

      <label>
        Sonido
        <div className="select-row">
          <select value={cue.sound} onChange={(event) => onChange({ sound: event.target.value })}>
            {SOUND_OPTIONS.map((sound) => (
              <option key={sound.value} value={sound.value}>{sound.label}</option>
            ))}
          </select>
          <button type="button" aria-label="Previsualizar sonido" onClick={() => onPreview(cue)}>
            <Play size={18} />
          </button>
        </div>
      </label>

      <label>
        Tiempo
        <input
          type="range"
          min="0"
          max="1440"
          value={cue.time}
          onChange={(event) => onChange({ time: Number(event.target.value) })}
        />
        <span className="field-value">{formatClockTime(cue.time)}</span>
      </label>

      <label>
        Volumen
        <input
          type="range"
          min="0"
          max="100"
          value={cue.volume}
          onChange={(event) => onChange({ volume: Number(event.target.value) })}
        />
        <span className="field-value">{cue.volume}%</span>
      </label>

      <div className="field-grid">
        <label>
          Duración
          <input
            type="number"
            min="1"
            max="1440"
            value={cue.duration}
            onChange={(event) => onChange({ duration: Number(event.target.value) })}
          />
        </label>
        <label>
          Entrada
          <input
            type="number"
            min="0"
            max="30"
            value={cue.fadeIn}
            onChange={(event) => onChange({ fadeIn: Number(event.target.value) })}
          />
        </label>
        <label>
          Salida
          <input
            type="number"
            min="0"
            max="30"
            value={cue.fadeOut}
            onChange={(event) => onChange({ fadeOut: Number(event.target.value) })}
          />
        </label>
      </div>

      <label>
        Notas
        <textarea value={cue.notes} onChange={(event) => onChange({ notes: event.target.value })} placeholder="Añade notas sobre este cue..." />
      </label>

      <button className="save-preset" type="button" onClick={onSavePreset}>
        Guardar preset
      </button>
    </aside>
  );
}
