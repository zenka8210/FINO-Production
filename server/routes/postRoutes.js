const express = require('express');
const router = express.Router();
const PostController = require('../controllers/postController');
const postController = new PostController();
const authMiddleware = require('../middlewares/authMiddleware'); 
const validateObjectId = require('../middlewares/validateObjectId');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');


// @route GET /api/posts
// @desc Lấy tất cả bài viết (admin only)
// @access Private (Admin)
router.get('/', authMiddleware, adminMiddleware, queryParserMiddleware(), postController.getAllPosts);

// @route GET /api/posts/published
// @desc Lấy bài viết đã xuất bản (public endpoint)
// @access Public
router.get('/published', postController.getPublishedPosts);

// @route GET /api/posts/:id
// @desc Lấy chi tiết bài viết (public)
// @access Public
router.get('/:id', validateObjectId('id'), postController.getPostById);

// @route POST /api/posts
// @desc Tạo bài viết mới (chỉ admin)
// @access Private (Admin only)
router.post('/', authMiddleware, adminMiddleware, postController.createPost);

// @route PUT /api/posts/:id
// @desc Cập nhật bài viết 
// @note Chỉ tác giả hoặc admin mới có quyền (logic này đã được xử lý trong postService)
// @note authMiddleware đảm bảo người dùng đã đăng nhập và có req.user.role
// @access Private (Author or Admin)
router.put('/:id', validateObjectId('id'), authMiddleware, postController.updatePost);

// @route DELETE /api/posts/:id
// @desc Xóa bài viết
// @note Chỉ tác giả hoặc admin mới có quyền (logic này đã được xử lý trong postService)
// @note authMiddleware đảm bảo người dùng đã đăng nhập và có req.user.role
// @access Private (Author or Admin)
router.delete('/:id', validateObjectId('id'), authMiddleware, postController.deletePost);

// Admin routes
// @route PATCH /api/posts/:id/toggle-visibility
// @desc Admin ẩn/hiện bài viết
// @access Private (Admin only)
router.patch('/:id/toggle-visibility', validateObjectId('id'), authMiddleware, adminMiddleware, postController.togglePostVisibility);

// @route PATCH /api/posts/:id/publish-status
// @desc Admin cập nhật trạng thái xuất bản
// @access Private (Admin only)
router.patch('/:id/publish-status', validateObjectId('id'), authMiddleware, adminMiddleware, postController.updatePublishStatus);

module.exports = router;
