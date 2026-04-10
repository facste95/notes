<script>
  import { createEventDispatcher } from 'svelte';
  import { Folder } from 'lucide-svelte';

  export let folder;
  export let active = false;
  export let count = 0;

  const dispatch = createEventDispatcher();

  let editing = false;
  let editName = '';
  let inputEl;

  function startEdit() {
    editing = true;
    editName = folder.name;
    setTimeout(() => inputEl?.focus(), 0);
  }

  function confirmEdit() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== folder.name) {
      dispatch('rename', { name: trimmed });
    }
    editing = false;
  }

  function cancelEdit() {
    editing = false;
    editName = '';
  }
</script>

{#if editing}
  <div class="folder-item editing">
    <span class="folder-icon"><Folder size={14} /></span>
    <input
      bind:this={inputEl}
      bind:value={editName}
      class="folder-edit-input"
      on:keydown={e => {
        if (e.key === 'Enter') confirmEdit();
        if (e.key === 'Escape') cancelEdit();
      }}
      on:blur={confirmEdit}
      on:click|stopPropagation
    />
  </div>
{:else}
  <div
    class="folder-item"
    class:active
    on:click
    on:dblclick={startEdit}
    title="Doppio clic per rinominare"
  >
    <span class="folder-icon"><Folder size={14} /></span>
    <span class="folder-name">{folder.name}</span>
    {#if count > 0}
      <span class="folder-count">({count})</span>
    {/if}
  </div>
{/if}

<style>
  .folder-item {
    display: flex; align-items: center; gap: 0.4rem;
    padding: 0.5rem 1rem; cursor: pointer; font-size: 0.85rem;
    color: var(--color-text);
    transition: background-color 0.12s ease;
  }
  .folder-item:hover, .folder-item.active { background: var(--color-hover); }
  .folder-item.editing { cursor: default; }
  .folder-name { flex: 1; }
  .folder-count {
    font-size: 0.7rem; color: var(--color-text-muted);
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  .folder-icon { display: inline-flex; align-items: center; color: var(--color-text-muted); }
  .folder-edit-input {
    flex: 1; border: 1px solid var(--color-border); border-radius: 3px;
    padding: 0.1rem 0.35rem; font-size: 0.85rem; font-family: inherit;
    background: var(--color-bg); color: var(--color-text); outline: none;
    transition: border-color 0.15s ease;
  }
  .folder-edit-input:focus { border-color: var(--color-text-muted); }
</style>
