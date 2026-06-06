import { Copy, Play, Square, Trash2 } from 'lucide-react';
import { SOUND_OPTION_GROUPS, formatClockTime } from '../domain/cues.js';

export function CueInspector({ cue, onChange, onPreview, onStopPreview, onDuplicate, onDelete }) {
  if (!cue) return null;

  return (
    <aside className="cue-inspector" aria-label="Editor de cue">
      <div className="inspector-header">
        <h2>Cue</h2>
        <div>
          <button className="icon-button small" type="button" aria-label="Duplicar cue" title="Duplicar esta cue" onClick={onDuplicate}><Copy size={17} /></button>
          <button className="icon-button small" type="button" aria-label="Eliminar cue" title="Eliminar esta cue" onClick={onDelete}><Trash2 size={17} /></button>
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
            {SOUND_OPTION_GROUPS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map((sound) => (
                  <option key={sound.value} value={sound.value}>{sound.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button type="button" aria-label="Previsualizar sonido" title="Reproducir sonido de esta cue" onClick={() => onPreview(cue)}>
            <Play size={18} />
          </button>
          <button type="button" aria-label="Parar preview" title="Parar reproduccion del sonido" onClick={() => onStopPreview(cue)}>
            <Square size={16} fill="currentColor" />
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
          Dur. (s)
          <input
            type="number"
            min="1"
            max="1440"
            value={cue.duration}
            onChange={(event) => onChange({ duration: Number(event.target.value) })}
          />
        </label>
        <label>
          Fade in (s)
          <input
            type="number"
            min="0"
            max="30"
            value={cue.fadeIn}
            onChange={(event) => onChange({ fadeIn: Number(event.target.value) })}
          />
        </label>
        <label>
          Fade out (s)
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

    </aside>
  );
}
