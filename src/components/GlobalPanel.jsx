const ACCENT_PRESETS = [
  { label: 'Ambar', value: '#f6a133' },
  { label: 'Oro', value: '#e8c547' },
  { label: 'Salvia', value: '#7eb87a' },
  { label: 'Cian', value: '#4db8b5' },
  { label: 'Rosa', value: '#e07070' },
  { label: 'Lila', value: '#9b8bc8' },
];

export function GlobalPanel({
  activePanel,
  onClose,
  theme,
  onThemeToggle,
  accentColor,
  onAccentColorChange,
  masterVolume,
  onMasterVolumeChange,
  muted,
  onMutedChange,
  onStopAudio,
  onExportData,
  onImportData,
  showSoundNames,
  onShowSoundNamesChange,
}) {
  if (!activePanel) return null;

  return (
    <aside className="global-panel" aria-label="Panel global">
      <div className="global-panel-header">
        <span>Panel</span>
        <button type="button" title="Cerrar panel" onClick={onClose}>Cerrar</button>
      </div>

      {activePanel === 'theme' && (
        <>
          <h2>Tema</h2>
          <button type="button" title="Cambiar entre tema sobrio y alto contraste" onClick={onThemeToggle}>
            {theme === 'dim' ? 'Usar contraste alto' : 'Usar tema sobrio'}
          </button>
          <label>
            Color de acento
            <div className="accent-presets">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={`accent-swatch${accentColor === preset.value ? ' active' : ''}`}
                  style={{ background: preset.value }}
                  aria-label={preset.label}
                  title={preset.label}
                  onClick={() => onAccentColorChange(preset.value)}
                />
              ))}
              <input
                type="color"
                value={accentColor}
                onChange={(e) => onAccentColorChange(e.target.value)}
                aria-label="Color personalizado"
                title="Color personalizado"
                className="accent-color-input"
              />
            </div>
          </label>
        </>
      )}

      {activePanel === 'audio' && (
        <>
          <h2>Audio</h2>
          <label>
            Volumen maestro
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(event) => onMasterVolumeChange(Number(event.target.value))}
            />
            <span>{masterVolume}%</span>
          </label>
          <label className="check-row">
            <input type="checkbox" checked={muted} onChange={(event) => onMutedChange(event.target.checked)} />
            Silenciar
          </label>
          <button type="button" title="Detener todo el audio en reproduccion ahora mismo" onClick={onStopAudio}>Detener audio</button>
        </>
      )}

      {activePanel === 'settings' && (
        <>
          <h2>Configuracion</h2>
          <label className="check-row">
            <input
              type="checkbox"
              checked={showSoundNames}
              onChange={(event) => onShowSoundNamesChange(event.target.checked)}
            />
            Mostrar nombre del sonido al dispararse
          </label>
          <button type="button" title="Copiar presets y sesiones al portapapeles como JSON" onClick={onExportData}>Exportar datos</button>
          <textarea
            placeholder="Pega aqui un JSON exportado"
            onBlur={(event) => {
              if (event.target.value.trim()) onImportData(event.target.value);
            }}
          />
        </>
      )}
    </aside>
  );
}
