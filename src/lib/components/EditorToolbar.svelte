<script>
  import { createEventDispatcher } from 'svelte';
  import { Sparkles, Paintbrush, Code2, Download, List, Code } from 'lucide-svelte';
  import { AI_ENABLED } from '$lib/stores/ui.js';

  export let editor = null;
  export let mode = 'rich';
  export let showAIPanel = false;
  export let editorVersion = 0;
  export let mdTextarea = null;

  const dispatch = createEventDispatcher();
  let showDownload = false;
  let showHeadingMenu = false;

  function cmd(command, attrs = {}) {
    if (!editor) return;
    editor.chain().focus()[command](attrs).run();
  }

  function closeDownload() { showDownload = false; }
  function closeHeadingMenu() { showHeadingMenu = false; }

  function setRichHeading(level) {
    cmd('toggleHeading', { level });
    closeHeadingMenu();
  }

  function setMdHeading(level) {
    insertMdSyntax(`h${level}`);
    closeHeadingMenu();
  }

  function insertMdSyntax(type) {
    if (!mdTextarea) return;
    const val = mdTextarea.value;
    const start = mdTextarea.selectionStart;
    const end = mdTextarea.selectionEnd;
    const selected = val.slice(start, end);
    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = val.indexOf('\n', start);
    const currentLine = val.slice(lineStart, lineEnd === -1 ? val.length : lineEnd);

    let newValue, newStart, newEnd;

    if (type === 'bold') {
      const inner = selected || 'testo';
      newValue = val.slice(0, start) + `**${inner}**` + val.slice(end);
      newStart = start + 2;
      newEnd = selected ? end + 2 : start + 2 + inner.length;
    } else if (type === 'italic') {
      const inner = selected || 'testo';
      newValue = val.slice(0, start) + `*${inner}*` + val.slice(end);
      newStart = start + 1;
      newEnd = selected ? end + 1 : start + 1 + inner.length;
    } else if (type === 'code') {
      const inner = selected || 'codice';
      newValue = val.slice(0, start) + '`' + inner + '`' + val.slice(end);
      newStart = start + 1;
      newEnd = selected ? end + 1 : start + 1 + inner.length;
    } else if (type === 'h1' || type === 'h2' || type === 'h3') {
      const prefix = { h1: '# ', h2: '## ', h3: '### ' }[type];
      const stripped = currentLine.replace(/^#{1,6}\s/, '');
      const lineEndIdx = lineEnd === -1 ? val.length : lineEnd;
      newValue = val.slice(0, lineStart) + prefix + stripped + val.slice(lineEndIdx);
      newStart = lineStart + prefix.length;
      newEnd = lineStart + prefix.length + stripped.length;
    } else if (type === 'list') {
      const lineEndIdx = lineEnd === -1 ? val.length : lineEnd;
      newValue = val.slice(0, lineStart) + '- ' + currentLine + val.slice(lineEndIdx);
      newStart = start + 2;
      newEnd = end + 2;
    } else {
      return;
    }

    mdTextarea.value = newValue;
    mdTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(() => {
      mdTextarea.setSelectionRange(newStart, newEnd);
      mdTextarea.focus();
    }, 0);
  }

  $: boldActive   = (editorVersion, editor?.isActive('bold') ?? false);
  $: italicActive = (editorVersion, editor?.isActive('italic') ?? false);
  $: h1Active     = (editorVersion, editor?.isActive('heading', { level: 1 }) ?? false);
  $: h2Active     = (editorVersion, editor?.isActive('heading', { level: 2 }) ?? false);
  $: h3Active     = (editorVersion, editor?.isActive('heading', { level: 3 }) ?? false);
  $: bulletActive = (editorVersion, editor?.isActive('bulletList') ?? false);
  $: activeHeading = h1Active ? 1 : h2Active ? 2 : h3Active ? 3 : null;
</script>

<svelte:window on:click={e => {
  if (!e.target.closest('.download-wrapper')) closeDownload();
  if (!e.target.closest('.heading-wrapper')) closeHeadingMenu();
}} />

<div class="toolbar">
  <div class="toolbar-left">
    <!-- Format group: Bold, Italic -->
    <div class="tool-group">
      {#if mode === 'rich'}
        <button on:click={() => cmd('toggleBold')} class:active={boldActive} title="Grassetto (Ctrl+B)"><b>B</b></button>
        <button on:click={() => cmd('toggleItalic')} class:active={italicActive} title="Corsivo (Ctrl+I)"><i>I</i></button>
      {:else}
        <button on:click={() => insertMdSyntax('bold')} title="Grassetto"><b>B</b></button>
        <button on:click={() => insertMdSyntax('italic')} title="Corsivo"><i>I</i></button>
      {/if}
    </div>

    <div class="separator"></div>

    <!-- Heading dropdown -->
    <div class="tool-group">
      <div class="heading-wrapper">
        <button
          class="heading-trigger"
          class:active={activeHeading !== null}
          on:click={() => showHeadingMenu = !showHeadingMenu}
          title="Titolo"
        >
          {#if activeHeading}H{activeHeading}{:else}H{/if}
          <span class="heading-caret">▾</span>
        </button>
        {#if showHeadingMenu}
          <div class="heading-dropdown">
            {#if mode === 'rich'}
              <button class:active={h1Active} on:click={() => setRichHeading(1)}>H1 — Titolo principale</button>
              <button class:active={h2Active} on:click={() => setRichHeading(2)}>H2 — Titolo sezione</button>
              <button class:active={h3Active} on:click={() => setRichHeading(3)}>H3 — Sottotitolo</button>
            {:else}
              <button on:click={() => setMdHeading(1)}>H1 — Titolo principale</button>
              <button on:click={() => setMdHeading(2)}>H2 — Titolo sezione</button>
              <button on:click={() => setMdHeading(3)}>H3 — Sottotitolo</button>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <div class="separator"></div>

    <!-- List + Code group -->
    <div class="tool-group">
      {#if mode === 'rich'}
        <button on:click={() => cmd('toggleBulletList')} class:active={bulletActive} title="Lista puntata">
          <List size={14} />
        </button>
      {:else}
        <button on:click={() => insertMdSyntax('list')} title="Lista puntata">
          <List size={14} />
        </button>
        <button on:click={() => insertMdSyntax('code')} title="Codice inline">
          <Code size={14} />
        </button>
      {/if}
    </div>
  </div>

  <!-- Right side controls -->
  <div class="toolbar-right">
    <div class="mode-switch" role="group" aria-label="Editor mode">
      <button
        class="mode-btn"
        class:active={mode === 'rich'}
        on:click={() => mode !== 'rich' && dispatch('toggleMode')}
        title="Rich text"
      ><Paintbrush size={13} /></button>
      <button
        class="mode-btn"
        class:active={mode === 'markdown'}
        on:click={() => mode !== 'markdown' && dispatch('toggleMode')}
        title="Markdown"
      ><Code2 size={13} /></button>
    </div>

    <div class="download-wrapper">
      <button
        class="icon-btn"
        on:click={() => showDownload = !showDownload}
        title="Scarica nota"
      ><Download size={14} /></button>
      {#if showDownload}
        <div class="download-dropdown">
          <button on:click={() => { dispatch('downloadNote', { format: 'md' }); closeDownload(); }}>
            .md
          </button>
          <button on:click={() => { dispatch('downloadNote', { format: 'txt' }); closeDownload(); }}>
            .txt
          </button>
        </div>
      {/if}
    </div>

    {#if AI_ENABLED}
    <button
      class="ai-btn icon-btn"
      class:active={showAIPanel}
      on:click={() => dispatch('toggleAI')}
      title="AI"
    ><Sparkles size={14} /></button>
    {/if}
  </div>
</div>

<style>
  .toolbar {
    display: flex; align-items: center;
    padding: 0.4rem 0.75rem; border-bottom: 1px solid var(--color-border);
    background: var(--color-bg); gap: 0;
    transition: background-color 0.3s ease, border-color 0.25s ease;
    overflow: hidden;
  }
  .toolbar-left {
    display: flex; align-items: center; gap: 0.15rem;
    flex: 1; min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .toolbar-left::-webkit-scrollbar { display: none; }
  .tool-group {
    display: flex; align-items: center; gap: 0.1rem; flex-shrink: 0;
  }
  button {
    background: none; border: 1px solid transparent; padding: 0.25rem 0.45rem;
    cursor: pointer; font-size: 0.8rem; border-radius: 4px; font-family: inherit;
    color: var(--color-text-muted); flex-shrink: 0;
    transition: background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease;
    display: inline-flex; align-items: center; justify-content: center;
  }
  button:hover { background: var(--color-hover); border-color: var(--color-border); color: var(--color-text); }
  button.active {
    background: var(--color-hover);
    border-color: var(--color-border);
    color: var(--color-text);
  }
  .separator { width: 1px; height: 1.2rem; background: var(--color-border); margin: 0 0.3rem; flex-shrink: 0; }
  .toolbar-right { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; margin-left: 0.5rem; }

  /* Heading dropdown */
  .heading-wrapper { position: relative; }
  .heading-trigger {
    display: inline-flex; align-items: center; gap: 0.2rem;
    padding: 0.25rem 0.4rem; font-weight: 600; min-width: 38px;
  }
  .heading-caret { font-size: 0.6rem; line-height: 1; color: var(--color-text-faint); }
  .heading-dropdown {
    position: absolute; top: calc(100% + 6px); left: 0; z-index: 30;
    background: var(--color-bg); border: 1px solid var(--color-border);
    border-radius: 6px; box-shadow: var(--shadow-md);
    overflow: hidden; min-width: 180px;
  }
  .heading-dropdown button {
    display: block; width: 100%; text-align: left;
    padding: 0.4rem 0.75rem; border: none; border-radius: 0;
    font-size: 0.82rem; cursor: pointer;
    background: var(--color-bg); color: var(--color-text);
  }
  .heading-dropdown button:hover { background: var(--color-hover); }
  .heading-dropdown button.active { background: var(--color-hover); color: var(--color-text); }

  /* Mode switch pill */
  .mode-switch {
    display: flex;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 2px; gap: 2px;
  }
  .mode-btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0.2rem 0.45rem;
    border: none; border-radius: 12px;
    background: transparent; cursor: pointer;
    color: var(--color-text-faint);
    transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  }
  .mode-btn.active {
    background: var(--color-bg);
    color: var(--color-text);
    box-shadow: 0 1px 4px rgba(0,0,0,0.12);
  }
  .icon-btn { display: inline-flex; align-items: center; }
  .ai-btn.active { background: var(--color-hover); border-color: var(--color-border); }

  /* Download dropdown */
  .download-wrapper { position: relative; }
  .download-dropdown {
    position: absolute; top: calc(100% + 6px); right: 0; z-index: 20;
    background: var(--color-bg); border: 1px solid var(--color-border);
    border-radius: 6px; box-shadow: var(--shadow-md);
    overflow: hidden; min-width: 100px;
  }
  .download-dropdown button {
    display: block; width: 100%; text-align: left;
    padding: 0.4rem 0.75rem; border: none; border-radius: 0;
    font-size: 0.85rem; cursor: pointer;
    background: var(--color-bg); color: var(--color-text);
    font-family: inherit;
  }
  .download-dropdown button:hover { background: var(--color-hover); }

  @media (max-width: 640px) {
    .toolbar { padding: 0.35rem 0.5rem; }
    button { min-width: 32px; min-height: 32px; padding: 0.3rem 0.4rem; }
  }
</style>
