<script>
  export let folder;
  export let active = false;
  export let count = 0;
</script>

<div class="folder-item" class:active on:click>
  <span class="folder-icon">📁</span>
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
  .folder-item:hover, .folder-item.active { background: #f5f5f0; }
  .folder-name { flex: 1; }
  .folder-count { font-size: 0.75rem; color: #999; }
</style>
