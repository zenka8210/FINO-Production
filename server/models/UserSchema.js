const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Email không hợp lệ'],
    validate: {
      validator: function(email) {
        // Additional validation for common domain typos
        const commonDomainTypos = [
          'gmai.com', 'gmal.com', 'gmial.com', 'gnail.com', 'gamil.com',
          'yahho.com', 'yaho.com', 'hotmai.com', 'hotmial.com', 'hotmil.com',
          'outlok.com', 'outloo.com'
        ];
        
        const domain = email.split('@')[1]?.toLowerCase();
        return !commonDomainTypos.includes(domain);
      },
      message: 'Email domain không hợp lệ. Vui lòng kiểm tra lại địa chỉ email.'
    }
  },
  password: { type: String, required: true, minlength: 8 }, 
  name: { type: String, maxlength: 60 },
  phone: { type: String, maxlength: 11 },
  address: { type: String },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  isActive: { type: Boolean, default: true },
  
  // Password reset fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

// Middleware to prevent email modification after creation
UserSchema.pre('save', function(next) {
  if (!this.isNew && this.isModified('email')) {
    const error = new Error('Email không thể được thay đổi sau khi tạo tài khoản');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});
// Middleware hash password trước khi lưu
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// So sánh mật khẩu khi đăng nhập
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
