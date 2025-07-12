const mongoose = require('mongoose');

const ColorSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Tên màu sắc là bắt buộc'],
    unique: true, 
    trim: true,
    validate: {
      validator: function(value) {
        // Linh hoạt hơn: cho phép chữ cái, số, khoảng trắng và một số ký tự cơ bản
        return /^[a-zA-ZÀ-ỹ0-9\s\-]+$/.test(value);
      },
      message: 'Tên màu sắc chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch ngang'
    },
    minlength: [1, 'Tên màu sắc không được để trống'],
    maxlength: [50, 'Tên màu sắc không được vượt quá 50 ký tự']
  },
  description: {
    type: String,
    maxlength: [200, 'Mô tả không được vượt quá 200 ký tự']
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Lấy gợi ý màu từ database + backup mặc định
ColorSchema.statics.getSuggestedColors = async function() {
  try {
    // Lấy top màu phổ biến từ database (theo usage hoặc displayOrder)
    const existingColors = await this.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(20)
      .select('name')
      .lean();
    
    // Backup màu cơ bản nếu database trống
    const backupColors = [
      'Đen', 'Trắng', 'Xám', 'Đỏ', 'Xanh dương', 'Xanh lá', 
      'Vàng', 'Tím', 'Hồng', 'Cam', 'Nâu', 'Be'
    ];
    
    const existingColorNames = existingColors.map(c => c.name);
    
    // Combine existing + backup (loại bỏ duplicate)
    const allSuggestions = [...existingColorNames];
    backupColors.forEach(color => {
      if (!allSuggestions.includes(color)) {
        allSuggestions.push(color);
      }
    });
    
    return allSuggestions.slice(0, 20); // Giới hạn 20 gợi ý
  } catch (error) {
    // Fallback nếu có lỗi database
    return ['Đen', 'Trắng', 'Xám', 'Đỏ', 'Xanh', 'Vàng'];
  }
};

module.exports = mongoose.model('Color', ColorSchema);

module.exports = mongoose.model('Color', ColorSchema);