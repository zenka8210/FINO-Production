const { check, validationResult } = require('express-validator');

const validateOrder = [
  check('items').isArray().notEmpty().withMessage('Danh sách sản phẩm không được để trống'),
  check('items.*.quantity').isInt({ min: 1 }).withMessage('Số lượng sản phẩm phải lớn hơn 0'),
  check('items.*.price').isFloat({ min: 0 }).withMessage('Giá sản phẩm không hợp lệ'),
  check('shippingAddress.fullName').notEmpty().withMessage('Tên người nhận không được để trống'),
  check('shippingAddress.phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Số điện thoại không hợp lệ'),
  check('shippingAddress.address').notEmpty().withMessage('Địa chỉ không được để trống'),
  check('shippingAddress.city').notEmpty().withMessage('Thành phố không được để trống'),
  check('paymentMethod')
    .isIn(['COD', 'CreditCard', 'BankTransfer', 'Momo', 'ZaloPay', 'VNPay'])
    .withMessage('Phương thức thanh toán không hợp lệ'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateOrder
};
