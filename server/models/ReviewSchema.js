const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }, // Liên kết với đơn hàng
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
}, { timestamps: true });

// Đảm bảo mỗi user chỉ review 1 lần cho 1 sản phẩm trong 1 đơn hàng
ReviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

// Instance methods
ReviewSchema.methods.canEdit = function() {
  const now = new Date();
  const createdTime = new Date(this.createdAt);
  const hoursDiff = (now - createdTime) / (1000 * 60 * 60);
  return hoursDiff <= 48; // Chỉ được sửa trong 48h
};

module.exports = mongoose.model('Review', ReviewSchema);
