<script>
  import { sidebarOpen, toggleSidebar, theme } from '$lib/stores/ui.js';
  import Sidebar from '$lib/components/Sidebar.svelte';

  function handleKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
      e.preventDefault();
      toggleSidebar();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="app" data-theme={$theme}>
  <Sidebar />
  <main class="main-content">
    <slot />
  </main>
</div>

<style>
  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) { font-family: 'Literata', Georgia, serif; }

  .app {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }
  .main-content {
    flex: 1;
    overflow-y: auto;
  }
</style>
