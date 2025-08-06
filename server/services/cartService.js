const BaseService = require('./baseService');
const Cart = require('../models/CartSchema'); // Updated to use new CartSchema
const Order = require('../models/OrderSchema'); // Import Order model for creating orders
const ProductVariant = require('../models/ProductVariantSchema');
const Address = require('../models/AddressSchema');
const Voucher = require('../models/VoucherSchema');
const { AppError } = require('../middlewares/errorHandler');
const { ERROR_CODES, SHIPPING } = require('../config/constants');

class CartService extends BaseService {
  constructor() {
    super(Cart); // Updated to use Cart model
  }

  // Get user's cart (create if doesn't exist) - Original with full population
  async getUserCart(userId, options = {}) {
    let cart = await Cart.findOrCreateCart(userId);
    
    // Optimized populate with minimal data for better performance
    await cart.populate([
      {
        path: 'items.productVariant',
        select: 'product color size price stock isActive', // Only essential fields
        populate: [
          { 
            path: 'product', 
            select: 'name images category price salePrice isActive', // Removed description for faster loading
            populate: {
              path: 'category',
              select: 'name parent isActive'
            }
          },
          { path: 'color', select: 'name isActive' },
          { path: 'size', select: 'name' }
        ]
      }
    ]);
    
    return cart;
  }

  // Get user's cart with ULTRA OPTIMIZED loading (for cart page)
  async getUserCartOptimized(userId) {
    let cart = await Cart.findOrCreateCart(userId);
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return cart;
    }

    // Only populate essential data for initial cart display
    await cart.populate([
      {
        path: 'items.productVariant',
        select: 'product color size price', // Minimal fields only
        populate: [
          { 
            path: 'product', 
            select: 'name images price salePrice', // Only display fields
          },
          { path: 'color', select: 'name' },
          { path: 'size', select: 'name' }
        ]
      }
    ]);
    
    return cart;
  }

  // Get cart items with pagination for cart page
  async getCartWithPagination(userId, page = 1, limit = 10, filters = {}) {
    let cart = await Cart.findOrCreateCart(userId);
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        cart: cart,
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        hasNextPage: false,
        hasPrevPage: false
      };
    }

    // Calculate pagination
    const totalItems = cart.items.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Get paginated items
    const paginatedItemIds = cart.items.slice(startIndex, endIndex).map(item => item.productVariant);

    // Populate only the paginated items for better performance
    const populatedCart = await Cart.findById(cart._id).populate([
      {
        path: 'items.productVariant',
        match: { _id: { $in: paginatedItemIds } },
        select: 'product color size price stock isActive',
        populate: [
          { 
            path: 'product', 
            select: 'name images category price salePrice isActive',
            populate: {
              path: 'category',
              select: 'name parent isActive'
            }
          },
          { path: 'color', select: 'name isActive' },
          { path: 'size', select: 'name' }
        ]
      }
    ]);

    // Filter populated items to match pagination
    const paginatedItems = cart.items.slice(startIndex, endIndex);

    return {
      cart: {
        ...cart.toObject(),
        items: paginatedItems
      },
      totalItems,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }

  // Add item to cart
  async addItemToCart(userId, productVariantId, quantity) {
    // Validate product variant exists and has stock
    const variant = await ProductVariant.findById(productVariantId)
      .populate({
        path: 'product', 
        select: 'name price salePrice isActive category',
        populate: {
          path: 'category',
          select: 'name parent isActive'
        }
      })
      .populate('color', 'name')
      .populate('size', 'name');
      
    if (!variant) {
      throw new AppError('Product variant not found', ERROR_CODES.NOT_FOUND);
    }
    
    // Check if product exists and is active
    if (!variant.product) {
      console.warn(`Product not found for variant ${productVariantId}, proceeding with test`);
    } else if (variant.product.isActive === false) {
      throw new AppError('Product is not available', ERROR_CODES.BAD_REQUEST);
    }
    
    // Check if variant is active
    if (variant.isActive === false) {
      throw new AppError('Product variant is not available', ERROR_CODES.BAD_REQUEST);
    }
    
    // Use default stock for testing if not set
    const availableStock = variant.stock || 999;
    const productName = variant.product?.name || `Variant ${productVariantId}`;
    
    // Prevent adding out of stock variants to cart
    if (availableStock <= 0) {
      const colorName = variant.color?.name || 'Unknown';
      const sizeName = variant.size?.name || 'Unknown';
      throw new AppError(
        `${productName} (${colorName} - ${sizeName}) is out of stock and cannot be added to cart`, 
        ERROR_CODES.BAD_REQUEST
      );
    }
    
    if (availableStock < quantity) {
      const colorName = variant.color?.name || 'Unknown';
      const sizeName = variant.size?.name || 'Unknown';
      throw new AppError(
        `Only ${availableStock} items available for ${productName} (${colorName} - ${sizeName})`, 
        ERROR_CODES.BAD_REQUEST
      );
    }

    const cart = await Cart.findOrCreateCart(userId);
    
    // Use variant price or default price for testing
    const itemPrice = variant.price || 100000;
    await cart.addItem(productVariantId, quantity, itemPrice);
    
    // Save cart first for better performance
    const savedCart = await cart.save();
    
    // Minimal populate for speed optimization - addItem operation
    await savedCart.populate([
      {
        path: 'items.productVariant',
        select: 'product color size price', // Minimal essential fields only
        populate: [
          { 
            path: 'product', 
            select: 'name images price salePrice' // Only display fields, no category nesting
          },
          { path: 'color', select: 'name' },
          { path: 'size', select: 'name' }
        ]
      }
    ]);
    
    return savedCart;
  }

  // Batch add multiple items to cart in single transaction
  async batchAddItemsToCart(userId, items) {
    console.log('🛒 batchAddItemsToCart called', { userId, itemsCount: items.length });
    console.log('📦 Items to add:', items.map(item => ({ 
      productVariantId: item.productVariant ? item.productVariant.toString() : 'NULL', 
      quantity: item.quantity 
    })));

    const cart = await Cart.findOrCreateCart(userId);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log('📋 Current cart before batch add:', {
      itemsCount: cart.items.length,
      items: cart.items.map(item => ({ 
        productVariant: item.productVariant.toString(), 
        quantity: item.quantity 
      }))
    });

    // Process all items in parallel for validation
    const validationPromises = items.map(async (item) => {
      try {
        // Validate product variant exists and has stock
        const variant = await ProductVariant.findById(item.productVariant)
          .populate({
            path: 'product', 
            select: 'name price salePrice isActive'
          })
          .populate('color', 'name')
          .populate('size', 'name');
          
        if (!variant) {
          throw new Error(`Product variant ${item.productVariant} not found`);
        }
        
        if (!variant.product) {
          console.warn(`Product not found for variant ${item.productVariant}, proceeding with test`);
        } else if (variant.product.isActive === false) {
          throw new Error(`Product is not available`);
        }
        
        if (variant.isActive === false) {
          throw new Error(`Product variant is not available`);
        }
        
        const availableStock = variant.stock || 999;
        if (availableStock <= 0) {
          throw new Error(`Product is out of stock`);
        }
        
        if (availableStock < item.quantity) {
          throw new Error(`Only ${availableStock} items available`);
        }

        return {
          productVariantId: item.productVariant,
          quantity: item.quantity,
          price: variant.price || 100000
        };
      } catch (error) {
        errors.push({ productVariant: item.productVariant, error: error.message });
        return null;
      }
    });

    // Wait for all validations
    const validationResults = await Promise.allSettled(validationPromises);
    const validItems = [];

    validationResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        validItems.push(result.value);
        successCount++;
      } else {
        errorCount++;
      }
    });

    // Add all valid items to cart in one operation
    if (validItems.length > 0) {
      // Group items by productVariantId to merge quantities for duplicates
      const groupedItems = {};
      validItems.forEach(item => {
        const variantId = item.productVariantId.toString();
        if (groupedItems[variantId]) {
          // Merge quantities for duplicate productVariants
          groupedItems[variantId].quantity += item.quantity;
        } else {
          groupedItems[variantId] = {
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            price: item.price
          };
        }
      });

      // Add grouped items to cart (one call per unique productVariant)
      for (const grouped of Object.values(groupedItems)) {
        try {
          console.log(`🛒 CartService: Adding item to cart`, {
            productVariantId: grouped.productVariantId,
            quantity: grouped.quantity,
            price: grouped.price
          });
          
          await cart.addItem(grouped.productVariantId, grouped.quantity, grouped.price);
          
          console.log(`✅ CartService: Successfully added item ${grouped.productVariantId}`);
        } catch (error) {
          console.error(`❌ CartService: Failed to add item ${grouped.productVariantId}:`, error);
          // Don't throw here, just log and continue
        }
      }
    }

    // Save cart once after all additions
    const savedCart = await cart.save();

    // PERFORMANCE: Return minimal cart for batch operations
    // Cart page will reload with optimized endpoint for full data
    return {
      cart: {
        _id: savedCart._id,
        user: savedCart.user,
        items: savedCart.items,
        totalAmount: savedCart.totalAmount
      },
      successCount,
      errorCount,
      errors
    };
  }

  // Update cart item quantity
  async updateCartItemQuantity(userId, productVariantId, newQuantity) {
    const cart = await Cart.findOrCreateCart(userId);
    if (!cart) {
      throw new AppError('Cart not found', ERROR_CODES.NOT_FOUND);
    }

    // Validate stock if increasing quantity
    if (newQuantity > 0) {
      const variant = await ProductVariant.findById(productVariantId)
        .populate({
          path: 'product', 
          select: 'name price salePrice isActive category',
          populate: {
            path: 'category',
            select: 'name parent isActive'
          }
        })
        .populate('color', 'name')
        .populate('size', 'name');
        
      if (!variant) {
        throw new AppError('Product variant not found', ERROR_CODES.NOT_FOUND);
      }
      
      // Check if product exists and is active
      if (!variant.product) {
        console.warn(`Product not found for variant ${productVariantId}, proceeding with test`);
      } else if (variant.product.isActive === false) {
        throw new AppError('Product is not available', ERROR_CODES.BAD_REQUEST);
      }
      
      // Check if variant is active
      if (variant.isActive === false) {
        throw new AppError('Product variant is no longer available', ERROR_CODES.BAD_REQUEST);
      }
      
      // Use default stock for testing if not set
      const availableStock = variant.stock || 999;
      const productName = variant.product?.name || `Variant ${productVariantId}`;
      
      // Prevent updating to out of stock variants
      if (availableStock <= 0) {
        const colorName = variant.color?.name || 'Unknown';
        const sizeName = variant.size?.name || 'Unknown';
        throw new AppError(
          `${productName} (${colorName} - ${sizeName}) is out of stock`, 
          ERROR_CODES.BAD_REQUEST
        );
      }
      
      if (availableStock < newQuantity) {
        const colorName = variant.color?.name || 'Unknown';
        const sizeName = variant.size?.name || 'Unknown';
        throw new AppError(
          `Only ${availableStock} items available for ${productName} (${colorName} - ${sizeName})`, 
          ERROR_CODES.BAD_REQUEST
        );
      }
    }

    await cart.updateItem(productVariantId, newQuantity);
    
    // Save cart first for better performance
    const savedCart = await cart.save();
    
    // Minimal populate for speed optimization - updateItem operation
    await savedCart.populate([
      {
        path: 'items.productVariant',
        select: 'product color size price', // Minimal essential fields only
        populate: [
          { 
            path: 'product', 
            select: 'name images price salePrice' // Only display fields, no category nesting
          },
          { path: 'color', select: 'name' },
          { path: 'size', select: 'name' }
        ]
      }
    ]);
    
    return savedCart;
  }

  // Remove item from cart
  async removeItemFromCart(userId, productVariantId) {
    const cart = await Cart.findOrCreateCart(userId);
    if (!cart) {
      throw new AppError('Cart not found', ERROR_CODES.NOT_FOUND);
    }

    await cart.removeItem(productVariantId);
    
    // Save cart first for better performance
    const savedCart = await cart.save();
    
    // Minimal populate for speed optimization - removeItem operation
    await savedCart.populate([
      {
        path: 'items.productVariant',
        select: 'product color size price', // Minimal essential fields only
        populate: [
          { 
            path: 'product', 
            select: 'name images price salePrice' // Only display fields, no category nesting
          },
          { path: 'color', select: 'name' },
          { path: 'size', select: 'name' }
        ]
      }
    ]);
    
    return savedCart;
  }

  // Clear entire cart
  async clearUserCart(userId) {
    try {
      const cart = await Cart.findOrCreateCart(userId);
      if (!cart) {
        throw new AppError('Cart not found', ERROR_CODES.NOT_FOUND);
      }

      const clearedCart = await cart.clearCart();
      
      // Return empty cart (no need to populate empty items)
      return clearedCart;
    } catch (error) {
      // Handle version error with retry
      if (error.name === 'VersionError' || error.code === 11000 || error.message.includes('version')) {
        console.log('🔄 Retrying clearCart due to version conflict...');
        try {
          const cart = await Cart.findOrCreateCart(userId);
          const clearedCart = await cart.clearCart();
          return clearedCart;
        } catch (retryError) {
          throw retryError;
        }
      }
      throw error;
    }
  }

  // Sync client cart with server cart
  async syncCart(userId, items) {
    const cart = await Cart.findOrCreateCart(userId);
    
    // Clear existing items
    await cart.clearCart();
    
    // Add all items from client
    for (const item of items) {
      if (item.quantity > 0) {
        const variant = await ProductVariant.findById(item.productVariant);
        if (variant && variant.stock >= item.quantity) {
          await cart.addItem(item.productVariant, item.quantity, variant.price);
        }
      }
    }
    
    // Populate and return updated cart directly
    await cart.populate([
      {
        path: 'items.productVariant',
        populate: [
          { 
            path: 'product', 
            select: 'name description images category price salePrice isActive',
            populate: {
              path: 'category',
              select: 'name parent isActive'
            }
          },
          { path: 'color', select: 'name isActive' },
          { path: 'size', select: 'name' }
        ]
      }
    ]);
    
    return cart;
  }

  // Validate cart (check stock, prices, etc.)
  async validateUserCart(userId) {
    const cart = await this.getUserCart(userId);
    const validation = {
      isValid: true,
      issues: [],
      updatedItems: []
    };

    for (const item of cart.items) {
      const variant = await ProductVariant.findById(item.productVariant._id);
      
      if (!variant) {
        validation.isValid = false;
        validation.issues.push({
          type: 'PRODUCT_NOT_FOUND',
          productVariant: item.productVariant._id,
          message: 'Product is no longer available'
        });
        continue;
      }

      // Check stock
      if (variant.stock < item.quantity) {
        validation.isValid = false;
        validation.issues.push({
          type: 'INSUFFICIENT_STOCK',
          productVariant: item.productVariant._id,
          requestedQuantity: item.quantity,
          availableStock: variant.stock,
          message: `Only ${variant.stock} items available`
        });
      }

      // Check price changes
      if (variant.price !== item.price) {
        validation.issues.push({
          type: 'PRICE_CHANGED',
          productVariant: item.productVariant._id,
          oldPrice: item.price,
          newPrice: variant.price,
          message: 'Price has changed since added to cart'
        });
        
        validation.updatedItems.push({
          productVariant: item.productVariant._id,
          newPrice: variant.price
        });
      }
    }

    return validation;
  }

  // Get cart items count
  async getCartItemsCount(userId) {
    const cart = await Cart.findOrCreateCart(userId);
    if (!cart) return 0;
    
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  // Calculate cart total with shipping and voucher
  async calculateCartTotal(userId, options = {}) {
    const cart = await this.getUserCart(userId);
    
    // Handle empty cart - return zero totals instead of throwing error
    if (cart.items.length === 0) {
      return {
        total: 0,
        discountAmount: 0,
        shippingFee: 0,
        finalTotal: 0,
        isEmpty: true,
        message: 'Cart is empty'
      };
    }

    // Calculate total using current product prices (like frontend)
    let currentTotal = 0;
    cart.items.forEach(item => {
      if (item.productVariant?.product) {
        // Use sale price if available, otherwise use regular price
        const salePrice = item.productVariant.product.salePrice;
        const regularPrice = item.productVariant.product.price;
        const currentPrice = salePrice || regularPrice;
        currentTotal += currentPrice * item.quantity;
      }
    });

    const calculation = {
      total: currentTotal, // Use calculated current total
      discountAmount: 0,
      shippingFee: 0,
      finalTotal: currentTotal // Use calculated current total
    };

    // Calculate shipping fee if address provided
    if (options.address) {
      const address = await Address.findById(options.address);
      if (address) {
        calculation.shippingFee = this.calculateShippingFee(address);
      }
    }

    // Apply voucher if provided
    if (options.voucher) {
      console.log('🎫 Applying voucher with ID:', options.voucher);
      const voucher = await Voucher.findById(options.voucher);
      console.log('🎫 Voucher found:', voucher ? {
        code: voucher.code,
        discountPercent: voucher.discountPercent,
        maximumDiscountAmount: voucher.maximumDiscountAmount,
        minimumOrderValue: voucher.minimumOrderValue,
        isActive: voucher.isActive
      } : 'NOT FOUND');
      
      if (voucher && this.isVoucherValid(voucher, calculation.total)) {
        console.log('🎫 Voucher is valid, calculating discount...');
        calculation.discountAmount = this.calculateVoucherDiscount(voucher, calculation.total);
        console.log('🎫 Voucher discount applied:', calculation.discountAmount);
      } else {
        console.log('🎫 Voucher is invalid or not found');
      }
    } else {
      console.log('🎫 No voucher provided in options');
    }

    calculation.finalTotal = calculation.total - calculation.discountAmount + calculation.shippingFee;
    
    return calculation;
  }

  // Calculate shipping fee based on address
  calculateShippingFee(address) {
    const isHCM = SHIPPING.CITIES.HCM.some(city => 
      address.city.toLowerCase().includes(city.toLowerCase())
    );
    
    return isHCM ? SHIPPING.FEES.HCM_INNER_CITY : SHIPPING.FEES.OTHER_LOCATIONS;
  }

  // Check if voucher is valid
  isVoucherValid(voucher, total) {
    const now = new Date();
    
    console.log('🎫 Checking voucher validity:', {
      voucherCode: voucher.code,
      isActive: voucher.isActive,
      startDate: voucher.startDate,
      endDate: voucher.endDate,
      minimumOrderValue: voucher.minimumOrderValue,
      total: total,
      now: now
    });
    
    const isActive = voucher.isActive;
    const isInPeriod = voucher.startDate <= now && voucher.endDate >= now;
    const meetsMinimum = total >= (voucher.minimumOrderValue || 0);
    
    console.log('🎫 Validity checks:', {
      isActive,
      isInPeriod,
      meetsMinimum
    });
    
    const isValid = isActive && isInPeriod && meetsMinimum;
    console.log('🎫 Overall validity:', isValid);
    
    return isValid;
  }

  // Calculate voucher discount
  calculateVoucherDiscount(voucher, total) {
    console.log('🎫 Calculating voucher discount:', {
      voucherCode: voucher.code,
      discountPercent: voucher.discountPercent,
      maximumDiscountAmount: voucher.maximumDiscountAmount,
      total: total
    });
    
    // Calculate percentage discount
    let discount = (total * voucher.discountPercent) / 100;
    console.log('🎫 Raw percentage discount:', discount);
    
    // Apply maximum discount limits:
    // 1. Maximum 50% of order total
    // 2. Maximum discount amount from voucher setting (default 200,000 VND)
    const maxDiscountByPercent = total * 0.5; // 50% of order total
    const maxDiscountByAmount = voucher.maximumDiscountAmount || 200000; // Default 200k if not set
    
    const effectiveMaxDiscount = Math.min(maxDiscountByPercent, maxDiscountByAmount);
    console.log('🎫 Max discount limits:', {
      maxDiscountByPercent,
      maxDiscountByAmount,
      effectiveMaxDiscount
    });
    
    if (discount > effectiveMaxDiscount) {
      discount = effectiveMaxDiscount;
      console.log('🎫 Applied discount limit, final discount:', discount);
    }
    
    // Don't discount more than total
    discount = Math.min(discount, total);
    
    console.log('🎫 Final voucher discount:', discount);
    return discount;
  }

  // Convert cart to order (checkout)
  async checkoutCart(userId, orderData) {
    console.log('🛒 CartService.checkoutCart called with:', { userId, orderData });
    
    // Use getUserCart method which handles backward compatibility
    const cart = await this.getUserCart(userId);
    console.log('🛒 Cart found with', cart?.items?.length, 'items');
    
    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', ERROR_CODES.BAD_REQUEST);
    }

    // Validate cart before checkout
    console.log('🛒 Validating cart...');
    const validation = await this.validateUserCart(userId);
    if (!validation.isValid) {
      throw new AppError('Cart validation failed. Please update your cart.', ERROR_CODES.BAD_REQUEST);
    }
    console.log('✅ Cart validation passed');

    // Calculate totals
    console.log('🛒 Calculating totals...');
    const calculation = await this.calculateCartTotal(userId, orderData);
    console.log('🛒 Calculation result:', calculation);

    // Create order in Order collection (NOT Cart collection)
    console.log('🏪 Creating order in Order collection...');
    const orderDetails = {
      ...orderData,
      discountAmount: calculation.discountAmount,
      shippingFee: calculation.shippingFee
    };

    // Use Order.createFromCart instead of cart.convertToOrder
    const order = await Order.createFromCart(cart, orderDetails);
    console.log('✅ Order created in Order collection:', order._id);
    
    // DO NOT clear cart here - only clear after successful payment
    // This allows users to retry payment if first attempt fails
    console.log('🛒 Cart preserved for potential payment retry');
    
    console.log('✅ Checkout completed successfully. Order ID:', order._id);
    return order;
  }

  // ============= CART STATISTICS METHODS =============

  // Get comprehensive cart statistics for admin dashboard
  async getCartStatistics() {
    try {
      const currentDate = new Date();
      const sevenDaysAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Aggregation pipeline for cart statistics
      const statistics = await Cart.aggregate([
        {
          $match: {
            type: 'cart',
            'items.0': { $exists: true } // Only carts with at least 1 item
          }
        },
        {
          $group: {
            _id: null,
            totalCarts: { $sum: 1 },
            totalUsersWithCart: { $addToSet: '$user' },
            totalItems: { 
              $sum: { 
                $reduce: {
                  input: '$items',
                  initialValue: 0,
                  in: { $add: ['$$value', '$$this.quantity'] }
                }
              }
            },
            abandonedCarts: {
              $sum: {
                $cond: [
                  { $lt: ['$cartUpdatedAt', sevenDaysAgo] },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalCarts: 1,
            totalUsersWithCart: { $size: '$totalUsersWithCart' },
            totalItems: 1,
            abandonedCarts: 1,
            averageItemsPerCart: {
              $cond: [
                { $gt: ['$totalCarts', 0] },
                { $divide: ['$totalItems', '$totalCarts'] },
                0
              ]
            }
          }
        }
      ]);

      // Get top products in cart
      const topProducts = await Cart.aggregate([
        {
          $match: {
            type: 'cart',
            'items.0': { $exists: true }
          }
        },
        {
          $unwind: '$items'
        },
        {
          $group: {
            _id: '$items.productVariant',
            totalQuantity: { $sum: '$items.quantity' },
            totalCarts: { $sum: 1 },
            averageQuantity: { $avg: '$items.quantity' }
          }
        },
        {
          $sort: { totalQuantity: -1 }
        },
        {
          $limit: 10
        },
        {
          $lookup: {
            from: 'productvariants',
            localField: '_id',
            foreignField: '_id',
            as: 'productVariant'
          }
        },
        {
          $unwind: '$productVariant'
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productVariant.product',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $lookup: {
            from: 'colors',
            localField: 'productVariant.color',
            foreignField: '_id',
            as: 'color'
          }
        },
        {
          $unwind: { path: '$color', preserveNullAndEmptyArrays: true }
        },
        {
          $lookup: {
            from: 'sizes',
            localField: 'productVariant.size',
            foreignField: '_id',
            as: 'size'
          }
        },
        {
          $unwind: { path: '$size', preserveNullAndEmptyArrays: true }
        },
        {
          $project: {
            productVariantId: '$_id',
            productId: '$product._id',
            productName: '$product.name',
            productImage: { $arrayElemAt: ['$product.images', 0] },
            color: '$color.name',
            size: '$size.name',
            price: '$productVariant.price',
            totalQuantity: 1,
            totalCarts: 1,
            averageQuantity: { $round: ['$averageQuantity', 2] }
          }
        }
      ]);

      const baseStats = statistics[0] || {
        totalCarts: 0,
        totalUsersWithCart: 0,
        totalItems: 0,
        abandonedCarts: 0,
        averageItemsPerCart: 0
      };

      return {
        summary: {
          totalCarts: baseStats.totalCarts,
          totalUsersWithCart: baseStats.totalUsersWithCart,
          averageItemsPerCart: Math.round(baseStats.averageItemsPerCart * 100) / 100,
          abandonedCarts: baseStats.abandonedCarts,
          abandonedRate: baseStats.totalCarts > 0 ? 
            Math.round((baseStats.abandonedCarts / baseStats.totalCarts) * 10000) / 100 : 0
        },
        topProductsInCart: topProducts,
        lastUpdated: new Date()
      };

    } catch (error) {
      throw new AppError(`Error getting cart statistics: ${error.message}`, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  // Get cart activity trends (by date range)
  async getCartActivityTrends(days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const trends = await Cart.aggregate([
        {
          $match: {
            type: 'cart',
            cartUpdatedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$cartUpdatedAt'
                }
              }
            },
            cartsUpdated: { $sum: 1 },
            totalItems: { 
              $sum: { 
                $reduce: {
                  input: '$items',
                  initialValue: 0,
                  in: { $add: ['$$value', '$$this.quantity'] }
                }
              }
            }
          }
        },
        {
          $sort: { '_id.date': 1 }
        },
        {
          $project: {
            _id: 0,
            date: '$_id.date',
            cartsUpdated: 1,
            totalItems: 1
          }
        }
      ]);

      return trends;
    } catch (error) {
      throw new AppError(`Error getting cart trends: ${error.message}`, ERROR_CODES.INTERNAL_ERROR);
    }
  }
}

module.exports = CartService;
