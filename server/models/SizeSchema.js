const mongoose = require('mongoose');

const SizeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Tên kích thước là bắt buộc'],
    unique: true, 
    trim: true,
    validate: [
      {
        validator: function(value) {
          // Kiểm tra không rỗng sau khi trim
          return value && value.trim().length > 0;
        },
        message: 'Tên kích thước không được để trống'
      },
      {
        validator: function(value) {
          // Business Logic: Tên size phải hợp lệ (không được có ký tự đặc biệt)
          return value && /^[a-zA-ZÀ-ỹ0-9\s\-]+$/.test(value.trim());
        },
        message: 'Tên kích thước chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch ngang'
      },
      {
        validator: function(value) {
          // Kiểm tra độ dài
          return value && value.trim().length <= 20;
        },
        message: 'Tên kích thước không được vượt quá 20 ký tự'
      }
    ]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Pre-save hook để chuẩn hóa tên size
SizeSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    // Chuẩn hóa tên size: Trim, uppercase
    this.name = this.name.trim().toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Size', SizeSchema);
