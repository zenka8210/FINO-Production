const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

const authController = new AuthController();// Changed from userController

// POST /api/auth/register - Register new user
router.post('/register', authController.register); // Changed from userController

// POST /api/auth/login - User login
router.post('/login', authController.login); // Changed from userController

module.exports = router;
