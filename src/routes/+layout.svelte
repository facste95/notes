<script>
  import { onMount } from 'svelte';
  import { sidebarOpen, toggleSidebar, theme } from '$lib/stores/ui.js';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { db } from '$lib/db.js';
  import { setupI18n, locale } from '$lib/i18n.js';
  import { language } from '$lib/stores/ui.js';
  import { buildIndex } from '$lib/search.js';

  function handleKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
      e.preventDefault();
      toggleSidebar();
    }
  }

  onMount(async () => {
    // Initialize FlexSearch index
    const allNotes = await db.notes.toArray();
    buildIndex(allNotes);

    // Initialize i18n
    const langPref = await db.prefs.get('language');
    const lang = langPref?.value ?? null;
    setupI18n(lang);
    if (lang) language.set(lang);
  });

  // Sync language store with svelte-i18n locale
  $: if (typeof $language === 'string') locale.set($language);
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
