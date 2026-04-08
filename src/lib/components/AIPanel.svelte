<script>
  import { createEventDispatcher } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { _ } from 'svelte-i18n';
  import { callAI, AI_ACTIONS, getApiKey } from '$lib/ai.js';
  import { Sparkles, X, Loader } from 'lucide-svelte';

  export let editor = null;
  export let noteId = null;

  const dispatch = createEventDispatcher();

  let loading = false;
  let error = '';
  let showTranslatePicker = false;

  const TRANSLATE_LANGS = ['Inglese', 'Italiano', 'Spagnolo', 'Francese', 'Tedesco', 'Portoghese'];

  function getContent() {
    if (!editor) return '';
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    return hasSelection
      ? editor.state.doc.textBetween(from, to, ' ')
      : editor.getText();
  }

  async function run(action, targetLang = null) {
    if (!getApiKey()) {
      error = $_('ai.noApiKey');
      return;
    }
    const content = getContent();
    if (!content.trim()) return;

    loading = true;
    error = '';
    showTranslatePicker = false;

    const { system } = targetLang
      ? AI_ACTIONS.translate(targetLang)
      : AI_ACTIONS[action];

    try {
      const result = await callAI(content, system);

      if (action === 'generateTags') {
        const tags = result
          .split(',')
          .map(t => t.trim().replace(/^#/, ''))
          .filter(Boolean);
        dispatch('setTags', { tags });
      } else {
        if (editor) editor.commands.setContent(result);
        dispatch('aiResult', { result });
      }
    } catch (e) {
      error = e.message === 'no-api-key' ? $_('ai.noApiKey') : $_('ai.error');
    } finally {
      loading = false;
    }
  }
</script>

<div class="ai-panel" transition:fly={{ y: -10, duration: 200 }} role="dialog">
  <div class="ai-header">
    <Sparkles size={14} />
    <span>AI</span>
    <button class="close-btn" on:click={() => dispatch('close')}>
      <X size={14} />
    </button>
  </div>

  {#if error}
    <div class="error" transition:fade={{ duration: 150 }}>{error}</div>
  {/if}

  {#if loading}
    <div class="loading">
      <Loader size={16} />
      <span>{$_('ai.loading')}</span>
    </div>
  {:else}
    <div class="ai-actions">
      <button on:click={() => run('summarize')}>{$_('ai.summarize')}</button>
      <button on:click={() => run('improve')}>{$_('ai.improve')}</button>
      <button on:click={() => run('continue')}>{$_('ai.continue')}</button>
      <button on:click={() => run('generateTags')}>{$_('ai.generateTags')}</button>
      <button on:click={() => (showTranslatePicker = !showTranslatePicker)}>
        {$_('ai.translate')} ▾
      </button>
    </div>

    {#if showTranslatePicker}
      <div class="translate-picker" transition:fade={{ duration: 150 }}>
        {#each TRANSLATE_LANGS as lang}
          <button on:click={() => run('translate', lang)}>{lang}</button>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .ai-panel {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    padding: 0.75rem 1rem;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  .ai-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 0.6rem;
    color: var(--color-text-muted);
  }
  .close-btn {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
  }
  .ai-actions, .translate-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .ai-actions button, .translate-picker button {
    font-size: 0.78rem;
    padding: 0.3rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    cursor: pointer;
    background: var(--color-surface);
    color: var(--color-text);
    font-family: inherit;
    white-space: nowrap;
    transition: background 0.15s;
  }
  .ai-actions button:hover, .translate-picker button:hover {
    background: var(--color-hover);
  }
  .translate-picker {
    margin-top: 0.4rem;
    padding-top: 0.4rem;
    border-top: 1px solid var(--color-border);
  }
  .loading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
  .error {
    font-size: 0.78rem;
    color: #c44;
    margin-bottom: 0.5rem;
  }
</style>
