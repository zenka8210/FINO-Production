const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 8, maxlength: 30 },
  email: { type: String, required: true, unique: true, lowercase: true, 
           match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'] },
  password: { type: String, required: true, minlength: 8 }, 
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  full_name: { type: String, maxlength: 60 },
  phone: { type: String, maxlength: 11 },
  address: { type: String },
  avatar: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true });

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
