const mongoose = require('mongoose');

const WishListSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }]
}, { timestamps: true });

module.exports = mongoose.model('WishList', WishListSchema);
