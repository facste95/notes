import Dexie from 'dexie';

export const db = new Dexie('FoliaDB');

db.version(1).stores({
  folders: '++id, name, createdAt',
  notes: '++id, folderId, title, content, editorMode, *tags, createdAt, updatedAt',
  prefs: 'key'
});

// Trash helpers — deletedAt is a timestamp (non-null) for trashed records,
// null/undefined for active records. No schema change needed; Dexie stores any field.

export async function trashNote(id) {
  await db.notes.update(id, { deletedAt: Date.now() });
}

export async function restoreNote(id) {
  await db.notes.update(id, { deletedAt: null });
}

export async function purgeNote(id) {
  await db.notes.delete(id);
}

export async function emptyTrash() {
  const trashed = await db.notes.filter(n => !!n.deletedAt).toArray();
  await db.notes.bulkDelete(trashed.map(n => n.id));
}

/** Permanently delete notes trashed more than 30 days ago. Call on app load. */
export async function autopurgeTrash() {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const old = await db.notes.filter(n => !!n.deletedAt && n.deletedAt < cutoff).toArray();
  if (old.length > 0) await db.notes.bulkDelete(old.map(n => n.id));
}
