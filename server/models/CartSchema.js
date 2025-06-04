const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['percent', 'fixed'], required: true },
  value: { type: Number, required: true },
  expiresAt: { type: Date },
  usageLimit: { type: Number },
  usedCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', CouponSchema);
