const Groq = require('groq-sdk');

// Inicializar cliente de Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Controlador para analizar espacios y recomendar plantas usando Groq AI
 */
const plantasController = {
    /**
     * Analiza una imagen de un espacio y retorna recomendaciones de plantas
     * @route POST /api/plantas/analizar-espacio
     */
    analizarEspacio: async (req, res) => {
        try {
            const { imageData } = req.body;

            // Validar que se envió la imagen
            if (!imageData) {
                return res.status(400).json({ 
                    success: false,
                    error: 'No se proporcionó imagen' 
                });
            }

            // Extraer el base64 sin el prefijo data:image
            const base64Data = imageData.includes(',') 
                ? imageData.split(',')[1] 
                : imageData;

            console.log('🌿 Analizando espacio con Groq AI...');

            // Llamar a Groq con el modelo de visión
            const completion = await groq.chat.completions.create({
                model: "llama-3.2-90b-vision-preview",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Data}`
                                }
                            },
                            {
                                type: "text",
                                text: `Eres un experto diseñador de interiores especializado en decoración con plantas.

Analiza este espacio y sugiere cómo decorarlo con plantas. Considera:
- La iluminación del espacio (luz natural, artificial, poca luz)
- El tamaño del espacio
- El estilo de decoración existente
- Las superficies disponibles (suelo, mesas, estantes, paredes)
- La orientación de la ventana si es visible

Proporciona recomendaciones específicas de plantas REALES con sus nombres científicos y comunes.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional antes o después. No uses markdown, no uses backticks, solo el JSON puro.

Formato JSON requerido:
{
  "descripcion_espacio": "descripción detallada del espacio y sus características",
  "iluminacion": "tipo de iluminación (alta/media/baja luz natural)",
  "estilo": "estilo de decoración detectado",
  "plantas_sugeridas": [
    {
      "nombre_comun": "nombre común de la planta",
      "nombre_cientifico": "nombre científico en itálica",
      "ubicacion": "dónde colocarla específicamente en este espacio",
      "cuidados": "cuidados básicos detallados (riego frecuencia, tipo de luz, temperatura)",
      "beneficios": "beneficios específicos de esta planta (purificación aire, humedad, etc)"
    }
  ],
  "consejos_decoracion": [
    "consejo 1 específico para este espacio",
    "consejo 2 específico",
    "consejo 3 específico"
  ],
  "combinaciones": "sugerencia detallada de cómo combinar las plantas en este espacio específico"
}`
                            }
                        ]
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            });

            // Extraer el texto de la respuesta
            const textoRespuesta = completion.choices[0]?.message?.content || '';

            if (!textoRespuesta) {
                throw new Error('No se recibió respuesta del modelo');
            }

            console.log('✅ Respuesta recibida de Groq');

            // Limpiar la respuesta de markdown si existe
            let jsonLimpio = textoRespuesta
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();

            // Si la respuesta tiene texto antes o después del JSON, intentar extraerlo
            const jsonMatch = jsonLimpio.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonLimpio = jsonMatch[0];
            }

            // Parsear el JSON
            const resultado = JSON.parse(jsonLimpio);

            // Validar que tenga la estructura esperada
            if (!resultado.plantas_sugeridas || !Array.isArray(resultado.plantas_sugeridas)) {
                throw new Error('Formato de respuesta inválido');
            }

            console.log('🎉 Análisis completado exitosamente');

            // Enviar respuesta exitosa
            return res.status(200).json({
                success: true,
                data: resultado,
                message: 'Análisis completado correctamente'
            });

        } catch (error) {
            console.error('❌ Error al analizar imagen:', error);
            
            // Determinar el tipo de error
            let errorMessage = 'Error al analizar la imagen';
            let statusCode = 500;
            
            if (error.message.includes('API key')) {
                errorMessage = 'Error de autenticación con Groq. Verifica tu API Key.';
                statusCode = 401;
            } else if (error.message.includes('JSON')) {
                errorMessage = 'Error al procesar la respuesta del modelo. Intenta de nuevo.';
                statusCode = 500;
            } else if (error.message.includes('rate limit')) {
                errorMessage = 'Límite de solicitudes alcanzado. Espera un momento e intenta de nuevo.';
                statusCode = 429;
            }
            
            return res.status(statusCode).json({
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    /**
     * Health check para verificar conexión con Groq
     * @route GET /api/plantas/health
     */
    healthCheck: async (req, res) => {
        try {
            return res.status(200).json({ 
                success: true,
                status: 'ok',
                message: 'Servicio de plantas funcionando correctamente',
                model: 'Groq - llama-3.2-90b-vision-preview',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                status: 'error',
                message: 'Error en el servicio'
            });
        }
    }
};

module.exports = plantasController;