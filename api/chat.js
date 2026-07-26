// api/chat.js
module.exports = async function handler(req, res) {
  // 1. Configurar CORS para que tu frontend pueda llamar a esta función
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

  try {
    // 2. Usar Pollinations.ai (100% Gratis, sin API Key)
    // Codificamos el prompt para que sea seguro en la URL
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://text.pollinations.ai/${encodedPrompt}`;
    
    const response = await fetch(url, {
      method: 'GET', // Pollinations responde perfectamente a solicitudes GET
      headers: {
        'Accept': 'text/plain'
      }
    });

    if (!response.ok) {
      throw new Error(`Error en el servicio de IA: ${response.status}`);
    }

    // 3. Pollinations devuelve el texto directamente, no un objeto JSON
    const aiText = await response.text();
    
    return res.status(200).json({ text: aiText });

  } catch (error) {
    console.error('Error en el proxy de IA:', error);
    return res.status(500).json({ error: 'Error al consultar la IA: ' + error.message });
  }
}