const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, 
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  full_name: { type: String },
  phone: { type: String },
  address: { type: String },
}, { timestamps: true });

// Middleware chạy trước khi save document user
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next(); // nếu password chưa thay đổi thì bỏ qua

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Hàm so sánh password khi đăng nhập
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
