<script>
  import { createEventDispatcher } from 'svelte';
  import { Search } from 'lucide-svelte';

  export let placeholder = 'Cerca...';
  let value = '';
  const dispatch = createEventDispatcher();

  function onInput() {
    dispatch('search', { query: value });
  }

  function clear() {
    value = '';
    dispatch('search', { query: '' });
  }
</script>

<div class="search-bar">
  <Search size={14} />
  <input
    bind:value
    {placeholder}
    on:input={onInput}
    type="search"
  />
  {#if value}
    <button class="clear-btn" on:click={clear}>✕</button>
  {/if}
</div>

<style>
  .search-bar {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
  }
  input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.8rem;
    font-family: inherit;
    color: var(--color-text);
  }
  input::placeholder { color: var(--color-text-faint); }
  .clear-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-faint);
    font-size: 0.7rem;
    padding: 0;
  }
  :global(.search-bar svg) { color: var(--color-text-faint); flex-shrink: 0; }
</style>
