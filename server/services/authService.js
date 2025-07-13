const BaseService = require('./baseService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserSchema');
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES, ERROR_CODES, ROLES } = require('../config/constants');

class AuthService extends BaseService {
  constructor() {
    super(User);
  }

  /**
   * @description Service to handle user registration
   * @param {object} userData - User data for registration
   * @returns {Promise<object>} The created user object (without password)
   * @throws {AppError} If email already exists or registration fails
   */
  async register(userData) {
  const { email, password, name, phone } = userData;

  // Kiểm tra xem email đã tồn tại chưa
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email đã tồn tại trong hệ thống', ERROR_CODES.CONFLICT);
  }

  // Tạo người dùng mới
  const user = new User({
    email,
    password, // Password will be hashed by pre-save hook in UserSchema
    name,
    phone,
    role: userData.role || 'customer', // Default role is 'customer', admin only by explicit assignment
  });

  await user.save();

  // Loại bỏ mật khẩu khỏi đối tượng user trả về
  const userObject = user.toObject();
  delete userObject.password;
  return userObject;
}

/**
 * @description Service to handle user login
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<object>} Object containing user details (without password) and JWT token
 * @throws {AppError} If user not found or credentials invalid
 */
async login(email, password) {
  // Tìm người dùng bằng email
  const user = await User.findOne({ email }).select('+password'); // Include password for comparison
  if (!user) {
    throw new AppError(MESSAGES.AUTH_FAILED, ERROR_CODES.UNAUTHORIZED);
  }

  // So sánh mật khẩu
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError(MESSAGES.AUTH_FAILED, ERROR_CODES.UNAUTHORIZED);
  }

  // Tạo JWT token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  // Loại bỏ mật khẩu khỏi đối tượng user trả về
  const userObject = user.toObject();
  delete userObject.password;

  return { user: userObject, token };
}
}

module.exports = AuthService;
