module.exports = async function handler(req, res) {
  // 1. Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Falta el prompt' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta la API Key en el servidor de Vercel' });
  }

  try {
    // 2. Llamada a OpenRouter con un modelo gratuito activo
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com', // Opcional para OpenRouter
        'X-Title': 'AI Chat',                // Opcional para OpenRouter
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemma-2-9b-it:free', // Modelo 100% gratuito y disponible
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`API rechazó la petición con código ${response.status}:`, errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Error en la API' 
      });
    }

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || 'La IA no devolvió texto.';
    
    return res.status(200).json({ text: aiText });

  } catch (error) {
    console.error('Error crítico en el servidor:', error);
    return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
}