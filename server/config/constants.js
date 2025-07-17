module.exports = {
  // Error codes
  ERROR_CODES: {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    VALIDATION_ERROR: 422,
    INTERNAL_SERVER_ERROR: 500
  },

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

  // Cấu hình phí vận chuyển
  SHIPPING: {
    FEES: {
      HCM_INNER_CITY: 20000,  // Phí ship nội thành TP.HCM
      OTHER_LOCATIONS: 50000  // Phí ship các nơi khác
    },
    CITIES: {
      HCM: ['Hồ Chí Minh', 'Ho Chi Minh', 'TP HCM', 'TP.HCM', 'Thành phố Hồ Chí Minh']
    }
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

    // User messages
    USER: {
      EMAIL_EXISTS: 'Email đã tồn tại trong hệ thống',
      NOT_FOUND: 'Người dùng không tồn tại',
      CREATED: 'Tạo người dùng thành công',
      UPDATED: 'Cập nhật thông tin người dùng thành công',
      DELETED: 'Xóa người dùng thành công',
      PROFILE_UPDATED: 'Cập nhật hồ sơ thành công',
      PASSWORD_CHANGED: 'Đổi mật khẩu thành công',
      UNAUTHORIZED_ACCESS: 'Bạn không có quyền truy cập tài khoản này'
    },
    ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng',
    ORDER_UPDATED: 'Cập nhật đơn hàng thành công',
    ORDER_STATUS_UPDATED: 'Cập nhật trạng thái đơn hàng thành công',
    ORDER_CREATE_FAILED: 'Tạo đơn hàng thất bại',
    ORDER_UPDATE_FAILED: 'Cập nhật đơn hàng thất bại',
    ORDER_DELETE_FAILED: 'Xóa đơn hàng thất bại',    // Product messages
    PRODUCT_CREATED: 'Tạo sản phẩm thành công',
    PRODUCT_UPDATED: 'Cập nhật sản phẩm thành công',
    PRODUCT_DELETED: 'Xóa sản phẩm thành công',
    PRODUCT_FETCHED: 'Lấy chi tiết sản phẩm thành công',
    PRODUCTS_FETCHED: 'Lấy danh sách sản phẩm thành công',
    PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm',
    PRODUCT_STATUS_UPDATED: 'Cập nhật trạng thái sản phẩm thành công',
    PRODUCT_CREATE_FAILED: 'Tạo sản phẩm thất bại',
    PRODUCT_UPDATE_FAILED: 'Cập nhật sản phẩm thất bại',
    PRODUCT_DELETE_FAILED: 'Xóa sản phẩm thất bại',
    PRODUCT_HAS_VARIANTS: 'Sản phẩm có biến thể, không thể xóa. Xóa các biến thể trước.',
    PRODUCT_FETCH_ALL_FAILED: 'Lấy danh sách sản phẩm thất bại',
    PRODUCT_FETCH_SINGLE_FAILED: 'Lấy chi tiết sản phẩm thất bại',
    PRODUCT_CATEGORY_REQUIRED: 'Sản phẩm phải thuộc ít nhất 1 danh mục',
    PRODUCT_MUST_HAVE_VARIANTS: 'Sản phẩm phải có ít nhất 1 variant',
    PRODUCT_INVALID_SALE_PRICE: 'Giá khuyến mãi phải nhỏ hơn giá gốc',
    PRODUCT_INVALID_SALE_PERIOD: 'Thời gian khuyến mãi không hợp lệ',
    PRODUCT_OUT_OF_STOCK: 'Sản phẩm đã hết hàng',
    PRODUCT_HIDDEN: 'Sản phẩm đã bị ẩn',

    // ProductVariant messages
    PRODUCT_VARIANT_CREATED: 'Tạo biến thể sản phẩm thành công',
    PRODUCT_VARIANT_UPDATED: 'Cập nhật biến thể sản phẩm thành công',
    PRODUCT_VARIANT_DELETED: 'Xóa biến thể sản phẩm thành công',
    PRODUCT_VARIANT_NOT_FOUND: 'Biến thể sản phẩm không tìm thấy.',
    PRODUCT_VARIANT_EXISTS: 'Biến thể sản phẩm với các thuộc tính (sản phẩm, màu, kích thước) đã tồn tại',
    PRODUCT_VARIANT_CREATE_FAILED: 'Tạo biến thể sản phẩm thất bại',
    PRODUCT_VARIANT_UPDATE_FAILED: 'Cập nhật biến thể sản phẩm thất bại',
    PRODUCT_VARIANT_DELETE_FAILED: 'Xóa biến thể sản phẩm thất bại',
    INSUFFICIENT_STOCK: 'Không đủ hàng tồn kho',
    VARIANT_DELETED_SUCCESSFULLY: 'Biến thể sản phẩm đã được xóa thành công',
    VARIANT_FETCH_ALL_FAILED: 'Lấy danh sách biến thể sản phẩm thất bại',
    VARIANT_FETCH_SINGLE_FAILED: 'Lấy chi tiết biến thể sản phẩm thất bại',
    VARIANT_FETCH_BY_PRODUCT_FAILED: 'Lấy danh sách biến thể cho sản phẩm thất bại',

    // Category messages
    CATEGORY_NOT_FOUND: 'Không tìm thấy danh mục',
    CATEGORY_CREATED: 'Tạo danh mục thành công',
    CATEGORY_UPDATED: 'Cập nhật danh mục thành công',
    CATEGORY_DELETED: 'Xóa danh mục thành công',
    CATEGORY_EXISTS: 'Tên danh mục đã tồn tại',
    PARENT_CATEGORY_NOT_FOUND: 'Không tìm thấy danh mục cha',
    CATEGORY_CREATE_FAILED: 'Tạo danh mục thất bại',
    CATEGORY_UPDATE_FAILED: 'Cập nhật danh mục thất bại',
    CATEGORY_DELETE_FAILED: 'Xóa danh mục thất bại',
    CATEGORY_HAS_CHILDREN: 'Không thể xóa danh mục có chứa danh mục con.',
    CATEGORY_FETCH_ALL_FAILED: 'Lấy danh sách danh mục thất bại',
    CATEGORY_FETCH_SINGLE_FAILED: 'Lấy chi tiết danh mục thất bại',
    CATEGORY_FETCH_PARENT_FAILED: 'Lấy danh mục cha thất bại',
    CATEGORY_FETCH_CHILD_FAILED: 'Lấy danh mục con thất bại',

    // Review messages
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

    // Cart Order messages
    CART_CREATED: 'Tạo giỏ hàng thành công',
    ORDER_CREATED: 'Tạo đơn hàng thành công',
    CART_ORDER_UPDATED: 'Cập nhật giỏ hàng/đơn hàng thành công',
    CART_ORDER_DELETED: 'Xóa giỏ hàng/đơn hàng thành công',
    CART_ORDER_NOT_FOUND: 'Không tìm thấy giỏ hàng/đơn hàng',
    ORDER_STATUS_UPDATED: 'Cập nhật trạng thái đơn hàng thành công',
    CART_ORDER_CONVERTED: 'Chuyển đổi giỏ hàng thành đơn hàng thành công',
    STOCK_AVAILABILITY_CHECKED: 'Kiểm tra tồn kho thành công',

    // Address messages
    ADDRESS_CREATED: 'Tạo địa chỉ thành công',
    ADDRESS_UPDATED: 'Cập nhật địa chỉ thành công',
    ADDRESS_DELETED: 'Xóa địa chỉ thành công',
    ADDRESS_NOT_FOUND: 'Không tìm thấy địa chỉ',
    ADDRESS_SET_DEFAULT: 'Đặt địa chỉ mặc định thành công',
    ADDRESS_CREATE_FAILED: 'Tạo địa chỉ thất bại',
    ADDRESS_UPDATE_FAILED: 'Cập nhật địa chỉ thất bại',
    ADDRESS_DELETE_FAILED: 'Xóa địa chỉ thất bại',

    // News messages
    NEWS_CREATED: 'Tạo tin tức thành công',
    NEWS_UPDATED: 'Cập nhật tin tức thành công',
    NEWS_DELETED: 'Xóa tin tức thành công',
    NEWS_NOT_FOUND: 'Không tìm thấy tin tức',
    NEWS_PUBLISHED: 'Xuất bản tin tức thành công',
    NEWS_UNPUBLISHED: 'Hủy xuất bản tin tức thành công',
    NEWS_CREATE_FAILED: 'Tạo tin tức thất bại',
    NEWS_UPDATE_FAILED: 'Cập nhật tin tức thất bại',
    NEWS_DELETE_FAILED: 'Xóa tin tức thất bại',
    NEWS_PUBLISH_FAILED: 'Xuất bản tin tức thất bại',
    NEWS_UNPUBLISH_FAILED: 'Hủy xuất bản tin tức thất bại',

    // Tag messages
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
    PROMOTION_ACTIVATE_FAILED: 'Kích hoạt chương trình khuyến mãi thất bại',
    PROMOTION_DEACTIVATE_FAILED: 'Tắt chương trình khuyến mãi thất bại',

    // Return Request messages
    RETURN_REQUEST_CREATED: 'Tạo yêu cầu trả hàng thành công',
    RETURN_REQUEST_UPDATED: 'Cập nhật yêu cầu trả hàng thành công',
    RETURN_REQUEST_DELETED: 'Xóa yêu cầu trả hàng thành công',
    RETURN_REQUEST_NOT_FOUND: 'Không tìm thấy yêu cầu trả hàng',
    RETURN_REQUEST_APPROVED: 'Phê duyệt yêu cầu trả hàng thành công',
    RETURN_REQUEST_REJECTED: 'Từ chối yêu cầu trả hàng',
    RETURN_REQUEST_COMPLETED: 'Hoàn thành xử lý trả hàng',
    RETURN_REQUEST_APPROVE_FAILED: 'Phê duyệt yêu cầu trả hàng thất bại',
    RETURN_REQUEST_REJECT_FAILED: 'Từ chối yêu cầu trả hàng thất bại',
    RETURN_REQUEST_COMPLETE_FAILED: 'Hoàn thành xử lý trả hàng thất bại',

    // Voucher messages    VOUCHER_CREATED: 'Tạo voucher thành công',
    VOUCHER_UPDATED: 'Cập nhật voucher thành công',
    VOUCHER_DELETED: 'Xóa voucher thành công',
    VOUCHER_NOT_FOUND: 'Không tìm thấy voucher',
    VOUCHER_APPLIED: 'Áp dụng voucher thành công',
    VOUCHER_INVALID: 'Mã voucher không hợp lệ',
    VOUCHER_INACTIVE: 'Voucher hiện không khả dụng',
    VOUCHER_STATUS_UPDATED: 'Cập nhật trạng thái voucher thành công',
    VOUCHER_CREATE_FAILED: 'Tạo voucher thất bại',
    VOUCHER_UPDATE_FAILED: 'Cập nhật voucher thất bại',
    VOUCHER_DELETE_FAILED: 'Xóa voucher thất bại',
    VOUCHER_APPLY_FAILED: 'Áp dụng voucher thất bại',

    // Banner messages
    BANNER_CREATED: 'Tạo banner thành công',
    BANNER_UPDATED: 'Cập nhật banner thành công',
    BANNER_DELETED: 'Xóa banner thành công',
    BANNER_NOT_FOUND: 'Không tìm thấy banner',
    BANNER_CREATE_FAILED: 'Tạo banner thất bại',
    BANNER_UPDATE_FAILED: 'Cập nhật banner thất bại',
    BANNER_DELETE_FAILED: 'Xóa banner thất bại',
    BANNER_FETCH_ALL_FAILED: 'Lấy danh sách banner thất bại',
    BANNER_FETCH_SINGLE_FAILED: 'Lấy chi tiết banner thất bại',
    BANNER_FETCH_ACTIVE_FAILED: 'Lấy danh sách banner hoạt động thất bại',

    // Color messages
    COLOR_CREATED: 'Tạo màu sắc thành công',
    COLOR_UPDATED: 'Cập nhật màu sắc thành công',
    COLOR_DELETED: 'Xóa màu sắc thành công',
    COLOR_NOT_FOUND: 'Không tìm thấy màu sắc',
    COLOR_EXISTS: 'Tên màu sắc đã tồn tại',
    COLOR_CREATE_FAILED: 'Tạo màu sắc thất bại',
    COLOR_UPDATE_FAILED: 'Cập nhật màu sắc thất bại',
    COLOR_DELETE_FAILED: 'Xóa màu sắc thất bại',
    COLOR_IN_USE: 'Màu sắc đang được sử dụng, không thể xóa.',
    COLOR_FETCH_ALL_FAILED: 'Lấy danh sách màu sắc thất bại',
    COLOR_FETCH_SINGLE_FAILED: 'Lấy chi tiết màu sắc thất bại',

    // Size messages
    SIZE_CREATED: 'Tạo kích thước thành công',
    SIZE_UPDATED: 'Cập nhật kích thước thành công',
    SIZE_DELETED: 'Xóa kích thước thành công',
    SIZE_NOT_FOUND: 'Không tìm thấy kích thước',
    SIZE_EXISTS: 'Tên kích thước đã tồn tại',
    SIZE_CREATE_FAILED: 'Tạo kích thước thất bại',
    SIZE_UPDATE_FAILED: 'Cập nhật kích thước thất bại',
    SIZE_DELETE_FAILED: 'Xóa kích thước thất bại',
    SIZE_IN_USE: 'Kích thước đang được sử dụng, không thể xóa.',
    SIZE_FETCH_ALL_FAILED: 'Lấy danh sách kích thước thất bại',
    SIZE_FETCH_SINGLE_FAILED: 'Lấy chi tiết kích thước thất bại',

    // PaymentMethod messages
    PAYMENT_METHOD_CREATED: 'Tạo phương thức thanh toán thành công',
    PAYMENT_METHOD_UPDATED: 'Cập nhật phương thức thanh toán thành công',
    PAYMENT_METHOD_DELETED: 'Xóa phương thức thanh toán thành công',
    PAYMENT_METHOD_NOT_FOUND: 'Không tìm thấy phương thức thanh toán',
    PAYMENT_METHOD_CREATE_FAILED: 'Tạo phương thức thanh toán thất bại',
    PAYMENT_METHOD_UPDATE_FAILED: 'Cập nhật phương thức thanh toán thất bại',
    PAYMENT_METHOD_DELETE_FAILED: 'Xóa phương thức thanh toán thất bại',

    // WishList messages
    WISHLIST_ITEM_ADDED: 'Thêm sản phẩm vào danh sách yêu thích thành công',
    WISHLIST_ITEM_REMOVED: 'Xóa sản phẩm khỏi danh sách yêu thích thành công',
    WISHLIST_NOT_FOUND: 'Không tìm thấy danh sách yêu thích',
    WISHLIST_CLEARED: 'Xóa toàn bộ danh sách yêu thích thành công',
    WISHLIST_ITEM_ADD_FAILED: 'Thêm sản phẩm vào danh sách yêu thích thất bại',
    WISHLIST_ITEM_REMOVE_FAILED: 'Xóa sản phẩm khỏi danh sách yêu thích thất bại',
    WISHLIST_CLEAR_FAILED: 'Xóa toàn bộ danh sách yêu thích thất bại',

    // User messages (specific to user management beyond auth)
    USER_PROFILE_UPDATED: 'Cập nhật hồ sơ người dùng thành công',
    USER_NOT_FOUND: 'Không tìm thấy người dùng',
    USER_DELETED: 'Xóa người dùng thành công',
    USER_STATUS_UPDATED: 'Cập nhật trạng thái người dùng thành công',
    USER_CREATE_FAILED: 'Tạo người dùng thất bại', // For admin creation if applicable
    USER_UPDATE_FAILED: 'Cập nhật người dùng thất bại',
    USER_DELETE_FAILED: 'Xóa người dùng thất bại',

    // Post messages
    POST_CREATED: 'Tạo bài viết thành công',
    POST_UPDATED: 'Cập nhật bài viết thành công',
    POST_DELETED: 'Xóa bài viết thành công',
    POST_NOT_FOUND: 'Không tìm thấy bài viết',
    POST_PUBLISHED: 'Xuất bản bài viết thành công',
    POST_UNPUBLISHED: 'Hủy xuất bản bài viết thành công',
    POST_CREATE_FAILED: 'Tạo bài viết thất bại',
    POST_UPDATE_FAILED: 'Cập nhật bài viết thất bại',
    POST_DELETE_FAILED: 'Xóa bài viết thất bại',
    POST_PUBLISH_FAILED: 'Xuất bản bài viết thất bại',
    POST_UNPUBLISH_FAILED: 'Hủy xuất bản bài viết thất bại',

    // Statistics messages
    STATS_RETRIEVED: 'Lấy thống kê thành công',
    STATS_RETRIEVAL_FAILED: 'Lấy thống kê thất bại',

    // Cart messages (enhancing existing)
    CART_ADD_ITEM_FAILED: 'Thêm sản phẩm vào giỏ hàng thất bại',
    CART_UPDATE_ITEM_FAILED: 'Cập nhật sản phẩm trong giỏ hàng thất bại',
    CART_REMOVE_ITEM_FAILED: 'Xóa sản phẩm khỏi giỏ hàng thất bại',
    CART_CLEAR_FAILED: 'Xóa toàn bộ giỏ hàng thất bại',

    // Messages previously in MESSAGES.ERROR, now consolidated
    DATA_RETRIEVE_FAILED: 'Lấy dữ liệu thất bại',
    TAG_IN_USE: 'Tag đang được sử dụng',
    TAG_CREATE_FAILED: 'Tạo tag thất bại',
    TAG_UPDATE_FAILED: 'Cập nhật tag thất bại',
    TAG_DELETE_FAILED: 'Xóa tag thất bại',
    PROMOTION_INVALID_DATE: 'Ngày không hợp lệ',
    PROMOTION_INVALID_PRODUCTS: 'Sản phẩm không hợp lệ',
    PROMOTION_INVALID_VALUE: 'Giá trị khuyến mãi không hợp lệ',
    PROMOTION_CREATE_FAILED: 'Tạo khuyến mãi thất bại',
    PROMOTION_UPDATE_FAILED: 'Cập nhật khuyến mãi thất bại',
    PROMOTION_DELETE_FAILED: 'Xóa khuyến mãi thất bại',
    RETURN_REQUEST_INVALID_ORDER_STATUS: 'Trạng thái đơn hàng không hợp lệ để trả hàng',
    RETURN_REQUEST_EXPIRED: 'Đã quá thời hạn trả hàng',
    RETURN_REQUEST_ALREADY_EXISTS: 'Đã có yêu cầu trả hàng cho đơn hàng này',
    RETURN_REQUEST_INVALID_ITEM: 'Sản phẩm không hợp lệ',
    RETURN_REQUEST_INVALID_QUANTITY: 'Số lượng không hợp lệ',
    RETURN_REQUEST_INVALID_STATUS_TRANSITION: 'Không thể chuyển trạng thái',
    RETURN_REQUEST_CANNOT_DELETE: 'Không thể xóa yêu cầu trả hàng',
    RETURN_REQUEST_CREATE_FAILED: 'Tạo yêu cầu trả hàng thất bại',
    RETURN_REQUEST_UPDATE_FAILED: 'Cập nhật yêu cầu trả hàng thất bại'
  },
  // Các mã lỗi
  ERROR_CODES: {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    VALIDATION_ERROR: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404, // General not found
    SERVER_ERROR: 500,
    INVALID_INPUT: 'INVALID_INPUT', // Generic invalid input
    INTERNAL_ERROR: 'INTERNAL_ERROR', // Generic internal error

    PRODUCT: {
      NOT_FOUND: 'PRODUCT_NOT_FOUND',
      CREATE_FAILED: 'PRODUCT_CREATE_FAILED',
      UPDATE_FAILED: 'PRODUCT_UPDATE_FAILED',
      DELETE_FAILED: 'PRODUCT_DELETE_FAILED',
      STATUS_UPDATE_FAILED: 'PRODUCT_STATUS_UPDATE_FAILED',
      HAS_VARIANTS: 'PRODUCT_HAS_VARIANTS',
      FETCH_ALL_FAILED: 'PRODUCT_FETCH_ALL_FAILED',
      FETCH_SINGLE_FAILED: 'PRODUCT_FETCH_SINGLE_FAILED',
      CATEGORY_REQUIRED: 'PRODUCT_CATEGORY_REQUIRED',
      MUST_HAVE_VARIANTS: 'PRODUCT_MUST_HAVE_VARIANTS',
      INVALID_SALE_PRICE: 'PRODUCT_INVALID_SALE_PRICE',
      INVALID_SALE_PERIOD: 'PRODUCT_INVALID_SALE_PERIOD',
      OUT_OF_STOCK: 'PRODUCT_OUT_OF_STOCK',
      HIDDEN: 'PRODUCT_HIDDEN'
    },
    PRODUCT_VARIANT: {
      NOT_FOUND: 'PRODUCT_VARIANT_NOT_FOUND',
      INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
      UPDATE_FAILED: 'PRODUCT_VARIANT_UPDATE_FAILED',
      DELETE_FAILED: 'PRODUCT_VARIANT_DELETE_FAILED',
      CREATION_FAILED: 'PRODUCT_VARIANT_CREATION_FAILED',
    },
    CATEGORY: {
      NOT_FOUND: 'CATEGORY_NOT_FOUND',
      EXISTS: 'CATEGORY_EXISTS',
      PARENT_NOT_FOUND: 'PARENT_CATEGORY_NOT_FOUND',
      CREATE_FAILED: 'CATEGORY_CREATE_FAILED',
      UPDATE_FAILED: 'CATEGORY_UPDATE_FAILED',
      DELETE_FAILED: 'CATEGORY_DELETE_FAILED',
      HAS_CHILDREN: 'CATEGORY_HAS_CHILDREN',
      FETCH_ALL_FAILED: 'CATEGORY_FETCH_ALL_FAILED',
      FETCH_SINGLE_FAILED: 'CATEGORY_FETCH_SINGLE_FAILED',
      FETCH_PARENT_FAILED: 'CATEGORY_FETCH_PARENT_FAILED',
      FETCH_CHILD_FAILED: 'CATEGORY_FETCH_CHILD_FAILED'
    },
    CART: {
      ITEM_NOT_FOUND: 'CART_ITEM_NOT_FOUND',
      SYNC_FAILED: 'CART_SYNC_FAILED',
      ADD_ITEM_FAILED: 'CART_ADD_ITEM_FAILED',
      UPDATE_ITEM_FAILED: 'CART_UPDATE_ITEM_FAILED',
      REMOVE_ITEM_FAILED: 'CART_REMOVE_ITEM_FAILED',
      CLEAR_FAILED: 'CART_CLEAR_FAILED',
      EMPTY: 'CART_EMPTY'
    },
      // Review specific error codes
    REVIEW: {
      NOT_FOUND: 'REVIEW_NOT_FOUND',
      CREATE_FAILED: 'REVIEW_CREATE_FAILED',
      UPDATE_FAILED: 'REVIEW_UPDATE_FAILED',
      DELETE_FAILED: 'REVIEW_DELETE_FAILED',
      APPROVE_FAILED: 'REVIEW_APPROVE_FAILED'
    },
      // Address specific error codes
    ADDRESS: {
      NOT_FOUND: 'ADDRESS_NOT_FOUND',
      CREATE_FAILED: 'ADDRESS_CREATE_FAILED',
      UPDATE_FAILED: 'ADDRESS_UPDATE_FAILED',
      DELETE_FAILED: 'ADDRESS_DELETE_FAILED',
      SET_DEFAULT_FAILED: 'ADDRESS_SET_DEFAULT_FAILED',
      MAX_LIMIT_REACHED: 'ADDRESS_MAX_LIMIT_REACHED',
      PERMISSION_DENIED: 'ADDRESS_PERMISSION_DENIED',
      CANNOT_DELETE_DEFAULT: 'CANNOT_DELETE_DEFAULT_ADDRESS',
      INVALID_REPLACEMENT: 'INVALID_REPLACEMENT_ADDRESS'
    },
      // Voucher specific error codes
    VOUCHER: {
      NOT_FOUND: 'VOUCHER_NOT_FOUND',
      INVALID: 'VOUCHER_INVALID',
      APPLY_FAILED: 'VOUCHER_APPLY_FAILED',
      CREATE_FAILED: 'VOUCHER_CREATE_FAILED',
      UPDATE_FAILED: 'VOUCHER_UPDATE_FAILED',
      DELETE_FAILED: 'VOUCHER_DELETE_FAILED'
    },
      // Banner specific error codes
    BANNER: {
      NOT_FOUND: 'BANNER_NOT_FOUND',
      CREATE_FAILED: 'BANNER_CREATE_FAILED',
      UPDATE_FAILED: 'BANNER_UPDATE_FAILED',
      DELETE_FAILED: 'BANNER_DELETE_FAILED',
      FETCH_ALL_FAILED: 'BANNER_FETCH_ALL_FAILED',
      FETCH_SINGLE_FAILED: 'BANNER_FETCH_SINGLE_FAILED',
      FETCH_ACTIVE_FAILED: 'BANNER_FETCH_ACTIVE_FAILED'
    },
      // Color specific error codes
    COLOR: {
      NOT_FOUND: 'COLOR_NOT_FOUND',
      EXISTS: 'COLOR_EXISTS',
      CREATE_FAILED: 'COLOR_CREATE_FAILED',
      UPDATE_FAILED: 'COLOR_UPDATE_FAILED',
      DELETE_FAILED: 'COLOR_DELETE_FAILED',
      IN_USE: 'COLOR_IN_USE',
      FETCH_ALL_FAILED: 'COLOR_FETCH_ALL_FAILED',
      FETCH_SINGLE_FAILED: 'COLOR_FETCH_SINGLE_FAILED'
    },
      // Size specific error codes
    SIZE: {
      NOT_FOUND: 'SIZE_NOT_FOUND',
      EXISTS: 'SIZE_EXISTS',
      CREATE_FAILED: 'SIZE_CREATE_FAILED',
      UPDATE_FAILED: 'SIZE_UPDATE_FAILED',
      DELETE_FAILED: 'SIZE_DELETE_FAILED',
      IN_USE: 'SIZE_IN_USE',
      FETCH_ALL_FAILED: 'SIZE_FETCH_ALL_FAILED',
      FETCH_SINGLE_FAILED: 'SIZE_FETCH_SINGLE_FAILED'
    },
      // PaymentMethod specific error codes
    PAYMENT_METHOD: {
      NOT_FOUND: 'PAYMENT_METHOD_NOT_FOUND',
      CREATE_FAILED: 'PAYMENT_METHOD_CREATE_FAILED',
      UPDATE_FAILED: 'PAYMENT_METHOD_UPDATE_FAILED',
      DELETE_FAILED: 'PAYMENT_METHOD_DELETE_FAILED'
    },
      // WishList specific error codes
    WISHLIST: {
      NOT_FOUND: 'WISHLIST_NOT_FOUND',
      ITEM_ADD_FAILED: 'WISHLIST_ITEM_ADD_FAILED',
      ITEM_REMOVE_FAILED: 'WISHLIST_ITEM_REMOVE_FAILED',
      CLEAR_FAILED: 'WISHLIST_CLEAR_FAILED'
    },
      // User specific error codes
    USER: {
      NOT_FOUND: 'USER_NOT_FOUND',
      CREATE_FAILED: 'USER_CREATE_FAILED',
      UPDATE_FAILED: 'USER_UPDATE_FAILED',
      DELETE_FAILED: 'USER_DELETE_FAILED',
      AUTH_FAILED: 'USER_AUTH_FAILED', // More specific than general AUTH_FAILED
      STATUS_UPDATE_FAILED: 'USER_STATUS_UPDATE_FAILED',
      EMAIL_EXISTS: 'USER_EMAIL_EXISTS', // Replacing USER_EMAIL_EXISTS
      EMAIL_IMMUTABLE: 'USER_EMAIL_IMMUTABLE', // Cannot change email after creation
      ROLE_UPDATE_FAILED: 'USER_ROLE_UPDATE_FAILED',
      CANNOT_DELETE_SELF: 'USER_CANNOT_DELETE_SELF',
      CANNOT_DELETE_LAST_ADDRESS: 'USER_CANNOT_DELETE_LAST_ADDRESS', // Must have at least one address
      PASSWORD_TOO_SHORT: 'USER_PASSWORD_TOO_SHORT',
      INVALID_CURRENT_PASSWORD: 'USER_INVALID_CURRENT_PASSWORD',
      SAME_PASSWORD: 'USER_SAME_PASSWORD', // New password same as current password
      PROFILE_UPDATE_FAILED: 'USER_PROFILE_UPDATE_FAILED',
      PASSWORD_CHANGE_FAILED: 'USER_PASSWORD_CHANGE_FAILED',
      ADDRESS_ADD_FAILED: 'USER_ADDRESS_ADD_FAILED',
      ADDRESS_UPDATE_FAILED: 'USER_ADDRESS_UPDATE_FAILED',
      ADDRESS_DELETE_FAILED: 'USER_ADDRESS_DELETE_FAILED',
      ADDRESS_SET_DEFAULT_FAILED: 'USER_ADDRESS_SET_DEFAULT_FAILED',
      ADDRESS_NOT_FOUND: 'USER_ADDRESS_NOT_FOUND',
      FETCH_PROFILE_FAILED: 'USER_FETCH_PROFILE_FAILED',
      FETCH_ALL_FAILED: 'USER_FETCH_ALL_FAILED', // Added for consistency
      FETCH_ONE_FAILED: 'USER_FETCH_ONE_FAILED', // Added for consistency
    },

    // Order specific error codes
    ORDER: {
      NOT_FOUND: 'ORDER_NOT_FOUND',
      CREATE_FAILED: 'ORDER_CREATE_FAILED',
      UPDATE_FAILED: 'ORDER_UPDATE_FAILED',
      DELETE_FAILED: 'ORDER_DELETE_FAILED',
      UPDATE_STATUS_FAILED: 'ORDER_UPDATE_STATUS_FAILED'
    },
      // Tag specific error codes
    TAG: {
      NOT_FOUND: 'TAG_NOT_FOUND',
      ALREADY_EXISTS: 'TAG_ALREADY_EXISTS',
      IN_USE: 'TAG_IN_USE',
      CREATE_FAILED: 'TAG_CREATE_FAILED',
      UPDATE_FAILED: 'TAG_UPDATE_FAILED',
      DELETE_FAILED: 'TAG_DELETE_FAILED'
    },
    // Post specific error codes
    POST: {
      NOT_FOUND: 'POST_NOT_FOUND',
      CREATE_FAILED: 'POST_CREATE_FAILED',
      UPDATE_FAILED: 'POST_UPDATE_FAILED',
      DELETE_FAILED: 'POST_DELETE_FAILED',
      PUBLISH_FAILED: 'POST_PUBLISH_FAILED',
      UNPUBLISH_FAILED: 'POST_UNPUBLISH_FAILED'
    },
    // Statistics specific error codes
    STATISTICS: {
      RETRIEVAL_FAILED: 'STATS_RETRIEVAL_FAILED'
    },
    // Promotion specific error codes
    PROMOTION: {
      NOT_FOUND: 'PROMOTION_NOT_FOUND',
      CREATE_FAILED: 'PROMOTION_CREATE_FAILED',
      UPDATE_FAILED: 'PROMOTION_UPDATE_FAILED',
      DELETE_FAILED: 'PROMOTION_DELETE_FAILED',
      INVALID_DATE: 'PROMOTION_INVALID_DATE',
      INVALID_PRODUCTS: 'PROMOTION_INVALID_PRODUCTS',
      INVALID_VALUE: 'PROMOTION_INVALID_VALUE',
      ACTIVATE_FAILED: 'PROMOTION_ACTIVATE_FAILED',
      DEACTIVATE_FAILED: 'PROMOTION_DEACTIVATE_FAILED'
    },
    // ReturnRequest specific error codes
    RETURN_REQUEST: {
      NOT_FOUND: 'RETURN_REQUEST_NOT_FOUND',
      CREATE_FAILED: 'RETURN_REQUEST_CREATE_FAILED',
      UPDATE_FAILED: 'RETURN_REQUEST_UPDATE_FAILED',
      DELETE_FAILED: 'RETURN_REQUEST_DELETE_FAILED',
      INVALID_ORDER_STATUS: 'RETURN_REQUEST_INVALID_ORDER_STATUS',
      EXPIRED: 'RETURN_REQUEST_EXPIRED',
      ALREADY_EXISTS: 'RETURN_REQUEST_ALREADY_EXISTS',
      INVALID_ITEM: 'RETURN_REQUEST_INVALID_ITEM',
      INVALID_QUANTITY: 'RETURN_REQUEST_INVALID_QUANTITY',
      INVALID_STATUS_TRANSITION: 'RETURN_REQUEST_INVALID_STATUS_TRANSITION',
      CANNOT_DELETE: 'RETURN_REQUEST_CANNOT_DELETE',
      APPROVE_FAILED: 'RETURN_REQUEST_APPROVE_FAILED',
      REJECT_FAILED: 'RETURN_REQUEST_REJECT_FAILED',
      COMPLETE_FAILED: 'RETURN_REQUEST_COMPLETE_FAILED'
    },
    // News specific error codes
    NEWS: {
      NOT_FOUND: 'NEWS_NOT_FOUND',
      CREATE_FAILED: 'NEWS_CREATE_FAILED',
      UPDATE_FAILED: 'NEWS_UPDATE_FAILED',
      DELETE_FAILED: 'NEWS_DELETE_FAILED',
      PUBLISH_FAILED: 'NEWS_PUBLISH_FAILED',
      UNPUBLISH_FAILED: 'NEWS_UNPUBLISH_FAILED'
    }
  },

  // Cấu hình phân trang
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },
  
  // General messages (can be used by services)
  generalMessages: {
    INVALID_OPERATION: 'Thao tác không hợp lệ',
    FETCH_SUCCESS: 'Lấy dữ liệu thành công',
    // Add other general messages as needed
  },

  // Pagination defaults (can be used by services)
  paginationDefaults: {
    PAGE: 1,
    LIMIT: 10,
    MAX_LIMIT: 100
  },

  // ProductVariant specific messages (can be used by productVariantService)
  productVariantMessages: {
    VARIANT_EXISTS: 'Biến thể sản phẩm với các thuộc tính (sản phẩm, màu, kích thước) đã tồn tại',
    VARIANT_NOT_FOUND: 'Không tìm thấy biến thể sản phẩm',
    INSUFFICIENT_STOCK: 'Không đủ hàng tồn kho cho biến thể này',
    VARIANT_DELETED_SUCCESSFULLY: 'Biến thể sản phẩm đã được xóa thành công',
    CREATE_SUCCESS: 'Tạo biến thể sản phẩm thành công',
    UPDATE_SUCCESS: 'Cập nhật biến thể sản phẩm thành công',
    FETCH_ALL_SUCCESS: 'Lấy danh sách biến thể sản phẩm thành công',
    FETCH_ONE_SUCCESS: 'Lấy chi tiết biến thể sản phẩm thành công',
    FETCH_BY_PRODUCT_SUCCESS: 'Lấy danh sách biến thể cho sản phẩm thành công',
  },

  // Product specific messages (can be used by productService)
  productMessages: {
    PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm',
    PRODUCT_HAS_VARIANTS: 'Sản phẩm này có các biến thể. Không thể xóa.',
    CREATE_SUCCESS: 'Tạo sản phẩm thành công',
    UPDATE_SUCCESS: 'Cập nhật sản phẩm thành công',
    DELETE_SUCCESS: 'Xóa sản phẩm thành công',
    FETCH_ALL_SUCCESS: 'Lấy danh sách sản phẩm thành công',
    FETCH_ONE_SUCCESS: 'Lấy chi tiết sản phẩm thành công',
  },

  // Color specific messages (can be used by colorService)
  colorMessages: {
    COLOR_NOT_FOUND: 'Không tìm thấy màu sắc',
    COLOR_EXISTS: 'Màu sắc này đã tồn tại',
    COLOR_IN_USE: 'Màu sắc này đang được sử dụng bởi một hoặc nhiều biến thể sản phẩm. Không thể xóa.',
    CREATE_SUCCESS: 'Tạo màu sắc thành công',
    UPDATE_SUCCESS: 'Cập nhật màu sắc thành công',
    DELETE_SUCCESS: 'Xóa màu sắc thành công',
    FETCH_ALL_SUCCESS: 'Lấy danh sách màu sắc thành công',
    FETCH_ONE_SUCCESS: 'Lấy chi tiết màu sắc thành công',
  },

  // Size specific messages (can be used by sizeService)
  sizeMessages: {
    SIZE_NOT_FOUND: 'Không tìm thấy kích thước',
    SIZE_EXISTS: 'Kích thước này đã tồn tại',
    SIZE_IN_USE: 'Kích thước này đang được sử dụng bởi một hoặc nhiều biến thể sản phẩm. Không thể xóa.',
    CREATE_SUCCESS: 'Tạo kích thước thành công',
    UPDATE_SUCCESS: 'Cập nhật kích thước thành công',
    DELETE_SUCCESS: 'Xóa kích thước thành công',
    FETCH_ALL_SUCCESS: 'Lấy danh sách kích thước thành công',
    FETCH_ONE_SUCCESS: 'Lấy chi tiết kích thước thành công',
  },

  // Category specific messages (can be used by categoryService)
  categoryMessages: {
    CATEGORY_NOT_FOUND: 'Không tìm thấy danh mục',
    CATEGORY_EXISTS: 'Danh mục này đã tồn tại',
    PARENT_CATEGORY_NOT_FOUND: 'Không tìm thấy danh mục cha',
    CATEGORY_HAS_CHILDREN: 'Danh mục này có danh mục con. Không thể xóa.',
    CATEGORY_HAS_PRODUCTS: 'Danh mục này có sản phẩm. Không thể xóa.',
    CREATE_SUCCESS: 'Tạo danh mục thành công',
    UPDATE_SUCCESS: 'Cập nhật danh mục thành công',
    DELETE_SUCCESS: 'Xóa danh mục thành công',
    FETCH_ALL_SUCCESS: 'Lấy danh sách danh mục thành công',
    FETCH_ONE_SUCCESS: 'Lấy chi tiết danh mục thành công',
    FETCH_PARENT_SUCCESS: 'Lấy danh mục cha thành công',
    FETCH_CHILD_SUCCESS: 'Lấy danh mục con thành công',
  },

  // Banner specific messages (can be used by bannerService)
  bannerMessages: {
    BANNER_NOT_FOUND: 'Không tìm thấy banner',
    CREATE_SUCCESS: 'Tạo banner thành công',
    UPDATE_SUCCESS: 'Cập nhật banner thành công',
    DELETE_SUCCESS: 'Xóa banner thành công',
    FETCH_ALL_SUCCESS: 'Lấy danh sách banner thành công',
    FETCH_ONE_SUCCESS: 'Lấy chi tiết banner thành công',
    FETCH_ACTIVE_SUCCESS: 'Lấy danh sách banner đang hoạt động thành công',
  },

  // Post specific messages (can be used by postService)
  postMessages: {
    POST_NOT_FOUND: 'Không tìm thấy bài viết',
    CREATE_SUCCESS: 'Tạo bài viết thành công',
    UPDATE_SUCCESS: 'Cập nhật bài viết thành công',
    DELETE_SUCCESS: 'Xóa bài viết thành công',
    FETCH_ALL_SUCCESS: 'Lấy danh sách bài viết thành công',
    FETCH_ONE_SUCCESS: 'Lấy chi tiết bài viết thành công',
  },

  // User specific messages (can be used by userService)
  userMessages: {
    USER_NOT_FOUND: 'Không tìm thấy người dùng.',
    USER_ALREADY_EXISTS: 'Người dùng với email này đã tồn tại.',
    CREATE_SUCCESS: 'Tạo người dùng thành công.',
    UPDATE_SUCCESS: 'Cập nhật thông tin người dùng thành công.',
    DELETE_SUCCESS: 'Xóa người dùng thành công.',
    FETCH_ALL_SUCCESS: 'Lấy danh sách người dùng thành công.',
    FETCH_ONE_SUCCESS: 'Lấy thông tin người dùng thành công.',
    PROFILE_UPDATE_SUCCESS: 'Cập nhật hồ sơ thành công.',
    PASSWORD_CHANGE_SUCCESS: 'Thay đổi mật khẩu thành công.',
    INVALID_CURRENT_PASSWORD: 'Mật khẩu hiện tại không chính xác.',
    PASSWORD_TOO_SHORT: 'Mật khẩu mới phải có ít nhất 8 ký tự.',
    EMAIL_IN_USE: 'Địa chỉ email này đã được sử dụng bởi tài khoản khác.',
    CANNOT_DELETE_SELF: 'Bạn không thể tự xóa tài khoản của mình.',
    ROLE_UPDATE_SUCCESS: 'Cập nhật vai trò người dùng thành công.',
    STATUS_UPDATE_SUCCESS: 'Cập nhật trạng thái người dùng thành công.', // For activate/deactivate
    FETCH_PROFILE_SUCCESS: 'Lấy thông tin hồ sơ thành công.',
    ADDRESS_ADD_SUCCESS: 'Thêm địa chỉ thành công.',
    ADDRESS_UPDATE_SUCCESS: 'Cập nhật địa chỉ thành công.',
    ADDRESS_DELETE_SUCCESS: 'Xóa địa chỉ thành công.',
    ADDRESS_SET_DEFAULT_SUCCESS: 'Đặt địa chỉ mặc định thành công.',
    ADDRESS_NOT_FOUND: 'Không tìm thấy địa chỉ.',
  },

  // Auth specific messages (can be used by authService/controller)
  authMessages: {
    LOGIN_SUCCESS: 'Đăng nhập thành công',
    LOGOUT_SUCCESS: 'Đăng xuất thành công',
    REGISTER_SUCCESS: 'Đăng ký thành công',
    REFRESH_TOKEN_SUCCESS: 'Làm mới token thành công',
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
    ACCOUNT_NOT_ACTIVE: 'Tài khoản chưa được kích hoạt hoặc đã bị khóa',
    EMAIL_NOT_VERIFIED: 'Vui lòng xác thực email của bạn',
    TOKEN_EXPIRED: 'Token đã hết hạn',
    INVALID_TOKEN: 'Token không hợp lệ',
    USER_ALREADY_EXISTS: 'Người dùng với email này đã tồn tại',
  },

  // Loại thông báo
  NOTIFICATION_TYPES: {
    ORDER_STATUS: 'order_status',
    PROMOTION: 'promotion',
    SYSTEM: 'system'
  },
  voucherMessages: {
    VOUCHER_NOT_FOUND: 'Không tìm thấy voucher.',
    VOUCHER_INVALID_CODE: 'Mã giảm giá không hợp lệ.',
    VOUCHER_EXPIRED: 'Phiếu giảm giá đã hết hạn.',
    VOUCHER_CRITERIA_NOT_MET: 'Đơn hàng không đủ điều kiện áp dụng phiếu giảm giá này.',
    VOUCHER_ALREADY_USED: 'Phiếu giảm giá đã được sử dụng.',
    VOUCHER_NOT_YET_ACTIVE: 'Phiếu giảm giá chưa đến ngày sử dụng.',
    VOUCHER_APPLIED: 'Áp dụng voucher thành công.',
    VOUCHER_INACTIVE: 'Voucher không còn hoạt động.',
    VOUCHER_ONE_PER_USER_SYSTEM: 'Mỗi tài khoản chỉ được sử dụng 1 voucher duy nhất trong toàn bộ hệ thống.',
    VOUCHER_USER_ALREADY_USED_ANOTHER: 'Bạn đã sử dụng voucher khác trước đó.',
  },

  addressMessages: {
    ADDRESS_CREATED_SUCCESSFULLY: 'Địa chỉ đã được tạo thành công.',
    ADDRESS_NOT_FOUND: 'Không tìm thấy địa chỉ.',
    ADDRESS_FETCHED_SUCCESSFULLY: 'Lấy thông tin địa chỉ thành công.',
    ALL_ADDRESSES_FETCHED_SUCCESSFULLY: 'Lấy tất cả địa chỉ thành công.', // For a user
    ADDRESS_UPDATED_SUCCESSFULLY: 'Cập nhật địa chỉ thành công.',
    ADDRESS_DELETED_SUCCESSFULLY: 'Xóa địa chỉ thành công.',
    ADDRESS_SET_AS_DEFAULT_SUCCESSFULLY: 'Đặt làm địa chỉ mặc định thành công.',
    MAX_ADDRESSES_REACHED: 'Đã đạt số lượng địa chỉ tối đa cho phép (5 địa chỉ).',
    ADDRESS_BELONGS_TO_ANOTHER_USER: 'Địa chỉ này thuộc về người dùng khác.',
    CANNOT_DELETE_DEFAULT_WITHOUT_REPLACEMENT: 'Không thể xóa địa chỉ mặc định. Vui lòng chọn địa chỉ thay thế trước khi xóa.',
    INVALID_REPLACEMENT_ADDRESS: 'Địa chỉ thay thế không hợp lệ hoặc không thuộc về bạn.',
    ADDRESS_UPDATE_FAILED: 'Cập nhật địa chỉ thất bại.',
    ADDRESS_VALIDATION_FAILED: 'Dữ liệu địa chỉ không hợp lệ.',
    CITY_INVALID: 'Tỉnh/thành phố không hợp lệ.',
    DISTRICT_INVALID: 'Quận/huyện không hợp lệ.',
    WARD_INVALID: 'Phường/xã không hợp lệ.',
    PHONE_INVALID: 'Số điện thoại không hợp lệ.',
    FULL_NAME_REQUIRED: 'Họ tên người nhận là bắt buộc.',
    ADDRESS_LINE_REQUIRED: 'Địa chỉ chi tiết là bắt buộc.'
  },

  // Đơn hàng
  orderMessages: {
    ORDER_CREATED_SUCCESSFULLY: 'Đơn hàng đã được tạo thành công.',
    ORDER_CREATION_FAILED: 'Không thể tạo đơn hàng.',
    ORDERS_FETCHED_SUCCESSFULLY: 'Lấy danh sách đơn hàng thành công.',
    ERROR_FETCHING_ORDERS: 'Lỗi khi lấy danh sách đơn hàng.',
    ORDER_DETAIL_FETCHED_SUCCESSFULLY: 'Lấy chi tiết đơn hàng thành công.',
    ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng.',
    ORDER_NOT_FOUND_OR_NOT_OWNED: 'Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.',
    ERROR_FETCHING_ORDER_DETAIL: 'Lỗi khi lấy chi tiết đơn hàng.',
    ORDER_STATUS_UPDATED_SUCCESSFULLY: 'Cập nhật trạng thái đơn hàng thành công.',
    ORDER_STATUS_UPDATE_FAILED: 'Không thể cập nhật trạng thái đơn hàng.',
    ORDER_CANCELLED_SUCCESSFULLY: 'Đơn hàng đã được hủy thành công.',
    ORDER_CANCELLATION_FAILED: 'Không thể hủy đơn hàng.',
    ORDER_CANCELLATION_NOT_ALLOWED: 'Không thể hủy đơn hàng ở trạng thái hiện tại.',
    INVALID_ORDER_STATUS: 'Trạng thái đơn hàng không hợp lệ.',
    ORDER_ITEMS_EMPTY: 'Đơn hàng phải có ít nhất một sản phẩm.',
    ORDER_ADDRESS_REQUIRED: 'Địa chỉ giao hàng là bắt buộc.',
    ORDER_PAYMENT_METHOD_REQUIRED: 'Phương thức thanh toán là bắt buộc.',
    ADDRESS_NOT_FOUND_OR_NOT_OWNED: 'Địa chỉ không tồn tại hoặc không thuộc về bạn.',
    PRODUCT_VARIANT_NOT_FOUND: 'Một hoặc nhiều sản phẩm trong đơn hàng không tồn tại.',
    INSUFFICIENT_STOCK: 'Không đủ hàng tồn kho cho một hoặc nhiều sản phẩm.',
    ORDER_STATUS_REQUIRED: 'Trạng thái đơn hàng là bắt buộc để cập nhật.',
  }
};
