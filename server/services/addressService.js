const Address = require('../models/addressSchema');
const { MESSAGES, ERROR_CODES } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const LoggerService = require('./loggerService');

class AddressService {
  constructor() {
    this.logger = LoggerService;
  }

  /**
   * Lấy tất cả địa chỉ của người dùng
   * @param {string} userId - ID người dùng
   * @returns {Promise<Object>} - Danh sách địa chỉ
   */
  async getUserAddresses(userId) {
    try {
      const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        addresses
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy danh sách địa chỉ:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy địa chỉ theo ID
   * @param {string} addressId - ID địa chỉ
   * @param {string} userId - ID người dùng
   * @returns {Promise<Object>} - Thông tin địa chỉ
   */
  async getAddressById(addressId, userId) {
    try {
      const address = await Address.findOne({ _id: addressId, user: userId });

      if (!address) {
        throw new AppError('Không tìm thấy địa chỉ', 404, ERROR_CODES.NOT_FOUND);
      }

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        address
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi lấy thông tin địa chỉ:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Tạo địa chỉ mới
   * @param {string} userId - ID người dùng
   * @param {Object} addressData - Dữ liệu địa chỉ
   * @returns {Promise<Object>} - Địa chỉ được tạo
   */
  async createAddress(userId, addressData) {
    try {
      // Nếu đây là địa chỉ mặc định, cập nhật các địa chỉ khác
      if (addressData.isDefault) {
        await Address.updateMany(
          { user: userId },
          { isDefault: false }
        );
      } else {
        // Nếu đây là địa chỉ đầu tiên của user, tự động đặt làm mặc định
        const existingAddressCount = await Address.countDocuments({ user: userId });
        if (existingAddressCount === 0) {
          addressData.isDefault = true;
        }
      }

      const address = new Address({
        ...addressData,
        user: userId
      });

      const savedAddress = await address.save();

      this.logger.info(`Tạo địa chỉ thành công`, { userId, addressId: savedAddress._id });

      return {
        message: 'Tạo địa chỉ thành công',
        address: savedAddress
      };
    } catch (error) {
      this.logger.error('Lỗi khi tạo địa chỉ:', error);
      throw new AppError('Tạo địa chỉ thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Cập nhật địa chỉ
   * @param {string} addressId - ID địa chỉ
   * @param {string} userId - ID người dùng
   * @param {Object} updateData - Dữ liệu cập nhật
   * @returns {Promise<Object>} - Địa chỉ được cập nhật
   */
  async updateAddress(addressId, userId, updateData) {
    try {
      const address = await Address.findOne({ _id: addressId, user: userId });

      if (!address) {
        throw new AppError('Không tìm thấy địa chỉ', 404, ERROR_CODES.NOT_FOUND);
      }

      // Nếu đặt làm địa chỉ mặc định, cập nhật các địa chỉ khác
      if (updateData.isDefault) {
        await Address.updateMany(
          { user: userId, _id: { $ne: addressId } },
          { isDefault: false }
        );
      }

      Object.assign(address, updateData);
      const savedAddress = await address.save();

      this.logger.info(`Cập nhật địa chỉ thành công`, { userId, addressId });

      return {
        message: 'Cập nhật địa chỉ thành công',
        address: savedAddress
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi cập nhật địa chỉ:', error);
      throw new AppError('Cập nhật địa chỉ thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Xóa địa chỉ
   * @param {string} addressId - ID địa chỉ
   * @param {string} userId - ID người dùng
   * @returns {Promise<Object>} - Thông báo thành công
   */
  async deleteAddress(addressId, userId) {
    try {
      const address = await Address.findOne({ _id: addressId, user: userId });

      if (!address) {
        throw new AppError('Không tìm thấy địa chỉ', 404, ERROR_CODES.NOT_FOUND);
      }

      // Nếu xóa địa chỉ mặc định, tự động đặt địa chỉ khác làm mặc định
      if (address.isDefault) {
        const otherAddress = await Address.findOne({ 
          user: userId, 
          _id: { $ne: addressId } 
        });
        
        if (otherAddress) {
          otherAddress.isDefault = true;
          await otherAddress.save();
        }
      }

      await Address.findByIdAndDelete(addressId);

      this.logger.info(`Xóa địa chỉ thành công`, { userId, addressId });

      return {
        message: 'Xóa địa chỉ thành công'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi xóa địa chỉ:', error);
      throw new AppError('Xóa địa chỉ thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Đặt địa chỉ mặc định
   * @param {string} addressId - ID địa chỉ
   * @param {string} userId - ID người dùng
   * @returns {Promise<Object>} - Thông báo thành công
   */
  async setDefaultAddress(addressId, userId) {
    try {
      const address = await Address.findOne({ _id: addressId, user: userId });

      if (!address) {
        throw new AppError('Không tìm thấy địa chỉ', 404, ERROR_CODES.NOT_FOUND);
      }

      // Cập nhật tất cả địa chỉ khác thành không mặc định
      await Address.updateMany(
        { user: userId },
        { isDefault: false }
      );

      // Đặt địa chỉ hiện tại làm mặc định
      address.isDefault = true;
      await address.save();

      this.logger.info(`Đặt địa chỉ mặc định thành công`, { userId, addressId });

      return {
        message: 'Đặt địa chỉ mặc định thành công',
        address
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi đặt địa chỉ mặc định:', error);
      throw new AppError('Đặt địa chỉ mặc định thất bại', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy địa chỉ mặc định của người dùng
   * @param {string} userId - ID người dùng
   * @returns {Promise<Object>} - Địa chỉ mặc định
   */
  async getDefaultAddress(userId) {
    try {
      const address = await Address.findOne({ user: userId, isDefault: true });

      if (!address) {
        // Nếu không có địa chỉ mặc định, lấy địa chỉ đầu tiên
        const firstAddress = await Address.findOne({ user: userId }).sort({ createdAt: 1 });
        
        if (firstAddress) {
          firstAddress.isDefault = true;
          await firstAddress.save();
          
          return {
            message: MESSAGES.SUCCESS.DATA_RETRIEVED,
            address: firstAddress
          };
        }
        
        throw new AppError('Người dùng chưa có địa chỉ nào', 404, ERROR_CODES.NOT_FOUND);
      }

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        address
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error('Lỗi khi lấy địa chỉ mặc định:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }
}

module.exports = AddressService;
