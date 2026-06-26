# Sadhana

Audiovisual/music app for guided sessions with audio, cues and practice history.

Three modes:

- **Practice** — timer, cues and the active instruction.
- **Design** — timeline with draggable cues, DAW-style fade clips, inspector.
- **Remember** — presets and recent sessions.

## Stack

React 19 + Vite 6, pnpm.

## Scripts

```bash
pnpm dev     # development server
pnpm build   # production build
pnpm test    # tests (vitest)
```

## Features

- Audio scheduling with fade in/out and master volume.
- Persistent presets and sessions, exportable/importable.
- Homegrown i18n: 16 languages registered (es/en complete).
- Accessibility: keyboard operation, visible focus, WCAG 1.4.11.
