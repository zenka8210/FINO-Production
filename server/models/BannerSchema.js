const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
  image: { type: String, required: true },
  title: { type: String },
  description: { type: String },
  link: { 
    type: String, 
    required: [true, 'Link là bắt buộc'],
    validate: {
      validator: function(v) {
        if (!v || !v.trim()) return false;
        
        // Check valid link patterns
        const linkPatterns = [
          /^\/products\/[a-fA-F0-9]{24}$/, // Product link
          /^\/categories\/[a-fA-F0-9]{24}$/, // Category link
          /^https?:\/\/.+/, // External URL
          /^\/[a-zA-Z0-9\-\/]+$/ // Internal path
        ];
        
        return linkPatterns.some(pattern => pattern.test(v));
      },
      message: 'Format link không hợp lệ. Link phải là đường dẫn đến sản phẩm, danh mục hoặc URL hợp lệ'
    }
  },
  isActive: { type: Boolean, default: true },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields để tính toán dựa trên timestamps
BannerSchema.virtual('startDate').get(function() {
  return this.createdAt; // Sử dụng createdAt làm ngày bắt đầu
});

BannerSchema.virtual('endDate').get(function() {
  // Mặc định banner có hiệu lực 30 ngày từ khi tạo
  const endDate = new Date(this.createdAt);
  endDate.setDate(endDate.getDate() + 30);
  return endDate;
});

// Instance methods
BannerSchema.methods.isExpired = function() {
  return new Date() > this.endDate;
};

BannerSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate;
};

// Static methods
BannerSchema.statics.getActiveBanners = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    createdAt: { $lte: now },
    // Filter out banners older than 30 days
    createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
  }).sort({ createdAt: -1 });
};

// Pre-save middleware to enforce link requirement
BannerSchema.pre('save', function(next) {
  if (!this.link || !this.link.trim()) {
    return next(new Error('Link là bắt buộc'));
  }
  next();
});

module.exports = mongoose.model('Banner', BannerSchema);
