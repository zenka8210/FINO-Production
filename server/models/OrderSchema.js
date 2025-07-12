const mongoose = require('mongoose');

const OrderDetailsSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  productVariant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  totalPrice: { type: Number, required: true }, 
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderCode: { 
    type: String, 
    unique: true, 
    required: true,
    index: true // Tối ưu tìm kiếm
  }, // Mã đơn hàng thân thiện: DH2025071100001
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [OrderDetailsSchema],
  address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true }, // Địa chỉ giao hàng
  total: { type: Number }, // Tổng tiền trước khi áp dụng voucher và phí vận chuyển
  voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },
  discountAmount: { type: Number, default: 0 }, // Số tiền giảm giá từ voucher
  shippingFee: { type: Number, required: true }, // Phí vận chuyển (tính động)
  finalTotal: { type: Number }, // Tổng tiền sau khi áp dụng voucher và phí vận chuyển (total - discountAmount + shippingFee)
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod', required: true },
  Status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' }
}, { timestamps: true });

// Static method để generate order code
OrderSchema.statics.generateOrderCode = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  // Format: DH + YYYYMMDD + 5 digit counter
  const prefix = `DH${year}${month}${day}`;
  
  // Tìm order cuối cùng trong ngày
  const lastOrder = await this.findOne({
    orderCode: { $regex: `^${prefix}` }
  }).sort({ orderCode: -1 });
  
  let counter = 1;
  if (lastOrder) {
    const lastCounter = parseInt(lastOrder.orderCode.slice(-5));
    counter = lastCounter + 1;
  }
  
  const orderCode = prefix + String(counter).padStart(5, '0');
  return orderCode;
};

// Static method để check stock availability
OrderSchema.statics.checkStockAvailability = async function(items) {
  const ProductVariant = require('./ProductVariantSchema');
  
  for (const item of items) {
    const variant = await ProductVariant.findById(item.productVariant);
    if (!variant) {
      throw new Error(`Product variant ${item.productVariant} không tồn tại`);
    }
    
    if (variant.stock < item.quantity) {
      throw new Error(`Sản phẩm ${variant.product} không đủ số lượng. Còn lại: ${variant.stock}, yêu cầu: ${item.quantity}`);
    }
  }
  
  return true;
};

// Instance method để check if order can be reviewed
OrderSchema.methods.canBeReviewed = function() {
  return this.status === 'delivered';
};

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
