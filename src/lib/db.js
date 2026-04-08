import Dexie from 'dexie';

export const db = new Dexie('FoliaDB');

db.version(1).stores({
  folders: '++id, name, createdAt',
  notes: '++id, folderId, title, content, editorMode, *tags, createdAt, updatedAt',
  prefs: 'key'
});
