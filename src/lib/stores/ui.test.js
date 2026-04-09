// src/lib/stores/ui.test.js
import { get } from 'svelte/store';
import { theme, sidebarOpen, language, isWriting, toggleTheme, toggleSidebar, showSettings, showPalette } from './ui.js';

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

test('showSettings defaults to false', () => {
  expect(get(showSettings)).toBe(false);
});

test('showPalette defaults to false', () => {
  expect(get(showPalette)).toBe(false);
});

test('showSettings can be set to true', () => {
  showSettings.set(true);
  expect(get(showSettings)).toBe(true);
  showSettings.set(false);
});

test('showPalette can be set to true', () => {
  showPalette.set(true);
  expect(get(showPalette)).toBe(true);
  showPalette.set(false);
});
