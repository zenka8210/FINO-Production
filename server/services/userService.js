const BaseService = require('./baseService');
const User = require('../models/UserSchema');
const Address = require('../models/AddressSchema');
const bcrypt = require('bcryptjs');
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES, ERROR_CODES, ROLES, PAGINATION, userMessages, authMessages } = require('../config/constants');

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
   * @param {Object} profileData - Data to update (name, phone).
   * @returns {Promise<User>} The updated user profile.
   */
  async updateCurrentUserProfile(userId, profileData) {
    const { name, phone } = profileData;
    const allowedUpdates = {};
    if (name !== undefined) allowedUpdates.name = name;
    if (phone !== undefined) allowedUpdates.phone = phone;
    // Email, role, password, isActive are not updatable here.

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
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(userMessages.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND, ERROR_CODES.USER.NOT_FOUND);
    }

    const newAddressData = { ...addressData, user: userId };

    // If this is the first address, make it default
    const existingAddressesCount = await Address.countDocuments({ user: userId });
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
    const address = await Address.findOneAndDelete({ _id: addressId, user: userId });
    if (!address) {
      throw new AppError(userMessages.ADDRESS_NOT_FOUND, ERROR_CODES.NOT_FOUND, ERROR_CODES.USER.ADDRESS_NOT_FOUND);
    }

    // If the deleted address was default, and there are other addresses, set the most recent one as default.
    if (address.isDefault) {
      const remainingAddresses = await Address.find({ user: userId }).sort({ createdAt: -1 });
      if (remainingAddresses.length > 0) {
        remainingAddresses[0].isDefault = true;
        await remainingAddresses[0].save();
      }
    }
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
}

module.exports = UserService;
