module.exports = {
  // Trạng thái đơn hàng
  ORDER_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  },

  // Vai trò người dùng
  ROLES: {
    ADMIN: 'admin',
    USER: 'customer'
  },
  // Thông báo hệ thống
  MESSAGES: {
    ACCESS_DENIED: 'Bạn không có quyền thực hiện thao tác này',
    NOT_FOUND: 'Không tìm thấy dữ liệu yêu cầu',
    SERVER_ERROR: 'Lỗi hệ thống',
    AUTH_FAILED: 'Xác thực không thành công',
    VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
    LOGIN_SUCCESS: 'Đăng nhập thành công',
    LOGOUT_SUCCESS: 'Đăng xuất thành công',
    REGISTER_SUCCESS: 'Đăng ký tài khoản thành công',
    RESOURCE_CREATED: 'Tạo mới thành công',
    RESOURCE_UPDATED: 'Cập nhật thành công',
    RESOURCE_DELETED: 'Xóa thành công',
    PAYMENT_SUCCESS: 'Thanh toán thành công',
    ORDER_PLACED: 'Đặt hàng thành công',
    
    // Product messages
    PRODUCT_CREATED: 'Tạo sản phẩm thành công',
    PRODUCT_UPDATED: 'Cập nhật sản phẩm thành công',
    PRODUCT_DELETED: 'Xóa sản phẩm thành công',
    PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm',
    PRODUCT_STATUS_UPDATED: 'Cập nhật trạng thái sản phẩm thành công',
    
    // Category messages
    CATEGORY_NOT_FOUND: 'Không tìm thấy danh mục',
    CATEGORY_CREATED: 'Tạo danh mục thành công',
    CATEGORY_UPDATED: 'Cập nhật danh mục thành công',
    CATEGORY_DELETED: 'Xóa danh mục thành công',
    CATEGORY_EXISTS: 'Tên danh mục đã tồn tại',
    PARENT_CATEGORY_NOT_FOUND: 'Không tìm thấy danh mục cha',
    CATEGORY_CREATE_FAILED: 'Tạo danh mục thất bại',
    CATEGORY_UPDATE_FAILED: 'Cập nhật danh mục thất bại',
    CATEGORY_DELETE_FAILED: 'Xóa danh mục thất bại',    // Review messages
    REVIEW_CREATED: 'Tạo đánh giá thành công',
    REVIEW_UPDATED: 'Cập nhật đánh giá thành công',
    REVIEW_DELETED: 'Xóa đánh giá thành công',
    REVIEW_NOT_FOUND: 'Không tìm thấy đánh giá',
    REVIEW_CREATE_FAILED: 'Tạo đánh giá thất bại',
    REVIEW_UPDATE_FAILED: 'Cập nhật đánh giá thất bại',
    REVIEW_DELETE_FAILED: 'Xóa đánh giá thất bại',
    REVIEW_APPROVED: 'Duyệt đánh giá thành công',
    REVIEW_REJECTED: 'Từ chối đánh giá thành công',
    REVIEW_APPROVE_FAILED: 'Duyệt đánh giá thất bại',    // Cart messages
    CART_ITEM_ADDED: 'Thêm sản phẩm vào giỏ hàng thành công',
    CART_ITEM_UPDATED: 'Cập nhật giỏ hàng thành công',
    CART_ITEM_REMOVED: 'Xóa sản phẩm khỏi giỏ hàng thành công',
    CART_CLEARED: 'Xóa toàn bộ giỏ hàng thành công',
    CART_SYNCED: 'Đồng bộ giỏ hàng thành công',
    CART_SYNC_FAILED: 'Đồng bộ giỏ hàng thất bại',
    CART_EMPTY: 'Giỏ hàng trống',
    CART_ITEM_NOT_FOUND: 'Không tìm thấy sản phẩm trong giỏ hàng',

    // Address messages
    ADDRESS_CREATED: 'Tạo địa chỉ thành công',
    ADDRESS_UPDATED: 'Cập nhật địa chỉ thành công',
    ADDRESS_DELETED: 'Xóa địa chỉ thành công',
    ADDRESS_NOT_FOUND: 'Không tìm thấy địa chỉ',
    ADDRESS_SET_DEFAULT: 'Đặt địa chỉ mặc định thành công',    // News messages
    NEWS_CREATED: 'Tạo tin tức thành công',
    NEWS_UPDATED: 'Cập nhật tin tức thành công',
    NEWS_DELETED: 'Xóa tin tức thành công',
    NEWS_NOT_FOUND: 'Không tìm thấy tin tức',
    NEWS_PUBLISHED: 'Xuất bản tin tức thành công',    // Tag messages
    TAG_CREATED: 'Tạo tag thành công',
    TAG_UPDATED: 'Cập nhật tag thành công',
    TAG_DELETED: 'Xóa tag thành công',
    TAG_NOT_FOUND: 'Không tìm thấy tag',
    TAG_ALREADY_EXISTS: 'Tag đã tồn tại',
    TAG_BULK_CREATED: 'Tạo tag hàng loạt thành công',    // Promotion messages
    PROMOTION_CREATED: 'Tạo chương trình khuyến mãi thành công',
    PROMOTION_UPDATED: 'Cập nhật chương trình khuyến mãi thành công',
    PROMOTION_DELETED: 'Xóa chương trình khuyến mãi thành công',
    PROMOTION_NOT_FOUND: 'Không tìm thấy chương trình khuyến mãi',
    PROMOTION_ACTIVATED: 'Kích hoạt chương trình khuyến mãi thành công',
    PROMOTION_DEACTIVATED: 'Tắt chương trình khuyến mãi thành công',

    // Return Request messages
    RETURN_REQUEST_CREATED: 'Tạo yêu cầu trả hàng thành công',
    RETURN_REQUEST_UPDATED: 'Cập nhật yêu cầu trả hàng thành công',
    RETURN_REQUEST_DELETED: 'Xóa yêu cầu trả hàng thành công',
    RETURN_REQUEST_NOT_FOUND: 'Không tìm thấy yêu cầu trả hàng',
    RETURN_REQUEST_APPROVED: 'Phê duyệt yêu cầu trả hàng thành công',
    RETURN_REQUEST_REJECTED: 'Từ chối yêu cầu trả hàng',
    RETURN_REQUEST_COMPLETED: 'Hoàn thành xử lý trả hàng',

    // Voucher messages
    VOUCHER_CREATED: 'Tạo voucher thành công',
    VOUCHER_UPDATED: 'Cập nhật voucher thành công',
    VOUCHER_DELETED: 'Xóa voucher thành công',
    VOUCHER_NOT_FOUND: 'Không tìm thấy voucher',
    VOUCHER_APPLIED: 'Áp dụng voucher thành công',
    VOUCHER_INVALID: 'Mã voucher không hợp lệ',    // Success messages
    SUCCESS: {
      DATA_RETRIEVED: 'Lấy dữ liệu thành công',
      CART_ITEM_ADDED: 'Thêm sản phẩm vào giỏ hàng thành công',
      CART_ITEM_UPDATED: 'Cập nhật giỏ hàng thành công',
      CART_ITEM_REMOVED: 'Xóa sản phẩm khỏi giỏ hàng thành công',
      CART_CLEARED: 'Xóa toàn bộ giỏ hàng thành công',
      CART_SYNCED: 'Đồng bộ giỏ hàng thành công',
        TAG: {
        CREATED: 'Tạo tag thành công',
        UPDATED: 'Cập nhật tag thành công',
        DELETED: 'Xóa tag thành công',
        BULK_CREATED: 'Tạo tag hàng loạt thành công'
      },

      PROMOTION: {
        CREATED: 'Tạo chương trình khuyến mãi thành công',
        UPDATED: 'Cập nhật chương trình khuyến mãi thành công',
        DELETED: 'Xóa chương trình khuyến mãi thành công',
        ACTIVATED: 'Kích hoạt chương trình khuyến mãi thành công',
        DEACTIVATED: 'Tắt chương trình khuyến mãi thành công'
      },

      RETURN_REQUEST: {
        CREATED: 'Tạo yêu cầu trả hàng thành công',
        UPDATED: 'Cập nhật yêu cầu trả hàng thành công',
        DELETED: 'Xóa yêu cầu trả hàng thành công',
        APPROVED: 'Phê duyệt yêu cầu trả hàng thành công',
        REJECTED: 'Từ chối yêu cầu trả hàng',
        COMPLETED: 'Hoàn thành xử lý trả hàng'
      }
    },// Error messages
    ERROR: {
      DATA_RETRIEVE_FAILED: 'Lấy dữ liệu thất bại',
      CART_SYNC_FAILED: 'Đồng bộ giỏ hàng thất bại',
      PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm',
      CART_ITEM_NOT_FOUND: 'Không tìm thấy sản phẩm trong giỏ hàng',
        TAG: {
        NOT_FOUND: 'Không tìm thấy tag',
        ALREADY_EXISTS: 'Tag đã tồn tại',
        IN_USE: 'Tag đang được sử dụng',
        CREATE_FAILED: 'Tạo tag thất bại',
        UPDATE_FAILED: 'Cập nhật tag thất bại',
        DELETE_FAILED: 'Xóa tag thất bại'
      },

      PROMOTION: {
        NOT_FOUND: 'Không tìm thấy chương trình khuyến mãi',
        INVALID_DATE: 'Ngày không hợp lệ',
        INVALID_PRODUCTS: 'Sản phẩm không hợp lệ',
        INVALID_VALUE: 'Giá trị khuyến mãi không hợp lệ',
        CREATE_FAILED: 'Tạo khuyến mãi thất bại',
        UPDATE_FAILED: 'Cập nhật khuyến mãi thất bại',
        DELETE_FAILED: 'Xóa khuyến mãi thất bại'
      },

      RETURN_REQUEST: {
        NOT_FOUND: 'Không tìm thấy yêu cầu trả hàng',
        INVALID_ORDER_STATUS: 'Trạng thái đơn hàng không hợp lệ để trả hàng',
        EXPIRED: 'Đã quá thời hạn trả hàng',
        ALREADY_EXISTS: 'Đã có yêu cầu trả hàng cho đơn hàng này',
        INVALID_ITEM: 'Sản phẩm không hợp lệ',
        INVALID_QUANTITY: 'Số lượng không hợp lệ',
        INVALID_STATUS_TRANSITION: 'Không thể chuyển trạng thái',
        CANNOT_DELETE: 'Không thể xóa yêu cầu trả hàng',
        CREATE_FAILED: 'Tạo yêu cầu trả hàng thất bại',
        UPDATE_FAILED: 'Cập nhật yêu cầu trả hàng thất bại'
      }
    }
  },
  // Các mã lỗi
  ERROR_CODES: {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    VALIDATION_ERROR: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SERVER_ERROR: 500,
      // Product specific error codes
    PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
    CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
    INVALID_INPUT: 'INVALID_INPUT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
      // Cart specific error codes
    CART_ITEM_NOT_FOUND: 'CART_ITEM_NOT_FOUND',
    CART_SYNC_FAILED: 'CART_SYNC_FAILED',
      // Tag specific error codes
    TAG: {
      NOT_FOUND: 'TAG_NOT_FOUND',
      ALREADY_EXISTS: 'TAG_ALREADY_EXISTS',
      IN_USE: 'TAG_IN_USE',
      CREATE_FAILED: 'TAG_CREATE_FAILED',
      UPDATE_FAILED: 'TAG_UPDATE_FAILED',
      DELETE_FAILED: 'TAG_DELETE_FAILED'
    },

    // Promotion specific error codes
    PROMOTION: {
      NOT_FOUND: 'PROMOTION_NOT_FOUND',
      INVALID_DATE: 'PROMOTION_INVALID_DATE',
      INVALID_PRODUCTS: 'PROMOTION_INVALID_PRODUCTS',
      INVALID_VALUE: 'PROMOTION_INVALID_VALUE',
      CREATE_FAILED: 'PROMOTION_CREATE_FAILED',
      UPDATE_FAILED: 'PROMOTION_UPDATE_FAILED',
      DELETE_FAILED: 'PROMOTION_DELETE_FAILED'
    },

    // Return Request specific error codes
    RETURN_REQUEST: {
      NOT_FOUND: 'RETURN_REQUEST_NOT_FOUND',
      INVALID_ORDER_STATUS: 'RETURN_REQUEST_INVALID_ORDER_STATUS',
      EXPIRED: 'RETURN_REQUEST_EXPIRED',
      ALREADY_EXISTS: 'RETURN_REQUEST_ALREADY_EXISTS',
      INVALID_ITEM: 'RETURN_REQUEST_INVALID_ITEM',
      INVALID_QUANTITY: 'RETURN_REQUEST_INVALID_QUANTITY',
      INVALID_STATUS_TRANSITION: 'RETURN_REQUEST_INVALID_STATUS_TRANSITION',
      CANNOT_DELETE: 'RETURN_REQUEST_CANNOT_DELETE',
      CREATE_FAILED: 'RETURN_REQUEST_CREATE_FAILED',
      UPDATE_FAILED: 'RETURN_REQUEST_UPDATE_FAILED'
    }
  },

  // Cấu hình phân trang
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },
  
  // Loại thông báo
  NOTIFICATION_TYPES: {
    ORDER_STATUS: 'order_status',
    PROMOTION: 'promotion',
    SYSTEM: 'system'
  }
};
