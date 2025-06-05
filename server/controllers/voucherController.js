const BaseController = require('./baseController');
const VoucherService = require('../services/voucherService');
const ResponseHandler = require('../services/responseHandler');

/**
 * Voucher Controller - Quản lý voucher/coupon
 * Extends BaseController để sử dụng các phương thức chung
 */
class VoucherController extends BaseController {
  constructor() {
    super();
    this.voucherService = new VoucherService();
  }

  /**
   * Lấy tất cả voucher (Admin)
   * GET /api/vouchers
   */  getAllVouchers = async (req, res, next) => {
    try {
      const result = await this.voucherService.getAllVouchers(req.query);
      
      return ResponseHandler.success(res, { vouchers: result.vouchers, pagination: result.pagination }, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy voucher theo ID
   * GET /api/vouchers/:id
   */  getVoucherById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.voucherService.getVoucherById(id);
      
      return ResponseHandler.success(res, result.voucher, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Kiểm tra voucher theo mã code
   * GET /api/vouchers/check/:code
   */  checkVoucherByCode = async (req, res, next) => {
    try {
      const { code } = req.params;
      const { orderValue } = req.query;
      
      if (!orderValue) {
        return ResponseHandler.badRequest(res, null, 'Thiếu thông tin giá trị đơn hàng');
      }

      const result = await this.voucherService.applyVoucher(code, parseFloat(orderValue));
      
      return ResponseHandler.success(res, { voucher: result.voucher, discountAmount: result.discountAmount, finalAmount: result.finalAmount }, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy voucher khả dụng (Public)
   * GET /api/vouchers/available
   */  getAvailableVouchers = async (req, res, next) => {
    try {
      const result = await this.voucherService.getAvailableVouchers();
      
      return ResponseHandler.success(res, result.vouchers, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Tạo voucher mới (Admin)
   * POST /api/vouchers
   */  createVoucher = async (req, res, next) => {
    try {
      const result = await this.voucherService.createVoucher(req.body);
      
      return ResponseHandler.created(res, result.message, result.voucher);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cập nhật voucher (Admin)
   * PUT /api/vouchers/:id
   */  updateVoucher = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.voucherService.updateVoucher(id, req.body);
      
      return ResponseHandler.success(res, result.voucher, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xóa voucher (Admin)
   * DELETE /api/vouchers/:id
   */
  deleteVoucher = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.voucherService.deleteVoucher(id);
      
      return this.sendResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new VoucherController();