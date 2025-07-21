const mongoose = require('mongoose');

const OrderDetailsSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  productVariant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  totalPrice: { type: Number, required: true }, 
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderCode: { 
    type: String, 
    unique: true, 
    required: true
  }, // Mã đơn hàng thân thiện: DH2025071100001
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [OrderDetailsSchema],
  address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true }, // Địa chỉ giao hàng
  total: { type: Number }, // Tổng tiền trước khi áp dụng voucher và phí vận chuyển
  voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },
  discountAmount: { type: Number, default: 0 }, // Số tiền giảm giá từ voucher
  shippingFee: { type: Number, required: true }, // Phí vận chuyển (tính động)
  finalTotal: { type: Number }, // Tổng tiền sau khi áp dụng voucher và phí vận chuyển (total - discountAmount + shippingFee)
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod', required: true },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' } // Sửa từ 'Status' thành 'paymentStatus'
}, { timestamps: true });

// Index để tối ưu truy vấn
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
