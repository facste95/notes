<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { Sparkles, Paintbrush, Code2, Download } from 'lucide-svelte';
  import { db } from '$lib/db.js';
  import { AI_ENABLED } from '$lib/stores/ui.js';

  export let editor = null;
  export let mode = 'rich';
  export let showAIPanel = false;
  export let editorVersion = 0;
  export let mdTextarea = null;

  const dispatch = createEventDispatcher();
  let showDownload = false;

  const FIXED_COLORS = [
    '#e74c3c', '#e67e22', '#f39c12', '#2ecc71',
    '#1abc9c', '#3498db', '#9b59b6', '#e91e63'
  ];
  let customColors = [];
  let colorPickerEl;

  onMount(async () => {
    const pref = await db.prefs.get('customColors');
    customColors = pref?.value ?? [];
  });

  function cmd(command, attrs = {}) {
    if (!editor) return;
    editor.chain().focus()[command](attrs).run();
  }

  function closeDownload() { showDownload = false; }

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
      newStart = selected ? start + 2 : start + 2;
      newEnd = selected ? end + 2 : start + 2 + inner.length;
    } else if (type === 'italic') {
      const inner = selected || 'testo';
      newValue = val.slice(0, start) + `*${inner}*` + val.slice(end);
      newStart = selected ? start + 1 : start + 1;
      newEnd = selected ? end + 1 : start + 1 + inner.length;
    } else if (type === 'code') {
      const inner = selected || 'codice';
      newValue = val.slice(0, start) + '`' + inner + '`' + val.slice(end);
      newStart = selected ? start + 1 : start + 1;
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

  function applyColor(hex) {
    if (!mdTextarea) return;
    const start = mdTextarea.selectionStart;
    const end = mdTextarea.selectionEnd;
    const selected = mdTextarea.value.slice(start, end) || 'testo';
    const wrapped = `<span style="color:${hex}">${selected}</span>`;
    const newValue = mdTextarea.value.slice(0, start) + wrapped + mdTextarea.value.slice(end);
    mdTextarea.value = newValue;
    mdTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    const newPos = start + wrapped.length;
    setTimeout(() => {
      mdTextarea.setSelectionRange(newPos, newPos);
      mdTextarea.focus();
    }, 0);
  }

  async function onColorPicker(e) {
    const hex = e.target.value;
    applyColor(hex);
    customColors = [hex, ...customColors.filter(c => c !== hex)].slice(0, 4);
    await db.prefs.put({ key: 'customColors', value: customColors });
  }

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
  {:else if mode === 'markdown'}
    <button on:click={() => insertMdSyntax('bold')} title="Grassetto"><b>B</b></button>
    <button on:click={() => insertMdSyntax('italic')} title="Corsivo"><i>I</i></button>
    <button on:click={() => insertMdSyntax('h1')}>H1</button>
    <button on:click={() => insertMdSyntax('h2')}>H2</button>
    <button on:click={() => insertMdSyntax('h3')}>H3</button>
    <button on:click={() => insertMdSyntax('list')}>• Lista</button>
    <button on:click={() => insertMdSyntax('code')} title="Codice">`c`</button>
    <div class="separator"></div>
    <div class="color-section">
      {#each FIXED_COLORS as color}
        <button
          class="color-dot"
          style="background:{color}"
          on:click={() => applyColor(color)}
          title={color}
        ></button>
      {/each}
      {#each customColors as color}
        <button
          class="color-dot color-dot--custom"
          style="background:{color}"
          on:click={() => applyColor(color)}
          title={color}
        ></button>
      {/each}
      <button
        class="color-picker-trigger"
        title="Scegli colore"
        on:click={() => colorPickerEl.click()}
      >
        <input
          bind:this={colorPickerEl}
          type="color"
          style="display:none"
          on:change={onColorPicker}
        />
        <span>+</span>
      </button>
    </div>
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
  .color-section {
    display: flex; align-items: center; gap: 0.2rem; flex-wrap: nowrap;
  }
  .color-dot {
    width: 15px; height: 15px; border-radius: 50%;
    border: 1.5px solid rgba(0,0,0,0.15); cursor: pointer;
    padding: 0; flex-shrink: 0; transition: transform 0.1s;
  }
  .color-dot:hover { transform: scale(1.2); }
  .color-dot--custom { border-style: dashed; }
  .color-picker-trigger {
    width: 15px; height: 15px; border-radius: 50%;
    border: 1.5px dashed var(--color-border);
    cursor: pointer; background: none;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 0.7rem; color: var(--color-text-muted); padding: 0;
    position: relative; flex-shrink: 0;
  }
  .color-picker-trigger:hover { border-color: var(--color-text-faint); color: var(--color-text); }
</style>
