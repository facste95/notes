<script>
  import { page } from '$app/stores';
  import { db } from '$lib/db.js';
  import { setActiveNote, editorMode } from '$lib/stores/editor.js';
  import Editor from '$lib/components/Editor.svelte';
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  let note = null;

  $: loadNote($page.params.id);

  async function loadNote(idParam) {
    const id = Number(idParam);
    if (!id) return;
    const n = await db.notes.get(id);
    if (n) {
      note = n;
      setActiveNote(n);
      editorMode.set(n.editorMode ?? 'rich');
      await db.prefs.put({ key: 'lastOpenedNoteId', value: id });
    } else {
      note = null;
    }
  }
</script>

{#if note}
  {#key note.id}
    <div in:fly={{ x: 30, duration: 350, easing: quintOut }}>
      <Editor {note} />
    </div>
  {/key}
{:else}
  <div class="not-found">Nota non trovata.</div>
{/if}

<style>
  .not-found { padding: 2rem; color: var(--color-text-muted); }
</style>
