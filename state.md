---
created: 2026-05-09
last_updated: 2026-06-07
---

# Sadhana State

## System

- Workspace: `D:\DOCS\CODELAB\1_in-progress\sadhana-v0` (movido desde OneDrive 2026-06-05)
- Project: Sadhana, app audiovisual/musical para sesiones guiadas con audio, cues y memoria de practica.
- Stack: React + Vite, pnpm, Git en rama `master`

## Services

- Dev server: `pnpm dev` en `http://localhost:5173/` (si el puerto esta libre; usar `--port 5200` si hay conflicto).

## Preferences

- Conversacion en espanol.
- Comandos, nombres tecnicos y commits en ingles.
- Cierre de sesion mediante `state.md`, no mediante archivos ad hoc de cierre.

## Patterns

- [app-modes] La nueva Sadhana se organiza en tres modos obligatorios, no alternativos: `Practicar`, `Disenar`, `Recordar`. Confirmed 2026-05.
- [visual-target] El concepto aprobado usa una interfaz oscura, sobria, con acento ambar y tres zonas principales: temporizador, timeline/cues e inspector. Confirmed 2026-05.

## History

- 2026-05-09/10: Sesiones iniciales — concepto aprobado, app React/Vite creada, modos separados, CRUD de cues, presets, sesiones, commit inicial `6e44540`.
- 2026-06-05: Proyecto movido de OneDrive a `D:\DOCS\CODELAB\1_in-progress\sadhana-v0`, pnpm instalado con approve-builds para esbuild.
- 2026-06-05: Ronda de UX en Practicar: botones ±15 arreglados, barra de progreso, modo zen (fullscreen), cues ocultables, trigger de audio al click (luego revertido a lista pasiva), notificacion de cue activa bajo el timer con fade suave.
- 2026-06-05: Ronda de UX en Diseñar: markers arrastrables para mover tiempo de cues, playhead arrastrable para seek, barra de playback (sin barra de progreso), botones Añadir/Deshacer/Buscar movidos al header del timeline, zoom eliminado, nombre de preset editable + guardar en barra superior.
- 2026-06-05: Audio: volumen maestro y mute ahora afectan audio en reproduccion (applyMasterVolume), fades in/out implementados con rAF, color de acento seleccionable desde panel Tema.
- 2026-06-05: Flujos: cargar preset va a Practicar, repetir sesion restaura duracion, sesiones se guardan tambien al detener manualmente (>60s), tooltips en todos los botones.
- 2026-06-05: Layout Practicar: cues integradas dentro del TimerPanel debajo del boton Detener, lista compacta pasiva, panel centrado columna unica.
- 2026-06-06: Batida de codigo muerto: ModePanel.jsx eliminado (huerfano), prop onSavePreset eliminada de CueInspector, bug en OLD_SAMPLE_NAMES corregido ('Nueva cue'/'Nueva cue copia' ya no filtran presets legítimos).
- 2026-06-06: Tests: arreglados 2 tests incorrectos (scheduler arg fantasma, cobertura de sonidos), añadidos 4 tests nuevos (clampCueTime, savePreset, saveSession, regresion cleanStoredExamples). Total: 24 tests verdes.
- 2026-06-06: Registro completo de audios: plugin Vite `virtual:audio-manifest` autodescubre `public/audio/**/*.mp3` al arrancar. SOUND_OPTIONS y SOUND_OPTION_GROUPS generados dinamicamente desde `src/domain/sounds.js`. CueInspector usa `<optgroup>` por categoria. Renombrado `bells/3 chime-meditation.mp3` → `bells/chime-meditation.mp3`. 51 archivos registrados.
- 2026-06-06: Disenado y planificado campo `instruction` en cues. Spec: `docs/superpowers/specs/2026-06-06-instruction-field-design.md`. Plan: `docs/superpowers/plans/2026-06-06-instruction-field.md`.
- 2026-06-07: Campo `instruction` implementado — 7 tareas via subagent-driven-development, 6 commits (b0b3a98..808d308), 28 tests verdes. Modelo extendido (instruction/instructionDuration), storage key, App state + scheduler, TimerPanel con dos zonas de display y fades asimetricos, GlobalPanel con toggle "Mostrar nombre del sonido", CueInspector con campos Instruccion + Visibilidad (s).

## TODO

- [x] Campo `instruction` en cues — implementado 2026-06-07.
- [ ] Refinar scheduling de audio: precision, fades reales, replay correcto al rebobinar y mezcla de clips largos.
- [ ] i18n: contexto `LanguageContext` + hook `useT()` + objetos `es.js`/`en.js` en `src/i18n/`, toggle en Settings. Afecta todos los componentes.
- [ ] Accesos de teclado basicos: espacio para play/pause, escape para salir del zen, flechas para nudge ±15s, quizas 1/2/3 para cambiar de modo.
- [ ] Crear presets basicos de ejemplo que se incluyan por defecto en la app (no como fallback de muestra sino como contenido real): sesiones de meditacion, respiracion, movimiento, etc. con cues, tiempos y audios bien configurados.
- [ ] Timeline track clips redimensionables: arrastrar el borde derecho del clip para cambiar `duration` de la cue, al estilo DAW.
- [ ] Handles de fade en los clips del timeline: esquina superior izquierda para fade in, esquina superior derecha para fade out — arrastrar horizontalmente cambia `fadeIn`/`fadeOut`, con indicador visual de la rampa, al estilo Reaper.
- [x] Batida de codigo muerto y features a medio implementar.
- [x] Registrar todos los audios en SOUND_OPTIONS.
- [x] Persistir presets y sesiones de forma exportable/importable.
- [x] Decidir si `sadhana-next` se convierte en repo Git propio o si se inicializa Git en la raiz del proyecto.
