import { DEFAULT_CUES } from '../domain/cues.js';

const fallbackPresets = [
  {
    id: 'sample-ritual',
    name: 'Secuencia completa',
    cues: DEFAULT_CUES,
    sample: true,
  },
  {
    id: 'sample-breath',
    name: 'Sesion breve',
    cues: DEFAULT_CUES.map((cue) => ({
      ...cue,
      time: Math.round(cue.time * 0.5),
      duration: Math.max(12, Math.round(cue.duration * 0.5)),
    })),
    sample: true,
  },
];

export function PresetLibrary({ presets, onLoadPreset, onDeletePreset }) {
  const items = presets.length > 0 ? presets : fallbackPresets;

  return (
    <section className="preset-library" aria-label="Presets guardados">
      <div className="section-header">
        <h2>Presets</h2>
        <span>{items.length}</span>
      </div>
      <div className="preset-list">
        {items.map((preset) => (
          <article key={preset.id} className="preset-card">
            <div>
              <h3>{preset.name}</h3>
              <p>{preset.cues?.length ?? 0} cues</p>
            </div>
            <button type="button" title={`Cargar preset: ${preset.name}`} onClick={() => onLoadPreset(preset)}>Cargar</button>
            {!preset.sample && (
              <button type="button" title={`Eliminar preset: ${preset.name}`} onClick={() => onDeletePreset(preset.id)}>Eliminar</button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
