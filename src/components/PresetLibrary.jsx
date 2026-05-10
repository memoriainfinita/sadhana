export function PresetLibrary({ presets, onLoadPreset, onDeletePreset }) {
  return (
    <section className="preset-library" aria-label="Presets guardados">
      <div className="recent-header">
        <h2>Presets</h2>
        <span>{presets.length}</span>
      </div>
      {presets.length === 0 ? (
        <p>No hay presets guardados todavia.</p>
      ) : (
        <div className="preset-list">
          {presets.map((preset) => (
            <article key={preset.id} className="preset-card">
              <div>
                <h3>{preset.name}</h3>
                <p>{preset.cues?.length ?? 0} cues</p>
              </div>
              <button type="button" onClick={() => onLoadPreset(preset)}>Cargar</button>
              <button type="button" onClick={() => onDeletePreset(preset.id)}>Eliminar</button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
