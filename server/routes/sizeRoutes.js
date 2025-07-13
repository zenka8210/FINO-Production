const express = require('express');
const router = express.Router();
const SizeController = require('../controllers/sizeController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const { queryParserMiddleware } = require('../middlewares/queryMiddleware');

const sizeController = new SizeController();

// ============= PUBLIC ROUTES (No Authentication Required) =============

/**
 * @route GET /api/sizes/public
 * @description Get all sizes (public, can be used by client for selection)
 * @access Public
 */
router.get('/public', sizeController.getAllSizes);

/**
 * @route GET /api/sizes/public/:id
 * @description Get size details by ID (public)
 * @access Public
 */
router.get('/public/:id', validateObjectId('id'), sizeController.getSizeById);

/**
 * @route GET /api/sizes/enums
 * @description Get size enums (S, M, L, XL, Free Size...)
 * @access Public
 * @query {String} [category] - Category filter (clothing, shoes, accessories, all)
 */
router.get('/enums', sizeController.getSizeEnums);

/**
 * @route GET /api/sizes/enums/all
 * @description Get all available size enums
 * @access Public
 */
router.get('/enums/all', sizeController.getAllSizeEnums);

/**
 * @route GET /api/sizes/suggestions
 * @description Get size suggestions by category
 * @access Public
 * @query {String} [category] - Category (clothing, shoes, accessories)
 */
router.get('/suggestions', sizeController.getSizeSuggestions);

/**
 * @route GET /api/sizes/search
 * @description Find size by name or get suggestions
 * @access Public
 * @query {String} name - Size name to search
 */
router.get('/search', sizeController.findByNameOrSuggest);

// ============= BUSINESS LOGIC ROUTES =============

/**
 * @route POST /api/sizes/validate-name
 * @description Validate size name (uniqueness and format)
 * @access Public
 * @body {String} name - Size name to validate
 * @body {String} [excludeId] - Size ID to exclude from uniqueness check (for updates)
 */
router.post('/validate-name', sizeController.validateSizeName);

/**
 * @route GET /api/sizes/:id/validate-for-use
 * @description Validate if size can be used (exists and valid)
 * @access Public
 */
router.get('/:id/validate-for-use', validateObjectId('id'), sizeController.validateSizeForUse);

/**
 * @route GET /api/sizes/:id/usage-stats
 * @description Get size usage statistics
 * @access Private (Admin)
 */
router.get(
    '/:id/usage-stats',
    authMiddleware,
    adminMiddleware,
    validateObjectId('id'),
    sizeController.getSizeUsageStats
);

/**
 * @route GET /api/sizes/:id/can-delete
 * @description Check if size can be deleted
 * @access Private (Admin)
 */
router.get(
    '/:id/can-delete',
    authMiddleware,
    adminMiddleware,
    validateObjectId('id'),
    sizeController.canDeleteSize
);

// ============= ADMIN ROUTES (Authentication + Admin Permission Required) =============

/**
 * @route GET /api/sizes
 * @description Get all sizes with admin features (pagination, search, sorting)
 * @access Private (Admin)
 * @query {Number} [page=1] - Page number
 * @query {Number} [limit=10] - Items per page
 * @query {String} [search] - Search by name
 * @query {String} [sortBy=name] - Sort field
 * @query {String} [sortOrder=asc] - Sort order (asc/desc)
 */
router.get('/', authMiddleware, adminMiddleware, sizeController.getAllSizes);

/**
 * @route GET /api/sizes/:id
 * @description Get size details by ID (admin)
 * @access Private (Admin)
 */
router.get('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), sizeController.getSizeById);

/**
 * @route POST /api/sizes
 * @description Create new size
 * @access Private (Admin)
 * @body {String} name - Size name (required)
 */
router.post('/', authMiddleware, adminMiddleware, sizeController.createSize);

/**
 * @route PUT /api/sizes/:id
 * @description Update size by ID
 * @access Private (Admin)
 * @body {String} [name] - Size name
 */
router.put('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), sizeController.updateSize);

/**
 * @route DELETE /api/sizes/:id
 * @description Delete size by ID
 * @note Service will check if size is being used before deletion
 * @access Private (Admin)
 */
router.delete('/:id', authMiddleware, adminMiddleware, validateObjectId('id'), sizeController.deleteSize);

/**
 * @route POST /api/sizes/bulk-create-enum
 * @description Bulk create sizes from enum list
 * @access Private (Admin)
 * @body {String} [category=clothing] - Category to create sizes for
 */
router.post('/bulk-create-enum', authMiddleware, adminMiddleware, sizeController.bulkCreateSizesFromEnum);

module.exports = router;
