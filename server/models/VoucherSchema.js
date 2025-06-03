const mongoose = require('mongoose');

const VoucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['percent', 'fixed'], required: true }, // 'percent' (giảm %) hoặc 'fixed' (giảm tiền cụ thể)
  value: { type: Number, required: true }, // Ví dụ: 20 (20%) hoặc 50000 (50k)
  expiresAt: { type: Date }, // Hạn sử dụng
  usageLimit: { type: Number }, // Số lượt sử dụng tối đa
  usedCount: { type: Number, default: 0 }, // Số lượt đã dùng
  isActive: { type: Boolean, default: true } // Đang hoạt động hay không
}, { timestamps: true });

module.exports = mongoose.model('Voucher', VoucherSchema);
