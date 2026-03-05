// =============================================
// RUTAS DE AUTENTICACIÓN - GROW HOUSE
// =============================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {authLimiter} = require('../middleware/rateLimiter'); 
const {verificarToken} = require('../middleware/auth');
const {
    SolicitarCodigo,
    verificarCodigo,
    cambiarPassword
} = require('../controllers/passwordRecoveryController');

const { 
    registerValidation, 
    loginValidation, 
    updateProfileValidation,
    handleValidationErrors 
} = require('../validators/authValidators');  

// Importar controladores
const {
    register,
    login,
    getProfile,
    updateProfile
} = require('../controllers/authController');

console.log('🔐 Inicializando rutas de autenticación');

// =============================================
// RUTAS PÚBLICAS (NO REQUIEREN AUTENTICACIÓN)
// =============================================

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Público
 * @body    { firstName, lastName, email, password, phone?, role? }
 */
router.post('/register', 
    authLimiter,              // 1. Rate limiting
    registerValidation,        // 2. Validar datos
    handleValidationErrors,    // 3. Manejar errores
    authController.register    // 4. Controlador
);

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuario (devuelve token JWT)
 * @access  Público
 * @body    { email, password }
 */
router.post('/login', 
    authLimiter,
    loginValidation,
    handleValidationErrors,
    authController.login
);

//=========================================
//CAMBIAR CONTRASEÑA
// ==========================================

// Solicitar código de recuperación
router.post('/solicitar-codigo', SolicitarCodigo);

// Verificar código enviado al correo
router.post('/verificar-codigo', verificarCodigo);

// Cambiar contraseña después de verificar el código
router.post('/cambiar-password', cambiarPassword);


// =============================================
// RUTAS PRIVADAS (REQUIEREN AUTENTICACIÓN)
// =============================================
// TODO: En Parte 3C3 agregaremos middleware de autenticación
// Por ahora funcionan sin middleware para testing

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Privado (requiere token)
 * @query   userId (temporal para testing)
 */
router.get('/profile', 
    updateProfileValidation,
    handleValidationErrors,
    updateProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario
 * @access  Privado (requiere token)
 * @query   userId (temporal para testing)
 * @body    { firstName?, lastName?, phone?, address?, etc }
 */
router.put('/profile', updateProfile);

// =============================================
// LOG DE RUTAS CONFIGURADAS
// =============================================

console.log('✅ Rutas de autenticación configuradas:');
console.log('   📝 POST /api/auth/register - Crear cuenta');
console.log('   🔐 POST /api/auth/login - Iniciar sesión');
console.log('   👤 GET /api/auth/profile - Ver perfil');
console.log('   ✏️ PUT /api/auth/profile - Actualizar perfil');

module.exports = router;