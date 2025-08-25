const BaseService = require('./baseService');
const User = require('../models/UserSchema');
const Address = require('../models/AddressSchema');
const bcrypt = require('bcryptjs');
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES, ERROR_CODES, ROLES, PAGINATION, userMessages, authMessages } = require('../config/constants');
const { QueryUtils } = require('../utils/queryUtils');

const MAX_ADDRESSES_PER_USER = 5; // Giới hạn số lượng địa chỉ mỗi người dùng

class UserService extends BaseService {
  constructor() {
    super(User);
  }
  /**
   * Create a new user (typically by an admin or during initial seeding).
   * For self-registration, use authService.register.
   * @param {Object} userData - Data for the new user.
   * @returns {Promise<User>} The created user.
   */
  async createUser(userData) {
    const { email, password, name, phone, role } = userData;

    let existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(userMessages.EMAIL_IN_USE, ERROR_CODES.BAD_REQUEST, ERROR_CODES.USER.EMAIL_EXISTS);
    }

    // Password will be hashed by the pre-save hook in UserSchema
    const newUser = new User({
      email,
      password, // Send plain password, schema will hash it
      name,
      phone,
      role: role || ROLES.USER,
      isActive: userData.isActive === undefined ? true : userData.isActive,
    });

    await newUser.save();
    newUser.password = undefined;
    return newUser;
  }

  /**
   * Get all users with pagination, filtering, and sorting (Admin).
   * @param {Object} queryOptions - Options for pagination, filtering, and sorting.
   * @returns {Promise<Object>} Paginated list of users.
   */
  async getAllUsers(queryOptions = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      role,
      isActive,
    } = queryOptions;

    const filterConditions = [];
    if (search) {
      filterConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      });
    }
    if (role) filterConditions.push({ role });
    if (isActive !== undefined) filterConditions.push({ isActive });

    const query = filterConditions.length > 0 ? { $and: filterConditions } : {};
    
    const totalUsers = await User.countDocuments(query);
    
    const skip = (parseInt(page) - 1) * parseInt(limit); // Calculate skip directly

    const users = await User.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip) // Use calculated skip
      .limit(parseInt(limit))
      .select('-password');

    return {
      data: users,
      total: totalUsers, // Match ProductService structure
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalUsers / parseInt(limit)), // Calculate totalPages directly
    };
  }

  /**
   * Get all users using new Query Middleware
   * @param {Object} queryParams - Query parameters from request
   * @returns {Object} Query results with pagination
   */
  async getAllUsersWithQuery(queryParams) {
    try {
      // Sử dụng QueryUtils với pre-configured setup cho User
      const result = await QueryUtils.getUsers(User, queryParams);
      
      // Security: Remove sensitive fields từ kết quả
      if (result.data) {
        result.data = result.data.map(user => {
          const userObj = user.toObject ? user.toObject() : user;
          delete userObj.password;
          delete userObj.refreshToken;
          return userObj;
        });
      }

      return result;
    } catch (error) {
      throw new AppError(
        `Error fetching users: ${error.message}`,
        ERROR_CODES.USER.FETCH_FAILED,
        500
      );
    }
  }

  /**
   * Get a user by ID (Admin or self).
   * @param {string} userId - The ID of the user.
   * @returns {Promise<User>} The user.
   */
  async getUserById(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new AppError(userMessages.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND, ERROR_CODES.USER.NOT_FOUND);
    }
    return user;
  }

  /**
   * Update a user by Admin.
   * @param {string} userId - The ID of the user to update.
   * @param {Object} updateData - Data to update (name, phone, isActive).
   * @returns {Promise<User>} The updated user.
   */
  async updateUserByAdmin(userId, updateData) {
    const { name, phone, isActive } = updateData;
    const allowedUpdates = {};
    if (name !== undefined) allowedUpdates.name = name;
    if (phone !== undefined) allowedUpdates.phone = phone;
    if (isActive !== undefined) allowedUpdates.isActive = isActive;

    const user = await User.findByIdAndUpdate(userId, allowedUpdates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      throw new AppError(userMessages.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND, ERROR_CODES.USER.NOT_FOUND);
    }
    return user;
  }

  /**
   * Delete a user by Admin.
   * @param {string} userId - The ID of the user to delete.
   * @param {string} adminId - The ID of the admin performing the action.
   * @returns {Promise<void>}
   */
  async deleteUserByAdmin(userId, adminId) {
    if (userId === adminId) {
      throw new AppError(userMessages.CANNOT_DELETE_SELF, ERROR_CODES.BAD_REQUEST, ERROR_CODES.USER.CANNOT_DELETE_SELF);
    }
    // Consider implications: what happens to user's orders, reviews, etc.?
    // For now, direct deletion. Add cascading logic or soft delete if needed.
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new AppError(userMessages.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND, ERROR_CODES.USER.NOT_FOUND);
    }
  }

  /**
   * Get current logged-in user's profile.
   * @param {string} userId - The ID of the logged-in user.
   * @returns {Promise<User>} The user profile.
   */
  async getCurrentUserProfile(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new AppError(userMessages.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND, ERROR_CODES.USER.NOT_FOUND);
    }
    return user;
  }

  /**
   * Update current logged-in user's profile.
   * @param {string} userId - The ID of the user.
   * @param {Object} profileData - Data to update (name, phone only).
   * @returns {Promise<User>} The updated user profile.
   */
  async updateCurrentUserProfile(userId, profileData) {
    // Explicitly prevent email updates first
    if (profileData.email) {
      throw new AppError('Email không thể được thay đổi', ERROR_CODES.BAD_REQUEST, ERROR_CODES.USER.EMAIL_IMMUTABLE);
    }
    
    const { name, phone } = profileData;
    const allowedUpdates = {};
    if (name !== undefined) allowedUpdates.name = name;
    if (phone !== undefined) allowedUpdates.phone = phone;
    // Email, role, password, isActive are not updatable here.

    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new AppError(userMessages.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND, ERROR_CODES.USER.NOT_FOUND);
    }

    // Apply updates manually and save to trigger middleware
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    
    await user.save();
    return user;
  }

  /**
   * Change current logged-in user's password.
   * @param {string} userId - The ID of the user.
   * @param {string} currentPassword - The current password.
   * @param {string} newPassword - The new password.
   * @returns {Promise<void>}
   */
  async changeCurrentUserPassword(userId, currentPassword, newPassword) {
    if (!newPassword || newPassword.length < 8) { // Using UserSchema minlength
      throw new AppError(userMessages.PASSWORD_TOO_SHORT, ERROR_CODES.BAD_REQUEST, ERROR_CODES.USER.PASSWORD_TOO_SHORT);
    }

    // Check if new password is same as current password
    if (currentPassword === newPassword) {
      throw new AppError('Mật khẩu mới phải khác với mật khẩu hiện tại', ERROR_CODES.BAD_REQUEST, ERROR_CODES.USER.SAME_PASSWORD);
    }

    const user = await User.findById(userId).select('+password'); // Need password to compare
    if (!user) {
      throw new AppError(userMessages.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND, ERROR_CODES.USER.NOT_FOUND);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError(userMessages.INVALID_CURRENT_PASSWORD, ERROR_CODES.BAD_REQUEST, ERROR_CODES.USER.INVALID_CURRENT_PASSWORD);
    }

    user.password = newPassword; // Schema pre-save hook will hash it
    await user.save();
  }

  /**
   * Update user role by Admin.
   * @param {string} userId - The ID of the user.
   * @param {string} newRole - The new role for the user.
   * @returns {Promise<User>} The updated user.
   */
  async updateUserRoleByAdmin(userId, newRole) {
    if (!Object.values(ROLES).includes(newRole)) {
      throw new AppError(MESSAGES.VALIDATION_ERROR, ERROR_CODES.BAD_REQUEST, ERROR_CODES.INVALID_INPUT); // Or a more specific role error
    }
    const user = await User.findByIdAndUpdate(userId, { role: newRole }, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      throw new AppError(userMessages.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND, ERROR_CODES.USER.NOT_FOUND);
    }
    return user;
  }

  /**
   * Toggle user active status by Admin.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<User>} The updated user.
   */
  async toggleUserActiveStatusByAdmin(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new AppError(userMessages.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND, ERROR_CODES.USER.NOT_FOUND);
    }
    user.isActive = !user.isActive;
    await user.save(); // Save the instance to trigger pre-save hooks if any (though not for isActive directly)
    return user;
  }

  // --- Address Management ---

  /**
   * Add a new address for the current user.
   * @param {string} userId - The ID of the user.
   * @param {Object} addressData - Data for the new address.
   * @returns {Promise<Address>} The created address.
   */
  async addUserAddress(userId, addressData) {
    console.log('[DEBUG UserService] addUserAddress called with userId:', userId);
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(userMessages.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND, ERROR_CODES.USER.NOT_FOUND);
    }

    // Kiểm tra giới hạn số lượng địa chỉ
    const existingAddressesCount = await Address.countDocuments({ user: userId });
    console.log(`[DEBUG] User ${userId} has ${existingAddressesCount} addresses, limit is ${MAX_ADDRESSES_PER_USER}`);
    
    if (existingAddressesCount >= MAX_ADDRESSES_PER_USER) {
      console.log(`[DEBUG] Blocking address creation - limit reached`);
      throw new AppError(`Không thể thêm địa chỉ. Tối đa ${MAX_ADDRESSES_PER_USER} địa chỉ cho mỗi người dùng.`, ERROR_CODES.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const newAddressData = { ...addressData, user: userId };

    // If this is the first address, make it default
    if (existingAddressesCount === 0) {
      newAddressData.isDefault = true;
    } else if (newAddressData.isDefault) {
      // If new address is set as default, unset other defaults
      await Address.updateMany({ user: userId, isDefault: true }, { isDefault: false });
    }

    const newAddress = new Address(newAddressData);
    await newAddress.save();
    return newAddress;
  }

  /**
   * Get all addresses for the current user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Array<Address>>} List of addresses.
   */
  async getUserAddresses(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(userMessages.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND, ERROR_CODES.USER.NOT_FOUND);
    }
    return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
  }

  /**
   * Get a specific address by ID for the current user.
   * @param {string} userId - The ID of the user.
   * @param {string} addressId - The ID of the address.
   * @returns {Promise<Address>} The address.
   */
  async getUserAddressById(userId, addressId) {
      const address = await Address.findOne({ _id: addressId, user: userId });
      if (!address) {
          throw new AppError(userMessages.ADDRESS_NOT_FOUND, ERROR_CODES.NOT_FOUND, ERROR_CODES.USER.ADDRESS_NOT_FOUND);
      }
      return address;
  }


  /**
   * Update an address for the current user.
   * @param {string} userId - The ID of the user.
   * @param {string} addressId - The ID of the address to update.
   * @param {Object} updateData - Data to update.
   * @returns {Promise<Address>} The updated address.
   */
  async updateUserAddress(userId, addressId, updateData) {
    const { isDefault, ...restOfData } = updateData;

    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) {
      throw new AppError(userMessages.ADDRESS_NOT_FOUND, ERROR_CODES.NOT_FOUND, ERROR_CODES.USER.ADDRESS_NOT_FOUND);
    }

    if (isDefault === true && !address.isDefault) {
      // If setting this address as default, unset other defaults for this user
      await Address.updateMany({ user: userId, isDefault: true }, { isDefault: false });
    }
    
    // Apply updates
    Object.assign(address, restOfData);
    if (isDefault !== undefined) {
        address.isDefault = isDefault;
    }
    
    await address.save();
    return address;
  }

  /**
   * Delete an address for the current user.
   * @param {string} userId - The ID of the user.
   * @param {string} addressId - The ID of the address to delete.
   * @returns {Promise<void>}
   */
  async deleteUserAddress(userId, addressId) {
    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) {
      throw new AppError(userMessages.ADDRESS_NOT_FOUND, ERROR_CODES.NOT_FOUND, ERROR_CODES.USER.ADDRESS_NOT_FOUND);
    }

    // Check if this is the only address for the user
    const userAddressCount = await Address.countDocuments({ user: userId });
    if (userAddressCount <= 1) {
      throw new AppError('Không thể xóa địa chỉ cuối cùng. Mỗi người dùng phải có ít nhất một địa chỉ.', ERROR_CODES.BAD_REQUEST, ERROR_CODES.USER.CANNOT_DELETE_LAST_ADDRESS);
    }

    // Bảo vệ xóa địa chỉ mặc định - phải chọn địa chỉ thay thế trước
    if (address.isDefault) {
      const otherDefaultAddress = await Address.findOne({ 
        user: userId, 
        _id: { $ne: addressId }, 
        isDefault: true 
      });
      
      if (!otherDefaultAddress) {
        throw new AppError('Không thể xóa địa chỉ mặc định. Vui lòng chọn địa chỉ khác làm mặc định trước khi xóa.', ERROR_CODES.BAD_REQUEST, ERROR_CODES.USER.CANNOT_DELETE_DEFAULT);
      }
    }

    await Address.findOneAndDelete({ _id: addressId, user: userId });
  }

  /**
   * Set an address as the default for the current user.
   * @param {string} userId - The ID of the user.
   * @param {string} addressId - The ID of the address to set as default.
   * @returns {Promise<Address>} The new default address.
   */
  async setDefaultUserAddress(userId, addressId) {
    const addressToSetDefault = await Address.findOne({ _id: addressId, user: userId });
    if (!addressToSetDefault) {
      throw new AppError(userMessages.ADDRESS_NOT_FOUND, ERROR_CODES.NOT_FOUND, ERROR_CODES.USER.ADDRESS_NOT_FOUND);
    }

    if (!addressToSetDefault.isDefault) {
      await Address.updateMany({ user: userId, isDefault: true }, { isDefault: false });
      addressToSetDefault.isDefault = true;
      await addressToSetDefault.save();
    }
    return addressToSetDefault;
  }

  /**
   * Get comprehensive user statistics for admin dashboard
   * @returns {Promise<Object>} User statistics including totals, role distribution, monthly data, active users
   */
  async getUserStatistics() {
    try {
      // Get total users count
      const totalUsers = await User.countDocuments();
      
      // Get users by role distribution
      const roleDistribution = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get monthly user registrations for last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const monthlyRegistrations = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: twelveMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1
          }
        }
      ]);

      // Get active users in last 30 days (users created or updated recently)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActiveUsers = await User.countDocuments({
        $or: [
          { createdAt: { $gte: thirtyDaysAgo } },
          { updatedAt: { $gte: thirtyDaysAgo } }
        ],
        isActive: true
      });

      // Get users by status
      const activeUsers = await User.countDocuments({ isActive: true });
      const inactiveUsers = await User.countDocuments({ isActive: false });

      // Format role distribution for easier frontend consumption
      const formattedRoleDistribution = {};
      roleDistribution.forEach(role => {
        formattedRoleDistribution[role._id] = role.count;
      });

      // Fill in missing months with 0 for complete 12-month data
      const completeMonthlyData = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        const existingData = monthlyRegistrations.find(
          item => item._id.year === year && item._id.month === month
        );
        
        completeMonthlyData.push({
          year,
          month,
          monthName: date.toLocaleString('vi-VN', { month: 'long' }),
          count: existingData ? existingData.count : 0
        });
      }

      // Additional insights
      const insights = {
        averageUsersPerMonth: Math.round(completeMonthlyData.reduce((sum, month) => sum + month.count, 0) / 12),
        mostActiveMonth: completeMonthlyData.reduce((max, month) => 
          month.count > max.count ? month : max, { count: 0 }
        ),
        growthTrend: completeMonthlyData.length >= 2 ? 
          completeMonthlyData[completeMonthlyData.length - 1].count - 
          completeMonthlyData[completeMonthlyData.length - 2].count : 0
      };

      return {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          recentActiveUsers: recentActiveUsers
        },
        roleDistribution: formattedRoleDistribution,
        monthlyRegistrations: completeMonthlyData,
        insights,
        generatedAt: new Date()
      };
    } catch (error) {
      throw new AppError(`Lỗi khi lấy thống kê người dùng: ${error.message}`, ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  // --- Admin Address Management ---
  async getUserAddressesByAdmin(userId) {
    try {
      console.log(`[DEBUG] UserService.getUserAddressesByAdmin for user: ${userId}`);
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('Không tìm thấy người dùng', ERROR_CODES.NOT_FOUND);
      }
      
      // Get all addresses for this user
      const addresses = await Address.find({ user: userId })
        .sort({ isDefault: -1, createdAt: -1 }) // Default addresses first, then by creation date
        .lean();
      
      console.log(`[DEBUG] Found ${addresses.length} addresses for user ${userId}`);
      return addresses;
    } catch (error) {
      console.error('[ERROR] getUserAddressesByAdmin:', error);
      throw error;
    }
  }
}

module.exports = UserService;
