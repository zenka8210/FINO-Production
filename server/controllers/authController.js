const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');

// Đăng ký
exports.register = async (req, res) => {
  const { username, email, password, full_name, phone, address } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin bắt buộc' });
  }

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(409).json({ message: 'Email đã được sử dụng' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(409).json({ message: 'Username đã được sử dụng' });

    const user = new User({ username, email, password, full_name, phone, address });
    await user.save();

    res.status(201).json({ message: 'Đăng ký thành công', user: { id: user._id, email: user.email } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi đăng ký' });
  }
};


// Đăng nhập
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });

    // Tạo JWT
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi đăng nhập' });
  }
};
