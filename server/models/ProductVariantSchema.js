const mongoose = require('mongoose');

const ProductVariantSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  color: { type: mongoose.Schema.Types.ObjectId, ref: 'Color', required: true },
  size: { type: mongoose.Schema.Types.ObjectId, ref: 'Size', required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, min: 0 }, // Stock cannot be negative
  sku: { type: String, unique: true }, // SKU for inventory tracking
  images: [String],
  isActive: { type: Boolean, default: true } // quản lí ẩn hiện nếu stock hết hàng
}, { timestamps: true });

// Virtual for checking if variant is in stock
ProductVariantSchema.virtual('isInStock').get(function() {
  return this.stock > 0;
});

// Index for unique combination of product, color, size
ProductVariantSchema.index({ product: 1, color: 1, size: 1 }, { unique: true });

// ========== BUSINESS LOGIC VALIDATIONS ==========

// Pre-save validation: Ensure color and size are valid and active
ProductVariantSchema.pre('save', async function(next) {
  // Only run validation if color or size is modified
  if (this.isModified('color') || this.isModified('size') || this.isNew) {
    try {
      const Color = require('./ColorSchema');
      const Size = require('./SizeSchema');
      
      // Validate color exists and is active
      if (this.color) {
        const color = await Color.findById(this.color);
        if (!color) {
          throw new Error('Color không tồn tại trong hệ thống');
        }
        if (!color.isActive) {
          throw new Error('Color đã bị vô hiệu hóa, không thể sử dụng cho variant');
        }
      }
      
      // Validate size exists and is active
      if (this.size) {
        const size = await Size.findById(this.size);
        if (!size) {
          throw new Error('Size không tồn tại trong hệ thống');
        }
        if (!size.isActive) {
          throw new Error('Size đã bị vô hiệu hóa, không thể sử dụng cho variant');
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Static method: Validate variant requirements
ProductVariantSchema.statics.validateVariantRequirements = async function(productId, colorId, sizeId) {
  const Product = require('./ProductSchema');
  const Color = require('./ColorSchema');
  const Size = require('./SizeSchema');
  
  const validationResult = {
    valid: true,
    errors: [],
    details: {}
  };
  
  // Check product
  if (productId) {
    const product = await Product.findById(productId);
    if (!product) {
      validationResult.valid = false;
      validationResult.errors.push('Product không tồn tại');
    } else if (!product.isActive) {
      validationResult.valid = false;
      validationResult.errors.push('Product đã bị vô hiệu hóa');
    } else {
      validationResult.details.product = {
        id: product._id,
        name: product.name,
        isActive: product.isActive
      };
    }
  }
  
  // Check color - REQUIRED and must be valid
  if (!colorId) {
    validationResult.valid = false;
    validationResult.errors.push('Color là bắt buộc cho variant');
  } else {
    const color = await Color.findById(colorId);
    if (!color) {
      validationResult.valid = false;
      validationResult.errors.push('Color không tồn tại trong hệ thống');
    } else if (!color.isActive) {
      validationResult.valid = false;
      validationResult.errors.push('Color đã bị vô hiệu hóa, không thể sử dụng cho variant');
    } else {
      validationResult.details.color = {
        id: color._id,
        name: color.name,
        value: color.value,
        isActive: color.isActive
      };
    }
  }
  
  // Check size - REQUIRED and must be valid
  if (!sizeId) {
    validationResult.valid = false;
    validationResult.errors.push('Size là bắt buộc cho variant');
  } else {
    const size = await Size.findById(sizeId);
    if (!size) {
      validationResult.valid = false;
      validationResult.errors.push('Size không tồn tại trong hệ thống');
    } else if (!size.isActive) {
      validationResult.valid = false;
      validationResult.errors.push('Size đã bị vô hiệu hóa, không thể sử dụng cho variant');
    } else {
      validationResult.details.size = {
        id: size._id,
        name: size.name,
        value: size.value,
        isActive: size.isActive
      };
    }
  }
  
  return validationResult;
};

// Static method: Check if variant can be safely deleted
ProductVariantSchema.statics.canDeleteVariant = async function(variantId) {
  const Cart = require('./CartSchema');
  const Order = require('./OrderSchema');
  
  // Check if variant is used in any active carts
  const activeCartCount = await Cart.countDocuments({
    'items.productVariant': variantId
  });
  
  // Check if variant is used in any orders
  const orderCount = await Order.countDocuments({
    'items.productVariant': variantId
  });
  
  if (activeCartCount > 0 || orderCount > 0) {
    return {
      canDelete: false,
      reason: `Variant đang được sử dụng trong ${activeCartCount} giỏ hàng và ${orderCount} đơn hàng`,
      usage: {
        activeCartCount,
        orderCount,
        totalUsage: activeCartCount + orderCount
      }
    };
  }
  
  return {
    canDelete: true,
    reason: 'Variant có thể xóa an toàn',
    usage: {
      activeCartCount: 0,
      orderCount: 0,
      totalUsage: 0
    }
  };
};

ProductVariantSchema.set('toJSON', { virtuals: true });
ProductVariantSchema.set('toObject', { virtuals: true }); 

module.exports = mongoose.model('ProductVariant', ProductVariantSchema);