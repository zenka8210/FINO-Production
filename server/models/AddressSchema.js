const mongoose = require('mongoose');

// Schema địa chỉ giao hàng
const AddressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người dùng
  fullName: { type: String, required: true }, // Họ tên người nhận
  phone: { type: String, required: true }, // Số điện thoại
  addressLine: { type: String, required: true }, // Địa chỉ chi tiết
  city: { type: String, required: true }, // Thành phố
  district: { type: String, required: true }, // Quận/huyện
  ward: { type: String, required: true }, // Phường/xã
  isDefault: { type: Boolean, default: false }, // Địa chỉ mặc định
}, { timestamps: true });

module.exports = mongoose.models.Address || mongoose.model('Address', AddressSchema);
