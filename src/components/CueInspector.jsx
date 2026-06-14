import { Copy, Play, Square, Trash2 } from 'lucide-react';
import { SOUND_OPTION_GROUPS, formatClockTime } from '../domain/cues.js';
import { useT } from '../i18n/useT.js';

export function CueInspector({ cue, durationSeconds = 1440, onChange, onPreview, onStopPreview, onDuplicate, onDelete }) {
  const t = useT();
  if (!cue) return null;

  return (
    <aside className="cue-inspector" aria-label={t('inspector.aside')}>
      <div className="inspector-header">
        <h2>{t('inspector.heading')}</h2>
        <div>
          <button className="icon-button small" type="button" aria-label={t('inspector.duplicate')} title={t('inspector.duplicateTitle')} onClick={onDuplicate}><Copy size={17} /></button>
          <button className="icon-button small" type="button" aria-label={t('inspector.delete')} title={t('inspector.deleteTitle')} onClick={onDelete}><Trash2 size={17} /></button>
        </div>
      </div>

      <label>
        {t('inspector.name')}
        <input value={cue.name} onChange={(event) => onChange({ name: event.target.value })} />
      </label>

      <label>
        {t('inspector.sound')}
        <div className="select-row">
          <select value={cue.sound} onChange={(event) => onChange({ sound: event.target.value })}>
            {SOUND_OPTION_GROUPS.map((group) => {
              const translated = t('sounds.groups.' + group.folder);
              const shown = translated.startsWith('sounds.groups.') ? group.group : translated;
              return (
                <optgroup key={group.folder} label={shown}>
                  {group.options.map((sound) => (
                    <option key={sound.value} value={sound.value}>{sound.label}</option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <button type="button" aria-label={t('inspector.preview')} title={t('inspector.previewTitle')} onClick={() => onPreview(cue)}>
            <Play size={18} />
          </button>
          <button type="button" aria-label={t('inspector.stopPreview')} title={t('inspector.stopPreviewTitle')} onClick={() => onStopPreview(cue)}>
            <Square size={16} fill="currentColor" />
          </button>
        </div>
      </label>

      <label>
        {t('inspector.instruction')}
        <input
          value={cue.instruction ?? ''}
          onChange={(event) => onChange({ instruction: event.target.value })}
          placeholder={t('inspector.instructionPlaceholder')}
        />
      </label>

      <label>
        {t('inspector.visibility')}
        <input
          type="number"
          min="1"
          max="60"
          value={cue.instructionDuration ?? 5}
          onChange={(event) => onChange({ instructionDuration: Number(event.target.value) })}
        />
      </label>

      <label>
        {t('inspector.time')}
        <input
          type="range"
          min="0"
          max={durationSeconds}
          value={cue.time}
          onChange={(event) => onChange({ time: Number(event.target.value) })}
        />
        <span className="field-value">{formatClockTime(cue.time)}</span>
      </label>

      <label>
        {t('inspector.volume')}
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
          {t('inspector.durationField')}
          <input
            type="number"
            min="1"
            max="1440"
            value={cue.duration}
            onChange={(event) => onChange({ duration: Number(event.target.value) })}
          />
        </label>
        <label>
          {t('inspector.fadeIn')}
          <input
            type="number"
            min="0"
            max="30"
            value={cue.fadeIn}
            onChange={(event) => onChange({ fadeIn: Number(event.target.value) })}
          />
        </label>
        <label>
          {t('inspector.fadeOut')}
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
        {t('inspector.notes')}
        <textarea value={cue.notes} onChange={(event) => onChange({ notes: event.target.value })} placeholder={t('inspector.notesPlaceholder')} />
      </label>

    </aside>
  );
}
