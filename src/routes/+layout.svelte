<script>
  import { onMount } from 'svelte';
  import { sidebarOpen, toggleSidebar, theme, language } from '$lib/stores/ui.js';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Onboarding from '$lib/components/Onboarding.svelte';
  import { db, autopurgeTrash } from '$lib/db.js';
  import { setupI18n, locale } from '$lib/i18n.js';
  import { buildIndex } from '$lib/search.js';

  let showOnboarding = false;

  function handleKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
      e.preventDefault();
      toggleSidebar();
    }
  }

  onMount(async () => {
    // Auto-purge notes trashed > 30 days ago
    await autopurgeTrash();

    // Initialize FlexSearch index (only active notes)
    const allNotes = await db.notes.filter(n => !n.deletedAt).toArray();
    buildIndex(allNotes);

    // Initialize i18n
    const langPref = await db.prefs.get('language');
    const lang = langPref?.value ?? null;
    setupI18n(lang);
    if (lang) language.set(lang);

    const onboarded = await db.prefs.get('onboardingCompleted');
    if (!onboarded) showOnboarding = true;
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
  {#if showOnboarding}
    <Onboarding on:complete={() => showOnboarding = false} />
  {/if}
</div>

<style>
  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }

  :global([data-theme='light']) {
    --color-bg: #faf9f7;
    --color-surface: #f3f2ee;
    --color-border: #e5e4df;
    --color-text: #1a1917;
    --color-text-muted: #6b6a66;
    --color-text-faint: #aaa9a5;
    --color-accent: #333;
    --color-hover: #eeecea;
  }

  :global([data-theme='dark']) {
    --color-bg: #1a1917;
    --color-surface: #232220;
    --color-border: #2e2d2a;
    --color-text: #e8e7e3;
    --color-text-muted: #9b9a96;
    --color-text-faint: #555450;
    --color-accent: #e8e7e3;
    --color-hover: #2a2927;
  }

  :global(body) {
    background: var(--color-bg);
    color: var(--color-text);
    font-family: 'Literata', Georgia, serif;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  .app {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }
  .main-content {
    flex: 1;
    overflow-y: auto;
    background: var(--color-bg);
  }
</style>
