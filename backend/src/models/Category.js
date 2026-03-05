// =============================================
// MODELO CATEGORÍA - GROW HOUSE ECOMMERCE
// =============================================

const mongoose = require('mongoose');

console.log('📂 Iniciando creación del modelo Category...');

// =============================================
// ESQUEMA DE CATEGORÍA
// =============================================

const categorySchema = new mongoose.Schema({
    
    // =============================================
    // INFORMACIÓN BÁSICA
    // =============================================
    
    name: {
        type: String,
        required: [true, 'El nombre de la categoría es obligatorio'],
        unique: true,
        trim: true,
        minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
        maxlength: [50, 'El nombre no puede tener más de 50 caracteres'],
        index: true
    },
    
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción no puede tener más de 500 caracteres']
    },
    
    // =============================================
    // CATEGORÍA PADRE (PARA SUBCATEGORÍAS)
    // =============================================
    
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    
    // =============================================
    // IMAGEN Y DISEÑO
    // =============================================
    
    image: {
        type: String,
        validate: {
            validator: function(url) {
                if (!url) return true;
                try {
                    const trustedDomains = [
                        'images.unsplash.com',
                        'unsplash.com',
                        'cloudinary.com',
                        'imgur.com',
                        'amazonaws.com'
                    ];
                    const urlObj = new URL(url);
                    const hasImageExtension = /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url);
                    const isTrustedDomain = trustedDomains.some(domain => 
                        urlObj.hostname.includes(domain)
                    );
                    return isTrustedDomain || hasImageExtension;
                } catch {
                    return false;
                }
            },
            message: 'La URL de la imagen no es válida'
        }
    },
    
    icon: {
        type: String,
        trim: true,
        maxlength: [50, 'El icono no puede tener más de 50 caracteres']
    },
    
    color: {
        type: String,
        trim: true,
        validate: {
            validator: function(color) {
                if (!color) return true;
                // Validar formato hexadecimal (#RRGGBB)
                return /^#[0-9A-F]{6}$/i.test(color);
            },
            message: 'El color debe estar en formato hexadecimal (#RRGGBB)'
        }
    },
    
    // =============================================
    // CONFIGURACIÓN Y ESTADO
    // =============================================
    
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    
    isFeatured: {
        type: Boolean,
        default: false,
        index: true
    },
    
    order: {
        type: Number,
        default: 0,
        min: [0, 'El orden no puede ser negativo']
    },
    
    // =============================================
    // SEO
    // =============================================
    
    metaTitle: {
        type: String,
        trim: true,
        maxlength: [60, 'El meta título no puede tener más de 60 caracteres']
    },
    
    metaDescription: {
        type: String,
        trim: true,
        maxlength: [160, 'La meta descripción no puede tener más de 160 caracteres']
    },
    
    keywords: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    
    // =============================================
    // ESTADÍSTICAS
    // =============================================
    
    productCount: {
        type: Number,
        default: 0,
        min: [0, 'El contador de productos no puede ser negativo']
    },
    
    totalSales: {
        type: Number,
        default: 0,
        min: [0, 'El total de ventas no puede ser negativo']
    },
    
    viewCount: {
        type: Number,
        default: 0,
        min: [0, 'El contador de vistas no puede ser negativo']
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

categorySchema.index({ name: 1, isActive: 1 });
categorySchema.index({ parent: 1 });

// =============================================
// CAMPOS VIRTUALES
// =============================================

categorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent'
});

categorySchema.virtual('products', {
    ref: 'Product',
    localField: 'name',
    foreignField: 'category'
});

categorySchema.virtual('isParent').get(function() {
    return !this.parent;
});

categorySchema.virtual('level').get(function() {
    return this.parent ? 2 : 1; // 1 = categoría principal, 2 = subcategoría
});

// =============================================
// MIDDLEWARE
// =============================================

categorySchema.pre('save', function(next) {
    console.log(`💾 Procesando categoría: ${this.name}`);
    
    // Generar slug automáticamente si no existe
    if (!this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[áäâà]/g, 'a')
            .replace(/[éëêè]/g, 'e')
            .replace(/[íïîì]/g, 'i')
            .replace(/[óöôò]/g, 'o')
            .replace(/[úüûù]/g, 'u')
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        console.log(`🔗 Slug generado: ${this.slug}`);
    }
    
    // Generar keywords si no existen
    if (!this.keywords || this.keywords.length === 0) {
        const words = this.name.toLowerCase().split(' ');
        this.keywords = [...new Set(words.filter(w => w.length > 2))];
        console.log(`🏷️ Keywords generadas: ${this.keywords.join(', ')}`);
    }
    
    // Configurar meta título si no existe
    if (!this.metaTitle) {
        this.metaTitle = `${this.name} - Grow House`;
    }
    
    next();
});

categorySchema.post('save', function(doc) {
    console.log(`✅ Categoría guardada: ${doc.name} (${doc.slug})`);
});

// =============================================
// MÉTODOS DE INSTANCIA
// =============================================

categorySchema.methods.incrementViewCount = function() {
    this.viewCount += 1;
    return this.save();
};

categorySchema.methods.updateProductCount = async function() {
    const Product = mongoose.model('Product');
    const count = await Product.countDocuments({ 
        category: this.name,
        status: 'active'
    });
    this.productCount = count;
    return this.save();
};

categorySchema.methods.getSubcategories = function() {
    return this.model('Category').find({ parent: this._id, isActive: true });
};

categorySchema.methods.getBreadcrumb = async function() {
    const breadcrumb = [{ name: this.name, slug: this.slug }];
    
    if (this.parent) {
        const parentCategory = await this.model('Category').findById(this.parent);
        if (parentCategory) {
            breadcrumb.unshift({ name: parentCategory.name, slug: parentCategory.slug });
        }
    }
    
    return breadcrumb;
};

// =============================================
// MÉTODOS ESTÁTICOS
// =============================================

categorySchema.statics.getMainCategories = function() {
    return this.find({ 
        parent: null, 
        isActive: true 
    }).sort({ order: 1, name: 1 });
};

categorySchema.statics.getFeaturedCategories = function() {
    return this.find({ 
        isFeatured: true, 
        isActive: true 
    }).sort({ order: 1 }).limit(6);
};

categorySchema.statics.getCategoryTree = async function() {
    const categories = await this.find({ isActive: true }).sort({ order: 1, name: 1 });
    
    // Construir árbol jerárquico
    const categoryMap = {};
    const tree = [];
    
    categories.forEach(cat => {
        categoryMap[cat._id] = { ...cat.toObject(), children: [] };
    });
    
    categories.forEach(cat => {
        if (cat.parent) {
            if (categoryMap[cat.parent]) {
                categoryMap[cat.parent].children.push(categoryMap[cat._id]);
            }
        } else {
            tree.push(categoryMap[cat._id]);
        }
    });
    
    return tree;
};

categorySchema.statics.findBySlug = function(slug) {
    return this.findOne({ slug: slug.toLowerCase(), isActive: true });
};

categorySchema.statics.getCategoryStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: null,
                totalCategories: { $sum: 1 },
                activeCategories: { 
                    $sum: { $cond: ['$isActive', 1, 0] } 
                },
                featuredCategories: { 
                    $sum: { $cond: ['$isFeatured', 1, 0] } 
                },
                totalProducts: { $sum: '$productCount' },
                totalViews: { $sum: '$viewCount' },
                totalSales: { $sum: '$totalSales' }
            }
        }
    ]);
};

categorySchema.statics.getTopCategories = function(limit = 5) {
    return this.find({ isActive: true })
        .sort({ totalSales: -1, productCount: -1 })
        .limit(limit);
};

// =============================================
// CREAR Y EXPORTAR MODELO
// =============================================

const Category = mongoose.model('Category', categorySchema);

console.log('✅ Modelo Category creado exitosamente');
console.log('📋 Collection en MongoDB: categories');

module.exports = Category;