const BaseService = require('./baseService');
const Voucher = require('../models/VoucherSchema');
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES, ERROR_CODES, PAGINATION, voucherMessages } = require('../config/constants');
const { QueryBuilder } = require('../middlewares/queryMiddleware');

/**
 * @class VoucherService
 * @description Cung cấp các phương thức để tương tác với dữ liệu phiếu giảm giá
 */
class VoucherService extends BaseService {
  constructor() {
    super(Voucher);
  }

  /**
   * @description Tạo mới một phiếu giảm giá
   * @param {object} voucherData - Dữ liệu của phiếu giảm giá
   * @returns {Promise<object>} Phiếu giảm giá đã được tạo
   * @throws {AppError} Nếu mã phiếu giảm giá đã tồn tại hoặc dữ liệu không hợp lệ
   */
  async createVoucher(voucherData) {
    try {
      // Check if voucher code already exists
      const existingVoucher = await this.Model.findOne({ code: voucherData.code });
      if (existingVoucher) {
        throw new AppError(voucherMessages.VOUCHER_INVALID_CODE, ERROR_CODES.BAD_REQUEST, 'Voucher code already exists.');
      }
      return await this.create(voucherData);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(MESSAGES.VOUCHER_CREATE_FAILED, ERROR_CODES.VOUCHER.CREATE_FAILED, error.message);
    }
  }
  /**
   * @description Lấy tất cả phiếu giảm giá với tùy chọn phân trang, tìm kiếm, sắp xếp
   * @param {object} queryOptions - Tùy chọn truy vấn (page, limit, search, sort, isActive)
   * @returns {Promise<object>} Danh sách phiếu giảm giá và thông tin phân trang
   */
  async getAllVouchers(queryOptions) {
    const { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT, search, sort, isActive } = queryOptions;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.code = { $regex: search, $options: 'i' }; // Tìm kiếm theo mã phiếu giảm giá
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      query.isActive = isActive === 'true' || isActive === true;
    }

    const sortOptions = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOptions[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Mặc định sắp xếp theo ngày tạo mới nhất
    }

    const vouchers = await Voucher.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit, 10));

    const totalVouchers = await Voucher.countDocuments(query);
    const totalPages = Math.ceil(totalVouchers / limit);    return {
      data: vouchers,
      totalDocuments: totalVouchers,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages,
        totalItems: totalVouchers,
        itemsPerPage: parseInt(limit, 10),
      },
    };
  }

  /**
   * @description Lấy thông tin chi tiết một phiếu giảm giá bằng ID
   * @param {string} voucherId - ID của phiếu giảm giá
   * @returns {Promise<object>} Thông tin chi tiết phiếu giảm giá
   * @throws {AppError} Nếu không tìm thấy phiếu giảm giá
   */
  async getVoucherById(voucherId) {
    const voucher = await this.getById(voucherId);
    if (!voucher) {
      throw new AppError(voucherMessages.VOUCHER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return voucher;
  }

  /**
   * @description Lấy thông tin chi tiết một phiếu giảm giá bằng mã
   * @param {string} code - Mã của phiếu giảm giá
   * @returns {Promise<object>} Thông tin chi tiết phiếu giảm giá
   * @throws {AppError} Nếu không tìm thấy phiếu giảm giá
   */
  async getVoucherByCode(code) {
    const voucher = await this.Model.findOne({ code });
    if (!voucher) {
      throw new AppError(voucherMessages.VOUCHER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    // Optionally, check if the voucher is active based on startDate and endDate
    const now = new Date();
    if (voucher.startDate > now) {
        throw new AppError(voucherMessages.VOUCHER_NOT_YET_ACTIVE, ERROR_CODES.BAD_REQUEST);
    }
    if (voucher.endDate < now) {
        throw new AppError(voucherMessages.VOUCHER_EXPIRED, ERROR_CODES.BAD_REQUEST);
    }
    return voucher;
  }

  /**
   * @description Cập nhật thông tin một phiếu giảm giá
   * @param {string} voucherId - ID của phiếu giảm giá cần cập nhật
   * @param {object} updateData - Dữ liệu cập nhật
   * @returns {Promise<object>} Phiếu giảm giá đã được cập nhật
   * @throws {AppError} Nếu không tìm thấy phiếu giảm giá hoặc dữ liệu không hợp lệ
   */
  async updateVoucher(voucherId, updateData) {
    // Prevent updating the code if it's not allowed or handle uniqueness
    if (updateData.code) {
      const existingVoucher = await this.Model.findOne({ code: updateData.code, _id: { $ne: voucherId } });
      if (existingVoucher) {
        throw new AppError(voucherMessages.VOUCHER_INVALID_CODE, ERROR_CODES.BAD_REQUEST, 'Voucher code already exists for another voucher.');
      }
    }
    const voucher = await this.updateById(voucherId, updateData);
    if (!voucher) {
      throw new AppError(voucherMessages.VOUCHER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return voucher;
  }

  /**
   * @description Xóa một phiếu giảm giá
   * @param {string} voucherId - ID của phiếu giảm giá cần xóa
   * @returns {Promise<void>}
   * @throws {AppError} Nếu không tìm thấy phiếu giảm giá
   */
  async deleteVoucher(voucherId) {
    const voucher = await this.deleteById(voucherId);
    if (!voucher) {
      throw new AppError(voucherMessages.VOUCHER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return voucher;
  }  /**
   * @description Kiểm tra và áp dụng phiếu giảm giá cho một đơn hàng
   * @param {string} code - Mã phiếu giảm giá
   * @param {number} orderTotal - Tổng giá trị đơn hàng
   * @param {string} userId - ID của user (để kiểm tra lịch sử sử dụng)
   * @returns {Promise<object>} Thông tin phiếu giảm giá hợp lệ
   * @throws {AppError} Nếu phiếu giảm giá không hợp lệ, hết hạn, không đủ điều kiện, v.v.
   */
  async applyVoucher(code, orderTotal, userId = null) {
    const voucher = await this.getVoucherByCode(code); // This already checks for existence and validity period

    // Check if voucher is active
    if (!voucher.isActive) {
      throw new AppError(voucherMessages.VOUCHER_INACTIVE || 'Voucher is not active', ERROR_CODES.VOUCHER.INVALID);
    }    // KIỂM TRA RÀNG BUỘC MỚI: 1 user chỉ được sử dụng 1 voucher duy nhất trong toàn bộ hệ thống
    if (userId) {
      const usedVoucherOrder = await this.getUserUsedVoucher(userId);
      if (usedVoucherOrder && usedVoucherOrder.voucher._id.toString() !== voucher._id.toString()) {
        throw new AppError(
          `Bạn đã sử dụng voucher "${usedVoucherOrder.voucher.code}" trước đó. Mỗi tài khoản chỉ được sử dụng 1 voucher duy nhất trong toàn bộ hệ thống.`, 
          ERROR_CODES.VOUCHER.APPLY_FAILED
        );
      }
    }

    // Check usage limit if user is provided
    if (userId && voucher.isOneTimePerUser) {
      const usageCount = await this.getUserVoucherUsageCount(userId, voucher._id);
      if (usageCount >= voucher.usageLimit) {
        throw new AppError('Bạn đã sử dụng voucher này rồi và không thể sử dụng lại', ERROR_CODES.VOUCHER.APPLY_FAILED);
      }
    }

    // Check minimum order value
    if (orderTotal < voucher.minimumOrderValue) {
      throw new AppError(voucherMessages.VOUCHER_CRITERIA_NOT_MET, ERROR_CODES.VOUCHER.APPLY_FAILED, `Minimum order value of ${voucher.minimumOrderValue.toLocaleString('vi-VN')}đ not met.`);
    }

    // Check maximum order value if set (null means no limit)
    if (voucher.maximumOrderValue !== null && voucher.maximumOrderValue !== undefined && orderTotal > voucher.maximumOrderValue) {
      throw new AppError(voucherMessages.VOUCHER_CRITERIA_NOT_MET, ERROR_CODES.VOUCHER.APPLY_FAILED, `Đơn hàng vượt quá giá trị tối đa ${voucher.maximumOrderValue.toLocaleString('vi-VN')}đ để áp dụng voucher này.`);
    }// Calculate discount amount
    let discountAmount = (orderTotal * voucher.discountPercent) / 100;
    
    // Apply maximum discount limits:
    // 1. Maximum 50% of order total
    // 2. Maximum discount amount from voucher setting (default 200,000 VNĐ)
    const maxDiscountByPercent = orderTotal * 0.5; // 50% of order total
    const maxDiscountByAmount = voucher.maximumDiscountAmount || 200000; // Default 200k if not set
    
    const effectiveMaxDiscount = Math.min(maxDiscountByPercent, maxDiscountByAmount);
    
    if (discountAmount > effectiveMaxDiscount) {
      discountAmount = effectiveMaxDiscount;
    }

    const finalTotal = orderTotal - discountAmount;

    return {
      discountPercent: voucher.discountPercent,
      discountAmount: discountAmount,
      finalTotal: finalTotal,
      voucherId: voucher._id,
      originalOrderTotal: orderTotal,
      minimumOrderValue: voucher.minimumOrderValue,
      maximumOrderValue: voucher.maximumOrderValue,
      maximumDiscountAmount: voucher.maximumDiscountAmount,
      appliedDiscountRule: discountAmount === maxDiscountByPercent ? 'Limited by 50% of order' : 
                          discountAmount === maxDiscountByAmount ? 'Limited by maximum discount amount' : 
                          'Full discount applied'
    };
  }

  /**
   * @description Toggle voucher active status
   * @param {string} voucherId - ID của voucher
   * @returns {Promise<object>} Voucher đã được cập nhật
   */
  async toggleVoucherStatus(voucherId) {
    const voucher = await this.getById(voucherId);
    if (!voucher) {
      throw new AppError(voucherMessages.VOUCHER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    return await this.updateById(voucherId, { isActive: !voucher.isActive });
  }

  /**
   * @description Get only active vouchers
   * @param {object} queryOptions - Query options
   * @returns {Promise<object>} Active vouchers
   */
  async getActiveVouchers(queryOptions = {}) {
    return await this.getAllVouchers({ ...queryOptions, isActive: true });
  }

  /**
   * @description Kiểm tra số lần user đã sử dụng một voucher
   * @param {string} userId - ID của user
   * @param {string} voucherId - ID của voucher
   * @returns {Promise<number>} Số lần đã sử dụng
   */
  async getUserVoucherUsageCount(userId, voucherId) {
    // Import Order model để kiểm tra lịch sử đơn hàng
    const Order = require('../models/OrderSchema');
    
    const usageCount = await Order.countDocuments({
      user: userId,
      voucher: voucherId,
      status: { $nin: ['cancelled'] } // Không tính các order đã hủy
    });
    
    return usageCount;
  }

  /**
   * @description Kiểm tra xem user đã sử dụng voucher nào chưa (để thực thi quy tắc 1 user chỉ được dùng 1 voucher duy nhất)
   * @param {string} userId - ID của user
   * @returns {Promise<object|null>} Thông tin voucher đã sử dụng hoặc null nếu chưa dùng
   */
  async getUserUsedVoucher(userId) {
    const Order = require('../models/OrderSchema');
    
    const usedVoucherOrder = await Order.findOne({
      user: userId,
      voucher: { $ne: null },
      status: { $nin: ['cancelled'] } // Không tính các order đã hủy
    })
    .populate('voucher', 'code discountPercent')
    .sort({ createdAt: -1 }); // Lấy order mới nhất có voucher
    
    return usedVoucherOrder;
  }

  /**
   * @description Kiểm tra xem user có thể sử dụng voucher không (không cần áp dụng)
   * @param {string} code - Mã voucher
   * @param {string} userId - ID của user
   * @returns {Promise<object>} Thông tin có thể sử dụng hay không
   */
  async canUserUseVoucher(code, userId) {
    try {
      const voucher = await this.getVoucherByCode(code);
        if (!voucher.isActive) {
        return { canUse: false, reason: 'Voucher không còn hoạt động' };
      }
      
      // KIỂM TRA RÀNG BUỘC MỚI: 1 user chỉ được sử dụng 1 voucher duy nhất trong toàn bộ hệ thống
      const usedVoucherOrder = await this.getUserUsedVoucher(userId);
      if (usedVoucherOrder && usedVoucherOrder.voucher._id.toString() !== voucher._id.toString()) {
        return { 
          canUse: false, 
          reason: `Bạn đã sử dụng voucher "${usedVoucherOrder.voucher.code}" trước đó. Mỗi tài khoản chỉ được sử dụng 1 voucher duy nhất.`,
          usedVoucher: {
            code: usedVoucherOrder.voucher.code,
            discountPercent: usedVoucherOrder.voucher.discountPercent,
            usedDate: usedVoucherOrder.createdAt
          }
        };
      }
      
      if (voucher.isOneTimePerUser) {
        const usageCount = await this.getUserVoucherUsageCount(userId, voucher._id);
        if (usageCount >= voucher.usageLimit) {
          return { canUse: false, reason: 'Bạn đã sử dụng voucher này rồi' };
        }
      }
      
      return { 
        canUse: true, 
        voucher: {
          code: voucher.code,
          discountPercent: voucher.discountPercent,
          minimumOrderValue: voucher.minimumOrderValue,
          maximumOrderValue: voucher.maximumOrderValue,
          maximumDiscountAmount: voucher.maximumDiscountAmount,
          usageCount: voucher.isOneTimePerUser ? await this.getUserVoucherUsageCount(userId, voucher._id) : null,
          usageLimit: voucher.usageLimit
        }
      };
    } catch (error) {
      return { canUse: false, reason: error.message };
    }
  }

  /**
   * Get all vouchers using new Query Middleware
   * @param {Object} queryParams - Query parameters from request
   * @returns {Object} Query results with pagination
   */
  async getAllVouchersWithQuery(queryParams) {
    try {
      // Sử dụng QueryUtils với pre-configured setup cho Voucher
      const result = await QueryUtils.getVouchers(Voucher, queryParams);
      
      return result;
    } catch (error) {
      throw new AppError(
        `Error fetching vouchers: ${error.message}`,
        ERROR_CODES.VOUCHER?.FETCH_FAILED || 'VOUCHER_FETCH_FAILED',
        500
      );
    }
  }
}

module.exports = VoucherService;
