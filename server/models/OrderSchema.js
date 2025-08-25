const mongoose = require('mongoose');

const OrderDetailsSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  productVariant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  
  // 🆕 PRODUCT/VARIANT SNAPSHOT - Backup product & variant data to prevent data loss when variant is deleted
  productSnapshot: {
    productId: { type: mongoose.Schema.Types.ObjectId },
    productName: { type: String },
    productDescription: { type: String },
    productImages: [String], // 🆕 Store product parent images for fallback
    variantId: { type: mongoose.Schema.Types.ObjectId },
    variantSku: { type: String },
    variantPrice: { type: Number },
    variantStock: { type: Number },
    variantImages: [String],
    colorId: { type: mongoose.Schema.Types.ObjectId },
    colorName: { type: String },
    sizeId: { type: mongoose.Schema.Types.ObjectId },
    sizeName: { type: String },
    snapshotCreatedAt: { type: Date, default: Date.now }
  }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderCode: { 
    type: String, 
    unique: true, 
    required: true
  }, // Mã đơn hàng thân thiện: FINO2025071100001
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [OrderDetailsSchema],
  address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true }, // Địa chỉ giao hàng (reference)
  
  // 🆕 ADDRESS SNAPSHOT - Backup address data to prevent data loss when address is deleted
  addressSnapshot: {
    fullName: { type: String },
    phone: { type: String },
    addressLine: { type: String },
    ward: { type: String },
    district: { type: String },
    city: { type: String },
    postalCode: { type: String },
    isDefault: { type: Boolean, default: false },
    snapshotCreatedAt: { type: Date, default: Date.now }
  },
  total: { type: Number }, // Tổng tiền trước khi áp dụng voucher và phí vận chuyển
  voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },
  discountAmount: { type: Number, default: 0 }, // Số tiền giảm giá từ voucher
  shippingFee: { type: Number, required: true }, // Phí vận chuyển (tính động)
  finalTotal: { type: Number }, // Tổng tiền sau khi áp dụng voucher và phí vận chuyển (total - discountAmount + shippingFee)
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod', required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled'], default: 'pending' }, // Updated for VNPay
  paymentDetails: { // VNPay payment details
    transactionNo: { type: String }, // VNPay transaction number
    bankCode: { type: String }, // Bank code from VNPay
    payDate: { type: String }, // Payment date from VNPay
    responseCode: { type: String }, // VNPay response code
    paymentMethod: { type: String }, // Payment method (VNPay, COD, etc.)
    source: { type: String }, // 'callback' or 'IPN'
    paidAt: { type: Date }, // When payment was completed
    failedAt: { type: Date }, // When payment failed
    updatedAt: { type: Date } // Last update time
  }
}, { timestamps: true });

// Index để tối ưu truy vấn
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

// Static method to generate order code
OrderSchema.statics.generateOrderCode = async function() {
  const maxAttempts = 5;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      // Format: FINO + YYYYMMDD + counter (5 digits)
      const prefix = `FINO${year}${month}${day}`;
      
      // Find last order of today to get counter
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      
      const lastOrder = await this.findOne({
        createdAt: { $gte: startOfDay, $lt: endOfDay }
      }).sort({ createdAt: -1 });
      
      let counter = 1;
      if (lastOrder && lastOrder.orderCode && lastOrder.orderCode.startsWith(prefix)) {
        // Extract counter from last order code 
        const lastCounterMatch = lastOrder.orderCode.match(/(\d{5})$/);
        if (lastCounterMatch) {
          counter = parseInt(lastCounterMatch[1]) + 1;
        }
      }
      
      // Add milliseconds for additional uniqueness in high-concurrency scenarios
      if (attempt > 1) {
        counter += Math.floor(now.getMilliseconds() / 100); // Add 0-9 based on milliseconds
      }
      
      // Counter với 5 chữ số: 00001, 00002, etc.
      const counterStr = counter.toString().padStart(5, '0');
      
      const orderCode = `${prefix}${counterStr}`;
      
      // Check if this orderCode already exists (additional safety)
      const existingOrder = await this.findOne({ orderCode });
      if (!existingOrder) {
        return orderCode;
      }
      
      console.log(`⚠️ OrderCode ${orderCode} already exists, retry attempt ${attempt}/${maxAttempts}`);
      
      // Add small delay to reduce race condition probability
      await new Promise(resolve => setTimeout(resolve, 10 + attempt * 5));
      
    } catch (error) {
      console.error(`❌ Error generating orderCode (attempt ${attempt}):`, error.message);
      if (attempt === maxAttempts) {
        throw new Error('Failed to generate unique orderCode after maximum attempts');
      }
    }
  }
  
  throw new Error('Failed to generate unique orderCode');
};

// Static method to create order from cart
OrderSchema.statics.createFromCart = async function(cart, orderDetails) {
  console.log('🏪 OrderSchema.createFromCart called');
  
  // Generate order code
  const orderCode = await this.generateOrderCode();
  console.log('📋 Generated order code:', orderCode);
  
  // Calculate totals using CURRENT PRODUCT PRICES (not stored cart prices)
  let total = 0;
  const orderItems = [];
  
  for (const item of cart.items) {
    // PRIORITY: Apply product sale logic first, then fallback to variant price
    const ProductService = require('../services/productService');
    const productService = new ProductService();
    
    // First, check if product has valid sale price
    let productWithSaleInfo = item.productVariant?.product?.toObject ? 
      item.productVariant.product.toObject() : 
      item.productVariant?.product;
    
    productWithSaleInfo = productService.addSaleInfoToProduct(productWithSaleInfo);
    
    let currentPrice;
    
    // Use currentPrice from productService (which handles all sale logic and date validation)
    if (productWithSaleInfo.currentPrice) {
      currentPrice = productWithSaleInfo.currentPrice;
      console.log('💰 Using computed currentPrice from productService:', {
        productName: productWithSaleInfo.name,
        variantId: item.productVariant._id,
        isOnSale: productWithSaleInfo.isOnSale,
        salePrice: productWithSaleInfo.salePrice,
        regularPrice: productWithSaleInfo.price,
        currentPrice: currentPrice
      });
    } else {
      // Fallback to variant price or product regular price
      const variantPrice = item.productVariant?.price;
      currentPrice = variantPrice && variantPrice > 0 ? variantPrice : productWithSaleInfo.price;
      
      console.log('💰 Using fallback pricing (currentPrice not set):', {
        productName: productWithSaleInfo.name,
        variantId: item.productVariant._id,
        variantPrice: variantPrice,
        productPrice: productWithSaleInfo.price,
        currentPrice: currentPrice
      });
    }
    
    const itemTotal = currentPrice * item.quantity;
    
    console.log('💰 Final item pricing:', {
      productName: item.productVariant?.product?.name || 'Unknown',
      currentPrice: currentPrice,
      quantity: item.quantity,
      itemTotal: itemTotal
    });
    
    total += itemTotal;
    
    // 🆕 CREATE PRODUCT/VARIANT SNAPSHOT to prevent data loss when variant is deleted
    let productSnapshot = null;
    try {
      if (item.productVariant && typeof item.productVariant === 'object') {
        // If populated, use the data directly
        const variant = item.productVariant;
        const product = variant.product;
        
        productSnapshot = {
          productId: product?._id,
          productName: product?.name,
          productDescription: product?.description,
          productImages: product?.images || [], // 🆕 Store product parent images
          variantId: variant._id,
          variantSku: variant.sku,
          variantPrice: variant.price,
          variantStock: variant.stock,
          variantImages: variant.images || [],
          colorId: variant.color?._id,
          colorName: variant.color?.name,
          sizeId: variant.size?._id,
          sizeName: variant.size?.name,
          snapshotCreatedAt: new Date()
        };
        console.log('💾 Created product snapshot:', productSnapshot.productName, productSnapshot.colorName, productSnapshot.sizeName);
      } else {
        // If not populated, fetch the data
        const ProductVariant = mongoose.model('ProductVariant');
        const variant = await ProductVariant.findById(item.productVariant)
          .populate('product', 'name description images') // 🆕 Include images in populate
          .populate('color', 'name')
          .populate('size', 'name');
          
        if (variant) {
          productSnapshot = {
            productId: variant.product?._id,
            productName: variant.product?.name,
            productDescription: variant.product?.description,
            productImages: variant.product?.images || [], // 🆕 Store product parent images
            variantId: variant._id,
            variantSku: variant.sku,
            variantPrice: variant.price,
            variantStock: variant.stock,
            variantImages: variant.images || [],
            colorId: variant.color?._id,
            colorName: variant.color?.name,
            sizeId: variant.size?._id,
            sizeName: variant.size?.name,
            snapshotCreatedAt: new Date()
          };
          console.log('💾 Fetched and created product snapshot:', productSnapshot.productName);
        } else {
          console.log('⚠️  Warning: ProductVariant not found for snapshot creation');
        }
      }
    } catch (error) {
      console.error('❌ Error creating product snapshot:', error);
    }
    
    orderItems.push({
      productVariant: item.productVariant,
      quantity: item.quantity,
      price: currentPrice, // Use correctly calculated current price (sale priority)
      totalPrice: itemTotal, // Calculate from correct price
      productSnapshot // 🆕 Add product snapshot
    });
  }
  
  const finalTotal = total - (orderDetails.discountAmount || 0) + (orderDetails.shippingFee || 0);
  
  // 🆕 CREATE ADDRESS SNAPSHOT to prevent data loss
  let addressSnapshot = null;
  if (orderDetails.addressData) {
    // If full address data is provided, use it directly
    addressSnapshot = {
      fullName: orderDetails.addressData.fullName,
      phone: orderDetails.addressData.phone,
      addressLine: orderDetails.addressData.addressLine,
      ward: orderDetails.addressData.ward,
      district: orderDetails.addressData.district,
      city: orderDetails.addressData.city,
      postalCode: orderDetails.addressData.postalCode,
      isDefault: orderDetails.addressData.isDefault || false,
      snapshotCreatedAt: new Date()
    };
    console.log('💾 Using provided address data for snapshot');
  } else if (orderDetails.address) {
    // If only addressId is provided, fetch address data
    try {
      const Address = mongoose.model('Address');
      const addressData = await Address.findById(orderDetails.address);
      if (addressData) {
        addressSnapshot = {
          fullName: addressData.fullName,
          phone: addressData.phone,
          addressLine: addressData.addressLine,
          ward: addressData.ward,
          district: addressData.district,
          city: addressData.city,
          postalCode: addressData.postalCode,
          isDefault: addressData.isDefault || false,
          snapshotCreatedAt: new Date()
        };
        console.log('💾 Fetched and created address snapshot:', addressSnapshot.fullName);
      } else {
        console.log('⚠️  Warning: Address not found for snapshot creation');
      }
    } catch (error) {
      console.error('❌ Error creating address snapshot:', error);
    }
  }
  
  // Create new order
  const orderData = {
    orderCode,
    user: cart.user,
    items: orderItems, // Use calculated items with current prices
    address: orderDetails.address,
    addressSnapshot, // 🆕 Add address snapshot
    paymentMethod: orderDetails.paymentMethod,
    voucher: orderDetails.voucher || null,
    total,
    discountAmount: orderDetails.discountAmount || 0,
    shippingFee: orderDetails.shippingFee || 0,
    finalTotal,
    status: 'pending',
    paymentStatus: 'pending' // Updated to match enum values
  };
  
  console.log('💾 Creating order with data:', {
    orderCode: orderData.orderCode,
    user: orderData.user,
    total: orderData.total,
    finalTotal: orderData.finalTotal
  });
  
  // Create order with retry logic for duplicate orderCode
  let order;
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      order = await this.create(orderData);
      console.log('✅ Order created in Order collection:', order._id);
      break; // Success, exit loop
    } catch (error) {
      attempts++;
      
      // Check if it's a duplicate key error for orderCode
      if (error.code === 11000 && error.message.includes('orderCode')) {
        console.log(`⚠️ Duplicate orderCode detected, attempt ${attempts}/${maxAttempts}`);
        
        if (attempts < maxAttempts) {
          // Generate new orderCode and retry
          orderData.orderCode = await this.generateOrderCode();
          console.log('🔄 Generated new orderCode:', orderData.orderCode);
        } else {
          console.error('❌ Failed to create order after maximum attempts');
          throw new Error('Failed to create order: Maximum attempts exceeded for unique orderCode generation');
        }
      } else {
        // Other errors, throw immediately
        throw error;
      }
    }
  }
  
  // Populate order details
  await order.populate([
    'user',
    'address', 
    'voucher', 
    'paymentMethod',
    {
      path: 'items.productVariant',
      populate: [
        { path: 'product', select: 'name description images' },
        { path: 'color', select: 'name isActive' },
        { path: 'size', select: 'name' }
      ]
    }
  ]);
  
  console.log('✅ Order populated and ready to return:', order._id);
  
  // Queue order confirmation email
  try {
    const backgroundJobService = require('../services/backgroundJobService');
    const jobId = backgroundJobService.queueOrderEmail(
      order.user.email,
      order.user.name,
      order
    );
    console.log('📧 Order confirmation email queued with job ID:', jobId);
  } catch (error) {
    console.error('❌ Failed to queue order confirmation email:', error.message);
  }
  
  return order;
};

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
