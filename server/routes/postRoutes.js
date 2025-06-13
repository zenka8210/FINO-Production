const express = require('express');
const router = express.Router();
const PostController = require('../controllers/postController');
const postController = new PostController();
const authMiddleware = require('../middlewares/authMiddleware'); 
const validateObjectId = require('../middlewares/validateObjectId');
const adminMiddleware = require('../middlewares/adminMiddleware');


// @route GET /api/posts
// @desc Lấy tất cả bài viết (public)
// @access Public
router.get('/', postController.getAllPosts);

// @route GET /api/posts/:id
// @desc Lấy chi tiết bài viết (public)
// @access Public
router.get('/:id', validateObjectId('id'), postController.getPostById);

// @route POST /api/posts
// @desc Tạo bài viết mới (yêu cầu đăng nhập cho bất kỳ user nào)
// @access Private (User)
router.post('/', authMiddleware, postController.createPost);

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


module.exports = router;
