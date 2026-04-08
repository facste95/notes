<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { db } from '$lib/db.js';
  import { setActiveNote, editorMode } from '$lib/stores/editor.js';

  let note = null;

  onMount(async () => {
    const id = Number($page.params.id);
    note = await db.notes.get(id);
    if (note) {
      setActiveNote(note);
      editorMode.set(note.editorMode ?? 'rich');
      await db.prefs.put({ key: 'lastOpenedNoteId', value: id });
    }
  });
</script>

{#if note}
  <div class="note-page">
    <h2 style="padding: 2rem;">{note.title || 'Senza titolo'}</h2>
    <p style="padding: 0 2rem; color: #888;">Editor viene aggiunto in Task 7.</p>
  </div>
{:else}
  <div class="not-found" style="padding: 2rem; color: #888;">Nota non trovata.</div>
{/if}
