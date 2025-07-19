// Export API client and utilities
export { 
  apiClient, 
  ApiError, 
  createApiHandler, 
  createPaginatedHandler, 
  createUploadHandler 
} from './api';

// Export utilities
export {
  cn,
  formatCurrency,
  formatDate,
  slugify,
  truncate,
  debounce
} from './utils';

// Export other lib utilities if they exist
// Add more exports as needed when other lib files are created
