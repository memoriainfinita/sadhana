# Sadhana

App audiovisual/musical para sesiones guiadas con audio, cues y memoria de práctica.

Tres modos:

- **Practicar** — temporizador, cues y la instrucción activa.
- **Diseñar** — timeline con cues arrastrables, clips con fades estilo DAW, inspector.
- **Recordar** — presets y sesiones recientes.

## Stack

React 19 + Vite 6, pnpm.

## Scripts

```bash
pnpm dev     # servidor de desarrollo
pnpm build   # build de producción
pnpm test    # tests (vitest)
```

## Características

- Audio scheduling con fades in/out y volumen maestro.
- Presets y sesiones persistentes, exportables/importables.
- i18n casero: 16 idiomas registrados (es/en completos).
- Accesibilidad: operación por teclado, foco visible, WCAG 1.4.11.
