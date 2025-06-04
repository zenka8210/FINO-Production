const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  variant: {
    color: String,
    size: String
  },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }
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
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  paymentMethod: { type: String, enum: ['COD', 'CreditCard', 'BankTransfer', 'Momo', 'ZaloPay', 'VNPay'] },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' }
}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
