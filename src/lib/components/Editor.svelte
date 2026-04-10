<script>
  import { onMount, onDestroy } from 'svelte';
  import { marked } from 'marked';
  import { liveQuery } from 'dexie';
  marked.use({ gfm: true, breaks: true });
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { Markdown } from 'tiptap-markdown';
  import { db } from '$lib/db.js';
  import { editorMode, setEditorMode } from '$lib/stores/editor.js';
  import { isWriting } from '$lib/stores/ui.js';
  import { noteToMarkdown, noteToText, downloadFile } from '$lib/export.js';
  import { indexNote } from '$lib/search.js';
  import EditorToolbar from './EditorToolbar.svelte';
  import AIPanel from './AIPanel.svelte';

  export let note;

  let editorEl;
  let tiptap;
  let mdTextareaEl;
  let title = note.title;
  let markdownContent = note.content;
  let writingTimer;
  let saveTimer;
  let showAIPanel = false;
  let editorVersion = 0;
  let mdView = 'editor'; // 'editor' | 'preview' — mobile toggle

  // Tag state
  let tags = [...(note.tags ?? [])];
  let tagInput = '';
  let showTagInput = false;
  let tagInputEl;

  const DEBOUNCE_MS = 800;

  // All unique tags across all notes (for autocomplete)
  const allTagsQuery = liveQuery(async () => {
    const all = await db.notes.filter(n => !n.deletedAt).toArray();
    const set = new Set(all.flatMap(n => n.tags ?? []));
    return [...set].sort();
  });

  $: renderedHtml = marked.parse(markdownContent || '');

  $: filteredSuggestions = tagInput.trim()
    ? ($allTagsQuery ?? []).filter(t =>
        t.toLowerCase().startsWith(tagInput.toLowerCase()) && !tags.includes(t)
      ).slice(0, 6)
    : ($allTagsQuery ?? []).filter(t => !tags.includes(t)).slice(0, 6);

  onMount(() => {
    tiptap = new Editor({
      element: editorEl,
      extensions: [StarterKit, Markdown],
      content: note.content || '',
      onUpdate: () => {
        scheduleSave(() => tiptap.getHTML());
        triggerWriting();
      },
      onTransaction: () => { editorVersion++; }
    });
  });

  onDestroy(() => {
    tiptap?.destroy();
    clearTimeout(saveTimer);
    clearTimeout(writingTimer);
  });

  function triggerWriting() {
    isWriting.set(true);
    clearTimeout(writingTimer);
    writingTimer = setTimeout(() => isWriting.set(false), 2000);
  }

  function scheduleSave(getContent) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const content = getContent();
      await db.notes.update(note.id, {
        title, content, editorMode: $editorMode, updatedAt: Date.now()
      });
      indexNote({ id: note.id, title, content, tags });
    }, DEBOUNCE_MS);
  }

  function onTitleInput(e) {
    title = e.target.value;
    scheduleSave(() => $editorMode === 'rich' ? (tiptap?.getHTML() ?? '') : markdownContent);
    triggerWriting();
  }

  function onMarkdownInput(e) {
    markdownContent = e.target.value;
    scheduleSave(() => markdownContent);
    triggerWriting();
  }

  async function toggleMode() {
    const newMode = $editorMode === 'rich' ? 'markdown' : 'rich';
    clearTimeout(saveTimer);

    if (newMode === 'markdown') {
      markdownContent = tiptap?.storage.markdown.getMarkdown() ?? '';
    } else {
      tiptap?.commands.setContent(markdownContent || '');
    }

    setEditorMode(newMode);
    const contentToSave = newMode === 'rich' ? (tiptap?.getHTML() ?? '') : markdownContent;
    await db.notes.update(note.id, {
      title, content: contentToSave, editorMode: newMode, updatedAt: Date.now()
    });
    indexNote({ id: note.id, title, content: contentToSave, tags });
  }

  // Tag management
  async function addTag(tag) {
    const clean = tag.trim().toLowerCase();
    if (!clean || tags.includes(clean)) { tagInput = ''; return; }
    tags = [...tags, clean];
    await db.notes.update(note.id, { tags, updatedAt: Date.now() });
    const content = $editorMode === 'rich' ? (tiptap?.getHTML() ?? '') : markdownContent;
    indexNote({ id: note.id, title, content, tags });
    tagInput = '';
    showTagInput = false;
  }

  async function removeTag(tag) {
    tags = tags.filter(t => t !== tag);
    await db.notes.update(note.id, { tags, updatedAt: Date.now() });
    const content = $editorMode === 'rich' ? (tiptap?.getHTML() ?? '') : markdownContent;
    indexNote({ id: note.id, title, content, tags });
  }

  function openTagInput() {
    showTagInput = true;
    setTimeout(() => tagInputEl?.focus(), 0);
  }

  function closeTagInput() {
    setTimeout(() => { showTagInput = false; tagInput = ''; }, 150);
  }

  // Download handler (dispatched from toolbar)
  function handleDownload({ detail }) {
    const name = (note.title || 'nota').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    if (detail.format === 'md') {
      downloadFile(noteToMarkdown(note), `${name}.md`, 'text/markdown');
    } else if (detail.format === 'txt') {
      downloadFile(noteToText(note), `${name}.txt`, 'text/plain');
    }
  }
</script>

<svelte:window on:keydown={e => { if (e.key === 'Escape' && showAIPanel) showAIPanel = false; }} />

<div class="editor-wrapper">
  <div class="toolbar-wrapper">
    <EditorToolbar
      editor={tiptap}
      mode={$editorMode}
      {showAIPanel}
      {editorVersion}
      mdTextarea={mdTextareaEl}
      on:toggleMode={toggleMode}
      on:toggleAI={() => (showAIPanel = !showAIPanel)}
      on:downloadNote={handleDownload}
    />
    {#if showAIPanel}
      <AIPanel
        editor={tiptap}
        noteId={note.id}
        on:close={() => (showAIPanel = false)}
        on:setTags={async ({ detail }) => {
          tags = detail.tags;
          await db.notes.update(note.id, { tags: detail.tags, updatedAt: Date.now() });
        }}
      />
    {/if}
  </div>

  <div class="editor-body" class:md-mode={$editorMode === 'markdown'}>
    <!-- Tag row -->
    <div class="tag-row">
      {#each tags as tag}
        <span class="tag-badge">
          {tag}
          <button class="tag-remove" on:click={() => removeTag(tag)} title="Rimuovi tag">×</button>
        </span>
      {/each}
      {#if showTagInput}
        <div class="tag-input-wrapper">
          <input
            bind:this={tagInputEl}
            bind:value={tagInput}
            class="tag-input"
            placeholder="Tag..."
            on:keydown={e => {
              if (e.key === 'Enter') addTag(tagInput);
              if (e.key === 'Escape') { showTagInput = false; tagInput = ''; }
            }}
            on:blur={closeTagInput}
          />
          {#if filteredSuggestions.length > 0}
            <div class="tag-suggestions">
              {#each filteredSuggestions as suggestion}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div
                  class="tag-suggestion-item"
                  role="option"
                  aria-selected="false"
                  on:mousedown={() => addTag(suggestion)}
                >
                  {suggestion}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <button class="tag-add-btn" on:click={openTagInput}>+ tag</button>
      {/if}
    </div>

    <input
      class="title-input"
      value={title}
      placeholder="Titolo"
      on:input={onTitleInput}
    />

    <!-- TipTap always mounted, hidden when in markdown mode -->
    <div class="tiptap-editor" bind:this={editorEl} class:hidden={$editorMode !== 'rich'}></div>

    {#if $editorMode === 'markdown'}
      <!-- Mobile: toggle between editor and preview -->
      <div class="md-view-toggle">
        <button class:active={mdView === 'editor'} on:click={() => mdView = 'editor'}>Scrivi</button>
        <button class:active={mdView === 'preview'} on:click={() => mdView = 'preview'}>Anteprima</button>
      </div>
      <div class="markdown-split">
        <textarea
          bind:this={mdTextareaEl}
          class="md-source"
          class:mobile-hidden={mdView === 'preview'}
          value={markdownContent}
          placeholder="Scrivi in Markdown..."
          on:input={onMarkdownInput}
        ></textarea>
        <div class="md-preview" class:mobile-hidden={mdView === 'editor'}>
          {@html renderedHtml}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .editor-wrapper { display: flex; flex-direction: column; height: 100%; }
  .toolbar-wrapper { position: relative; flex-shrink: 0; }
  .editor-body {
    flex: 1; overflow-y: auto; padding: 1.5rem 2rem 2rem;
    max-width: 720px; margin: 0 auto; width: 100%;
  }
  .editor-body.md-mode {
    max-width: 1200px;
    display: flex;
    flex-direction: column;
  }

  /* Tag row */
  .tag-row {
    display: flex; flex-wrap: wrap; align-items: center;
    gap: 0.3rem; margin-bottom: 0.75rem; min-height: 1.6rem;
  }
  .tag-badge {
    display: inline-flex; align-items: center; gap: 0.25rem;
    background: var(--color-surface); border: 1px solid var(--color-border);
    border-radius: 12px; padding: 0.15rem 0.6rem;
    font-size: 0.7rem; color: var(--color-text-muted);
    font-family: 'DM Sans', system-ui, sans-serif; letter-spacing: 0.02em;
    transition: background-color 0.15s ease;
  }
  .tag-remove {
    background: none; border: none; cursor: pointer;
    color: var(--color-text-faint); padding: 0; font-size: 0.85rem;
    line-height: 1; display: inline-flex; align-items: center;
    transition: color 0.15s ease;
  }
  .tag-remove:hover { color: var(--color-accent-warm); }
  .tag-add-btn {
    background: none; border: 1px dashed var(--color-border); border-radius: 12px;
    padding: 0.15rem 0.6rem; font-size: 0.7rem; cursor: pointer;
    color: var(--color-text-faint); font-family: 'DM Sans', system-ui, sans-serif;
    transition: color 0.15s ease, border-color 0.15s ease;
  }
  .tag-add-btn:hover { color: var(--color-text-muted); border-color: var(--color-text-muted); }
  .tag-input-wrapper { position: relative; }
  .tag-input {
    border: 1px solid var(--color-border); border-radius: 12px;
    padding: 0.15rem 0.6rem; font-size: 0.75rem; font-family: inherit;
    background: var(--color-bg); color: var(--color-text); outline: none;
    width: 120px;
  }
  .tag-suggestions {
    position: absolute; top: calc(100% + 4px); left: 0; z-index: 10;
    background: var(--color-bg); border: 1px solid var(--color-border);
    border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    min-width: 140px; overflow: hidden;
  }
  .tag-suggestion-item {
    padding: 0.35rem 0.75rem; font-size: 0.8rem; cursor: pointer;
    color: var(--color-text);
  }
  .tag-suggestion-item:hover { background: var(--color-hover); }

  .title-input {
    width: 100%; border: none; outline: none;
    font-size: 1.75rem; font-weight: 700;
    font-family: inherit; margin-bottom: 1.25rem;
    background: transparent; color: var(--color-text);
    letter-spacing: -0.02em; line-height: 1.2;
    transition: color 0.25s ease;
  }
  .title-input::placeholder { color: var(--color-text-faint); }
  :global(.tiptap-editor .ProseMirror) {
    outline: none; min-height: 400px; line-height: 1.85; font-size: 1rem;
    color: var(--color-text); caret-color: var(--color-accent-warm);
  }
  :global(.tiptap-editor .ProseMirror p) { color: var(--color-text); }
  :global(.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder); color: var(--color-text-faint); pointer-events: none; float: left; height: 0;
  }

  /* MD view toggle — hidden on desktop, visible on mobile */
  .md-view-toggle {
    display: none;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
    flex-shrink: 0;
  }
  .md-view-toggle button {
    flex: 1; padding: 0.4rem; font-size: 0.78rem; cursor: pointer;
    background: var(--color-surface); border: 1px solid var(--color-border);
    border-radius: 6px; color: var(--color-text-muted);
    font-family: 'DM Sans', system-ui, sans-serif;
    transition: background-color 0.12s ease, color 0.12s ease;
  }
  .md-view-toggle button.active {
    background: var(--color-hover); color: var(--color-text);
    border-color: var(--color-text-faint);
  }

  .tiptap-editor.hidden { display: none; }

  .markdown-split { display: flex; gap: 1rem; flex: 1; min-height: 300px; }
  .md-source {
    flex: 1; border: 1px solid var(--color-border); padding: 1rem;
    font-family: monospace; font-size: 0.9rem;
    resize: none; outline: none; border-radius: 6px;
    line-height: 1.7;
    background: var(--color-surface);
    color: var(--color-text);
    transition: border-color 0.15s ease;
  }
  .md-source:focus { border-color: var(--color-text-faint); }
  .md-source::placeholder { color: var(--color-text-faint); }
  .md-preview {
    flex: 1; padding: 1rem; overflow-y: auto;
    color: var(--color-text);
    font-family: inherit; font-size: 0.9rem; line-height: 1.7;
    border-left: 1px solid var(--color-border);
  }
  :global(.md-preview h1) { font-size: 1.5rem; font-weight: 700; margin: 0.75rem 0 0.5rem; color: var(--color-text); }
  :global(.md-preview h2) { font-size: 1.25rem; font-weight: 600; margin: 0.6rem 0 0.4rem; color: var(--color-text); }
  :global(.md-preview h3) { font-size: 1.05rem; font-weight: 600; margin: 0.5rem 0 0.3rem; color: var(--color-text); }
  :global(.md-preview p) { margin: 0.4rem 0; color: var(--color-text); }
  :global(.md-preview strong) { font-weight: 700; color: var(--color-text); }
  :global(.md-preview em) { font-style: italic; color: var(--color-text); }
  :global(.md-preview ul), :global(.md-preview ol) { padding-left: 1.5rem; margin: 0.3rem 0; }
  :global(.md-preview li) { color: var(--color-text); margin: 0.15rem 0; }
  :global(.md-preview code) {
    font-family: monospace; font-size: 0.85em;
    background: var(--color-surface); padding: 0.1em 0.3em;
    border-radius: 3px; color: var(--color-text);
  }
  :global(.md-preview pre) {
    background: var(--color-surface); padding: 0.75rem;
    border-radius: 4px; overflow-x: auto; margin: 0.5rem 0;
  }
  :global(.md-preview pre code) { background: none; padding: 0; }
  :global(.md-preview blockquote) {
    border-left: 3px solid var(--color-border);
    padding-left: 1rem; color: var(--color-text-muted); margin: 0.5rem 0;
    font-style: italic;
  }
  :global(.md-preview a) { color: var(--color-accent); text-decoration: underline; }
  :global(.md-preview span[style]) { display: inline; }

  @media (max-width: 640px) {
    .editor-body { padding: 1rem 1rem 1.5rem; }
    .md-view-toggle { display: flex; }
    .markdown-split { flex-direction: column; min-height: calc(100vh - 280px); }
    .md-source.mobile-hidden, .md-preview.mobile-hidden { display: none; }
    .md-source { height: calc(100vh - 280px); }
    .md-preview { border-left: none; border-top: 1px solid var(--color-border); height: calc(100vh - 280px); }
  }
</style>
