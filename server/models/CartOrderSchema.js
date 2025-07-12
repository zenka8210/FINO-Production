const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  productVariant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // Price at time of adding to cart
  totalPrice: { type: Number, required: true }, // quantity * price
}, { _id: false });

const CartOrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Cart-specific fields
  type: { 
    type: String, 
    enum: ['cart', 'order'], 
    default: 'cart',
    required: true 
  },
  
  // Common fields for both cart and order
  items: [CartItemSchema],
  
  // Order-specific fields (null for cart)
  address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', default: null },
  voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },
  paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod', default: null },
  
  // Pricing fields
  subtotal: { type: Number, default: 0 }, // Sum of all item totalPrices
  discountAmount: { type: Number, default: 0 }, // From voucher
  shippingFee: { type: Number, default: 0 }, // Calculated based on address
  finalTotal: { type: Number, default: 0 }, // subtotal - discountAmount + shippingFee
  
  // Status fields
  status: { 
    type: String, 
    enum: ['cart', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'cart' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'paid', 'refunded'], 
    default: 'unpaid' 
  },
  
  // Order code (generated when cart becomes order)
  orderCode: { type: String, unique: true, sparse: true }, // Only for orders, not carts
  
  // Metadata
  cartUpdatedAt: { type: Date, default: Date.now }, // Last cart update
  orderPlacedAt: { type: Date }, // When cart became order
  
}, { timestamps: true });

// Indexes for performance
CartOrderSchema.index({ user: 1, type: 1 }); // Find user's cart/orders
CartOrderSchema.index({ status: 1 }); // Filter by status
CartOrderSchema.index({ orderCode: 1 }); // Quick order lookup

// Pre-save middleware to calculate totals
CartOrderSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculate final total
  this.finalTotal = this.subtotal - this.discountAmount + this.shippingFee;
  
  // Update cart timestamp
  if (this.type === 'cart') {
    this.cartUpdatedAt = new Date();
  }
  
  next();
});

// Pre-save middleware for item totalPrice calculation
CartOrderSchema.pre('save', function(next) {
  this.items.forEach(item => {
    item.totalPrice = item.quantity * item.price;
  });
  next();
});

// Methods
CartOrderSchema.methods.convertToOrder = function(orderData) {
  this.type = 'order';
  this.status = 'pending';
  this.address = orderData.address;
  this.paymentMethod = orderData.paymentMethod;
  this.voucher = orderData.voucher || null;
  this.discountAmount = orderData.discountAmount || 0;
  this.shippingFee = orderData.shippingFee || 0;
  this.orderPlacedAt = new Date();
  
  // Generate unique order code
  this.orderCode = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
  
  return this.save();
};

CartOrderSchema.methods.addItem = function(productVariant, quantity, price) {
  const existingItem = this.items.find(item => 
    item.productVariant.toString() === productVariant.toString()
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.totalPrice = existingItem.quantity * existingItem.price;
  } else {
    this.items.push({
      productVariant,
      quantity,
      price,
      totalPrice: quantity * price
    });
  }
  
  return this.save();
};

CartOrderSchema.methods.removeItem = function(productVariantId) {
  this.items = this.items.filter(item => 
    item.productVariant.toString() !== productVariantId.toString()
  );
  return this.save();
};

CartOrderSchema.methods.updateItemQuantity = function(productVariantId, newQuantity) {
  const item = this.items.find(item => 
    item.productVariant.toString() === productVariantId.toString()
  );
  
  if (item) {
    if (newQuantity <= 0) {
      return this.removeItem(productVariantId);
    } else {
      item.quantity = newQuantity;
      item.totalPrice = item.quantity * item.price;
      return this.save();
    }
  }
  
  throw new Error('Item not found in cart');
};

CartOrderSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// Static methods
CartOrderSchema.statics.findOrCreateCart = async function(userId) {
  let cart = await this.findOne({ user: userId, type: 'cart' });
  
  if (!cart) {
    cart = new this({
      user: userId,
      type: 'cart',
      items: []
    });
    await cart.save();
  }
  
  return cart;
};

module.exports = mongoose.models.CartOrder || mongoose.model('CartOrder', CartOrderSchema);
