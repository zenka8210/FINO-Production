const mongoose = require('mongoose');

const ProductVariantSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  color: { type: mongoose.Schema.Types.ObjectId, ref: 'Color', required: true },
  size: { type: mongoose.Schema.Types.ObjectId, ref: 'Size', required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  images: [String]
}, { timestamps: true }); 

module.exports = mongoose.model('ProductVariant', ProductVariantSchema);