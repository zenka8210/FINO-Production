const BaseController = require('./baseController');
const VoucherService = require('../services/voucherService');
const Voucher = require('../models/VoucherSchema');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES, PAGINATION, voucherMessages, ERROR_CODES } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const { QueryBuilder } = require('../middlewares/queryMiddleware');
const AdminSortUtils = require('../utils/adminSortUtils');

/**
 * @class VoucherController
 * @description Xử lý các yêu cầu liên quan đến phiếu giảm giá
 */
class VoucherController extends BaseController {
  constructor() {
    super(new VoucherService());
  }
  /**
   * @description Tạo mới một phiếu giảm giá (Admin)
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */  createVoucher = async (req, res, next) => {
    try {
      const { code, discountPercent, minimumOrderValue, maximumOrderValue, maximumDiscountAmount, startDate, endDate } = req.body;
      if (!code || discountPercent === undefined || !startDate || !endDate) {
        throw new AppError(MESSAGES.VALIDATION_ERROR, ERROR_CODES.BAD_REQUEST, 'Code, discountPercent, startDate, and endDate are required.');
      }
      if (discountPercent < 0 || discountPercent > 100) {
        throw new AppError(MESSAGES.VALIDATION_ERROR, ERROR_CODES.BAD_REQUEST, 'Discount percent must be between 0 and 100.');
      }
      if (new Date(startDate) >= new Date(endDate)) {
        throw new AppError(MESSAGES.VALIDATION_ERROR, ERROR_CODES.BAD_REQUEST, 'Start date must be before end date.');
      }
      if (maximumOrderValue && minimumOrderValue && maximumOrderValue <= minimumOrderValue) {
        throw new AppError(MESSAGES.VALIDATION_ERROR, ERROR_CODES.BAD_REQUEST, 'Maximum order value must be greater than minimum order value.');
      }
      if (maximumDiscountAmount !== undefined && maximumDiscountAmount < 0) {
        throw new AppError(MESSAGES.VALIDATION_ERROR, ERROR_CODES.BAD_REQUEST, 'Maximum discount amount must be a positive number.');
      }

      const voucher = await this.service.createVoucher(req.body);
      ResponseHandler.created(res, MESSAGES.VOUCHER_CREATED, voucher);
    } catch (error) {
      next(error);
    }
  };
  /**
   * @description Lấy tất cả phiếu giảm giá (Admin & Public)
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */
  getAllVouchers = async (req, res, next) => {
    try {
      console.log('🎯 VoucherController.getAllVouchers called');
      console.log('📊 Query params:', req.query);
      console.log('📊 Params:', req.params);
      
      // Use new QueryBuilder with improved safety
      if (req.createQueryBuilder) {
        const queryBuilder = req.createQueryBuilder(Voucher);
        
        // Configure search and filters for vouchers
        const result = await queryBuilder
          .search(['code'])
          .applyFilters({
            isActive: { type: 'boolean' },
            type: { type: 'exact' },
            minValue: { type: 'range', field: 'discountValue' },
            maxValue: { type: 'range', field: 'discountValue' },
            validFrom: { type: 'date', field: 'startDate' },
            validTo: { type: 'date', field: 'endDate' }
          })
          .execute();
        
        ResponseHandler.success(res, MESSAGES.FETCH_SUCCESS, result);
      } else {
        // Fallback to legacy method if middleware not available
        const queryOptions = {
          page: req.query.page || PAGINATION.DEFAULT_PAGE,
          limit: req.query.limit || PAGINATION.DEFAULT_LIMIT,
          code: req.query.code,
          isActive: req.query.isActive,
          sortBy: req.query.sortBy || 'createdAt',
          sortOrder: req.query.sortOrder || 'desc'
        };
        
        // Apply admin sort
        const sortConfig = AdminSortUtils.ensureAdminSort(req, 'Voucher');
        queryOptions.sort = sortConfig;
        
        const result = await this.service.getAllVouchers(queryOptions);
        ResponseHandler.success(res, MESSAGES.FETCH_SUCCESS, result);
      }
    } catch (error) {
      console.error('❌ VoucherController.getAllVouchers error:', error.message);
      next(error);
    }
  };

  // Giữ lại method cũ để backward compatibility
  getAllVouchersLegacy = async (req, res, next) => {
    try {
      const { page, limit, search, sort, isActive } = req.query;
      const options = {
        page: parseInt(page) || PAGINATION.DEFAULT_PAGE,
        limit: parseInt(limit) || PAGINATION.DEFAULT_LIMIT,
        search,
        sort,
        isActive
      };

      const result = await this.service.getAllVouchers(options);
      ResponseHandler.success(res, MESSAGES.FETCH_SUCCESS, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Lấy thông tin chi tiết một phiếu giảm giá (Admin & Public)
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */
  getVoucherById = async (req, res, next) => {
    try {
      const voucher = await this.service.getVoucherById(req.params.id);
      ResponseHandler.success(res, MESSAGES.FETCH_SUCCESS, voucher);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Lấy thông tin một phiếu giảm giá theo mã (để áp dụng)
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */
  getVoucherByCode = async (req, res, next) => {
    try {
      const voucher = await this.service.getVoucherByCode(req.params.code);
      ResponseHandler.success(res, MESSAGES.FETCH_SUCCESS, voucher);
    } catch (error) {
      next(error);
    }
  };
  /**
   * @description Cập nhật thông tin một phiếu giảm giá (Admin)
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */  updateVoucher = async (req, res, next) => {
    try {
      const { discountPercent, minimumOrderValue, maximumOrderValue, maximumDiscountAmount, startDate, endDate } = req.body;
      if (discountPercent !== undefined && (discountPercent < 0 || discountPercent > 100)) {
        throw new AppError(MESSAGES.VALIDATION_ERROR, ERROR_CODES.BAD_REQUEST, 'Discount percent must be between 0 and 100.');
      }
      if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        throw new AppError(MESSAGES.VALIDATION_ERROR, ERROR_CODES.BAD_REQUEST, 'Start date must be before end date.');
      }
      if (maximumOrderValue && minimumOrderValue && maximumOrderValue <= minimumOrderValue) {
        throw new AppError(MESSAGES.VALIDATION_ERROR, ERROR_CODES.BAD_REQUEST, 'Maximum order value must be greater than minimum order value.');
      }
      if (maximumDiscountAmount !== undefined && maximumDiscountAmount < 0) {
        throw new AppError(MESSAGES.VALIDATION_ERROR, ERROR_CODES.BAD_REQUEST, 'Maximum discount amount must be a positive number.');
      }

      const voucher = await this.service.updateVoucher(req.params.id, req.body);
      ResponseHandler.success(res, MESSAGES.VOUCHER_UPDATED, voucher);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Xóa một phiếu giảm giá (Admin)
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */
  deleteVoucher = async (req, res, next) => {
    try {
      await this.service.deleteVoucher(req.params.id);
      ResponseHandler.success(res, MESSAGES.VOUCHER_DELETED);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Toggle trạng thái hoạt động của voucher (Admin)
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */
  toggleVoucherStatus = async (req, res, next) => {
    try {
      const voucher = await this.service.toggleVoucherStatus(req.params.id);
      ResponseHandler.success(res, `Voucher ${voucher.isActive ? 'activated' : 'deactivated'} successfully`, voucher);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Lấy danh sách voucher đang hoạt động (Public)
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */
  getActiveVouchers = async (req, res, next) => {
    try {
      const { page, limit, search, sort } = req.query;
      const options = {
        page: parseInt(page) || PAGINATION.DEFAULT_PAGE,
        limit: parseInt(limit) || PAGINATION.DEFAULT_LIMIT,
        search,
        sort
      };

      const result = await this.service.getActiveVouchers(options);
      ResponseHandler.success(res, 'Active vouchers retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Áp dụng phiếu giảm giá cho đơn hàng (Public/User)
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */
  applyVoucher = async (req, res, next) => {
    try {
      const { code, orderTotal } = req.body;
      if (!code || orderTotal === undefined) {
        throw new AppError(MESSAGES.VALIDATION_ERROR, ERROR_CODES.BAD_REQUEST, 'Voucher code and orderTotal are required.');
      }
      if (typeof orderTotal !== 'number' || orderTotal < 0) {
        throw new AppError(MESSAGES.VALIDATION_ERROR, ERROR_CODES.BAD_REQUEST, 'Invalid orderTotal.');
      }

      const result = await this.service.applyVoucher(code, orderTotal);
      ResponseHandler.success(res, voucherMessages.VOUCHER_APPLIED, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Kiểm tra xem user có thể sử dụng voucher không
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */
  checkVoucherUsage = async (req, res, next) => {
    try {
      const { code } = req.params;
      const userId = req.user._id;
      
      const result = await this.service.canUserUseVoucher(code, userId);
      ResponseHandler.success(res, 'Kiểm tra voucher thành công', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Lấy thông tin voucher mà user đã sử dụng
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */
  getUserUsedVoucher = async (req, res, next) => {
    try {
      const userId = req.user._id;
      
      // Validate userId
      if (!userId) {
        return ResponseHandler.error(res, 'User ID không hợp lệ', 400);
      }
      
      const usedVoucherOrder = await this.service.getUserUsedVoucher(userId);
      
      if (!usedVoucherOrder) {
        return ResponseHandler.success(res, 'User chưa sử dụng voucher nào', {
          hasUsedVoucher: false,
          voucherHistory: null
        });
      }
      
      ResponseHandler.success(res, 'Thông tin voucher đã sử dụng', {
        hasUsedVoucher: true,
        voucherHistory: {
          orderId: usedVoucherOrder._id,
          voucherCode: usedVoucherOrder.voucher.code,
          discountPercent: usedVoucherOrder.voucher.discountPercent,
          discountAmount: usedVoucherOrder.discountAmount,
          orderDate: usedVoucherOrder.createdAt,
          orderStatus: usedVoucherOrder.status,
          note: 'Bạn đã sử dụng voucher này. Mỗi tài khoản chỉ được sử dụng 1 voucher duy nhất trong toàn bộ hệ thống.'
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Lấy thống kê voucher (Admin)
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */
  getVoucherStatistics = async (req, res, next) => {
    try {
      const statistics = await this.service.getVoucherStatistics();
      ResponseHandler.success(res, 'Thống kê voucher', statistics);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = VoucherController;
