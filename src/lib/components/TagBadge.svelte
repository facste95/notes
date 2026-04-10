<script>
  export let tag;
  export let active = false;
</script>

<span class="tag-badge" class:active on:click>
  #{tag}
</span>

<style>
  .tag-badge {
    display: inline-block;
    font-size: 0.68rem;
    padding: 0.15rem 0.55rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    cursor: pointer;
    color: var(--color-text-muted);
    font-family: 'DM Sans', system-ui, sans-serif;
    letter-spacing: 0.02em;
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }
  .tag-badge:hover {
    background: var(--color-hover);
    color: var(--color-text);
    border-color: var(--color-text-faint);
  }
  .tag-badge.active {
    background: var(--color-accent-warm);
    color: #fff;
    border-color: var(--color-accent-warm);
  }
</style>
