<script>
  import { createEventDispatcher } from 'svelte';
  import { Sparkles, Paintbrush, Code2, Download } from 'lucide-svelte';
  export let editor = null;
  export let mode = 'rich';
  export let showAIPanel = false;
  export let editorVersion = 0;

  const dispatch = createEventDispatcher();
  let showDownload = false;

  function cmd(command, attrs = {}) {
    if (!editor) return;
    editor.chain().focus()[command](attrs).run();
  }

  function closeDownload() { showDownload = false; }

  $: boldActive   = (editorVersion, editor?.isActive('bold') ?? false);
  $: italicActive = (editorVersion, editor?.isActive('italic') ?? false);
  $: h1Active     = (editorVersion, editor?.isActive('heading', { level: 1 }) ?? false);
  $: h2Active     = (editorVersion, editor?.isActive('heading', { level: 2 }) ?? false);
  $: h3Active     = (editorVersion, editor?.isActive('heading', { level: 3 }) ?? false);
  $: bulletActive = (editorVersion, editor?.isActive('bulletList') ?? false);
</script>

<svelte:window on:click={e => { if (!e.target.closest('.download-wrapper')) closeDownload(); }} />

<div class="toolbar">
  {#if mode === 'rich'}
    <button on:click={() => cmd('toggleBold')} class:active={boldActive} title="Grassetto (Ctrl+B)"><b>B</b></button>
    <button on:click={() => cmd('toggleItalic')} class:active={italicActive} title="Corsivo (Ctrl+I)"><i>I</i></button>
    <button on:click={() => cmd('toggleHeading', { level: 1 })} class:active={h1Active}>H1</button>
    <button on:click={() => cmd('toggleHeading', { level: 2 })} class:active={h2Active}>H2</button>
    <button on:click={() => cmd('toggleHeading', { level: 3 })} class:active={h3Active}>H3</button>
    <button on:click={() => cmd('toggleBulletList')} class:active={bulletActive}>• Lista</button>
    <div class="separator"></div>
  {/if}

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

    <button
      class="ai-btn icon-btn"
      class:active={showAIPanel}
      on:click={() => dispatch('toggleAI')}
      title="AI"
    ><Sparkles size={14} /></button>
  </div>
</div>

<style>
  .toolbar {
    display: flex; align-items: center; gap: 0.25rem;
    padding: 0.5rem 1rem; border-bottom: 1px solid var(--color-border);
    background: var(--color-bg); flex-wrap: wrap;
  }
  button {
    background: none; border: 1px solid transparent; padding: 0.25rem 0.5rem;
    cursor: pointer; font-size: 0.8rem; border-radius: 3px; font-family: inherit;
    color: var(--color-text);
  }
  button:hover { background: var(--color-hover); border-color: var(--color-border); }
  button.active {
    background: var(--color-hover);
    border-color: var(--color-border);
    color: var(--color-text);
  }
  .separator { width: 1px; height: 1.2rem; background: var(--color-border); margin: 0 0.25rem; }
  .toolbar-right { margin-left: auto; display: flex; align-items: center; gap: 0.4rem; }
  .mode-switch {
    display: flex;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 14px;
    padding: 2px; gap: 2px;
  }
  .mode-btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0.2rem 0.45rem;
    border: none; border-radius: 10px;
    background: transparent; cursor: pointer;
    color: var(--color-text-muted);
    transition: background 0.18s, color 0.18s;
  }
  .mode-btn.active {
    background: var(--color-bg);
    color: var(--color-text);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .icon-btn { display: inline-flex; align-items: center; }
  .ai-btn.active { background: var(--color-hover); border-color: var(--color-border); }
  .download-wrapper { position: relative; }
  .download-dropdown {
    position: absolute; top: calc(100% + 6px); right: 0; z-index: 20;
    background: var(--color-bg); border: 1px solid var(--color-border);
    border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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
</style>
