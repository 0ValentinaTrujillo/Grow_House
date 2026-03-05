#!/usr/bin/env node
/**
 * Test del API Chatbot desde Node.js
 * Uso: node backend/scripts/test-chatbot.js
 */

const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const testMessage = '¿Cuál es el mejor riego para un suculenta?';

console.log('\n🤖 TEST DEL CHATBOT BACKEND\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Test 1: Health check
console.log('Test 1: Health check del servidor');
console.log('─────────────────────────────────────────────────────────');

async function testHealthCheck() {
    try {
        const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
        console.log('✅ Servidor activo');
        console.log('   Status:', response.status);
        console.log('   Service:', response.data.service);
        console.log('   Database:', response.data.database);
        console.log('   Uptime:', response.data.uptime.toFixed(2), 's');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión');
        console.error('   Error:', error.message);
        console.log('\n⚠️  Asegúrate de que el servidor está corriendo:');
        console.log('   npm run dev\n');
        return false;
    }
}

// Test 2: Verificar variables de entorno
console.log('\nTest 2: Verificar variables de entorno');
console.log('─────────────────────────────────────────────────────────');

function testEnvironment() {
    const requiredVars = ['AI_API_URL', 'AI_API_KEY', 'AI_MODEL'];
    let allConfigured = true;

    requiredVars.forEach(varName => {
        const value = process.env[varName];
        if (value) {
            const displayValue = varName === 'AI_API_KEY' 
                ? value.substring(0, 10) + '...' 
                : value;
            console.log(`✅ ${varName}: ${displayValue}`);
        } else {
            console.error(`❌ ${varName}: NO configurado`);
            allConfigured = false;
        }
    });

    return allConfigured;
}

// Test 3: Enviar mensaje al chatbot
console.log('\nTest 3: Enviar mensaje al chatbot');
console.log('─────────────────────────────────────────────────────────');

async function testChatbot() {
    try {
        console.log(`📨 Enviando: "${testMessage}"`);
        console.log('⏳ Esperando respuesta...\n');

        const response = await axios.post(
            `${API_URL}/chatbot/chat`,
            { message: testMessage },
            { timeout: 35000 }
        );

        if (response.data.success) {
            console.log('✅ Respuesta recibida');
            console.log('   Status:', response.status);
            console.log('   Respuesta:');
            console.log('   ' + response.data.reply.substring(0, 200) + '...');
            console.log('\n   (Longitud total: ' + response.data.reply.length + ' caracteres)');
            return true;
        } else {
            console.error('❌ Error en la respuesta');
            console.error('   Error:', response.data.error);
            return false;
        }

    } catch (error) {
        console.error('❌ Error al conectar con el chatbot');
        
        if (error.code === 'ECONNREFUSED') {
            console.error('   No se pudo conectar al servidor');
        } else if (error.message.includes('timeout')) {
            console.error('   Timeout: La solicitud tardó demasiado');
        } else if (error.response?.status === 401) {
            console.error('   Error 401: API Key inválida');
        } else if (error.response?.status === 429) {
            console.error('   Error 429: Límite de solicitudes excedido');
        } else {
            console.error('   Error:', error.message);
        }
        return false;
    }
}

// Test 4: Mensaje vacío (validación)
console.log('\nTest 4: Validación - Mensaje vacío');
console.log('─────────────────────────────────────────────────────────');

async function testValidation() {
    try {
        const response = await axios.post(
            `${API_URL}/chatbot/chat`,
            { message: '' },
            { timeout: 5000, validateStatus: () => true }
        );

        if (response.status === 400) {
            console.log('✅ Validación correcta');
            console.log('   Status:', response.status);
            console.log('   Error:', response.data.error);
            return true;
        } else {
            console.error('❌ Validación fallida - debería devolver 400');
            return false;
        }

    } catch (error) {
        console.error('❌ Error en la validación:', error.message);
        return false;
    }
}

// Ejecutar todos los tests
async function runAllTests() {
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const test1 = await testHealthCheck();
    console.log('');
    const test2 = testEnvironment();
    console.log('');
    
    if (!test1) {
        console.log('\n⚠️  Deteniendo tests porque el servidor no está activo.\n');
        return;
    }

    if (!test2) {
        console.log('\n⚠️  Deteniendo tests porque faltan variables de entorno.\n');
        return;
    }

    const test3 = await testChatbot();
    console.log('');
    const test4 = await testValidation();

    // Resumen
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE TESTS\n');

    const results = [
        { nombre: '1. Health Check', resultado: test1 },
        { nombre: '2. Variables de entorno', resultado: test2 },
        { nombre: '3. Envío de mensaje', resultado: test3 },
        { nombre: '4. Validación', resultado: test4 }
    ];

    results.forEach(({ nombre, resultado }) => {
        const icon = resultado ? '✅' : '❌';
        console.log(`${icon} ${nombre}`);
    });

    const total = results.filter(r => r.resultado).length;
    console.log(`\n${total}/${results.length} tests pasados\n`);

    if (total === results.length) {
        console.log('🎉 ¡Todo está funcionando correctamente!\n');
    } else {
        console.log('⚠️  Algunos tests fallaron. Revisa los errores arriba.\n');
    }

    console.log('═══════════════════════════════════════════════════════════\n');
}

// Ejecutar
runAllTests().catch(console.error);
