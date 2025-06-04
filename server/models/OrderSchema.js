const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  variant: {
    color: String,
    size: String,
    weight: Number,
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  images: {String},
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [OrderItemSchema],
  shippingAddress: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    district: String,
    ward: String
  },
  total: { type: Number },
  discountAmount: { type: Number, default: 0 },       
  voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },
  shippingFee: { type: Number, default: 30000 }, // Phí vận chuyển
  shippingMethod: { type: String, enum: ['standard', 'express'], default: 'standard' },
  note: { type: String, default: '' },
  finalTotal: { type: Number }, // Tổng tiền sau khi áp dụng voucher và phí vận chuyển 
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  refundStatus: { type: String, enum: ['none', 'requested', 'approved', 'rejected', 'refunded'], default: 'none' },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  paymentMethod: { type: String, enum: ['COD', 'CreditCard', 'BankTransfer', 'Momo', 'ZaloPay', 'VNPay'] },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' }
}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
