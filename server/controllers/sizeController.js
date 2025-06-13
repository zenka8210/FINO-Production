const BaseController = require('./baseController');
const SizeService = require('../services/sizeService');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES } = require('../config/constants');

class SizeController extends BaseController {
  constructor() {
    super(new SizeService());
  }

  getAllSizes = async (req, res, next) => {
    try {
      const queryOptions = req.query;
      const result = await this.service.getAllSizes(queryOptions);
      ResponseHandler.success(res, 'Lấy danh sách kích thước thành công', result);
    } catch (error) {
      next(error);
    }
  };

  getSizeById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const size = await this.service.getSizeById(id);
      ResponseHandler.success(res, 'Lấy chi tiết kích thước thành công', size);
    } catch (error) {
      next(error);
    }
  };
  createSize = async (req, res, next) => {
    try {
      const sizeData = req.body;
      const newSize = await this.service.createSize(sizeData);
      ResponseHandler.success(res, 'Tạo kích thước thành công', newSize, 201);
    } catch (error) {
      next(error);
    }
  };

  updateSize = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedSize = await this.service.updateSize(id, updateData);
      ResponseHandler.success(res, 'Cập nhật kích thước thành công', updatedSize);
    } catch (error) {
      next(error);
    }
  };

  deleteSize = async (req, res, next) => {
    try {
      const { id } = req.params;
      await this.service.deleteSize(id);
      ResponseHandler.success(res, 'Xóa kích thước thành công');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = SizeController;
