// src/lib/stores/editor.test.js
import { get } from 'svelte/store';
import { activeNote, editorMode, setActiveNote, setEditorMode } from './editor.js';

test('activeNote defaults to null', () => {
  expect(get(activeNote)).toBeNull();
});

test('setActiveNote updates the store', () => {
  const note = { id: 1, title: 'Test', content: '', editorMode: 'rich', tags: [] };
  setActiveNote(note);
  expect(get(activeNote)).toEqual(note);
  setActiveNote(null);
});

test('editorMode defaults to rich', () => {
  expect(get(editorMode)).toBe('rich');
});

test('setEditorMode updates the store', () => {
  setEditorMode('markdown');
  expect(get(editorMode)).toBe('markdown');
  setEditorMode('rich');
});
