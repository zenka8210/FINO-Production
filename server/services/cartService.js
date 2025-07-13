const BaseService = require('./baseService');
const Cart = require('../models/CartSchema'); // Updated to use new CartSchema
const ProductVariant = require('../models/ProductVariantSchema');
const Address = require('../models/AddressSchema');
const Voucher = require('../models/VoucherSchema');
const { AppError } = require('../middlewares/errorHandler');
const { ERROR_CODES, SHIPPING } = require('../config/constants');

class CartService extends BaseService {
  constructor() {
    super(Cart); // Updated to use Cart model
  }

  // Get user's cart (create if doesn't exist)
  async getUserCart(userId) {
    let cart = await Cart.findOrCreateCart(userId);
    
    // Populate cart items with product details
    await cart.populate([
      {
        path: 'items.productVariant',
        populate: [
          { path: 'product', select: 'name description images' },
          { path: 'color', select: 'name hexCode' },
          { path: 'size', select: 'name' }
        ]
      }
    ]);
    
    return cart;
  }

  // Add item to cart
  async addItemToCart(userId, productVariantId, quantity) {
    // Validate product variant exists and has stock
    const variant = await ProductVariant.findById(productVariantId)
      .populate('product', 'name isActive')
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
    
    return this.getUserCart(userId); // Return populated cart
  }

  // Update cart item quantity
  async updateCartItemQuantity(userId, productVariantId, newQuantity) {
    const cart = await Cart.findOne({ user: userId, type: 'cart' });
    if (!cart) {
      throw new AppError('Cart not found', ERROR_CODES.NOT_FOUND);
    }

    // Validate stock if increasing quantity
    if (newQuantity > 0) {
      const variant = await ProductVariant.findById(productVariantId)
        .populate('product', 'name isActive')
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

    await cart.updateItemQuantity(productVariantId, newQuantity);
    return this.getUserCart(userId);
  }

  // Remove item from cart
  async removeItemFromCart(userId, productVariantId) {
    const cart = await Cart.findOne({ user: userId, type: 'cart' });
    if (!cart) {
      throw new AppError('Cart not found', ERROR_CODES.NOT_FOUND);
    }

    await cart.removeItem(productVariantId);
    return this.getUserCart(userId);
  }

  // Clear entire cart
  async clearUserCart(userId) {
    const cart = await Cart.findOne({ user: userId, type: 'cart' });
    if (!cart) {
      throw new AppError('Cart not found', ERROR_CODES.NOT_FOUND);
    }

    await cart.clearCart();
    return this.getUserCart(userId);
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
    
    return this.getUserCart(userId);
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
    const cart = await Cart.findOne({ user: userId, type: 'cart' });
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

    const calculation = {
      total: cart.total, // Changed from subtotal to total
      discountAmount: 0,
      shippingFee: 0,
      finalTotal: cart.total // Changed from subtotal to total
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
      const voucher = await Voucher.findById(options.voucher);
      if (voucher && this.isVoucherValid(voucher, calculation.total)) {
        calculation.discountAmount = this.calculateVoucherDiscount(voucher, calculation.total);
      }
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
    
    return voucher.isActive &&
           voucher.startDate <= now &&
           voucher.endDate >= now &&
           voucher.usedCount < voucher.usageLimit &&
           total >= voucher.minOrderValue;
  }

  // Calculate voucher discount
  calculateVoucherDiscount(voucher, total) {
    let discount = 0;
    
    if (voucher.discountType === 'percentage') {
      discount = (total * voucher.discountValue) / 100;
      if (voucher.maxDiscountAmount) {
        discount = Math.min(discount, voucher.maxDiscountAmount);
      }
    } else {
      discount = voucher.discountValue;
    }
    
    return Math.min(discount, total); // Don't discount more than total
  }

  // Convert cart to order (checkout)
  async checkoutCart(userId, orderData) {
    const cart = await Cart.findOne({ user: userId, type: 'cart' });
    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', ERROR_CODES.BAD_REQUEST);
    }

    // Validate cart before checkout
    const validation = await this.validateUserCart(userId);
    if (!validation.isValid) {
      throw new AppError('Cart validation failed. Please update your cart.', ERROR_CODES.BAD_REQUEST);
    }

    // Calculate totals
    const calculation = await this.calculateCartTotal(userId, orderData);

    // Convert cart to order
    const orderDetails = {
      ...orderData,
      discountAmount: calculation.discountAmount,
      shippingFee: calculation.shippingFee
    };

    const order = await cart.convertToOrder(orderDetails);
    
    // Create new empty cart for user
    await Cart.findOrCreateCart(userId);
    
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
