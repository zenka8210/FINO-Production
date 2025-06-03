const mongoose = require('mongoose');

const ReturnItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: String }, // hoặc ObjectId nếu bạn có schema riêng variant
  quantity: { type: Number, required: true, min: 1 },
  priceAtPurchase: { type: Number, required: true, min: 0 }, // giá mua lúc đó
  reason: { type: String, required: true }, // lý do trả hàng item này
});

const ReturnRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  items: [ReturnItemSchema],
  reasonGeneral: { type: String }, // lý do chung
  refundAmount: { type: Number, required: true, min: 0 }, // tổng tiền hoàn trả đã tính toán
  voucherApplied: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null }, // voucher nếu có
  voucherDiscount: { type: Number, default: 0, min: 0 }, // số tiền voucher giảm trong đơn đổi trả
  restockingFee: { type: Number, default: 0, min: 0 }, // phí xử lý (nếu có)
  refundStatus: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  returnDeadline: { type: Date }, // ngày hết hạn trả hàng
  adminNotes: { type: String }, // ghi chú admin
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware cập nhật updatedAt mỗi khi save
ReturnRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ReturnRequest', ReturnRequestSchema);
