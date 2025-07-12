const mongoose = require('mongoose');

const SizeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Tên kích thước là bắt buộc'],
    unique: true, 
    trim: true,
    validate: {
      validator: function(value) {
        // Linh hoạt hơn: cho phép admin tự tạo size mới
        return /^[a-zA-ZÀ-ỹ0-9\s\-]+$/.test(value);
      },
      message: 'Tên kích thước chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch ngang'
    },
    minlength: [1, 'Tên kích thước không được để trống'],
    maxlength: [20, 'Tên kích thước không được vượt quá 20 ký tự']
  },
  category: {
    type: String,
    enum: ['clothing', 'shoes', 'accessories'],
    default: 'clothing'
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

// Lấy gợi ý size từ database + backup mặc định
SizeSchema.statics.getSuggestedSizes = async function(category = null) {
  try {
    let query = { isActive: true };
    if (category) {
      query.category = category;
    }
    
    // Lấy sizes từ database
    const existingSizes = await this.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(15)
      .select('name category')
      .lean();
    
    // Backup sizes mặc định
    const backupSizes = {
      clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'],
      shoes: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
      accessories: ['Free Size', 'Nhỏ', 'Vừa', 'Lớn']
    };
    
    if (category) {
      // Trả về sizes cho category cụ thể
      const existingNames = existingSizes.map(s => s.name);
      const backup = backupSizes[category] || [];
      
      const combined = [...existingNames];
      backup.forEach(size => {
        if (!combined.includes(size)) {
          combined.push(size);
        }
      });
      
      return combined.slice(0, 15);
    } else {
      // Trả về tất cả sizes, group theo category
      const result = {};
      
      // Group existing sizes
      existingSizes.forEach(size => {
        if (!result[size.category]) {
          result[size.category] = [];
        }
        result[size.category].push(size.name);
      });
      
      // Add backup sizes
      Object.keys(backupSizes).forEach(cat => {
        if (!result[cat]) {
          result[cat] = [];
        }
        backupSizes[cat].forEach(size => {
          if (!result[cat].includes(size)) {
            result[cat].push(size);
          }
        });
      });
      
      return result;
    }
  } catch (error) {
    // Fallback nếu có lỗi database
    const fallback = {
      clothing: ['S', 'M', 'L', 'XL'],
      shoes: ['38', '39', '40', '41', '42'],
      accessories: ['Free Size']
    };
    return category ? (fallback[category] || []) : fallback;
  }
};

module.exports = mongoose.model('Size', SizeSchema);