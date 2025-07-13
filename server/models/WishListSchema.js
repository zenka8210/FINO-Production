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

// Index for performance
WishListSchema.index({ 'items.product': 1 });
WishListSchema.index({ 'items.variant': 1 });

module.exports = mongoose.model('WishList', WishListSchema);
