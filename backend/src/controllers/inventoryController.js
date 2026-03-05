// =============================================
// CONTROLADOR INVENTARIO (PEPS) - GROW HOUSE
// =============================================

const Inventory = require('../models/Inventory');
const Product = require('../models/product');

console.log('📦 Inicializando controlador de inventario PEPS');

// =============================================
// RESUMEN Y CONSULTAS DE INVENTARIO
// =============================================

/**
 * Obtener resumen general del inventario
 */
exports.getInventorySummary = async (req, res) => {
    try {
        console.log('📊 Obteniendo resumen de inventario...');
        
        const [
            inventoryValue,
            lowStockCount,
            outOfStockCount,
            expiringBatches,
            totalProducts
        ] = await Promise.all([
            Inventory.getInventoryValue(),
            Inventory.find({
                $expr: { $lte: ['$availableQuantity', '$reorderPoint'] }
            }).countDocuments(),
            Inventory.find({ availableQuantity: 0 }).countDocuments(),
            Inventory.getExpiringBatches(30),
            Inventory.countDocuments()
        ]);
        
        const summary = {
            totalValue: inventoryValue[0]?.totalValue || 0,
            totalUnits: inventoryValue[0]?.totalUnits || 0,
            totalProducts: totalProducts,
            lowStockCount,
            outOfStockCount,
            expiringBatchesCount: expiringBatches.length,
            formattedValue: new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            }).format(inventoryValue[0]?.totalValue || 0)
        };
        
        console.log('✅ Resumen de inventario obtenido');
        
        res.json({
            success: true,
            data: summary
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo resumen:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen de inventario',
            error: error.message
        });
    }
};

/**
 * Obtener inventario de un producto específico
 */
exports.getProductInventory = async (req, res) => {
    try {
        const inventory = await Inventory.findOne({ 
            product: req.params.productId 
        }).populate('product', 'name price brand category mainImage');
        
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Inventario no encontrado para este producto'
            });
        }
        
        res.json({
            success: true,
            data: inventory
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo inventario del producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener inventario del producto',
            error: error.message
        });
    }
};

/**
 * Obtener alertas de stock bajo
 */
exports.getLowStockAlerts = async (req, res) => {
    try {
        const lowStockProducts = await Inventory.getLowStockProducts();
        
        res.json({
            success: true,
            data: lowStockProducts,
            count: lowStockProducts.length
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo alertas de stock bajo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener alertas de stock bajo',
            error: error.message
        });
    }
};

/**
 * Obtener lotes próximos a vencer
 */
exports.getExpiringBatches = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        
        const expiringBatches = await Inventory.getExpiringBatches(parseInt(days));
        
        res.json({
            success: true,
            data: expiringBatches,
            count: expiringBatches.length
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo lotes por vencer:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener lotes próximos a vencer',
            error: error.message
        });
    }
};

// =============================================
// GESTIÓN DE LOTES (SISTEMA PEPS)
// =============================================

/**
 * Agregar nuevo lote al inventario
 */
exports.addBatch = async (req, res) => {
    try {
        const { productId } = req.params;
        const { 
            quantity, 
            purchasePrice, 
            supplier, 
            expiryDate, 
            location, 
            notes 
        } = req.body;
        
        console.log(`📦 Agregando lote para producto: ${productId}`);
        
        // Validar que el producto existe
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        // Buscar o crear inventario
        let inventory = await Inventory.findOne({ product: productId });
        
        if (!inventory) {
            inventory = await Inventory.create({
                product: productId,
                batches: [],
                reorderPoint: product.lowStockAlert || 10
            });
        }
        
        // Agregar nuevo lote usando el método del modelo
        await inventory.addBatch({
            quantity,
            purchasePrice,
            supplier,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            location,
            notes
        });
        
        // Actualizar cantidad en el producto
        product.quantity = inventory.totalQuantity;
        await product.save();
        
        console.log(`✅ Lote agregado exitosamente`);
        
        res.status(201).json({
            success: true,
            message: 'Lote agregado exitosamente',
            data: inventory
        });
        
    } catch (error) {
        console.error('❌ Error agregando lote:', error);
        res.status(400).json({
            success: false,
            message: 'Error al agregar lote',
            error: error.message
        });
    }
};

/**
 * Ajustar inventario manualmente
 */
exports.adjustInventory = async (req, res) => {
    try {
        const { productId } = req.params;
        const { batchNumber, newQuantity, reason } = req.body;
        
        console.log(`🔧 Ajustando inventario del producto: ${productId}`);
        
        const inventory = await Inventory.findOne({ product: productId });
        
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Inventario no encontrado'
            });
        }
        
        // Ajustar usando el método del modelo
        await inventory.adjustInventory(
            batchNumber, 
            newQuantity, 
            reason, 
            req.user._id
        );
        
        // Actualizar cantidad en el producto
        const product = await Product.findById(productId);
        if (product) {
            product.quantity = inventory.totalQuantity;
            await product.save();
        }
        
        console.log(`✅ Inventario ajustado exitosamente`);
        
        res.json({
            success: true,
            message: 'Inventario ajustado exitosamente',
            data: inventory
        });
        
    } catch (error) {
        console.error('❌ Error ajustando inventario:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al ajustar inventario'
        });
    }
};

/**
 * Reportar producto dañado
 */
exports.reportDamage = async (req, res) => {
    try {
        const { productId } = req.params;
        const { batchNumber, quantity, reason } = req.body;
        
        console.log(`⚠️ Reportando daño para producto: ${productId}`);
        
        const inventory = await Inventory.findOne({ product: productId });
        
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Inventario no encontrado'
            });
        }
        
        // Reportar daño usando el método del modelo
        await inventory.reportDamage(
            batchNumber, 
            quantity, 
            reason, 
            req.user._id
        );
        
        // Actualizar cantidad en el producto
        const product = await Product.findById(productId);
        if (product) {
            product.quantity = inventory.totalQuantity;
            await product.save();
        }
        
        console.log(`✅ Daño reportado exitosamente`);
        
        res.json({
            success: true,
            message: 'Daño reportado exitosamente',
            data: inventory
        });
        
    } catch (error) {
        console.error('❌ Error reportando daño:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al reportar daño'
        });
    }
};

/**
 * Reservar stock para un pedido
 */
exports.reserveStock = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity, orderId } = req.body;
        
        console.log(`🔒 Reservando ${quantity} unidades del producto: ${productId}`);
        
        const inventory = await Inventory.findOne({ product: productId });
        
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Inventario no encontrado'
            });
        }
        
        await inventory.reserveStock(quantity, orderId);
        
        console.log(`✅ Stock reservado exitosamente`);
        
        res.json({
            success: true,
            message: 'Stock reservado exitosamente',
            data: {
                reserved: quantity,
                available: inventory.availableQuantity
            }
        });
        
    } catch (error) {
        console.error('❌ Error reservando stock:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al reservar stock'
        });
    }
};

/**
 * Liberar stock reservado
 */
exports.releaseStock = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity, orderId, reason } = req.body;
        
        console.log(`🔓 Liberando ${quantity} unidades del producto: ${productId}`);
        
        const inventory = await Inventory.findOne({ product: productId });
        
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Inventario no encontrado'
            });
        }
        
        await inventory.releaseReservedStock(quantity, orderId, reason);
        
        console.log(`✅ Stock liberado exitosamente`);
        
        res.json({
            success: true,
            message: 'Stock liberado exitosamente',
            data: {
                released: quantity,
                available: inventory.availableQuantity
            }
        });
        
    } catch (error) {
        console.error('❌ Error liberando stock:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al liberar stock'
        });
    }
};

/**
 * Procesar salida de inventario (venta) usando PEPS
 */
exports.processSale = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity, orderId } = req.body;
        
        console.log(`📤 Procesando venta de ${quantity} unidades usando PEPS`);
        
        const inventory = await Inventory.findOne({ product: productId });
        
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Inventario no encontrado'
            });
        }
        
        // Calcular costo de venta usando PEPS
        const costOfSale = inventory.getCostOfSale(quantity);
        
        // Reducir stock usando PEPS
        await inventory.reduceStock(quantity, orderId, req.user._id);
        
        // Actualizar cantidad en el producto
        const product = await Product.findById(productId);
        if (product) {
            product.quantity = inventory.totalQuantity;
            product.salesCount = (product.salesCount || 0) + quantity;
            await product.save();
        }
        
        console.log(`✅ Venta procesada exitosamente usando PEPS`);
        console.log(`   Costo de venta: $${costOfSale.toLocaleString('es-CO')}`);
        
        res.json({
            success: true,
            message: 'Venta procesada exitosamente',
            data: {
                quantitySold: quantity,
                costOfSale,
                remainingStock: inventory.totalQuantity,
                batchesUsed: inventory.batches.filter(b => b.quantity > 0).length
            }
        });
        
    } catch (error) {
        console.error('❌ Error procesando venta:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al procesar venta'
        });
    }
};

/**
 * Obtener historial de movimientos de un producto
 */
exports.getMovementHistory = async (req, res) => {
    try {
        const { productId } = req.params;
        const { limit = 50, type } = req.query;
        
        const inventory = await Inventory.findOne({ product: productId })
            .populate('movements.performedBy', 'firstName lastName email')
            .populate('movements.relatedOrder', 'orderNumber');
        
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Inventario no encontrado'
            });
        }
        
        let movements = inventory.movements;
        
        // Filtrar por tipo si se especifica
        if (type) {
            movements = movements.filter(m => m.type === type);
        }
        
        // Limitar cantidad
        movements = movements.slice(-limit);
        
        res.json({
            success: true,
            data: movements.reverse(),
            count: movements.length
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de movimientos',
            error: error.message
        });
    }
};

/**
 * Obtener reporte de inventario por categoría
 */
exports.getInventoryByCategory = async (req, res) => {
    try {
        const inventoryByCategory = await Inventory.aggregate([
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: '$productInfo' },
            {
                $group: {
                    _id: '$productInfo.category',
                    totalValue: { $sum: '$totalValue' },
                    totalUnits: { $sum: '$totalQuantity' },
                    productCount: { $sum: 1 },
                    lowStockCount: {
                        $sum: {
                            $cond: [
                                { $lte: ['$availableQuantity', '$reorderPoint'] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { totalValue: -1 } }
        ]);
        
        res.json({
            success: true,
            data: inventoryByCategory
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo inventario por categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener inventario por categoría',
            error: error.message
        });
    }
};

/**
 * Generar orden de reabastecimiento automática
 */
exports.generateReorderList = async (req, res) => {
    try {
        console.log('📋 Generando lista de reabastecimiento...');
        
        const lowStockProducts = await Inventory.find({
            $expr: { $lte: ['$availableQuantity', '$reorderPoint'] }
        }).populate('product', 'name category price brand');
        
        const reorderList = lowStockProducts.map(inv => ({
            product: {
                id: inv.product._id,
                name: inv.product.name,
                category: inv.product.category,
                brand: inv.product.brand
            },
            currentStock: inv.availableQuantity,
            reorderPoint: inv.reorderPoint,
            suggestedQuantity: inv.reorderQuantity,
            estimatedCost: inv.averagePurchasePrice * inv.reorderQuantity
        }));
        
        const totalEstimatedCost = reorderList.reduce((sum, item) => sum + item.estimatedCost, 0);
        
        console.log(`✅ Lista generada: ${reorderList.length} productos`);
        
        res.json({
            success: true,
            data: {
                products: reorderList,
                totalProducts: reorderList.length,
                totalEstimatedCost,
                formattedCost: new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                }).format(totalEstimatedCost)
            }
        });
        
    } catch (error) {
        console.error('❌ Error generando lista de reabastecimiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar lista de reabastecimiento',
            error: error.message
        });
    }
};

console.log('✅ Controlador de inventario PEPS configurado');
console.log('📦 Funcionalidades disponibles:');
console.log('   📊 Resúmenes y consultas');
console.log('   ➕ Agregar lotes (PEPS)');
console.log('   🔧 Ajustes manuales');
console.log('   ⚠️ Reporte de daños');
console.log('   🔒 Reserva y liberación de stock');
console.log('   📤 Procesamiento de ventas con PEPS');
console.log('   📋 Listas de reabastecimiento');