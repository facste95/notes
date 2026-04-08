# Folia App — Design Document

> Generato il 2026-04-08 come sintesi del brainstorming di implementazione.
> Basato su `specifiche.md` (documento di riferimento prodotto).

---

## 1. Panoramica

**Folia** è un'app di scrittura minimalista, client-side, con supporto AI opzionale.
Stack: SvelteKit + Dexie.js (IndexedDB) + TipTap + Netlify.

**Principi guida:** privacy-first, offline-first (PWA), zero tracker, UI minimalista con tipografia centrale.

---

## 2. Decisioni chiuse

| Decisione | Scelta | Motivazione |
|---|---|---|
| Font | **Literata** | Progettato per leggibilità e-reader, ottimo per testi lunghi |
| Icone | **Lucide-Svelte** | Minimal, tree-shakeable, ottimo fit con Svelte |
| Palette | **Neutra** (carta/inchiostro) | Coerente con il minimalismo, no distrazioni cromatiche |
| Autosave | **On-change debounce 800ms** | Reattivo, zero scritture inutili, max 1s di perdita dati |
| Fasi | **3 fasi** (core → UX → AI) | Ogni fase produce output validabile e usabile |
| Design UI | **frontend-design skill** | Per le scelte visuali dettagliate in Fase 2 |

---

## 3. Architettura

### Stack tecnico (da specifiche.md)

| Layer | Scelta |
|---|---|
| Framework | SvelteKit (JS, no TypeScript) |
| Storage | Dexie.js (IndexedDB) |
| Editor | TipTap (WYSIWYG + estensione Markdown) |
| PWA | vite-plugin-pwa |
| Ricerca | FlexSearch |
| i18n | svelte-i18n (IT + EN) |
| Icone | Lucide-Svelte |
| Deploy | Netlify free tier (static + Functions) |
| Animazioni | Svelte transitions native |
| Font | Literata (Google Fonts) |

### Store Svelte

- **`src/lib/stores/ui.js`**: `theme` (light/dark), `sidebarOpen` (bool), `language` (it/en), `isWriting` (bool — attiva auto-hide sidebar)
- **`src/lib/stores/editor.js`**: `activeNote` (oggetto nota completo), `editorMode` (rich/markdown)
- Le liste note/cartelle non usano store globale: lette direttamente con `liveQuery` di Dexie (reattività nativa)

### Data flow

```
Dexie (IndexedDB)
  └── liveQuery → Sidebar (lista note/cartelle, reattiva)
  └── liveQuery → Editor (nota attiva)
       └── on-change debounce 800ms → db.notes.put()
       └── on-change → FlexSearch index update
```

### Navigazione SvelteKit

- `/` → redirect a ultima nota aperta (da prefs) o onboarding al primo avvio
- `/note/[id]` → editor singola nota
- `/settings` → impostazioni (tema, lingua, API key, editor default)

---

## 4. Database (Dexie.js)

```javascript
// src/lib/db.js
db.version(1).stores({
  folders: '++id, name, createdAt',
  notes:   '++id, folderId, title, content, editorMode, tags, createdAt, updatedAt',
  prefs:   'key'
});
```

**Schema nota:**
```javascript
{
  id: number,           // auto-increment
  folderId: number | null,
  title: string,
  content: string,      // HTML (rich) o MD raw (markdown)
  editorMode: 'rich' | 'markdown',
  tags: string[],
  createdAt: number,    // timestamp ms
  updatedAt: number     // timestamp ms
}
```

**Schema prefs (chiave-valore):**
```javascript
{ key: 'theme',               value: 'light' | 'dark' }
{ key: 'language',            value: 'it' | 'en' }
{ key: 'editorMode',          value: 'rich' | 'markdown' }
{ key: 'apiKey',              value: string }
{ key: 'lastOpenedNoteId',    value: number }
{ key: 'onboardingCompleted', value: true }
```

**Tag:** array di stringhe su ogni nota, nessuna tabella dedicata. I tag unici vengono derivati con query aggregata da Dexie (raccolti da tutte le note).

---

## 5. Componenti

### Responsabilità

| Componente | Responsabilità |
|---|---|
| `+layout.svelte` | Shell principale: sidebar + slot main, shortcut globali |
| `Sidebar.svelte` | Lista cartelle/note (liveQuery), selezione, collasso, auto-hide |
| `NoteCard.svelte` | Card singola nota nella lista |
| `FolderItem.svelte` | Voce cartella in sidebar |
| `TagBadge.svelte` | Badge tag cliccabile |
| `SearchBar.svelte` | Input ricerca, risultati FlexSearch in tempo reale |
| `Editor.svelte` | Inizializza TipTap, emette `on:change`, gestisce switch rich/markdown |
| `EditorToolbar.svelte` | Formattazione + toggle modalità + trigger AIPanel |
| `AIPanel.svelte` | Overlay contestuale sopra editor, legge selezione TipTap (Fase 3) |
| `Onboarding.svelte` | Modale 4 step al primo avvio |

### Editor — due modalità

- **Rich text**: TipTap WYSIWYG, toolbar B/I/H1/H2/H3/link
- **Markdown**: TipTap + `@tiptap/extension-markdown`. Split view: `<textarea>` sorgente | preview renderizzata. Non un secondo engine separato.
- La modalità si salva per nota (campo `editorMode`). Il default si imposta in onboarding e Settings.

### Sidebar — comportamento

- Collassabile: freccia cliccabile + shortcut `Ctrl+\`
- Auto-hide: si opacizza (`opacity: 0, pointer-events: none`) dopo 2s di scrittura attiva (store `isWriting`)
- Riappare: hover sul bordo sinistro o shortcut

### Shortcut v1 prioritari

| Shortcut | Azione |
|---|---|
| `Ctrl+B` | Grassetto |
| `Ctrl+I` | Corsivo |
| `Ctrl+\` | Toggle sidebar |
| `Escape` | Chiudi AIPanel / deseleziona |

---

## 6. Ricerca (FlexSearch)

```javascript
// src/lib/search.js
const index = new FlexSearch.Document({
  document: { id: 'id', index: ['title', 'content', 'tags'] }
});
```

- Indicizzato in memoria all'avvio (carica tutte le note da Dexie)
- Aggiornato ad ogni salvataggio (debounce 800ms → put → index.update)
- Risultati in tempo reale nella SearchBar

---

## 7. Export / Import

| Formato | Singola | Tutte | Import |
|---|---|---|---|
| `.md` | ✅ | ❌ | ✅ |
| `.txt` | ✅ | ❌ | ✅ |
| `.html` | ✅ | ❌ | ❌ |
| `.json` | ✅ | ✅ (backup) | ✅ (merge) |

- **PDF**: `window.print()` + CSS `@media print` (no librerie)
- **Import JSON**: `db.notes.bulkPut()` — merge, non sovrascrittura

---

## 8. AI (Fase 3)

### Proxy Netlify Function

```
Browser → POST /api/ai-proxy → Netlify Function → api.anthropic.com
```

Il body include `{ apiKey, systemPrompt, prompt }`. La chiave non viene mai loggata lato server.

### Azioni disponibili

| Azione | Scope |
|---|---|
| Riassumi | Intero contenuto o selezione |
| Migliora testo | Intero contenuto o selezione |
| Continua a scrivere | Intero contenuto o selezione |
| Genera tag | Popola campo `tags` della nota |
| Traduci | Dropdown lingua target, intero contenuto o selezione |

### Gestione API key

- Default: `sessionStorage` (solo sessione)
- Con checkbox "Ricorda tra le sessioni": `localStorage`
- Non salvata su server, non loggata

---

## 9. PWA

- `vite-plugin-pwa` con `registerType: 'autoUpdate'`
- Funziona offline (eccetto chiamate AI)
- Installabile su desktop e mobile
- Cache: tutti i file statici (js, css, html, ico, png, woff2)

---

## 10. i18n

- `svelte-i18n`, lingue IT + EN
- Rilevamento automatico da `navigator.language` al primo avvio
- Override in onboarding (Step 1) e Settings
- File: `src/i18n/it.json`, `src/i18n/en.json`

---

## 11. Tema

- Light / Dark mode
- CSS custom properties su `:root`
- Palette neutra (carta/inchiostro): bianco caldo, grigio antracite, nessun accento cromatico
- Rispetta `prefers-color-scheme` al primo avvio
- Preferenza salvata in prefs store

---

## 12. Onboarding (primo avvio)

Modale a 4 step, mostrata una sola volta:

1. **Lingua** → IT / EN
2. **Tema** → Light / Dark
3. **Editor default** → Rich text / Markdown
4. **Chiave AI** → Inserisci ora (opzionale) / Salta

Salvato con `prefs.put({ key: 'onboardingCompleted', value: true })`.

---

## 13. Fasi di implementazione

### Fase 1 — Core funzionale
**Output:** app avviabile in dev con CRUD completo.

- Scaffold SvelteKit (JS, no TS)
- Dexie.js: schema + CRUD note/cartelle/prefs
- Store: `ui.js`, `editor.js`
- Layout + Sidebar collassabile
- Componenti: `Sidebar`, `NoteCard`, `FolderItem`, `Editor` (TipTap base), `EditorToolbar`
- Autosave on-change debounce 800ms
- Routing `/`, `/note/[id]`, `/settings` (shell)
- Nessun design finalizzato

**Criteri di validazione:**
- Creare, rinominare, eliminare cartelle
- Creare, modificare, eliminare note
- Autosave funzionante (verificabile in DevTools > IndexedDB)
- Switch rich/markdown per nota
- Sidebar collassabile

---

### Fase 2 — UX completa
**Output:** app pronta all'uso, visivamente rifinita.

- Design system con frontend-design skill (CSS custom properties, Literata, palette neutra)
- Lucide-Svelte per tutte le icone
- Animazioni Svelte native (`fly`, `fade`, `flip`, `crossfade`)
- Sidebar auto-hide durante la scrittura
- `SearchBar` + FlexSearch (indicizzazione e ricerca)
- `TagBadge` + filtro tag in sidebar
- Export/Import tutti i formati
- `svelte-i18n` IT + EN completo
- Light/Dark theme con toggle
- `vite-plugin-pwa` offline-first
- `Onboarding.svelte` 4 step
- Settings page completa

**Criteri di validazione:**
- Ricerca full-text funzionante
- Export .md e .json verificabili
- Onboarding appare al primo avvio, non al secondo
- PWA installabile (Lighthouse PWA score)
- Cambio lingua aggiorna tutta la UI
- Sidebar si nasconde durante la scrittura

---

### Fase 3 — AI integration
**Output:** app completa con AI opzionale.

- `netlify/functions/ai-proxy.js`
- `netlify.toml` configurato
- `src/lib/ai.js`
- `AIPanel.svelte` con 5 azioni
- Gestione API key in Settings
- Deploy Netlify

**Criteri di validazione:**
- Tutte e 5 le azioni AI funzionanti (richiede chiave Anthropic valida)
- API key non persiste tra sessioni per default
- Netlify Function restituisce errore su chiave non valida
- Deploy su Netlify completato e app accessibile online

---

## 14. File struttura finale

```
folia-app/
├── netlify/
│   └── functions/
│       └── ai-proxy.js
├── src/
│   ├── lib/
│   │   ├── db.js
│   │   ├── ai.js
│   │   ├── export.js
│   │   ├── search.js
│   │   └── stores/
│   │       ├── ui.js
│   │       └── editor.js
│   ├── i18n/
│   │   ├── it.json
│   │   └── en.json
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +page.svelte
│   │   ├── note/[id]/+page.svelte
│   │   └── settings/+page.svelte
│   └── components/
│       ├── Sidebar.svelte
│       ├── Editor.svelte
│       ├── EditorToolbar.svelte
│       ├── AIPanel.svelte
│       ├── NoteCard.svelte
│       ├── FolderItem.svelte
│       ├── TagBadge.svelte
│       ├── SearchBar.svelte
│       └── Onboarding.svelte
├── static/
│   ├── manifest.webmanifest
│   └── icons/
├── netlify.toml
├── vite.config.js
└── package.json
```
