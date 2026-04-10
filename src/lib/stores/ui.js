import { writable } from 'svelte/store';

// Set to true to re-enable AI features (onboarding step, settings section, toolbar button)
export const AI_ENABLED = false;

const browserLang = typeof navigator !== 'undefined'
  ? (navigator.language?.startsWith('it') ? 'it' : 'en')
  : 'it';

export const theme = writable('light');
export const sidebarOpen = writable(true);
export const language = writable(browserLang);
export const isWriting = writable(false);
export const showSettings = writable(false);
export const showPalette = writable(false);

export const toggleTheme = () => theme.update(t => t === 'light' ? 'dark' : 'light');
export const toggleSidebar = () => sidebarOpen.update(v => !v);
