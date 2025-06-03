const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
  name: { type: String, required: true },  // Tên chương trình khuyến mãi
  type: { type: String, enum: ['percent', 'fixed', 'bundle'], required: true },
  value: { type: Number, required: true }, // giá trị giảm (theo % hoặc tiền cố định)
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // Sản phẩm áp dụng
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Promotion', PromotionSchema);
