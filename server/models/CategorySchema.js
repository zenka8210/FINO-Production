const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Tên danh mục là bắt buộc'], 
    unique: true, 
    trim: true,
    minlength: [2, 'Tên danh mục phải có ít nhất 2 ký tự'],
    maxlength: [100, 'Tên danh mục không được vượt quá 100 ký tự']
  },
  description: { 
    type: String,
    maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
  },
  parent: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    default: null 
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Validate không thể set parent là chính nó (prevent circular reference)
CategorySchema.pre('save', function(next) {
  if (this.parent && this.parent.toString() === this._id.toString()) {
    const error = new Error('Danh mục không thể làm cha của chính nó');
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Category', CategorySchema);
