// src/i18n/locales/es.js
export default {
  app: { title: 'Sadhana' },

  modes: { navLabel: 'Modos de Sadhana', practice: 'Practicar', design: 'Disenar', remember: 'Recordar' },

  shell: {
    brand: 'Sadhana',
    globalControls: 'Controles globales',
    theme: 'Tema', themeTitle: 'Tema y color de acento',
    audio: 'Audio', audioTitle: 'Volumen y silencio',
    settings: 'Configuracion', settingsTitle: 'Exportar / importar datos',
  },

  panel: { header: 'Panel', close: 'Cerrar', closeTitle: 'Cerrar panel' },

  theme: {
    heading: 'Tema',
    useContrast: 'Usar contraste alto', useDim: 'Usar tema sobrio',
    toggleTitle: 'Cambiar entre tema sobrio y alto contraste',
    accentLabel: 'Color de acento', customColor: 'Color personalizado',
    accents: { amber: 'Ambar', gold: 'Oro', sage: 'Salvia', cyan: 'Cian', rose: 'Rosa', lilac: 'Lila' },
  },

  audio: {
    heading: 'Audio', masterVolume: 'Volumen maestro', mute: 'Silenciar',
    stop: 'Detener audio', stopTitle: 'Detener todo el audio en reproduccion ahora mismo',
  },

  settings: {
    heading: 'Configuracion',
    showSoundNames: 'Mostrar nombre del sonido al dispararse',
    export: 'Exportar datos', exportTitle: 'Copiar presets y sesiones al portapapeles como JSON',
    importPlaceholder: 'Pega aqui un JSON exportado',
    language: 'Idioma',
  },

  playback: {
    back: 'Retroceder 15s', backTitle: 'Retroceder 15 segundos',
    pause: 'Pausar', pauseTitle: 'Pausar reproduccion',
    play: 'Reproducir', startTitle: 'Iniciar reproduccion', resumeTitle: 'Reanudar reproduccion',
    forward: 'Avanzar 15s', forwardTitle: 'Avanzar 15 segundos',
    stop: 'Detener', stopTitle: 'Detener y guardar sesion',
  },

  timer: {
    panelLabel: 'Temporizador de practica',
    zenEnter: 'Modo zen', zenExit: 'Salir del modo zen',
    zenEnterTitle: 'Modo zen — pantalla completa', zenExitTitle: 'Salir del modo zen',
    back: 'Retroceder 15 segundos', forward: 'Avanzar 15 segundos',
    pauseSession: 'Pausar sesion',
    startResume: 'Iniciar o reanudar sesion', startTitle: 'Iniciar sesion', resumeTitle: 'Reanudar sesion',
    stop: 'Detener', stopTitle: 'Detener sesion y guardar en Recordar',
    hideCues: 'Ocultar cues', showCues: 'Mostrar cues', editCues: 'Editar cues',
  },

  timeline: {
    panelLabel: 'Linea de tiempo', heading: 'Linea de tiempo',
    add: 'Anadir', addTitle: 'Anadir nueva cue en la posicion actual',
    undo: 'Deshacer', undoTitle: 'Deshacer ultimo cambio',
    search: 'Buscar', searchTitle: 'Buscar cue por nombre',
    duration: 'Duracion', min: 'min',
    searchLabel: 'Buscar cue', searchPlaceholder: 'Nombre de cue',
    cueAria: 'Cue {name}',
  },

  inspector: {
    aside: 'Editor de cue', heading: 'Cue',
    duplicate: 'Duplicar cue', duplicateTitle: 'Duplicar esta cue',
    delete: 'Eliminar cue', deleteTitle: 'Eliminar esta cue',
    name: 'Nombre', sound: 'Sonido',
    preview: 'Previsualizar sonido', previewTitle: 'Reproducir sonido de esta cue',
    stopPreview: 'Parar preview', stopPreviewTitle: 'Parar reproduccion del sonido',
    instruction: 'Instruccion', instructionPlaceholder: 'ej. Inhala, Reten, Exhala...',
    visibility: 'Visibilidad (s)', time: 'Tiempo', volume: 'Volumen',
    durationField: 'Dur. (s)', fadeIn: 'Fade in (s)', fadeOut: 'Fade out (s)',
    notes: 'Notas', notesPlaceholder: 'Anade notas sobre este cue...',
  },

  sounds: { groups: { bells: 'Campanas', ambient: 'Ambiente', fx: 'Efectos' } },

  library: {
    heading: 'Presets', empty: 'Aun no tienes presets. Crea uno desde Disenar y guardalo.',
    cueCount: { one: '{n} cue', other: '{n} cues' },
    durationMin: '{min} min',
    load: 'Cargar', loadTitle: 'Cargar preset: {name}',
    delete: 'Eliminar', deleteTitle: 'Eliminar preset: {name}',
  },

  presets: {
    'default-yoga-nidra': 'Yoga Nidra',
    'default-pranayama-478': 'Pranayama 4-7-8',
    'default-meditacion-matutina': 'Meditacion matutina',
    'default-relajacion-profunda': 'Relajacion profunda',
    'default-caminata-consciente': 'Caminata consciente',
  },

  sessions: {
    heading: 'Ultimas sesiones', sectionLabel: 'Ultimas sesiones', viewAll: 'Ver todo',
    empty: 'Aun no has completado ninguna sesion. Practica y apareceran aqui.',
    repeat: 'Repetir', repeatTitle: 'Ir a Practicar con la sesion: {name}',
    delete: 'Eliminar', deleteTitle: 'Eliminar sesion: {name}',
    optionsAria: 'Opciones de {name}', repeatAria: 'Repetir {name}', deleteAria: 'Eliminar {name}',
    defaultName: 'Sesion completada', withCue: 'Sesion con {name}',
  },

  presetBar: {
    placeholder: 'Nombre del preset', nameAria: 'Nombre del preset',
    save: 'Guardar preset', saveTitle: 'Guardar preset con las cues actuales',
  },

  notices: {
    cueAdded: 'Cue anadida', cueDuplicated: 'Cue duplicada', cueDeleted: 'Cue eliminada',
    changeUndone: 'Cambio deshecho',
    presetSaved: 'Preset guardado', presetLoaded: 'Preset cargado: {name}', presetDeleted: 'Preset eliminado',
    sessionSaved: 'Sesion guardada en Recordar', sessionDeleted: 'Sesion eliminada',
    repeat: 'Repetir: {name}', durationUpdated: 'Duracion actualizada',
    dataCopied: 'Datos copiados al portapapeles', dataImported: 'Datos importados', invalidJson: 'JSON no valido',
  },
};
