export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Endpoint para llamadas a la API de Claude
  if (url.pathname === '/api/chat' && request.method === 'POST') {
    const apiKey = env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key no configurada' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      const { messages, type = 'case' } = await request.json();

      let systemPrompt = '';
      if (type === 'case') {
        systemPrompt = 'Eres un asistente legal especializado en derecho argentino. Ayuda al abogado a redactar documentos legales, analizar casos y proporcionar estrategias jurídicas. Sé conciso y profesional.';
      } else if (type === 'legal') {
        systemPrompt = 'Eres un experto en derecho argentino con acceso a la Constitución Nacional, Código Civil y Comercial, Código Penal, y todas las leyes argentinas relevantes. Responde preguntas legales con precisión, citando artículos y leyes cuando sea necesario.';
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-opus-5-5',
          max_tokens: 2048,
          system: systemPrompt,
          messages: messages
        })
      });

      if (!response.ok) {
        const error = await response.text();
        return new Response(
          JSON.stringify({ error: `API error: ${response.status}`, details: error }),
          { status: response.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const assistantMessage = data.content[0].text;

      return new Response(
        JSON.stringify({ message: assistantMessage }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Solo procesar requests a HTML
  if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname.endsWith('.html')) {
    const apiKey = env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return new Response(
        '❌ Error: ANTHROPIC_API_KEY no configurada',
        {
          status: 500,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        }
      );
    }

    // Obtén la response del archivo estático
    let response = await next();

    if (response.headers.get('content-type')?.includes('text/html')) {
      let text = await response.text();

      // Inyecta la API key
      text = text.replace(
        "apiKey: localStorage.getItem('anthropic_api_key') || ''",
        `apiKey: '${apiKey}'`
      );

      return new Response(text, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }

    return response;
  }

  // Para otros archivos, pasa directo
  return next();
}
