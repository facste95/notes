# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Folia** — a minimalist, privacy-first writing app built with SvelteKit. All notes are stored client-side in IndexedDB (via Dexie.js). AI features are opt-in and proxied through a Netlify Function so the API key never leaves the browser unencrypted.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # Svelte type-check (svelte-check)
npm run lint         # prettier + eslint
npm run format       # Auto-format
npm run test         # Run all tests (vitest)
npx vitest src/lib/db.test.js   # Run a single test file
```

## Architecture

### Data layer (`src/lib/`)
- **`db.js`** — Dexie.js instance (`FoliaDB`). Three tables: `folders`, `notes` (with multi-entry `*tags` index), `prefs` (key/value).
- **`search.js`** — FlexSearch index built on app mount from all notes; updated incrementally on note save.
- **`export.js`** — Import/export logic.
- **`ai.js`** — API key helpers (sessionStorage/localStorage), `callAI()` that POSTs to `/api/ai-proxy`, and `AI_ACTIONS` constants.
- **`i18n.js`** — svelte-i18n setup; translations live in `src/i18n/en.json` and `src/i18n/it.json`.

### Stores (`src/lib/stores/`)
- **`ui.js`** — `theme`, `sidebarOpen`, `language`, `isWriting` writables + toggle helpers.
- **`editor.js`** — Editor-specific reactive state.

### Routes
- `/` (`+page.svelte`) — Redirects to last opened note or first note; shows onboarding overlay on first run.
- `/note/[id]` — Note editor view with TipTap + `AIPanel`.
- `/settings` — API key management (with persist-to-localStorage option) and app preferences.

### AI proxy
`netlify/functions/ai-proxy.js` receives `{ apiKey, systemPrompt, prompt }`, validates, and forwards to Anthropic API (`claude-haiku-4-5-20251001`, max 1024 tokens). Exposed as `/api/ai-proxy` via redirect in `netlify.toml`.

### Theming
CSS custom properties on `[data-theme]` set in `+layout.svelte`. All components consume `--color-*` variables. Font: Literata (serif).

### PWA
Configured in `vite.config.js` via `vite-plugin-pwa` with `autoUpdate` service worker. Icons expected at `static/icons/icon-192.png` and `static/icons/icon-512.png`.

## Testing

Tests use Vitest + happy-dom. IndexedDB is mocked with `fake-indexeddb` (configured in `src/test-setup.js`). Test files are co-located as `*.test.js` alongside their modules.
