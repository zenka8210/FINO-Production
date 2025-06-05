const BaseController = require('./baseController');
const PromotionService = require('../services/promotionService');
const ResponseHandler = require('../services/responseHandler');
const { catchAsync } = require('../middlewares/errorHandler');

class PromotionController extends BaseController {
  constructor() {
    super(null); // We don't use the base model pattern here
    this.promotionService = new PromotionService();
  }

  // Lấy tất cả chương trình khuyến mãi với phân trang và lọc
  getAllPromotions = catchAsync(async (req, res) => {
    const result = await this.promotionService.getAllPromotions(req.query);
    return ResponseHandler.success(res, result, result.message);
  });

  // Lấy khuyến mãi theo ID
  getPromotionById = catchAsync(async (req, res) => {
    const result = await this.promotionService.getPromotionById(req.params.id);
    return ResponseHandler.success(res, result.promotion, result.message);
  });

  // Lấy khuyến mãi đang hoạt động
  getActivePromotions = catchAsync(async (req, res) => {
    const result = await this.promotionService.getActivePromotions(req.query);
    return ResponseHandler.success(res, result.promotions, result.message);
  });

  // Tạo chương trình khuyến mãi mới
  createPromotion = catchAsync(async (req, res) => {
    const result = await this.promotionService.createPromotion(req.body);
    return ResponseHandler.success(res, result.promotion, result.message, 201);
  });

  // Cập nhật chương trình khuyến mãi
  updatePromotion = catchAsync(async (req, res) => {
    const result = await this.promotionService.updatePromotion(req.params.id, req.body);
    return ResponseHandler.success(res, result.promotion, result.message);
  });

  // Xóa chương trình khuyến mãi
  deletePromotion = catchAsync(async (req, res) => {
    const result = await this.promotionService.deletePromotion(req.params.id);
    return ResponseHandler.success(res, null, result.message);
  });

  // Kích hoạt/tắt chương trình khuyến mãi
  togglePromotionStatus = catchAsync(async (req, res) => {
    const { active } = req.body;
    const result = await this.promotionService.togglePromotionStatus(req.params.id, active);
    return ResponseHandler.success(res, result.promotion, result.message);
  });

  // Lấy khuyến mãi cho sản phẩm
  getPromotionForProduct = catchAsync(async (req, res) => {
    const result = await this.promotionService.getPromotionForProduct(req.params.productId);
    return ResponseHandler.success(res, result.promotion, result.message);
  });

  // Tính giá sau khuyến mãi
  calculateDiscountedPrice = catchAsync(async (req, res) => {
    const { originalPrice, promotionId } = req.body;
    
    if (!promotionId) {
      return ResponseHandler.success(res, { 
        originalPrice, 
        discountedPrice: originalPrice 
      }, 'Không có khuyến mãi áp dụng');
    }

    const promotionResult = await this.promotionService.getPromotionById(promotionId);
    const discountedPrice = this.promotionService.calculateDiscountedPrice(
      originalPrice, 
      promotionResult.promotion
    );

    return ResponseHandler.success(res, {
      originalPrice,
      discountedPrice,
      discount: originalPrice - discountedPrice,
      promotion: promotionResult.promotion
    }, 'Tính giá khuyến mãi thành công');
  });

  // Lấy thống kê khuyến mãi
  getPromotionStatistics = catchAsync(async (req, res) => {
    const result = await this.promotionService.getPromotionStatistics();
    return ResponseHandler.success(res, result.statistics, result.message);
  });
}

module.exports = new PromotionController();