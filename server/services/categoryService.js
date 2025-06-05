const Category = require('../models/categorySchema');
const { MESSAGES, ERROR_CODES } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const LoggerService = require('./loggerService');

class CategoryService {
  constructor() {
    this.logger = LoggerService;
  }

  /**
   * Tạo danh mục mới
   * @param {Object} categoryData - Dữ liệu danh mục
   * @returns {Promise<Object>} - Danh mục được tạo
   */
  async createCategory(categoryData) {
    try {
      // Kiểm tra tên danh mục đã tồn tại
      const existingCategory = await Category.findOne({ 
        name: new RegExp(`^${categoryData.name}$`, 'i') 
      });
      
      if (existingCategory) {
        throw new AppError(MESSAGES.ERROR.CATEGORY_EXISTS, 409, ERROR_CODES.DUPLICATE_ENTRY);
      }

      // Kiểm tra danh mục cha nếu có
      if (categoryData.parent) {
        const parentCategory = await Category.findById(categoryData.parent);
        if (!parentCategory) {
          throw new AppError(MESSAGES.ERROR.PARENT_CATEGORY_NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
        }
      }

      const category = new Category({
        name: categoryData.name.trim(),
        description: categoryData.description?.trim(),
        parent: categoryData.parent || null
      });

      const savedCategory = await category.save();
      await savedCategory.populate('parent', 'name');

      this.logger.info(`Danh mục được tạo thành công: ${savedCategory.name}`, {
        categoryId: savedCategory._id,
        createdBy: categoryData.createdBy
      });

      return {
        message: MESSAGES.SUCCESS.CATEGORY_CREATED,
        category: savedCategory
      };
    } catch (error) {
      this.logger.error('Lỗi khi tạo danh mục:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      // Lỗi MongoDB duplicate key
      if (error.code === 11000) {
        throw new AppError(MESSAGES.ERROR.CATEGORY_EXISTS, 409, ERROR_CODES.DUPLICATE_ENTRY);
      }
      
      throw new AppError(MESSAGES.ERROR.CATEGORY_CREATE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy tất cả danh mục
   * @param {Object} options - Tùy chọn phân trang và tìm kiếm
   * @returns {Promise<Object>} - Danh sách danh mục
   */
  async getAllCategories(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        parentOnly = false,
        includeChildren = true
      } = options;

      const skip = (page - 1) * limit;
      let query = {};

      // Tìm kiếm theo tên
      if (search) {
        query.name = new RegExp(search, 'i');
      }

      // Chỉ lấy danh mục cha
      if (parentOnly) {
        query.parent = null;
      }

      // Thực hiện truy vấn
      const categoriesQuery = Category.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 });

      if (includeChildren) {
        categoriesQuery.populate('parent', 'name');
      }

      const [categories, total] = await Promise.all([
        categoriesQuery.exec(),
        Category.countDocuments(query)
      ]);

      // Nếu yêu cầu bao gồm danh mục con, tạo cấu trúc cây
      let result = categories;
      if (includeChildren && parentOnly) {
        result = await this.buildCategoryTree(categories);
      }

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        categories: result,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          limit
        }
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy danh sách danh mục:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy danh mục theo ID
   * @param {string} categoryId - ID danh mục
   * @returns {Promise<Object>} - Thông tin danh mục
   */
  async getCategoryById(categoryId) {
    try {
      const category = await Category.findById(categoryId)
        .populate('parent', 'name description');

      if (!category) {
        throw new AppError(MESSAGES.ERROR.CATEGORY_NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
      }

      // Lấy danh mục con
      const children = await Category.find({ parent: categoryId })
        .select('name description')
        .sort({ name: 1 });

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        category: {
          ...category.toObject(),
          children
        }
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh mục ${categoryId}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Cập nhật danh mục
   * @param {string} categoryId - ID danh mục
   * @param {Object} updateData - Dữ liệu cập nhật
   * @returns {Promise<Object>} - Danh mục được cập nhật
   */
  async updateCategory(categoryId, updateData) {
    try {
      const category = await Category.findById(categoryId);
      
      if (!category) {
        throw new AppError(MESSAGES.ERROR.CATEGORY_NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
      }

      // Kiểm tra tên danh mục trùng lặp (nếu có thay đổi tên)
      if (updateData.name && updateData.name !== category.name) {
        const existingCategory = await Category.findOne({
          name: new RegExp(`^${updateData.name}$`, 'i'),
          _id: { $ne: categoryId }
        });
        
        if (existingCategory) {
          throw new AppError(MESSAGES.ERROR.CATEGORY_EXISTS, 409, ERROR_CODES.DUPLICATE_ENTRY);
        }
      }

      // Kiểm tra danh mục cha (nếu có thay đổi)
      if (updateData.parent) {
        // Không thể đặt chính nó làm danh mục cha
        if (updateData.parent === categoryId) {
          throw new AppError(
            'Không thể đặt danh mục làm cha của chính nó', 
            400, 
            ERROR_CODES.INVALID_INPUT
          );
        }

        const parentCategory = await Category.findById(updateData.parent);
        if (!parentCategory) {
          throw new AppError(MESSAGES.ERROR.PARENT_CATEGORY_NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
        }

        // Kiểm tra tránh vòng lặp trong cây danh mục
        const isDescendant = await this.isDescendantOf(updateData.parent, categoryId);
        if (isDescendant) {
          throw new AppError(
            'Không thể đặt danh mục con làm cha của danh mục cha', 
            400, 
            ERROR_CODES.INVALID_INPUT
          );
        }
      }

      // Cập nhật danh mục
      Object.assign(category, {
        name: updateData.name?.trim() || category.name,
        description: updateData.description?.trim() || category.description,
        parent: updateData.parent !== undefined ? updateData.parent : category.parent
      });

      const updatedCategory = await category.save();
      await updatedCategory.populate('parent', 'name');

      this.logger.info(`Danh mục được cập nhật: ${updatedCategory.name}`, {
        categoryId: updatedCategory._id,
        updatedBy: updateData.updatedBy
      });

      return {
        message: MESSAGES.SUCCESS.CATEGORY_UPDATED,
        category: updatedCategory
      };
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật danh mục ${categoryId}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      if (error.code === 11000) {
        throw new AppError(MESSAGES.ERROR.CATEGORY_EXISTS, 409, ERROR_CODES.DUPLICATE_ENTRY);
      }
      
      throw new AppError(MESSAGES.ERROR.CATEGORY_UPDATE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Xóa danh mục
   * @param {string} categoryId - ID danh mục
   * @returns {Promise<Object>} - Kết quả xóa
   */
  async deleteCategory(categoryId) {
    try {
      const category = await Category.findById(categoryId);
      
      if (!category) {
        throw new AppError(MESSAGES.ERROR.CATEGORY_NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
      }

      // Kiểm tra có danh mục con không
      const childCategories = await Category.countDocuments({ parent: categoryId });
      if (childCategories > 0) {
        throw new AppError(
          'Không thể xóa danh mục có danh mục con. Vui lòng xóa hoặc di chuyển danh mục con trước.',
          400,
          ERROR_CODES.CONSTRAINT_VIOLATION
        );
      }

      // TODO: Kiểm tra có sản phẩm trong danh mục không
      // const Product = require('../models/productSchema');
      // const productCount = await Product.countDocuments({ category: categoryId });
      // if (productCount > 0) {
      //   throw new AppError(
      //     'Không thể xóa danh mục có sản phẩm. Vui lòng di chuyển sản phẩm sang danh mục khác trước.',
      //     400,
      //     ERROR_CODES.CONSTRAINT_VIOLATION
      //   );
      // }

      await Category.findByIdAndDelete(categoryId);

      this.logger.info(`Danh mục được xóa: ${category.name}`, {
        categoryId: categoryId
      });

      return {
        message: MESSAGES.SUCCESS.CATEGORY_DELETED,
        deletedCategory: {
          id: categoryId,
          name: category.name
        }
      };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa danh mục ${categoryId}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(MESSAGES.ERROR.CATEGORY_DELETE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Lấy cây danh mục (danh mục cha và con)
   * @returns {Promise<Object>} - Cây danh mục
   */
  async getCategoryTree() {
    try {
      const parentCategories = await Category.find({ parent: null })
        .sort({ name: 1 });

      const categoryTree = await this.buildCategoryTree(parentCategories);

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        categories: categoryTree
      };
    } catch (error) {
      this.logger.error('Lỗi khi lấy cây danh mục:', error);
      throw new AppError(MESSAGES.ERROR.DATA_RETRIEVE_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  /**
   * Xây dựng cây danh mục
   * @param {Array} parentCategories - Danh sách danh mục cha
   * @returns {Promise<Array>} - Cây danh mục
   */
  async buildCategoryTree(parentCategories) {
    const tree = [];

    for (const parent of parentCategories) {
      const children = await Category.find({ parent: parent._id })
        .sort({ name: 1 });

      const categoryNode = {
        ...parent.toObject(),
        children: children.length > 0 ? await this.buildCategoryTree(children) : []
      };

      tree.push(categoryNode);
    }

    return tree;
  }

  /**
   * Kiểm tra xem category A có phải là con cháu của category B không
   * @param {string} ancestorId - ID danh mục tổ tiên
   * @param {string} descendantId - ID danh mục con cháu
   * @returns {Promise<boolean>} - Kết quả kiểm tra
   */
  async isDescendantOf(ancestorId, descendantId) {
    const descendant = await Category.findById(descendantId);
    
    if (!descendant || !descendant.parent) {
      return false;
    }
    
    if (descendant.parent.toString() === ancestorId) {
      return true;
    }
    
    return this.isDescendantOf(ancestorId, descendant.parent.toString());
  }

  /**
   * Tìm kiếm danh mục
   * @param {string} searchTerm - Từ khóa tìm kiếm
   * @param {Object} options - Tùy chọn tìm kiếm
   * @returns {Promise<Object>} - Kết quả tìm kiếm
   */
  async searchCategories(searchTerm, options = {}) {
    try {
      const { limit = 10 } = options;

      const categories = await Category.find({
        $or: [
          { name: new RegExp(searchTerm, 'i') },
          { description: new RegExp(searchTerm, 'i') }
        ]
      })
      .populate('parent', 'name')
      .limit(limit)
      .sort({ name: 1 });

      return {
        message: MESSAGES.SUCCESS.DATA_RETRIEVED,
        categories,
        searchTerm
      };
    } catch (error) {
      this.logger.error('Lỗi khi tìm kiếm danh mục:', error);
      throw new AppError(MESSAGES.ERROR.SEARCH_FAILED, 500, ERROR_CODES.INTERNAL_ERROR);
    }
  }
}

module.exports = CategoryService;
