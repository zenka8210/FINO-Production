/**
 * @fileoverview Admin Sort Middleware
 * @description Middleware to automatically apply admin-friendly sorting to all admin endpoints
 * @author DATN Project
 * @version 1.0.0
 */

const AdminSortUtils = require('../utils/adminSortUtils');

/**
 * Middleware to apply admin sort to all admin endpoints
 * @param {Object} options - Configuration options
 * @param {string} options.modelName - Name of the model (optional, can be inferred from route)
 * @param {boolean} options.force - Force admin sort even for non-admin routes
 * @returns {Function} Express middleware function
 */
const adminSortMiddleware = (options = {}) => {
  return (req, res, next) => {
    try {
      const { modelName = null, force = false } = options;
      
      // Check if this is an admin request
      const isAdminRequest = req.path.includes('/admin/') || req.user?.role === 'admin' || force;
      
      if (isAdminRequest) {
        // Try to infer model name from route if not provided
        let targetModelName = modelName;
        if (!targetModelName) {
          const pathParts = req.path.split('/');
          const routeResource = pathParts[pathParts.indexOf('admin') + 1];
          
          // Map route resources to model names
          const resourceToModelMap = {
            'users': 'User',
            'orders': 'Order',
            'products': 'Product',
            'categories': 'Category',
            'reviews': 'Review',
            'posts': 'Post',
            'banners': 'Banner',
            'vouchers': 'Voucher',
            'wishlists': 'WishList',
            'cart': 'Cart',
            'colors': 'Color',
            'sizes': 'Size',
            'addresses': 'Address',
            'payments': 'PaymentMethod'
          };
          
          targetModelName = resourceToModelMap[routeResource] || 'Product';
        }
        
        // Apply admin sort to query parameters
        if (!req.query.sort && !req.query.sortBy) {
          req.query.sortBy = 'createdAt';
          req.query.sortOrder = 'desc';
        }
        
        // Mark as admin request for QueryBuilder
        req.query.isAdmin = true;
        req.query.adminSort = true;
        
        // Store parsed sort configuration
        req.adminSort = AdminSortUtils.parseAdminSort(req.query, targetModelName);
        
        console.log(`🔧 AdminSortMiddleware: Applied admin sort for ${targetModelName}:`, req.adminSort);
      }
      
      next();
    } catch (error) {
      console.error('❌ AdminSortMiddleware error:', error);
      next(error);
    }
  };
};

/**
 * Apply admin sort to specific model endpoint
 * @param {string} modelName - Name of the model
 * @returns {Function} Express middleware function
 */
const adminSortForModel = (modelName) => {
  return adminSortMiddleware({ modelName });
};

/**
 * Apply admin sort to all requests (force mode)
 * @returns {Function} Express middleware function
 */
const forceAdminSort = () => {
  return adminSortMiddleware({ force: true });
};

module.exports = {
  adminSortMiddleware,
  adminSortForModel,
  forceAdminSort
};
