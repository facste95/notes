<script>
  import { liveQuery } from 'dexie';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { db, trashNote } from '$lib/db.js';
  import { sidebarOpen, showSettings, theme } from '$lib/stores/ui.js';
  import NoteCard from './NoteCard.svelte';
  import FolderItem from './FolderItem.svelte';
  import { Folder, X, Plus, ChevronLeft, ChevronRight, Settings, Trash2, Sun, Moon } from 'lucide-svelte';
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import SearchBar from './SearchBar.svelte';
  import TagBadge from './TagBadge.svelte';
  import { searchNotes } from '$lib/search.js';
  import TrashSection from './TrashSection.svelte';

  let selectedFolderId = null;
  let newFolderName = '';
  let showNewFolder = false;
  let searchQuery = '';
  let searchResults = [];
  let selectedTag = null;
  let showTrash = false;

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
  const allTags = liveQuery(async () => {
    const all = await db.notes.filter(n => !n.deletedAt).toArray();
    const tags = new Set(all.flatMap(n => n.tags ?? []));
    return [...tags].sort();
  });

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
    goto(`/note/${id}`);
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;
    await db.folders.add({ name: newFolderName.trim(), createdAt: Date.now() });
    newFolderName = '';
    showNewFolder = false;
  }

  async function deleteFolder(folder) {
    if (!confirm(`Eliminare la cartella "${folder.name}"? Le note rimarranno senza cartella.`)) return;
    await db.notes.where('folderId').equals(folder.id).modify({ folderId: null });
    await db.folders.delete(folder.id);
    if (selectedFolderId === folder.id) selectedFolderId = null;
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
        <span class="icon"><Plus size={14} /></span> Nota
      </button>
    {/if}
    <button class="toggle-btn" on:click={() => sidebarOpen.update(v => !v)} title="Sidebar (Ctrl+\\)">
      {#if $sidebarOpen}<ChevronLeft size={16} />{:else}<ChevronRight size={16} />{/if}
    </button>
  </div>

  {#if $sidebarOpen}
    <SearchBar on:search={onSearch} placeholder="Cerca..." />
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
        <span class="icon"><Folder size={14} /></span>
        <span>Tutte le note</span>
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
          />
          <button class="delete-folder-btn" on:click={() => deleteFolder(folder)}><X size={12} /></button>
        </div>
      {/each}

      {#if showNewFolder}
        <div class="new-folder-input">
          <input
            bind:value={newFolderName}
            placeholder="Nome cartella"
            on:keydown={e => {
              if (e.key === 'Enter') createFolder();
              if (e.key === 'Escape') showNewFolder = false;
            }}
          />
          <button on:click={createFolder}>OK</button>
        </div>
      {:else}
        <button class="add-folder-btn" on:click={() => showNewFolder = true}>+ Cartella</button>
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
            in:fly={{ y: 15, duration: 250, easing: quintOut }}
            out:fade={{ duration: 150 }}
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

<style>
  .sidebar {
    width: 260px;
    min-width: 260px;
    height: 100vh;
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease, min-width 0.3s ease;
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
    display: inline-flex; align-items: center; gap: 0.3rem;
    font-size: 0.8rem; padding: 0.3rem 0.6rem; cursor: pointer;
    background: var(--color-accent); color: var(--color-bg); border: none; border-radius: 4px;
    font-family: inherit; flex: 1;
  }
  .toggle-btn {
    display: inline-flex; align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer; color: var(--color-text-muted);
    padding: 0.25rem; flex-shrink: 0;
  }
  .toggle-btn:hover { color: var(--color-text); }
  .sidebar-content { overflow-y: auto; flex: 1; }
  .section-divider { height: 1px; background: var(--color-border); margin: 0.25rem 0; }
  .all-notes-row {
    display: flex; align-items: center; gap: 0.4rem;
    padding: 0.5rem 1rem; cursor: pointer; font-size: 0.875rem;
  }
  .all-notes-row .count { margin-left: auto; }
  .all-notes-row:hover, .all-notes-row.active { background: var(--color-hover); }
  .all-notes-row.drag-over { background: var(--color-surface); outline: 2px dashed var(--color-border); }
  .count { font-size: 0.75rem; color: var(--color-text-muted); }
  .folder-row { display: flex; align-items: center; }
  .folder-row :global(.folder-item) { flex: 1; }
  .folder-row.drag-over :global(.folder-item) { background: var(--color-surface); outline: 2px dashed var(--color-border); }
  .delete-folder-btn {
    display: inline-flex; align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer; color: var(--color-text-faint);
    padding: 0 0.5rem;
  }
  .delete-folder-btn:hover { color: var(--color-text); }
  .new-folder-input { display: flex; gap: 0.25rem; padding: 0.25rem 0.75rem; }
  .new-folder-input input {
    flex: 1; font-size: 0.8rem; padding: 0.25rem; border: 1px solid var(--color-border); border-radius: 3px;
    background: var(--color-bg); color: var(--color-text); font-family: inherit;
  }
  .new-folder-input button {
    font-size: 0.8rem; padding: 0.25rem 0.5rem; cursor: pointer; font-family: inherit;
  }
  .add-folder-btn {
    background: none; border: none; cursor: pointer; color: var(--color-text-muted);
    padding: 0.4rem 1rem; font-size: 0.8rem; text-align: left; width: 100%;
    font-family: inherit;
  }
  .add-folder-btn:hover { color: var(--color-text); }
  .icon { display: inline-flex; align-items: center; }
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
  }
  .footer-btn:hover, .footer-btn.active { color: var(--color-text); background: var(--color-hover); }
</style>
