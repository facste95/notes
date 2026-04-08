// src/lib/export.test.js
import { noteToMarkdown, noteToText, noteToHtml, notesToJson, parseJsonBackup } from './export.js';

const note = {
  id: 1, title: 'Titolo nota', content: '<p>Paragrafo uno.</p><p>Paragrafo due.</p>',
  editorMode: 'rich', tags: ['test', 'bozza'],
  createdAt: 1700000000000, updatedAt: 1700000001000,
  folderId: null
};

test('noteToText strips HTML and includes title', () => {
  const result = noteToText(note);
  expect(result).toContain('Titolo nota');
  expect(result).toContain('Paragrafo uno.');
  expect(result).not.toContain('<p>');
});

test('noteToMarkdown includes title as H1', () => {
  const result = noteToMarkdown(note);
  expect(result).toMatch(/^# Titolo nota/);
});

test('noteToHtml wraps in HTML document', () => {
  const result = noteToHtml(note);
  expect(result).toContain('<!DOCTYPE html>');
  expect(result).toContain('Titolo nota');
});

test('notesToJson serializes array of notes', () => {
  const json = notesToJson([note]);
  const parsed = JSON.parse(json);
  expect(parsed.notes).toHaveLength(1);
  expect(parsed.notes[0].title).toBe('Titolo nota');
  expect(parsed.version).toBe(1);
});

test('parseJsonBackup returns notes array', () => {
  const json = notesToJson([note]);
  const result = parseJsonBackup(json);
  expect(result.notes).toHaveLength(1);
});

test('parseJsonBackup throws on invalid JSON', () => {
  expect(() => parseJsonBackup('not json')).toThrow();
});
