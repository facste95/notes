import { Document } from 'flexsearch';

let index;

export function buildIndex(notes) {
  index = new Document({
    document: { id: 'id', index: ['title', 'content', 'tags'] },
    tokenize: 'forward'
  });
  for (const note of notes) {
    index.add({
      id: note.id,
      title: note.title,
      content: note.content.replace(/<[^>]+>/g, ''),
      tags: (note.tags ?? []).join(' ')
    });
  }
}

export function indexNote(note) {
  index?.add({
    id: note.id,
    title: note.title,
    content: note.content.replace(/<[^>]+>/g, ''),
    tags: (note.tags ?? []).join(' ')
  });
}

export function removeNote(id) {
  index?.remove(id);
}

export function searchNotes(query) {
  if (!query?.trim() || !index) return [];
  const raw = index.search(query, { enrich: true });
  const ids = new Set();
  for (const field of raw) {
    for (const r of field.result) {
      ids.add(typeof r === 'object' ? r.id : r);
    }
  }
  return [...ids].map(id => ({ id }));
}
