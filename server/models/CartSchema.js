const mongoose = require('mongoose');

// Cart Item Schema
const CartItemSchema = new mongoose.Schema({
  productVariant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // Price at time of adding to cart
  totalPrice: { type: Number, required: true }, // quantity * price
}, { _id: false });

// Cart Schema - for shopping cart only
const CartSchema = new mongoose.Schema({
  // User reference
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Cart items
  items: [CartItemSchema],
  
  // Cart total (calculated automatically)
  total: { type: Number, default: 0 },
  
}, { timestamps: true });

// Indexes for performance
CartSchema.index({ user: 1 }); // Find user's cart
CartSchema.index({ updatedAt: -1 }); // Recent updates first

// Pre-save middleware to calculate totals
CartSchema.pre('save', function(next) {
  // Calculate each item's total price FIRST
  this.items.forEach(item => {
    item.totalPrice = item.quantity * item.price;
  });
  
  // Then calculate total from updated totalPrice values
  this.total = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  next();
});

// Static method to find or create user cart (with backward compatibility)
CartSchema.statics.findOrCreateCart = async function(userId) {
  console.log('🔍 Looking for cart for user:', userId);
  
  // First try to find cart with new structure (no type field)
  let cart = await this.findOne({ 
    user: userId,
    type: { $exists: false } // Only carts without type field (new structure)
  });
  
  console.log('🔍 New structure cart found:', cart ? 'YES' : 'NO');
  if (cart) {
    console.log('🔍 Cart items length:', cart.items ? cart.items.length : 'undefined');
  }

  // If not found, try to find old-style cart and migrate it
  if (!cart) {
    console.log('🔍 Looking for old-style cart...');
    const oldCart = await this.findOne({ 
      user: userId,
      type: 'cart' // Old structure with type field
    });
    
    console.log('🔍 Old-style cart found:', oldCart ? 'YES' : 'NO');
    if (oldCart) {
      console.log('🔍 Old cart items length:', oldCart.items ? oldCart.items.length : 'undefined');
      console.log('🔄 Found old-style cart, migrating...');
      
      // Migrate old cart to new structure
      await this.updateOne(
        { _id: oldCart._id },
        { 
          $unset: { 
            type: 1, 
            orderCode: 1, 
            status: 1, 
            address: 1, 
            voucher: 1, 
            discountAmount: 1, 
            shippingFee: 1, 
            finalTotal: 1, 
            paymentMethod: 1, 
            paymentStatus: 1, 
            orderPlacedAt: 1,
            cartUpdatedAt: 1
          }
        }
      );
      
      // Now fetch the migrated cart
      cart = await this.findOne({ 
        user: userId,
        type: { $exists: false }
      });
      
      console.log('✅ Cart migrated successfully, items:', cart?.items?.length);
    }
  }

  // If still no cart, create new one
  if (!cart) {
    console.log('🆕 Creating new cart...');
    cart = new this({
      user: userId,
      items: []
    });
    await cart.save();
    console.log('✅ Created new cart');
  }

  // Populate cart items
  if (cart && cart.items && cart.items.length > 0) {
    console.log('🔄 Populating cart items...');
    await cart.populate([
      {
        path: 'items.productVariant',
        populate: [
          { path: 'product', select: 'name description images' },
          { path: 'color', select: 'name isActive' },
          { path: 'size', select: 'name' }
        ]
      }
    ]);
    console.log('✅ Cart items populated');
  } else {
    console.log('ℹ️  No items to populate');
  }

  console.log('🎯 Final cart items length:', cart?.items?.length);
  return cart;
};

// Instance method to add item to cart
CartSchema.methods.addItem = function(productVariantId, quantity, price) {
  // Validate input parameters
  if (!productVariantId) {
    throw new Error('productVariantId is required');
  }
  
  console.log('🛒 CartSchema.addItem called', { 
    productVariantId: productVariantId.toString(), 
    quantity, 
    price 
  });
  // console.log('📋 Current cart items before adding:', this.items.map(item => ({ 
  //   id: item.productVariant ? item.productVariant.toString() : 'NULL', 
  //   quantity: item.quantity 
  // })));
  
  const existingItemIndex = this.items.findIndex(
    item => {
      if (!item.productVariant) return false;
      
      // Handle all possible productVariant types:
      // 1. ObjectId
      // 2. Populated object with _id
      // 3. String ObjectId
      let itemVariantId;
      
      if (typeof item.productVariant === 'object' && item.productVariant._id) {
        // Populated object
        itemVariantId = item.productVariant._id.toString();
      } else if (typeof item.productVariant === 'object' && !item.productVariant._id) {
        // Direct ObjectId object
        itemVariantId = item.productVariant.toString();
      } else {
        // String ObjectId
        itemVariantId = item.productVariant.toString();
      }
      
      const targetVariantId = productVariantId.toString();
      
      console.log('🔍 Comparing variants:', {
        itemVariantType: typeof item.productVariant,
        hasId: !!item.productVariant._id,
        itemVariantId,
        targetVariantId,
        match: itemVariantId === targetVariantId
      });
      
      return itemVariantId === targetVariantId;
    }
  );

  console.log('🔍 Existing item index:', existingItemIndex);

  if (existingItemIndex > -1) {
    // Update existing item - merge quantity
    console.log('🔄 Merging with existing item - old quantity:', this.items[existingItemIndex].quantity, 'adding:', quantity);
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].totalPrice = 
      this.items[existingItemIndex].quantity * this.items[existingItemIndex].price;
    console.log('✅ New quantity after merge:', this.items[existingItemIndex].quantity);
  } else {
    // Add new item
    console.log('➕ Adding new item to cart');
    this.items.push({
      productVariant: productVariantId,
      quantity,
      price,
      totalPrice: quantity * price
    });
  }

  // console.log('📋 Cart items after adding:', this.items.map(item => ({ 
  //   id: item.productVariant ? item.productVariant.toString() : 'NULL', 
  //   quantity: item.quantity 
  // })));

  return this.save();
};

// Instance method to update item quantity
CartSchema.methods.updateItem = function(productVariantId, quantity) {
  // Validate input parameters
  if (!productVariantId) {
    throw new Error('productVariantId is required');
  }
  
  console.log('🔄 CartSchema.updateItem called', { productVariantId, quantity });
  // console.log('📋 Current cart items:', this.items.map(item => ({ 
  //   id: item.productVariant && item.productVariant._id ? item.productVariant._id.toString() : 
  //       item.productVariant ? item.productVariant.toString() : 'NULL', 
  //   quantity: item.quantity 
  // })));
  
  const item = this.items.find(
    item => {
      if (!item.productVariant) return false;
      const itemId = item.productVariant._id ? item.productVariant._id.toString() : item.productVariant.toString();
      return itemId === productVariantId.toString();
    }
  );

  console.log('🔍 Found item:', item ? `YES (current quantity: ${item.quantity})` : 'NO');

  if (item) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      console.log('🗑️ Removing item (quantity <= 0)');
      this.items = this.items.filter(
        item => {
          if (!item.productVariant) return false;
          const itemId = item.productVariant._id ? item.productVariant._id.toString() : item.productVariant.toString();
          return itemId !== productVariantId.toString();
        }
      );
    } else {
      // Update quantity
      console.log('🔄 Updating quantity from', item.quantity, 'to', quantity);
      item.quantity = quantity;
      item.totalPrice = item.quantity * item.price;
      console.log('✅ Updated item:', { quantity: item.quantity, totalPrice: item.totalPrice });
    }
  } else {
    console.log('❌ Item not found in cart');
  }

  return this.save();
};

// Instance method to remove item from cart
CartSchema.methods.removeItem = function(productVariantId) {
  // Validate input parameters
  if (!productVariantId) {
    throw new Error('productVariantId is required');
  }
  
  console.log('🗑️ CartSchema.removeItem called', { productVariantId });
  // console.log('📋 Current cart items before removal:', this.items.map(item => ({ 
  //   id: item.productVariant && item.productVariant._id ? item.productVariant._id.toString() : 
  //       item.productVariant ? item.productVariant.toString() : 'NULL', 
  //   quantity: item.quantity 
  // })));
  
  this.items = this.items.filter(
    item => {
      if (!item.productVariant) return true; // Keep items without productVariant for debugging
      const itemId = item.productVariant._id ? item.productVariant._id.toString() : item.productVariant.toString();
      return itemId !== productVariantId.toString();
    }
  );
  
  // console.log('📋 Cart items after removal:', this.items.map(item => ({ 
  //   id: item.productVariant && item.productVariant._id ? item.productVariant._id.toString() : 
  //       item.productVariant ? item.productVariant.toString() : 'NULL', 
  //   quantity: item.quantity 
  // })));
  console.log('✅ Item removed, saving cart...');
  
  return this.save();
};

// Instance method to clear cart
CartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

module.exports = mongoose.model('Cart', CartSchema);
