/**
 * Message Translation Utility
 * Translates backend messages (English + Vietnamese) to Vietnamese only
 */

// Message mapping từ backend messages thành Vietnamese messages
const messageMap: Record<string, string> = {
  // Authentication messages
  'Invalid credentials': 'Thông tin đăng nhập không hợp lệ',
  'User not found': 'Không tìm thấy người dùng',
  'Password is incorrect': 'Mật khẩu không chính xác',
  'Current password is incorrect': 'Mật khẩu hiện tại không chính xác',
  'Mật khẩu hiện tại không chính xác': 'Mật khẩu hiện tại không chính xác',
  'Mật khẩu hiện tại không chính xác.': 'Mật khẩu hiện tại không chính xác',
  'Email already exists': 'Email đã tồn tại',
  'Token is invalid': 'Phiên đăng nhập đã hết hạn',
  'Token has expired': 'Phiên đăng nhập đã hết hạn',
  'Unauthorized': 'Không có quyền truy cập',
  'Access denied': 'Không có quyền truy cập',
  
  // Product messages
  'Product not found': 'Không tìm thấy sản phẩm',
  'Product out of stock': 'Sản phẩm đã hết hàng',
  'Insufficient stock': 'Số lượng tồn kho không đủ',
  'Product already in wishlist': 'Sản phẩm đã có trong danh sách yêu thích',
  'Product not in wishlist': 'Sản phẩm không có trong danh sách yêu thích',
  
  // Wishlist messages
  'Wishlist not found': 'Không tìm thấy danh sách yêu thích',
  'Wishlist is empty': 'Danh sách yêu thích trống',
  'Failed to add to wishlist': 'Không thể thêm vào danh sách yêu thích',
  'Failed to remove from wishlist': 'Không thể xóa khỏi danh sách yêu thích',
  'Wishlist cleared successfully': 'Đã xóa toàn bộ danh sách yêu thích',
  
  // Cart messages
  'Cart not found': 'Không tìm thấy giỏ hàng',
  'Cart is empty': 'Giỏ hàng trống',
  'Failed to add to cart': 'Không thể thêm vào giỏ hàng',
  'Failed to update cart': 'Không thể cập nhật giỏ hàng',
  'Failed to remove from cart': 'Không thể xóa khỏi giỏ hàng',
  
  // Order messages
  'Order not found': 'Không tìm thấy đơn hàng',
  'Order already cancelled': 'Đơn hàng đã bị hủy',
  'Order cannot be cancelled': 'Không thể hủy đơn hàng',
  'Payment failed': 'Thanh toán thất bại',
  'Payment successful': 'Thanh toán thành công',
  
  // Validation messages
  'Invalid email format': 'Định dạng email không hợp lệ',
  'Password must be at least 6 characters': 'Mật khẩu phải có ít nhất 6 ký tự',
  'Required field': 'Trường bắt buộc',
  'Invalid phone number': 'Số điện thoại không hợp lệ',
  'Invalid address': 'Địa chỉ không hợp lệ',
  
  // Network messages
  'Network error': 'Lỗi kết nối mạng',
  'Server error': 'Lỗi server',
  'Request timeout': 'Hết thời gian chờ',
  'Service unavailable': 'Dịch vụ không khả dụng',
  'Failed to fetch data': 'Không thể tải dữ liệu',
  
  // Generic messages
  'Operation failed': 'Thao tác thất bại',
  'Operation successful': 'Thao tác thành công',
  'Something went wrong': 'Đã có lỗi xảy ra',
  'Please try again': 'Vui lòng thử lại',
  'Data updated successfully': 'Cập nhật dữ liệu thành công',
  'Data deleted successfully': 'Xóa dữ liệu thành công',
};

// Success messages mapping
const successMessageMap: Record<string, string> = {
  'Login successful': 'Đăng nhập thành công',
  'Registration successful': 'Đăng ký thành công',
  'Logout successful': 'Đăng xuất thành công',
  'Profile updated': 'Cập nhật hồ sơ thành công',
  'Password changed': 'Đổi mật khẩu thành công',
  'Password changed successfully': 'Đổi mật khẩu thành công',
  'Added to wishlist': 'Đã thêm vào danh sách yêu thích',
  'Removed from wishlist': 'Đã xóa khỏi danh sách yêu thích',
  'Added to cart': 'Đã thêm vào giỏ hàng',
  'Cart updated': 'Đã cập nhật giỏ hàng',
  'Order placed': 'Đặt hàng thành công',
  'Order cancelled': 'Hủy đơn hàng thành công',
};

/**
 * Translates a message to Vietnamese
 * @param message Original message (English or Vietnamese)
 * @returns Vietnamese message
 */
export function translateMessage(message: string): string {
  if (!message) return '';
  
  // Check if message is already in Vietnamese (contains Vietnamese characters)
  const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/;
  if (vietnameseRegex.test(message)) {
    return message;
  }
  
  // Try to find exact match in error messages
  if (messageMap[message]) {
    return messageMap[message];
  }
  
  // Try to find exact match in success messages
  if (successMessageMap[message]) {
    return successMessageMap[message];
  }
  
  // Try partial matching for complex messages
  for (const [englishMsg, vietnameseMsg] of Object.entries(messageMap)) {
    if (message.toLowerCase().includes(englishMsg.toLowerCase())) {
      return vietnameseMsg;
    }
  }
  
  // If no translation found, return original message
  return message;
}

/**
 * Translates error message specifically
 * @param error Error object or message string
 * @returns Vietnamese error message
 */
export function translateError(error: any): string {
  let message = '';
  
  if (typeof error === 'string') {
    message = error;
  } else if (error?.response?.data?.message) {
    message = error.response.data.message;
  } else if (error?.message) {
    message = error.message;
  } else {
    message = 'Đã có lỗi xảy ra';
  }
  
  return translateMessage(message);
}

/**
 * Translates success message specifically
 * @param message Success message
 * @returns Vietnamese success message
 */
export function translateSuccess(message: string): string {
  return translateMessage(message);
}

/**
 * Check if message is already in Vietnamese
 * @param message Message to check
 * @returns true if message contains Vietnamese characters
 */
export function isVietnamese(message: string): boolean {
  const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/;
  return vietnameseRegex.test(message);
}
