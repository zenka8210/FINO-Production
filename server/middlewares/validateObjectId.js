// Kiểm tra param id có phải là ObjectId hợp lệ không
module.exports = (req, res, next) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      validationErrors: { id: 'Giá trị không hợp lệ cho trường id' }
    });
  }
  next();
};
