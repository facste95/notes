<script>
  import { createEventDispatcher } from 'svelte';
  import { Sparkles } from 'lucide-svelte';
  export let editor = null;
  export let mode = 'rich';
  export let showAIPanel = false;
  export let editorVersion = 0;

  const dispatch = createEventDispatcher();

  function cmd(command, attrs = {}) {
    if (!editor) return;
    editor.chain().focus()[command](attrs).run();
  }

  // Reactive active states — recalculated on every editor transaction.
  // The comma operator reads editorVersion (establishing Svelte reactivity dependency)
  // then evaluates and returns the isActive() call result.
  $: boldActive   = (editorVersion, editor?.isActive('bold') ?? false);
  $: italicActive = (editorVersion, editor?.isActive('italic') ?? false);
  $: h1Active     = (editorVersion, editor?.isActive('heading', { level: 1 }) ?? false);
  $: h2Active     = (editorVersion, editor?.isActive('heading', { level: 2 }) ?? false);
  $: h3Active     = (editorVersion, editor?.isActive('heading', { level: 3 }) ?? false);
  $: bulletActive = (editorVersion, editor?.isActive('bulletList') ?? false);
</script>

<div class="toolbar">
  {#if mode === 'rich'}
    <button
      on:click={() => cmd('toggleBold')}
      class:active={boldActive}
      title="Grassetto (Ctrl+B)"
    ><b>B</b></button>
    <button
      on:click={() => cmd('toggleItalic')}
      class:active={italicActive}
      title="Corsivo (Ctrl+I)"
    ><i>I</i></button>
    <button
      on:click={() => cmd('toggleHeading', { level: 1 })}
      class:active={h1Active}
    >H1</button>
    <button
      on:click={() => cmd('toggleHeading', { level: 2 })}
      class:active={h2Active}
    >H2</button>
    <button
      on:click={() => cmd('toggleHeading', { level: 3 })}
      class:active={h3Active}
    >H3</button>
    <button
      on:click={() => cmd('toggleBulletList')}
      class:active={bulletActive}
    >• Lista</button>
    <div class="separator"></div>
  {/if}

  <button
    class="mode-toggle"
    on:click={() => dispatch('toggleMode')}
    title="Cambia modalità editor"
  >
    {mode === 'rich' ? 'MD' : 'Rich'}
  </button>
  <button
    class="ai-btn"
    class:active={showAIPanel}
    on:click={() => dispatch('toggleAI')}
    title="AI"
  >
    <Sparkles size={14} />
  </button>
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
  .mode-toggle { margin-left: auto; font-size: 0.75rem; color: var(--color-text-muted); }
  .ai-btn { display: flex; align-items: center; }
  .ai-btn.active { background: var(--color-hover); border-color: var(--color-border); }
</style>
