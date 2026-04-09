<script>
  import { onMount, onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { Markdown } from 'tiptap-markdown';
  import { db } from '$lib/db.js';
  import { editorMode, setEditorMode } from '$lib/stores/editor.js';
  import { isWriting } from '$lib/stores/ui.js';
  import EditorToolbar from './EditorToolbar.svelte';
  import AIPanel from './AIPanel.svelte';

  export let note;

  let editorEl;
  let tiptap;
  let title = note.title;
  let markdownContent = note.content;
  let writingTimer;
  let saveTimer;
  let showAIPanel = false;
  let editorVersion = 0;

  const DEBOUNCE_MS = 800;

  onMount(() => {
    tiptap = new Editor({
      element: editorEl,
      extensions: [StarterKit, Markdown],
      content: $editorMode === 'rich' ? (note.content || '') : '',
      onUpdate: () => {
        scheduleSave(() => tiptap.getHTML());
        triggerWriting();
      },
      onTransaction: () => {
        editorVersion++;
      }
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
        title,
        content,
        editorMode: $editorMode,
        updatedAt: Date.now()
      });
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

    // Flush pending save before switching mode
    clearTimeout(saveTimer);
    const currentContent = $editorMode === 'rich' ? (tiptap?.getHTML() ?? '') : markdownContent;
    await db.notes.update(note.id, {
      title,
      content: currentContent,
      editorMode: $editorMode,
      updatedAt: Date.now()
    });

    if (newMode === 'markdown') {
      // Serialize rich content to proper Markdown (preserves bold, headings, lists, etc.)
      markdownContent = tiptap?.storage.markdown.getMarkdown() ?? '';
    } else {
      // Parse Markdown back to rich text
      tiptap?.commands.setContent(markdownContent || '');
    }

    setEditorMode(newMode);
    await db.notes.update(note.id, { editorMode: newMode, updatedAt: Date.now() });
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
      on:toggleMode={toggleMode}
      on:toggleAI={() => (showAIPanel = !showAIPanel)}
    />
    {#if showAIPanel}
      <AIPanel
        editor={tiptap}
        noteId={note.id}
        on:close={() => (showAIPanel = false)}
        on:setTags={async ({ detail }) => {
          await db.notes.update(note.id, { tags: detail.tags, updatedAt: Date.now() });
        }}
      />
    {/if}
  </div>

  <div class="editor-body">
    <input
      class="title-input"
      value={title}
      placeholder="Titolo"
      on:input={onTitleInput}
    />

    {#if $editorMode === 'rich'}
      <div class="tiptap-editor" bind:this={editorEl}></div>
    {:else}
      <div class="markdown-split">
        <textarea
          class="md-source"
          value={markdownContent}
          placeholder="Scrivi in Markdown..."
          on:input={onMarkdownInput}
        ></textarea>
        <div class="md-preview">
          <pre class="md-preview-text">{markdownContent || 'Anteprima vuota'}</pre>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .editor-wrapper { display: flex; flex-direction: column; height: 100%; }
  .toolbar-wrapper { position: relative; flex-shrink: 0; }
  .editor-body {
    flex: 1; overflow-y: auto; padding: 2rem;
    max-width: 720px; margin: 0 auto; width: 100%;
  }
  .title-input {
    width: 100%; border: none; outline: none;
    font-size: 1.75rem; font-weight: 700;
    font-family: inherit; margin-bottom: 1.5rem;
    background: transparent; color: inherit;
  }
  :global(.tiptap-editor .ProseMirror) {
    outline: none; min-height: 400px; line-height: 1.8; font-size: 1rem;
    color: var(--color-text);
  }
  :global(.tiptap-editor .ProseMirror p) {
    color: var(--color-text);
  }
  .markdown-split { display: flex; gap: 1rem; height: calc(100vh - 200px); }
  .md-source {
    flex: 1; border: 1px solid var(--color-border); padding: 1rem;
    font-family: monospace; font-size: 0.9rem;
    resize: none; outline: none; border-radius: 4px;
    line-height: 1.6; background: transparent; color: inherit;
  }
  .md-preview { flex: 1; padding: 1rem; overflow-y: auto; }
  .md-preview-text {
    font-family: monospace; font-size: 0.9rem;
    white-space: pre-wrap; line-height: 1.6; color: var(--color-text-muted);
  }
</style>
