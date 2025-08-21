const BaseService = require('./baseService');
const Order = require('../models/OrderSchema'); // Use Order model for orders
const Cart = require('../models/CartSchema'); // For cart operations
const Address = require('../models/AddressSchema');
const VoucherService = require('./voucherService');
const EmailService = require('./emailService');
const { AppError } = require('../middlewares/errorHandler');
const { orderMessages, ERROR_CODES, PAGINATION } = require('../config/constants');
const ShippingUtils = require('./shippingUtils');
const { QueryUtils } = require('../utils/queryUtils');

class OrderService extends BaseService {
  constructor() {
    super(Order); // Use Order model - CORRECT collection for orders
    this.voucherService = new VoucherService();
    this.emailService = new EmailService();
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

      // 9. Get user and address info for email
      const User = require('../models/UserSchema');
      const user = await User.findById(userId);
      const addressInfo = await Address.findById(orderData.address);
      
      // 10. Send order confirmation email
      console.log('📧 Preparing to send order confirmation email...');
      console.log('📧 User:', user ? { id: user._id, email: user.email, name: user.name } : 'NOT FOUND');
      console.log('📧 Address:', addressInfo ? { id: addressInfo._id, fullName: addressInfo.fullName } : 'NOT FOUND');
      
      if (user && user.email && addressInfo) {
        try {
          console.log('📧 Email service check:', !!this.emailService);
          
          const orderDataForEmail = {
            _id: newOrder._id,
            orderCode: newOrder.orderCode,
            items: newOrder.items,
            total: newOrder.total,
            discountAmount: newOrder.discountAmount || 0,
            shippingFee: newOrder.shippingFee || 0,
            finalTotal: newOrder.finalTotal,
            address: addressInfo,
            createdAt: newOrder.createdAt,
            paymentMethod: newOrder.paymentMethod,
            voucher: voucherResult ? { code: orderData.voucherCode } : null
          };
          
          console.log('📧 Sending order confirmation email to:', user.email);
          await this.emailService.sendOrderConfirmationEmail(
            user.email,
            user.name || 'Khách hàng',
            orderDataForEmail
          );
          
          console.log('✅ Order confirmation email sent successfully');
        } catch (emailError) {
          console.error('❌ Failed to send order confirmation email:', emailError.message);
          console.error('❌ Email error stack:', emailError.stack);
          // Don't throw error - order creation should still succeed
        }
      } else {
        console.log('❌ Cannot send email - missing user or address info');
      }

      // 11. Increment voucher usage count if voucher was applied
      if (voucherId) {
        try {
          await this.voucherService.incrementVoucherUsedCount(voucherId);
          console.log(`📈 Voucher ${orderData.voucherCode}: usedCount incremented (order created)`);
        } catch (voucherError) {
          console.error('❌ Failed to increment voucher usage count:', voucherError.message);
          // Don't throw error - order creation should still succeed
        }
      }

      // 12. Return order with voucher details if applied
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
    const { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT, status, dateFilter } = options;
    
    let filter = { user: userId };
    if (status) filter.status = status;
    
    // Apply date filter if provided
    if (dateFilter && dateFilter.createdAt) {
      filter.createdAt = dateFilter.createdAt;
    }

    return await this.getAll({
      page,
      limit,
      filter,
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'items.productVariant',
          populate: [
            { path: 'product', select: 'name images price salePrice' },
            { path: 'color', select: 'name isActive' },
            { path: 'size', select: 'name' }
          ]
        },
        { path: 'address', select: 'fullName phone addressLine ward district city' },
        { path: 'paymentMethod', select: 'method isActive' },
        { path: 'voucher', select: 'code discountPercent' }
      ]
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
    const order = await this.getById(orderId, [
      { path: 'paymentMethod', select: 'method isActive' },
      { path: 'voucher', select: 'code usedCount' }
    ]);
    
    if (!order) {
      throw new AppError(orderMessages.ORDER_NOT_FOUND, ERROR_CODES.ORDER.NOT_FOUND);
    }

    const oldStatus = order.status;

    // Validate status transition
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new AppError('Trạng thái đơn hàng không hợp lệ', ERROR_CODES.BAD_REQUEST);
    }

    // =========== ENHANCED ADMIN CONTROL LOGIC ===========
    
    // 1. LOGICAL STATUS FLOW VALIDATION - No backward transitions allowed
    const statusFlow = {
      'pending': ['processing', 'cancelled'],
      'processing': ['shipped', 'delivered', 'cancelled'], 
      'shipped': ['delivered', 'cancelled'], // Can cancel if customer doesn't receive (return)
      'delivered': [], // Final state - no changes allowed
      'cancelled': [] // Final state - no changes allowed
    };
    
    // Check if transition is allowed
    if (!statusFlow[oldStatus]?.includes(newStatus)) {
      const flowMessage = {
        'pending': 'Từ "Chờ xử lý" chỉ có thể chuyển sang "Đang xử lý" hoặc "Hủy đơn"',
        'processing': 'Từ "Đang xử lý" chỉ có thể chuyển sang "Đã gửi hàng", "Đã giao" hoặc "Hủy đơn"',
        'shipped': 'Từ "Đã gửi hàng" chỉ có thể chuyển sang "Đã giao hàng" hoặc "Hủy đơn" (không nhận hàng)',
        'delivered': 'Đơn hàng đã hoàn thành - không thể thay đổi trạng thái',
        'cancelled': 'Đơn hàng đã hủy - không thể thay đổi trạng thái'
      };
      
      throw new AppError(
        `❌ Không thể cập nhật trạng thái: ${flowMessage[oldStatus]}`, 
        ERROR_CODES.BAD_REQUEST
      );
    }

    // VOUCHER LOGIC: Handle usedCount based on status changes
    if (order.voucher) {
      try {
        // REMOVED: No longer increment when pending -> processing since it's already incremented at order creation
        // OLD: if (oldStatus === 'pending' && newStatus === 'processing') { ... }
        
        // Only decrement usedCount when order is cancelled from any status (except already cancelled)
        if (oldStatus !== 'cancelled' && newStatus === 'cancelled') {
          await this.voucherService.decrementVoucherUsedCount(order.voucher._id);
          console.log(`📉 Voucher ${order.voucher.code}: usedCount decremented (order cancelled from ${oldStatus})`);
        }
      } catch (voucherError) {
        console.error('❌ Voucher usedCount update error:', voucherError.message);
        // Don't block order status update if voucher update fails
      }
    }

    // Prepare update data
    const updateData = { 
      status: newStatus,
      updatedBy: adminId
    };

    // BUSINESS LOGIC: COD payment handling when delivered
    if (newStatus === 'delivered') {
      // Check if payment method is COD
      const paymentMethod = order.paymentMethod?.method || order.paymentMethod;
      
      if (paymentMethod === 'COD' || paymentMethod === 'cod') {
        // COD orders should be marked as paid when delivered (customer paid on delivery)
        if (order.paymentStatus !== 'paid') {
          updateData.paymentStatus = 'paid';
          updateData.paymentDetails = {
            ...order.paymentDetails,
            paymentMethod: 'COD',
            paidAt: new Date(),
            updatedAt: new Date(),
            source: 'admin_delivery_confirmation'
          };
          
          console.log(`🚚💰 COD Order ${order.orderCode}: Auto-updating paymentStatus to 'paid' on delivery`);
        }
      }
      // For VNPay/online payments, don't auto-update paymentStatus
      // It should already be 'paid' if payment was successful
    }

    // Validation: Prevent COD orders from being delivered if not paid
    if (newStatus === 'delivered') {
      const paymentMethod = order.paymentMethod?.method || order.paymentMethod;
      
      if ((paymentMethod === 'COD' || paymentMethod === 'cod') && 
          order.paymentStatus !== 'paid' && 
          updateData.paymentStatus !== 'paid') {
        throw new AppError(
          'Đơn hàng COD phải được thanh toán trước khi có thể đánh dấu đã giao hàng',
          ERROR_CODES.BAD_REQUEST
        );
      }
    }

    // Increment voucher usage count when order is delivered
    if (newStatus === 'delivered' && order.voucher && order.status !== 'delivered') {
      try {
        await this.voucherService.incrementVoucherUsage(order.voucher);
        console.log(`📝 Incremented usage count for voucher: ${order.voucher}`);
      } catch (voucherError) {
        console.warn(`⚠️ Failed to increment voucher usage: ${voucherError.message}`);
        // Don't throw error, just log warning as this shouldn't block order completion
      }
    }

    return await this.updateById(orderId, updateData);
  }

  // Update payment status (Admin only)
  async updatePaymentStatus(orderId, newPaymentStatus, adminId) {
    const order = await this.getById(orderId, [
      { path: 'paymentMethod', select: 'method isActive' }
    ]);
    
    if (!order) {
      throw new AppError(orderMessages.ORDER_NOT_FOUND, ERROR_CODES.ORDER.NOT_FOUND);
    }

    // Validate payment status
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'cancelled'];
    if (!validPaymentStatuses.includes(newPaymentStatus)) {
      throw new AppError('Trạng thái thanh toán không hợp lệ', ERROR_CODES.BAD_REQUEST);
    }

    // =========== ENHANCED PAYMENT STATUS CONTROL ===========
    
    // 1. RESTRICT PAYMENT STATUS CHANGES FOR CANCELLED ORDERS
    if (order.status === 'cancelled') {
      throw new AppError(
        `❌ Không thể thay đổi trạng thái thanh toán cho đơn hàng đã hủy. ` +
        `Đơn hàng đã hủy có trạng thái thanh toán cố định.`,
        ERROR_CODES.FORBIDDEN
      );
    }
    
    // 2. RESTRICT VNPay AND MOMO MANUAL CHANGES
    const paymentMethod = order.paymentMethod?.method || order.paymentMethod || '';
    const digitalPaymentMethods = ['VNPay', 'Momo', 'vnpay', 'momo'];
    
    if (digitalPaymentMethods.includes(paymentMethod)) {
      throw new AppError(
        `❌ Không thể thay đổi thủ công trạng thái thanh toán cho phương thức ${paymentMethod}. ` +
        `Trạng thái này chỉ được cập nhật tự động thông qua callback từ hệ thống thanh toán.`,
        ERROR_CODES.FORBIDDEN
      );
    }

    // 3. RESTRICT COD PAYMENT STATUS CHANGES FOR DELIVERED ORDERS ONLY
    // Note: COD shipped orders can still be cancelled if customer doesn't receive
    const isCOD = paymentMethod.toLowerCase() === 'cod' || paymentMethod.toLowerCase() === 'tiền mặt';
    const isDelivered = order.status === 'delivered';
    
    if (isCOD && isDelivered) {
      throw new AppError(
        `❌ Không thể thay đổi trạng thái thanh toán COD khi đơn hàng đã giao hàng thành công. ` +
        `Trạng thái thanh toán COD được tự động cập nhật khi đơn hàng giao thành công.`,
        ERROR_CODES.FORBIDDEN
      );
    }

    // 4. BUSINESS VALIDATION FOR SPECIAL ORDER STATES
    if (order.status === 'delivered') {
      if (isCOD && newPaymentStatus !== 'paid') {
        throw new AppError(
          'Đơn hàng COD đã giao không thể có trạng thái thanh toán khác "paid"',
          ERROR_CODES.BAD_REQUEST
        );
      }
    }
    
    // Cancelled orders should have consistent payment status
    if (order.status === 'cancelled' && newPaymentStatus === 'paid') {
      throw new AppError(
        'Đơn hàng đã hủy không thể có trạng thái thanh toán "paid"',
        ERROR_CODES.BAD_REQUEST
      );
    }

    // 5. LOG MANUAL PAYMENT STATUS CHANGE
    console.log(`🔧 [ADMIN PAYMENT UPDATE] Order ${order.orderCode}: ${order.paymentStatus} → ${newPaymentStatus} by admin ${adminId}`);

    // Prepare update data
    const updateData = {
      paymentStatus: newPaymentStatus,
      updatedBy: adminId,
      paymentDetails: {
        ...order.paymentDetails,
        updatedAt: new Date(),
        source: 'admin_manual_update'
      }
    };

    // Set payment completion time
    if (newPaymentStatus === 'paid' && order.paymentStatus !== 'paid') {
      updateData.paymentDetails.paidAt = new Date();
    } else if (newPaymentStatus === 'failed' && order.paymentStatus !== 'failed') {
      updateData.paymentDetails.failedAt = new Date();
    }

    return await this.updateById(orderId, updateData);
  }

  // Validate order consistency and fix inconsistencies
  async validateOrderConsistency(orderId) {
    const order = await this.getById(orderId, [
      { path: 'paymentMethod', select: 'method isActive' }
    ]);
    
    if (!order) {
      throw new AppError(orderMessages.ORDER_NOT_FOUND, ERROR_CODES.ORDER.NOT_FOUND);
    }

    const issues = [];
    const fixes = {};
    const paymentMethod = order.paymentMethod?.method || order.paymentMethod;

    // Check COD + delivered + unpaid inconsistency
    if ((paymentMethod === 'COD' || paymentMethod === 'cod') && 
        order.status === 'delivered' && 
        order.paymentStatus !== 'paid') {
      
      issues.push({
        type: 'COD_DELIVERED_UNPAID',
        message: 'Đơn hàng COD đã giao nhưng chưa thanh toán',
        severity: 'error',
        autoFixable: true
      });
      
      fixes.paymentStatus = 'paid';
      fixes.paymentDetails = {
        ...order.paymentDetails,
        paymentMethod: 'COD',
        paidAt: new Date(),
        updatedAt: new Date(),
        source: 'auto_fix_cod_delivered'
      };
    }

    // Check VNPay orders that are delivered but payment status is pending
    if ((paymentMethod === 'VNPay' || paymentMethod === 'vnpay') && 
        order.status === 'delivered' && 
        order.paymentStatus === 'pending') {
      
      issues.push({
        type: 'VNPAY_DELIVERED_PENDING',
        message: 'Đơn hàng VNPay đã giao nhưng thanh toán vẫn đang chờ',
        severity: 'warning',
        autoFixable: false,
        suggestion: 'Kiểm tra lại trạng thái thanh toán trên cổng VNPay'
      });
    }

    return {
      order,
      issues,
      fixes,
      hasIssues: issues.length > 0,
      autoFixable: issues.some(issue => issue.autoFixable)
    };
  }

  // Auto-fix order inconsistencies
  async autoFixOrderInconsistencies(orderId, adminId) {
    const validation = await this.validateOrderConsistency(orderId);
    
    if (!validation.hasIssues) {
      return {
        success: true,
        message: 'Đơn hàng không có vấn đề gì',
        order: validation.order
      };
    }

    if (!validation.autoFixable) {
      return {
        success: false,
        message: 'Có vấn đề nhưng không thể tự động sửa',
        issues: validation.issues,
        order: validation.order
      };
    }

    // Apply fixes
    const updateData = {
      ...validation.fixes,
      updatedBy: adminId
    };

    const updatedOrder = await this.updateById(orderId, updateData);
    
    return {
      success: true,
      message: 'Đã tự động sửa các vấn đề về đơn hàng',
      fixes: validation.fixes,
      issues: validation.issues,
      order: updatedOrder
    };
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
      throw new AppError(orderMessages.ORDER_NOT_FOUND_OR_NOT_OWNED, ERROR_CODES.NOT_FOUND);
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
        populate: [
          { path: 'product', select: 'name images' },
          { path: 'color', select: 'name isActive' },
          { path: 'size', select: 'name' }
        ]
      });

    if (!order) {
      throw new AppError(orderMessages.ORDER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    // Convert to plain object to allow modification
    const orderObj = order.toObject();
    
    // 🔍 DEBUG: Log address state before fallback
    console.log(`🔍 DEBUG Order ${orderObj.orderCode}:`);
    console.log(`   - address is null: ${orderObj.address === null}`);
    console.log(`   - address is undefined: ${orderObj.address === undefined}`);
    console.log(`   - addressSnapshot exists: ${!!orderObj.addressSnapshot}`);
    
    // 🆕 FALLBACK TO ADDRESS SNAPSHOT if address reference is lost
    if (!orderObj.address && orderObj.addressSnapshot) {
      console.log(`⚠️  Order ${orderObj.orderCode}: Address reference lost, using addressSnapshot fallback`);
      // Create a mock address object from snapshot for compatibility
      orderObj.address = {
        _id: null, // Indicate this is from snapshot
        fullName: orderObj.addressSnapshot.fullName,
        phone: orderObj.addressSnapshot.phone,
        addressLine: orderObj.addressSnapshot.addressLine,
        ward: orderObj.addressSnapshot.ward,
        district: orderObj.addressSnapshot.district,
        city: orderObj.addressSnapshot.city,
        postalCode: orderObj.addressSnapshot.postalCode,
        isDefault: orderObj.addressSnapshot.isDefault,
        isSnapshot: true, // Flag to indicate this is from snapshot
        snapshotCreatedAt: orderObj.addressSnapshot.snapshotCreatedAt
      };
      console.log(`✅ Address fallback applied successfully for ${orderObj.orderCode}`);
    } else if (!orderObj.address && !orderObj.addressSnapshot) {
      console.log(`❌ Order ${orderObj.orderCode}: Both address reference and snapshot are missing!`);
    } else {
      console.log(`ℹ️  Order ${orderObj.orderCode}: Address is available, no fallback needed`);
    }

    return orderObj;
  }

  // Get order by orderCode with full details (for VNPay callbacks)
  async getOrderByCode(orderCode) {
    const order = await this.Model.findOne({ orderCode })
      .populate('user', 'name email phone')
      .populate('address')
      .populate('voucher')
      .populate('paymentMethod')
      .populate({
        path: 'items.productVariant',
        populate: [
          { path: 'product', select: 'name images' },
          { path: 'color', select: 'name isActive' },
          { path: 'size', select: 'name isActive' }
        ]
      });

    if (!order) {
      throw new AppError(orderMessages.ORDER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
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
    
    console.log('🔍 OrderService.getOrdersByUserId called with:', { userId, page, limit, status });
    
    let filter = { user: userId };
    if (status) filter.status = status;

    console.log('📋 Query filter:', filter);
    
    const result = await this.getAll({
      page,
      limit,
      filter,
      populate: 'address voucher paymentMethod',
      sort: { createdAt: -1 }
    });
    
    console.log('📦 OrderService result:', { 
      documentsCount: result?.documents?.length || 0,
      total: result?.pagination?.total || 0,
      structure: Object.keys(result || {})
    });
    
    return result;
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

  // Generate order code - Use Order model method
  async generateOrderCode() {
    // Use Order model static method instead of Cart
    return await this.Model.generateOrderCode();
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

  // Send order confirmation email with EmailService
  async sendOrderConfirmationEmail(order, userEmail) {
    try {
      console.log(`📧 Sending order confirmation email to ${userEmail} for order ${order.orderCode}`);
      
      // Get user info
      const User = require('../models/UserSchema');
      const user = await User.findOne({ email: userEmail });
      
      // Get address info
      const addressInfo = await Address.findById(order.address);
      
      if (!user || !addressInfo) {
        throw new Error('Missing user or address information');
      }

      const orderDataForEmail = {
        orderCode: order.orderCode,
        items: order.items || [],
        total: order.total || 0,
        finalTotal: order.finalTotal || 0,
        address: addressInfo,
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod || 'COD',
        voucher: order.voucher ? { code: 'DISCOUNT' } : null
      };

      const result = await this.emailService.sendOrderConfirmationEmail(
        userEmail,
        user.name || 'Khách hàng',
        orderDataForEmail
      );
      
      console.log('✅ Order confirmation email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Failed to send order confirmation email:', error.message);
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

  // ============= ORDER STATISTICS METHODS =============

  // Get comprehensive order statistics for admin dashboard
  async getOrderStatistics() {
    try {
      const currentDate = new Date();
      const twelveMonthsAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);

      // Main order statistics aggregation
      const statistics = await this.Model.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [
                  { $eq: ['$paymentStatus', 'paid'] },
                  '$finalTotal',
                  0
                ]
              }
            },
            totalDeliveredOrders: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'delivered'] },
                  1,
                  0
                ]
              }
            },
            pendingOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
              }
            },
            processingOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'processing'] }, 1, 0]
              }
            },
            shippedOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0]
              }
            },
            deliveredOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
              }
            },
            cancelledOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
              }
            },
            averageOrderValue: { $avg: '$finalTotal' },
            totalCustomers: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            _id: 0,
            totalOrders: 1,
            totalRevenue: 1,
            totalDeliveredOrders: 1,
            ordersByStatus: {
              pending: '$pendingOrders',
              processing: '$processingOrders',
              shipped: '$shippedOrders',
              delivered: '$deliveredOrders',
              cancelled: '$cancelledOrders'
            },
            averageOrderValue: { $round: ['$averageOrderValue', 0] },
            totalCustomers: { $size: '$totalCustomers' }
          }
        }
      ]);

      // Monthly revenue for the last 12 months
      const monthlyRevenue = await this.Model.aggregate([
        {
          $match: {
            createdAt: { $gte: twelveMonthsAgo },
            paymentStatus: 'paid'
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$finalTotal' },
            orderCount: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            monthName: {
              $arrayElemAt: [
                ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                '$_id.month'
              ]
            },
            revenue: { $round: ['$revenue', 0] },
            orderCount: 1
          }
        }
      ]);

      // Top selling products (from order items)
      const topProducts = await this.Model.aggregate([
        {
          $match: {
            status: { $in: ['delivered', 'shipped', 'processing'] }
          }
        },
        {
          $unwind: '$items'
        },
        {
          $group: {
            _id: '$items.productVariant',
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.totalPrice' },
            orderCount: { $sum: 1 }
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
          $unwind: { path: '$productVariant', preserveNullAndEmptyArrays: true }
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
          $unwind: { path: '$product', preserveNullAndEmptyArrays: true }
        },
        {
          $project: {
            productVariantId: '$_id',
            productId: '$product._id',
            productName: '$product.name',
            productImage: { $arrayElemAt: ['$product.images', 0] },
            totalQuantity: 1,
            totalRevenue: { $round: ['$totalRevenue', 0] },
            orderCount: 1
          }
        }
      ]);

      const baseStats = statistics[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        totalDeliveredOrders: 0,
        ordersByStatus: {
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0
        },
        averageOrderValue: 0,
        totalCustomers: 0
      };

      return {
        summary: {
          totalOrders: baseStats.totalOrders,
          totalRevenue: baseStats.totalRevenue,
          totalDeliveredOrders: baseStats.totalDeliveredOrders,
          averageOrderValue: baseStats.averageOrderValue,
          totalCustomers: baseStats.totalCustomers,
          completionRate: baseStats.totalOrders > 0 ? 
            Math.round((baseStats.totalDeliveredOrders / baseStats.totalOrders) * 10000) / 100 : 0
        },
        ordersByStatus: baseStats.ordersByStatus,
        monthlyRevenue: monthlyRevenue,
        topSellingProducts: topProducts,
        lastUpdated: new Date()
      };

    } catch (error) {
      throw new AppError(`Error getting order statistics: ${error.message}`, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  // Get order trends by date range
  async getOrderTrends(days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const trends = await this.Model.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt'
                }
              }
            },
            totalOrders: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [
                  { $eq: ['$paymentStatus', 'paid'] },
                  '$finalTotal',
                  0
                ]
              }
            },
            deliveredOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
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
            totalOrders: 1,
            totalRevenue: { $round: ['$totalRevenue', 0] },
            deliveredOrders: 1
          }
        }
      ]);

      return trends;
    } catch (error) {
      throw new AppError(`Error getting order trends: ${error.message}`, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  // ============= VNPAY PAYMENT METHODS =============

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @returns {Object} Order object
   */
  async getOrderById(orderId) {
    try {
      const order = await this.Model.findById(orderId)
        .populate('user', 'name email phone')
        .populate('address')
        .populate('voucher')
        .populate('paymentMethod')
        .populate({
          path: 'items.productVariant',
          populate: {
            path: 'product color size',
            select: 'name images price salePrice'
          }
        });

      if (!order) {
        throw new AppError(orderMessages.ORDER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
      }

      return order;
    } catch (error) {
      throw new AppError(`Error getting order: ${error.message}`, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Update order payment status (for VNPay integration)
   * @param {string} orderId - Order ID
   * @param {string} paymentStatus - Payment status ('pending', 'paid', 'failed', 'cancelled')
   * @param {Object} paymentDetails - Payment details from VNPay
   * @returns {Object} Updated order
   */
  async updateOrderPaymentStatus(orderId, paymentStatus, paymentDetails = {}) {
    try {
      console.log('💳 Updating order payment status:', {
        orderId,
        paymentStatus,
        paymentDetails
      });

      // Validate payment status
      const validStatuses = ['pending', 'paid', 'failed', 'cancelled'];
      if (!validStatuses.includes(paymentStatus)) {
        throw new AppError('Invalid payment status', ERROR_CODES.BAD_REQUEST);
      }

      // Find order
      const order = await this.Model.findById(orderId);
      if (!order) {
        throw new AppError(orderMessages.ORDER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
      }

      // Prepare update data
      const updateData = {
        paymentStatus,
        paymentDetails: {
          ...order.paymentDetails,
          ...paymentDetails,
          updatedAt: new Date()
        }
      };

      // If payment is successful, update order status
      if (paymentStatus === 'paid') {
        // Only update status if it's still pending
        if (order.status === 'pending') {
          updateData.status = 'processing';
        }
        
        // Set payment date
        updateData.paymentDetails.paidAt = new Date();
        
        console.log('✅ Payment successful, updating order to processing');
      } else if (paymentStatus === 'failed') {
        // Keep order as pending but mark payment as failed
        updateData.paymentDetails.failedAt = new Date();
        
        console.log('❌ Payment failed, keeping order as pending');
      }

      // Update order
      const updatedOrder = await this.Model.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true, runValidators: true }
      ).populate('user', 'name email phone')
       .populate('address')
       .populate('voucher')
       .populate('paymentMethod')
       .populate({
         path: 'items.productVariant',
         populate: {
           path: 'product color size',
           select: 'name images price salePrice'
         }
       });

      console.log('✅ Order payment status updated:', {
        orderId,
        newPaymentStatus: updatedOrder.paymentStatus,
        newStatus: updatedOrder.status
      });

      // Send confirmation email for successful payment (VNPay or COD)
      if (paymentStatus === 'paid' && updatedOrder.user && updatedOrder.user.email) {
        try {
          console.log('📧 Sending payment confirmation email for order:', updatedOrder.orderCode);
          
          const orderDataForEmail = {
            _id: updatedOrder._id,
            orderCode: updatedOrder.orderCode,
            items: updatedOrder.items,
            total: updatedOrder.total,
            discountAmount: updatedOrder.discountAmount || 0,
            shippingFee: updatedOrder.shippingFee || 0,
            finalTotal: updatedOrder.finalTotal,
            address: updatedOrder.address,
            createdAt: updatedOrder.createdAt,
            paymentMethod: updatedOrder.paymentMethod,
            voucher: updatedOrder.voucher
          };
          
          await this.emailService.sendOrderConfirmationEmail(
            updatedOrder.user.email,
            updatedOrder.user.name || 'Khách hàng',
            orderDataForEmail
          );
          
          console.log('✅ Payment confirmation email sent successfully');
        } catch (emailError) {
          console.error('❌ Failed to send payment confirmation email:', emailError.message);
          // Don't throw error - payment update should still succeed
        }
      }

      return updatedOrder;
    } catch (error) {
      console.error('❌ Error updating order payment status:', error);
      throw new AppError(`Error updating payment status: ${error.message}`, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Get order by order code (for VNPay transaction reference)
   * @param {string} orderCode - Order code
   * @returns {Object} Order object
   */
  async getOrderByCode(orderCode) {
    try {
      const order = await this.Model.findOne({ orderCode })
        .populate('user', 'name email phone')
        .populate('address')
        .populate('voucher')
        .populate('paymentMethod')
        .populate({
          path: 'items.productVariant',
          populate: {
            path: 'product color size',
            select: 'name images price salePrice'
          }
        });

      if (!order) {
        throw new AppError(orderMessages.ORDER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
      }

      return order;
    } catch (error) {
      throw new AppError(`Error getting order by code: ${error.message}`, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Check if order can be paid (for VNPay validation)
   * @param {string} orderId - Order ID
   * @returns {boolean} Whether order can be paid
   */
  async canOrderBePaid(orderId) {
    try {
      const order = await this.Model.findById(orderId);
      
      if (!order) {
        return false;
      }

      // Order can be paid if:
      // 1. Payment status is pending
      // 2. Order status is pending or processing
      return order.paymentStatus === 'pending' && 
             ['pending', 'processing'].includes(order.status);
    } catch (error) {
      console.error('Error checking if order can be paid:', error);
      return false;
    }
  }
}

module.exports = OrderService;
