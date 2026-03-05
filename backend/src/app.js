// =============================================
// APLICACIÓN PRINCIPAL - GROW HOUSE BACKEND
// =============================================

require('dotenv').config(); // Cargar variables de entorno PRIMERO

// ✅ Verificar API key sin exponerla
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ Configurada' : '✗ No encontrada');

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter'); 
const mongoSanitize = require('express-mongo-sanitize'); 
const xss = require('xss-clean');  
const helmet = require('helmet');

// 🔹 IMPORTAR RUTA CHATBOT IA
const chatbotRoutes = require('./routes/chatbot');

console.log('🚀 Iniciando Grow House Backend...');

// Crear aplicación Express
const app = express();

// =============================================
// HELMET - HEADERS DE SEGURIDAD
// =============================================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https:", "data:"]
        }
    }
}));

console.log('🛡️  Helmet activado - Headers de seguridad configurados');

// =============================================
// LOGGING PERSONALIZADO
// =============================================
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress;
    
    let requestType = '📡';
    if (url.includes('/products')) requestType = '📱';
    if (url.includes('/users')) requestType = '👤';
    if (url.includes('/orders')) requestType = '🛒';
    if (url.includes('/auth')) requestType = '🔐';
    if (url.includes('/chatbot')) requestType = '🤖'; 
    if (url.includes('/health')) requestType = '💚';
    if (url.includes('/admin')) requestType = '👑';
    
    console.log(`${requestType} ${timestamp} - ${method} ${url} - IP: ${ip}`);
    next();
});

// Morgan
const morganMiddleware = require('./config/morganConfig');
app.use(morganMiddleware);

// =============================================
// RATE LIMITING
// =============================================
app.use('/api/', (req, res, next) => {
    if (
        req.path.includes("solicitar-codigo") ||
        req.path.includes("verificar-codigo") ||
        req.path.includes("cambiar-password")
    ) {
        return next();
    }
    generalLimiter(req, res, next);
});

// =============================================
// CORS
// =============================================
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://grow-house.vercel.app',
        'https://www.grow-house.com',
        process.env.FRONTEND_URL
    ].filter(Boolean)
    : [
      'http://localhost:5000',
      'http://localhost:5000',
      'http://localhost:5000',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:5500'
    ];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (!allowedOrigins.includes(origin)) {
            return callback(new Error(`CORS: Origen ${origin} no permitido`), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

// =============================================
// PARSEO
// =============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================
// SANITIZACIÓN
// =============================================
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(xss());

const { sanitizeInput, preventSQLInjection } = require('./middleware/sanitize');
app.use(sanitizeInput);
app.use(preventSQLInjection);

// =============================================
// CONECTAR DB
// =============================================
connectDB();

// =============================================
// RUTA PRINCIPAL
// =============================================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🏪 Grow House API + Chatbot IA activa',
        environment: process.env.NODE_ENV || 'development'
    });
});

// =============================================
// RUTAS API
// =============================================

const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
//IA
const espaciosRoutes = require('./routes/espacios');
const registroRoutes = require('./routes/registro');
const recomendacionesRoutes = require('./routes/recomendaciones');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
//IA
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/espacios', espaciosRoutes);
app.use('/api/registro', registroRoutes);
app.use('/api/recomendaciones', recomendacionesRoutes);


// =============================================
// HEALTH
// =============================================
app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');

    res.json({
        success: true,
        service: 'Grow House API',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        uptime: process.uptime()
    });
});

// =============================================
// ERRORES (SIEMPRE AL FINAL)
// =============================================
app.use(notFound);
app.use(errorHandler);

module.exports = app;