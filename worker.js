export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (url.pathname === '/api/chat' && request.method === 'POST') {
    const env = context.env;
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key no configurada' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    try {
      const { messages, type = 'case' } = await request.json();
      let systemPrompt = type === 'case' ? 'Eres un asistente legal especializado en derecho argentino.' : 'Eres un experto en derecho argentino.';
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-opus-5-5', max_tokens: 2048, system: systemPrompt, messages: messages })
      });
      if (!response.ok) return new Response(JSON.stringify({ error: 'API error' }), { status: response.status, headers: { 'Content-Type': 'application/json' } });
      const data = await response.json();
      return new Response(JSON.stringify({ message: data.content[0].text }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }
  return next();
}
