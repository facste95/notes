// src/lib/db.test.js
import 'fake-indexeddb/auto';
import { db, trashNote, restoreNote, purgeNote, emptyTrash, autopurgeTrash } from './db.js';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

afterAll(async () => {
  await db.close();
});

describe('notes', () => {
  test('creates and reads a note', async () => {
    const id = await db.notes.add({
      folderId: null, title: 'Test', content: '<p>Hello</p>',
      editorMode: 'rich', tags: [], createdAt: Date.now(), updatedAt: Date.now()
    });
    const note = await db.notes.get(id);
    expect(note.title).toBe('Test');
    expect(note.editorMode).toBe('rich');
  });

  test('updates a note', async () => {
    const id = await db.notes.add({
      folderId: null, title: 'Old', content: '', editorMode: 'rich',
      tags: [], createdAt: Date.now(), updatedAt: Date.now()
    });
    await db.notes.update(id, { title: 'New' });
    const note = await db.notes.get(id);
    expect(note.title).toBe('New');
  });

  test('deletes a note', async () => {
    const id = await db.notes.add({
      folderId: null, title: 'Delete me', content: '', editorMode: 'rich',
      tags: [], createdAt: Date.now(), updatedAt: Date.now()
    });
    await db.notes.delete(id);
    const note = await db.notes.get(id);
    expect(note).toBeUndefined();
  });
});

describe('folders', () => {
  test('creates and reads a folder', async () => {
    const id = await db.folders.add({ name: 'Lavoro', createdAt: Date.now() });
    const folder = await db.folders.get(id);
    expect(folder.name).toBe('Lavoro');
  });
});

describe('prefs', () => {
  test('stores and reads a pref', async () => {
    await db.prefs.put({ key: 'theme', value: 'dark' });
    const pref = await db.prefs.get('theme');
    expect(pref.value).toBe('dark');
  });
});

describe('trash', () => {
  async function makeNote(title = 'Note') {
    return db.notes.add({
      folderId: null, title, content: '', editorMode: 'rich',
      tags: [], createdAt: Date.now(), updatedAt: Date.now()
    });
  }

  test('trashNote sets deletedAt', async () => {
    const id = await makeNote('Trash me');
    await trashNote(id);
    const note = await db.notes.get(id);
    expect(note.deletedAt).toBeGreaterThan(0);
  });

  test('restoreNote clears deletedAt', async () => {
    const id = await makeNote('Restore me');
    await trashNote(id);
    await restoreNote(id);
    const note = await db.notes.get(id);
    expect(note.deletedAt).toBeNull();
  });

  test('purgeNote permanently deletes', async () => {
    const id = await makeNote('Purge me');
    await trashNote(id);
    await purgeNote(id);
    const note = await db.notes.get(id);
    expect(note).toBeUndefined();
  });

  test('emptyTrash deletes all trashed notes', async () => {
    const id1 = await makeNote('A');
    const id2 = await makeNote('B');
    const id3 = await makeNote('C'); // not trashed
    await trashNote(id1);
    await trashNote(id2);
    await emptyTrash();
    expect(await db.notes.get(id1)).toBeUndefined();
    expect(await db.notes.get(id2)).toBeUndefined();
    expect(await db.notes.get(id3)).toBeDefined(); // untouched
  });

  test('autopurgeTrash removes notes trashed > 30 days ago', async () => {
    const id = await makeNote('Old trash');
    const oldTs = Date.now() - 31 * 24 * 60 * 60 * 1000;
    await db.notes.update(id, { deletedAt: oldTs });
    await autopurgeTrash();
    expect(await db.notes.get(id)).toBeUndefined();
  });

  test('autopurgeTrash keeps notes trashed < 30 days ago', async () => {
    const id = await makeNote('Recent trash');
    await trashNote(id); // now
    await autopurgeTrash();
    expect(await db.notes.get(id)).toBeDefined();
  });
});
