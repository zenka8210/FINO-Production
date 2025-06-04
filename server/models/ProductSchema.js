const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  images: [String], // array of image URLs
  variants: [VariantSchema],
  brand: { type: String },
  isFeatured: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
