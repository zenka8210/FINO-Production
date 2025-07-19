// ============= BASE TYPES =============
export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

// ============= 1. USER SCHEMA =============
export interface User extends BaseEntity {
  email: string; // required, unique, lowercase
  password?: string; // required, minlength: 8 (không trả về từ API)
  name?: string; // maxlength: 60
  phone?: string; // maxlength: 11
  address?: string;
  role: 'customer' | 'admin'; // default: 'customer'
  isActive: boolean; // default: true
}

// ============= 2. ADDRESS SCHEMA =============
export interface Address extends BaseEntity {
  user: string; // ObjectId ref User, required
  fullName: string; // required
  phone: string; // required
  addressLine: string; // required
  city: string; // required
  district: string; // required
  ward: string; // required
  isDefault: boolean; // default: false
}

// ============= 3. CATEGORY SCHEMA =============
export interface Category extends BaseEntity {
  name: string; // required, unique, trim, minlength: 2, maxlength: 100
  description?: string; // maxlength: 500
  parent?: string; // ObjectId ref Category, default: null
  isActive: boolean; // default: true
}

// ============= 4. COLOR SCHEMA =============
export interface Color extends BaseEntity {
  name: string; // required, unique, trim, maxlength: 10
  hexCode?: string; // hex color code for display
  isActive: boolean; // default: true
}

// ============= 5. SIZE SCHEMA =============
export interface Size extends BaseEntity {
  name: string; // required, unique, trim, maxlength: 20
  isActive: boolean; // default: true
}

// ============= 6. PRODUCT SCHEMA =============
export interface Product extends BaseEntity {
  name: string; // required, trim
  price: number; // required
  description?: string;
  category: string; // ObjectId ref Category, required
  images: string[]; // array of image URLs
  isActive: boolean; // default: true
  salePrice?: number; // must be less than price
  saleStartDate?: string; // Date
  saleEndDate?: string; // Date
  // Virtual fields (computed)
  currentPrice?: number;
  isOnSale?: boolean;
  variants?: ProductVariant[];
}

// ============= 7. PRODUCT VARIANT SCHEMA =============
export interface ProductVariant extends BaseEntity {
  product: string; // ObjectId ref Product, required
  color: string; // ObjectId ref Color, required
  size: string; // ObjectId ref Size, required
  price: number; // required
  stock: number; // required, min: 0
  sku?: string; // unique
  images: string[];
  isActive: boolean; // default: true
  // Virtual fields
  isInStock?: boolean;
}

// ============= 8. PAYMENT METHOD SCHEMA =============
export interface PaymentMethod extends BaseEntity {
  method: 'COD' | 'VNPay'; // required
  isActive: boolean; // default: true
}

// ============= 9. VOUCHER SCHEMA =============
export interface Voucher extends BaseEntity {
  code: string; // required, unique
  discountPercent: number; // required, min: 0, max: 100
  maximumOrderValue?: number; // default: null - no limit
  minimumOrderValue: number; // default: 0
  maximumDiscountAmount: number; // default: 200000
  startDate: string; // required
  endDate: string; // required
  isActive: boolean; // default: true
  usageLimit: number; // default: 1
  isOneTimePerUser: boolean; // default: true
}

// ============= 10. CART ITEM SCHEMA (embedded in Cart) =============
export interface CartItem {
  productVariant: string; // ObjectId ref ProductVariant, required
  quantity: number; // required, min: 1
  price: number; // required - price at time of adding to cart
  totalPrice: number; // required - quantity * price
}

// ============= 11. CART SCHEMA =============
export interface Cart extends BaseEntity {
  user: string; // ObjectId ref User, required
  type: 'cart' | 'order'; // default: 'cart', required
  orderCode?: string; // unique, sparse - only for orders
  items: CartItem[];
  address?: string; // ObjectId ref Address, default: null
  total: number; // default: 0 - total before discount and shipping
  voucher?: string; // ObjectId ref Voucher, default: null
  discountAmount: number; // default: 0
  shippingFee: number; // default: 0
  finalTotal: number; // default: 0 - total - discountAmount + shippingFee
  status: 'cart' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'; // default: 'cart'
  paymentMethod?: string; // ObjectId ref PaymentMethod
  paymentStatus?: 'unpaid' | 'paid' | 'refunded'; // default: 'unpaid'
  cartUpdatedAt?: string; // Date - last cart update
  orderPlacedAt?: string; // Date - when cart became order
}

// ============= 12. ORDER DETAILS SCHEMA (embedded in Order) =============
export interface OrderDetail {
  order?: string; // ObjectId ref Order
  productVariant: string; // ObjectId ref ProductVariant, required
  quantity: number; // required
  price: number; // required
  totalPrice: number; // required
}

// ============= 13. ORDER SCHEMA =============
export interface Order extends BaseEntity {
  orderCode: string; // unique, required, indexed
  user?: string; // ObjectId ref User
  items: OrderDetail[];
  address: string; // ObjectId ref Address, required
  total?: number; // total before voucher and shipping
  voucher?: string; // ObjectId ref Voucher, default: null
  discountAmount: number; // default: 0
  shippingFee: number; // required
  finalTotal?: number; // total - discountAmount + shippingFee
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'; // default: 'pending'
  paymentMethod: string; // ObjectId ref PaymentMethod, required
  paymentStatus: 'unpaid' | 'paid'; // default: 'unpaid'
}

// ============= 14. WISHLIST ITEM SCHEMA (embedded in WishList) =============
export interface WishListItem {
  product: string; // ObjectId ref Product, required
  variant?: string; // ObjectId ref ProductVariant, default: null
}

// ============= 15. WISHLIST SCHEMA =============
export interface WishList extends BaseEntity {
  user: string; // ObjectId ref User, required, unique
  items: WishListItem[];
}

// ============= 15.1. WISHLIST STATISTICS =============
export interface WishlistStatistics {
  totalWishListItems: number;
  totalUsers: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    totalUsers: number;
  }>;
}

// ============= 16. REVIEW SCHEMA =============
export interface Review extends BaseEntity {
  product: string; // ObjectId ref Product, required
  user: string; // ObjectId ref User, required
  order: string; // ObjectId ref Order, required
  rating: number; // required, min: 1, max: 5
  comment: string; // required
}

// ============= 17. POST SCHEMA =============
export interface Post extends BaseEntity {
  author: string; // ObjectId ref User, required
  title: string; // required, trim
  content: string; // required
  image: string; // required - URL of image
  describe: string; // required - short description
  isPublished: boolean; // default: true
}

// ============= 18. BANNER SCHEMA =============
export interface Banner extends BaseEntity {
  image: string; // required
  title?: string;
  link: string; // required - validated patterns for product/category/external links
  startDate: string; // required, default: Date.now
  endDate: string; // required - must be after startDate
}

// ============= API RESPONSE TYPES =============
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    current: number;
    total: number;
    limit: number;
    totalPages: number;
  };
}

// API Error class (re-export from api.ts)
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ============= AUTH TYPES =============
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

// ============= FORM & REQUEST TYPES =============
export interface CreateProductRequest {
  name: string;
  price: number;
  description?: string;
  category: string;
  images: string[];
  salePrice?: number;
  saleStartDate?: string;
  saleEndDate?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  _id: string;
}

export interface CreateVariantRequest {
  product: string;
  color: string;
  size: string;
  price: number;
  stock: number;
  sku?: string;
  images: string[];
}

export interface AddToCartRequest {
  productVariant: string;
  quantity: number;
}

export interface CreateOrderRequest {
  items: Array<{
    productVariant: string;
    quantity: number;
  }>;
  address: string;
  paymentMethod: string;
  voucher?: string;
}

export interface CreateAddressRequest {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  district: string;
  ward: string;
  isDefault?: boolean;
}

export interface CreateReviewRequest {
  product: string;
  order: string;
  rating: number;
  comment: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  image: string;
  describe: string;
  isPublished?: boolean;
}

export interface CreateBannerRequest {
  image: string;
  title?: string;
  link: string;
  startDate: string;
  endDate: string;
}

export interface CreateVoucherRequest {
  code: string;
  discountPercent: number;
  maximumOrderValue?: number;
  minimumOrderValue?: number;
  maximumDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  isOneTimePerUser?: boolean;
}

// ============= FILTER TYPES =============
export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: 'name' | 'price' | 'createdAt';
  order?: 'asc' | 'desc';
  isOnSale?: boolean;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: Order['status'];
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CategoryFilters {
  page?: number;
  limit?: number;
  parent?: string;
  isActive?: boolean;
  search?: string;
  sort?: 'name' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface ReviewFilters {
  page?: number;
  limit?: number;
  productId?: string;
  userId?: string;
  rating?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

// ============= CONTEXT TYPES =============
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  clearError?: () => void;
}

export interface CartContextType {
  cart: CartWithRefs | null;
  isLoading: boolean;
  error?: string | null;
  addToCart: (productVariantId: string, quantity: number) => Promise<void>;
  updateCartItem: (productVariantId: string, quantity: number) => Promise<void>;
  removeFromCart: (productVariantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  clearError?: () => void;
}

export interface ProductContextType {
  products: ProductWithCategory[];
  featuredProducts: ProductWithCategory[];
  filters: ProductFilters;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  categories: Category[];
  colors: Color[];
  sizes: Size[];
  
  // Basic product operations
  setFilters: (filters: Partial<ProductFilters>) => void;
  clearFilters: () => void;
  searchProducts: (query: string) => void;
  loadProducts: () => Promise<void>;
  loadFeaturedProducts: () => Promise<void>;
  getProductById: (id: string) => Promise<ProductWithCategory | null>;
  
  // Advanced product operations
  getAvailableProducts: (includeVariants?: boolean) => Promise<void>;
  getPublicDisplayProducts: () => Promise<ProductWithCategory[]>;
  getProductVariants: (productId: string) => Promise<any[]>;
  getVariantById: (variantId: string) => Promise<any>;
  checkProductAvailability: (productId: string) => Promise<{ isAvailable: boolean; variants: any[] }>;
  checkVariantStock: (variantId: string, quantity: number) => Promise<{ hasEnoughStock: boolean; availableStock: number }>;
  validateCartItems: (items: Array<{ variantId: string; quantity: number }>) => Promise<{ isValid: boolean; errors: any[] }>;
  getProductsByCategory: (categoryId: string, filters?: any) => Promise<void>;
  getSaleProducts: (filters?: any) => Promise<void>;
  
  // Admin operations
  createProduct: (productData: any) => Promise<void>;
  updateProduct: (productData: any) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  createVariant: (variantData: any) => Promise<void>;
  updateVariant: (variantId: string, variantData: any) => Promise<void>;
  deleteVariant: (variantId: string) => Promise<void>;
  getOutOfStockProducts: () => Promise<ProductWithCategory[]>;
  getOutOfStockNotifications: () => Promise<any>;
}

export interface CategoryContextType {
  categories: CategoryWithRefs[];
  parentCategories: CategoryWithRefs[];
  subcategories: CategoryWithRefs[];
  currentCategory: CategoryWithRefs | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  filters: CategoryFilters;
  loadCategories: (filters?: CategoryFilters) => Promise<void>;
  loadParentCategories: () => Promise<void>;
  loadSubcategories: (parentId: string) => Promise<void>;
  loadCategoryById: (id: string) => Promise<void>;
  createCategory: (categoryData: Omit<Category, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCategory: (id: string, categoryData: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setFilters: (filters: Partial<CategoryFilters>) => void;
  clearFilters: () => void;
  refreshCategories: () => Promise<void>;
}

export interface OrderContextType {
  orders: OrderWithRefs[];
  currentOrder: OrderWithRefs | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  filters: OrderFilters;
  loadOrders: () => Promise<void>;
  loadOrderById: (id: string) => Promise<void>;
  setFilters: (filters: Partial<OrderFilters>) => void;
  clearFilters: () => void;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
}

export interface OrderFilters {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface ReviewContextType {
  reviews: ReviewWithRefs[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  loadReviews: (filters?: ReviewFilters) => Promise<void>;
  loadProductReviews: (productId: string, filters?: Omit<ReviewFilters, 'productId'>) => Promise<void>;
  loadUserReviews: (userId?: string, filters?: Omit<ReviewFilters, 'userId'>) => Promise<void>;
  createReview: (review: CreateReviewRequest) => Promise<void>;
  updateReview: (reviewId: string, review: Partial<CreateReviewRequest>) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  refreshReviews: () => Promise<void>;
}

export interface ReviewFilters {
  productId?: string;
  userId?: string;
  rating?: number;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface WishlistContextType {
  wishlist: WishList | null;
  wishlistItems: WishListItem[];
  loading: boolean;
  error: string | null;
  loadWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  syncWishlistFromSession: (sessionWishlist: string[]) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  getWishlistItemsCount: () => number;
  hasItems: () => boolean;
  refreshWishlist: () => Promise<void>;
  getAllWishlists: () => Promise<any>;
  getWishlistStatistics: () => Promise<WishlistStatistics>;
  getUserWishlist: (userId: string) => Promise<WishList>;
}

export interface AddressContextType {
  addresses: Address[];
  defaultAddress: Address | null;
  loading: boolean;
  error: string | null;
  loadAddresses: () => Promise<void>;
  addAddress: (address: CreateAddressRequest) => Promise<void>;
  updateAddress: (id: string, address: Partial<CreateAddressRequest>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  validateAddress: (address: any) => Promise<any>;
  getCities: () => Promise<string[]>;
  getDistricts: (city: string) => Promise<string[]>;
  getWards: (city: string, district: string) => Promise<string[]>;
  clearError: () => void;
}

export interface BannerContextType {
  banners: Banner[];
  activeBanners: Banner[];
  loading: boolean;
  error: string | null;
  loadActiveBanners: () => Promise<void>;
  loadBannersByStatus: (status: 'active' | 'inactive' | 'draft') => Promise<void>;
  refreshBanners: () => Promise<void>;
  clearError: () => void;
}

export interface VoucherContextType {
  vouchers: Voucher[];
  availableVouchers: Voucher[];
  appliedVoucher: Voucher | null;
  loading: boolean;
  error: string | null;
  loadAvailableVouchers: () => Promise<void>;
  applyVoucher: (code: string, orderValue: number) => Promise<any>;
  removeAppliedVoucher: () => void;
  validateVoucher: (code: string) => Promise<boolean>;
  getUserVouchers: () => Promise<void>;
  clearError: () => void;
}

export interface PostContextType {
  posts: PostWithAuthor[];
  currentPost: PostWithAuthor | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  loadPosts: (page?: number, limit?: number) => Promise<void>;
  loadPostById: (id: string) => Promise<void>;
  searchPosts: (query: string) => Promise<PostWithAuthor[]>;
  refreshPosts: () => Promise<void>;
  clearError: () => void;
}

export interface AdminContextType {
  statistics: any | null;
  revenueChart: any | null;
  topProductsChart: any | null;
  orderStatusChart: any | null;
  userRegistrationChart: any | null;
  loading: boolean;
  error: string | null;
  loadDashboardData: () => Promise<void>;
  loadRevenueChart: (period?: 'day' | 'week' | 'month' | 'year') => Promise<void>;
  loadTopProductsChart: () => Promise<void>;
  loadOrderStatusChart: () => Promise<void>;
  loadUserRegistrationChart: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  clearError: () => void;
}

export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  success: (title: string, message?: string, options?: Partial<Notification>) => string;
  error: (title: string, message?: string, options?: Partial<Notification>) => string;
  warning: (title: string, message?: string, options?: Partial<Notification>) => string;
  info: (title: string, message?: string, options?: Partial<Notification>) => string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============= POPULATED TYPES (for API responses with populated refs) =============
export interface ProductWithCategory extends Omit<Product, 'category'> {
  category: Category;
}

export interface ProductVariantWithRefs extends Omit<ProductVariant, 'product' | 'color' | 'size'> {
  product: Product;
  color: Color;
  size: Size;
}

export interface CartWithRefs extends Omit<Cart, 'user' | 'address' | 'voucher' | 'paymentMethod' | 'items'> {
  user: User;
  address?: Address;
  voucher?: Voucher;
  paymentMethod?: PaymentMethod;
  items: Array<Omit<CartItem, 'productVariant'> & { productVariant: ProductVariantWithRefs }>;
}

export interface OrderWithRefs extends Omit<Order, 'user' | 'address' | 'voucher' | 'paymentMethod' | 'items'> {
  user?: User;
  address: Address;
  voucher?: Voucher;
  paymentMethod: PaymentMethod;
  items: Array<Omit<OrderDetail, 'productVariant'> & { productVariant: ProductVariantWithRefs }>;
}

export interface ReviewWithRefs extends Omit<Review, 'product' | 'user' | 'order'> {
  product: Product;
  user: User;
  order: Order;
}

export interface WishListWithRefs extends Omit<WishList, 'user' | 'items'> {
  user: User;
  items: Array<Omit<WishListItem, 'product' | 'variant'> & { 
    product: Product; 
    variant?: ProductVariantWithRefs; 
  }>;
}

export interface PostWithAuthor extends Omit<Post, 'author'> {
  author: User;
}

export interface CategoryWithRefs extends Omit<Category, 'parent'> {
  parent?: Category;
  children?: Category[];
}

export interface AddressWithUser extends Omit<Address, 'user'> {
  user: User;
}

export interface OrderWithRefs extends Omit<Order, 'user' | 'address' | 'voucher' | 'paymentMethod' | 'items'> {
  user?: User;
  address: Address;
  voucher?: Voucher;
  paymentMethod: PaymentMethod;
  items: Array<Omit<OrderDetail, 'productVariant'> & { productVariant: ProductVariantWithRefs }>;
}

export interface ReviewWithRefs extends Omit<Review, 'user' | 'product' | 'order'> {
  user: User;
  product: Product;
  order: Order;
}

export interface PostWithAuthor extends Omit<Post, 'author'> {
  author: User;
}

export interface WishListPopulated extends Omit<WishList, 'user' | 'items'> {
  user: User;
  items: Array<{
    product: Product;
    variant?: ProductVariantWithRefs;
  }>;
}

export interface CategoryWithRefs extends Omit<Category, 'parent'> {
  parent?: Category;
}
