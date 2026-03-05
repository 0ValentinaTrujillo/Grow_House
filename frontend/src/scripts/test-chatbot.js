// =============================================
// TEST DEL CHATBOT - Verifica la conexión
// =============================================

/**
 * Ejecuta este script en la consola del navegador (F12)
 * cuando estés en la página del chatbot
 */

console.log('%c🤖 Iniciando test del Chatbot', 'color: #207719; font-size: 16px; font-weight: bold;');
console.log('═══════════════════════════════════════════════════════════\n');

// =============================================
// TEST 1: Verificar que el cliente existe
// =============================================

console.log('%cTest 1: Cliente chatbot disponible', 'color: #207719; font-weight: bold;');

if (typeof chatbotClient !== 'undefined') {
    console.log('✅ chatbotClient está disponible');
    console.log('   Base URL:', chatbotClient.baseURL);
    console.log('   Timeout:', chatbotClient.timeout, 'ms');
} else {
    console.error('❌ chatbotClient NO está disponible. ¿Se cargó chatbot.js?');
}

console.log('\n');

// =============================================
// TEST 2: Verificar configuración del servidor
// =============================================

console.log('%cTest 2: Configuración del servidor', 'color: #207719; font-weight: bold;');
console.log('   Hostname:', window.location.hostname);
console.log('   Protocol:', window.location.protocol);
console.log('   Origin:', window.location.origin);

console.log('\n');

// =============================================
// TEST 3: Health check del servidor
// =============================================

console.log('%cTest 3: Health check del servidor', 'color: #207719; font-weight: bold;');

async function testHealthCheck() {
    try {
        const response = await fetch('http://localhost:5000/api/health');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Servidor está activo');
            console.log('   Status:', response.status);
            console.log('   Respuesta:', data);
        } else {
            console.warn('⚠️  Servidor respondió con error:', response.status);
        }
    } catch (error) {
        console.error('❌ No se puede conectar al servidor');
        console.error('   Error:', error.message);
        console.log('   Asegúrate de que el backend está corriendo: npm run dev');
    }
}

await testHealthCheck();

console.log('\n');

// =============================================
// TEST 4: Test de envío de mensaje
// =============================================

console.log('%cTest 4: Prueba de envío de mensaje', 'color: #207719; font-weight: bold;');
console.log('⏳ Enviando mensaje de prueba...\n');

async function testSendMessage() {
    try {
        const response = await chatbotClient.sendMessage('Hola, ¿cómo estás?');
        console.log('✅ Mensaje enviado exitosamente');
        console.log('   Respuesta:', response.substring(0, 100) + '...');
        console.log('   Longitud total:', response.length, 'caracteres');
    } catch (error) {
        console.error('❌ Error al enviar mensaje');
        console.error('   Error:', error.message);
        console.log('   Detalles:', error);
    }
}

await testSendMessage();

console.log('\n');

// =============================================
// TEST 5: Historial de conversación
// =============================================

console.log('%cTest 5: Historial de conversación', 'color: #207719; font-weight: bold;');

const history = chatbotClient.getConversationHistory();
console.log('   Mensajes en el historial:', history.length);

if (history.length > 0) {
    console.log('   Últimos 2 mensajes:');
    history.slice(-2).forEach((msg, index) => {
        console.log(`   ${index + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
    });
}

console.log('\n');

// =============================================
// TEST 6: Verificar elementos del DOM
// =============================================

console.log('%cTest 6: Elementos del DOM', 'color: #207719; font-weight: bold;');

const elementos = {
    'chat-messages': document.getElementById('chat-messages'),
    'user-input': document.getElementById('user-input'),
    'send-btn': document.getElementById('send-btn'),
    'suggestions': document.getElementById('suggestions')
};

Object.entries(elementos).forEach(([nombre, elemento]) => {
    if (elemento) {
        console.log(`✅ #${nombre} - Encontrado`);
    } else {
        console.error(`❌ #${nombre} - NO encontrado`);
    }
});

console.log('\n');

// =============================================
// RESUMEN FINAL
// =============================================

console.log('%c═══════════════════════════════════════════════════════════', 'color: #207719;');
console.log('%c✅ Test completado', 'color: #207719; font-size: 14px; font-weight: bold;');
console.log('%c═══════════════════════════════════════════════════════════', 'color: #207719;');

console.log('\n📝 Próximos pasos:');
console.log('1. Verifica que el servidor backend está activo (npm run dev)');
console.log('2. Comprueba que tienes una API Key válida en .env');
console.log('3. Escribe un mensaje en el chatbot');
console.log('4. Abre la consola (F12) → Network para ver las solicitudes');

console.log('\n💬 Usar el chatbot desde la consola:');
console.log('   await chatbotClient.sendMessage("Tu pregunta aquí")');

console.log('\n📚 Ver historial:');
console.log('   chatbotClient.getConversationHistory()');

console.log('\n🗑️  Limpiar historial:');
console.log('   chatbotClient.clearHistory()');

console.log('\n');
