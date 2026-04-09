<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { db } from '$lib/db.js';
  import { language } from '$lib/stores/ui.js';
  import { pickRandomMessage } from '$lib/emptyStateMessages.js';

  let message = '';

  onMount(async () => {
    message = pickRandomMessage(get(language));

    const onboarding = await db.prefs.get('onboardingCompleted');
    if (!onboarding) return;

    const lastPref = await db.prefs.get('lastOpenedNoteId');
    if (lastPref?.value) {
      const note = await db.notes.get(lastPref.value);
      if (note) { goto(`/note/${note.id}`); return; }
    }

    const firstNote = await db.notes.orderBy('updatedAt').last();
    if (firstNote) goto(`/note/${firstNote.id}`);
  });
</script>

<div class="empty-state">
  <p>{message}</p>
</div>

<style>
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
    text-align: center;
  }
  .empty-state p {
    max-width: 360px;
    color: var(--color-text-muted);
    font-style: italic;
    line-height: 1.7;
    font-size: 0.95rem;
  }
</style>
