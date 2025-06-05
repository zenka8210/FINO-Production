const Joi = require('joi');

/**
 * Tập hợp các schema validation cho toàn bộ ứng dụng
 */

// Authentication schemas
const authRegisterSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  full_name: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^[0-9]{10,11}$/).optional(),
  address: Joi.string().max(200).optional()
});

const authLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const authRefreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const authForgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const authResetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

const authResendVerificationSchema = Joi.object({
  email: Joi.string().email().required()
});

/**
 * Tập hợp các schema validation cho toàn bộ ứng dụng
 */

// User schemas
const userRegisterSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().pattern(/^[0-9]{10,11}$/).optional(),
  role: Joi.string().valid('customer', 'admin').default('customer')
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const userUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^[0-9]{10,11}$/).optional(),
  avatar: Joi.string().uri().optional()
});

// Product schemas
const productCreateSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(2000).optional(),
  category: Joi.string().optional(),
  images: Joi.array().items(Joi.string()).optional(),
  variants: Joi.array().items(Joi.object({
    color: Joi.string().required(),
    size: Joi.string().required(),
    price: Joi.number().min(0).required(),
    stock: Joi.number().integer().min(0).required(),
    weight: Joi.number().min(0).optional()
  })).min(1).required(),
  brand: Joi.string().optional(),
  isFeatured: Joi.boolean().default(false),
  status: Joi.string().valid('active', 'inactive').default('active')
});

const productUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  description: Joi.string().max(2000).optional(),
  category: Joi.string().optional(),
  images: Joi.array().items(Joi.string()).optional(),
  variants: Joi.array().items(Joi.object({
    color: Joi.string(),
    size: Joi.string(),
    price: Joi.number().min(0),
    stock: Joi.number().integer().min(0),
    weight: Joi.number().min(0)
  })).optional(),
  brand: Joi.string().optional(),
  isFeatured: Joi.boolean().optional(),
  status: Joi.string().valid('active', 'inactive').optional()
});

const productStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive').required()
});

const productSearchSchema = Joi.object({
  q: Joi.string().min(1).optional(),
  search: Joi.string().min(1).optional(),
  category: Joi.string().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('name', 'createdAt', 'price').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
}).or('q', 'search');

// Order schemas (đã được định nghĩa trong orderRoutes.js)
const createOrderSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    product: Joi.string().required(),
    variant: Joi.object({
      color: Joi.string(),
      size: Joi.string(),
      weight: Joi.number()
    }),
    name: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
    price: Joi.number().min(0).required(),
    images: Joi.string()
  })).min(1).required(),
  shippingAddress: Joi.object({
    fullName: Joi.string().required(),
    phone: Joi.string().required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    district: Joi.string(),
    ward: Joi.string()
  }).required(),
  payment: Joi.string(),
  paymentMethod: Joi.string().valid('COD', 'CreditCard', 'BankTransfer', 'Momo', 'ZaloPay', 'VNPay').required(),
  voucherCode: Joi.string(),
  shippingFee: Joi.number().min(0),
  note: Joi.string().allow('')
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
  paymentStatus: Joi.string().valid('paid', 'unpaid')
});

// Review schemas
const reviewCreateSchema = Joi.object({
  product: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).optional(),
  images: Joi.array().items(Joi.string().uri()).optional()
});

// Voucher schemas
const voucherCreateSchema = Joi.object({
  code: Joi.string().min(3).max(20).required(),
  type: Joi.string().valid('percentage', 'fixed').required(),
  value: Joi.number().min(0).required(),
  maxDiscount: Joi.number().min(0).optional(),
  minOrderValue: Joi.number().min(0).optional(),
  quantity: Joi.number().integer().min(0).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  description: Joi.string().max(500).optional(),
  status: Joi.string().valid('active', 'inactive').default('active')
});

// Category schemas
const categoryCreateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  image: Joi.string().uri().optional(),
  status: Joi.string().valid('active', 'inactive').default('active')
});

// Cart schemas
const cartAddItemSchema = Joi.object({
  productId: Joi.string().required(),
  variant: Joi.object({
    size: Joi.string(),
    color: Joi.string(),
    material: Joi.string()
  }).required(),
  quantity: Joi.number().integer().min(1).required()
});

const cartUpdateItemSchema = Joi.object({
  variant: Joi.object({
    size: Joi.string(),
    color: Joi.string(),
    material: Joi.string()
  }).required(),
  quantity: Joi.number().integer().min(1).required()
});

const cartRemoveItemSchema = Joi.object({
  variant: Joi.object({
    size: Joi.string(),
    color: Joi.string(),
    material: Joi.string()
  }).required()
});

// Address schemas
const addressCreateSchema = Joi.object({
  fullName: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^[0-9]{10,11}$/).required(),
  address: Joi.string().min(5).max(200).required(),
  city: Joi.string().min(2).max(50).required(),
  district: Joi.string().min(2).max(50).optional(),
  ward: Joi.string().min(2).max(50).optional(),
  postalCode: Joi.string().optional(),
  isDefault: Joi.boolean().default(false),
  type: Joi.string().valid('home', 'office', 'other').default('home')
});

const addressUpdateSchema = Joi.object({
  fullName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^[0-9]{10,11}$/).optional(),
  address: Joi.string().min(5).max(200).optional(),
  city: Joi.string().min(2).max(50).optional(),
  district: Joi.string().min(2).max(50).optional(),
  ward: Joi.string().min(2).max(50).optional(),
  postalCode: Joi.string().optional(),
  isDefault: Joi.boolean().optional(),
  type: Joi.string().valid('home', 'office', 'other').optional()
});

// News schemas
const newsCreateSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  slug: Joi.string().min(3).max(200).optional(),
  summary: Joi.string().min(10).max(500).optional(),
  content: Joi.string().min(20).required(),
  thumbnail: Joi.string().uri().optional(),
  category: Joi.string().min(2).max(50).required(),
  tags: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
  isFeatured: Joi.boolean().default(false),
  metaTitle: Joi.string().max(60).optional(),
  metaDescription: Joi.string().max(160).optional()
});

const newsUpdateSchema = Joi.object({
  title: Joi.string().min(5).max(200).optional(),
  slug: Joi.string().min(3).max(200).optional(),
  summary: Joi.string().min(10).max(500).optional(),
  content: Joi.string().min(20).optional(),
  thumbnail: Joi.string().uri().optional(),
  category: Joi.string().min(2).max(50).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  isFeatured: Joi.boolean().optional(),
  metaTitle: Joi.string().max(60).optional(),
  metaDescription: Joi.string().max(160).optional()
});

// Banner schemas
const bannerCreateSchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  imageUrl: Joi.string().uri().required(),
  linkUrl: Joi.string().uri().optional(),
  position: Joi.string().valid('header', 'footer', 'sidebar', 'main', 'popup', 'category').required(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  order: Joi.number().integer().min(0).default(0),
  startDate: Joi.date().optional(),
  endDate: Joi.date().greater(Joi.ref('startDate')).optional(),
  isClickable: Joi.boolean().default(true),
  openInNewTab: Joi.boolean().default(false)
});

const bannerUpdateSchema = Joi.object({
  title: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional(),
  imageUrl: Joi.string().uri().optional(),
  linkUrl: Joi.string().uri().optional(),
  position: Joi.string().valid('header', 'footer', 'sidebar', 'main', 'popup', 'category').optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  order: Joi.number().integer().min(0).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().greater(Joi.ref('startDate')).optional(),
  isClickable: Joi.boolean().optional(),
  openInNewTab: Joi.boolean().optional()
});

const bannerStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive').required()
});

const bannerOrderUpdateSchema = Joi.object({
  order: Joi.number().integer().min(0).required()
});

const bannerReorderSchema = Joi.object({
  bannerOrders: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      order: Joi.number().integer().min(0).required()
    })
  ).min(1).required()
});

// Payment schemas
const paymentProcessSchema = Joi.object({
  orderId: Joi.string().required(),
  paymentMethod: Joi.string().valid('COD', 'CreditCard', 'BankTransfer', 'Momo', 'ZaloPay', 'VNPay').required(),
  paymentDetails: Joi.object({
    bankName: Joi.string().optional(),
    accountNumber: Joi.string().optional(),
    accountHolder: Joi.string().optional(),
    returnUrl: Joi.string().uri().optional(),
    cancelUrl: Joi.string().uri().optional()
  }).optional()
});

const paymentStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('Pending', 'Completed', 'Failed').required(),
  gatewayResponse: Joi.object().optional()
});

// Tag schemas
const tagCreateSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  description: Joi.string().max(200).optional()
});

const tagUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(50).optional(),
  description: Joi.string().max(200).optional()
});

const tagBulkCreateSchema = Joi.object({
  tagNames: Joi.array().items(Joi.string().min(1).max(50)).min(1).required()
});

// Promotion schemas
const promotionCreateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  type: Joi.string().valid('percent', 'fixed', 'bundle').required(),
  value: Joi.number().positive().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  products: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional(),
  active: Joi.boolean().default(true),
  minOrderValue: Joi.number().positive().optional(),
  maxDiscount: Joi.number().positive().optional(),
  usageLimit: Joi.number().integer().positive().optional()
});

const promotionUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional(),
  type: Joi.string().valid('percent', 'fixed', 'bundle').optional(),
  value: Joi.number().positive().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  products: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional(),
  active: Joi.boolean().optional(),
  minOrderValue: Joi.number().positive().optional(),
  maxDiscount: Joi.number().positive().optional(),
  usageLimit: Joi.number().integer().positive().optional()
});

const promotionStatusSchema = Joi.object({
  active: Joi.boolean().required()
});

const calculateDiscountSchema = Joi.object({
  originalPrice: Joi.number().positive().required(),
  promotionId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
});

// Return Request schemas
const returnRequestCreateSchema = Joi.object({
  orderId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
      variant: Joi.string().optional(),
      quantity: Joi.number().integer().positive().required(),
      reason: Joi.string().min(5).max(500).required()
    })
  ).min(1).required(),
  reasonGeneral: Joi.string().max(1000).optional(),
  restockingFee: Joi.number().min(0).optional()
});

const returnRequestUpdateSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled').optional(),
  refundStatus: Joi.string().valid('pending', 'processed', 'failed').optional(),
  adminNotes: Joi.string().max(1000).optional()
});

// Common query schemas
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

module.exports = {
  // Grouped schemas for easier access
  authSchemas: {
    register: authRegisterSchema,
    login: authLoginSchema,
    refreshToken: authRefreshTokenSchema,
    forgotPassword: authForgotPasswordSchema,
    resetPassword: authResetPasswordSchema,
    resendVerification: authResendVerificationSchema
  },
  
  userSchemas: {
    register: userRegisterSchema,
    login: userLoginSchema,
    update: userUpdateSchema
  },
  
  productSchemas: {
    create: productCreateSchema,
    update: productUpdateSchema,
    statusUpdate: productStatusUpdateSchema,
    search: productSearchSchema
  },
  
  orderSchemas: {
    create: createOrderSchema,
    updateStatus: updateOrderStatusSchema
  },
  
  reviewSchemas: {
    create: reviewCreateSchema
  },
  
  voucherSchemas: {
    create: voucherCreateSchema
  },
    categorySchemas: {
    create: categoryCreateSchema
  },
    cartSchemas: {
    addItem: cartAddItemSchema,
    updateItem: cartUpdateItemSchema,
    removeItem: cartRemoveItemSchema
  },
    addressSchemas: {
    create: addressCreateSchema,
    update: addressUpdateSchema
  },
    newsSchemas: {
    create: newsCreateSchema,
    update: newsUpdateSchema
  },
  bannerSchemas: {
    createBanner: bannerCreateSchema,
    updateBanner: bannerUpdateSchema,
    updateBannerStatus: bannerStatusUpdateSchema,
    updateBannerOrder: bannerOrderUpdateSchema,
    reorderBanners: bannerReorderSchema
  },
  paymentSchemas: {
    processPayment: paymentProcessSchema,
    updatePaymentStatus: paymentStatusUpdateSchema
  },
  tagSchemas: {
    createTag: tagCreateSchema,
    updateTag: tagUpdateSchema,
    createBulkTags: tagBulkCreateSchema
  },
  promotionSchemas: {
    createPromotion: promotionCreateSchema,
    updatePromotion: promotionUpdateSchema,
    updatePromotionStatus: promotionStatusSchema,
    calculateDiscount: calculateDiscountSchema
  },

  returnRequestSchemas: {
    createReturnRequest: returnRequestCreateSchema,
    updateReturnRequest: returnRequestUpdateSchema
  },
  
  commonSchemas: {
    pagination: paginationSchema
  },

  // Legacy individual exports for backward compatibility
  authRegisterSchema,
  authLoginSchema,
  authRefreshTokenSchema,
  authForgotPasswordSchema,
  authResetPasswordSchema,
  authResendVerificationSchema,

  // User
  userRegisterSchema,
  userLoginSchema,
  userUpdateSchema,
  
  // Product
  productCreateSchema,
  productUpdateSchema,
  productStatusUpdateSchema,
  productSearchSchema,
  
  // Order
  createOrderSchema,
  updateOrderStatusSchema,
  
  // Review
  reviewCreateSchema,
  
  // Voucher
  voucherCreateSchema,
    // Category
  categoryCreateSchema,
    // Promotion
  promotionCreateSchema,
  promotionUpdateSchema,
  promotionStatusSchema,
  calculateDiscountSchema,
  
  // Return Request
  returnRequestCreateSchema,
  returnRequestUpdateSchema,
  
  // Common
  paginationSchema
};
