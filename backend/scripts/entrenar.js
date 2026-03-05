import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const data = [
  {
    question: "¿Hacen envíos?",
    answer: "Sí, realizamos envíos a todo el país."
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer: "Aceptamos tarjetas, transferencias y pagos digitales."
  }
];

const TrainingSchema = new mongoose.Schema({
  question: String,
  answer: String
});

const Training = mongoose.model("Training", TrainingSchema);

const train = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Training.insertMany(data);
    console.log("Entrenamiento guardado correctamente");
    process.exit();
  } catch (error) {
    console.error("Error entrenando:", error);
    process.exit(1);
  }
};

train();
