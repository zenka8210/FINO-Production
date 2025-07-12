const BaseController = require('./baseController');
const WishListService = require('../services/wishListService');
const ResponseHandler = require('../services/responseHandler');

class WishListController extends BaseController {
  constructor() {
    const wishListService = new WishListService();
    super(wishListService);
  }

  // Lấy wishlist của user hiện tại
  getUserWishList = async (req, res, next) => {
    try {
      const wishlist = await this.service.getUserWishList(req.user._id);
      ResponseHandler.success(res, 'Lấy danh sách yêu thích thành công', wishlist);
    } catch (error) {
      next(error);
    }
  };

  // Thêm sản phẩm vào wishlist
  addToWishList = async (req, res, next) => {
    try {
      const { productId, variantId } = req.body;
      
      if (!productId) {
        return ResponseHandler.badRequest(res, 'Thiếu productId');
      }
      
      // Check empty string variantId
      if (variantId === '') {
        return ResponseHandler.badRequest(res, 'variantId không được để trống');
      }

      const wishlist = await this.service.addToWishList(req.user._id, productId, variantId);
      ResponseHandler.success(res, 'Thêm vào danh sách yêu thích thành công', wishlist);
    } catch (error) {
      next(error);
    }
  };

  // Xóa sản phẩm khỏi wishlist
  removeFromWishList = async (req, res, next) => {
    try {
      const { id } = req.params; // Item ID từ URL
      const wishlist = await this.service.removeFromWishListByItemId(req.user._id, id);
      ResponseHandler.success(res, 'Xóa khỏi danh sách yêu thích thành công', wishlist);
    } catch (error) {
      next(error);
    }
  };

  // Xóa toàn bộ wishlist
  clearWishList = async (req, res, next) => {
    try {
      const wishlist = await this.service.clearWishList(req.user._id);
      ResponseHandler.success(res, 'Xóa toàn bộ danh sách yêu thích thành công', wishlist);
    } catch (error) {
      next(error);
    }
  };

  // Kiểm tra sản phẩm có trong wishlist không
  checkInWishList = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { variantId } = req.query;
      const isInWishList = await this.service.isInWishList(req.user._id, productId, variantId);
      ResponseHandler.success(res, 'Kiểm tra wishlist thành công', { isInWishList });
    } catch (error) {
      next(error);
    }
  };

  // Thêm nhiều sản phẩm vào wishlist
  addMultipleToWishList = async (req, res, next) => {
    try {
      const { items } = req.body;
      
      if (!Array.isArray(items) || items.length === 0) {
        return ResponseHandler.badRequest(res, 'Danh sách sản phẩm không hợp lệ');
      }

      const result = await this.service.addMultipleToWishList(req.user._id, items);
      ResponseHandler.success(res, 'Thêm nhiều sản phẩm vào wishlist thành công', result);
    } catch (error) {
      next(error);
    }
  };

  // Lấy số lượng sản phẩm trong wishlist
  getWishListCount = async (req, res, next) => {
    try {
      const count = await this.service.getWishListCount(req.user._id);
      ResponseHandler.success(res, 'Lấy số lượng wishlist thành công', { count });
    } catch (error) {
      next(error);
    }
  };

  // Toggle sản phẩm trong wishlist
  toggleWishList = async (req, res, next) => {
    try {
      const { productId, variantId } = req.body;
      
      if (!productId) {
        return ResponseHandler.badRequest(res, 'Thiếu productId');
      }

      const result = await this.service.toggleWishList(req.user._id, productId, variantId);
      ResponseHandler.success(res, 'Toggle wishlist thành công', result);
    } catch (error) {
      next(error);
    }
  };

  // Admin: Lấy thống kê wishlist
  getWishListStats = async (req, res, next) => {
    try {
      const stats = await this.service.getWishListStats();
      ResponseHandler.success(res, 'Lấy thống kê wishlist thành công', stats);
    } catch (error) {
      next(error);
    }
  };

  // Admin: Lấy tất cả wishlist
  getAllWishLists = async (req, res, next) => {
    try {
      const { page, limit, userId } = req.query;
      
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        userId
      };

      const result = await this.service.getAllWishLists(options);
      ResponseHandler.success(res, 'Lấy danh sách wishlist thành công', result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = WishListController;
