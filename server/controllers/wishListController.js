const BaseController = require('./baseController');
const WishListService = require('../services/wishListService');
const WishList = require('../models/WishListSchema');
const ResponseHandler = require('../services/responseHandler');
const { QueryBuilder } = require('../middlewares/queryMiddleware');
const { PAGINATION } = require('../config/constants');
const AdminSortUtils = require('../utils/adminSortUtils');

class WishListController extends BaseController {
    constructor() {
        const wishListService = new WishListService();
        super(wishListService);
    }

    // ============= USER OPERATIONS =============

    /**
     * Lấy wishlist của user (hoặc session cho user chưa đăng nhập)
     */
    getUserWishList = async (req, res, next) => {
        try {
            if (req.user) {
                // User đã đăng nhập - lấy từ database
                const wishlist = await this.service.getUserWishList(req.user._id);
                ResponseHandler.success(res, 'Lấy danh sách yêu thích thành công', wishlist);
            } else {
                // User chưa đăng nhập - lấy từ session và populate data
                const sessionWishList = req.session.wishList || [];
                const populatedItems = await this.service.populateSessionWishList(sessionWishList);
                
                ResponseHandler.success(res, 'Lấy danh sách yêu thích từ session thành công', {
                    _id: null,
                    user: null,
                    items: populatedItems
                });
            }
        } catch (error) {
            next(error);
        }
    };

    /**
     * Thêm sản phẩm vào wishlist
     */
    addToWishList = async (req, res, next) => {
        try {
            const { productId, variantId } = req.body;
            
            if (!productId) {
                return ResponseHandler.badRequest(res, 'Thiếu productId');
            }
            
            if (variantId === '') {
                return ResponseHandler.badRequest(res, 'variantId không được để trống');
            }

            if (req.user) {
                // User đã đăng nhập - thêm vào database
                const wishlist = await this.service.addToWishList(req.user._id, productId, variantId);
                ResponseHandler.success(res, 'Thêm vào danh sách yêu thích thành công', wishlist);
            } else {
                // User chưa đăng nhập - thêm vào session
                try {
                    // Validate trước khi thêm vào session
                    await this.service.validateItemAddition(productId, variantId);
                    
                    const sessionWishList = req.session.wishList || [];
                    const updatedWishList = this.service.addToSessionWishList(sessionWishList, productId, variantId);
                    
                    req.session.wishList = updatedWishList;
                    ResponseHandler.success(res, 'Thêm vào danh sách yêu thích session thành công', {
                        _id: null,
                        user: null,
                        items: updatedWishList
                    });
                } catch (sessionError) {
                    return ResponseHandler.badRequest(res, sessionError.message);
                }
            }
        } catch (error) {
            next(error);
        }
    };

    /**
     * Xóa sản phẩm khỏi wishlist
     */
    removeFromWishList = async (req, res, next) => {
        try {
            const { productId } = req.params;
            const { variantId } = req.query;
            
            if (!productId) {
                return ResponseHandler.badRequest(res, 'Thiếu productId');
            }

            if (req.user) {
                // User đã đăng nhập - xóa từ database
                const wishlist = await this.service.removeFromWishList(req.user._id, productId, variantId);
                ResponseHandler.success(res, 'Xóa khỏi danh sách yêu thích thành công', wishlist);
            } else {
                // User chưa đăng nhập - xóa từ session
                try {
                    const sessionWishList = req.session.wishList || [];
                    const updatedWishList = this.service.removeFromSessionWishList(sessionWishList, productId, variantId);
                    
                    req.session.wishList = updatedWishList;
                    ResponseHandler.success(res, 'Xóa khỏi danh sách yêu thích session thành công', {
                        _id: null,
                        user: null,
                        items: updatedWishList
                    });
                } catch (sessionError) {
                    return ResponseHandler.badRequest(res, sessionError.message);
                }
            }
        } catch (error) {
            next(error);
        }
    };

    /**
     * Toggle sản phẩm trong wishlist
     */
    toggleWishList = async (req, res, next) => {
        try {
            const { productId, variantId } = req.body;
            
            if (!productId) {
                return ResponseHandler.badRequest(res, 'Thiếu productId');
            }

            if (req.user) {
                // User đã đăng nhập - toggle trong database
                const result = await this.service.toggleWishList(req.user._id, productId, variantId);
                ResponseHandler.success(res, 'Toggle wishlist thành công', result);
            } else {
                // User chưa đăng nhập - toggle trong session
                try {
                    const sessionWishList = req.session.wishList || [];
                    
                    // Check if item exists
                    const itemExists = sessionWishList.some(item => {
                        const productMatch = item.product.toString() === productId.toString();
                        const variantMatch = (!item.variant && !variantId) || 
                                           (item.variant && variantId && item.variant.toString() === variantId.toString());
                        return productMatch && variantMatch;
                    });

                    let updatedWishList;
                    if (itemExists) {
                        updatedWishList = this.service.removeFromSessionWishList(sessionWishList, productId, variantId);
                    } else {
                        // Validate trước khi thêm
                        await this.service.validateItemAddition(productId, variantId);
                        updatedWishList = this.service.addToSessionWishList(sessionWishList, productId, variantId);
                    }
                    
                    req.session.wishList = updatedWishList;
                    ResponseHandler.success(res, 'Toggle wishlist session thành công', {
                        _id: null,
                        user: null,
                        items: updatedWishList
                    });
                } catch (sessionError) {
                    return ResponseHandler.badRequest(res, sessionError.message);
                }
            }
        } catch (error) {
            next(error);
        }
    };

    /**
     * Xóa toàn bộ wishlist
     */
    clearWishList = async (req, res, next) => {
        try {
            if (req.user) {
                // User đã đăng nhập - xóa database
                const wishlist = await this.service.clearWishList(req.user._id);
                ResponseHandler.success(res, 'Xóa toàn bộ danh sách yêu thích thành công', wishlist);
            } else {
                // User chưa đăng nhập - xóa session
                req.session.wishList = [];
                ResponseHandler.success(res, 'Xóa toàn bộ danh sách yêu thích session thành công', {
                    _id: null,
                    user: null,
                    items: []
                });
            }
        } catch (error) {
            next(error);
        }
    };

    /**
     * Kiểm tra sản phẩm có trong wishlist không
     */
    checkInWishList = async (req, res, next) => {
        try {
            const { productId } = req.params;
            const { variantId } = req.query;
            
            let isInWishList = false;

            if (req.user) {
                // User đã đăng nhập - check database
                isInWishList = await this.service.isInWishList(req.user._id, productId, variantId);
            } else {
                // User chưa đăng nhập - check session
                const sessionWishList = req.session.wishList || [];
                isInWishList = sessionWishList.some(item => {
                    const productMatch = item.product.toString() === productId.toString();
                    const variantMatch = (!item.variant && !variantId) || 
                                       (item.variant && variantId && item.variant.toString() === variantId.toString());
                    return productMatch && variantMatch;
                });
            }

            ResponseHandler.success(res, 'Kiểm tra wishlist thành công', { isInWishList });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Lấy số lượng sản phẩm trong wishlist
     */
    getWishListCount = async (req, res, next) => {
        try {
            let count = 0;

            if (req.user) {
                // User đã đăng nhập - count database
                count = await this.service.getWishListCount(req.user._id);
            } else {
                // User chưa đăng nhập - count session
                const sessionWishList = req.session.wishList || [];
                count = sessionWishList.length;
            }

            ResponseHandler.success(res, 'Lấy số lượng wishlist thành công', { count });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Đồng bộ wishlist từ session khi user đăng nhập
     */
    syncWishListFromSession = async (req, res, next) => {
        try {
            if (!req.user) {
                return ResponseHandler.unauthorized(res, 'Chưa đăng nhập');
            }

            const sessionWishList = req.session.wishList || [];
            const wishlist = await this.service.syncWishListFromSession(req.user._id, sessionWishList);
            
            // Clear session wishlist after sync
            req.session.wishList = [];
            
            ResponseHandler.success(res, 'Đồng bộ wishlist thành công', wishlist);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Thêm nhiều sản phẩm vào wishlist
     */
    addMultipleToWishList = async (req, res, next) => {
        try {
            const { items } = req.body;
            
            if (!Array.isArray(items) || items.length === 0) {
                return ResponseHandler.badRequest(res, 'Danh sách sản phẩm không hợp lệ');
            }

            if (!req.user) {
                return ResponseHandler.unauthorized(res, 'Chưa đăng nhập');
            }

            const result = await this.service.addMultipleToWishList(req.user._id, items);
            ResponseHandler.success(res, 'Thêm nhiều sản phẩm vào wishlist thành công', result);
        } catch (error) {
            next(error);
        }
    };

    // ============= ADMIN OPERATIONS =============

    /**
     * Lấy thống kê wishlist (Admin only)
     */
    getWishListStats = async (req, res, next) => {
        try {
            const { limit = 10 } = req.query;
            const stats = await this.service.getWishListStats(limit);
            ResponseHandler.success(res, 'Lấy thống kê wishlist thành công', stats);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Lấy tất cả wishlist (Admin only)
     */
    getAllWishLists = async (req, res, next) => {
        try {
            // Use new QueryBuilder with improved safety
            if (req.createQueryBuilder) {
                const queryBuilder = req.createQueryBuilder(WishList);
                
                // Configure search and filters for wishlists
                const result = await queryBuilder
                    .search(['name'])
                    .applyFilters({
                        userId: { type: 'objectId', field: 'user' },
                        isPublic: { type: 'boolean' }
                    })
                    .execute();
                
                ResponseHandler.success(res, 'Lấy danh sách wishlist thành công', result);
            } else {
                // Fallback to legacy method if middleware not available
                const queryOptions = {
                    page: req.query.page || PAGINATION.DEFAULT_PAGE,
                    limit: req.query.limit || PAGINATION.DEFAULT_LIMIT,
                    userId: req.query.userId,
                    sortBy: req.query.sortBy || 'createdAt',
                    sortOrder: req.query.sortOrder || 'desc'
                };
                
                // Apply admin sort
                const sortConfig = AdminSortUtils.ensureAdminSort(req, 'WishList');
                queryOptions.sort = sortConfig;
                
                const result = await this.service.getAllWishLists(queryOptions);
                ResponseHandler.success(res, 'Lấy danh sách wishlist thành công', result);
            }
        } catch (error) {
            console.error('❌ WishListController.getAllWishLists error:', error.message);
            next(error);
        }
    };

    /**
     * Lấy tất cả wishlist (Admin only) - Legacy version (preserved for backward compatibility)
     */
    getAllWishListsLegacy = async (req, res, next) => {
        try {
            const { page, limit, search, sortBy, sortOrder } = req.query;
            
            const queryOptions = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search,
                sortBy: sortBy || 'createdAt',
                sortOrder: sortOrder || 'desc'
            };

            // Apply admin sort
            const sortConfig = AdminSortUtils.ensureAdminSort(req, 'WishList');
            queryOptions.sort = sortConfig;

            const result = await this.service.getAllWishLists(queryOptions);
            ResponseHandler.success(res, 'Lấy danh sách wishlist thành công', result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Lấy wishlist của user cụ thể (Admin only)
     */
    getUserWishListByAdmin = async (req, res, next) => {
        try {
            const { userId } = req.params;
            
            if (!userId) {
                return ResponseHandler.badRequest(res, 'Thiếu userId');
            }

            const wishlist = await this.service.getUserWishListByAdmin(userId);
            ResponseHandler.success(res, 'Lấy wishlist của user thành công', wishlist);
        } catch (error) {
            next(error);
        }
    };
}

module.exports = WishListController;
