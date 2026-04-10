<script>
  import { liveQuery } from 'dexie';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { db, trashNote } from '$lib/db.js';
  import { sidebarOpen, showSettings, theme, showPalette } from '$lib/stores/ui.js';
  import NoteCard from './NoteCard.svelte';
  import FolderItem from './FolderItem.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import { FilePlus, FolderPlus, X, ChevronLeft, ChevronRight, Settings, Trash2, Sun, Moon } from 'lucide-svelte';
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import SearchBar from './SearchBar.svelte';
  import TagBadge from './TagBadge.svelte';
  import { searchNotes, indexNote, removeNote } from '$lib/search.js';
  import TrashSection from './TrashSection.svelte';
  import { _ } from 'svelte-i18n';

  let selectedFolderId = null;
  let newFolderName = '';
  let showNewFolder = false;
  let searchQuery = '';
  let searchResults = [];
  let selectedTag = null;
  let showTrash = false;
  let confirmAction = null; // { type: 'deleteFolder', folder }

  // Reactive queries — re-execute when selectedFolderId changes
  $: notes = liveQuery(async () => {
    let results;
    if (selectedFolderId === null) {
      results = await db.notes.filter(n => !n.deletedAt).toArray();
    } else {
      results = await db.notes
        .where('folderId').equals(selectedFolderId)
        .filter(n => !n.deletedAt).toArray();
    }
    return results.sort((a, b) => b.updatedAt - a.updatedAt);
  });

  const folders = liveQuery(() => db.folders.orderBy('name').toArray());
  const allCount = liveQuery(() => db.notes.filter(n => !n.deletedAt).count());
  const allNotes = liveQuery(() => db.notes.filter(n => !n.deletedAt).toArray());

  // Tag section: folder-aware — show only tags from current folder's notes
  $: allTags = liveQuery(async () => {
    let notesForTags;
    if (selectedFolderId === null) {
      notesForTags = await db.notes.filter(n => !n.deletedAt).toArray();
    } else {
      notesForTags = await db.notes
        .where('folderId').equals(selectedFolderId)
        .filter(n => !n.deletedAt).toArray();
    }
    return [...new Set(notesForTags.flatMap(n => n.tags ?? []))].sort();
  });

  // Reset selected tag if it no longer exists in the current folder
  $: if (selectedTag && ($allTags ?? []).length > 0 && !($allTags ?? []).includes(selectedTag)) {
    selectedTag = null;
  }

  async function createNote() {
    const id = await db.notes.add({
      folderId: selectedFolderId,
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

  async function createFolder() {
    if (!newFolderName.trim()) return;
    await db.folders.add({ name: newFolderName.trim(), createdAt: Date.now() });
    newFolderName = '';
    showNewFolder = false;
  }

  function requestDeleteFolder(folder) {
    confirmAction = { type: 'deleteFolder', folder };
  }

  async function executeConfirm() {
    if (confirmAction?.type === 'deleteFolder') {
      const folder = confirmAction.folder;
      await db.notes.where('folderId').equals(folder.id).modify({ folderId: null });
      await db.folders.delete(folder.id);
      if (selectedFolderId === folder.id) selectedFolderId = null;
    }
    confirmAction = null;
  }

  async function renameFolder(folder, newName) {
    await db.folders.update(folder.id, { name: newName });
  }

  function getFolderCount(folderId, allNotesList) {
    return (allNotesList ?? []).filter(n => n.folderId === folderId).length;
  }

  function onSearch({ detail }) {
    searchQuery = detail.query;
    if (!searchQuery.trim()) {
      searchResults = [];
      return;
    }
    searchResults = searchNotes(searchQuery);
  }

  $: displayedNotes = searchQuery.trim()
    ? ($notes ?? []).filter(n => searchResults.some(r => r.id === n.id))
    : selectedTag
      ? ($notes ?? []).filter(n => (n.tags ?? []).includes(selectedTag))
      : ($notes ?? []);

  $: currentNoteId = $page.params.id ? Number($page.params.id) : null;

  // Drag-and-drop
  let dragOverFolderId = null;
  let dragOverAllNotes = false;

  function onNoteCardDragStart(e, noteId) {
    e.dataTransfer?.setData('text/plain', String(noteId));
  }

  async function dropOnFolder(e, folderId) {
    e.preventDefault();
    dragOverFolderId = null;
    const noteId = Number(e.dataTransfer?.getData('text/plain'));
    if (noteId) await db.notes.update(noteId, { folderId, updatedAt: Date.now() });
  }

  async function dropOnAllNotes(e) {
    e.preventDefault();
    dragOverAllNotes = false;
    const noteId = Number(e.dataTransfer?.getData('text/plain'));
    if (noteId) await db.notes.update(noteId, { folderId: null, updatedAt: Date.now() });
  }

  async function handleTrashNote(noteId) {
    await trashNote(noteId);
    removeNote(noteId);
    if (currentNoteId === noteId) goto('/');
  }

  function toggleThemeAndSave() {
    const newTheme = $theme === 'light' ? 'dark' : 'light';
    theme.set(newTheme);
    db.prefs.put({ key: 'theme', value: newTheme });
  }
</script>

<aside class="sidebar" class:closed={!$sidebarOpen}>
  <div class="sidebar-header">
    {#if $sidebarOpen}
      <button class="new-note-btn" on:click={createNote}>
        <FilePlus size={14} /> {$_('sidebar.newNote')}
      </button>
    {/if}
    <button class="toggle-btn" on:click={() => sidebarOpen.update(v => !v)} title="Sidebar (Ctrl+\\)">
      {#if $sidebarOpen}<ChevronLeft size={16} />{:else}<ChevronRight size={16} />{/if}
    </button>
  </div>

  {#if $sidebarOpen}
    <div
      class="search-palette-trigger"
      role="button"
      tabindex="0"
      on:click={() => showPalette.set(true)}
      on:keydown={e => e.key === 'Enter' && showPalette.set(true)}
    >
      <SearchBar placeholder={$_('sidebar.search')} />
    </div>
    <div class="sidebar-content">
      <!-- All notes row (also a drop target) -->
      <div
        class="all-notes-row"
        class:active={selectedFolderId === null && !showTrash}
        class:drag-over={dragOverAllNotes}
        on:click={() => { selectedFolderId = null; showTrash = false; }}
        on:dragover={(e) => { e.preventDefault(); dragOverAllNotes = true; }}
        on:dragleave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) dragOverAllNotes = false; }}
        on:drop={dropOnAllNotes}
        role="button"
        tabindex="0"
        on:keydown={e => { if (e.key === 'Enter') { selectedFolderId = null; showTrash = false; } }}
      >
        <span class="all-notes-icon">📋</span>
        <span>{$_('sidebar.allNotes')}</span>
        <span class="count">({$allCount ?? 0})</span>
      </div>

      <div class="section-divider"></div>

      {#each $folders ?? [] as folder (folder.id)}
        <div
          class="folder-row"
          class:drag-over={dragOverFolderId === folder.id}
          on:dragover={(e) => { e.preventDefault(); dragOverFolderId = folder.id; }}
          on:dragleave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) dragOverFolderId = null; }}
          on:drop={(e) => dropOnFolder(e, folder.id)}
        >
          <FolderItem
            {folder}
            active={selectedFolderId === folder.id && !showTrash}
            count={getFolderCount(folder.id, $allNotes)}
            on:click={() => { selectedFolderId = folder.id; showTrash = false; }}
            on:rename={({ detail }) => renameFolder(folder, detail.name)}
          />
          <button
            class="delete-folder-btn"
            on:click={() => requestDeleteFolder(folder)}
            title="Elimina cartella"
          ><X size={12} /></button>
        </div>
      {/each}

      {#if showNewFolder}
        <div class="new-folder-input">
          <input
            bind:value={newFolderName}
            placeholder={$_('sidebar.folderNamePlaceholder')}
            on:keydown={e => {
              if (e.key === 'Enter') createFolder();
              if (e.key === 'Escape') showNewFolder = false;
            }}
          />
          <button on:click={createFolder}>OK</button>
        </div>
      {:else}
        <button class="add-folder-btn" on:click={() => showNewFolder = true}>
          <FolderPlus size={13} /> {$_('sidebar.newFolder')}
        </button>
      {/if}

      <div class="section-divider"></div>

      {#if ($allTags ?? []).length > 0}
        <div class="tag-section">
          {#each $allTags ?? [] as tag}
            <TagBadge
              {tag}
              active={selectedTag === tag}
              on:click={() => selectedTag = selectedTag === tag ? null : tag}
            />
          {/each}
        </div>
        <div class="section-divider"></div>
      {/if}

      {#if showTrash}
        <TrashSection on:restored={() => showTrash = false} />
      {:else}
        {#each displayedNotes as note (note.id)}
          <div
            in:fly={{ y: 12, duration: 220, easing: quintOut }}
            out:fade={{ duration: 120 }}
            animate:flip={{ duration: 300 }}
          >
            <NoteCard
              {note}
              active={currentNoteId === note.id}
              on:click={() => goto(`/note/${note.id}`)}
              on:dragstart={(e) => onNoteCardDragStart(e, note.id)}
              on:trash={() => handleTrashNote(note.id)}
            />
          </div>
        {/each}
      {/if}
    </div>

    <!-- Bottom bar: theme toggle + trash + settings -->
    <div class="sidebar-footer">
      <button
        class="footer-btn"
        on:click={toggleThemeAndSave}
        title={$theme === 'light' ? 'Tema scuro' : 'Tema chiaro'}
      >
        {#if $theme === 'light'}
          <Moon size={15} />
        {:else}
          <Sun size={15} />
        {/if}
      </button>
      <button
        class="footer-btn"
        class:active={showTrash}
        on:click={() => showTrash = !showTrash}
        title="Cestino"
      >
        <Trash2 size={15} />
      </button>
      <button class="footer-btn" on:click={() => showSettings.set(true)} title="Impostazioni">
        <Settings size={15} />
      </button>
    </div>
  {/if}
</aside>

{#if confirmAction}
  <ConfirmDialog
    title="Elimina cartella"
    message={`Eliminare "${confirmAction.folder.name}"? Le note rimarranno senza cartella.`}
    confirmLabel="Elimina"
    cancelLabel="Annulla"
    destructive={true}
    on:confirm={executeConfirm}
    on:cancel={() => confirmAction = null}
  />
{/if}

<style>
  .sidebar {
    width: 260px;
    min-width: 260px;
    height: 100vh;
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                background-color 0.3s ease, border-color 0.25s ease;
    overflow: hidden;
    background: var(--color-bg);
    flex-shrink: 0;
  }
  .sidebar.closed { width: 40px; min-width: 40px; }
  .sidebar-header {
    display: flex; align-items: center; justify-content: flex-end;
    padding: 0.5rem 0.5rem; border-bottom: 1px solid var(--color-border); flex-shrink: 0;
    gap: 0.25rem;
  }
  .new-note-btn {
    display: inline-flex; align-items: center; gap: 0.35rem;
    font-size: 0.8rem; padding: 0.32rem 0.7rem; cursor: pointer;
    background: var(--color-accent); color: var(--color-bg); border: none; border-radius: 5px;
    font-family: 'DM Sans', system-ui, sans-serif; letter-spacing: 0.02em;
    font-weight: 500;
    flex: 1; transition: opacity 0.15s ease, transform 0.1s ease;
  }
  .new-note-btn:hover { opacity: 0.85; transform: translateY(-0.5px); }
  .new-note-btn:active { transform: translateY(0); opacity: 1; }
  .toggle-btn {
    display: inline-flex; align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer; color: var(--color-text-muted);
    padding: 0.25rem; flex-shrink: 0;
    transition: color 0.15s ease;
  }
  .toggle-btn:hover { color: var(--color-text); }
  .sidebar-content { overflow-y: auto; flex: 1; }
  .search-palette-trigger { cursor: pointer; }
  .search-palette-trigger :global(input) { pointer-events: none; cursor: pointer; }
  .section-divider { height: 1px; background: var(--color-border); margin: 0.25rem 0; }
  .all-notes-row {
    display: flex; align-items: center; gap: 0.4rem;
    padding: 0.5rem 1rem; cursor: pointer; font-size: 0.85rem;
    color: var(--color-text);
    transition: background-color 0.12s ease;
  }
  .all-notes-row .count { margin-left: auto; }
  .all-notes-row:hover, .all-notes-row.active { background: var(--color-hover); }
  .all-notes-row.drag-over { background: var(--color-surface); outline: 2px dashed var(--color-border); }
  .all-notes-icon { font-size: 0.85rem; line-height: 1; }
  .count {
    font-size: 0.7rem; color: var(--color-text-muted);
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  .folder-row { display: flex; align-items: center; }
  .folder-row :global(.folder-item) { flex: 1; }
  .folder-row.drag-over :global(.folder-item) { background: var(--color-surface); outline: 2px dashed var(--color-border); }
  .delete-folder-btn {
    display: inline-flex; align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer; color: var(--color-text-faint);
    padding: 0 0.5rem; transition: color 0.15s ease;
    flex-shrink: 0;
  }
  .delete-folder-btn:hover { color: var(--color-accent-warm); }
  .new-folder-input { display: flex; gap: 0.25rem; padding: 0.25rem 0.75rem; }
  .new-folder-input input {
    flex: 1; font-size: 0.8rem; padding: 0.25rem; border: 1px solid var(--color-border); border-radius: 3px;
    background: var(--color-bg); color: var(--color-text); font-family: inherit;
    transition: border-color 0.15s ease;
  }
  .new-folder-input input:focus { outline: none; border-color: var(--color-text-muted); }
  .new-folder-input button {
    font-size: 0.8rem; padding: 0.25rem 0.5rem; cursor: pointer; font-family: inherit;
    background: var(--color-accent); color: var(--color-bg); border: none; border-radius: 3px;
  }
  .add-folder-btn {
    display: inline-flex; align-items: center; gap: 0.35rem;
    background: none; border: none; cursor: pointer; color: var(--color-text-faint);
    padding: 0.4rem 1rem; font-size: 0.78rem; text-align: left; width: 100%;
    font-family: 'DM Sans', system-ui, sans-serif; letter-spacing: 0.02em;
    transition: color 0.15s ease, background-color 0.15s ease;
  }
  .add-folder-btn:hover { color: var(--color-text-muted); background: var(--color-hover); }
  .tag-section {
    display: flex; flex-wrap: wrap; gap: 0.3rem; padding: 0.5rem 0.75rem;
  }
  .sidebar-footer {
    display: flex; align-items: center; justify-content: flex-end;
    padding: 0.5rem 0.75rem; border-top: 1px solid var(--color-border);
    gap: 0.25rem; flex-shrink: 0;
  }
  .footer-btn {
    display: inline-flex; align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer; color: var(--color-text-faint);
    padding: 0.3rem; border-radius: 4px;
    transition: color 0.15s ease, background-color 0.15s ease;
  }
  .footer-btn:hover { color: var(--color-text-muted); background: var(--color-hover); }
  .footer-btn.active { color: var(--color-text); background: var(--color-hover); }

  /* Mobile: sidebar overlays content */
  @media (max-width: 768px) {
    .sidebar {
      position: fixed;
      top: 0; left: 0; bottom: 0;
      z-index: 50;
      box-shadow: var(--shadow-lg);
      height: 100dvh;
    }
    .sidebar.closed {
      transform: translateX(-100%);
      width: 260px;
      min-width: 260px;
      box-shadow: none;
    }
  }
</style>
