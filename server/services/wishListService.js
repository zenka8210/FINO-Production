const BaseService = require('./baseService');
const WishList = require('../models/WishListSchema');
const Product = require('../models/ProductSchema');
const ProductVariant = require('../models/ProductVariantSchema');
const { AppError } = require('../middlewares/errorHandler');
const { QueryBuilder } = require('../middlewares/queryMiddleware');

class WishListService extends BaseService {
    constructor() {
        super(WishList);
    }

    // ============= USER WISHLIST OPERATIONS =============

    /**
     * Lấy wishlist của user (tạo mới nếu chưa có)
     */
    async getUserWishList(userId) {
        try {
            let wishlist = await WishList.findOne({ user: userId }).populate([
                {
                    path: 'items.product',
                    select: 'name price salePrice saleStartDate saleEndDate images isActive category description',
                    populate: {
                        path: 'category',
                        select: 'name _id parent'
                    }
                },
                {
                    path: 'items.variant',
                    select: 'price stock color size images isActive'
                }
            ]);

            if (!wishlist) {
                wishlist = await WishList.create({ user: userId, items: [] });
                // Populate sau khi tạo
                wishlist = await WishList.findById(wishlist._id).populate([
                    {
                        path: 'items.product',
                        select: 'name price salePrice saleStartDate saleEndDate images isActive category description',
                        populate: {
                            path: 'category',
                            select: 'name _id parent'
                        }
                    },
                    {
                        path: 'items.variant',
                        select: 'price stock color size images isActive'
                    }
                ]);
            }

            return wishlist;
        } catch (error) {
            throw new AppError('Lỗi khi lấy danh sách yêu thích', 500);
        }
    }

    /**
     * Thêm sản phẩm vào wishlist
     */
    async addToWishList(userId, productId, variantId = null) {
        try {
            // Validate product and variant
            await this.validateItemAddition(productId, variantId);

            // Get or create wishlist
            let wishlist = await WishList.findOne({ user: userId });
            if (!wishlist) {
                wishlist = await WishList.create({ user: userId, items: [] });
            }

            // Check for duplicates
            const existingItemIndex = wishlist.items.findIndex(item => {
                const productMatch = item.product.toString() === productId.toString();
                const variantMatch = (!item.variant && !variantId) || 
                                   (item.variant && variantId && item.variant.toString() === variantId.toString());
                return productMatch && variantMatch;
            });

            if (existingItemIndex !== -1) {
                throw new AppError('Sản phẩm đã có trong danh sách yêu thích', 400);
            }

            // Add new item
            const newItem = { product: productId };
            if (variantId) {
                newItem.variant = variantId;
            }

            wishlist.items.push(newItem);
            await wishlist.save();

            // Return populated wishlist
            return await this.getUserWishList(userId);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi khi thêm sản phẩm vào danh sách yêu thích', 500);
        }
    }

    /**
     * Xóa sản phẩm khỏi wishlist
     */
    async removeFromWishList(userId, productId, variantId = null) {
        try {
            const wishlist = await WishList.findOne({ user: userId });
            if (!wishlist) {
                throw new AppError('Danh sách yêu thích không tồn tại', 404);
            }

            const itemIndex = wishlist.items.findIndex(item => {
                const productMatch = item.product.toString() === productId.toString();
                const variantMatch = (!item.variant && !variantId) || 
                                   (item.variant && variantId && item.variant.toString() === variantId.toString());
                return productMatch && variantMatch;
            });

            if (itemIndex === -1) {
                throw new AppError('Sản phẩm không có trong danh sách yêu thích', 404);
            }

            wishlist.items.splice(itemIndex, 1);
            await wishlist.save();

            return await this.getUserWishList(userId);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi khi xóa sản phẩm khỏi danh sách yêu thích', 500);
        }
    }

    /**
     * Toggle sản phẩm trong wishlist
     */
    async toggleWishList(userId, productId, variantId = null) {
        try {
            const wishlist = await WishList.findOne({ user: userId });
            
            // Check if item exists
            let itemExists = false;
            if (wishlist) {
                itemExists = wishlist.items.some(item => {
                    const productMatch = item.product.toString() === productId.toString();
                    const variantMatch = (!item.variant && !variantId) || 
                                       (item.variant && variantId && item.variant.toString() === variantId.toString());
                    return productMatch && variantMatch;
                });
            }

            if (itemExists) {
                return await this.removeFromWishList(userId, productId, variantId);
            } else {
                return await this.addToWishList(userId, productId, variantId);
            }
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi khi toggle wishlist', 500);
        }
    }

    /**
     * Kiểm tra sản phẩm có trong wishlist không
     */
    async isInWishList(userId, productId, variantId = null) {
        try {
            const wishlist = await WishList.findOne({ user: userId });
            if (!wishlist) return false;

            return wishlist.items.some(item => {
                const productMatch = item.product.toString() === productId.toString();
                const variantMatch = (!item.variant && !variantId) || 
                                   (item.variant && variantId && item.variant.toString() === variantId.toString());
                return productMatch && variantMatch;
            });
        } catch (error) {
            return false;
        }
    }

    /**
     * Lấy số lượng item trong wishlist
     */
    async getWishListCount(userId) {
        try {
            const wishlist = await WishList.findOne({ user: userId });
            return wishlist ? wishlist.items.length : 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Xóa toàn bộ wishlist
     */
    async clearWishList(userId) {
        try {
            const wishlist = await WishList.findOne({ user: userId });
            if (!wishlist) {
                throw new AppError('Danh sách yêu thích không tồn tại', 404);
            }

            wishlist.items = [];
            await wishlist.save();

            return wishlist;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi khi xóa danh sách yêu thích', 500);
        }
    }

    /**
     * Thêm nhiều sản phẩm vào wishlist
     */
    async addMultipleToWishList(userId, items) {
        const results = [];
        const errors = [];

        for (const item of items) {
            try {
                const { productId, variantId } = item;
                await this.addToWishList(userId, productId, variantId);
                results.push({ productId, variantId, success: true });
            } catch (error) {
                errors.push({ 
                    productId: item.productId, 
                    variantId: item.variantId, 
                    error: error.message 
                });
            }
        }

        const wishlist = await this.getUserWishList(userId);
        return { wishlist, results, errors };
    }

    /**
     * Đồng bộ wishlist từ session (cho user vừa đăng nhập)
     */
    async syncWishListFromSession(userId, sessionItems = []) {
        try {
            if (!sessionItems.length) return await this.getUserWishList(userId);

            const wishlist = await this.getUserWishList(userId);
            
            for (const sessionItem of sessionItems) {
                try {
                    // Validate each session item
                    await this.validateItemAddition(sessionItem.product, sessionItem.variant);
                    
                    // Check if already exists
                    const exists = wishlist.items.some(item => {
                        const productMatch = item.product._id.toString() === sessionItem.product.toString();
                        const variantMatch = (!item.variant && !sessionItem.variant) || 
                                           (item.variant && sessionItem.variant && 
                                            item.variant._id.toString() === sessionItem.variant.toString());
                        return productMatch && variantMatch;
                    });

                    if (!exists) {
                        const newItem = { product: sessionItem.product };
                        if (sessionItem.variant) {
                            newItem.variant = sessionItem.variant;
                        }
                        wishlist.items.push(newItem);
                    }
                } catch (itemError) {
                    // Skip invalid items from session
                    console.log('Skipping invalid session item:', itemError.message);
                }
            }

            await wishlist.save();
            return await this.getUserWishList(userId);
        } catch (error) {
            throw new AppError('Lỗi khi đồng bộ danh sách yêu thích', 500);
        }
    }

    // ============= ADMIN OPERATIONS =============

    /**
     * Lấy tất cả wishlist (Admin only)
     */
    async getAllWishLists(queryOptions = {}) {
        try {
            const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = queryOptions;
            const skip = (page - 1) * limit;
            
            let filter = {};
            
            // Search by user name or email
            if (search) {
                const User = require('../models/UserSchema');
                const users = await User.find({
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } }
                    ]
                }).select('_id');
                
                filter.user = { $in: users.map(u => u._id) };
            }

            const wishlists = await WishList.find(filter)
                .populate({
                    path: 'user',
                    select: 'name email'
                })
                .populate({
                    path: 'items.product',
                    select: 'name price salePrice saleStartDate saleEndDate images category description',
                    populate: {
                        path: 'category',
                        select: 'name _id parent'
                    }
                })
                .populate({
                    path: 'items.variant',
                    select: 'price color size'
                })
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await WishList.countDocuments(filter);

            return {
                wishlists,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw new AppError('Lỗi khi lấy danh sách wishlist', 500);
        }
    }

    /**
     * Lấy wishlist của user cụ thể (Admin only)
     */
    async getUserWishListByAdmin(userId) {
        try {
            const wishlist = await WishList.findOne({ user: userId })
                .populate({
                    path: 'user',
                    select: 'name email'
                })
                .populate({
                    path: 'items.product',
                    select: 'name price salePrice saleStartDate saleEndDate images isActive category description',
                    populate: {
                        path: 'category',
                        select: 'name _id parent'
                    }
                })
                .populate({
                    path: 'items.variant',
                    select: 'price stock color size images isActive'
                });

            if (!wishlist) {
                throw new AppError('Wishlist không tồn tại', 404);
            }

            return wishlist;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi khi lấy wishlist của user', 500);
        }
    }

    /**
     * Thống kê wishlist (Admin only) - Enhanced với category stats
     */
    async getWishListStats(limit = 10) {
        try {
            // 1. Thống kê tổng quan
            const totalStats = await WishList.aggregate([
                {
                    $group: {
                        _id: null,
                        totalWishLists: { $sum: 1 },
                        totalItems: { $sum: { $size: '$items' } },
                        avgItemsPerWishList: { $avg: { $size: '$items' } }
                    }
                }
            ]);

            // 2. Top N sản phẩm được wishlist nhiều nhất
            const topProducts = await WishList.aggregate([
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.product',
                        wishlistCount: { $sum: 1 }
                    }
                },
                { $sort: { wishlistCount: -1 } },
                { $limit: parseInt(limit) },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                { $unwind: '$product' },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'product.category',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                {
                    $addFields: {
                        category: { $arrayElemAt: ['$category', 0] }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        productName: '$product.name',
                        productPrice: '$product.price',
                        productImage: { $arrayElemAt: ['$product.images', 0] },
                        categoryName: '$category.name',
                        categoryId: '$product.category',
                        wishlistCount: 1,
                        isActive: '$product.isActive'
                    }
                }
            ]);

            // 3. Thống kê theo category
            const categoryStats = await WishList.aggregate([
                { $unwind: '$items' },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'items.product',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                { $unwind: '$product' },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'product.category',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                { $unwind: '$category' },
                {
                    $group: {
                        _id: '$category._id',
                        categoryName: { $first: '$category.name' },
                        wishlistCount: { $sum: 1 },
                        uniqueProducts: { $addToSet: '$product._id' }
                    }
                },
                {
                    $addFields: {
                        uniqueProductsCount: { $size: '$uniqueProducts' }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        categoryName: 1,
                        wishlistCount: 1,
                        uniqueProductsCount: 1
                    }
                },
                { $sort: { wishlistCount: -1 } }
            ]);

            // 4. Tính tổng số lượt wishlist toàn hệ thống
            const totalWishlistsCount = await WishList.aggregate([
                {
                    $group: {
                        _id: null,
                        totalWishlists: { $sum: { $size: '$items' } }
                    }
                }
            ]);

            return {
                overview: totalStats[0] || {
                    totalWishLists: 0,
                    totalItems: 0,
                    avgItemsPerWishList: 0
                },
                totalWishlists: totalWishlistsCount[0]?.totalWishlists || 0,
                topProducts,
                categoryStats,
                metadata: {
                    generatedAt: new Date(),
                    topProductsLimit: parseInt(limit)
                }
            };
        } catch (error) {
            throw new AppError(`Lỗi khi lấy thống kê wishlist: ${error.message}`, 500);
        }
    }

    /**
     * Lấy tất cả wishlist với Query Middleware (Admin only)
     */
    async getAllWishListsWithQuery(queryParams) {
        try {
            // Sử dụng QueryUtils với pre-configured setup cho WishList
            const result = await QueryUtils.getWishLists(WishList, queryParams);
            
            return result;
        } catch (error) {
            throw new AppError(
                `Error fetching wishlists: ${error.message}`,
                'WISHLIST_FETCH_FAILED',
                500
            );
        }
    }

    // ============= VALIDATION HELPERS =============

    /**
     * Validate product and variant addition
     */
    async validateItemAddition(productId, variantId = null) {
        // Check if product exists and is active
        const product = await Product.findById(productId);
        if (!product) {
            throw new AppError('Sản phẩm không tồn tại', 404);
        }

        if (!product.isActive) {
            throw new AppError('Sản phẩm đã bị ẩn, không thể thêm vào wishlist', 400);
        }

        // Check variant if provided
        if (variantId) {
            const variant = await ProductVariant.findById(variantId);
            if (!variant) {
                throw new AppError('Biến thể sản phẩm không tồn tại', 404);
            }

            if (variant.product.toString() !== productId.toString()) {
                throw new AppError('Biến thể không thuộc về sản phẩm này', 400);
            }

            // Note: Cho phép thêm variant hết hàng (stock = 0) theo yêu cầu
        }

        return true;
    }

    // ============= SESSION HELPERS =============

    /**
     * Populate session wishlist with product details
     */
    async populateSessionWishList(sessionWishList = []) {
        if (!sessionWishList || sessionWishList.length === 0) {
            return [];
        }

        try {
            const populatedItems = await Promise.all(
                sessionWishList.map(async (item) => {
                    try {
                        // Populate product
                        const product = await Product.findById(item.product)
                            .select('name price salePrice saleStartDate saleEndDate images isActive category description')
                            .populate({
                                path: 'category',
                                select: 'name _id parent'
                            })
                            .lean();

                        if (!product) {
                            console.warn(`Product not found: ${item.product}`);
                            return null;
                        }

                        // Populate variant if exists
                        let variant = null;
                        if (item.variant) {
                            variant = await ProductVariant.findById(item.variant)
                                .select('price stock color size images isActive')
                                .populate([
                                    { path: 'color', select: 'name isActive' },
                                    { path: 'size', select: 'name' }
                                ])
                                .lean();
                        }

                        return {
                            _id: item._id || `session-${item.product}-${item.variant || 'no-variant'}`,
                            product: product,
                            variant: variant,
                            addedAt: item.addedAt || new Date()
                        };
                    } catch (error) {
                        console.error(`Error populating wishlist item: ${item.product}`, error);
                        return null;
                    }
                })
            );

            // Filter out null items (products that couldn't be populated)
            return populatedItems.filter(item => item !== null);
        } catch (error) {
            console.error('Error populating session wishlist:', error);
            return [];
        }
    }

    /**
     * Thêm item vào session wishlist
     */
    addToSessionWishList(sessionWishList = [], productId, variantId = null) {
        const existingIndex = sessionWishList.findIndex(item => {
            const productMatch = item.product.toString() === productId.toString();
            const variantMatch = (!item.variant && !variantId) || 
                               (item.variant && variantId && item.variant.toString() === variantId.toString());
            return productMatch && variantMatch;
        });

        if (existingIndex !== -1) {
            throw new AppError('Sản phẩm đã có trong danh sách yêu thích', 400);
        }

        const newItem = { product: productId };
        if (variantId) {
            newItem.variant = variantId;
        }

        sessionWishList.push(newItem);
        return sessionWishList;
    }

    /**
     * Xóa item khỏi session wishlist
     */
    removeFromSessionWishList(sessionWishList = [], productId, variantId = null) {
        const itemIndex = sessionWishList.findIndex(item => {
            const productMatch = item.product.toString() === productId.toString();
            const variantMatch = (!item.variant && !variantId) || 
                               (item.variant && variantId && item.variant.toString() === variantId.toString());
            return productMatch && variantMatch;
        });

        if (itemIndex === -1) {
            throw new AppError('Sản phẩm không có trong danh sách yêu thích', 404);
        }

        sessionWishList.splice(itemIndex, 1);
        return sessionWishList;
    }
}

module.exports = WishListService;
