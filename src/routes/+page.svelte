<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { db } from '$lib/db.js';

  onMount(async () => {
    const onboarding = await db.prefs.get('onboardingCompleted');
    if (!onboarding) {
      // Onboarding will be shown as overlay in layout (Task 16)
      return;
    }

    const lastPref = await db.prefs.get('lastOpenedNoteId');
    if (lastPref?.value) {
      const note = await db.notes.get(lastPref.value);
      if (note) {
        goto(`/note/${note.id}`);
        return;
      }
    }

    const firstNote = await db.notes.orderBy('updatedAt').last();
    if (firstNote) {
      goto(`/note/${firstNote.id}`);
    }
  });
</script>

<div class="empty-state">
  <p>Nessuna nota. Creane una dalla sidebar.</p>
</div>

<style>
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #888;
    font-style: italic;
  }
</style>
