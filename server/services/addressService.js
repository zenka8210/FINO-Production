const BaseService = require('./baseService');
const Address = require('../models/AddressSchema');
const User = require('../models/UserSchema');
const { AppError } = require('../middlewares/errorHandler');
const { addressMessages, ERROR_CODES } = require('../config/constants');

const MAX_ADDRESSES_PER_USER = 5; // Giới hạn số lượng địa chỉ mỗi người dùng

/**
 * @class AddressService
 * @description Cung cấp các phương thức để quản lý địa chỉ của người dùng
 */
class AddressService extends BaseService {
  constructor() {
    super(Address);
  }

  /**
   * @description Tạo mới một địa chỉ cho người dùng hiện tại
   * @param {string} userId - ID của người dùng
   * @param {object} addressData - Dữ liệu địa chỉ (bao gồm cả isDefault nếu người dùng muốn set)
   * @returns {Promise<object>} Địa chỉ đã được tạo
   * @throws {AppError} Nếu người dùng không tồn tại, đạt giới hạn địa chỉ, hoặc dữ liệu không hợp lệ
   */
  async createAddress(userId, addressData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Người dùng không tồn tại.', 404, ERROR_CODES.USER.NOT_FOUND);
    }

    const userAddressesCount = await Address.countDocuments({ user: userId });
    if (userAddressesCount >= MAX_ADDRESSES_PER_USER) {
      throw new AppError(addressMessages.MAX_ADDRESSES_REACHED, 400, ERROR_CODES.ADDRESS.MAX_LIMIT_REACHED);
    }

    const newAddressPayload = {
      ...addressData,
      user: userId,
    };

    // Xử lý isDefault
    if (addressData.isDefault) {
      await Address.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } });
      newAddressPayload.isDefault = true;
    } else {
      // Nếu không có địa chỉ nào khác và đây không được set là default, thì tự động set nó là default
      if (userAddressesCount === 0) {
        newAddressPayload.isDefault = true;
      } else {
        newAddressPayload.isDefault = false;
      }
    }

    const newAddress = new Address(newAddressPayload);
    await newAddress.save();
    return newAddress;
  }

  /**
   * @description Lấy tất cả địa chỉ của người dùng hiện tại
   * @param {string} userId - ID của người dùng
   * @returns {Promise<Array<object>>} Danh sách địa chỉ, sắp xếp theo mặc định và ngày tạo
   */
  async getUserAddresses(userId) {
    const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
    return addresses;
  }

  /**
   * @description Lấy thông tin chi tiết một địa chỉ
   * @param {string} addressId - ID của địa chỉ
   * @param {string} userId - ID của người dùng (để kiểm tra quyền sở hữu)
   * @returns {Promise<object>} Thông tin chi tiết địa chỉ
   * @throws {AppError} Nếu không tìm thấy địa chỉ hoặc người dùng không có quyền truy cập
   */
  async getAddressById(addressId, userId) {
    const address = await Address.findById(addressId);
    if (!address) {
      throw new AppError(addressMessages.ADDRESS_NOT_FOUND, 404, ERROR_CODES.ADDRESS.NOT_FOUND);
    }
    if (address.user.toString() !== userId) {
      throw new AppError(addressMessages.ADDRESS_BELONGS_TO_ANOTHER_USER, 403, ERROR_CODES.ADDRESS.PERMISSION_DENIED);
    }
    return address;
  }

  /**
   * @description Cập nhật thông tin một địa chỉ
   * @param {string} addressId - ID của địa chỉ cần cập nhật
   * @param {string} userId - ID của người dùng (để kiểm tra quyền sở hữu)
   * @param {object} updateData - Dữ liệu cập nhật
   * @returns {Promise<object>} Địa chỉ đã được cập nhật
   * @throws {AppError} Nếu không tìm thấy địa chỉ, người dùng không có quyền, hoặc dữ liệu không hợp lệ
   */
  async updateAddress(addressId, userId, updateData) {
    const address = await Address.findById(addressId);
    if (!address) {
      throw new AppError(addressMessages.ADDRESS_NOT_FOUND, 404, ERROR_CODES.ADDRESS.NOT_FOUND);
    }
    if (address.user.toString() !== userId) {
      throw new AppError(addressMessages.ADDRESS_BELONGS_TO_ANOTHER_USER, 403, ERROR_CODES.ADDRESS.PERMISSION_DENIED);
    }

    // Xử lý isDefault khi cập nhật
    if (updateData.isDefault === true && !address.isDefault) {
      // Nếu đang set địa chỉ này làm mặc định (và nó chưa phải mặc định)
      await Address.updateMany({ user: userId, _id: { $ne: addressId }, isDefault: true }, { $set: { isDefault: false } });
    } else if (updateData.isDefault === false && address.isDefault) {
      // Nếu đang bỏ mặc định địa chỉ này (và nó đang là mặc định)
      const otherAddressesCount = await Address.countDocuments({ user: userId, _id: { $ne: addressId } });
      if (otherAddressesCount === 0) {
        // Không thể bỏ mặc định nếu đây là địa chỉ duy nhất
        throw new AppError("Không thể bỏ trạng thái mặc định cho địa chỉ duy nhất.", 400, ERROR_CODES.ADDRESS.UPDATE_FAILED);
      }
      // Nếu còn địa chỉ khác, cho phép bỏ default. Client/FE nên có logic chọn default mới nếu cần.
      // Hoặc, service có thể tự động chọn 1 cái khác làm default. Hiện tại không tự động.
    }
    // Các trường hợp khác: isDefault không thay đổi, hoặc isDefault=true và đã là true, hoặc isDefault=false và đã là false -> không cần xử lý đặc biệt isDefault.

    const updatedAddress = await Address.findByIdAndUpdate(addressId, updateData, { new: true, runValidators: true });
    if (!updatedAddress) {
      // Should not happen if initial findById succeeded, but as a safeguard
      throw new AppError(addressMessages.ADDRESS_UPDATE_FAILED, 500, ERROR_CODES.ADDRESS.UPDATE_FAILED);
    }
    return updatedAddress;
  }

  /**
   * @description Xóa một địa chỉ
   * @param {string} addressId - ID của địa chỉ cần xóa
   * @param {string} userId - ID của người dùng (để kiểm tra quyền sở hữu)
   * @returns {Promise<void>}
   * @throws {AppError} Nếu không tìm thấy địa chỉ hoặc người dùng không có quyền
   */
  async deleteAddress(addressId, userId) {
    const address = await Address.findById(addressId);
    if (!address) {
      throw new AppError(addressMessages.ADDRESS_NOT_FOUND, 404, ERROR_CODES.ADDRESS.NOT_FOUND);
    }
    if (address.user.toString() !== userId) {
      throw new AppError(addressMessages.ADDRESS_BELONGS_TO_ANOTHER_USER, 403, ERROR_CODES.ADDRESS.PERMISSION_DENIED);
    }

    await Address.findByIdAndDelete(addressId);

    // Nếu địa chỉ bị xóa là địa chỉ mặc định, và còn địa chỉ khác, đặt địa chỉ gần nhất làm mặc định
    if (address.isDefault) {
      const remainingAddresses = await Address.find({ user: userId }).sort({ createdAt: -1 });
      if (remainingAddresses.length > 0) {
        remainingAddresses[0].isDefault = true;
        await remainingAddresses[0].save();
      }
    }
  }

  /**
   * @description Đặt một địa chỉ làm địa chỉ mặc định
   * @param {string} addressId - ID của địa chỉ
   * @param {string} userId - ID của người dùng
   * @returns {Promise<object>} Địa chỉ đã được đặt làm mặc định
   * @throws {AppError} Nếu không tìm thấy địa chỉ hoặc người dùng không có quyền
   */
  async setDefaultAddress(addressId, userId) {
    const addressToSetDefault = await Address.findById(addressId);
    if (!addressToSetDefault) {
      throw new AppError(addressMessages.ADDRESS_NOT_FOUND, 404, ERROR_CODES.ADDRESS.NOT_FOUND);
    }
    if (addressToSetDefault.user.toString() !== userId) {
      throw new AppError(addressMessages.ADDRESS_BELONGS_TO_ANOTHER_USER, 403, ERROR_CODES.ADDRESS.PERMISSION_DENIED);
    }

    if (addressToSetDefault.isDefault) {
      return addressToSetDefault; // Đã là mặc định rồi
    }

    // Bỏ cờ isDefault ở các địa chỉ khác của người dùng này
    await Address.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } });

    // Đặt địa chỉ được chọn làm mặc định
    addressToSetDefault.isDefault = true;
    await addressToSetDefault.save();

    return addressToSetDefault;
  }
}

module.exports = AddressService;
