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

  // Usaremos una variable específica para tu llave de Google
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta la API Key de Gemini en el servidor de Vercel' });
  }

  try {
    // 2. Llamada directa a la API oficial de Google Generative Language
    // Usamos el modelo rápido y gratuito gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Google API rechazó la petición con código ${response.status}:`, errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Error en la API de Google' 
      });
    }

    const data = await response.json();
    
    // Extraer la respuesta del formato estructurado de Gemini
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'La IA no devolvió texto.';
    
    return res.status(200).json({ text: aiText });

  } catch (error) {
    console.error('Error crítico en el servidor:', error);
    return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
}