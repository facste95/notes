import { writable } from 'svelte/store';

const browserLang = typeof navigator !== 'undefined'
  ? (navigator.language?.startsWith('it') ? 'it' : 'en')
  : 'it';

export const theme = writable('light');
export const sidebarOpen = writable(true);
export const language = writable(browserLang);
export const isWriting = writable(false);

export const toggleTheme = () => theme.update(t => t === 'light' ? 'dark' : 'light');
export const toggleSidebar = () => sidebarOpen.update(v => !v);
