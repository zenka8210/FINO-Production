const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Tên danh mục là bắt buộc'], 
    unique: true, 
    trim: true,
    minlength: [2, 'Tên danh mục phải có ít nhất 2 ký tự'],
    maxlength: [100, 'Tên danh mục không được vượt quá 100 ký tự']
  },
  description: { 
    type: String,
    maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
  },
  parent: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    default: null 
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 0 // 0 = root level, 1 = first child, etc.
  }
}, { timestamps: true });

// Validate không thể set parent là chính nó (prevent circular reference)
CategorySchema.pre('save', function(next) {
  if (this.parent && this.parent.toString() === this._id.toString()) {
    const error = new Error('Danh mục không thể làm cha của chính nó');
    return next(error);
  }
  next();
});

// Business logic methods
CategorySchema.statics.canDeleteCategory = async function(categoryId) {
  const Product = require('./ProductSchema');
  
  // Check if category has child categories
  const childCategories = await this.countDocuments({ parent: categoryId });
  if (childCategories > 0) {
    throw new Error('Không thể xóa danh mục có chứa danh mục con');
  }
  
  // Check if category has products
  const productsCount = await Product.countDocuments({ category: categoryId });
  if (productsCount > 0) {
    throw new Error(`Không thể xóa danh mục vì còn ${productsCount} sản phẩm đang sử dụng`);
  }
  
  return true;
};

CategorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
  
  // Build tree structure
  const categoryMap = {};
  const tree = [];
  
  // First pass: create map
  categories.forEach(cat => {
    categoryMap[cat._id] = { ...cat.toObject(), children: [] };
  });
  
  // Second pass: build tree
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

module.exports = mongoose.model('Category', CategorySchema);
