# Sadhana

[![Release](https://img.shields.io/github/v/release/memoriainfinita/sadhana?style=flat&color=f6a133)](https://github.com/memoriainfinita/sadhana/releases)
[![Live demo](https://img.shields.io/badge/demo-live-f6a133?style=flat)](https://memoriainfinita.github.io/sadhana/)
[![License: GPL v3](https://img.shields.io/badge/license-GPLv3-blue.svg)](LICENSE)

Audiovisual/music app for guided sessions with audio, cues and practice history.

**Live:** https://memoriainfinita.github.io/sadhana/

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

- Twelve guided sessions seeded on first run, from a five-minute breathing reset to a fifty-minute focus block: crossfading ambient beds, layered singing bowls, and a body scan carrying a facilitator script in its cue notes.
- Audio scheduling with fade in/out and master volume.
- Persistent presets and sessions, exportable/importable.
- Homegrown i18n: 16 languages registered (es/en complete, Pali a partial easter egg). Preset names and cue instructions are localized too; anything you write yourself is left untouched.
- Accessibility: keyboard operation, visible focus, WCAG 1.4.11.

## Credits

Developed by [@memoriainfinita](https://github.com/memoriainfinita) with the assistance of Claude (Anthropic): Opus 4.8, Sonnet 4.6 and Opus 5.
