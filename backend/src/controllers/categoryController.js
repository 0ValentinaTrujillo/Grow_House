// =============================================
// CONTROLADOR CATEGORÍAS - GROW HOUSE
// =============================================

const Category = require('../models/Category');
const Product = require('../models/product');

console.log('📂 Inicializando controlador de categorías');

// =============================================
// CRUD DE CATEGORÍAS
// =============================================

/**
 * Obtener todas las categorías
 */
exports.getAllCategories = async (req, res) => {
    try {
        const { active, featured, parent, search, sort = 'order' } = req.query;
        
        const query = {};
        
        if (active === 'true') query.isActive = true;
        if (featured === 'true') query.isFeatured = true;
        if (parent === 'null') query.parent = null;
        else if (parent) query.parent = parent;
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        const categories = await Category.find(query)
            .populate('parent', 'name slug')
            .sort(sort);
        
        res.json({
            success: true,
            data: categories,
            count: categories.length
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo categorías:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorías',
            error: error.message
        });
    }
};

/**
 * Obtener árbol jerárquico de categorías
 */
exports.getCategoryTree = async (req, res) => {
    try {
        const tree = await Category.getCategoryTree();
        
        res.json({
            success: true,
            data: tree
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo árbol de categorías:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener árbol de categorías',
            error: error.message
        });
    }
};

/**
 * Obtener detalles de una categoría
 */
exports.getCategoryDetails = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parent', 'name slug');
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }
        
        // Obtener subcategorías
        const subcategories = await category.getSubcategories();
        
        // Obtener breadcrumb
        const breadcrumb = await category.getBreadcrumb();
        
        res.json({
            success: true,
            data: {
                ...category.toObject(),
                subcategories,
                breadcrumb
            }
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categoría',
            error: error.message
        });
    }
};

/**
 * Crear nueva categoría
 */
exports.createCategory = async (req, res) => {
    try {
        console.log('📂 Creando nueva categoría...');
        
        const category = await Category.create(req.body);
        
        console.log(`✅ Categoría creada: ${category.name}`);
        
        res.status(201).json({
            success: true,
            message: 'Categoría creada exitosamente',
            data: category
        });
        
    } catch (error) {
        console.error('❌ Error creando categoría:', error);
        
        // Error de nombre duplicado
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una categoría con ese nombre',
                error: error.message
            });
        }
        
        res.status(400).json({
            success: false,
            message: 'Error al crear categoría',
            error: error.message
        });
    }
};

/**
 * Actualizar categoría
 */
exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }
        
        console.log(`✅ Categoría actualizada: ${category.name}`);
        
        res.json({
            success: true,
            message: 'Categoría actualizada exitosamente',
            data: category
        });
        
    } catch (error) {
        console.error('❌ Error actualizando categoría:', error);
        res.status(400).json({
            success: false,
            message: 'Error al actualizar categoría',
            error: error.message
        });
    }
};

/**
 * Eliminar categoría
 */
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }
        
        // Verificar si tiene productos asociados
        const productCount = await Product.countDocuments({ category: category.name });
        
        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar. Hay ${productCount} productos en esta categoría`
            });
        }
        
        // Verificar si tiene subcategorías
        const subcategoryCount = await Category.countDocuments({ parent: req.params.id });
        
        if (subcategoryCount > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar. Tiene ${subcategoryCount} subcategorías`
            });
        }
        
        await category.deleteOne();
        
        console.log(`🗑️ Categoría eliminada: ${category.name}`);
        
        res.json({
            success: true,
            message: 'Categoría eliminada exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error eliminando categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar categoría',
            error: error.message
        });
    }
};

// =============================================
// GESTIÓN DE PRODUCTOS EN CATEGORÍAS
// =============================================

/**
 * Obtener productos de una categoría
 */
exports.getCategoryProducts = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }
        
        const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
        
        const products = await Product.find({ 
            category: category.name,
            status: 'active'
        })
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        const total = await Product.countDocuments({ category: category.name });
        
        res.json({
            success: true,
            data: {
                category: {
                    id: category._id,
                    name: category.name,
                    slug: category.slug
                },
                products,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo productos de la categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos de la categoría',
            error: error.message
        });
    }
};

/**
 * Actualizar contador de productos de una categoría
 */
exports.updateProductCount = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }
        
        await category.updateProductCount();
        
        res.json({
            success: true,
            message: 'Contador actualizado',
            data: {
                productCount: category.productCount
            }
        });
        
    } catch (error) {
        console.error('❌ Error actualizando contador:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar contador de productos',
            error: error.message
        });
    }
};

/**
 * Actualizar contadores de todas las categorías
 */
exports.updateAllProductCounts = async (req, res) => {
    try {
        console.log('🔄 Actualizando contadores de todas las categorías...');
        
        const categories = await Category.find();
        
        for (const category of categories) {
            await category.updateProductCount();
        }
        
        console.log(`✅ ${categories.length} categorías actualizadas`);
        
        res.json({
            success: true,
            message: `${categories.length} categorías actualizadas exitosamente`
        });
        
    } catch (error) {
        console.error('❌ Error actualizando contadores:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar contadores',
            error: error.message
        });
    }
};

// =============================================
// ESTADÍSTICAS Y REPORTES
// =============================================

/**
 * Obtener estadísticas de categorías
 */
exports.getCategoryStats = async (req, res) => {
    try {
        console.log('📊 Obteniendo estadísticas de categorías...');
        
        const stats = await Category.getCategoryStats();
        const topCategories = await Category.getTopCategories(10);
        
        res.json({
            success: true,
            data: {
                summary: stats[0] || {},
                topCategories
            }
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de categorías',
            error: error.message
        });
    }
};

/**
 * Obtener categorías principales (sin padre)
 */
exports.getMainCategories = async (req, res) => {
    try {
        const categories = await Category.getMainCategories();
        
        res.json({
            success: true,
            data: categories,
            count: categories.length
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo categorías principales:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorías principales',
            error: error.message
        });
    }
};

/**
 * Obtener categorías destacadas
 */
exports.getFeaturedCategories = async (req, res) => {
    try {
        const categories = await Category.getFeaturedCategories();
        
        res.json({
            success: true,
            data: categories,
            count: categories.length
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo categorías destacadas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorías destacadas',
            error: error.message
        });
    }
};

/**
 * Marcar/desmarcar categoría como destacada
 */
exports.toggleFeatured = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }
        
        category.isFeatured = !category.isFeatured;
        await category.save();
        
        console.log(`${category.isFeatured ? '⭐' : '☆'} ${category.name} - Destacada: ${category.isFeatured}`);
        
        res.json({
            success: true,
            message: `Categoría ${category.isFeatured ? 'marcada' : 'desmarcada'} como destacada`,
            data: { isFeatured: category.isFeatured }
        });
        
    } catch (error) {
        console.error('❌ Error cambiando estado destacado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado destacado',
            error: error.message
        });
    }
};

/**
 * Reordenar categorías
 */
exports.reorderCategories = async (req, res) => {
    try {
        const { categories } = req.body; // Array de { id, order }
        
        console.log('🔄 Reordenando categorías...');
        
        const promises = categories.map(item => 
            Category.findByIdAndUpdate(item.id, { order: item.order })
        );
        
        await Promise.all(promises);
        
        console.log(`✅ ${categories.length} categorías reordenadas`);
        
        res.json({
            success: true,
            message: 'Categorías reordenadas exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error reordenando categorías:', error);
        res.status(500).json({
            success: false,
            message: 'Error al reordenar categorías',
            error: error.message
        });
    }
};

console.log('✅ Controlador de categorías configurado');
console.log('📂 Funcionalidades disponibles:');
console.log('   📋 CRUD completo de categorías');
console.log('   🌳 Árbol jerárquico');
console.log('   📱 Gestión de productos por categoría');
console.log('   📊 Estadísticas y reportes');
console.log('   ⭐ Categorías destacadas');
console.log('   🔄 Reordenamiento');