const mongoose = require('mongoose');
const { AppError } = require('../middlewares/errorHandler');
const { createQueryBuilder } = require('../middlewares/queryMiddleware');
const { QueryUtils } = require('../utils/queryUtils');
const AdminSortUtils = require('../utils/adminSortUtils');

class BaseService {
  constructor(Model) {
    this.Model = Model;
  }

  // Tạo mới
  async create(data) {
    try {
      console.log('🔄 BaseService.create() - Creating new document...');
      console.log('🔄 Model name:', this.Model.modelName);
      console.log('🔄 Data received:', JSON.stringify(data, null, 2));
      
      const document = new this.Model(data);
      console.log('🔄 Document created, calling save()...');
      
      const result = await document.save();
      console.log('✅ Document saved successfully');
      return result;
    } catch (error) {
      console.log('❌ BaseService.create() error:', error);
      console.log('❌ Error message:', error.message);
      console.log('❌ Error name:', error.name);
      console.log('❌ Error stack:', error.stack);
      console.log('❌ Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new AppError(`${field} đã tồn tại`, 400);
      }
      throw new AppError(error.message, 400);
    }
  }

  // Lấy tất cả với phân trang (Enhanced with QueryBuilder)
  async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = AdminSortUtils.getDefaultSort(),
      filter = {},
      populate = '',
      select = '',
      searchFields = [],
      filterConfig = {}
    } = options;

    // Use the new QueryBuilder for enhanced functionality
    if (searchFields.length > 0 || Object.keys(filterConfig).length > 0) {
      const queryParams = {
        page,
        limit,
        sort: sort,
        select,
        populate,
        ...filter
      };

      const builder = createQueryBuilder(this.Model, queryParams)
        .paginate()
        .sortBy()
        .selectFields()
        .populateFields()
        .search(searchFields)
        .applyFilters(filterConfig);

      // Override sort if provided in options
      if (sort) {
        builder.sort = sort;
      }

      return await builder.execute();
    }

    // Fallback to legacy implementation
    const skip = (page - 1) * limit;
    
    const query = this.Model.find(filter);
    
    if (populate) query.populate(populate);
    if (select) query.select(select);
    
    const [documents, total] = await Promise.all([
      query.sort(sort).skip(skip).limit(limit).exec(),
      this.Model.countDocuments(filter)
    ]);

    return {
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Enhanced paginated query using QueryUtils
  async getPaginated(queryParams, options = {}) {
    return await QueryUtils.paginatedQuery(this.Model, queryParams, options);
  }

  // Lấy theo ID
  async getById(id, populate = '') {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('ID không hợp lệ', 400);
    }

    const query = this.Model.findById(id);
    if (populate) query.populate(populate);
    
    const document = await query.exec();
    if (!document) {
      throw new AppError('Không tìm thấy dữ liệu', 404);
    }
    
    return document;
  }

  // Cập nhật theo ID
  async updateById(id, updateData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('ID không hợp lệ', 400);
    }

    try {
      const document = await this.Model.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!document) {
        throw new AppError('Không tìm thấy dữ liệu để cập nhật', 404);
      }

      return document;
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new AppError(`${field} đã tồn tại`, 400);
      }
      throw new AppError(error.message, 400);
    }
  }

  // Xóa theo ID
  async deleteById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('ID không hợp lệ', 400);
    }

    const document = await this.Model.findByIdAndDelete(id);
    if (!document) {
      throw new AppError('Không tìm thấy dữ liệu để xóa', 404);
    }

    return document;
  }

  // Tìm kiếm
  async search(searchTerm, fields = [], options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = AdminSortUtils.getDefaultSort()
    } = options;

    const searchConditions = fields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }));

    const filter = searchConditions.length > 0 ? { $or: searchConditions } : {};
    
    return await this.getAll({ page, limit, sort, filter });
  }

  // Đếm số lượng
  async count(filter = {}) {
    return await this.Model.countDocuments(filter);
  }

  // Kiểm tra tồn tại
  async exists(filter) {
    return await this.Model.exists(filter);
  }
}

module.exports = BaseService;
