# folia.app — Specifiche di progetto

> Documento di riferimento per lo scaffold con Claude Code.
> Generato come sintesi del brainstorming iniziale.

---

## 1. Concept

App di scrittura minimalista, client-side, con supporto AI opzionale.
Ispirata a [scrivi.la](https://scrivi.la) ma con editor avanzato, cartelle, tag, ricerca e integrazione Anthropic.

**Principi guida:**
- Privacy-first: nessun dato sul server (tranne il proxy AI)
- Zero tracker, zero analytics, zero ads
- Offline-first (PWA)
- UI minimalista con animazioni curate
- Tipografia come elemento centrale del design

---

## 2. Stack tecnico

| Layer | Scelta | Note |
|---|---|---|
| Framework | **SvelteKit** | Animazioni native, bundle minimo |
| Storage locale | **Dexie.js** (IndexedDB) | Note, cartelle, preferenze |
| Editor | **TipTap** | WYSIWYG + estensione Markdown |
| PWA | **vite-plugin-pwa** | Offline-first, installabile |
| Full-text search | **FlexSearch** | Indicizzazione in memoria, ~6kb |
| i18n | **svelte-i18n** | IT + EN dal giorno 1 |
| Deploy | **Netlify free tier** | Static + Functions |
| Proxy AI | **Netlify Functions** | Node.js serverless |
| Animazioni | **Svelte transitions native** | `fly`, `fade`, `scale`, `crossfade` |
| Font | Serif a scelta (es. **Lora** o **Literata**) | Google Fonts, gratis |

---

## 3. Struttura del progetto

```
folia-app/
├── netlify/
│   └── functions/
│       └── ai-proxy.js          # Proxy Anthropic API
├── src/
│   ├── lib/
│   │   ├── db.js                # Dexie.js setup e CRUD
│   │   ├── ai.js                # Chiamate al proxy AI
│   │   ├── export.js            # Export/import note
│   │   ├── search.js            # FlexSearch setup
│   │   └── stores/
│   │       ├── ui.js            # tema, sidebar, lingua
│   │       └── editor.js        # modalità editor, nota attiva
│   ├── i18n/
│   │   ├── it.json
│   │   └── en.json
│   ├── routes/
│   │   ├── +layout.svelte       # Shell principale
│   │   ├── +page.svelte         # Redirect a prima nota o onboarding
│   │   ├── note/
│   │   │   └── [id]/
│   │   │       └── +page.svelte # Editor singola nota
│   │   └── settings/
│   │       └── +page.svelte     # Impostazioni (tema, lingua, API key, editor default)
│   └── components/
│       ├── Sidebar.svelte        # Lista cartelle + note
│       ├── Editor.svelte         # Wrapper TipTap (rich/MD)
│       ├── EditorToolbar.svelte  # Formattazione + toggle modalità
│       ├── AIPanel.svelte        # Toolbar AI contestuale
│       ├── NoteCard.svelte       # Card nella lista
│       ├── FolderItem.svelte     # Voce cartella in sidebar
│       ├── TagBadge.svelte       # Badge tag
│       ├── SearchBar.svelte      # Ricerca full-text
│       └── Onboarding.svelte     # Primo avvio: lingua, tema, modalità editor
├── static/
│   ├── manifest.webmanifest
│   └── icons/
├── netlify.toml
├── vite.config.js
└── package.json
```

---

## 4. Database (IndexedDB via Dexie.js)

```javascript
// src/lib/db.js
import Dexie from 'dexie';

export const db = new Dexie('FoliaDB');

db.version(1).stores({
  folders: '++id, name, createdAt',
  notes:   '++id, folderId, title, content, editorMode, tags, createdAt, updatedAt',
  prefs:   'key'  // store chiave-valore per preferenze
});
```

### Schema nota

```typescript
{
  id: number           // auto-increment
  folderId: number | null
  title: string
  content: string      // HTML (rich) o MD raw (markdown)
  editorMode: 'rich' | 'markdown'
  tags: string[]
  createdAt: number    // timestamp
  updatedAt: number    // timestamp
}
```

### Schema preferenze (store `prefs`)

```typescript
{ key: 'theme',       value: 'light' | 'dark' }
{ key: 'language',    value: 'it' | 'en' }
{ key: 'editorMode',  value: 'rich' | 'markdown' }
{ key: 'apiKey',      value: string }  // solo se utente sceglie persist
```

---

## 5. Editor

### Due modalità, per nota

| | Rich Text | Markdown |
|---|---|---|
| Engine | TipTap WYSIWYG | TipTap + estensione MD |
| Vista | Testo formattato diretto | Split: sorgente MD \| preview |
| Toolbar | B I H1 H2 H3 • link colore | Sintassi helper + toggle preview |
| Export | Converti in MD o HTML | MD raw |

- La **modalità si salva per nota** (non solo globalmente)
- Il **default** si imposta al primo avvio (onboarding) e in Settings
- Switch tra modalità disponibile sempre dall'EditorToolbar

### Comportamento sidebar durante la scrittura

- Sidebar **collassabile**: freccia o shortcut per aprire/chiuderla
- Si **nasconde automaticamente** quando l'utente inizia a scrivere (dopo N secondi di inattività del mouse sulla sidebar)
- Riappare al hover sul bordo sinistro o con shortcut

---

## 6. Cartelle e Tag

### Cartelle

- **Flat** (non annidate) — v1
- CRUD: crea, rinomina, elimina (con conferma e gestione note orfane)
- Voce speciale **"Tutte le note"** sempre presente

### Tag

- Array di stringhe libere sulla nota
- Filtro cliccabile in sidebar sotto le cartelle
- **Generazione automatica via AI** (vedi sezione AI)
- Nessuna gestione centralizzata dei tag — derivati dalle note

### Navigazione sidebar

```
📁 Tutte le note          (24)
──────────────────
📁 Lavoro                 (12)
📁 Idee                    (4)
📁 Personale               (8)
──────────────────
🏷 #progetto
🏷 #bozza
🏷 #importante
```

---

## 7. Ricerca

- **FlexSearch** indicizzato in memoria all'avvio
- Ricerca su: `title`, `content`, `tags`
- Aggiornamento indice ad ogni salvataggio nota
- UI: barra in cima alla sidebar, risultati in tempo reale

```javascript
// src/lib/search.js
import FlexSearch from 'flexsearch';

const index = new FlexSearch.Document({
  document: { id: 'id', index: ['title', 'content', 'tags'] }
});

export const indexNote = (note) => index.add(note);
export const removeNote = (id) => index.remove(id);
export const searchNotes = (query) => index.search(query, { enrich: true });
```

---

## 8. Export / Import

### Formati supportati

| Formato | Singola nota | Tutte le note | Import |
|---|---|---|---|
| `.md` | ✅ | ❌ | ✅ |
| `.txt` | ✅ | ❌ | ✅ |
| `.html` | ✅ | ❌ | ❌ |
| `.json` | ✅ | ✅ (backup completo) | ✅ |

- **PDF**: via `window.print()` con CSS `@media print` ottimizzato (no librerie)
- **Import JSON**: `bulkPut` — merge, non sovrascrittura totale
- **Backup completo** include: note, cartelle, tag, date

---

## 9. AI — Integrazione Anthropic

### Flusso

```
Browser  ──POST /api/ai-proxy──►  Netlify Function  ──►  api.anthropic.com
         { apiKey, prompt }            (proxy)              (risposta)
              ◄────────────────────────────────────────────
```

### Netlify Function (proxy)

```javascript
// netlify/functions/ai-proxy.js
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const { apiKey, systemPrompt, prompt } = JSON.parse(event.body);

  if (!apiKey?.startsWith('sk-ant-')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid API key' }) };
  }
  if (!prompt || prompt.length > 10000) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid prompt' }) };
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  if (!response.ok) return { statusCode: response.status, body: JSON.stringify({ error: data.error?.message }) };

  return { statusCode: 200, body: JSON.stringify({ result: data.content[0].text }) };
};
```

### Azioni AI disponibili sull'editor

| Azione | System prompt |
|---|---|
| **Riassumi** | "Riassumi il testo in modo chiaro e conciso nella stessa lingua del testo." |
| **Migliora testo** | "Migliora il testo mantenendo stile e voce originale. Rispondi solo con il testo." |
| **Continua a scrivere** | "Continua il testo in modo coerente con stile e tono esistenti." |
| **Genera tag** | "Estrai 3-5 tag rilevanti. Rispondi solo con tag separati da virgola, minuscolo." |
| **Traduci** | "Traduci il testo in [lingua target]. Rispondi solo con il testo tradotto." |

- Le azioni **Riassumi**, **Migliora**, **Continua** operano sull'intero contenuto o sulla **selezione attiva**
- **Genera tag** popola automaticamente il campo tag della nota
- **Traduci** apre un piccolo dropdown per scegliere la lingua target

### Gestione chiave API (Settings)

```
┌─────────────────────────────────────────┐
│  🤖  Intelligenza Artificiale           │
│                                         │
│  Chiave API Anthropic                   │
│  [sk-ant-••••••••••] [Modifica]         │
│                                         │
│  [ ] Ricorda tra le sessioni            │
│                                         │
│  ⚠️  La chiave viene inviata solo ad    │
│  Anthropic tramite proxy. Non viene     │
│  mai salvata sul server.                │
└─────────────────────────────────────────┘
```

- Default: `sessionStorage` (solo sessione corrente)
- Con checkbox "Ricorda": `localStorage` (persiste)
- Mai loggata lato server

---

## 10. Internazionalizzazione (i18n)

- **Libreria**: `svelte-i18n`
- **Lingue**: Italiano (`it`) e Inglese (`en`) dal giorno 1
- **Rilevamento automatico** dalla lingua del browser al primo avvio
- **Override manuale** in Settings e durante l'onboarding
- Tutti i testi UI in `src/i18n/it.json` e `src/i18n/en.json`

---

## 11. Tema

- **Light** e **Dark** mode
- Toggle in header/settings
- Implementato con **CSS custom properties** su `:root`
- Preferenza salvata in `prefs` store (IndexedDB)
- Rispetta `prefers-color-scheme` al primo avvio se l'utente non ha ancora scelto

---

## 12. PWA

```javascript
// vite.config.js (estratto)
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Folia',
    short_name: 'Folia',
    description: 'Minimal writing app',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
    icons: [ /* 192x192, 512x512 */ ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,woff2}']
  }
})
```

- Funziona **completamente offline** (eccetto le chiamate AI)
- Installabile su desktop e mobile
- Su mobile: consigliare "Aggiungi a schermata Home"

---

## 13. Animazioni (Svelte native)

```svelte
<!-- Lista note: entrata/uscita -->
{#each notes as note (note.id)}
  <div
    in:fly={{ y: 15, duration: 250, easing: quintOut }}
    out:fade={{ duration: 150 }}
    animate:flip={{ duration: 300 }}
  >
    <NoteCard {note} />
  </div>
{/each}

<!-- Editor: comparsa -->
{#if activeNote}
  <main transition:fly={{ x: 30, duration: 350, easing: quintOut }}>
    <Editor note={activeNote} />
  </main>
{/if}

<!-- Sidebar: sfuma mentre scrivi -->
<aside class:writing={isWriting}>
  <!-- ... -->
</aside>

<style>
  aside { transition: opacity 0.5s ease; }
  aside.writing { opacity: 0; pointer-events: none; }
</style>
```

---

## 14. Netlify — Configurazione

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".svelte-kit/output/client"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "no-referrer"
```

---

## 15. Onboarding (primo avvio)

Modale/schermata a step mostrata una sola volta:

```
Step 1: Lingua         → IT / EN
Step 2: Tema           → Light / Dark
Step 3: Editor default → Rich text / Markdown
Step 4: Chiave AI      → Inserisci ora (opzionale) / Salta
```

Salvato in `prefs` con chiave `onboardingCompleted: true`.

---

## 16. Roadmap

### v1 — MVP
- [x] Cartelle flat + note
- [x] Editor Rich text + Markdown con toggle per nota
- [x] Tag + ricerca full-text
- [x] Export/import (.md, .json, .txt, .html)
- [x] AI via proxy Netlify Function
- [x] i18n IT/EN
- [x] Light/Dark theme
- [x] PWA offline-first
- [x] Onboarding

### v2
- [ ] Shortcut da tastiera (Command Palette stile Linear)
- [ ] Anteprima print/PDF con CSS @media print
- [ ] Statistiche nota (parole, caratteri, tempo di lettura)
- [ ] Modalità focus (nasconde tutto tranne l'editor)

### v3 (futuro)
- [ ] Google Drive sync (OAuth2 PKCE, client-side)
- [ ] Condivisione nota via link (read-only, opzionale backend)

---

## 17. Decisioni aperte (da definire durante lo scaffold)

- Font definitivo (Lora vs Literata vs altro serif)
- Palette colori esatta (light + dark)
- Icone: Lucide vs Phosphor vs SVG custom
- Autosave: ogni N secondi o on-change con debounce?
- Shortcut tastiera prioritari per v1
