const Voucher = require('../models/voucherSchema');
const { MESSAGES, ERROR_CODES } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const LoggerService = require('./loggerService');

class VoucherService {
  constructor() {
    this.logger = LoggerService;
  }

  /**
   * Lấy tất cả voucher với phân trang
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} - Danh sách voucher
   */
  async getAllVouchers(query = {}) {
    try {
      const { page = 1, limit = 10, status, type } = query;
      const skip = (page - 1) * limit;

      // Tạo filter
      const filter = {};
      if (status) filter.status = status;
      if (type) filter.type = type;

      const vouchers = await Voucher.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Voucher.countDocuments(filter);

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        vouchers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy danh sách voucher:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy voucher theo ID
   * @param {string} voucherId - ID voucher
   * @returns {Promise<Object>} - Thông tin voucher
   */
  async getVoucherById(voucherId) {
    try {
      const voucher = await Voucher.findById(voucherId);

      if (!voucher) {
        throw new AppError('Không tìm thấy voucher', 404, ERROR_CODES.NOT_FOUND);
      }

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        voucher
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi lấy thông tin voucher:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy voucher theo mã code
   * @param {string} code - Mã voucher
   * @returns {Promise<Object>} - Thông tin voucher
   */
  async getVoucherByCode(code) {
    try {
      const voucher = await Voucher.findOne({ code, status: 'active' });

      if (!voucher) {
        throw new AppError('Mã voucher không tồn tại hoặc đã hết hạn', 404, ERROR_CODES.NOT_FOUND);
      }

      // Kiểm tra thời hạn
      const now = new Date();
      if (now < voucher.startDate || now > voucher.endDate) {
        throw new AppError('Voucher đã hết hạn sử dụng', 400, ERROR_CODES.INVALID_INPUT);
      }

      // Kiểm tra số lượng
      if (voucher.used >= voucher.quantity) {
        throw new AppError('Voucher đã hết lượt sử dụng', 400, ERROR_CODES.INVALID_INPUT);
      }

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        voucher
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi lấy voucher theo code:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Tạo voucher mới
   * @param {Object} voucherData - Dữ liệu voucher
   * @returns {Promise<Object>} - Voucher được tạo
   */
  async createVoucher(voucherData) {
    try {
      // Kiểm tra mã voucher đã tồn tại
      const existingVoucher = await Voucher.findOne({ code: voucherData.code });
      if (existingVoucher) {
        throw new AppError('Mã voucher đã tồn tại', 400, ERROR_CODES.INVALID_INPUT);
      }

      const voucher = new Voucher(voucherData);
      const savedVoucher = await voucher.save();

      this.logger.info(`Tạo voucher thành công`, { voucherId: savedVoucher._id });

      return {
        message: 'Tạo voucher thành công',
        voucher: savedVoucher
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi tạo voucher:', error);
      throw new AppError('Tạo voucher thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Cập nhật voucher
   * @param {string} voucherId - ID voucher
   * @param {Object} updateData - Dữ liệu cập nhật
   * @returns {Promise<Object>} - Voucher được cập nhật
   */
  async updateVoucher(voucherId, updateData) {
    try {
      const voucher = await Voucher.findById(voucherId);

      if (!voucher) {
        throw new AppError('Không tìm thấy voucher', 404, ERROR_CODES.NOT_FOUND);
      }

      // Kiểm tra mã voucher nếu được cập nhật
      if (updateData.code && updateData.code !== voucher.code) {
        const existingVoucher = await Voucher.findOne({ 
          code: updateData.code, 
          _id: { $ne: voucherId } 
        });
        if (existingVoucher) {
          throw new AppError('Mã voucher đã tồn tại', 400, ERROR_CODES.INVALID_INPUT);
        }
      }

      Object.assign(voucher, updateData);
      const savedVoucher = await voucher.save();

      this.logger.info(`Cập nhật voucher thành công`, { voucherId });

      return {
        message: 'Cập nhật voucher thành công',
        voucher: savedVoucher
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi cập nhật voucher:', error);
      throw new AppError('Cập nhật voucher thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Xóa voucher
   * @param {string} voucherId - ID voucher
   * @returns {Promise<Object>} - Thông báo thành công
   */
  async deleteVoucher(voucherId) {
    try {
      const voucher = await Voucher.findById(voucherId);

      if (!voucher) {
        throw new AppError('Không tìm thấy voucher', 404, ERROR_CODES.NOT_FOUND);
      }

      await Voucher.findByIdAndDelete(voucherId);

      this.logger.info(`Xóa voucher thành công`, { voucherId });

      return {
        message: 'Xóa voucher thành công'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi xóa voucher:', error);
      throw new AppError('Xóa voucher thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Áp dụng voucher cho đơn hàng
   * @param {string} code - Mã voucher
   * @param {number} orderValue - Giá trị đơn hàng
   * @returns {Promise<Object>} - Thông tin giảm giá
   */
  async applyVoucher(code, orderValue) {
    try {
      const result = await this.getVoucherByCode(code);
      const voucher = result.voucher;

      // Kiểm tra giá trị đơn hàng tối thiểu
      if (voucher.minOrderValue && orderValue < voucher.minOrderValue) {
        throw new AppError(
          `Đơn hàng phải có giá trị tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')} VNĐ để sử dụng voucher này`,
          400,
          ERROR_CODES.INVALID_INPUT
        );
      }

      let discountAmount = 0;

      if (voucher.type === 'percentage') {
        discountAmount = (orderValue * voucher.value) / 100;
        // Giới hạn giảm giá tối đa
        if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
          discountAmount = voucher.maxDiscount;
        }
      } else if (voucher.type === 'fixed') {
        discountAmount = voucher.value;
        // Không được giảm quá giá trị đơn hàng
        if (discountAmount > orderValue) {
          discountAmount = orderValue;
        }
      }

      return {
        message: 'Áp dụng voucher thành công',
        voucher: {
          _id: voucher._id,
          code: voucher.code,
          type: voucher.type,
          value: voucher.value,
          description: voucher.description
        },
        discountAmount,
        finalAmount: orderValue - discountAmount
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi áp dụng voucher:', error);
      throw new AppError('Áp dụng voucher thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Sử dụng voucher (tăng số lượng đã sử dụng)
   * @param {string} voucherId - ID voucher
   * @returns {Promise<Object>} - Thông báo thành công
   */
  async useVoucher(voucherId) {
    try {
      const voucher = await Voucher.findById(voucherId);

      if (!voucher) {
        throw new AppError('Không tìm thấy voucher', 404, ERROR_CODES.NOT_FOUND);
      }

      if (voucher.used >= voucher.quantity) {
        throw new AppError('Voucher đã hết lượt sử dụng', 400, ERROR_CODES.INVALID_INPUT);
      }

      voucher.used += 1;
      await voucher.save();

      this.logger.info(`Sử dụng voucher thành công`, { voucherId, used: voucher.used });

      return {
        message: 'Sử dụng voucher thành công',
        voucher
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi sử dụng voucher:', error);
      throw new AppError('Sử dụng voucher thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy voucher khả dụng cho người dùng
   * @returns {Promise<Object>} - Danh sách voucher khả dụng
   */
  async getAvailableVouchers() {
    try {
      const now = new Date();

      const vouchers = await Voucher.find({
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now },
        $expr: { $lt: ['$used', '$quantity'] }
      })
      .sort({ value: -1 })
      .select('code type value maxDiscount minOrderValue description endDate');

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        vouchers
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy voucher khả dụng:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }
}

module.exports = VoucherService;
