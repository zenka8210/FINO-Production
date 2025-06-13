const mongoose = require('mongoose');
const ResponseHandler = require('../services/responseHandler'); 
const { MESSAGES, ERROR_CODES } = require('../config/constants');

const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const message = (MESSAGES.INVALID_INPUT || 'Dữ liệu không hợp lệ') + `: ID không hợp lệ cho trường ${paramName}`;
      const errorCode = ERROR_CODES.BAD_REQUEST || 400;
      return ResponseHandler.badRequest(res, message);
    }
    
    next();
  };
};

module.exports = validateObjectId;
