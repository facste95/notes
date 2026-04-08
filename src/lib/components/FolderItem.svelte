<script>
  import { Folder } from 'lucide-svelte';
  export let folder;
  export let active = false;
  export let count = 0;
</script>

<div class="folder-item" class:active on:click>
  <span class="folder-icon"><Folder size={14} /></span>
  <span class="folder-name">{folder.name}</span>
  {#if count > 0}
    <span class="folder-count">({count})</span>
  {/if}
</div>

<style>
  .folder-item {
    display: flex; align-items: center; gap: 0.4rem;
    padding: 0.5rem 1rem; cursor: pointer; font-size: 0.875rem;
  }
  .folder-item:hover, .folder-item.active { background: var(--color-hover); }
  .folder-name { flex: 1; }
  .folder-count { font-size: 0.75rem; color: var(--color-text-muted); }
  .folder-icon { display: inline-flex; align-items: center; color: var(--color-text-muted); }
</style>
