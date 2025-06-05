const express = require('express');
const router = express.Router();
const returnRequestController = require('../controllers/returnRequestController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { 
  returnRequestCreateSchema, 
  returnRequestUpdateSchema 
} = require('../middlewares/validationSchemas');

// All return request routes require authentication
router.use(authMiddleware);

// User routes - Người dùng quản lý yêu cầu trả hàng của mình
router.get('/my-requests', returnRequestController.getMyReturnRequests);
router.post('/', validateRequest(returnRequestCreateSchema), returnRequestController.createReturnRequest);
router.delete('/:id', returnRequestController.deleteReturnRequest);

// Shared routes - Cả user và admin có thể xem chi tiết
router.get('/:id', returnRequestController.getReturnRequestById);

// Admin routes - Quản lý tất cả yêu cầu trả hàng
router.use(adminMiddleware);

router.get('/', returnRequestController.getAllReturnRequests);
router.get('/statistics/overview', returnRequestController.getReturnRequestStatistics);
router.patch('/:id/status', validateRequest(returnRequestUpdateSchema), returnRequestController.updateReturnRequestStatus);

module.exports = router;
