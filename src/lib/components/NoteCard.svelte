<script>
  import { createEventDispatcher } from 'svelte';
  import { Trash2 } from 'lucide-svelte';

  export let note;
  export let active = false;

  const dispatch = createEventDispatcher();

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  }

  function excerpt(content) {
    const text = content.replace(/<[^>]+>/g, '').slice(0, 80);
    return text || 'Nota vuota';
  }

  function handleTrash(e) {
    e.stopPropagation();
    dispatch('trash');
  }
</script>

<div
  class="note-card"
  class:active
  on:click
  draggable="true"
  on:dragstart
  role="button"
  tabindex="0"
  on:keydown={e => e.key === 'Enter' && dispatch('click')}
>
  <div class="note-main">
    <div class="note-title">{note.title || 'Senza titolo'}</div>
    <div class="note-meta">{formatDate(note.updatedAt)}</div>
    <div class="note-excerpt">{excerpt(note.content)}</div>
  </div>
  <button class="trash-btn" on:click={handleTrash} title="Sposta nel cestino">
    <Trash2 size={13} />
  </button>
</div>

<style>
  .note-card {
    display: flex; align-items: flex-start;
    padding: 0.75rem 0.75rem 0.75rem 1rem;
    cursor: pointer;
    border-bottom: 1px solid var(--color-border);
    gap: 0.5rem;
  }
  .note-card:hover, .note-card.active { background: var(--color-hover); }
  .note-card:hover .trash-btn { opacity: 1; }
  .note-main { flex: 1; min-width: 0; }
  .note-title { font-weight: 600; font-size: 0.9rem; margin-bottom: 0.2rem; }
  .note-meta { font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.25rem; }
  .note-excerpt {
    font-size: 0.8rem; color: var(--color-text-muted);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .trash-btn {
    display: inline-flex; align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer; color: var(--color-text-faint);
    padding: 0.2rem; flex-shrink: 0; opacity: 0; transition: opacity 0.15s;
    margin-top: 0.1rem;
  }
  .trash-btn:hover { color: var(--color-text); }
</style>
