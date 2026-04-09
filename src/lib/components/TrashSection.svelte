<script>
  import { createEventDispatcher } from 'svelte';
  import { liveQuery } from 'dexie';
  import { db, restoreNote, purgeNote, emptyTrash } from '$lib/db.js';
  import { Trash2, RotateCcw, X } from 'lucide-svelte';
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  const dispatch = createEventDispatcher();

  const trashedNotes = liveQuery(async () => {
    const notes = await db.notes.filter(n => !!n.deletedAt).toArray();
    return notes.sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
  });

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  }

  function excerpt(content) {
    const text = (content ?? '').replace(/<[^>]+>/g, '').slice(0, 60);
    return text || 'Nota vuota';
  }

  async function handleRestore(id) {
    await restoreNote(id);
    dispatch('restored');
  }

  async function handlePurge(id) {
    await purgeNote(id);
  }

  async function handleEmptyTrash() {
    if (!confirm('Svuotare il cestino? Questa azione è irreversibile.')) return;
    await emptyTrash();
  }
</script>

<div class="trash-section">
  <div class="trash-header">
    <span class="trash-title"><Trash2 size={13} /> Cestino</span>
    {#if ($trashedNotes ?? []).length > 0}
      <button class="empty-btn" on:click={handleEmptyTrash}>Svuota</button>
    {/if}
  </div>

  {#if ($trashedNotes ?? []).length === 0}
    <div class="empty-state">Il cestino è vuoto</div>
  {:else}
    {#each $trashedNotes ?? [] as note (note.id)}
      <div
        class="trash-note"
        in:fly={{ y: 10, duration: 200, easing: quintOut }}
      >
        <div class="trash-note-info">
          <div class="trash-note-title">{note.title || 'Senza titolo'}</div>
          <div class="trash-note-meta">{formatDate(note.deletedAt)} · {excerpt(note.content)}</div>
        </div>
        <div class="trash-actions">
          <button class="action-btn restore" on:click={() => handleRestore(note.id)} title="Ripristina">
            <RotateCcw size={12} />
          </button>
          <button class="action-btn delete" on:click={() => handlePurge(note.id)} title="Elimina definitivamente">
            <X size={12} />
          </button>
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .trash-section { padding: 0; }
  .trash-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.5rem 1rem; font-size: 0.8rem; color: var(--color-text-muted);
  }
  .trash-title { display: inline-flex; align-items: center; gap: 0.3rem; }
  .empty-btn {
    background: none; border: none; cursor: pointer; font-size: 0.75rem;
    color: var(--color-text-faint); font-family: inherit;
  }
  .empty-btn:hover { color: var(--color-text); }
  .empty-state {
    padding: 1rem; font-size: 0.8rem; color: var(--color-text-faint); text-align: center;
  }
  .trash-note {
    display: flex; align-items: center;
    padding: 0.5rem 0.75rem 0.5rem 1rem;
    border-bottom: 1px solid var(--color-border);
    gap: 0.5rem;
  }
  .trash-note:hover { background: var(--color-hover); }
  .trash-note-info { flex: 1; min-width: 0; }
  .trash-note-title {
    font-size: 0.85rem; font-weight: 500;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .trash-note-meta { font-size: 0.75rem; color: var(--color-text-faint); margin-top: 0.1rem; }
  .trash-actions { display: flex; gap: 0.15rem; flex-shrink: 0; }
  .action-btn {
    display: inline-flex; align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer; color: var(--color-text-faint);
    padding: 0.2rem; border-radius: 3px;
  }
  .action-btn.restore:hover { color: var(--color-text); }
  .action-btn.delete:hover { color: #e57373; }
</style>
