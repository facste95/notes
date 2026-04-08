<script>
  import { sidebarOpen, toggleSidebar, theme } from '$lib/stores/ui.js';

  function handleKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
      e.preventDefault();
      toggleSidebar();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="app" data-theme={$theme}>
  <div class="sidebar-placeholder" class:closed={!$sidebarOpen}>
    <!-- Sidebar comes in Task 6 -->
  </div>
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
  .sidebar-placeholder {
    width: 260px;
    min-width: 260px;
    border-right: 1px solid #e5e5e0;
    background: #faf9f7;
    transition: width 0.3s ease, min-width 0.3s ease;
    flex-shrink: 0;
  }
  .sidebar-placeholder.closed {
    width: 40px;
    min-width: 40px;
  }
  .main-content {
    flex: 1;
    overflow-y: auto;
  }
</style>
