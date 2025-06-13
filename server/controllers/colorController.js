const BaseController = require('./baseController');
const ColorService = require('../services/colorService');
const ResponseHandler = require('../services/responseHandler');
const { MESSAGES } = require('../config/constants');

class ColorController extends BaseController {
  constructor() {
    super(new ColorService());
  }

  getAllColors = async (req, res, next) => {
    try {
      const queryOptions = req.query;
      const result = await this.service.getAllColors(queryOptions);
      ResponseHandler.success(res, 'Colors retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getColorById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const color = await this.service.getColorById(id);
      ResponseHandler.success(res, 'Color retrieved successfully', color);
    } catch (error) {
      next(error);
    }
  };
  createColor = async (req, res, next) => {
    try {
      const colorData = req.body;
      const newColor = await this.service.createColor(colorData);
      ResponseHandler.success(res, 'Color created successfully', newColor, 201);
    } catch (error) {
      next(error);
    }
  };

  updateColor = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedColor = await this.service.updateColor(id, updateData);
      ResponseHandler.success(res, 'Color updated successfully', updatedColor);
    } catch (error) {
      next(error);
    }
  };

  deleteColor = async (req, res, next) => {
    try {
      const { id } = req.params;
      await this.service.deleteColor(id);
      ResponseHandler.success(res, 'Color deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = ColorController;
