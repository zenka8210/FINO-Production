const BaseService = require('./baseService');
const CartOrder = require('../models/CartOrderSchema'); // Updated to use CartOrderSchema
const Address = require('../models/AddressSchema');
const VoucherService = require('./voucherService');
const { AppError } = require('../middlewares/errorHandler');
const { orderMessages, ERROR_CODES, PAGINATION } = require('../config/constants');
const ShippingUtils = require('./shippingUtils');
const { QueryUtils } = require('../utils/queryUtils');

class OrderService extends BaseService {
  constructor() {
    super(CartOrder); // Updated to use CartOrder
    this.voucherService = new VoucherService();
  }  // Create new order
  async createOrder(userId, orderData) {
    try {
      // 1. Check stock availability first
      await this.checkStockAvailability(orderData.items);
      
      // 2. Get shipping address to calculate shipping fee
      const address = await Address.findById(orderData.address);
      if (!address) {
        throw new AppError(orderMessages.ADDRESS_NOT_FOUND_OR_NOT_OWNED, ERROR_CODES.ORDER.CREATE_FAILED);
      }

      // 3. Calculate shipping fee based on address
      const shippingFee = ShippingUtils.calculateShippingFee(address);
      
      // 4. Calculate total from items
      let total = 0;
      if (orderData.items && orderData.items.length > 0) {
        total = orderData.items.reduce((sum, item) => {
          return sum + (item.totalPrice || (item.price * item.quantity));
        }, 0);
      }

      // 5. Handle voucher if provided
      let discountAmount = 0;
      let voucherId = null;
      let voucherResult = null;
      
      if (orderData.voucherCode) {
        try {
          // Apply voucher to get discount amount (pass userId for usage checking)
          voucherResult = await this.voucherService.applyVoucher(orderData.voucherCode, total, userId);
          discountAmount = voucherResult.discountAmount;
          
          // Get voucher ID for storing in order
          const voucher = await this.voucherService.getVoucherByCode(orderData.voucherCode);
          voucherId = voucher._id;
        } catch (voucherError) {
          throw new AppError(`Voucher error: ${voucherError.message}`, ERROR_CODES.BAD_REQUEST);
        }
      }

      // 6. Calculate final total: original total - discount + shipping fee
      const finalTotal = total - discountAmount + shippingFee;

      // 7. Generate order code
      const orderCode = await this.generateOrderCode();

      // 8. Create the order
      const newOrder = await this.create({
        orderCode,
        user: userId,
        items: orderData.items,
        address: orderData.address,
        paymentMethod: orderData.paymentMethod,
        total,
        voucher: voucherId,
        discountAmount,
        shippingFee,
        finalTotal,
        status: 'pending'
      });

      // 9. Get user email for sending confirmation
      const User = require('../models/UserSchema');
      const user = await User.findById(userId);
      
      // 10. Send order confirmation email
      if (user && user.email) {
        await this.sendOrderConfirmationEmail(newOrder, user.email);
      }

      // 11. Return order with voucher details if applied
      const result = {
        ...newOrder.toObject(),
        voucherDetails: voucherResult ? {
          code: orderData.voucherCode,
          discountPercent: voucherResult.discountPercent,
          discountAmount: voucherResult.discountAmount,
          appliedDiscountRule: voucherResult.appliedDiscountRule
        } : null
      };

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(orderMessages.ORDER_CREATE_FAILED, ERROR_CODES.ORDER.CREATE_FAILED, 400, error.message);
    }
  }

  // Get user orders
  async getUserOrders(userId, options = {}) {
    const { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT, status } = options;
    
    let filter = { user: userId };
    if (status) filter.status = status;

    return await this.getAll({
      page,
      limit,
      filter,
      sort: { createdAt: -1 }
    });
  }

  // Calculate shipping fee for an address (for frontend preview)
  async calculateShippingFee(addressId) {
    try {
      const address = await Address.findById(addressId);
      if (!address) {
        throw new AppError(orderMessages.ADDRESS_NOT_FOUND_OR_NOT_OWNED, ERROR_CODES.ORDER.CREATE_FAILED);
      }

      const shippingInfo = ShippingUtils.getShippingInfo(address);
      return {
        fee: shippingInfo.fee,
        location: shippingInfo.location,
        description: shippingInfo.description,
        address: {
          city: address.city,
          district: address.district,
          ward: address.ward
        }
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Không thể tính phí ship', ERROR_CODES.BAD_REQUEST, 400, error.message);
    }
  }

  // Update order status (Admin only - restricted to status updates only)
  async updateOrderStatus(orderId, newStatus, adminId) {
    const order = await this.getById(orderId);
    if (!order) {
      throw new AppError(orderMessages.ORDER_NOT_FOUND, ERROR_CODES.ORDER.NOT_FOUND);
    }

    // Validate status transition
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new AppError('Trạng thái đơn hàng không hợp lệ', ERROR_CODES.BAD_REQUEST);
    }

    // Business rule: Can't change status of already delivered orders
    if (order.status === 'delivered' && newStatus !== 'delivered') {
      throw new AppError('Không thể thay đổi trạng thái đơn hàng đã giao', ERROR_CODES.BAD_REQUEST);
    }

    // Business rule: Can't change status of cancelled orders
    if (order.status === 'cancelled' && newStatus !== 'cancelled') {
      throw new AppError('Không thể thay đổi trạng thái đơn hàng đã hủy', ERROR_CODES.BAD_REQUEST);
    }

    // Admin can only update status, not other fields
    const updateData = { 
      status: newStatus,
      updatedBy: adminId
    };

    return await this.updateById(orderId, updateData);
  }
  // Cancel order (user or admin with restrictions)
  async cancelOrder(orderId, userId, reason = null) {
    let query = { _id: orderId };
    
    // If userId is provided, ensure user owns the order
    if (userId) {
      query.user = userId;
    }
    
    const order = await this.Model.findOne(query);
    if (!order) {
      throw new AppError(orderMessages.ORDER_NOT_FOUND_OR_NOT_OWNED, ERROR_CODES.ORDER.NOT_FOUND);
    }

    // Check if admin can cancel this order (only pending/processing)
    if (!userId) { // Admin cancellation
      const canCancel = await this.adminCanCancelOrder(orderId);
      if (!canCancel) {
        throw new AppError('Admin chỉ có thể hủy đơn hàng ở trạng thái pending hoặc processing', ERROR_CODES.BAD_REQUEST);
      }
    } else {
      // User can only cancel their own pending orders
      if (order.status !== 'pending') {
        throw new AppError(orderMessages.ORDER_CANCELLATION_NOT_ALLOWED, ERROR_CODES.BAD_REQUEST);
      }
    }

    const updateData = { status: 'cancelled' };
    if (reason) {
      updateData.cancellationReason = reason;
    }

    return await this.updateById(orderId, updateData);
  }

  // Delete order (admin only)
  async deleteOrder(orderId) {
    const order = await this.getById(orderId);
    if (!order) {
      throw new AppError(orderMessages.ORDER_NOT_FOUND, ERROR_CODES.ORDER.NOT_FOUND);
    }

    // Only allow deletion of cancelled orders
    if (order.status !== 'cancelled') {
      throw new AppError(orderMessages.ORDER_CANCELLATION_NOT_ALLOWED, ERROR_CODES.BAD_REQUEST);
    }

    return await this.deleteById(orderId);
  }

  // Get order with full details (populate relationships)
  async getOrderWithDetails(orderId) {
    const order = await this.Model.findById(orderId)
      .populate('user', 'name email phone')
      .populate('address')
      .populate('voucher')
      .populate('paymentMethod')
      .populate({
        path: 'items.productVariant',
        populate: {
          path: 'product',
          select: 'name images'
        }
      });

    if (!order) {
      throw new AppError(orderMessages.ORDER_NOT_FOUND, ERROR_CODES.ORDER.NOT_FOUND);
    }
    return order;
  }

  // Get order statistics
  async getOrderStats(dateRange = {}) {
    const { startDate, endDate } = dateRange;
    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const stats = await this.Model.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$finalTotal' },
          avgOrderValue: { $avg: '$finalTotal' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          processingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
          },
          shippedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    return stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      pendingOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0
    };
  }

  // Check if user can review a product (must have delivered order containing the product)
  async canUserReviewProduct(userId, productId) {
    const order = await this.Model.findOne({
      user: userId,
      status: 'delivered',
      'items.productVariant': {
        $in: await this.getProductVariantIds(productId)
      }
    });
    return !!order;
  }

  // Helper method to get product variant IDs for a product
  async getProductVariantIds(productId) {
    const ProductVariant = require('../models/ProductVariantSchema');
    const variants = await ProductVariant.find({ product: productId }).select('_id');
    return variants.map(v => v._id);
  }

  // Get orders by payment method
  async getOrdersByPaymentMethod(paymentMethod, options = {}) {
    const { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = options;
    
    return await this.getAll({
      page,
      limit,
      filter: { paymentMethod },
      populate: 'user address voucher paymentMethod',
      sort: { createdAt: -1 }
    });
  }

  // Search orders by order ID, user name, or user email
  async searchOrders(query, options = {}) {
    const { limit = PAGINATION.DEFAULT_LIMIT } = options;
    
    // Search by order ID if query looks like ObjectId
    if (query.match(/^[0-9a-fA-F]{24}$/)) {
      const order = await this.getOrderWithDetails(query);
      return order ? [order] : [];
    }

    // Search by user name or email
    const User = require('../models/UserSchema');
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('_id');

    const userIds = users.map(u => u._id);
    
    const orders = await this.Model.find({
      user: { $in: userIds }
    })
    .populate('user', 'name email')
    .populate('address')
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

    return orders;
  }

  // Get top selling products based on order data
  async getTopSellingProducts(limit = 10) {
    const topProducts = await this.Model.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'productvariants',
          localField: 'items.productVariant',
          foreignField: '_id',
          as: 'variant'
        }
      },
      { $unwind: '$variant' },
      {
        $group: {
          _id: '$variant.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: '$product._id',
          name: '$product.name',
          images: '$product.images',
          totalSold: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) }
    ]);

    return topProducts;
  }

  // Get orders by user ID (for admin)
  async getOrdersByUserId(userId, options = {}) {
    const { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT, status } = options;
    
    let filter = { user: userId };
    if (status) filter.status = status;

    return await this.getAll({
      page,
      limit,
      filter,
      populate: 'address voucher paymentMethod',
      sort: { createdAt: -1 }
    });
  }

  // Migration method: Update shipping fees for existing orders based on their addresses
  async updateExistingOrdersShippingFees() {
    try {
      const orders = await this.Model.find({}).populate('address');
      let updatedCount = 0;

      for (const order of orders) {
        if (order.address) {
          const newShippingFee = ShippingUtils.calculateShippingFee(order.address);
          
          // Only update if shipping fee is different
          if (order.shippingFee !== newShippingFee) {
            const newFinalTotal = order.total + newShippingFee;
            
            await this.Model.findByIdAndUpdate(order._id, {
              shippingFee: newShippingFee,
              finalTotal: newFinalTotal
            });
            
            updatedCount++;
          }
        }
      }

      return {
        message: `Đã cập nhật phí ship cho ${updatedCount} đơn hàng`,
        updatedCount,
        totalOrders: orders.length
      };
    } catch (error) {
      throw new AppError('Lỗi khi cập nhật phí ship cho đơn hàng hiện có', ERROR_CODES.ORDER.UPDATE_FAILED, 500, error.message);
    }
  }
  // Calculate order total with voucher and shipping (for preview)
  async calculateOrderTotal(orderData, userId = null) {
    try {
      // Get shipping address to calculate shipping fee
      const address = await Address.findById(orderData.address);
      if (!address) {
        throw new AppError(orderMessages.ADDRESS_NOT_FOUND_OR_NOT_OWNED, ERROR_CODES.ORDER.CREATE_FAILED);
      }

      // Calculate shipping fee based on address
      const shippingFee = ShippingUtils.calculateShippingFee(address);
      
      // Calculate total from items
      let total = 0;
      if (orderData.items && orderData.items.length > 0) {
        total = orderData.items.reduce((sum, item) => {
          return sum + (item.totalPrice || (item.price * item.quantity));
        }, 0);
      }

      // Handle voucher if provided
      let discountAmount = 0;
      let voucherDetails = null;      if (orderData.voucherCode) {
        try {
          // Apply voucher to get discount amount (pass userId for usage checking)
          const voucherResult = await this.voucherService.applyVoucher(orderData.voucherCode, total, userId);
          discountAmount = voucherResult.discountAmount;
          voucherDetails = {
            code: orderData.voucherCode,
            discountPercent: voucherResult.discountPercent,
            discountAmount: voucherResult.discountAmount,
            appliedDiscountRule: voucherResult.appliedDiscountRule
          };
        } catch (voucherError) {
          throw new AppError(`Voucher error: ${voucherError.message}`, ERROR_CODES.BAD_REQUEST);
        }
      }

      // Calculate final total: original total - discount + shipping fee
      const finalTotal = total - discountAmount + shippingFee;

      return {
        total: total, // Changed from subtotal to total for consistency
        discountAmount,
        shippingFee,
        finalTotal,
        voucherDetails,
        breakdown: {
          itemsTotal: total,
          discount: discountAmount,
          shipping: shippingFee,
          total: finalTotal
        }
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Không thể tính tổng tiền đơn hàng', ERROR_CODES.BAD_REQUEST, 400, error.message);
    }
  }

  // ============= BUSINESS LOGIC METHODS (moved from schema) =============

  // Generate order code
  async generateOrderCode() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    // Format: DH + YYYYMMDD + 5 digit counter
    const prefix = `DH${year}${month}${day}`;
    
    // Tìm order cuối cùng trong ngày
    const lastOrder = await this.Model.findOne({
      orderCode: { $regex: `^${prefix}` }
    }).sort({ orderCode: -1 });
    
    let counter = 1;
    if (lastOrder) {
      const lastCounter = parseInt(lastOrder.orderCode.slice(-5));
      counter = lastCounter + 1;
    }
    
    const orderCode = prefix + String(counter).padStart(5, '0');
    return orderCode;
  }

  // Check stock availability
  async checkStockAvailability(items) {
    const ProductVariant = require('../models/ProductVariantSchema');
    
    for (const item of items) {
      const variant = await ProductVariant.findById(item.productVariant);
      if (!variant) {
        throw new AppError(`Product variant ${item.productVariant} không tồn tại`, ERROR_CODES.BAD_REQUEST);
      }
      
      if (variant.stock < item.quantity) {
        throw new AppError(`Sản phẩm ${variant.product} không đủ số lượng. Còn lại: ${variant.stock}, yêu cầu: ${item.quantity}`, ERROR_CODES.BAD_REQUEST);
      }
    }
    
    return true;
  }

  // Check if order can be reviewed
  canOrderBeReviewed(order) {
    return order.status === 'delivered';
  }

  // Send order confirmation email
  async sendOrderConfirmationEmail(order, userEmail) {
    try {
      // TODO: Implement email service integration
      console.log(`📧 Sending order confirmation email to ${userEmail} for order ${order.orderCode}`);
      
      // For now, just log the email content
      const emailContent = {
        to: userEmail,
        subject: `Xác nhận đơn hàng ${order.orderCode}`,
        html: `
          <h2>Cảm ơn bạn đã đặt hàng!</h2>
          <p>Mã đơn hàng: <strong>${order.orderCode}</strong></p>
          <p>Tổng tiền: <strong>${order.finalTotal?.toLocaleString('vi-VN')} VNĐ</strong></p>
          <p>Trạng thái: <strong>${order.status}</strong></p>
          <p>Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.</p>
        `
      };
      
      console.log('📧 Email content:', emailContent);
      
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Admin can only cancel orders in pending/processing status
  async adminCanCancelOrder(orderId) {
    const order = await this.getById(orderId);
    if (!order) {
      throw new AppError(orderMessages.ORDER_NOT_FOUND, ERROR_CODES.ORDER.NOT_FOUND);
    }
    
    const cancellableStatuses = ['pending', 'processing'];
    return cancellableStatuses.includes(order.status);
  }

  /**
   * Get all orders using new Query Middleware
   * @param {Object} queryParams - Query parameters from request
   * @returns {Object} Query results with pagination
   */
  async getAllOrdersWithQuery(queryParams) {
    try {
      // Sử dụng QueryUtils với pre-configured setup cho Order
      const result = await QueryUtils.getOrders(CartOrder, queryParams);
      
      return result;
    } catch (error) {
      throw new AppError(
        `Error fetching orders: ${error.message}`,
        ERROR_CODES.ORDER.FETCH_FAILED,
        500
      );
    }
  }
}

module.exports = OrderService;
