---
created: 2026-06-14
updated: 2026-06-14
status: approved
---

# Accessibility (WCAG) Remediation Design

## Objetivo

Corregir los hallazgos de la auditoria WCAG de Sadhana: 13 iniciales mas 2 detectados en revision de huecos (A15 guard global, B14 estado de seleccion). Alcance: bloques A (teclado), B (estado/semantica) y C (movimiento/contraste/foco). Objetivo de conformidad: WCAG 2.1 nivel AA.

## Decisiones cerradas

- Timeline por teclado: enfoque **hibrido**. Markers y playhead operables por teclado en el propio widget; handles de resize/fade se delegan al CueInspector (que ya expone `duration`/`fadeIn`/`fadeOut` como number inputs) y se marcan `aria-hidden`.
- Paneles (`GlobalPanel`): patron **disclosure no modal**, sin focus-trap. Al abrir, el foco entra al panel; `Escape` cierra y devuelve el foco al boton disparador.
- Pasos de teclado: `ArrowLeft`/`ArrowRight` = +-5 s; `Home`/`End` = inicio/fin del rango. El ajuste fino exacto sigue en el inspector.
- El acento `#f6a133` NO se cambia: medido 8.09-9.18 sobre panel/fondo, pasa AA con holgura.
- Solo `--faint` cambia de valor: actualmente 3.57-4.06, falla AA (requiere 4.5).

## Hallazgos y solucion

### Bloque A — Teclado (WCAG 2.1.1, 2.4.7)

| # | Hallazgo | Archivo | Solucion |
|---|----------|---------|----------|
| A1 | No existe `:focus-visible` en todo el CSS; inputs con `outline:none` | `styles.css` | Regla global `:focus-visible` con anillo de acento. Quitar dependencia de `outline:none` sin reemplazo |
| A2 | Playhead `<div>` solo-pointer, no seekable por teclado | `Timeline.jsx:122` | `role="slider"`, `tabIndex=0`, `aria-valuemin/max/now`, `aria-valuetext`, `aria-label`; manejo de flechas + Home/End |
| A3 | Handles de clip `<div>` solo-pointer | `TrackClip.jsx:101-103` | `aria-hidden="true"` en los tres handles; funcion cubierta por inspector (equivalente de teclado) |
| A4 | Markers movibles solo por pointer | `Timeline.jsx:107` | Anadir `onKeyDown` al boton marker: flechas mueven `time`, Home/End a 0/duracion |
| A15 | El handler global de teclado solo exime `INPUT/TEXTAREA/SELECT`; intercepta `Space`/flechas cuando un widget del timeline tiene foco | `App.jsx:150-151` | Ampliar el guard para eximir tambien `button`, `[role="button"]` y `[role="slider"]`. Precondicion de A2 y A4 |

### Bloque B — Estado y semantica (WCAG 1.4.1, 4.1.2)

| # | Hallazgo | Archivo | Solucion |
|---|----------|---------|----------|
| B5 | Modos sin estado expuesto (solo color/clase) | `ModeTabs.jsx:17` | `aria-current="page"` en el modo activo |
| B6 | Botones de panel sin `aria-expanded` | `AppShell.jsx:40-66` | `aria-expanded={activePanel === ...}` en los tres |
| B7 | Swatches de acento sin estado | `GlobalPanel.jsx:55` | `aria-pressed={accentColor === preset.value}` |
| B8 | Toggle de cues sin `aria-expanded` | `TimerPanel.jsx:68` | `aria-expanded={cuesVisible}` |
| B9 | Instruccion activa no se anuncia | `TimerPanel.jsx:34` | `aria-live="polite"` en `.playing-instruction-label`. Ver "Region aria-live unica" por el doble montaje en zen |
| B14 | Estado "seleccionado" de markers y track-rows solo visual (1.4.1) | `Timeline.jsx:107`, `Timeline.jsx:168` | `aria-pressed={cue.id === selectedCueId}` en el boton marker y en el `track-row` (`role="button"`) |

### Bloque C — Movimiento, contraste, foco (WCAG 1.4.3, 2.3.3, 2.4.3)

| # | Hallazgo | Archivo | Solucion |
|---|----------|---------|----------|
| C10 | Sin `prefers-reduced-motion` | `styles.css` | `@media (prefers-reduced-motion: reduce)` que neutraliza transitions de opacidad, width y transform |
| C11 | `--faint` falla AA (3.57 / 4.06) | `styles.css:10` | `--faint: #8f8b82` (medido 4.97 sobre panel, 5.64 sobre fondo; sigue por debajo de `--muted` 6.82, conserva jerarquia) |
| C12 | Paneles: foco no entra ni se devuelve; Escape no cierra | `GlobalPanel.jsx`, `App.jsx:179` | Mover foco al abrir; `Escape` cierra y restaura foco al disparador |
| C13 | Sin `h1` en la pagina | `AppShell.jsx:34` | El `<span>` del brand pasa a `<h1>` con CSS que conserva tamano/peso actuales (reset de margin) |

## Modelo de interaccion de teclado del timeline

### Playhead (seek)

- `role="slider"`, `aria-label` = "Posicion de reproduccion", `aria-valuemin=0`, `aria-valuemax=durationSeconds`, `aria-valuenow=elapsedSeconds`, `aria-valuetext` = tiempo formateado (`mm:ss`).
- `ArrowRight`/`ArrowUp`: `onSeek(elapsed + 5)` (clamp a duracion).
- `ArrowLeft`/`ArrowDown`: `onSeek(elapsed - 5)` (clamp a 0).
- `Home`: `onSeek(0)`. `End`: `onSeek(durationSeconds)`.
- Reutiliza `handleSeek` de `App.jsx` (ya resetea scheduler en backward seek).

### Markers (mover cue)

- Siguen siendo `<button>` (ya focusables, ya con `aria-label`).
- Con foco: `ArrowRight`/`ArrowLeft` llaman `onMoveCue(cue.id, time +- 5)`; `Home`/`End` a 0/duracion. `onMoveCue` ya hace `clampCueTime`.
- `Enter`/`Space` mantienen su comportamiento actual (seleccionar cue). Requiere A15: sin eximir el button del guard global, `Space` en design dispara play/pause en vez de seleccionar.
- `preventDefault` en las teclas manejadas para no hacer scroll de pagina.

### Region aria-live unica (GAP-2)

- En `zenMode && activeMode === 'practice'` se montan dos `TimerPanel` a la vez (`App.jsx:472` overlay zen + `App.jsx:486` practice), ambos con la region `aria-live` de instruccion. Sin correccion, cada cambio se anuncia dos veces.
- Solucion: el `TimerPanel` recibe una prop `announce` (boolean). Solo la instancia activa la pone a `true`: el overlay zen cuando `zenMode`, el de practice cuando `!zenMode`. La region usa `aria-live="polite"` solo si `announce`; la otra instancia renderiza el texto sin `aria-live`.
- GAP-7: el nombre del sonido (`.playing-cue-label`) NO lleva `aria-live`, por decision deliberada: es informacion secundaria y opcional (`showSoundNames`), anunciarla anadiria verbosidad. Solo la instruccion se anuncia.

### Handles (resize / fadeIn / fadeOut)

- `aria-hidden="true"` en los tres `<div>`; permanecen operables por pointer.
- Justificacion 2.1.1: la funcion equivalente existe y es accesible por teclado en el CueInspector (`duration`, `fadeIn`, `fadeOut` como `<input type="number">`). No se replica el gesto de arrastre en teclado.

## Foco de paneles (disclosure no modal)

- `GlobalPanel` recibe una `ref` al contenedor `<aside>`. Un `useEffect` con dependencia `[activePanel]` enfoca el primer control focusable del panel (o el `<aside>` con `tabIndex=-1`) **cada vez que `activePanel` pasa a un valor no-null**, incluido el cambio directo entre paneles (theme -> audio, sin pasar por null).
- `App.jsx` guarda una `ref` al ultimo boton disparador (se asigna en el `onClick` de cada boton del topbar). **Todos los caminos de cierre** restauran el foco a ese boton: `Escape`, el boton X interno del panel (`GlobalPanel.jsx:40`) y volver a pulsar el mismo boton del topbar.
- Manejo de `Escape`: ampliar el handler global de `App.jsx` para que, si hay `activePanel`, lo cierre antes que cualquier otra accion. No se anade focus-trap: el panel no es modal.

## :focus-visible (estilo de anillo)

- Regla unica: `:where(button, [role="button"], [role="slider"], a, input, select, textarea):focus-visible` con `outline: 2px solid var(--accent); outline-offset: 2px;`.
- Eliminar o complementar los `outline:none` existentes (`.preset-name-input`, `.cue-inspector input/select/textarea`) para que el foco quede visible. El `:focus` que solo cambia `border-color` se conserva como refuerzo.
- GAP-5: `.timeline-panel` tiene `overflow:hidden` (`styles.css:434`), que recorta un `outline-offset` positivo en markers/playhead cercanos al borde. Para los widgets dentro del timeline el foco usa anillo **interno** (`outline-offset: -2px` o `box-shadow` inset) en lugar del offset positivo, de modo que quede dentro del area visible.

## prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

- Afecta: fades de `.playing-instruction-label`/`.playing-cue-label` (1.4s), `.timer-progress-fill`/`.playback-progress-fill` (width), `.accent-swatch` (scale), handles de clip (opacity). Los valores siguen aplicandose, solo se anula la animacion.

## Estrategia de testing

- Sin jsdom en el proyecto: TDD solo en dominio puro; UI verificada a mano (mismo patron que i18n y timeline-clip-handles).
- Dominio testeable nuevo: extraer a una funcion pura el calculo de seek/move por teclado si introduce logica (p. ej. `stepValue(current, key, min, max, step)`), y testearla. Si el manejo de flechas es trivial (delegacion directa a `onSeek`/`onMoveCue` ya testeados), no se anade test redundante.
- Resto de cambios (atributos ARIA, CSS): verificacion manual en navegador con teclado y, si disponible, lector de pantalla. Checklist manual:
  - Tab recorre todos los controles con foco visible.
  - Markers y playhead operables con flechas/Home/End.
  - Paneles: foco entra al abrir, Escape cierra y devuelve foco.
  - Modo activo y paneles abiertos anunciados por estado, no solo color.
  - `prefers-reduced-motion` activo: sin fades.

## Fuera de alcance

- Auditoria de lector de pantalla exhaustiva multi-navegador (se hace verificacion manual basica).
- Skip-link de navegacion (no critico; landmarks ya presentes).
- Replicar el gesto de arrastre de fades por teclado (cubierto por inspector).
- Cambiar el color de acento o el tema (acento ya pasa AA).
- **GAP-6 / WCAG 1.4.11 Non-text Contrast (diferido a TODO propio):** los bordes de controles (`--line-strong` #38403e sobre panel ~1.3:1) no llegan al 3:1 que exige 1.4.11 para identificar componentes de UI. Es otro criterio, con alcance propio (todos los bordes de inputs/botones y sus estados), igual que se separo la auditoria de i18n. El anillo de foco nuevo si pasa 1.4.11 (acento 8:1).
