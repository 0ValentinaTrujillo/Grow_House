// =============================================
// MODELO INVENTARIO PEPS - GROW HOUSE ECOMMERCE
// =============================================

const mongoose = require('mongoose');

console.log('📦 Iniciando creación del modelo Inventory con sistema PEPS...');

// =============================================
// ESQUEMA DE LOTE (BATCH) PARA PEPS
// =============================================

const batchSchema = new mongoose.Schema({
    batchNumber: {
        type: String,
        required: [true, 'El número de lote es obligatorio'],
        unique: true,
        trim: true
    },
    
    quantity: {
        type: Number,
        required: [true, 'La cantidad es obligatoria'],
        min: [0, 'La cantidad no puede ser negativa'],
        validate: {
            validator: function(value) {
                return Number.isInteger(value);
            },
            message: 'La cantidad debe ser un número entero'
        }
    },
    
    originalQuantity: {
        type: Number,
        required: [true, 'La cantidad original es obligatoria'],
        min: [1, 'La cantidad original debe ser al menos 1']
    },
    
    purchasePrice: {
        type: Number,
        required: [true, 'El precio de compra es obligatorio'],
        min: [0, 'El precio de compra no puede ser negativo']
    },
    
    supplier: {
        type: String,
        trim: true,
        maxlength: [100, 'El nombre del proveedor no puede tener más de 100 caracteres']
    },
    
    receivedDate: {
        type: Date,
        default: Date.now,
        required: true,
        index: true
    },
    
    expiryDate: {
        type: Date,
        validate: {
            validator: function(date) {
                if (date) {
                    return date > this.receivedDate;
                }
                return true;
            },
            message: 'La fecha de expiración debe ser posterior a la fecha de recepción'
        }
    },
    
    location: {
        type: String,
        trim: true,
        maxlength: [50, 'La ubicación no puede tener más de 50 caracteres']
    },
    
    notes: {
        type: String,
        maxlength: [500, 'Las notas no pueden tener más de 500 caracteres']
    }
}, {
    _id: true,
    timestamps: true
});

// =============================================
// ESQUEMA PRINCIPAL DE INVENTARIO
// =============================================

const inventorySchema = new mongoose.Schema({
    
    // =============================================
    // RELACIÓN CON PRODUCTO
    // =============================================
    
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El producto es obligatorio'],
        unique: true,
        index: true
    },
    
    // =============================================
    // SISTEMA PEPS - LOTES
    // =============================================
    
    batches: [batchSchema],
    
    // =============================================
    // CANTIDADES TOTALES
    // =============================================
    
    totalQuantity: {
        type: Number,
        default: 0,
        min: [0, 'La cantidad total no puede ser negativa']
    },
    
    reservedQuantity: {
        type: Number,
        default: 0,
        min: [0, 'La cantidad reservada no puede ser negativa']
    },
    
    availableQuantity: {
        type: Number,
        default: 0,
        min: [0, 'La cantidad disponible no puede ser negativa']
    },
    
    // =============================================
    // ALERTAS Y UMBRALES
    // =============================================
    
    reorderPoint: {
        type: Number,
        default: 10,
        min: [0, 'El punto de reorden no puede ser negativo']
    },
    
    reorderQuantity: {
        type: Number,
        default: 50,
        min: [1, 'La cantidad de reorden debe ser al menos 1']
    },
    
    lowStockAlerted: {
        type: Boolean,
        default: false
    },
    
    // =============================================
    // HISTORIAL DE MOVIMIENTOS
    // =============================================
    
    movements: [{
        type: {
            type: String,
            enum: ['entry', 'sale', 'adjustment', 'return', 'damage'],
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        batchNumber: {
            type: String
        },
        reason: {
            type: String,
            maxlength: [200, 'La razón no puede tener más de 200 caracteres']
        },
        relatedOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    
    // =============================================
    // ESTADÍSTICAS
    // =============================================
    
    totalSold: {
        type: Number,
        default: 0,
        min: [0, 'El total vendido no puede ser negativo']
    },
    
    totalValue: {
        type: Number,
        default: 0,
        min: [0, 'El valor total no puede ser negativo']
    },
    
    averagePurchasePrice: {
        type: Number,
        default: 0,
        min: [0, 'El precio promedio no puede ser negativo']
    },
    
    lastRestockDate: {
        type: Date
    }
    
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// =============================================
// ÍNDICES
// =============================================

inventorySchema.index({ product: 1 });
inventorySchema.index({ totalQuantity: 1 });
inventorySchema.index({ 'batches.receivedDate': 1 });

// =============================================
// CAMPOS VIRTUALES
// =============================================

inventorySchema.virtual('isLowStock').get(function() {
    return this.availableQuantity <= this.reorderPoint;
});

inventorySchema.virtual('isOutOfStock').get(function() {
    return this.availableQuantity === 0;
});

inventorySchema.virtual('needsReorder').get(function() {
    return this.isLowStock && !this.lowStockAlerted;
});

inventorySchema.virtual('batchCount').get(function() {
    return this.batches.filter(b => b.quantity > 0).length;
});

inventorySchema.virtual('oldestBatch').get(function() {
    const activeBatches = this.batches.filter(b => b.quantity > 0);
    if (activeBatches.length === 0) return null;
    return activeBatches.sort((a, b) => a.receivedDate - b.receivedDate)[0];
});

// =============================================
// MIDDLEWARE
// =============================================

inventorySchema.pre('save', function(next) {
    console.log(`💾 Procesando inventario del producto: ${this.product}`);
    
    // Calcular cantidad total de todos los lotes
    this.totalQuantity = this.batches.reduce((sum, batch) => sum + batch.quantity, 0);
    
    // Calcular cantidad disponible (total - reservada)
    this.availableQuantity = this.totalQuantity - this.reservedQuantity;
    
    // Calcular valor total del inventario
    this.totalValue = this.batches.reduce((sum, batch) => {
        return sum + (batch.quantity * batch.purchasePrice);
    }, 0);
    
    // Calcular precio promedio de compra
    if (this.totalQuantity > 0) {
        this.averagePurchasePrice = this.totalValue / this.totalQuantity;
    }
    
    console.log(`📊 Inventario actualizado:`);
    console.log(`   Total: ${this.totalQuantity} unidades`);
    console.log(`   Disponible: ${this.availableQuantity} unidades`);
    console.log(`   Lotes activos: ${this.batchCount}`);
    console.log(`   Valor total: $${this.totalValue.toLocaleString('es-CO')}`);
    
    next();
});

// =============================================
// MÉTODOS DE INSTANCIA - SISTEMA PEPS
// =============================================

/**
 * Agregar nuevo lote al inventario
 */
inventorySchema.methods.addBatch = function(batchData) {
    const { quantity, purchasePrice, supplier, expiryDate, location, notes } = batchData;
    
    // Generar número de lote
    const date = new Date();
    const batchNumber = `BATCH-${this.product}-${date.getTime()}`;
    
    const newBatch = {
        batchNumber,
        quantity,
        originalQuantity: quantity,
        purchasePrice,
        supplier,
        receivedDate: new Date(),
        expiryDate,
        location,
        notes
    };
    
    this.batches.push(newBatch);
    this.lastRestockDate = new Date();
    this.lowStockAlerted = false;
    
    // Registrar movimiento
    this.movements.push({
        type: 'entry',
        quantity,
        batchNumber,
        reason: `Nuevo lote recibido${supplier ? ` de ${supplier}` : ''}`,
        date: new Date()
    });
    
    console.log(`✅ Lote agregado: ${batchNumber} - ${quantity} unidades`);
    
    return this.save();
};

/**
 * Reducir inventario usando PEPS
 * (Primeros en Entrar, Primeros en Salir)
 */
inventorySchema.methods.reduceStock = function(quantityToReduce, orderId = null, userId = null) {
    let remaining = quantityToReduce;
    const batchesUsed = [];
    
    console.log(`📤 Reduciendo stock: ${quantityToReduce} unidades usando PEPS`);
    
    // Ordenar lotes por fecha de recepción (PEPS)
    const sortedBatches = this.batches
        .filter(b => b.quantity > 0)
        .sort((a, b) => a.receivedDate - b.receivedDate);
    
    // Reducir de los lotes más antiguos primero
    for (let batch of sortedBatches) {
        if (remaining <= 0) break;
        
        const toTake = Math.min(remaining, batch.quantity);
        batch.quantity -= toTake;
        remaining -= toTake;
        
        batchesUsed.push({
            batchNumber: batch.batchNumber,
            quantity: toTake,
            purchasePrice: batch.purchasePrice
        });
        
        console.log(`   Lote ${batch.batchNumber}: -${toTake} unidades (quedan ${batch.quantity})`);
    }
    
    if (remaining > 0) {
        throw new Error(`Stock insuficiente. Faltan ${remaining} unidades`);
    }
    
    // Registrar movimiento
    this.movements.push({
        type: 'sale',
        quantity: quantityToReduce,
        batchNumber: batchesUsed.map(b => b.batchNumber).join(', '),
        relatedOrder: orderId,
        performedBy: userId,
        date: new Date()
    });
    
    this.totalSold += quantityToReduce;
    
    console.log(`✅ Stock reducido exitosamente`);
    console.log(`📦 Lotes utilizados: ${batchesUsed.length}`);
    
    return this.save();
};

/**
 * Reservar stock para un pedido
 */
inventorySchema.methods.reserveStock = function(quantity, orderId) {
    if (this.availableQuantity < quantity) {
        throw new Error('Stock disponible insuficiente para reservar');
    }
    
    this.reservedQuantity += quantity;
    
    this.movements.push({
        type: 'adjustment',
        quantity: -quantity,
        reason: `Stock reservado para pedido`,
        relatedOrder: orderId,
        date: new Date()
    });
    
    console.log(`🔒 ${quantity} unidades reservadas para pedido ${orderId}`);
    
    return this.save();
};

/**
 * Liberar stock reservado
 */
inventorySchema.methods.releaseReservedStock = function(quantity, orderId, reason = 'Pedido cancelado') {
    this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
    
    this.movements.push({
        type: 'adjustment',
        quantity: quantity,
        reason: reason,
        relatedOrder: orderId,
        date: new Date()
    });
    
    console.log(`🔓 ${quantity} unidades liberadas: ${reason}`);
    
    return this.save();
};

/**
 * Ajustar inventario manualmente
 */
inventorySchema.methods.adjustInventory = function(batchNumber, newQuantity, reason, userId) {
    const batch = this.batches.find(b => b.batchNumber === batchNumber);
    
    if (!batch) {
        throw new Error('Lote no encontrado');
    }
    
    const difference = newQuantity - batch.quantity;
    batch.quantity = newQuantity;
    
    this.movements.push({
        type: 'adjustment',
        quantity: difference,
        batchNumber: batchNumber,
        reason: reason,
        performedBy: userId,
        date: new Date()
    });
    
    console.log(`🔧 Inventario ajustado - Lote: ${batchNumber}, Diferencia: ${difference}`);
    
    return this.save();
};

/**
 * Registrar producto dañado
 */
inventorySchema.methods.reportDamage = function(batchNumber, quantity, reason, userId) {
    const batch = this.batches.find(b => b.batchNumber === batchNumber);
    
    if (!batch) {
        throw new Error('Lote no encontrado');
    }
    
    if (batch.quantity < quantity) {
        throw new Error('Cantidad de daño mayor a la disponible en el lote');
    }
    
    batch.quantity -= quantity;
    
    this.movements.push({
        type: 'damage',
        quantity: -quantity,
        batchNumber: batchNumber,
        reason: reason,
        performedBy: userId,
        date: new Date()
    });
    
    console.log(`⚠️ Daño reportado - Lote: ${batchNumber}, Cantidad: ${quantity}`);
    
    return this.save();
};

/**
 * Obtener costo PEPS de venta
 */
inventorySchema.methods.getCostOfSale = function(quantity) {
    let remaining = quantity;
    let totalCost = 0;
    
    const sortedBatches = this.batches
        .filter(b => b.quantity > 0)
        .sort((a, b) => a.receivedDate - b.receivedDate);
    
    for (let batch of sortedBatches) {
        if (remaining <= 0) break;
        
        const toTake = Math.min(remaining, batch.quantity);
        totalCost += toTake * batch.purchasePrice;
        remaining -= toTake;
    }
    
    return totalCost;
};

// =============================================
// MÉTODOS ESTÁTICOS
// =============================================

inventorySchema.statics.getLowStockProducts = function() {
    return this.find({
        $expr: { $lte: ['$availableQuantity', '$reorderPoint'] }
    }).populate('product', 'name price category');
};

inventorySchema.statics.getOutOfStockProducts = function() {
    return this.find({
        availableQuantity: 0
    }).populate('product', 'name price category');
};

inventorySchema.statics.getExpiringBatches = function(days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return this.aggregate([
        { $unwind: '$batches' },
        {
            $match: {
                'batches.quantity': { $gt: 0 },
                'batches.expiryDate': { $lte: futureDate }
            }
        },
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
            $project: {
                productName: '$productInfo.name',
                batchNumber: '$batches.batchNumber',
                quantity: '$batches.quantity',
                expiryDate: '$batches.expiryDate',
                daysUntilExpiry: {
                    $divide: [
                        { $subtract: ['$batches.expiryDate', new Date()] },
                        1000 * 60 * 60 * 24
                    ]
                }
            }
        },
        { $sort: { expiryDate: 1 } }
    ]);
};

inventorySchema.statics.getInventoryValue = function() {
    return this.aggregate([
        {
            $group: {
                _id: null,
                totalValue: { $sum: '$totalValue' },
                totalUnits: { $sum: '$totalQuantity' },
                productsInStock: { $sum: 1 }
            }
        }
    ]);
};

// =============================================
// CREAR Y EXPORTAR MODELO
// =============================================

const Inventory = mongoose.model('Inventory', inventorySchema);

console.log('✅ Modelo Inventory creado exitosamente con sistema PEPS');
console.log('📋 Collection en MongoDB: inventories');
console.log('📦 Sistema PEPS (Primeros en Entrar, Primeros en Salir) configurado');

module.exports = Inventory;