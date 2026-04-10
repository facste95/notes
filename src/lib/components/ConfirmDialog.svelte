<script>
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  export let title = 'Conferma';
  export let message = '';
  export let confirmLabel = 'Conferma';
  export let cancelLabel = 'Annulla';
  export let destructive = false;

  const dispatch = createEventDispatcher();

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) dispatch('cancel');
  }
</script>

<svelte:window on:keydown={e => { if (e.key === 'Escape') dispatch('cancel'); }} />

<div class="backdrop" on:click={handleBackdrop} transition:fade={{ duration: 150 }} role="presentation">
  <div class="panel" transition:fly={{ y: 16, duration: 220, easing: quintOut }} role="alertdialog" aria-modal="true">
    <p class="dialog-title">{title}</p>
    {#if message}
      <p class="dialog-message">{message}</p>
    {/if}
    <div class="actions">
      <button class="cancel-btn" on:click={() => dispatch('cancel')}>{cancelLabel}</button>
      <button class="confirm-btn" class:destructive on:click={() => dispatch('confirm')}>{confirmLabel}</button>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed; inset: 0; z-index: 150;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem;
  }
  .panel {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    box-shadow: var(--shadow-lg);
    padding: 1.5rem;
    max-width: 360px;
    width: 100%;
  }
  .dialog-title {
    font-size: 0.95rem; font-weight: 600; color: var(--color-text);
    margin: 0 0 0.5rem;
  }
  .dialog-message {
    font-size: 0.85rem; color: var(--color-text-muted);
    margin: 0 0 1.25rem; line-height: 1.5;
  }
  .actions {
    display: flex; gap: 0.5rem; justify-content: flex-end;
  }
  .cancel-btn {
    background: none; border: 1px solid var(--color-border);
    border-radius: 6px; padding: 0.4rem 0.9rem;
    font-size: 0.83rem; cursor: pointer; font-family: inherit;
    color: var(--color-text-muted);
    transition: background-color 0.12s ease, color 0.12s ease;
  }
  .cancel-btn:hover { background: var(--color-hover); color: var(--color-text); }
  .confirm-btn {
    background: var(--color-accent); color: var(--color-bg);
    border: none; border-radius: 6px; padding: 0.4rem 0.9rem;
    font-size: 0.83rem; cursor: pointer; font-family: inherit; font-weight: 500;
    transition: opacity 0.12s ease;
  }
  .confirm-btn:hover { opacity: 0.85; }
  .confirm-btn.destructive {
    background: #c0392b; color: #fff;
  }
</style>
