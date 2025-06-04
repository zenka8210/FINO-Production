const Order = require('../models/orderSchema');
const Voucher = require('../models/voucherSchema');
const Payment = require('../models/paymentSchema');

// Tạo đơn hàng mới (user phải đăng nhập)
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, payment, paymentMethod, voucherCode, paymentStatus } = req.body;
    const user = req.user._id;

    const validPaymentMethods = ['COD', 'CreditCard', 'BankTransfer', 'Momo', 'ZaloPay', 'VNPay'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ' });
    }

    const originalTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let discountAmount = 0;
    let finalTotal = originalTotal;
    let appliedVoucher = null;

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
      finalTotal = originalTotal - discountAmount;

      voucher.quantity -= 1;
      await voucher.save();

      appliedVoucher = voucher;
    }

    const newOrder = new Order({
      user,
      items,
      shippingAddress,
      total: finalTotal,
      discountAmount,
      voucher: appliedVoucher ? appliedVoucher._id : null,
      payment,
      paymentMethod,
      status: 'pending',
      paymentStatus: paymentStatus || 'unpaid'
    });

    const savedOrder = await newOrder.save();
    return res.status(201).json({ message: 'Tạo đơn hàng thành công', order: savedOrder });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi tạo đơn hàng', error: error.message });
  }
};

// [Admin] Lấy danh sách tất cả đơn hàng (có phân trang)
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

// [Auth] Lấy đơn hàng theo ID (admin hoặc chính chủ)
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('payment')
      .populate('voucher');

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    // Admin hoặc chủ đơn hàng mới được xem
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

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng để cập nhật địa chỉ giao hàng' });
    }

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

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng để cập nhật' });
    }

    return res.json({ message: 'Cập nhật trạng thái đơn hàng thành công', order: updatedOrder });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái đơn hàng', error: error.message });
  }
};
// [Admin] Cập nhật tổng tiền và giảm giá (discountAmount và voucher)
exports.updateTotalAndDiscount = async (req, res) => {
  try {
    const { total, discountAmount, voucherCode } = req.body;

    let voucherId = null;
    if (voucherCode) {
      const voucher = await Voucher.findOne({ code: voucherCode });
      if (!voucher) {
        return res.status(400).json({ message: 'Voucher không hợp lệ' });
      }
      voucherId = voucher._id;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { total, discountAmount, voucher: voucherId },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng để cập nhật tổng tiền hoặc voucher' });
    }

    return res.json({ message: 'Cập nhật tổng tiền và voucher thành công', order: updatedOrder });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi cập nhật tổng tiền và voucher', error: error.message });
  }
};
// [Admin] Cập nhật phương thức thanh toán và thông tin thanh toán
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
      if (!payment) {
        return res.status(400).json({ message: 'Payment ID không hợp lệ' });
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentMethod, payment: payment ? payment._id : undefined },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng để cập nhật thanh toán' });
    }

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

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng để cập nhật thanh toán' });
    }

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

    return res.json({ message: 'Xóa đơn hàng thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi xóa đơn hàng', error: error.message });
  }
};

// [User] Lấy đơn hàng của chính người dùng (lịch sử mua hàng)
exports.getOrdersByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Chỉ được xem đơn hàng của chính mình hoặc admin sẽ toàn quyền xem
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
