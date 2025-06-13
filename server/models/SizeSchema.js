const mongoose = require('mongoose');

// Embedded Color Schema
const SizeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }, // Tên size (e.g., "S", "M", "L", "XL")

}, { timestamps: true });

module.exports = mongoose.model('Size', SizeSchema);