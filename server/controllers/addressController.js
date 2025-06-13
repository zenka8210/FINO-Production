const BaseController = require('./baseController');
const AddressService = require('../services/addressService');
const ResponseHandler = require('../services/responseHandler');
const { addressMessages } = require('../config/constants');

/**
 * @class AddressController
 * @description Xử lý các yêu cầu liên quan đến địa chỉ người dùng
 */
class AddressController extends BaseController {
  constructor() {
    super(new AddressService());
  }

  /**
   * @description Tạo mới một địa chỉ cho người dùng hiện tại
   * @param {import('express').Request} req - Đối tượng request (req.user được thêm bởi middleware protect)
   * @param {import('express').Response} res - Đối tượng response
   */
  createAddress = async (req, res, next) => {
    try {
      const address = await this.service.createAddress(req.user.id, req.body);
      ResponseHandler.success(res, addressMessages.ADDRESS_CREATED_SUCCESSFULLY, address, 201);
    } catch (error) {
      next(error);
    }
  };
  /**
   * @description Lấy tất cả địa chỉ của người dùng hiện tại
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */
  getUserAddresses = async (req, res, next) => {
    try {
      const addresses = await this.service.getUserAddresses(req.user.id);
      ResponseHandler.success(res, addressMessages.ALL_ADDRESSES_FETCHED_SUCCESSFULLY, addresses);
    } catch (error) {
      next(error);
    }
  };
  /**
   * @description Lấy thông tin chi tiết một địa chỉ của người dùng hiện tại
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */
  getAddressById = async (req, res, next) => {
    try {
      const address = await this.service.getAddressById(req.params.id, req.user.id);
      ResponseHandler.success(res, addressMessages.ADDRESS_FETCHED_SUCCESSFULLY, address);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Cập nhật thông tin một địa chỉ của người dùng hiện tại
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */
  updateAddress = async (req, res, next) => {
    try {
      const address = await this.service.updateAddress(req.params.id, req.user.id, req.body);
      ResponseHandler.success(res, addressMessages.ADDRESS_UPDATED_SUCCESSFULLY, address);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Xóa một địa chỉ của người dùng hiện tại
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */
  deleteAddress = async (req, res, next) => {
    try {
      await this.service.deleteAddress(req.params.id, req.user.id);
      ResponseHandler.success(res, addressMessages.ADDRESS_DELETED_SUCCESSFULLY);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Đặt một địa chỉ làm địa chỉ mặc định cho người dùng hiện tại
   * @param {import('express').Request} req - Đối tượng request
   * @param {import('express').Response} res - Đối tượng response
   */
  setDefaultAddress = async (req, res, next) => {
    try {
      const address = await this.service.setDefaultAddress(req.params.id, req.user.id);
      ResponseHandler.success(res, addressMessages.ADDRESS_SET_AS_DEFAULT_SUCCESSFULLY, address);
    } catch (error) {
      next(error);
    }
  };
  // Admin specific methods can be added here if needed, for example, to list all addresses
  // For now, address management is user-specific.
}

module.exports = AddressController;
