export function getApiKey() {
  return sessionStorage.getItem('foliaApiKey') ?? localStorage.getItem('foliaApiKey') ?? null;
}

export function setApiKey(key, persist = false) {
  sessionStorage.setItem('foliaApiKey', key);
  if (persist) {
    localStorage.setItem('foliaApiKey', key);
  }
}

export function clearApiKey() {
  sessionStorage.removeItem('foliaApiKey');
  localStorage.removeItem('foliaApiKey');
}

export async function callAI(prompt, systemPrompt = '') {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('no-api-key');

  const response = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, systemPrompt, prompt })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'ai-error');
  return data.result;
}

export const AI_ACTIONS = {
  summarize: {
    system: 'Riassumi il testo in modo chiaro e conciso nella stessa lingua del testo.',
    labelKey: 'ai.summarize'
  },
  improve: {
    system: 'Migliora il testo mantenendo stile e voce originale. Rispondi solo con il testo migliorato.',
    labelKey: 'ai.improve'
  },
  continue: {
    system: 'Continua il testo in modo coerente con stile e tono esistenti. Rispondi solo con la continuazione.',
    labelKey: 'ai.continue'
  },
  generateTags: {
    system: 'Estrai 3-5 tag rilevanti dal testo. Rispondi solo con i tag separati da virgola, in minuscolo, senza simbolo #.',
    labelKey: 'ai.generateTags'
  },
  translate: (targetLang) => ({
    system: `Traduci il testo in ${targetLang}. Rispondi solo con il testo tradotto.`,
    labelKey: 'ai.translate'
  })
};
