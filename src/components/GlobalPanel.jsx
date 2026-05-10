export function GlobalPanel({
  activePanel,
  onClose,
  durationMinutes,
  onDurationChange,
  theme,
  onThemeToggle,
  masterVolume,
  onMasterVolumeChange,
  muted,
  onMutedChange,
  onStopAudio,
  onExportData,
  onImportData,
}) {
  if (!activePanel) return null;

  return (
    <aside className="global-panel" aria-label="Panel global">
      <div className="global-panel-header">
        <span>Panel</span>
        <button type="button" onClick={onClose}>Cerrar</button>
      </div>
      {activePanel === 'practice' && (
        <>
          <h2>Ajustes de practica</h2>
          <label>
            Duracion
            <input
              type="number"
              min="1"
              max="180"
              value={durationMinutes}
              onChange={(event) => onDurationChange(Number(event.target.value))}
            />
            <span>min</span>
          </label>
        </>
      )}

      {activePanel === 'theme' && (
        <>
          <h2>Tema</h2>
          <button type="button" onClick={onThemeToggle}>
            {theme === 'dim' ? 'Usar contraste alto' : 'Usar tema sobrio'}
          </button>
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
          <button type="button" onClick={onStopAudio}>Detener audio</button>
        </>
      )}

      {activePanel === 'settings' && (
        <>
          <h2>Configuracion</h2>
          <button type="button" onClick={onExportData}>Exportar datos</button>
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
