export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { apiKey, systemPrompt, prompt } = body;

  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid API key' }) };
  }
  if (!prompt || typeof prompt !== 'string' || prompt.length === 0 || prompt.length > 10000) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid prompt: must be 1-10000 characters' }) };
  }

  const requestBody = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  };
  if (systemPrompt && typeof systemPrompt === 'string') {
    requestBody.system = systemPrompt;
  }

  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Failed to reach Anthropic API' }) };
  }

  const data = await response.json();
  if (!response.ok) {
    return {
      statusCode: response.status,
      body: JSON.stringify({ error: data.error?.message ?? 'Anthropic error' })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result: data.content[0].text })
  };
};
