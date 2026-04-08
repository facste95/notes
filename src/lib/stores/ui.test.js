// src/lib/stores/ui.test.js
import { get } from 'svelte/store';
import { theme, sidebarOpen, language, isWriting, toggleTheme, toggleSidebar } from './ui.js';

test('theme defaults to light', () => {
  expect(get(theme)).toBe('light');
});

test('toggleTheme switches between light and dark', () => {
  toggleTheme();
  expect(get(theme)).toBe('dark');
  toggleTheme();
  expect(get(theme)).toBe('light');
});

test('sidebarOpen defaults to true', () => {
  expect(get(sidebarOpen)).toBe(true);
});

test('toggleSidebar inverts sidebarOpen', () => {
  toggleSidebar();
  expect(get(sidebarOpen)).toBe(false);
  toggleSidebar();
  expect(get(sidebarOpen)).toBe(true);
});

test('language defaults to it or en based on navigator', () => {
  const lang = get(language);
  expect(['it', 'en']).toContain(lang);
});

test('isWriting defaults to false', () => {
  expect(get(isWriting)).toBe(false);
});
