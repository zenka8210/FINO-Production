const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { 
  promotionCreateSchema, 
  promotionUpdateSchema, 
  promotionStatusSchema,
  calculateDiscountSchema 
} = require('../middlewares/validationSchemas');

// Public routes - Lấy khuyến mãi công khai
router.get('/active', promotionController.getActivePromotions);
router.get('/product/:productId', promotionController.getPromotionForProduct);
router.post('/calculate-discount', validateRequest(calculateDiscountSchema), promotionController.calculateDiscountedPrice);

// Admin routes - Quản lý khuyến mãi (yêu cầu đăng nhập admin)
router.use(authMiddleware);
router.use(adminMiddleware);

// CRUD operations
router.get('/', promotionController.getAllPromotions);
router.get('/statistics', promotionController.getPromotionStatistics);
router.get('/:id', promotionController.getPromotionById);
router.post('/', validateRequest(promotionCreateSchema), promotionController.createPromotion);
router.put('/:id', validateRequest(promotionUpdateSchema), promotionController.updatePromotion);
router.delete('/:id', promotionController.deletePromotion);

// Status management
router.patch('/:id/status', validateRequest(promotionStatusSchema), promotionController.togglePromotionStatus);

module.exports = router;
