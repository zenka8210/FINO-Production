const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục logs tồn tại
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Format cho console logs - màu sắc và có thông tin thời gian
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] ${level}: ${message} ${metaString}`;
  })
);

// Format cho file logs - có timestamp và dạng JSON
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

/**
 * Logger service sử dụng winston
 * - Ghi log errors vào error.log
 * - Ghi tất cả các logs vào combined.log
 * - Hiển thị logs trên console khi không ở chế độ production
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'api-server' },
  transports: [
    // Log error riêng
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Log HTTP requests riêng
    new winston.transports.File({ 
      filename: path.join(logsDir, 'http.log'), 
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 5, 
    }),
    // Log tất cả các levels
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  ],
  // Không dừng ứng dụng khi gặp lỗi log
  exitOnError: false
});

// Nếu không ở môi trường production, log ra console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

/**
 * Helper function để tạo logger cho một module cụ thể
 * @param {string} module - Tên module
 */
logger.getLogger = function(module) {
  return {
    debug: (message, meta = {}) => this.debug(message, { ...meta, module }),
    info: (message, meta = {}) => this.info(message, { ...meta, module }),
    warn: (message, meta = {}) => this.warn(message, { ...meta, module }),
    error: (message, meta = {}) => this.error(message, { ...meta, module }),
    http: (message, meta = {}) => this.http(message, { ...meta, module })
  };
};

// Middleware để log HTTP requests
logger.httpLoggerMiddleware = function(req, res, next) {
  const start = Date.now();
  
  // Log khi request hoàn thành
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };
    
    // Log với mức độ phù hợp dựa trên status code
    const level = res.statusCode >= 500 ? 'error' : 
                 res.statusCode >= 400 ? 'warn' : 
                 'http';
                 
    logger.log(level, `HTTP ${req.method} ${req.originalUrl}`, logData);
  });
  
  next();
};

module.exports = logger;
