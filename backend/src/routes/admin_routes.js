// =============================================
// RUTAS PANEL ADMINISTRADOR - GROW HOUSE
// =============================================

const express = require('express');
const router = express.Router();

// Middleware de autenticación y autorización
const { protect, authorize } = require('../middleware/auth');

// Controladores
const adminController = require('../controllers/adminController');
const inventoryController = require('../controllers/inventoryController');
const couponController = require('../controllers/couponController');
const categoryController = require('../controllers/categoryController');

console.log('🔐 Inicializando rutas del panel administrador');

// =============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN DE ADMIN
// =============================================

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);
router.use(authorize);

// =============================================
// DASHBOARD Y ESTADÍSTICAS
// =============================================

/**
 * @route   GET /api/admin/dashboard
 * @desc    Obtener estadísticas generales del dashboard
 * @access  Admin
 */
router.get('/dashboard', adminController.getDashboardStats);

/**
 * @route   GET /api/admin/analytics/sales
 * @desc    Obtener análisis de ventas (gráficos, métricas)
 * @access  Admin
 */
router.get('/analytics/sales', adminController.getSalesAnalytics);

/**
 * @route   GET /api/admin/analytics/customers
 * @desc    Obtener análisis de clientes
 * @access  Admin
 */
router.get('/analytics/customers', adminController.getCustomerAnalytics);

/**
 * @route   GET /api/admin/analytics/products
 * @desc    Obtener análisis de productos (más vendidos, etc.)
 * @access  Admin
 */
router.get('/analytics/products', adminController.getProductAnalytics);

// =============================================
// GESTIÓN DE PRODUCTOS
// =============================================

/**
 * @route   GET /api/admin/products
 * @desc    Obtener todos los productos (con filtros)
 * @access  Admin
 */
router.get('/products', adminController.getAllProducts);

/**
 * @route   POST /api/admin/products
 * @desc    Crear nuevo producto
 * @access  Admin
 */
router.post('/products', adminController.createProduct);

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Actualizar producto
 * @access  Admin
 */
router.put('/products/:id', adminController.updateProduct);

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Eliminar producto
 * @access  Admin
 */
router.delete('/products/:id', adminController.deleteProduct);

/**
 * @route   POST /api/admin/products/:id/featured
 * @desc    Marcar/desmarcar producto como destacado
 * @access  Admin
 */
router.post('/products/:id/featured', adminController.toggleProductFeatured);

// =============================================
// GESTIÓN DE INVENTARIO (PEPS)
// =============================================

/**
 * @route   GET /api/admin/inventory
 * @desc    Obtener resumen de inventario
 * @access  Admin
 */
router.get('/inventory', inventoryController.getInventorySummary);

/**
 * @route   GET /api/admin/inventory/:productId
 * @desc    Obtener inventario de un producto específico
 * @access  Admin
 */
router.get('/inventory/:productId', inventoryController.getProductInventory);

/**
 * @route   POST /api/admin/inventory/:productId/batch
 * @desc    Agregar nuevo lote (entrada de inventario)
 * @access  Admin
 */
router.post('/inventory/:productId/batch', inventoryController.addBatch);

/**
 * @route   PUT /api/admin/inventory/:productId/adjust
 * @desc    Ajustar inventario manualmente
 * @access  Admin
 */
router.put('/inventory/:productId/adjust', inventoryController.adjustInventory);

/**
 * @route   POST /api/admin/inventory/:productId/damage
 * @desc    Reportar producto dañado
 * @access  Admin
 */
router.post('/inventory/:productId/damage', inventoryController.reportDamage);

/**
 * @route   GET /api/admin/inventory/alerts/low-stock
 * @desc    Obtener productos con stock bajo
 * @access  Admin
 */
router.get('/inventory/alerts/low-stock', inventoryController.getLowStockAlerts);

/**
 * @route   GET /api/admin/inventory/alerts/expiring
 * @desc    Obtener lotes próximos a vencer
 * @access  Admin
 */
router.get('/inventory/alerts/expiring', inventoryController.getExpiringBatches);

// =============================================
// GESTIÓN DE PEDIDOS
// =============================================

/**
 * @route   GET /api/admin/orders
 * @desc    Obtener todos los pedidos (con filtros)
 * @access  Admin
 */
router.get('/orders', adminController.getAllOrders);

/**
 * @route   GET /api/admin/orders/:id
 * @desc    Obtener detalles de un pedido
 * @access  Admin
 */
router.get('/orders/:id', adminController.getOrderDetails);

/**
 * @route   PUT /api/admin/orders/:id/status
 * @desc    Actualizar estado del pedido
 * @access  Admin
 */
router.put('/orders/:id/status', adminController.updateOrderStatus);

/**
 * @route   POST /api/admin/orders/:id/tracking
 * @desc    Agregar número de seguimiento
 * @access  Admin
 */
router.post('/orders/:id/tracking', adminController.addTrackingNumber);

/**
 * @route   GET /api/admin/orders/pending/old
 * @desc    Obtener pedidos pendientes antiguos
 * @access  Admin
 */
router.get('/orders/pending/old', adminController.getOldPendingOrders);

// =============================================
// GESTIÓN DE CLIENTES
// =============================================

/**
 * @route   GET /api/admin/customers
 * @desc    Obtener lista de clientes
 * @access  Admin
 */
router.get('/customers', adminController.getAllCustomers);

/**
 * @route   GET /api/admin/customers/:id
 * @desc    Obtener detalles de un cliente
 * @access  Admin
 */
router.get('/customers/:id', adminController.getCustomerDetails);

/**
 * @route   GET /api/admin/customers/:id/orders
 * @desc    Obtener historial de pedidos de un cliente
 * @access  Admin
 */
router.get('/customers/:id/orders', adminController.getCustomerOrders);

/**
 * @route   PUT /api/admin/customers/:id/status
 * @desc    Activar/desactivar cuenta de cliente
 * @access  Admin
 */
router.put('/customers/:id/status', adminController.updateCustomerStatus);

// =============================================
// GESTIÓN DE CUPONES
// =============================================

/**
 * @route   GET /api/admin/coupons
 * @desc    Obtener todos los cupones
 * @access  Admin
 */
router.get('/coupons', couponController.getAllCoupons);

/**
 * @route   POST /api/admin/coupons
 * @desc    Crear nuevo cupón
 * @access  Admin
 */
router.post('/coupons', couponController.createCoupon);

/**
 * @route   GET /api/admin/coupons/:id
 * @desc    Obtener detalles de un cupón
 * @access  Admin
 */
router.get('/coupons/:id', couponController.getCouponDetails);

/**
 * @route   PUT /api/admin/coupons/:id
 * @desc    Actualizar cupón
 * @access  Admin
 */
router.put('/coupons/:id', couponController.updateCoupon);

/**
 * @route   DELETE /api/admin/coupons/:id
 * @desc    Eliminar cupón
 * @access  Admin
 */
router.delete('/coupons/:id', couponController.deleteCoupon);

/**
 * @route   POST /api/admin/coupons/:id/toggle
 * @desc    Activar/desactivar cupón
 * @access  Admin
 */
router.post('/coupons/:id/toggle', couponController.toggleCouponStatus);

/**
 * @route   GET /api/admin/coupons/stats/usage
 * @desc    Obtener estadísticas de uso de cupones
 * @access  Admin
 */
router.get('/coupons/stats/usage', couponController.getCouponStats);

// =============================================
// GESTIÓN DE CATEGORÍAS
// =============================================

/**
 * @route   GET /api/admin/categories
 * @desc    Obtener todas las categorías
 * @access  Admin
 */
router.get('/categories', categoryController.getAllCategories);

/**
 * @route   POST /api/admin/categories
 * @desc    Crear nueva categoría
 * @access  Admin
 */
router.post('/categories', categoryController.createCategory);

/**
 * @route   PUT /api/admin/categories/:id
 * @desc    Actualizar categoría
 * @access  Admin
 */
router.put('/categories/:id', categoryController.updateCategory);

/**
 * @route   DELETE /api/admin/categories/:id
 * @desc    Eliminar categoría
 * @access  Admin
 */
router.delete('/categories/:id', categoryController.deleteCategory);

/**
 * @route   GET /api/admin/categories/tree
 * @desc    Obtener árbol de categorías
 * @access  Admin
 */
router.get('/categories/tree', categoryController.getCategoryTree);

// =============================================
// MARKETING Y PROMOCIONES
// =============================================

/**
 * @route   POST /api/admin/marketing/email
 * @desc    Enviar campaña de email marketing
 * @access  Admin
 */
router.post('/marketing/email', adminController.sendEmailCampaign);

/**
 * @route   GET /api/admin/marketing/campaigns
 * @desc    Obtener historial de campañas
 * @access  Admin
 */
router.get('/marketing/campaigns', adminController.getCampaigns);

/**
 * @route   POST /api/admin/products/:id/seasonal
 * @desc    Marcar producto como estacional
 * @access  Admin
 */
router.post('/products/:id/seasonal', adminController.markAsSeasonalProduct);

// =============================================
// REPORTES
// =============================================

/**
 * @route   GET /api/admin/reports/sales
 * @desc    Generar reporte de ventas
 * @access  Admin
 * @query   startDate, endDate, format (json, csv, pdf)
 */
router.get('/reports/sales', adminController.generateSalesReport);

/**
 * @route   GET /api/admin/reports/inventory
 * @desc    Generar reporte de inventario
 * @access  Admin
 */
router.get('/reports/inventory', adminController.generateInventoryReport);

/**
 * @route   GET /api/admin/reports/customers
 * @desc    Generar reporte de clientes
 * @access  Admin
 */
router.get('/reports/customers', adminController.generateCustomerReport);

// =============================================
// LOG DE RUTAS CONFIGURADAS
// =============================================

console.log('✅ Rutas de administrador configuradas:');
console.log('   📊 Dashboard y Analytics');
console.log('   📱 Gestión de Productos');
console.log('   📦 Gestión de Inventario PEPS');
console.log('   🛒 Gestión de Pedidos');
console.log('   👥 Gestión de Clientes');
console.log('   🎟️ Gestión de Cupones');
console.log('   📂 Gestión de Categorías');
console.log('   📧 Marketing y Promociones');
console.log('   📈 Reportes y Análisis');

module.exports = router;