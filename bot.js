export default async function handler(req, res) {
    // 🛡️ REGLAS CORS: Permite que el Albook desde cualquier celular pueda hablar con este puente
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Si el navegador hace una pregunta de control previa (OPTIONS), le decimos que todo ok
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Solo aceptamos peticiones de tipo POST (cuando envían datos)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { message, selectedText } = req.body;
        
        // 🔑 Aquí el servidor jalará tu API Key en secreto desde las variables de Vercel
        const apiKey = process.env.GEMINI_API_KEY; 

        if (!apiKey) {
            return res.status(500).json({ error: 'Error interno: Falta la configuración de seguridad en el búnker.' });
        }

        // 🧠 LA INYECCIÓN DE PERSONALIDAD DE LA TUTORÍA DETOX
        const systemInstruction = `Eres "Tutoría Detox", un mentor de negocios e IA del ecosistema OKSAI (OK Simple AI). Tu cliente es un emprendedor de entre 35 y 50 años que está infoxicado y paralizado por consumir tanta teoría basura de gurús. 
        Tu rol NO es dar soporte técnico, ni dar códigos, ni enseñar a programar. Tu trabajo es actuar como Diseñador estratégico, validarlo como ser humano, calmar su ansiedad usando datos reales del mercado global, prueba social y estadísticas duras, y empujarlo a la "acción a pesar de todo". 
        Mantén un tono de socio, cercano, firme y de trinchera. Usa palabras como "socio", "en caliente", "búnker". Tus respuestas deben ser directas e impactantes. 
        IMPORTANTE: Formatea tus respuestas usando negritas (**texto**) y saltos de línea muy limpios para que se lean de forma espectacular dentro del cuadro oscuro de chat (#404040) del usuario.`;

        // Estructuramos lo que le mandamos a Gemini
        let promptFinal = "";
        if (selectedText) {
            promptFinal += `El usuario resaltó este texto de su libro para preguntarte:\n"${selectedText}"\n\n`;
        }
        promptFinal += `Mensaje del usuario: ${message}`;

        // Llamamos a los servidores de Google de forma ultra segura
        const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptFinal }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] }
            })
        });

        const data = await googleResponse.json();
        
        // Extraemos la respuesta de la IA y se la devolvemos limpia al celular del usuario
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const reply = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ reply });
        } else {
            return res.status(500).json({ error: 'La IA no devolvió un formato válido.' });
        }

    } catch (error) {
        return res.status(500).json({ error: 'Error en el puente: ' + error.message });
    }
}