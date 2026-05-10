export function ModePanel({ activeMode, cueCount, presetCount, sessionCount, onModeChange }) {
  const content = {
    practice: {
      title: 'Practicar',
      text: 'Sesion limpia con temporizador, playhead y cues programadas desde la lista activa.',
      action: 'Ajustar diseno',
      nextMode: 'design',
      meta: `${cueCount} cues activas`,
    },
    design: {
      title: 'Diseñar',
      text: 'Edita, crea, duplica y ordena cues antes de guardar un preset reutilizable.',
      action: 'Ver memoria',
      nextMode: 'remember',
      meta: `${cueCount} cues en la linea de tiempo`,
    },
    remember: {
      title: 'Recordar',
      text: 'Carga presets guardados y revisa sesiones recientes para repetir o limpiar historial.',
      action: 'Practicar ahora',
      nextMode: 'practice',
      meta: `${presetCount} presets · ${sessionCount} sesiones`,
    },
  }[activeMode];

  return (
    <section className="mode-note" aria-label={`Modo ${content.title}`}>
      <div>
        <h2>{content.title}</h2>
        <p>{content.text}</p>
      </div>
      <strong>{content.meta}</strong>
      <button type="button" onClick={() => onModeChange(content.nextMode)}>{content.action}</button>
    </section>
  );
}
