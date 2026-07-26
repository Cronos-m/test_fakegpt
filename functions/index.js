const functions = require('firebase-functions');

// ✅ Función que actúa como proxy seguro para proteger tu API Key
exports.chat = functions.https.onRequest(async (req, res) => {
  // 1. Configurar encabezados CORS para permitir llamadas desde el frontend
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Manejar la solicitud de preflight de CORS
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  // 3. Validar que solo se acepten solicitudes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Falta el parámetro "prompt" en el cuerpo de la solicitud.' });
  }

  // 4. Leer la API Key desde el archivo .env (Cargado automáticamente por Firebase)
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('ERROR: GEMINI_API_KEY no está configurada en el archivo .env');
    return res.status(500).json({ error: 'Configuración del servidor incompleta. Contacta al administrador.' });
  }

  try {
    // 5. Hacer la solicitud a la API de Google Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    // 6. Manejar errores específicos de la API de Google
    if (!response.ok) {
      console.error('Error de Gemini API:', data);
      throw new Error(data.error?.message || 'Error desconocido en la API de Google');
    }

    // 7. Extraer el texto generado y devolverlo al frontend
    const aiText = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ text: aiText });

  } catch (error) {
    console.error('Error en el proxy de IA:', error.message);
    return res.status(500).json({ error: 'Error interno al consultar el servicio de IA. Intenta de nuevo más tarde.' });
  }
});