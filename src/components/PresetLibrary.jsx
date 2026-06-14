import { presetDurationSeconds, resolvePresetName } from '../domain/presets.js';
import { useT } from '../i18n/useT.js';

function presetMinutes(preset) {
  return Math.round(presetDurationSeconds(preset) / 60);
}

export function PresetLibrary({ presets, onLoadPreset, onDeletePreset }) {
  const t = useT();
  return (
    <section className="preset-library" aria-label={t('library.heading')}>
      <div className="section-header">
        <h2>{t('library.heading')}</h2>
        <span>{presets.length}</span>
      </div>
      {presets.length === 0 ? (
        <p className="empty-state">{t('library.empty')}</p>
      ) : (
        <div className="preset-list">
          {presets.map((preset) => {
            const name = resolvePresetName(preset, t);
            return (
              <article key={preset.id} className="preset-card">
                <div>
                  <h3>{name}</h3>
                  <p>{t('library.cueCount', { n: preset.cues?.length ?? 0 })} · {t('library.durationMin', { min: presetMinutes(preset) })}</p>
                </div>
                <button type="button" title={t('library.loadTitle', { name })} onClick={() => onLoadPreset(preset)}>{t('library.load')}</button>
                <button type="button" title={t('library.deleteTitle', { name })} onClick={() => onDeletePreset(preset.id)}>{t('library.delete')}</button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
