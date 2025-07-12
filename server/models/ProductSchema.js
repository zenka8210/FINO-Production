const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  description: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // Required - must belong to at least 1 category
  images: [String], // array of image URLs
  isActive: { type: Boolean, default: true }, // Product visibility
  salePrice: { type: Number }, // Sale price (must be less than price)
  saleStartDate: { type: Date }, // Sale period start
  saleEndDate: { type: Date }, // Sale period end
}, { timestamps: true });
ProductSchema.virtual('variants', {
  ref: 'ProductVariant',
  localField: '_id',
  foreignField: 'product'
});

// Virtual for current effective price (considering sale)
ProductSchema.virtual('currentPrice').get(function() {
  if (this.salePrice && this.saleStartDate && this.saleEndDate) {
    const now = new Date();
    if (now >= this.saleStartDate && now <= this.saleEndDate) {
      return this.salePrice;
    }
  }
  return this.price;
});

// Virtual for checking if product is on sale
ProductSchema.virtual('isOnSale').get(function() {
  if (this.salePrice && this.saleStartDate && this.saleEndDate) {
    const now = new Date();
    return now >= this.saleStartDate && now <= this.saleEndDate && this.salePrice < this.price;
  }
  return false;
});

// Validation for sale price
ProductSchema.pre('save', function(next) {
  if (this.salePrice !== undefined && this.salePrice !== null) {
    if (this.salePrice >= this.price) {
      return next(new Error('Giá khuyến mãi phải nhỏ hơn giá gốc'));
    }
    if (this.saleStartDate && this.saleEndDate && this.saleStartDate >= this.saleEndDate) {
      return next(new Error('Ngày bắt đầu khuyến mãi phải nhỏ hơn ngày kết thúc'));
    }
  }
  next();
});

ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);
