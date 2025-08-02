const BaseService = require('./baseService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/UserSchema');
const EmailService = require('./emailService');
const { AppError } = require('../middlewares/errorHandler');
const { MESSAGES, ERROR_CODES, ROLES } = require('../config/constants');

class AuthService extends BaseService {
  constructor() {
    super(User);
    this.emailService = new EmailService();
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  /**
   * @description Generate JWT token for user
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @returns {string} JWT token
   */
  generateToken(userId, role) {
    return jwt.sign(
      { id: userId, role: role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
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
  console.log('AuthService login attempt:', { email, passwordLength: password?.length });
  
  // Tìm người dùng bằng email
  const user = await User.findOne({ email }).select('+password'); // Include password for comparison
  console.log('User found:', user ? { id: user._id, email: user.email, hasPassword: !!user.password } : null);
  
  if (!user) {
    console.log('User not found for email:', email);
    throw new AppError(MESSAGES.AUTH_FAILED, ERROR_CODES.UNAUTHORIZED);
  }

  // So sánh mật khẩu
  const isMatch = await user.comparePassword(password);
  console.log('Password match result:', isMatch);
  
  if (!isMatch) {
    console.log('Password mismatch for user:', email);
    throw new AppError(MESSAGES.AUTH_FAILED, ERROR_CODES.UNAUTHORIZED);
  }

  // Tạo JWT token
  const token = this.generateToken(user._id, user.role);

  // Loại bỏ mật khẩu khỏi đối tượng user trả về
  const userObject = user.toObject();
  delete userObject.password;

  return { user: userObject, token };
}

/**
 * @description Check if email exists in the system
 * @param {string} email - Email to check
 * @returns {Promise<object>} Object indicating if email exists
 * @throws {AppError} If email not found
 */
async checkEmail(email) {
  console.log('AuthService checkEmail attempt:', { email });
  
  // Tìm người dùng bằng email
  const user = await User.findOne({ email });
  console.log('Email check result:', user ? 'found' : 'not found');
  
  if (!user) {
    throw new AppError('Email này chưa được đăng ký trong hệ thống', ERROR_CODES.NOT_FOUND);
  }

  return { exists: true, message: 'Email đã được đăng ký trong hệ thống' };
}

/**
 * @description Send forgot password email with reset token
 * @param {string} email - User email
 * @returns {Promise<object>} Success message
 * @throws {AppError} If email not found
 */
async forgotPassword(email) {
  console.log('AuthService forgotPassword attempt:', { email });
  
  // Tìm user bằng email
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Email này chưa được đăng ký trong hệ thống', ERROR_CODES.NOT_FOUND);
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Save reset token to user
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = resetTokenExpires;
  await user.save();

  // Create reset URL
  const resetUrl = `http://localhost:3002/reset-password?token=${resetToken}`;

  try {
    // Send email
    await this.emailService.sendForgotPasswordEmail(
      email,
      user.name || 'Khách hàng',
      resetToken,
      resetUrl
    );

    console.log('✅ Forgot password email sent successfully:', { email, resetToken });

    return {
      success: true,
      message: 'Email đặt lại mật khẩu đã được gửi',
      resetToken: resetToken // For testing purposes
    };
  } catch (emailError) {
    // Rollback - remove reset token if email failed
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    console.error('❌ Send forgot password email failed:', emailError.message);
    throw new AppError('Không thể gửi email. Vui lòng thử lại sau.', ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * @description Reset user password with token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Success message
 * @throws {AppError} If token invalid or expired
 */
async resetPassword(token, newPassword) {
  console.log('🔍 AuthService resetPassword attempt:', { 
    token: token.substring(0, 10) + '...', 
    newPasswordLength: newPassword?.length 
  });

  // Hash the token to compare with stored hashed token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  console.log('🔍 Looking for user with hashed token:', hashedToken.substring(0, 10) + '...');

  // Find user with valid reset token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    console.log('❌ No user found with valid token');
    throw new AppError('Token không hợp lệ hoặc đã hết hạn', ERROR_CODES.BAD_REQUEST);
  }

  console.log('✅ User found:', { email: user.email, id: user._id });

  // Validate new password
  if (!newPassword || newPassword.length < 8) {
    throw new AppError('Mật khẩu mới phải có ít nhất 8 ký tự', ERROR_CODES.BAD_REQUEST);
  }

  console.log('🔄 Updating password...');
  
  // Set new password (let UserSchema pre-save middleware handle hashing)
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  
  // Force password modification flag
  user.markModified('password');
  
  await user.save();

  console.log('✅ Password reset successful for user:', user.email);
  console.log('🔍 User password hash after save:', user.password.substring(0, 20) + '...');

  return {
    success: true,
    message: 'Mật khẩu đã được đặt lại thành công'
  };
}

/**
 * @description Verify if reset token is valid
 * @param {string} token - Reset token to verify
 * @returns {Promise<object>} Token validity info
 * @throws {AppError} If token invalid or expired
 */
async verifyResetToken(token) {
  console.log('🔍 AuthService verifyResetToken called with:');
  console.log('- Original token:', token);
  console.log('- Token length:', token.length);
  console.log('- Token substring:', token.substring(0, 10) + '...');

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  console.log('- Hashed token:', hashedToken);

  console.log('🔍 Querying database for user with:');
  console.log('- resetPasswordToken:', hashedToken);
  console.log('- resetPasswordExpires > Date.now():', Date.now());

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  console.log('🔍 Database query result:');
  console.log('- User found:', !!user);
  
  if (user) {
    console.log('- User email:', user.email);
    console.log('- Token expires at:', user.resetPasswordExpires);
    console.log('- Current time:', new Date());
    console.log('- Token still valid:', user.resetPasswordExpires > new Date());
  } else {
    // Check if user exists with this token but expired
    const expiredUser = await User.findOne({ resetPasswordToken: hashedToken });
    if (expiredUser) {
      console.log('- Found user with expired token');
      console.log('- Token expired at:', expiredUser.resetPasswordExpires);
      console.log('- Current time:', new Date());
    } else {
      console.log('- No user found with this token hash');
    }
  }

  if (!user) {
    throw new AppError('Token không hợp lệ hoặc đã hết hạn', ERROR_CODES.BAD_REQUEST);
  }

  return {
    valid: true,
    email: user.email,
    expiresAt: user.resetPasswordExpires
  };
}

  /**
   * @description Handle Google OAuth authentication
   * @param {string} credential - Google ID token
   * @returns {Promise<object>} Authentication result with user and token
   */
  async googleAuth(credential) {
    try {
      console.log('🔐 GoogleAuth attempt started');
      console.log('📋 Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
      console.log('🎫 Credential length:', credential?.length);
      
      // Verify the Google token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      console.log('✅ Google token verified successfully');
      
      const payload = ticket.getPayload();
      console.log('📝 Google payload:', { 
        email: payload.email, 
        name: payload.name, 
        email_verified: payload.email_verified 
      });
      
      const { email, name, picture, email_verified } = payload;

      if (!email_verified) {
        console.log('❌ Email not verified');
        throw new AppError('Email Google chưa được xác thực', ERROR_CODES.BAD_REQUEST);
      }

      // Check if user already exists
      let user = await User.findOne({ email });

      if (user) {
        // User exists, log them in
        const token = this.generateToken(user._id, user.role);
        return {
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar || picture,
            isVerified: true
          },
          token,
          isNewUser: false
        };
      } else {
        // Create new user
        const newUser = new User({
          email,
          name,
          avatar: picture,
          role: ROLES.USER,
          isVerified: true,
          // No password needed for Google users
          password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)
        });

        const savedUser = await newUser.save();
        const token = this.generateToken(savedUser._id, savedUser.role);

        return {
          user: {
            _id: savedUser._id,
            email: savedUser.email,
            name: savedUser.name,
            role: savedUser.role,
            avatar: savedUser.avatar,
            isVerified: true
          },
          token,
          isNewUser: true
        };
      }
    } catch (error) {
      console.error('❌ Google auth error details:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      if (error instanceof AppError) {
        throw error;
      }
      console.error('🔥 Unexpected Google auth error:', error);
      throw new AppError('Xác thực Google thất bại', ERROR_CODES.UNAUTHORIZED);
    }
  }

}

module.exports = AuthService;
