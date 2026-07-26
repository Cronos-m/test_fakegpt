// api/chat.js
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta la API Key de Groq en el servidor' });
  }

  try {
    // 2. Llamar a Groq (velocidad extrema)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Modelo ultra-rápido
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      // 3. En lugar de lanzar un error al catch, respondemos directamente con el código de Groq (ej. 402)
      console.error(`Groq rechazó la petición con código ${response.status}:`, errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Error en la API de Groq' 
      });
    }

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || 'La IA no devolvió texto.';
    
    return res.status(200).json({ text: aiText });

  } catch (error) {
    // 4. Este catch ahora solo se activará si hay un fallo catastrófico de red o interno
    console.error('Error crítico en el servidor:', error);
    return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
}