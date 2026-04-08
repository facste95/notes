<script>
  import { liveQuery } from 'dexie';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { db } from '$lib/db.js';
  import { sidebarOpen } from '$lib/stores/ui.js';
  import NoteCard from './NoteCard.svelte';
  import FolderItem from './FolderItem.svelte';

  let selectedFolderId = null;
  let newFolderName = '';
  let showNewFolder = false;

  const notes = liveQuery(() =>
    selectedFolderId === null
      ? db.notes.orderBy('updatedAt').reverse().toArray()
      : db.notes.where('folderId').equals(selectedFolderId).reverse().sortBy('updatedAt')
  );

  const folders = liveQuery(() => db.folders.orderBy('name').toArray());
  const allCount = liveQuery(() => db.notes.count());

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

  function getFolderCount(folderId, notesList) {
    return (notesList ?? []).filter(n => n.folderId === folderId).length;
  }

  $: currentNoteId = $page.params.id ? Number($page.params.id) : null;
</script>

<aside class="sidebar" class:closed={!$sidebarOpen}>
  <div class="sidebar-header">
    <button class="new-note-btn" on:click={createNote}>+ Nota</button>
    <button class="toggle-btn" on:click={() => sidebarOpen.update(v => !v)}>
      {$sidebarOpen ? '◀' : '▶'}
    </button>
  </div>

  {#if $sidebarOpen}
    <div class="sidebar-content">
      <div
        class="all-notes-row"
        class:active={selectedFolderId === null}
        on:click={() => selectedFolderId = null}
        role="button"
        tabindex="0"
        on:keydown={e => e.key === 'Enter' && (selectedFolderId = null)}
      >
        <span>📁 Tutte le note</span>
        <span class="count">({$allCount ?? 0})</span>
      </div>

      <div class="section-divider"></div>

      {#each $folders ?? [] as folder (folder.id)}
        <div class="folder-row">
          <FolderItem
            {folder}
            active={selectedFolderId === folder.id}
            count={getFolderCount(folder.id, $notes)}
            on:click={() => selectedFolderId = folder.id}
          />
          <button class="delete-folder-btn" on:click={() => deleteFolder(folder)}>✕</button>
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

      {#each $notes ?? [] as note (note.id)}
        <NoteCard
          {note}
          active={currentNoteId === note.id}
          on:click={() => goto(`/note/${note.id}`)}
        />
      {/each}
    </div>
  {/if}
</aside>

<style>
  .sidebar {
    width: 260px;
    min-width: 260px;
    height: 100vh;
    border-right: 1px solid #e5e5e0;
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease, min-width 0.3s ease;
    overflow: hidden;
    background: #faf9f7;
    flex-shrink: 0;
  }
  .sidebar.closed { width: 40px; min-width: 40px; }
  .sidebar-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.75rem; border-bottom: 1px solid #e5e5e0; flex-shrink: 0;
  }
  .new-note-btn {
    font-size: 0.8rem; padding: 0.3rem 0.6rem; cursor: pointer;
    background: #333; color: white; border: none; border-radius: 4px;
  }
  .toggle-btn { background: none; border: none; cursor: pointer; font-size: 0.8rem; }
  .sidebar-content { overflow-y: auto; flex: 1; }
  .section-divider { height: 1px; background: #e5e5e0; margin: 0.25rem 0; }
  .all-notes-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.5rem 1rem; cursor: pointer; font-size: 0.875rem;
  }
  .all-notes-row:hover, .all-notes-row.active { background: #f5f5f0; }
  .count { font-size: 0.75rem; color: #999; }
  .folder-row { display: flex; align-items: center; }
  .folder-row :global(.folder-item) { flex: 1; }
  .delete-folder-btn {
    background: none; border: none; cursor: pointer; color: #ccc;
    padding: 0 0.5rem; font-size: 0.7rem;
  }
  .delete-folder-btn:hover { color: #e44; }
  .new-folder-input { display: flex; gap: 0.25rem; padding: 0.25rem 0.75rem; }
  .new-folder-input input {
    flex: 1; font-size: 0.8rem; padding: 0.25rem; border: 1px solid #ddd; border-radius: 3px;
  }
  .new-folder-input button { font-size: 0.8rem; padding: 0.25rem 0.5rem; cursor: pointer; }
  .add-folder-btn {
    background: none; border: none; cursor: pointer; color: #999;
    padding: 0.4rem 1rem; font-size: 0.8rem; text-align: left; width: 100%;
  }
  .add-folder-btn:hover { color: #333; }
</style>
