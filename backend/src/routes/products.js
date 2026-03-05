// =============================================
// RUTAS REST PARA PRODUCTOS - GROW HOUSE
// =============================================

const express = require('express');
const router = express.Router();

// Importar middleware de autenticación
const { protect, authorize } = require('../middleware/auth');

// Importar controladores
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

console.log('🛣️ Inicializando rutas de productos Grow House');

// =============================================
// RUTAS ESPECIALES PARA ECOMMERCE (DEBEN IR PRIMERO)
// =============================================

/**
 * @route   GET /api/products/category/:category
 * @desc    Obtener productos por categoría
 * @access  Público
 */
router.get('/category/:category', (req, res, next) => {
    req.query.category = req.params.category;
    getAllProducts(req, res, next);
});

/**
 * @route   GET /api/products/brand/:brand
 * @desc    Obtener productos por marca
 * @access  Público
 */
router.get('/brand/:brand', (req, res, next) => {
    req.query.brand = req.params.brand;
    getAllProducts(req, res, next);
});

/**
 * @route   GET /api/products/search/:query
 * @desc    Búsqueda de productos por texto
 * @access  Público
 */
router.get('/search/:query', (req, res, next) => {
    req.query.search = req.params.query;
    getAllProducts(req, res, next);
});

// =============================================
// RUTAS PÚBLICAS GENERALES
// =============================================

/**
 * @route   GET /api/products
 * @desc    Obtener todos los productos con filtros
 * @access  Público
 */
router.get('/', getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Obtener producto por ID
 * @access  Público
 * @params  id (MongoDB ObjectId)
 */
router.get('/:id', getProductById);

// =============================================
// RUTAS DE ADMINISTRACIÓN (REQUIEREN AUTH)
// =============================================

router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

// =============================================
// LOGS
// =============================================

console.log('✅ Rutas de productos configuradas correctamente');
console.log('   📱 GET /api/products');
console.log('   🔍 GET /api/products/:id');
console.log('   🏷️ GET /api/products/category/:category');
console.log('   🏢 GET /api/products/brand/:brand');
console.log('   🔎 GET /api/products/search/:query');

module.exports = router;
