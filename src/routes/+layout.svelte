<script>
  import { onMount } from 'svelte';
  import { sidebarOpen, toggleSidebar, theme, language, showSettings, showPalette } from '$lib/stores/ui.js';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Onboarding from '$lib/components/Onboarding.svelte';
  import SettingsModal from '$lib/components/SettingsModal.svelte';
  import CommandPalette from '$lib/components/CommandPalette.svelte';
  import { db, autopurgeTrash } from '$lib/db.js';
  import { setupI18n, locale } from '$lib/i18n.js';
  import { buildIndex, indexNote } from '$lib/search.js';
  import { goto } from '$app/navigation';
  import { Menu } from 'lucide-svelte';

  let showOnboarding = false;

  function handleKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
      e.preventDefault();
      toggleSidebar();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      showPalette.set(true);
    }
  }

  onMount(async () => {
    await autopurgeTrash();

    const allNotes = await db.notes.filter(n => !n.deletedAt).toArray();
    buildIndex(allNotes);

    const langPref = await db.prefs.get('language');
    const lang = langPref?.value ?? null;
    setupI18n(lang);
    if (lang) language.set(lang);

    const themePref = await db.prefs.get('theme');
    if (themePref?.value) theme.set(themePref.value);

    const onboarded = await db.prefs.get('onboardingCompleted');
    if (!onboarded) showOnboarding = true;
  });

  $: if (typeof $language === 'string') locale.set($language);

  async function createNote() {
    const id = await db.notes.add({
      folderId: null,
      title: '',
      content: '',
      editorMode: 'rich',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    indexNote({ id, title: '', content: '', tags: [] });
    goto(`/note/${id}`);
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="app" data-theme={$theme}>
  <Sidebar />
  <!-- Mobile overlay: tap outside sidebar to close -->
  {#if $sidebarOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="sidebar-overlay" role="presentation" on:click={() => sidebarOpen.set(false)}></div>
  {/if}
  {#if !$sidebarOpen}
    <button class="menu-btn" on:click={toggleSidebar} title="Apri sidebar">
      <Menu size={20} />
    </button>
  {/if}
  <main class="main-content">
    <slot />
  </main>
  {#if !$sidebarOpen}
    <button class="fab-new-note" on:click={createNote} title="Nuova nota">+</button>
  {/if}
  {#if showOnboarding}
    <Onboarding on:complete={() => showOnboarding = false} />
  {/if}
  {#if $showSettings}
    <SettingsModal />
  {/if}
  {#if $showPalette}
    <CommandPalette />
  {/if}
</div>

<style>
  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }

  :global([data-theme='light']) {
    --color-bg: #f7f4ee;
    --color-surface: #eeeadf;
    --color-border: #ddd8ce;
    --color-text: #1d1b14;
    --color-text-muted: #79756b;
    --color-text-faint: #b0aca4;
    --color-accent: #1d1b14;
    --color-accent-warm: #b5673a;
    --color-hover: #e8e3d9;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.09);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.13);
  }

  :global([data-theme='dark']) {
    --color-bg: #171610;
    --color-surface: #1f1e17;
    --color-border: #2d2c22;
    --color-text: #e2dfd5;
    --color-text-muted: #99948a;
    --color-text-faint: #575449;
    --color-accent: #e2dfd5;
    --color-accent-warm: #c97b43;
    --color-hover: #252419;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.2);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.32);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.52);
  }

  :global(body) {
    background: var(--color-bg);
    color: var(--color-text);
    font-family: 'Literata', Georgia, serif;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background-color 0.3s ease, color 0.25s ease;
  }

  /* Smooth theme transitions on key structural elements */
  :global(.app), :global(.main-content), :global(.sidebar) {
    transition: background-color 0.3s ease, border-color 0.25s ease;
  }

  /* Custom scrollbar */
  :global(::-webkit-scrollbar) { width: 5px; height: 5px; }
  :global(::-webkit-scrollbar-track) { background: transparent; }
  :global(::-webkit-scrollbar-thumb) {
    background: var(--color-border);
    border-radius: 99px;
    transition: background 0.2s;
  }
  :global(::-webkit-scrollbar-thumb:hover) { background: var(--color-text-faint); }

  /* Selection color */
  :global(::selection) {
    background: var(--color-accent-warm);
    color: #fff;
  }

  .app { display: flex; height: 100vh; overflow: hidden; }
  .main-content { flex: 1; overflow-y: auto; background: var(--color-bg); }

  /* Mobile overlay behind sidebar */
  .sidebar-overlay { display: none; }

  .menu-btn { display: none; }
  .fab-new-note { display: none; }

  @media (max-width: 768px) {
    .main-content { width: 100%; }
    .sidebar-overlay {
      display: block;
      position: fixed; inset: 0; z-index: 40;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(1px);
    }
    .menu-btn {
      display: flex;
      position: fixed;
      top: 0.65rem;
      left: 0.65rem;
      z-index: 45;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 0.45rem;
      cursor: pointer;
      color: var(--color-text-muted);
      box-shadow: var(--shadow-sm);
      align-items: center;
      justify-content: center;
      transition: color 0.15s ease, background-color 0.15s ease;
    }
    .menu-btn:hover { color: var(--color-text); background: var(--color-hover); }
    .fab-new-note {
      display: flex;
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 45;
      width: 3.25rem;
      height: 3.25rem;
      border-radius: 50%;
      background: var(--color-accent);
      color: var(--color-bg);
      border: none;
      cursor: pointer;
      font-size: 1.75rem;
      line-height: 1;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-md);
      transition: opacity 0.15s ease, transform 0.15s ease;
    }
    .fab-new-note:active { transform: scale(0.93); }
  }
</style>
