# Jauto

Modern, open-source replacement for JFLAP 7.1 — a tool for experimenting with formal languages and automata.

## Features (MVP)

- **DFA / NFA** — create, edit, and simulate finite automata
- **PDA** — pushdown automata with stack visualization
- **Turing Machine** — single-tape Turing machine editor and simulator
- **JFLAP Compatibility** — import and export `.jff` files (JFLAP 7.1 format)
- **Cross-platform** — runs in the browser and as a native desktop app (Windows, macOS)

## Tech Stack

- TypeScript, Vue 3, Vite
- Electron (desktop)
- pnpm workspaces + Turborepo (monorepo)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) >= 10

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
pnpm build
```

### Test

```bash
pnpm test
```

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
    desktop/     — Desktop application (Electron)
```

## License

[MIT](LICENSE)
