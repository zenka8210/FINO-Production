const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
  image: { type: String, required: true },
  title: { type: String },
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
  startDate: { 
    type: Date, 
    required: [true, 'Ngày bắt đầu là bắt buộc'],
    default: Date.now
  },
  endDate: { 
    type: Date, 
    required: [true, 'Ngày kết thúc là bắt buộc'],
    validate: {
      validator: function(v) {
        return v > this.startDate;
      },
      message: 'Ngày kết thúc phải sau ngày bắt đầu'
    }
  }
}, { 
  timestamps: true
});

// Pre-save middleware to enforce link requirement and date validation
BannerSchema.pre('save', function(next) {
  if (!this.link || !this.link.trim()) {
    return next(new Error('Link là bắt buộc'));
  }
  
  if (this.endDate <= this.startDate) {
    return next(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
  }
  
  next();
});

module.exports = mongoose.model('Banner', BannerSchema);
