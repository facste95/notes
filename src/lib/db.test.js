// src/lib/db.test.js
import 'fake-indexeddb/auto';
import { db } from './db.js';

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
