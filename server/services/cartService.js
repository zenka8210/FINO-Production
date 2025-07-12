const BaseService = require('./baseService');
const CartOrder = require('../models/CartOrderSchema');
const ProductVariant = require('../models/ProductVariantSchema');
const Address = require('../models/AddressSchema');
const Voucher = require('../models/VoucherSchema');
const { AppError } = require('../middlewares/errorHandler');
const { ERROR_CODES, SHIPPING } = require('../config/constants');

class CartService extends BaseService {
  constructor() {
    super(CartOrder);
  }

  // Get user's cart (create if doesn't exist)
  async getUserCart(userId) {
    let cart = await CartOrder.findOrCreateCart(userId);
    
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
    const variant = await ProductVariant.findById(productVariantId);
    if (!variant) {
      throw new AppError('Product variant not found', ERROR_CODES.NOT_FOUND);
    }
    
    if (variant.stock < quantity) {
      throw new AppError(`Only ${variant.stock} items available in stock`, ERROR_CODES.BAD_REQUEST);
    }

    const cart = await CartOrder.findOrCreateCart(userId);
    await cart.addItem(productVariantId, quantity, variant.price);
    
    return this.getUserCart(userId); // Return populated cart
  }

  // Update cart item quantity
  async updateCartItemQuantity(userId, productVariantId, newQuantity) {
    const cart = await CartOrder.findOne({ user: userId, type: 'cart' });
    if (!cart) {
      throw new AppError('Cart not found', ERROR_CODES.NOT_FOUND);
    }

    // Validate stock if increasing quantity
    if (newQuantity > 0) {
      const variant = await ProductVariant.findById(productVariantId);
      if (!variant) {
        throw new AppError('Product variant not found', ERROR_CODES.NOT_FOUND);
      }
      
      if (variant.stock < newQuantity) {
        throw new AppError(`Only ${variant.stock} items available in stock`, ERROR_CODES.BAD_REQUEST);
      }
    }

    await cart.updateItemQuantity(productVariantId, newQuantity);
    return this.getUserCart(userId);
  }

  // Remove item from cart
  async removeItemFromCart(userId, productVariantId) {
    const cart = await CartOrder.findOne({ user: userId, type: 'cart' });
    if (!cart) {
      throw new AppError('Cart not found', ERROR_CODES.NOT_FOUND);
    }

    await cart.removeItem(productVariantId);
    return this.getUserCart(userId);
  }

  // Clear entire cart
  async clearUserCart(userId) {
    const cart = await CartOrder.findOne({ user: userId, type: 'cart' });
    if (!cart) {
      throw new AppError('Cart not found', ERROR_CODES.NOT_FOUND);
    }

    await cart.clearCart();
    return this.getUserCart(userId);
  }

  // Sync client cart with server cart
  async syncCart(userId, items) {
    const cart = await CartOrder.findOrCreateCart(userId);
    
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
    const cart = await CartOrder.findOne({ user: userId, type: 'cart' });
    if (!cart) return 0;
    
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  // Calculate cart total with shipping and voucher
  async calculateCartTotal(userId, options = {}) {
    const cart = await this.getUserCart(userId);
    
    if (cart.items.length === 0) {
      throw new AppError('Cart is empty', ERROR_CODES.BAD_REQUEST);
    }

    let calculation = {
      subtotal: cart.subtotal,
      discountAmount: 0,
      shippingFee: 0,
      finalTotal: cart.subtotal
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
      if (voucher && this.isVoucherValid(voucher, calculation.subtotal)) {
        calculation.discountAmount = this.calculateVoucherDiscount(voucher, calculation.subtotal);
      }
    }

    calculation.finalTotal = calculation.subtotal - calculation.discountAmount + calculation.shippingFee;
    
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
  isVoucherValid(voucher, subtotal) {
    const now = new Date();
    
    return voucher.isActive &&
           voucher.startDate <= now &&
           voucher.endDate >= now &&
           voucher.usedCount < voucher.usageLimit &&
           subtotal >= voucher.minOrderValue;
  }

  // Calculate voucher discount
  calculateVoucherDiscount(voucher, subtotal) {
    let discount = 0;
    
    if (voucher.discountType === 'percentage') {
      discount = (subtotal * voucher.discountValue) / 100;
      if (voucher.maxDiscountAmount) {
        discount = Math.min(discount, voucher.maxDiscountAmount);
      }
    } else {
      discount = voucher.discountValue;
    }
    
    return Math.min(discount, subtotal); // Don't discount more than subtotal
  }

  // Convert cart to order (checkout)
  async checkoutCart(userId, orderData) {
    const cart = await CartOrder.findOne({ user: userId, type: 'cart' });
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
    await CartOrder.findOrCreateCart(userId);
    
    return order;
  }
}

module.exports = CartService;
