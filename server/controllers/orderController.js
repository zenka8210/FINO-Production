const Order = require('../models/orderSchema');
const Voucher = require('../models/voucherSchema');
const Payment = require('../models/paymentSchema');
const Product = require('../models/productSchema');

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, payment, paymentMethod, voucherCode, shippingFee } = req.body;
    const user = req.user._id;

    const validPaymentMethods = ['COD', 'CreditCard', 'BankTransfer', 'Momo', 'ZaloPay', 'VNPay'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Danh sách sản phẩm không được để trống' });
    }

    // Validate shippingAddress đủ trường cần thiết (có thể bổ sung nếu muốn)
    if (!shippingAddress || !shippingAddress.city) {
      return res.status(400).json({ message: 'Địa chỉ vận chuyển không hợp lệ' });
    }

    const originalTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discountAmount = 0;
    let appliedVoucher = null;

    // Tính phí vận chuyển mặc định theo thành phố
    let shippingFeeDefault = 60000; // mặc định
    const cityNormalized = shippingAddress.city.trim().toLowerCase();
    if (cityNormalized === 'hcm' || cityNormalized === 'tp.hcm' || cityNormalized === 'thành phố hồ chí minh') {
      shippingFeeDefault = 30000;
    }

    // Nếu client gửi shippingFee thì ưu tiên dùng, không thì dùng default
    const shippingFeeValue = typeof shippingFee === 'number' ? shippingFee : shippingFeeDefault;

    if (voucherCode) {
      const voucher = await Voucher.findOne({
        code: voucherCode,
        status: 'active',
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        quantity: { $gt: 0 }
      });

      if (!voucher) {
        return res.status(400).json({ message: 'Voucher không hợp lệ hoặc đã hết hạn' });
      }

      if (voucher.type === 'percentage') {
        discountAmount = (originalTotal * voucher.value) / 100;
      } else if (voucher.type === 'fixed') {
        discountAmount = voucher.value;
      }

      if (discountAmount > originalTotal) discountAmount = originalTotal;

      voucher.quantity -= 1;
      await voucher.save();

      appliedVoucher = voucher;
    }

    const finalTotal = originalTotal - discountAmount + shippingFeeValue;

    const newOrder = new Order({
      user,
      items,
      shippingAddress,
      originalTotal,
      discountAmount,
      voucher: appliedVoucher ? appliedVoucher._id : null,
      payment,
      paymentMethod,
      status: 'pending',
      shippingFee: shippingFeeValue,
      shippingMethod: 'standard',
      note: '',
      finalTotal: finalTotal,
      paymentStatus: 'unpaid'
    });

    const savedOrder = await newOrder.save();
    return res.status(201).json({ message: 'Tạo đơn hàng thành công', order: savedOrder });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi tạo đơn hàng', error: error.message });
  }
};


// [Admin] Lấy danh sách đơn hàng
exports.getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('payment')
      .populate('voucher')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalOrders = await Order.countDocuments();

    return res.json({
      message: 'Lấy danh sách đơn hàng thành công',
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng', error: error.message });
  }
};

// [Auth] Lấy đơn hàng theo ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('payment')
      .populate('voucher');

    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập đơn hàng này' });
    }

    return res.json({ message: 'Lấy đơn hàng thành công', order });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi lấy đơn hàng', error: error.message });
  }
};

// [Admin] Cập nhật địa chỉ giao hàng
exports.updateShippingAddress = async (req, res) => {
  try {
    const { fullName, phone, address, city, district, ward } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { shippingAddress: { fullName, phone, address, city, district, ward } },
      { new: true }
    );

    if (!updatedOrder) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    return res.json({ message: 'Cập nhật địa chỉ giao hàng thành công', order: updatedOrder });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi cập nhật địa chỉ giao hàng', error: error.message });
  }
};

// [Admin] Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updatedOrder) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    return res.json({ message: 'Cập nhật trạng thái đơn hàng thành công', order: updatedOrder });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái', error: error.message });
  }
};

// [Admin] Cập nhật tổng tiền và giảm giá
exports.updateTotalAndDiscount = async (req, res) => {
  try {
    const { total: totalInput, discountAmount: discountInput, voucherCode } = req.body;

    // Tìm đơn hàng
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    // Parse các giá trị, fallback nếu không gửi từ req.body
    const total = totalInput !== undefined ? Number(totalInput) : order.total;
    const discountAmount = discountInput !== undefined ? Number(discountInput) : order.discountAmount || 0;
    const shippingFee = Number(order.shippingFee) || 0;

    // VALIDATION
    if (isNaN(total)) {
      return res.status(400).json({ message: 'Tổng tiền không hợp lệ' });
    }
    if (total <= 0) {
      return res.status(400).json({ message: 'Tổng tiền phải lớn hơn 0' });
    }

    if (isNaN(discountAmount)) {
      return res.status(400).json({ message: 'Giảm giá không hợp lệ' });
    }
    if (discountAmount < 0) {
      return res.status(400).json({ message: 'Giảm giá không được âm' });
    }
    if (discountAmount > total) {
      return res.status(400).json({ message: 'Giảm giá không được vượt quá tổng tiền' });
    }

    // Voucher validate
    let voucherId = order.voucher || null;
    if (voucherCode) {
      const voucher = await Voucher.findOne({ code: voucherCode });
      if (!voucher) {
        return res.status(400).json({ message: 'Voucher không hợp lệ' });
      }
      voucherId = voucher._id;
    }

    // Tính finalTotal
    const finalTotal = total - discountAmount + shippingFee;
    if (finalTotal < 0) {
      return res.status(400).json({ message: 'Tổng tiền sau giảm và phí vận chuyển không hợp lệ (nhỏ hơn 0)' });
    }

    // Cập nhật đơn hàng
    order.total = total;
    order.discountAmount = discountAmount;
    order.voucher = voucherId;
    order.finalTotal = finalTotal;

    await order.save();

    return res.json({
      message: 'Cập nhật tổng tiền và voucher thành công',
      order,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi khi cập nhật tổng tiền và voucher',
      error: error.message,
    });
  }
};



// [Admin] Cập nhật phương thức thanh toán
exports.updatePaymentInfo = async (req, res) => {
  try {
    const { paymentMethod, paymentId } = req.body;

    if (paymentMethod) {
      const validPaymentMethods = ['COD', 'CreditCard', 'BankTransfer', 'Momo', 'ZaloPay', 'VNPay'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ' });
      }
    }

    let payment = null;
    if (paymentId) {
      payment = await Payment.findById(paymentId);
      if (!payment) return res.status(400).json({ message: 'Payment ID không hợp lệ' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentMethod, payment: payment ? payment._id : undefined },
      { new: true }
    );

    if (!updatedOrder) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    return res.json({ message: 'Cập nhật thông tin thanh toán thành công', order: updatedOrder });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi cập nhật thông tin thanh toán', error: error.message });
  }
};

// [Admin] Cập nhật trạng thái thanh toán
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const validPaymentStatuses = ['unpaid', 'paid'];

    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Trạng thái thanh toán không hợp lệ' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { paymentStatus }, { new: true });

    if (!updatedOrder) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    return res.json({ message: 'Cập nhật trạng thái thanh toán thành công', order: updatedOrder });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái thanh toán', error: error.message });
  }
};

// [Admin] Xóa đơn hàng
exports.deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng để xóa' });
    }

    return res.json({ message: 'Xóa đơn hàng thành công', order: deletedOrder });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi xóa đơn hàng', error: error.message });
  }
};


// [User] Lấy đơn hàng của chính người dùng
exports.getOrdersByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập đơn hàng của người khác' });
    }

    const orders = await Order.find({ user: userId })
      .populate('payment')
      .populate('voucher')
      .sort({ createdAt: -1 });

    return res.json({ message: 'Lấy đơn hàng của user thành công', orders });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi lấy đơn hàng của user', error: error.message });
  }
};

// [User] Kiểm tra xem user có thể đánh giá sản phẩm không
exports.canReviewProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({
      user: userId,
      status: 'delivered',
      'items.product': productId
    });

    if (!order) {
      return res.status(403).json({ message: 'Bạn chưa mua sản phẩm này hoặc đơn chưa được giao' });
    }

    return res.json({ message: 'Bạn có thể đánh giá sản phẩm', canReview: true });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi kiểm tra quyền đánh giá', error: error.message });
  }
};
