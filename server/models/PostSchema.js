const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người viết bài
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  image: { type: String, required: true }, // URL của hình ảnh
  describe: { type: String, required: true }, // Mô tả ngắn về bài viết
  isPublished: { type: Boolean, default: true }, // Admin có thể ẩn bài viết
}, {
  timestamps: true
});

// Static method để lấy bài viết đã được xuất bản (public)
PostSchema.statics.getPublishedPosts = function(options = {}) {
  const { page = 1, limit = 10, author } = options;
  const skip = (page - 1) * limit;
  
  let filter = { isPublished: true };
  if (author) filter.author = author;
  
  return this.find(filter)
    .populate('author', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
};

// Instance method để kiểm tra bài viết có được xuất bản không
PostSchema.methods.isVisible = function() {
  return this.isPublished;
};

module.exports = mongoose.model('Post', PostSchema);
