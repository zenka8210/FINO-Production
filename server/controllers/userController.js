const BaseController = require('./baseController');
const UserService = require('../services/userService');
const ResponseHandler = require('../services/responseHandler');
const { userMessages, PAGINATION } = require('../config/constants');

class UserController extends BaseController {
  constructor() {
    super(new UserService());
  }

  // --- Admin User Management ---
  createUser = async (req, res, next) => {
    try {
      const newUser = await this.service.createUser(req.body);
      ResponseHandler.created(res, userMessages.CREATE_SUCCESS, newUser);
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req, res, next) => {
    try {
      const queryOptions = {
        page: req.query.page || PAGINATION.DEFAULT_PAGE,
        limit: req.query.limit || PAGINATION.DEFAULT_LIMIT,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
        search: req.query.search,
        role: req.query.role,
        isActive: req.query.isActive,
      };
      const result = await this.service.getAllUsers(queryOptions);
      
      return res.status(200).json({
        success: true,
        message: userMessages.FETCH_ALL_SUCCESS,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req, res, next) => {
    try {
      const user = await this.service.getUserById(req.params.id);
      ResponseHandler.success(res, userMessages.FETCH_ONE_SUCCESS, user);
    } catch (error) {
      next(error);
    }
  };

  updateUserByAdmin = async (req, res, next) => {
    try {
      const updatedUser = await this.service.updateUserByAdmin(req.params.id, req.body);
      ResponseHandler.success(res, userMessages.UPDATE_SUCCESS, updatedUser);
    } catch (error) {
      next(error);
    }
  };

  deleteUserByAdmin = async (req, res, next) => {
    try {
      await this.service.deleteUserByAdmin(req.params.id, req.user.id);
      ResponseHandler.success(res, userMessages.DELETE_SUCCESS);
    } catch (error) {
      next(error);
    }
  };

  updateUserRoleByAdmin = async (req, res, next) => {
    try {
      const { role } = req.body;
      const updatedUser = await this.service.updateUserRoleByAdmin(req.params.id, role);
      ResponseHandler.success(res, userMessages.ROLE_UPDATE_SUCCESS, updatedUser);
    } catch (error) {
      next(error);
    }
  };

  toggleUserActiveStatusByAdmin = async (req, res, next) => {
    try {
      const updatedUser = await this.service.toggleUserActiveStatusByAdmin(req.params.id);
      ResponseHandler.success(res, userMessages.STATUS_UPDATE_SUCCESS, updatedUser);
    } catch (error) {
      next(error);
    }
  };
  // --- Current User Profile Management ---
  getCurrentUserProfile = async (req, res, next) => {
    try {
      const userProfile = await this.service.getCurrentUserProfile(req.user.id);
      ResponseHandler.success(res, userMessages.FETCH_PROFILE_SUCCESS, userProfile);
    } catch (error) {
      next(error);
    }
  };

  updateCurrentUserProfile = async (req, res, next) => {
    try {
      const updatedProfile = await this.service.updateCurrentUserProfile(req.user.id, req.body);
      ResponseHandler.success(res, userMessages.PROFILE_UPDATE_SUCCESS, updatedProfile);
    } catch (error) {
      next(error);
    }
  };

  changeCurrentUserPassword = async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      await this.service.changeCurrentUserPassword(req.user.id, currentPassword, newPassword);
      ResponseHandler.success(res, userMessages.PASSWORD_CHANGE_SUCCESS);
    } catch (error) {
      next(error);
    }
  };

  // --- Current User Address Management ---
  addUserAddress = async (req, res, next) => {
    try {
      const newAddress = await this.service.addUserAddress(req.user.id, req.body);
      ResponseHandler.created(res, userMessages.ADDRESS_ADD_SUCCESS, newAddress);
    } catch (error) {
      next(error);
    }
  };

  getUserAddresses = async (req, res, next) => {
    try {
      const addresses = await this.service.getUserAddresses(req.user.id);
      ResponseHandler.success(res, userMessages.FETCH_ALL_SUCCESS, addresses);
    } catch (error) {
      next(error);
    }
  };

  getUserAddressById = async (req, res, next) => {
    try {
      const address = await this.service.getUserAddressById(req.user.id, req.params.addressId);
      ResponseHandler.success(res, userMessages.FETCH_ONE_SUCCESS, address);
    } catch (error) {
      next(error);
    }
  };
  
  updateUserAddress = async (req, res, next) => {
    try {
      const updatedAddress = await this.service.updateUserAddress(req.user.id, req.params.addressId, req.body);
      ResponseHandler.success(res, userMessages.ADDRESS_UPDATE_SUCCESS, updatedAddress);
    } catch (error) {
      next(error);
    }
  };

  deleteUserAddress = async (req, res, next) => {
    try {
      await this.service.deleteUserAddress(req.user.id, req.params.addressId);
      ResponseHandler.success(res, userMessages.ADDRESS_DELETE_SUCCESS);
    } catch (error) {
      next(error);
    }
  };

  setDefaultUserAddress = async (req, res, next) => {
    try {
      const defaultAddress = await this.service.setDefaultUserAddress(req.user.id, req.params.addressId);
      ResponseHandler.success(res, userMessages.ADDRESS_SET_DEFAULT_SUCCESS, defaultAddress);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = UserController;
