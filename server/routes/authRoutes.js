const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');

// POST /api/auth/register
// http://localhost:5000/api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
// http://localhost:5000/api/auth/login
router.post('/login', authController.login);

module.exports = router;
