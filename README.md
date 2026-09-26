# sadhana

[![Release](https://img.shields.io/github/v/release/memoriainfinita/sadhana?style=flat&color=f6a133)](https://github.com/memoriainfinita/sadhana/releases)
[![Live demo](https://img.shields.io/badge/demo-live-f6a133?style=flat)](https://memoriainfinita.github.io/sadhana/)
[![License: GPL v3](https://img.shields.io/badge/license-GPLv3-blue.svg)](LICENSE)

Audiovisual/music app for guided sessions with audio, cues and practice history.

**Live:** https://memoriainfinita.github.io/sadhana/

![sadhana in Practice mode: a 24-minute session running, the countdown and the list of cues with the current one highlighted](docs/sadhana-demo.png)

## Modes

### Practice

Timer, cues and the active instruction. The screenshot above shows this mode.

### Design

Timeline with draggable cues, DAW-style fade clips, inspector.

![sadhana in Design mode: the session timeline with its cues and, on the right, the inspector for the selected cue](docs/sadhana-design.png)

### Remember

Presets and recent sessions.

![sadhana in Remember mode: the twelve presets on the left and the latest sessions on the right](docs/sadhana-remember.png)

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

## License

GPL-3.0. See `LICENSE`.

## Credits

Developed by [@memoriainfinita](https://github.com/memoriainfinita) with the assistance of Claude (Anthropic): Opus 4.8, Sonnet 4.6 and Opus 5.
