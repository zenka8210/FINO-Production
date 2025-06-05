const BaseController = require('./baseController');
const AddressService = require('../services/addressService');

/**
 * Address Controller - Quản lý địa chỉ người dùng
 * Extends BaseController để sử dụng các phương thức chung
 */
class AddressController extends BaseController {
  constructor() {
    super();
    this.addressService = new AddressService();
  }

  /**
   * Lấy tất cả địa chỉ của người dùng hiện tại
   * GET /api/addresses
   */
  getUserAddresses = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const result = await this.addressService.getUserAddresses(userId);
      
      this.sendResponse(res, 200, result.message, result.addresses);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy địa chỉ theo ID
   * GET /api/addresses/:id
   */
  getAddressById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const result = await this.addressService.getAddressById(id, userId);
      
      this.sendResponse(res, 200, result.message, result.address);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy địa chỉ mặc định
   * GET /api/addresses/default
   */
  getDefaultAddress = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const result = await this.addressService.getDefaultAddress(userId);
      
      this.sendResponse(res, 200, result.message, result.address);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Tạo địa chỉ mới
   * POST /api/addresses
   */
  createAddress = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const result = await this.addressService.createAddress(userId, req.body);
      
      this.sendResponse(res, 201, result.message, result.address);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cập nhật địa chỉ
   * PUT /api/addresses/:id
   */
  updateAddress = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const result = await this.addressService.updateAddress(id, userId, req.body);
      
      this.sendResponse(res, 200, result.message, result.address);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Đặt địa chỉ mặc định
   * PUT /api/addresses/:id/default
   */
  setDefaultAddress = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const result = await this.addressService.setDefaultAddress(id, userId);
      
      this.sendResponse(res, 200, result.message, result.address);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xóa địa chỉ
   * DELETE /api/addresses/:id
   */
  deleteAddress = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const result = await this.addressService.deleteAddress(id, userId);
      
      this.sendResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new AddressController();