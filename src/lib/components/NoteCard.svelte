<script>
  export let note;
  export let active = false;

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  }

  function excerpt(content) {
    const text = content.replace(/<[^>]+>/g, '').slice(0, 80);
    return text || 'Nota vuota';
  }
</script>

<div class="note-card" class:active on:click>
  <div class="note-title">{note.title || 'Senza titolo'}</div>
  <div class="note-meta">{formatDate(note.updatedAt)}</div>
  <div class="note-excerpt">{excerpt(note.content)}</div>
</div>

<style>
  .note-card {
    padding: 0.75rem 1rem;
    cursor: pointer;
    border-bottom: 1px solid var(--color-border);
  }
  .note-card:hover, .note-card.active { background: var(--color-hover); }
  .note-title { font-weight: 600; font-size: 0.9rem; margin-bottom: 0.2rem; }
  .note-meta { font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.25rem; }
  .note-excerpt { font-size: 0.8rem; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
