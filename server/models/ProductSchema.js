const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  description: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  images: [String], // array of image URLs
}, { timestamps: true });
ProductSchema.virtual('variants', {
  ref: 'ProductVariant',
  localField: '_id',
  foreignField: 'product'
});
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);
