---
created: 2026-06-14
updated: 2026-06-14
status: approved
---

# Accessibility (WCAG) Remediation Design

## Objetivo

Corregir los 13 hallazgos de la auditoria WCAG de Sadhana. Alcance: bloques A (teclado), B (estado/semantica) y C (movimiento/contraste/foco). Objetivo de conformidad: WCAG 2.1 nivel AA.

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

### Bloque B — Estado y semantica (WCAG 1.4.1, 4.1.2)

| # | Hallazgo | Archivo | Solucion |
|---|----------|---------|----------|
| B5 | Modos sin estado expuesto (solo color/clase) | `ModeTabs.jsx:17` | `aria-current="page"` en el modo activo |
| B6 | Botones de panel sin `aria-expanded` | `AppShell.jsx:40-66` | `aria-expanded={activePanel === ...}` en los tres |
| B7 | Swatches de acento sin estado | `GlobalPanel.jsx:55` | `aria-pressed={accentColor === preset.value}` |
| B8 | Toggle de cues sin `aria-expanded` | `TimerPanel.jsx:68` | `aria-expanded={cuesVisible}` |
| B9 | Instruccion activa no se anuncia | `TimerPanel.jsx:34` | `aria-live="polite"` en `.playing-instruction-label` |

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
- `Enter`/`Space` mantienen su comportamiento actual (seleccionar cue).
- `preventDefault` en las teclas manejadas para no hacer scroll de pagina.

### Handles (resize / fadeIn / fadeOut)

- `aria-hidden="true"` en los tres `<div>`; permanecen operables por pointer.
- Justificacion 2.1.1: la funcion equivalente existe y es accesible por teclado en el CueInspector (`duration`, `fadeIn`, `fadeOut` como `<input type="number">`). No se replica el gesto de arrastre en teclado.

## Foco de paneles (disclosure no modal)

- `GlobalPanel` recibe una `ref` al contenedor `<aside>`. Al pasar de `activePanel === null` a un panel, un `useEffect` enfoca el primer control focusable del panel (o el `<aside>` con `tabIndex=-1`).
- Al cerrar, el foco vuelve al boton del topbar que lo abrio. `App.jsx` guarda una `ref` al ultimo disparador.
- Manejo de `Escape`: ampliar el handler global de `App.jsx` para que, si hay `activePanel`, lo cierre antes que cualquier otra accion. No se anade focus-trap: el panel no es modal.

## :focus-visible (estilo de anillo)

- Regla unica: `:where(button, [role="button"], [role="slider"], a, input, select, textarea):focus-visible` con `outline: 2px solid var(--accent); outline-offset: 2px;`.
- Eliminar o complementar los `outline:none` existentes (`.preset-name-input`, `.cue-inspector input/select/textarea`) para que el foco quede visible. El `:focus` que solo cambia `border-color` se conserva como refuerzo.

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
