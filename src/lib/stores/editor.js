import { writable } from 'svelte/store';

export const activeNote = writable(null);
export const editorMode = writable('rich');

export const setActiveNote = (note) => activeNote.set(note);
export const setEditorMode = (mode) => editorMode.set(mode);
