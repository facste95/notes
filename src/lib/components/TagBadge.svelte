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
    font-size: 0.72rem;
    padding: 0.15rem 0.5rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    cursor: pointer;
    color: var(--color-text-muted);
    transition: background 0.15s;
  }
  .tag-badge:hover, .tag-badge.active {
    background: var(--color-hover);
    color: var(--color-text);
  }
</style>
