const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const logger = require('./loggerService').getLogger('ProductService');
const { PAGINATION, MESSAGES, ERROR_CODES } = require('../config/constants');

/**
 * Service xử lý logic nghiệp vụ liên quan đến sản phẩm
 */
class ProductService {
  
  /**
   * Tạo sản phẩm mới
   * @param {Object} productData - Dữ liệu sản phẩm
   * @param {Object} user - Thông tin người dùng tạo
   * @returns {Promise<Object>} - Sản phẩm vừa tạo
   */
  async createProduct(productData, user) {
    try {
      logger.info('Tạo sản phẩm mới', { productData, userId: user._id });

      // Kiểm tra category có tồn tại không (nếu có)
      if (productData.category) {
        const categoryExists = await Category.findById(productData.category);
        if (!categoryExists) {
          throw new Error(MESSAGES.CATEGORY_NOT_FOUND);
        }
      }

      // Tạo sản phẩm mới
      const product = new Product({
        ...productData,
        createdBy: user._id
      });

      const savedProduct = await product.save();
      
      // Populate category information
      await savedProduct.populate('category');
      
      logger.info('Sản phẩm được tạo thành công', { productId: savedProduct._id });
      return savedProduct;
    } catch (error) {
      logger.error('Lỗi khi tạo sản phẩm', { error: error.message, productData });
      throw error;
    }
  }

  /**
   * Lấy danh sách sản phẩm với filter và pagination
   * @param {Object} filter - Bộ lọc
   * @param {Object} options - Tùy chọn phân trang và sắp xếp
   * @returns {Promise<Object>} - Danh sách sản phẩm với thông tin phân trang
   */
  async getProducts(filter = {}, options = {}) {
    try {
      logger.info('Lấy danh sách sản phẩm', { filter, options });

      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        sort = { createdAt: -1 }
      } = options;

      const skip = (page - 1) * limit;

      // Xây dựng query
      const query = { ...filter };
      
      // Nếu có tìm kiếm theo tên
      if (filter.search) {
        query.name = { $regex: filter.search, $options: 'i' };
        delete query.search;
      }

      // Thực hiện query
      const [products, total] = await Promise.all([
        Product.find(query)
          .populate('category', 'name description')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      const result = {
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage
        }
      };

      logger.info('Lấy danh sách sản phẩm thành công', { 
        totalProducts: products.length, 
        totalItems: total 
      });

      return result;
    } catch (error) {
      logger.error('Lỗi khi lấy danh sách sản phẩm', { error: error.message, filter });
      throw error;
    }
  }

  /**
   * Lấy sản phẩm theo ID
   * @param {string} productId - ID sản phẩm
   * @returns {Promise<Object>} - Thông tin sản phẩm
   */
  async getProductById(productId) {
    try {
      logger.info('Lấy sản phẩm theo ID', { productId });

      const product = await Product.findById(productId)
        .populate('category', 'name description')
        .lean();

      if (!product) {
        const error = new Error(MESSAGES.PRODUCT_NOT_FOUND);
        error.statusCode = 404;
        error.errorCode = ERROR_CODES.PRODUCT_NOT_FOUND;
        throw error;
      }

      logger.info('Lấy sản phẩm thành công', { productId });
      return product;
    } catch (error) {
      logger.error('Lỗi khi lấy sản phẩm', { error: error.message, productId });
      throw error;
    }
  }

  /**
   * Cập nhật sản phẩm
   * @param {string} productId - ID sản phẩm
   * @param {Object} updateData - Dữ liệu cần cập nhật
   * @param {Object} user - Thông tin người dùng cập nhật
   * @returns {Promise<Object>} - Sản phẩm đã cập nhật
   */
  async updateProduct(productId, updateData, user) {
    try {
      logger.info('Cập nhật sản phẩm', { productId, updateData, userId: user._id });

      // Kiểm tra sản phẩm có tồn tại không
      const existingProduct = await Product.findById(productId);
      if (!existingProduct) {
        const error = new Error(MESSAGES.PRODUCT_NOT_FOUND);
        error.statusCode = 404;
        error.errorCode = ERROR_CODES.PRODUCT_NOT_FOUND;
        throw error;
      }

      // Kiểm tra category có tồn tại không (nếu có trong updateData)
      if (updateData.category) {
        const categoryExists = await Category.findById(updateData.category);
        if (!categoryExists) {
          throw new Error(MESSAGES.CATEGORY_NOT_FOUND);
        }
      }

      // Cập nhật sản phẩm
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          ...updateData,
          updatedBy: user._id,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).populate('category', 'name description');

      logger.info('Cập nhật sản phẩm thành công', { productId });
      return updatedProduct;
    } catch (error) {
      logger.error('Lỗi khi cập nhật sản phẩm', { error: error.message, productId });
      throw error;
    }
  }

  /**
   * Xóa sản phẩm
   * @param {string} productId - ID sản phẩm
   * @param {Object} user - Thông tin người dùng xóa
   * @returns {Promise<Object>} - Kết quả xóa
   */
  async deleteProduct(productId, user) {
    try {
      logger.info('Xóa sản phẩm', { productId, userId: user._id });

      const product = await Product.findById(productId);
      if (!product) {
        const error = new Error(MESSAGES.PRODUCT_NOT_FOUND);
        error.statusCode = 404;
        error.errorCode = ERROR_CODES.PRODUCT_NOT_FOUND;
        throw error;
      }

      // Kiểm tra xem sản phẩm có đang được sử dụng trong đơn hàng nào không
      // (Tùy theo logic nghiệp vụ, có thể chỉ soft delete thay vì hard delete)
      
      await Product.findByIdAndDelete(productId);
      
      logger.info('Xóa sản phẩm thành công', { productId });
      return { deleted: true, productId };
    } catch (error) {
      logger.error('Lỗi khi xóa sản phẩm', { error: error.message, productId });
      throw error;
    }
  }

  /**
   * Tìm kiếm sản phẩm
   * @param {string} searchTerm - Từ khóa tìm kiếm
   * @param {Object} options - Tùy chọn phân trang
   * @returns {Promise<Object>} - Kết quả tìm kiếm
   */
  async searchProducts(searchTerm, options = {}) {
    try {
      logger.info('Tìm kiếm sản phẩm', { searchTerm, options });

      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        category,
        minPrice,
        maxPrice,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      // Xây dựng query tìm kiếm
      const query = {
        $and: [
          {
            $or: [
              { name: { $regex: searchTerm, $options: 'i' } },
              { description: { $regex: searchTerm, $options: 'i' } },
              { brand: { $regex: searchTerm, $options: 'i' } }
            ]
          }
        ]
      };

      // Thêm filter theo category
      if (category) {
        query.$and.push({ category });
      }

      // Thêm filter theo giá (dựa trên variants)
      if (minPrice || maxPrice) {
        const priceQuery = {};
        if (minPrice) priceQuery.$gte = minPrice;
        if (maxPrice) priceQuery.$lte = maxPrice;
        query.$and.push({ 'variants.price': priceQuery });
      }

      const [products, total] = await Promise.all([
        Product.find(query)
          .populate('category', 'name description')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      const result = {
        products,
        searchTerm,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage
        }
      };

      logger.info('Tìm kiếm sản phẩm thành công', { 
        searchTerm, 
        totalResults: total 
      });

      return result;
    } catch (error) {
      logger.error('Lỗi khi tìm kiếm sản phẩm', { error: error.message, searchTerm });
      throw error;
    }
  }

  /**
   * Lấy sản phẩm nổi bật
   * @param {number} limit - Số lượng sản phẩm
   * @returns {Promise<Array>} - Danh sách sản phẩm nổi bật
   */
  async getFeaturedProducts(limit = 8) {
    try {
      logger.info('Lấy sản phẩm nổi bật', { limit });

      const products = await Product.find({ 
        isFeatured: true, 
        status: 'active' 
      })
        .populate('category', 'name description')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      logger.info('Lấy sản phẩm nổi bật thành công', { count: products.length });
      return products;
    } catch (error) {
      logger.error('Lỗi khi lấy sản phẩm nổi bật', { error: error.message });
      throw error;
    }
  }

  /**
   * Lấy sản phẩm theo category
   * @param {string} categoryId - ID category
   * @param {Object} options - Tùy chọn phân trang
   * @returns {Promise<Object>} - Danh sách sản phẩm theo category
   */
  async getProductsByCategory(categoryId, options = {}) {
    try {
      logger.info('Lấy sản phẩm theo category', { categoryId, options });

      const filter = { 
        category: categoryId, 
        status: 'active' 
      };

      return await this.getProducts(filter, options);
    } catch (error) {
      logger.error('Lỗi khi lấy sản phẩm theo category', { error: error.message, categoryId });
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái sản phẩm
   * @param {string} productId - ID sản phẩm
   * @param {string} status - Trạng thái mới
   * @param {Object} user - Thông tin người dùng
   * @returns {Promise<Object>} - Sản phẩm đã cập nhật
   */
  async updateProductStatus(productId, status, user) {
    try {
      logger.info('Cập nhật trạng thái sản phẩm', { productId, status, userId: user._id });

      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        const error = new Error('Trạng thái không hợp lệ');
        error.statusCode = 400;
        error.errorCode = ERROR_CODES.INVALID_INPUT;
        throw error;
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { 
          status, 
          updatedBy: user._id,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).populate('category', 'name description');

      if (!updatedProduct) {
        const error = new Error(MESSAGES.PRODUCT_NOT_FOUND);
        error.statusCode = 404;
        error.errorCode = ERROR_CODES.PRODUCT_NOT_FOUND;
        throw error;
      }

      logger.info('Cập nhật trạng thái sản phẩm thành công', { productId, status });
      return updatedProduct;
    } catch (error) {
      logger.error('Lỗi khi cập nhật trạng thái sản phẩm', { error: error.message, productId });
      throw error;
    }
  }
}

module.exports = new ProductService();
