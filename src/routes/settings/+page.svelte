<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { db } from '$lib/db.js';
  import { theme } from '$lib/stores/ui.js';
  import { language } from '$lib/stores/ui.js';
  import { editorMode } from '$lib/stores/editor.js';
  import { locale } from '$lib/i18n.js';
  import { noteToMarkdown, noteToText, noteToHtml, notesToJson, parseJsonBackup, downloadFile } from '$lib/export.js';

  async function exportCurrentNote(format) {
    const lastPref = await db.prefs.get('lastOpenedNoteId');
    if (!lastPref?.value) return alert('Apri una nota prima di esportare.');
    const note = await db.notes.get(lastPref.value);
    if (!note) return;

    const name = (note.title || 'nota').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    if (format === 'md')   downloadFile(noteToMarkdown(note), `${name}.md`, 'text/markdown');
    if (format === 'txt')  downloadFile(noteToText(note), `${name}.txt`, 'text/plain');
    if (format === 'html') downloadFile(noteToHtml(note), `${name}.html`, 'text/html');
  }

  async function exportAll() {
    const notes = await db.notes.toArray();
    downloadFile(notesToJson(notes), 'folia-backup.json', 'application/json');
  }

  async function importJson(e) {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const { notes } = parseJsonBackup(text);
      await db.notes.bulkPut(notes);
      alert(`Importate ${notes.length} note.`);
    } catch {
      alert('File di backup non valido.');
    }
    e.target.value = '';
  }

  function setLang(lang) {
    language.set(lang);
    locale.set(lang);
    db.prefs.put({ key: 'language', value: lang });
  }

  function setTheme(t) {
    theme.set(t);
    db.prefs.put({ key: 'theme', value: t });
  }

  function setEditorDefault(mode) {
    editorMode.set(mode);
    db.prefs.put({ key: 'editorMode', value: mode });
  }
</script>

<div class="settings-page">
  <h1>{$_('settings.title')}</h1>

  <section>
    <h2>{$_('settings.theme')}</h2>
    <div class="option-group">
      <button class:active={$theme === 'light'} on:click={() => setTheme('light')}>
        {$_('settings.themeLight')}
      </button>
      <button class:active={$theme === 'dark'} on:click={() => setTheme('dark')}>
        {$_('settings.themeDark')}
      </button>
    </div>
  </section>

  <section>
    <h2>{$_('settings.language')}</h2>
    <div class="option-group">
      <button class:active={$language === 'it'} on:click={() => setLang('it')}>Italiano</button>
      <button class:active={$language === 'en'} on:click={() => setLang('en')}>English</button>
    </div>
  </section>

  <section>
    <h2>{$_('settings.editorDefault')}</h2>
    <div class="option-group">
      <button class:active={$editorMode === 'rich'} on:click={() => setEditorDefault('rich')}>
        {$_('settings.editorRich')}
      </button>
      <button class:active={$editorMode === 'markdown'} on:click={() => setEditorDefault('markdown')}>
        {$_('settings.editorMarkdown')}
      </button>
    </div>
  </section>

  <section>
    <h2>Export</h2>
    <div class="export-group">
      <button on:click={() => exportCurrentNote('md')}>Nota corrente (.md)</button>
      <button on:click={() => exportCurrentNote('txt')}>Nota corrente (.txt)</button>
      <button on:click={() => exportCurrentNote('html')}>Nota corrente (.html)</button>
      <button on:click={exportAll}>Backup completo (.json)</button>
    </div>
  </section>

  <section>
    <h2>Import</h2>
    <label class="import-label">
      {$_('common.confirm')} backup JSON
      <input type="file" accept=".json" on:change={importJson} hidden />
    </label>
  </section>
</div>

<style>
  .settings-page {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }
  h1 {
    font-size: 1.5rem;
    margin-bottom: 2rem;
    color: var(--color-text);
  }
  section {
    margin-bottom: 2rem;
  }
  h2 {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
    margin-bottom: 0.75rem;
  }
  .option-group, .export-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  button {
    padding: 0.4rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    background: var(--color-surface);
    font-family: inherit;
    font-size: 0.875rem;
    color: var(--color-text);
    transition: background 0.15s;
  }
  button:hover { background: var(--color-hover); }
  button.active {
    background: var(--color-accent);
    color: var(--color-bg);
    border-color: var(--color-accent);
  }
  .import-label {
    display: inline-block;
    padding: 0.4rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    background: var(--color-surface);
    font-size: 0.875rem;
    color: var(--color-text);
  }
  .import-label:hover { background: var(--color-hover); }
</style>
