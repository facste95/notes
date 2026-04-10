<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { _ } from 'svelte-i18n';
  import { Search, X } from 'lucide-svelte';
  import { db } from '$lib/db.js';
  import { showPalette } from '$lib/stores/ui.js';
  import { searchNotes } from '$lib/search.js';

  let query = '';
  let allNotes = [];
  let results = [];
  let selectedIndex = 0;
  let inputEl;

  onMount(async () => {
    allNotes = await db.notes
      .filter(n => !n.deletedAt)
      .toArray()
      .then(ns => ns.sort((a, b) => b.updatedAt - a.updatedAt));
    results = allNotes.slice(0, 8);
    // Focus input on next tick
    setTimeout(() => inputEl?.focus(), 0);
  });

  $: {
    if (query.trim()) {
      const ids = new Set(searchNotes(query).map(r => r.id));
      results = allNotes.filter(n => ids.has(n.id)).slice(0, 8);
    } else {
      results = allNotes.slice(0, 8);
    }
    selectedIndex = 0;
  }

  function close() {
    showPalette.set(false);
    query = '';
  }

  function selectNote(note) {
    goto(`/note/${note.id}`);
    close();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      selectNote(results[selectedIndex]);
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) close();
  }

  function excerpt(content) {
    return (content ?? '').replace(/<[^>]+>/g, '').slice(0, 60);
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="palette-backdrop" on:click={handleBackdropClick}>
  <div class="palette-panel" role="dialog" aria-modal="true">
    <div class="palette-search">
      <Search size={16} class="search-icon" />
      <input
        bind:this={inputEl}
        bind:value={query}
        class="palette-input"
        placeholder={$_('commandPalette.placeholder')}
        on:keydown={handleKeydown}
        autocomplete="off"
        spellcheck="false"
      />
      <button class="palette-close" on:click={close}><X size={16} /></button>
    </div>

    <div class="palette-results">
      {#if results.length === 0}
        <div class="palette-empty">{$_('commandPalette.noResults')}</div>
      {:else}
        {#if !query.trim()}
          <div class="palette-section-label">{$_('commandPalette.recent')}</div>
        {/if}
        {#each results as note, i}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class="palette-item"
            class:selected={i === selectedIndex}
            on:click={() => selectNote(note)}
            on:mouseenter={() => selectedIndex = i}
            role="button"
            tabindex="-1"
          >
            <div class="palette-item-title">{note.title || 'Senza titolo'}</div>
            <div class="palette-item-meta">
              <span class="palette-item-excerpt">{excerpt(note.content)}</span>
              {#if (note.tags ?? []).length > 0}
                <span class="palette-item-tags">
                  {(note.tags ?? []).map(t => `#${t}`).join(' ')}
                </span>
              {/if}
              <span class="palette-item-date">{formatDate(note.updatedAt)}</span>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .palette-backdrop {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0, 0, 0, 0.5);
    display: flex; align-items: flex-start; justify-content: center;
    padding-top: 12vh;
    backdrop-filter: blur(2px);
  }
  .palette-panel {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    width: 100%; max-width: 560px;
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }
  .palette-search {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.9rem 1rem;
    border-bottom: 1px solid var(--color-border);
  }
  .palette-search :global(.search-icon) { color: var(--color-text-muted); flex-shrink: 0; }
  .palette-input {
    flex: 1; border: none; outline: none; background: transparent;
    font-family: inherit; font-size: 1rem; color: var(--color-text);
    caret-color: var(--color-accent-warm);
  }
  .palette-input::placeholder { color: var(--color-text-faint); }
  .palette-close {
    background: none; border: none; cursor: pointer;
    color: var(--color-text-muted); display: inline-flex;
    padding: 0.2rem; border-radius: 4px;
    transition: color 0.15s ease, background-color 0.15s ease;
  }
  .palette-close:hover { color: var(--color-text); background: var(--color-hover); }
  .palette-results { max-height: 400px; overflow-y: auto; padding: 0.35rem 0; }
  .palette-section-label {
    font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--color-text-faint); padding: 0.35rem 1rem 0.2rem;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  .palette-empty {
    padding: 1.5rem 1rem; text-align: center;
    color: var(--color-text-muted); font-size: 0.875rem;
  }
  .palette-item {
    padding: 0.6rem 1rem; cursor: pointer;
    transition: background-color 0.1s ease;
  }
  .palette-item.selected, .palette-item:hover { background: var(--color-hover); }
  .palette-item-title {
    font-size: 0.875rem; font-weight: 600; color: var(--color-text);
    margin-bottom: 0.2rem; letter-spacing: -0.01em;
  }
  .palette-item-meta {
    display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;
  }
  .palette-item-excerpt {
    font-size: 0.76rem; color: var(--color-text-muted);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    flex: 1; min-width: 0; font-style: italic;
  }
  .palette-item-tags {
    font-size: 0.68rem; color: var(--color-accent-warm); flex-shrink: 0;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  .palette-item-date {
    font-size: 0.68rem; color: var(--color-text-faint); flex-shrink: 0;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
</style>
