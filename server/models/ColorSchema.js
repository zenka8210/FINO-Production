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
    maxlength: [10, 'Tên màu sắc không được vượt quá 10 ký tự']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Lấy gợi ý màu từ database + backup mặc định
ColorSchema.statics.getSuggestedColors = async function() {
  try {
    // Lấy top màu phổ biến từ database (theo usage hoặc createdAt)
    const existingColors = await this.find({ isActive: true })
      .sort({ createdAt: -1 })
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