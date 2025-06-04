const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, min: 1, max: 5 },
  comment: { type: String },
  approved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);
