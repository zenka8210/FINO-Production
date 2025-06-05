const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const validateRequest = require('../middlewares/validateRequest');
const { newsSchemas } = require('../middlewares/validationSchemas');
const authenticateToken = require('../middlewares/authMiddleware');
const checkAdminRole = require('../middlewares/adminMiddleware');

// Public routes - không yêu cầu authentication
// GET /api/news/public - Lấy tin tức công khai
router.get('/public', newsController.getPublicNews);

// GET /api/news/public/:slug - Lấy tin tức theo slug
router.get('/public/:slug', newsController.getNewsBySlug);

// GET /api/news/public/:id/related - Lấy tin tức liên quan
router.get('/public/:id/related', newsController.getRelatedNews);

// Protected routes - yêu cầu authentication và admin role
router.use(authenticateToken);
router.use(checkAdminRole);

// GET /api/news - Lấy tất cả tin tức (Admin)
router.get('/', newsController.getAllNews);

// GET /api/news/:id - Lấy tin tức theo ID (Admin)
router.get('/:id', newsController.getNewsById);

// POST /api/news - Tạo tin tức mới (Admin)
router.post('/', 
  validateRequest(newsSchemas.create), 
  newsController.createNews
);

// PUT /api/news/:id - Cập nhật tin tức (Admin)
router.put('/:id', 
  validateRequest(newsSchemas.update), 
  newsController.updateNews
);

// DELETE /api/news/:id - Xóa tin tức (Admin)
router.delete('/:id', newsController.deleteNews);

module.exports = router;
