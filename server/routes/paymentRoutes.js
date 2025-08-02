const express = require('express');
const PaymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();
const paymentController = new PaymentController();

// ============= VNPAY PAYMENT ROUTES =============

// POST /api/payment/vnpay/checkout - Create VNPay session and payment URL (Authenticated) - NEW ENDPOINT
router.post('/vnpay/checkout', authMiddleware, (req, res, next) => {
  paymentController.createVNPayCheckout(req, res, next);
});

// POST /api/payment/vnpay/create - Create VNPay payment URL (Authenticated) - LEGACY ENDPOINT
router.post('/vnpay/create', authMiddleware, (req, res, next) => {
  paymentController.createVNPayPayment(req, res, next);
});

// GET /api/payment/vnpay/callback - VNPay return callback (Public)
router.get('/vnpay/callback', (req, res, next) => {
  paymentController.handleVNPayCallback(req, res, next);
});

// POST /api/payment/vnpay/callback - Process VNPay callback from frontend (Public)
router.post('/vnpay/callback', (req, res, next) => {
  paymentController.processVNPayCallback(req, res, next);
});

// POST /api/payment/vnpay/ipn - VNPay IPN handler (Public)
router.post('/vnpay/ipn', (req, res, next) => {
  paymentController.handleVNPayIPN(req, res, next);
});

// GET /api/payment/vnpay/methods - Get VNPay payment methods (Public)
router.get('/vnpay/methods', (req, res, next) => {
  paymentController.getVNPayMethods(req, res, next);
});

// POST /api/payment/vnpay/verify - Verify payment status (Authenticated)
router.post('/vnpay/verify', authMiddleware, (req, res, next) => {
  paymentController.verifyVNPayPayment(req, res, next);
});

// ============= TEST ROUTES =============

// GET /api/payment/test - Test VNPay integration (Public for testing)
router.get('/test', (req, res, next) => {
  paymentController.testVNPayIntegration(req, res, next);
});

// POST /api/payment/test-email - Test email sending with order code (Public for testing)
router.post('/test-email', (req, res, next) => {
  paymentController.testOrderEmail(req, res, next);
});

module.exports = router;
