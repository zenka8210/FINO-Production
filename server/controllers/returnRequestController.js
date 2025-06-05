const BaseController = require('./baseController');
const ReturnRequestService = require('../services/returnRequestService');
const ResponseHandler = require('../services/responseHandler');
const { catchAsync } = require('../middlewares/errorHandler');

class ReturnRequestController extends BaseController {
  constructor() {
    super(null); // We don't use the base model pattern here
    this.returnRequestService = new ReturnRequestService();
  }

  // Lấy tất cả yêu cầu trả hàng (Admin)
  getAllReturnRequests = catchAsync(async (req, res) => {
    const result = await this.returnRequestService.getAllReturnRequests(req.query);
    return ResponseHandler.success(res, result, result.message);
  });

  // Lấy yêu cầu trả hàng theo ID
  getReturnRequestById = catchAsync(async (req, res) => {
    const result = await this.returnRequestService.getReturnRequestById(req.params.id);
    return ResponseHandler.success(res, result.returnRequest, result.message);
  });

  // Tạo yêu cầu trả hàng mới
  createReturnRequest = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await this.returnRequestService.createReturnRequest(userId, req.body);
    return ResponseHandler.success(res, result.returnRequest, result.message, 201);
  });

  // Cập nhật trạng thái yêu cầu trả hàng (Admin)
  updateReturnRequestStatus = catchAsync(async (req, res) => {
    const result = await this.returnRequestService.updateReturnRequestStatus(req.params.id, req.body);
    return ResponseHandler.success(res, result.returnRequest, result.message);
  });

  // Xóa yêu cầu trả hàng (User - chỉ khi pending)
  deleteReturnRequest = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await this.returnRequestService.deleteReturnRequest(req.params.id, userId);
    return ResponseHandler.success(res, null, result.message);
  });

  // Lấy yêu cầu trả hàng của người dùng hiện tại
  getMyReturnRequests = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await this.returnRequestService.getUserReturnRequests(userId, req.query);
    return ResponseHandler.success(res, result, result.message);
  });

  // Lấy thống kê yêu cầu trả hàng (Admin)
  getReturnRequestStatistics = catchAsync(async (req, res) => {
    const result = await this.returnRequestService.getReturnRequestStatistics();
    return ResponseHandler.success(res, result.statistics, result.message);
  });
}

module.exports = new ReturnRequestController();