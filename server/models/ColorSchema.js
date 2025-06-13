const mongoose = require('mongoose');


const ColorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }, // Tên màu (e.g., "Đỏ", "Xanh dương")
  
}, { timestamps: true }
);

module.exports = mongoose.model('Color', ColorSchema);