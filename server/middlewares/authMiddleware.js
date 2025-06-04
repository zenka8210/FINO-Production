const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Không có token, truy cập bị từ chối' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'Token không hợp lệ' });

    req.user = user; // Gắn thông tin user vào request
    next();
  } catch (err) {
    console.error('JWT error:', err);
    res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

module.exports = authMiddleware;
