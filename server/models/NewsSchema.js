const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['promotion', 'event', 'update', 'system'], default: 'promotion' },
  relatedPromotion: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion', default: null },
  isPublic: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('News', NewsSchema);
