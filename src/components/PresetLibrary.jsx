import { presetDurationSeconds } from '../domain/presets.js';

function presetMinutes(preset) {
  return Math.round(presetDurationSeconds(preset) / 60);
}

export function PresetLibrary({ presets, onLoadPreset, onDeletePreset }) {
  return (
    <section className="preset-library" aria-label="Presets guardados">
      <div className="section-header">
        <h2>Presets</h2>
        <span>{presets.length}</span>
      </div>
      {presets.length === 0 ? (
        <p className="empty-state">Aún no tienes presets. Crea uno desde Diseñar y guárdalo.</p>
      ) : (
        <div className="preset-list">
          {presets.map((preset) => (
            <article key={preset.id} className="preset-card">
              <div>
                <h3>{preset.name}</h3>
                <p>{preset.cues?.length ?? 0} cues · {presetMinutes(preset)} min</p>
              </div>
              <button type="button" title={`Cargar preset: ${preset.name}`} onClick={() => onLoadPreset(preset)}>Cargar</button>
              <button type="button" title={`Eliminar preset: ${preset.name}`} onClick={() => onDeletePreset(preset.id)}>Eliminar</button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
