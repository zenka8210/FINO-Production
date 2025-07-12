const mongoose = require('mongoose');

const WishListItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  variant: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ProductVariant', 
    default: null // Cho phép null nếu chỉ lưu product
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const WishListSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true // Mỗi user chỉ có 1 wishlist
  },
  items: [WishListItemSchema]
}, { timestamps: true });

// Index for performance (chỉ giữ lại các index cần thiết, tránh duplicate với unique)
WishListSchema.index({ 'items.product': 1 });
WishListSchema.index({ 'items.variant': 1 });

// Business logic methods
WishListSchema.statics.findOrCreateUserWishList = async function(userId) {
  let wishlist = await this.findOne({ user: userId }).populate([
    {
      path: 'items.product',
      select: 'name price images isActive category'
    },
    {
      path: 'items.variant', 
      select: 'price stock color size images isActive'
    }
  ]);
  
  if (!wishlist) {
    wishlist = await this.create({ user: userId, items: [] });
    // Populate sau khi tạo
    wishlist = await this.findById(wishlist._id).populate([
      {
        path: 'items.product',
        select: 'name price images isActive category'
      },
      {
        path: 'items.variant',
        select: 'price stock color size images isActive'
      }
    ]);
  }
  
  return wishlist;
};

WishListSchema.statics.validateItemAddition = async function(productId, variantId = null) {
  const Product = require('./ProductSchema');
  const ProductVariant = require('./ProductVariantSchema');
  
  // Check if product exists and is active
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error('Sản phẩm không tồn tại');
  }
  
  if (!product.isActive) {
    throw new Error('Sản phẩm đã bị ẩn, không thể thêm vào wishlist');
  }
  
  // Check variant if provided
  if (variantId) {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      throw new Error('Biến thể sản phẩm không tồn tại');
    }
    
    if (variant.product.toString() !== productId.toString()) {
      throw new Error('Biến thể không thuộc về sản phẩm này');
    }
    
    // Note: Cho phép thêm variant hết hàng (stock = 0) theo yêu cầu
  }
  
  return true;
};

module.exports = mongoose.model('WishList', WishListSchema);
