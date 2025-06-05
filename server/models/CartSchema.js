const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: {
    color: { type: String, required: true },
    size: { type: String, required: true },
    weight: { type: Number }
  },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // Giá tại thời điểm thêm vào giỏ
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [CartItemSchema],
  lastModified: { type: Date, default: Date.now }
}, { timestamps: true });

// Middleware để cập nhật lastModified khi có thay đổi
CartSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Virtual để tính tổng tiền giỏ hàng
CartSchema.virtual('totalAmount').get(function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Virtual để đếm tổng số sản phẩm trong giỏ
CartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Ensure virtuals are included when converting to JSON
CartSchema.set('toJSON', { virtuals: true });
CartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', CartSchema);
