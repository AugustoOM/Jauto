<p align="center">
  <img src="images/Logo.png" alt="JAuto" width="400" />
</p>

<p align="center">
  Modern, open-source replacement for JFLAP 7.1 — a tool for experimenting with formal languages and automata.
</p>

## Features (MVP)

- **DFA / NFA** — create, edit, and simulate finite automata
- **PDA** — pushdown automata with stack visualization
- **Turing Machine** — single-tape Turing machine editor and simulator
- **JFLAP Compatibility** — import and export `.jff` files (JFLAP 7.1 format)
- **Cross-platform** — runs in the browser and as a native desktop app (Windows, macOS)

## Tech Stack

- TypeScript, Vue 3, Vite
- Tauri 2 (native desktop shell for Windows and macOS)
- pnpm workspaces + Turborepo (monorepo)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) >= 10
- [Rust](https://www.rust-lang.org/tools/install) with Cargo for native desktop builds

### Setup

```bash
pnpm install
```

### Development

```bash
# Web app
pnpm dev:web

# Desktop app
pnpm dev:desktop

# Both
pnpm dev
```

### Build

```bash
# Web + desktop workspace builds
pnpm build

# Desktop frontend only
pnpm --filter @jauto/desktop build:frontend

# Native desktop bundle (requires Rust/Cargo)
pnpm --filter @jauto/desktop build
```

### Test

```bash
pnpm test
```

## Desktop App

The desktop uses Tauri. The Vue renderer lives in
`apps/desktop/src/renderer`, while the native shell, menu integration, file
dialogs, and save/export commands live in `apps/desktop/src-tauri`.

Native desktop support currently includes:

- Windows and macOS builds through Tauri
- Native open/save dialogs for `.jff` files
- PNG export through the native save dialog
- Native app menu actions bridged into the Vue editor

## Project Structure

```
jauto/
  packages/
    core/        — Domain models, graph operations, command/history system
    jff/         — JFLAP .jff XML parser and serializer
    simulator/   — Step-by-step automaton execution engine
    file-io/     — Platform-agnostic file handling abstraction
    ui/          — Shared Vue 3 components, composables, and stores
  apps/
    web/         — Browser application (Vue 3 SPA)
    desktop/     — Native desktop application (Tauri)
      src-tauri/ — Rust native shell, menu, and file commands
```

## License

[MIT](LICENSE)
