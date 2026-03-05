const mongoose = require("mongoose");

// ✅ Todos los campos coinciden con lo que OpenAI devuelve y lo que muestra el HTML
const plantaSchema = new mongoose.Schema({
  nombre_comun:      { type: String, required: true },
  nombre_cientifico: { type: String, required: true },
  familia:           { type: String },
  nivel_dificultad:  { type: String, enum: ['Fácil', 'Intermedio', 'Difícil'] },
  descripcion:       { type: String },

  cuidados: {
    luz:           String,
    riego:         String,
    temperatura:   String,
    humedad:       String,
    fertilizacion: String,
    poda:          String,
    // ✅ Removido "suelo" porque el prompt de OpenAI ya no lo pide
    // Si lo quieres de vuelta, agrégalo también al prompt del controlador
  },

  recomendaciones:  [String],
  toxicidad:        String,
  propagacion:      String,
  tamano_esperado:  String,
  imagen:           String,   // base64 o URL

  fecha: {
    type:    Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Planta", plantaSchema);