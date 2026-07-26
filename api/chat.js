// api/chat.js
module.exports = async function handler(req, res) {
  // 1. Permitir CORS para que tu frontend pueda llamar a esta función
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Manejar la solicitud de preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 3. Solo aceptar solicitudes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Falta el prompt' });
  }

  // 4. Leer la clave secreta desde las variables de entorno de Vercel
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY no configurada en Vercel');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  try {
    // 5. Llamar a la API de Google Gemini
    const response = await fetch(
         `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error en la API de Google');
    }

    const aiText = data.candidates[0].content.parts[0].text;
    
    // 6. Devolver la respuesta al frontend
    return res.status(200).json({ text: aiText });

  } catch (error) {
    console.error('Error en el proxy de IA:', error);
    return res.status(500).json({ error: 'Error al consultar la IA: ' + error.message });
  }
}