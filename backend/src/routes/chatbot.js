// =============================================
// RUTAS CHATBOT - GROW HOUSE
// =============================================

const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');

// =============================================
// RUTAS
// =============================================

// POST /api/chatbot/chat - Enviar mensaje al chatbot
router.post('/chat', chatbotController.chat);

// GET /api/chatbot/health - Verificar estado del servicio
router.get('/health', chatbotController.health);

// GET /api/chatbot/suggestions - Obtener sugerencias rápidas
router.get('/suggestions', chatbotController.quickSuggestions);

console.log('✅ Rutas del chatbot registradas:');
console.log('   POST /api/chatbot/chat');
console.log('   GET  /api/chatbot/health');
console.log('   GET  /api/chatbot/suggestions');

module.exports = router;