const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người viết bài
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  image: { type: String, required: true }, // URL của hình ảnh
  describe: { type: String, required: true }, // Mô tả ngắn về bài viết
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', PostSchema);
