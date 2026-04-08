<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { db } from '$lib/db.js';
  import { setActiveNote, editorMode } from '$lib/stores/editor.js';
  import Editor from '$lib/components/Editor.svelte';

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
  <Editor {note} />
{:else}
  <div class="not-found" style="padding: 2rem; color: #888;">Nota non trovata.</div>
{/if}
