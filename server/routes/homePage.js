const express = require('express');
const router = express.Router();
const homePageController = require('../controllers/homePageController');

// Get complete home page data
router.get('/', homePageController.getHomeData.bind(homePageController));

// Get individual sections
router.get('/categories', homePageController.getCategories.bind(homePageController));
router.get('/banners', homePageController.getBanners.bind(homePageController));
router.get('/featured', homePageController.getFeaturedProducts.bind(homePageController));
router.get('/new', homePageController.getNewProducts.bind(homePageController));
router.get('/sale', homePageController.getSaleProducts.bind(homePageController));
router.get('/posts', homePageController.getPosts.bind(homePageController));

// Cache management routes
router.delete('/cache', homePageController.clearCache.bind(homePageController));
router.post('/cache/preload', homePageController.preloadCache.bind(homePageController));

module.exports = router;

// Get individual sections
router.get('/categories', homePageController.getCategories.bind(homePageController));
router.get('/banners', homePageController.getBanners.bind(homePageController));
router.get('/featured', homePageController.getFeaturedProducts.bind(homePageController));
router.get('/new', homePageController.getNewProducts.bind(homePageController));
router.get('/sale', homePageController.getSaleProducts.bind(homePageController));
router.get('/posts', homePageController.getPosts.bind(homePageController));

// Cache management routes
router.delete('/cache', homePageController.clearCache.bind(homePageController));
router.post('/cache/preload', homePageController.preloadCache.bind(homePageController));

module.exports = router;
