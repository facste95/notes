// src/lib/ai.test.js
import { vi } from 'vitest';
import { callAI, getApiKey, AI_ACTIONS } from './ai.js';

// Mock fetch globally
global.fetch = vi.fn();

afterEach(() => vi.clearAllMocks());

test('callAI sends correct payload and returns result', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ result: 'Testo migliorato' })
  });

  // Simulate apiKey in sessionStorage
  global.sessionStorage = { getItem: () => 'sk-ant-test', setItem: vi.fn() };

  const result = await callAI('Migliora questo testo', 'Migliora il testo.');
  expect(result).toBe('Testo migliorato');
  expect(global.fetch).toHaveBeenCalledWith(
    '/api/ai-proxy',
    expect.objectContaining({ method: 'POST' })
  );
});

test('callAI throws if no API key', async () => {
  global.sessionStorage = { getItem: () => null };
  global.localStorage = { getItem: () => null };
  await expect(callAI('test')).rejects.toThrow('no-api-key');
});

test('getApiKey returns sessionStorage key first', () => {
  global.sessionStorage = { getItem: (k) => k === 'foliaApiKey' ? 'sk-ant-session' : null };
  global.localStorage = { getItem: () => null };
  expect(getApiKey()).toBe('sk-ant-session');
});

test('AI_ACTIONS has all 5 required actions', () => {
  expect(AI_ACTIONS.summarize).toBeDefined();
  expect(AI_ACTIONS.improve).toBeDefined();
  expect(AI_ACTIONS.continue).toBeDefined();
  expect(AI_ACTIONS.generateTags).toBeDefined();
  expect(typeof AI_ACTIONS.translate).toBe('function');
  expect(AI_ACTIONS.translate('Inglese').system).toContain('Inglese');
});
