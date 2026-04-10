<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { X } from 'lucide-svelte';
  import { db } from '$lib/db.js';
  import { theme, language, showSettings, AI_ENABLED } from '$lib/stores/ui.js';
  import { editorMode } from '$lib/stores/editor.js';
  import { locale } from '$lib/i18n.js';
  import { notesToJson, parseJsonBackup, downloadFile } from '$lib/export.js';
  import { getApiKey, setApiKey, clearApiKey } from '$lib/ai.js';

  let apiKey = '';
  let rememberKey = false;
  let apiKeyMasked = false;
  let isMac = false;

  onMount(() => {
    const stored = getApiKey();
    if (stored) { apiKey = stored; apiKeyMasked = true; }
    rememberKey = !!localStorage.getItem('foliaApiKey');
    isMac = navigator.platform.includes('Mac') || navigator.platform.includes('iPhone');
  });

  $: mod = isMac ? '⌘' : 'Ctrl';

  function close() { showSettings.set(false); }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) close();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') close();
  }

  function saveApiKey() {
    if (!apiKey.trim()) return;
    setApiKey(apiKey.trim(), rememberKey);
    apiKeyMasked = true;
  }

  function editApiKey() { apiKeyMasked = false; }

  function removeApiKey() {
    clearApiKey();
    apiKey = '';
    apiKeyMasked = false;
    rememberKey = false;
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

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="backdrop" on:click={handleBackdropClick}>
  <div class="panel" role="dialog" aria-modal="true" aria-label={$_('settings.title')}>
    <div class="panel-header">
      <h1>{$_('settings.title')}</h1>
      <button class="close-btn" on:click={close} title={$_('common.close')}>
        <X size={18} />
      </button>
    </div>

    <div class="panel-body">
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
        <h2>{$_('settings.backup')}</h2>
        <div class="option-group">
          <button on:click={exportAll}>Backup (.json)</button>
          <label class="import-label">
            {$_('settings.restore')} (.json)
            <input type="file" accept=".json" on:change={importJson} hidden />
          </label>
        </div>
      </section>

      {#if AI_ENABLED}
      <section>
        <h2>{$_('settings.aiTitle')}</h2>
        {#if apiKeyMasked}
          <div class="api-key-row">
            <code class="api-key-masked">sk-ant-••••••••••••</code>
            <button on:click={editApiKey}>{$_('common.edit')}</button>
            <button class="danger-btn" on:click={removeApiKey}>{$_('common.delete')}</button>
          </div>
        {:else}
          <input
            type="password"
            bind:value={apiKey}
            placeholder={$_('settings.apiKeyPlaceholder')}
            class="api-input"
          />
          <label class="remember-label">
            <input type="checkbox" bind:checked={rememberKey} />
            {$_('settings.rememberKey')}
          </label>
          <button on:click={saveApiKey}>{$_('common.save')}</button>
        {/if}
        <p class="api-disclaimer">{$_('settings.apiKeyNote')}</p>
      </section>
      {/if}

      <section>
        <h2>{$_('settings.shortcuts')}</h2>
        <ul class="shortcuts-list">
          <li>
            <span class="shortcut-desc">{$_('settings.shortcutSearch')}</span>
            <span class="shortcut-keys"><kbd>{mod}</kbd><kbd>K</kbd></span>
          </li>
          <li>
            <span class="shortcut-desc">{$_('settings.shortcutSidebar')}</span>
            <span class="shortcut-keys"><kbd>{mod}</kbd><kbd>\</kbd></span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(0, 0, 0, 0.5);
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
    backdrop-filter: blur(2px);
  }
  .panel {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    width: 100%; max-width: 480px;
    max-height: 90vh;
    display: flex; flex-direction: column;
    box-shadow: var(--shadow-lg);
  }
  .panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.25rem 1.5rem 1rem;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }
  h1 {
    font-size: 1rem; font-weight: 600; color: var(--color-text);
    letter-spacing: -0.01em;
  }
  .close-btn {
    display: inline-flex; align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer;
    color: var(--color-text-muted); padding: 0.25rem; border-radius: 4px;
    transition: color 0.15s ease, background-color 0.15s ease;
  }
  .close-btn:hover { color: var(--color-text); background: var(--color-hover); }
  .panel-body {
    overflow-y: auto; padding: 1.25rem 1.5rem; flex: 1;
  }
  section { margin-bottom: 1.75rem; }
  h2 {
    font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--color-text-faint); margin-bottom: 0.6rem;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  .option-group {
    display: flex; flex-wrap: wrap; gap: 0.5rem;
  }
  button {
    padding: 0.35rem 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: 5px; cursor: pointer;
    background: var(--color-surface);
    font-family: inherit; font-size: 0.85rem;
    color: var(--color-text);
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }
  button:hover { background: var(--color-hover); border-color: var(--color-text-faint); }
  button.active {
    background: var(--color-accent);
    color: var(--color-bg);
    border-color: var(--color-accent);
  }
  .import-label {
    display: inline-block; padding: 0.35rem 0.9rem;
    border: 1px solid var(--color-border); border-radius: 5px;
    cursor: pointer; background: var(--color-surface);
    font-size: 0.85rem; color: var(--color-text);
    transition: background-color 0.15s ease;
  }
  .import-label:hover { background: var(--color-hover); }
  .api-key-row {
    display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;
  }
  .api-key-masked {
    font-family: monospace; font-size: 0.875rem; color: var(--color-text-muted);
  }
  .api-input {
    width: 100%; padding: 0.5rem;
    border: 1px solid var(--color-border); border-radius: 5px;
    font-family: monospace; font-size: 0.875rem;
    background: var(--color-surface); color: var(--color-text);
    margin-bottom: 0.5rem; outline: none;
    transition: border-color 0.15s ease;
  }
  .api-input:focus { border-color: var(--color-text-faint); }
  .remember-label {
    display: flex; align-items: center; gap: 0.4rem;
    font-size: 0.875rem; margin-bottom: 0.75rem; cursor: pointer;
  }
  .api-disclaimer {
    font-size: 0.72rem; color: var(--color-text-muted);
    margin-top: 0.75rem; line-height: 1.5;
  }
  .danger-btn { color: var(--color-text-muted); }
  .danger-btn:hover { color: var(--color-text); border-color: var(--color-text-muted); }
  .shortcuts-list {
    list-style: none; display: flex; flex-direction: column; gap: 0.5rem;
  }
  .shortcuts-list li {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 0.85rem; color: var(--color-text);
  }
  .shortcut-desc { color: var(--color-text-muted); }
  .shortcut-keys { display: flex; gap: 0.25rem; }
  kbd {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0.15rem 0.45rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 0.75rem;
    background: var(--color-surface);
    color: var(--color-text);
    box-shadow: 0 1px 0 var(--color-border);
    line-height: 1.4;
    min-width: 1.5rem;
  }
</style>
