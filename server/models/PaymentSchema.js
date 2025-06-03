const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  method: { type: String, enum: ['COD', 'CreditCard', 'BankTransfer', 'Momo', 'ZaloPay', 'VNPay'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
  transactionId: { type: String }, // Mã giao dịch của cổng thanh toán
  paymentDate: { type: Date, default: Date.now }
}, {
  timestamps: true
});


module.exports = mongoose.model('Payment', paymentSchema);
