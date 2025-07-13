const mongoose = require('mongoose');

// Cart Item Schema - aligned with OrderDetailsSchema structure
const CartItemSchema = new mongoose.Schema({
  productVariant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // Price at time of adding to cart
  totalPrice: { type: Number, required: true }, // quantity * price
}, { _id: false });

// Cart Schema - extends Order Schema structure
const CartSchema = new mongoose.Schema({
  // User reference - same as Order
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Type field to distinguish cart vs order
  type: { 
    type: String, 
    enum: ['cart', 'order'], 
    default: 'cart',
    required: true 
  },
  
  // Order code - only for orders, null for carts (sparse index)
  orderCode: { 
    type: String, 
    unique: true, 
    sparse: true, // Only for orders, not carts
    index: true // Optimize search like OrderSchema
  },
  
  // Items - same structure as Order
  items: [CartItemSchema],
  
  // Address - required for orders, optional for carts
  address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', default: null },
  
  // Pricing fields - exactly same as OrderSchema
  total: { type: Number, default: 0 }, // Total before discount and shipping
  voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },
  discountAmount: { type: Number, default: 0 }, // Discount from voucher
  shippingFee: { type: Number, default: 0 }, // Shipping fee (calculated based on address)
  finalTotal: { type: Number, default: 0 }, // total - discountAmount + shippingFee
  
  // Status fields - extended from OrderSchema
  status: { 
    type: String, 
    enum: ['cart', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'cart' 
  },
  
  // Payment fields - same as OrderSchema
  paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod', default: null },
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'paid', 'refunded'], 
    default: 'unpaid' 
  },
  
  // Cart-specific metadata
  cartUpdatedAt: { type: Date, default: Date.now }, // Last cart update
  orderPlacedAt: { type: Date }, // When cart became order
  
}, { timestamps: true });

// Indexes for performance - same pattern as OrderSchema
CartSchema.index({ user: 1, type: 1 }); // Find user's cart/orders
CartSchema.index({ user: 1, createdAt: -1 }); // User order history
CartSchema.index({ status: 1 }); // Filter by status
CartSchema.index({ orderCode: 1 }); // Quick order lookup
CartSchema.index({ createdAt: -1 }); // Recent items first

// Pre-save middleware to calculate totals - same logic as OrderSchema
CartSchema.pre('save', function(next) {
  // Calculate total from items
  this.total = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculate final total: total - discount + shipping
  this.finalTotal = this.total - this.discountAmount + this.shippingFee;
  
  // Update cart timestamp
  if (this.type === 'cart') {
    this.cartUpdatedAt = new Date();
  }
  
  // Set order placed timestamp when converting to order
  if (this.type === 'order' && !this.orderPlacedAt) {
    this.orderPlacedAt = new Date();
  }
  
  next();
});

// Pre-save middleware for item totalPrice calculation
CartSchema.pre('save', function(next) {
  this.items.forEach(item => {
    item.totalPrice = item.quantity * item.price;
  });
  next();
});

// Static method to generate order code - same as OrderSchema
CartSchema.statics.generateOrderCode = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  // Format: DH + YYYYMMDD + 5 digit counter (DH = Đơn Hàng)
  const prefix = `DH${year}${month}${day}`;
  
  // Find last order in day
  const lastOrder = await this.findOne({
    orderCode: { $regex: `^${prefix}` },
    type: 'order'
  }).sort({ orderCode: -1 });
  
  let counter = 1;
  if (lastOrder) {
    const lastCounter = parseInt(lastOrder.orderCode.slice(-5));
    counter = lastCounter + 1;
  }
  
  return `${prefix}${counter.toString().padStart(5, '0')}`;
};

// Static method to find or create user cart
CartSchema.statics.findOrCreateCart = async function(userId) {
  let cart = await this.findOne({ 
    user: userId, 
    type: 'cart' 
  }).populate([
    {
      path: 'items.productVariant',
      populate: [
        { path: 'product', select: 'name description images isActive' },
        { path: 'color', select: 'name hexCode' },
        { path: 'size', select: 'name' }
      ]
    }
  ]);
  
  if (!cart) {
    cart = await this.create({
      user: userId,
      type: 'cart',
      items: [],
      status: 'cart'
    });
  }
  
  return cart;
};

// Instance method to convert cart to order
CartSchema.methods.convertToOrder = async function(orderDetails) {
  // Generate order code
  const orderCode = await this.constructor.generateOrderCode();
  
  // Update cart to order
  this.type = 'order';
  this.orderCode = orderCode;
  this.status = 'pending';
  this.address = orderDetails.address;
  this.paymentMethod = orderDetails.paymentMethod;
  this.voucher = orderDetails.voucher || null;
  this.discountAmount = orderDetails.discountAmount || 0;
  this.shippingFee = orderDetails.shippingFee || 0;
  this.orderPlacedAt = new Date();
  
  await this.save();
  
  // Populate order details
  await this.populate([
    'user',
    'address', 
    'voucher', 
    'paymentMethod',
    {
      path: 'items.productVariant',
      populate: [
        { path: 'product', select: 'name description images' },
        { path: 'color', select: 'name hexCode' },
        { path: 'size', select: 'name' }
      ]
    }
  ]);
  
  return this;
};

// Instance method to add item to cart
CartSchema.methods.addItem = function(productVariantId, quantity, price) {
  const existingItemIndex = this.items.findIndex(
    item => item.productVariant.toString() === productVariantId.toString()
  );
  
  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      productVariant: productVariantId,
      quantity: quantity,
      price: price,
      totalPrice: quantity * price
    });
  }
  
  this.cartUpdatedAt = new Date();
  return this.save();
};

// Instance method to update item quantity
CartSchema.methods.updateItemQuantity = function(productVariantId, quantity) {
  const itemIndex = this.items.findIndex(
    item => item.productVariant.toString() === productVariantId.toString()
  );
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }
  
  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    this.items.splice(itemIndex, 1);
  } else {
    // Update quantity
    this.items[itemIndex].quantity = quantity;
  }
  
  this.cartUpdatedAt = new Date();
  return this.save();
};

// Instance method to remove item
CartSchema.methods.removeItem = function(productVariantId) {
  this.items = this.items.filter(
    item => item.productVariant.toString() !== productVariantId.toString()
  );
  
  this.cartUpdatedAt = new Date();
  return this.save();
};

// Instance method to clear cart
CartSchema.methods.clearCart = function() {
  this.items = [];
  this.voucher = null;
  this.discountAmount = 0;
  this.shippingFee = 0;
  this.cartUpdatedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Cart', CartSchema);
