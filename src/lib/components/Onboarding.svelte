<script>
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { _ } from 'svelte-i18n';
  import { db } from '$lib/db.js';
  import { theme, language, AI_ENABLED } from '$lib/stores/ui.js';
  import { editorMode } from '$lib/stores/editor.js';
  import { locale } from '$lib/i18n.js';

  const dispatch = createEventDispatcher();

  let step = 1;
  const TOTAL_STEPS = AI_ENABLED ? 4 : 3;

  let selectedLang = 'it';
  let selectedTheme = 'light';
  let selectedMode = 'rich';
  let apiKey = '';

  async function next() {
    if (step === 1) {
      language.set(selectedLang);
      locale.set(selectedLang);
      await db.prefs.put({ key: 'language', value: selectedLang });
    }
    if (step === 2) {
      theme.set(selectedTheme);
      await db.prefs.put({ key: 'theme', value: selectedTheme });
    }
    if (step === 3) {
      editorMode.set(selectedMode);
      await db.prefs.put({ key: 'editorMode', value: selectedMode });
    }
    if (step < TOTAL_STEPS) {
      step++;
      return;
    }
    await finish();
  }

  async function finish() {
    if (apiKey.trim()) {
      sessionStorage.setItem('foliaApiKey', apiKey.trim());
    }
    await db.prefs.put({ key: 'onboardingCompleted', value: true });
    dispatch('complete');
  }
</script>

<div class="onboarding-overlay" transition:fade={{ duration: 200 }}>
  <div class="onboarding-card" transition:fly={{ y: 30, duration: 300 }}>
    <div class="progress">
      {#each Array(TOTAL_STEPS) as _, i}
        <div
          class="progress-dot"
          class:active={i + 1 === step}
          class:done={i + 1 < step}
        ></div>
      {/each}
    </div>

    {#if step === 1}
      <h2>{$_('onboarding.step1Title')}</h2>
      <div class="options">
        <button class:selected={selectedLang === 'it'} on:click={() => selectedLang = 'it'}>
          🇮🇹 Italiano
        </button>
        <button class:selected={selectedLang === 'en'} on:click={() => selectedLang = 'en'}>
          🇬🇧 English
        </button>
      </div>
    {:else if step === 2}
      <h2>{$_('onboarding.step2Title')}</h2>
      <div class="options">
        <button class:selected={selectedTheme === 'light'} on:click={() => selectedTheme = 'light'}>
          ☀️ {$_('settings.themeLight')}
        </button>
        <button class:selected={selectedTheme === 'dark'} on:click={() => selectedTheme = 'dark'}>
          🌙 {$_('settings.themeDark')}
        </button>
      </div>
    {:else if step === 3}
      <h2>{$_('onboarding.step3Title')}</h2>
      <div class="options">
        <button class:selected={selectedMode === 'rich'} on:click={() => selectedMode = 'rich'}>
          {$_('settings.editorRich')}
        </button>
        <button class:selected={selectedMode === 'markdown'} on:click={() => selectedMode = 'markdown'}>
          {$_('settings.editorMarkdown')}
        </button>
      </div>
    {:else if step === 4 && AI_ENABLED}
      <h2>{$_('onboarding.step4Title')}</h2>
      <p class="hint">{$_('onboarding.apiKeyOptional')}</p>
      <input
        class="api-input"
        type="password"
        bind:value={apiKey}
        placeholder="sk-ant-..."
      />
    {/if}

    <div class="actions">
      {#if step === TOTAL_STEPS}
        <button class="skip-btn" on:click={finish}>{$_('onboarding.skip')}</button>
        <button class="next-btn" on:click={finish}>{$_('onboarding.finish')}</button>
      {:else}
        <button class="next-btn" on:click={next}>{$_('onboarding.next')}</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .onboarding-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .onboarding-card {
    background: var(--color-bg);
    border-radius: 12px;
    padding: 2.5rem;
    width: 380px;
    max-width: 90vw;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  }
  .progress {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
  }
  .progress-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-border);
    transition: background 0.2s;
  }
  .progress-dot.active { background: var(--color-accent); }
  .progress-dot.done { background: var(--color-text-muted); }
  h2 {
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
    color: var(--color-text);
  }
  .options {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 2rem;
  }
  .options button {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid var(--color-border);
    border-radius: 8px;
    cursor: pointer;
    background: var(--color-surface);
    font-family: inherit;
    font-size: 0.9rem;
    color: var(--color-text);
    transition: border-color 0.15s;
  }
  .options button.selected {
    border-color: var(--color-accent);
    background: var(--color-hover);
  }
  .hint {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  .api-input {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.875rem;
    background: var(--color-surface);
    color: var(--color-text);
    font-family: monospace;
    margin-bottom: 2rem;
    outline: none;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  .next-btn {
    padding: 0.6rem 1.5rem;
    background: var(--color-accent);
    color: var(--color-bg);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.9rem;
  }
  .skip-btn {
    padding: 0.6rem 1rem;
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.9rem;
    color: var(--color-text-muted);
  }
</style>
