const mongoose = require('mongoose');
const { AppError } = require('../middlewares/errorHandler');

class BaseService {
  constructor(Model) {
    this.Model = Model;
  }

  // Tạo mới
  async create(data) {
    try {
      const document = new this.Model(data);
      return await document.save();
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new AppError(`${field} đã tồn tại`, 400);
      }
      throw new AppError(error.message, 400);
    }
  }

  // Lấy tất cả với phân trang
  async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      filter = {},
      populate = '',
      select = ''
    } = options;

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
      sort = { createdAt: -1 }
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
