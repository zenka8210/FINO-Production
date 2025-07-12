const mongoose = require('mongoose');

const ProductVariantSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  color: { type: mongoose.Schema.Types.ObjectId, ref: 'Color', required: true },
  size: { type: mongoose.Schema.Types.ObjectId, ref: 'Size', required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, min: 0 }, // Stock cannot be negative
  sku: { type: String, unique: true }, // SKU for inventory tracking
  images: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Virtual for checking if variant is in stock
ProductVariantSchema.virtual('isInStock').get(function() {
  return this.stock > 0;
});

// Index for unique combination of product, color, size
ProductVariantSchema.index({ product: 1, color: 1, size: 1 }, { unique: true });

ProductVariantSchema.set('toJSON', { virtuals: true });
ProductVariantSchema.set('toObject', { virtuals: true }); 

module.exports = mongoose.model('ProductVariant', ProductVariantSchema);