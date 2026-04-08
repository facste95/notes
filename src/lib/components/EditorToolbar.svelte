<script>
  import { createEventDispatcher } from 'svelte';
  export let editor = null;
  export let mode = 'rich';

  const dispatch = createEventDispatcher();

  function cmd(command, attrs = {}) {
    if (!editor) return;
    editor.chain().focus()[command](attrs).run();
  }
</script>

<div class="toolbar">
  {#if mode === 'rich'}
    <button on:click={() => cmd('toggleBold')} title="Grassetto (Ctrl+B)"><b>B</b></button>
    <button on:click={() => cmd('toggleItalic')} title="Corsivo (Ctrl+I)"><i>I</i></button>
    <button on:click={() => cmd('toggleHeading', { level: 1 })}>H1</button>
    <button on:click={() => cmd('toggleHeading', { level: 2 })}>H2</button>
    <button on:click={() => cmd('toggleHeading', { level: 3 })}>H3</button>
    <button on:click={() => cmd('toggleBulletList')}>• Lista</button>
    <div class="separator"></div>
  {/if}

  <button
    class="mode-toggle"
    on:click={() => dispatch('toggleMode')}
    title="Cambia modalità editor"
  >
    {mode === 'rich' ? 'MD' : 'Rich'}
  </button>
</div>

<style>
  .toolbar {
    display: flex; align-items: center; gap: 0.25rem;
    padding: 0.5rem 1rem; border-bottom: 1px solid #e5e5e0;
    background: #faf9f7; flex-wrap: wrap;
  }
  button {
    background: none; border: 1px solid transparent; padding: 0.25rem 0.5rem;
    cursor: pointer; font-size: 0.8rem; border-radius: 3px; font-family: inherit;
  }
  button:hover { background: #eeede8; border-color: #ddd; }
  .separator { width: 1px; height: 1.2rem; background: #ddd; margin: 0 0.25rem; }
  .mode-toggle { margin-left: auto; font-size: 0.75rem; color: #666; }
</style>
