// src/lib/search.test.js
import { buildIndex, indexNote, removeNote, searchNotes } from './search.js';

beforeEach(() => {
  buildIndex([]);
});

test('indexes and finds a note by title', () => {
  indexNote({ id: 1, title: 'Appunti riunione', content: '', tags: [] });
  const results = searchNotes('riunione');
  expect(results.map(r => r.id)).toContain(1);
});

test('indexes and finds a note by content', () => {
  indexNote({ id: 2, title: 'Test', content: 'paradigma funzionale', tags: [] });
  const results = searchNotes('funzionale');
  expect(results.map(r => r.id)).toContain(2);
});

test('removes a note from index', () => {
  indexNote({ id: 3, title: 'Da rimuovere', content: '', tags: [] });
  removeNote(3);
  const results = searchNotes('rimuovere');
  expect(results.map(r => r.id)).not.toContain(3);
});

test('returns empty array for no match', () => {
  const results = searchNotes('xyznotfound');
  expect(results).toEqual([]);
});
