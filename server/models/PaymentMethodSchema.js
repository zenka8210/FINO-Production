const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  method: { type: String, enum: ['COD', 'CreditCard', 'BankTransfer', 'Momo', 'ZaloPay', 'VNPay'], required: true },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
