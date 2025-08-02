const mongoose = require('mongoose');
const ResponseHandler = require('../services/responseHandler'); 
const { MESSAGES, ERROR_CODES } = require('../config/constants');

const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    console.log(`🔍 ValidateObjectId middleware called for param: ${paramName}`);
    console.log(`🔍 URL: ${req.url}`);
    console.log(`🔍 Method: ${req.method}`);
    console.log(`🔍 Params:`, req.params);
    
    const id = req.params[paramName];
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const message = (MESSAGES.INVALID_INPUT || 'Dữ liệu không hợp lệ') + `: ID không hợp lệ cho trường ${paramName}`;
      const errorCode = ERROR_CODES.BAD_REQUEST || 400;
      console.log(`❌ Invalid ObjectId for param ${paramName}:`, id);
      return ResponseHandler.badRequest(res, message);
    }
    
    console.log(`✅ Valid ObjectId for param ${paramName}:`, id);
    next();
  };
};

// Middleware mặc định cho param 'id'
const defaultValidateObjectId = validateObjectId('id');

module.exports = validateObjectId;
module.exports.default = defaultValidateObjectId;
