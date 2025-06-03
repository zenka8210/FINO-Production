const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
  image: { type: String, required: true },
  title: { type: String },
  description: { type: String },
  link: { type: String }, // chuyển đến sản phẩm hoặc category
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Banner', BannerSchema);
