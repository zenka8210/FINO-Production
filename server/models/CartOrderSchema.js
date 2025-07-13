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
  
  // Order-specific fields (null for cart) - Aligned with OrderSchema
  orderCode: { 
    type: String, 
    unique: true, 
    sparse: true, // Only for orders, not carts
    index: true // Optimize search like OrderSchema
  },
  address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', default: null },
  voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },
  paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod', default: null },
  
  // Pricing fields - Aligned with OrderSchema naming
  total: { type: Number, default: 0 }, // Renamed from subtotal to match OrderSchema
  discountAmount: { type: Number, default: 0 }, // From voucher - same as OrderSchema
  shippingFee: { type: Number, default: 0 }, // Calculated based on address - same as OrderSchema
  finalTotal: { type: Number, default: 0 }, // total - discountAmount + shippingFee - same as OrderSchema
  
  // Status fields - Aligned with OrderSchema
  status: { 
    type: String, 
    enum: ['cart', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'cart' 
  },
  paymentStatus: { // Renamed from 'Status' to 'paymentStatus' for clarity
    type: String, 
    enum: ['unpaid', 'paid', 'refunded'], // Added 'refunded' for better order management
    default: 'unpaid' 
  },
  
  // Metadata
  cartUpdatedAt: { type: Date, default: Date.now }, // Last cart update
  orderPlacedAt: { type: Date }, // When cart became order
  
}, { timestamps: true });

// Indexes for performance - Same pattern as OrderSchema
CartOrderSchema.index({ user: 1, type: 1 }); // Find user's cart/orders
CartOrderSchema.index({ status: 1 }); // Filter by status
CartOrderSchema.index({ orderCode: 1 }); // Quick order lookup

// Pre-save middleware to calculate totals
CartOrderSchema.pre('save', function(next) {
  // Calculate total (renamed from subtotal to match OrderSchema)
  this.total = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculate final total - same formula as OrderSchema
  this.finalTotal = this.total - this.discountAmount + this.shippingFee;
  
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

// Static method to generate order code - Same as OrderSchema
CartOrderSchema.statics.generateOrderCode = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  // Format: CO + YYYYMMDD + 5 digit counter (CO = Cart Order)
  const prefix = `CO${year}${month}${day}`;
  
  // Find last order in day
  const lastOrder = await this.findOne({
    orderCode: { $regex: `^${prefix}` }
  }).sort({ orderCode: -1 });
  
  let counter = 1;
  if (lastOrder) {
    const lastCounter = parseInt(lastOrder.orderCode.slice(-5));
    counter = lastCounter + 1;
  }
  
  const orderCode = prefix + String(counter).padStart(5, '0');
  return orderCode;
};

// Static method to check stock availability - Same as OrderSchema
CartOrderSchema.statics.checkStockAvailability = async function(items) {
  const ProductVariant = require('./ProductVariantSchema');
  
  for (const item of items) {
    const variant = await ProductVariant.findById(item.productVariant);
    if (!variant) {
      throw new Error(`Product variant ${item.productVariant} không tồn tại`);
    }
    
    if (variant.stock < item.quantity) {
      throw new Error(`Sản phẩm ${variant.product} không đủ số lượng. Còn lại: ${variant.stock}, yêu cầu: ${item.quantity}`);
    }
  }
  
  return true;
};

// Instance method to check if order can be reviewed - Same as OrderSchema
CartOrderSchema.methods.canBeReviewed = function() {
  return this.status === 'delivered';
};

// Methods
CartOrderSchema.methods.convertToOrder = async function(orderData) {
  // Check stock availability before converting
  await this.constructor.checkStockAvailability(this.items);
  
  this.type = 'order';
  this.status = 'pending';
  this.address = orderData.address;
  this.paymentMethod = orderData.paymentMethod;
  this.voucher = orderData.voucher || null;
  this.discountAmount = orderData.discountAmount || 0;
  this.shippingFee = orderData.shippingFee || 0;
  this.orderPlacedAt = new Date();
  
  // Generate unique order code using static method
  this.orderCode = await this.constructor.generateOrderCode();
  
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
