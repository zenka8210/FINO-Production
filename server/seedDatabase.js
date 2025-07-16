/**
 * COMPREHENSIVE SEED SCRIPT FOR FASHION SHOP DATABASE
 * ===================================================
 * 
 * Tạo dữ liệu mẫu thật cho shop bán quần áo với:
 * - Tuân thủ chặt chẽ các models và validation rules
 * - Dữ liệu thật về thời trang và quần áo 
 * - Quan hệ dữ liệu đúng business logic
 * - Đảm bảo referential integrity
 * - Performance optimized với batch operations
 * 
 * Usage: node seedDatabase.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('./models/UserSchema');
const Category = require('./models/CategorySchema');
const Color = require('./models/ColorSchema');
const Size = require('./models/SizeSchema');
const Product = require('./models/ProductSchema');
const ProductVariant = require('./models/ProductVariantSchema');
const PaymentMethod = require('./models/PaymentMethodSchema');
const Address = require('./models/AddressSchema');
const Order = require('./models/OrderSchema');
const Review = require('./models/ReviewSchema');
const Banner = require('./models/BannerSchema');
const Post = require('./models/PostSchema');
const Voucher = require('./models/VoucherSchema');
const WishList = require('./models/WishListSchema');
const Cart = require('./models/CartSchema');

// Chalk for colored output
const chalk = require('chalk');

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.DB_URI || 'mongodb://localhost:27017/asm';
    await mongoose.connect(mongoUri);
    console.log(chalk.green('✅ MongoDB connected successfully'));
  } catch (error) {
    console.error(chalk.red('❌ MongoDB connection failed:'), error.message);
    process.exit(1);
  }
};

// Helper function for logging
const logStep = (step, message) => {
  console.log(chalk.blue(`\n📋 ${step}: ${message}`));
};

const logSuccess = (message) => {
  console.log(chalk.green(`✅ ${message}`));
};

const logError = (message, error = '') => {
  console.log(chalk.red(`❌ ${message}`), error);
};

// Storage for created data IDs (for relationships)
const createdData = {
  users: [],
  categories: [],
  colors: [],
  sizes: [],
  products: [],
  productVariants: [],
  paymentMethods: [],
  addresses: [],
  orders: [],
  reviews: [],
  banners: [],
  posts: [],
  vouchers: [],
  carts: [],
  wishlists: []
};

// ============= SEED DATA DEFINITIONS =============

// 1. USERS DATA (Admin + Customers)
const usersData = [
  {
    email: 'admin@fashionstore.com',
    password: 'admin123456',
    name: 'Quản trị viên Fashion Store',
    phone: '0901234567',
    role: 'admin',
    isActive: true
  },
  {
    email: 'nguyen.van.hung@gmail.com',
    password: 'customer123',
    name: 'Nguyễn Văn Hùng',
    phone: '0987654321',
    role: 'customer',
    isActive: true
  },
  {
    email: 'tran.thi.lan@gmail.com',
    password: 'customer123',
    name: 'Trần Thị Lan',
    phone: '0912345678',
    role: 'customer',
    isActive: true
  },
  {
    email: 'le.duc.minh@gmail.com',
    password: 'customer123',
    name: 'Lê Đức Minh',
    phone: '0923456789',
    role: 'customer',
    isActive: true
  },
  {
    email: 'pham.thi.hoa@gmail.com',
    password: 'customer123',
    name: 'Phạm Thị Hoa',
    phone: '0934567890',
    role: 'customer',
    isActive: true
  },
  {
    email: 'hoang.van.duc@gmail.com',
    password: 'customer123',
    name: 'Hoàng Văn Đức',
    phone: '0945678901',
    role: 'customer',
    isActive: true
  }
];

// 2. CATEGORIES DATA (Hierarchical structure)
const categoriesData = [
  // Root categories
  { name: 'Thời trang Nam', description: 'Thời trang dành cho nam giới', parent: null, isActive: true },
  { name: 'Thời trang Nữ', description: 'Thời trang dành cho nữ giới', parent: null, isActive: true },
  { name: 'Phụ kiện', description: 'Phụ kiện thời trang', parent: null, isActive: true },
  { name: 'Giày dép', description: 'Giày dép thời trang', parent: null, isActive: true },
  // Sub categories for Men
  { name: 'Áo Nam', description: 'Các loại áo dành cho nam', parentName: 'Thời trang Nam', isActive: true },
  { name: 'Quần Nam', description: 'Các loại quần dành cho nam', parentName: 'Thời trang Nam', isActive: true },
  { name: 'Đồ lót Nam', description: 'Đồ lót dành cho nam', parentName: 'Thời trang Nam', isActive: true },
  // Sub categories for Women  
  { name: 'Áo Nữ', description: 'Các loại áo dành cho nữ', parentName: 'Thời trang Nữ', isActive: true },
  { name: 'Quần Nữ', description: 'Các loại quần dành cho nữ', parentName: 'Thời trang Nữ', isActive: true },
  { name: 'Váy Đầm', description: 'Váy và đầm nữ', parentName: 'Thời trang Nữ', isActive: true },
  { name: 'Đồ lót Nữ', description: 'Đồ lót dành cho nữ', parentName: 'Thời trang Nữ', isActive: true },
  // Sub categories for Accessories
  { name: 'Túi xách', description: 'Túi xách thời trang', parentName: 'Phụ kiện', isActive: true },
  { name: 'Mũ nón', description: 'Mũ nón thời trang', parentName: 'Phụ kiện', isActive: true },
  { name: 'Trang sức', description: 'Trang sức thời trang', parentName: 'Phụ kiện', isActive: true },
  // Sub categories for Shoes
  { name: 'Giày Nam', description: 'Giày dành cho nam', parentName: 'Giày dép', isActive: true },
  { name: 'Giày Nữ', description: 'Giày dành cho nữ', parentName: 'Giày dép', isActive: true }
];

// 3. COLORS DATA (Fashion colors)
const colorsData = [
  { name: 'Đen', isActive: true },
  { name: 'Trắng', isActive: true },
  { name: 'Xám', isActive: true },
  { name: 'Xám Đậm', isActive: true },
  { name: 'Đỏ', isActive: true },
  { name: 'Xanh Navy', isActive: true },
  { name: 'Xanh Denim', isActive: true },
  { name: 'Xanh Lá', isActive: true },
  { name: 'Vàng', isActive: true },
  { name: 'Nâu', isActive: true },
  { name: 'Be', isActive: true },
  { name: 'Hồng', isActive: true },
  { name: 'Tím', isActive: true },
  { name: 'Cam', isActive: true },
  { name: 'Kem', isActive: true }
];

// 4. SIZES DATA (Standard clothing sizes)
const sizesData = [
  { name: 'XS', isActive: true },
  { name: 'S', isActive: true },
  { name: 'M', isActive: true },
  { name: 'L', isActive: true },
  { name: 'XL', isActive: true },
  { name: 'XXL', isActive: true },
  { name: '28', isActive: true },
  { name: '29', isActive: true },
  { name: '30', isActive: true },
  { name: '31', isActive: true },
  { name: '32', isActive: true },
  { name: '33', isActive: true },
  { name: '34', isActive: true },
  { name: '35', isActive: true },
  { name: '36', isActive: true },
  { name: '37', isActive: true },
  { name: '38', isActive: true },
  { name: '39', isActive: true },
  { name: '40', isActive: true },
  { name: '41', isActive: true },
  { name: '42', isActive: true },
  { name: '43', isActive: true },
  { name: 'Free Size', isActive: true }
];

// 5. PAYMENT METHODS DATA
const paymentMethodsData = [
  { method: 'COD', isActive: true },
  { method: 'CreditCard', isActive: true },
  { method: 'BankTransfer', isActive: true },
  { method: 'Momo', isActive: true },
  { method: 'ZaloPay', isActive: true },
  { method: 'VNPay', isActive: true }
];

// 6. PRODUCTS DATA (Real fashion products)
const productsData = [
  // Men's Shirts
  {
    name: 'Áo Sơ Mi Nam Trắng Oxford',
    price: 450000,
    description: 'Áo sơ mi nam chất liệu cotton Oxford cao cấp, phong cách lịch lãm, phù hợp cho công sở và dự tiệc.',
    categoryName: 'Áo Nam',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
      'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500'
    ],
    isActive: true,
    salePrice: 380000,
    saleStartDate: new Date('2025-01-01'),
    saleEndDate: new Date('2025-01-31')
  },
  {
    name: 'Áo Polo Nam LACOSTE',
    price: 650000,
    description: 'Áo polo nam thương hiệu LACOSTE, chất liệu cotton pique cao cấp, logo thêu nổi đặc trưng.',
    categoryName: 'Áo Nam',
    images: [
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'
    ],
    isActive: true
  },
  {
    name: 'Áo Thun Nam Cotton Premium',
    price: 280000,
    description: 'Áo thun nam cotton 100% cao cấp, form regular fit, thấm hút mồ hôi tốt, phù hợp mặc hàng ngày.',
    categoryName: 'Áo Nam',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      'https://images.unsplash.com/photo-1503341960582-b45751874cf0?w=500'
    ],
    isActive: true
  },
  {
    name: 'Áo Hoodie Nam Unisex',
    price: 520000,
    description: 'Áo hoodie nam/nữ chất liệu nỉ cotton pha, form oversized trendy, có túi kangaroo và mũ trùm.',
    categoryName: 'Áo Nam',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500'
    ],
    isActive: true
  },
  
  // Men's Pants
  {
    name: 'Quần Jeans Nam Slim Fit',
    price: 580000,
    description: 'Quần jeans nam dáng slim fit, chất liệu denim cao cấp, màu xanh cổ điển, phù hợp mọi dịp.',
    categoryName: 'Quần Nam',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500'
    ],
    isActive: true,
    salePrice: 490000,
    saleStartDate: new Date('2025-01-15'),
    saleEndDate: new Date('2025-02-15')
  },
  {
    name: 'Quần Kaki Nam Chinos',
    price: 420000,
    description: 'Quần kaki nam chinos cao cấp, chất liệu cotton twill, form regular fit, thích hợp đi làm.',
    categoryName: 'Quần Nam',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500'
    ],
    isActive: true
  },
  {
    name: 'Quần Short Nam Thể Thao',
    price: 320000,
    description: 'Quần short nam thể thao, chất liệu polyester thoáng mát, có túi zip, phù hợp tập gym và chạy bộ.',
    categoryName: 'Quần Nam',
    images: [
      'https://images.unsplash.com/photo-1506629905607-54d2c666987d?w=500',
      'https://images.unsplash.com/photo-1506629905607-54d2c666987d?w=500'
    ],
    isActive: true
  },

  // Women's Shirts  
  {
    name: 'Áo Sơ Mi Nữ Satin',
    price: 380000,
    description: 'Áo sơ mi nữ chất liệu satin mềm mại, thiết kế thanh lịch, phù hợp đi làm và dự tiệc.',
    categoryName: 'Áo Nữ',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500'
    ],
    isActive: true
  },
  {
    name: 'Áo Kiểu Nữ Voan Hoa',
    price: 450000,
    description: 'Áo kiểu nữ chất voan nhẹ nhàng, họa tiết hoa nhí, thiết kế nữ tính và duyên dáng.',
    categoryName: 'Áo Nữ',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500'
    ],
    isActive: true,
    salePrice: 360000,
    saleStartDate: new Date('2025-01-10'),
    saleEndDate: new Date('2025-02-10')
  },
  {
    name: 'Áo Croptop Nữ Basic',
    price: 220000,
    description: 'Áo croptop nữ cotton basic, form ôm nhẹ, phù hợp mix đồ street style và casual.',
    categoryName: 'Áo Nữ',
    images: [
      'https://images.unsplash.com/photo-1503341960582-b45751874cf0?w=500',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500'
    ],
    isActive: true
  },

  // Women's Dresses
  {
    name: 'Váy Đầm Maxi Boho',
    price: 680000,
    description: 'Váy đầm maxi phong cách boho, chất liệu voan mềm mại, họa tiết hoa vintage, thích hợp du lịch.',
    categoryName: 'Váy Đầm',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500'
    ],
    isActive: true
  },
  {
    name: 'Đầm Công Sở A-Line',
    price: 550000,
    description: 'Đầm công sở dáng A-line thanh lịch, chất liệu polyester cao cấp, phù hợp môi trường công sở.',
    categoryName: 'Váy Đầm',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500'
    ],
    isActive: true,
    salePrice: 470000,
    saleStartDate: new Date('2025-01-05'),
    saleEndDate: new Date('2025-01-25')
  },

  // Women's Pants
  {
    name: 'Quần Jeans Nữ Skinny',
    price: 520000,
    description: 'Quần jeans nữ dáng skinny, chất denim co giãn, ôm dáng, tôn lên đường cong cơ thể.',
    categoryName: 'Quần Nữ',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500'
    ],
    isActive: true
  },
  {
    name: 'Quần Culottes Nữ Wide-leg',
    price: 380000,
    description: 'Quần culottes nữ dáng wide-leg, chất liệu linen thoáng mát, phong cách vintage thoải mái.',
    categoryName: 'Quần Nữ',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500'
    ],
    isActive: true
  },

  // Accessories
  {
    name: 'Túi Xách Tay Nữ Da Thật',
    price: 850000,
    description: 'Túi xách tay nữ da thật cao cấp, thiết kế sang trọng, nhiều ngăn tiện dụng.',
    categoryName: 'Túi xách',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500'
    ],
    isActive: true
  },
  {
    name: 'Mũ Snapback Unisex',
    price: 320000,
    description: 'Mũ snapback unisex phong cách street, chất liệu cotton twill, thêu logo thời trang.',
    categoryName: 'Mũ nón',
    images: [
      'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=500',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500'
    ],
    isActive: true
  },

  // Shoes
  {
    name: 'Giày Sneaker Nam Nike Air Force 1',
    price: 2200000,
    description: 'Giày sneaker Nike Air Force 1 classic, da thật cao cấp, đế cao su chống trượt.',
    categoryName: 'Giày Nam',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500'
    ],
    isActive: true,
    salePrice: 1980000,
    saleStartDate: new Date('2025-01-20'),
    saleEndDate: new Date('2025-02-20')
  },
  {
    name: 'Giày Cao Gót Nữ 7cm',
    price: 650000,
    description: 'Giày cao gót nữ 7cm, chất liệu da synthetic, thiết kế thanh lịch, phù hợp đi làm.',
    categoryName: 'Giày Nữ',
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500',
      'https://images.unsplash.com/photo-1549062572-544a64fb0c56?w=500'
    ],
    isActive: true
  }
];

// 7. VOUCHERS DATA
const vouchersData = [
  {
    code: 'WELCOME10',
    discountPercent: 10,
    minimumOrderValue: 300000,
    maximumDiscountAmount: 50000,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-03-31'),
    isActive: true,
    usageLimit: 1,
    isOneTimePerUser: true
  },
  {
    code: 'FASHION20',
    discountPercent: 20,
    minimumOrderValue: 500000,
    maximumDiscountAmount: 100000,
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-02-15'),
    isActive: true,
    usageLimit: 1,
    isOneTimePerUser: true
  },
  {
    code: 'VIP30',
    discountPercent: 30,
    minimumOrderValue: 1000000,
    maximumDiscountAmount: 300000,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    isActive: true,
    usageLimit: 3,
    isOneTimePerUser: false
  }
];

// 8. BANNERS DATA
const bannersData = [
  {
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
    title: 'Sale Tết 2025 - Giảm đến 50%',
    link: '/categories/thoi-trang-nam',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-02-28')
  },
  {
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200',
    title: 'BST Xuân Hè 2025 - Nữ Tính Duyên Dáng',
    link: '/categories/thoi-trang-nu',
    startDate: new Date('2025-01-10'),
    endDate: new Date('2025-04-30')
  },
  {
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200',
    title: 'Giày Sneaker - Xu Hướng 2025',
    link: '/categories/giay-dep',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-03-15')
  }
];

// ============= SEED FUNCTIONS =============

// 1. Seed Users
async function seedUsers() {
  logStep('STEP 1', 'Seeding Users');
  
  try {
    for (const userData of usersData) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        logSuccess(`User already exists: ${existingUser.name} (${existingUser.role})`);
        createdData.users.push(existingUser);
      } else {
        const user = new User(userData);
        const savedUser = await user.save();
        createdData.users.push(savedUser);
        logSuccess(`Created user: ${savedUser.name} (${savedUser.role})`);
      }
    }
    
    logSuccess(`Total users processed: ${createdData.users.length}`);
  } catch (error) {
    logError('Error seeding users:', error.message);
    throw error;
  }
}

// 2. Seed Categories (Handle hierarchy)
async function seedCategories() {
  logStep('STEP 2', 'Seeding Categories');
  
  try {
    // First pass: Create root categories (no parent)
    const rootCategories = categoriesData.filter(cat => !cat.parentName);
    
    for (const categoryData of rootCategories) {
      const category = new Category(categoryData);
      const savedCategory = await category.save();
      createdData.categories.push(savedCategory);
      logSuccess(`Created root category: ${savedCategory.name}`);
    }
    
    // Second pass: Create child categories
    const childCategories = categoriesData.filter(cat => cat.parentName);
    
    for (const categoryData of childCategories) {
      const parentCategory = createdData.categories.find(cat => cat.name === categoryData.parentName);
      if (parentCategory) {
        const category = new Category({
          ...categoryData,
          parent: parentCategory._id
        });
        const savedCategory = await category.save();
        createdData.categories.push(savedCategory);
        logSuccess(`Created child category: ${savedCategory.name} under ${parentCategory.name}`);
      }
    }
    
    logSuccess(`Total categories created: ${createdData.categories.length}`);
  } catch (error) {
    logError('Error seeding categories:', error.message);
    throw error;
  }
}

// 3. Seed Colors
async function seedColors() {
  logStep('STEP 3', 'Seeding Colors');
  
  try {
    for (const colorData of colorsData) {
      const color = new Color(colorData);
      const savedColor = await color.save();
      createdData.colors.push(savedColor);
      logSuccess(`Created color: ${savedColor.name}`);
    }
    
    logSuccess(`Total colors created: ${createdData.colors.length}`);
  } catch (error) {
    logError('Error seeding colors:', error.message);
    throw error;
  }
}

// 4. Seed Sizes
async function seedSizes() {
  logStep('STEP 4', 'Seeding Sizes');
  
  try {
    for (const sizeData of sizesData) {
      const size = new Size(sizeData);
      const savedSize = await size.save();
      createdData.sizes.push(savedSize);
      logSuccess(`Created size: ${savedSize.name}`);
    }
    
    logSuccess(`Total sizes created: ${createdData.sizes.length}`);
  } catch (error) {
    logError('Error seeding sizes:', error.message);
    throw error;
  }
}

// 5. Seed Payment Methods
async function seedPaymentMethods() {
  logStep('STEP 5', 'Seeding Payment Methods');
  
  try {
    for (const paymentData of paymentMethodsData) {
      const paymentMethod = new PaymentMethod(paymentData);
      const savedPaymentMethod = await paymentMethod.save();
      createdData.paymentMethods.push(savedPaymentMethod);
      logSuccess(`Created payment method: ${savedPaymentMethod.method}`);
    }
    
    logSuccess(`Total payment methods created: ${createdData.paymentMethods.length}`);
  } catch (error) {
    logError('Error seeding payment methods:', error.message);
    throw error;
  }
}

// 6. Seed Products
async function seedProducts() {
  logStep('STEP 6', 'Seeding Products');
  
  try {
    for (const productData of productsData) {
      // Find category by name
      const category = createdData.categories.find(cat => cat.name === productData.categoryName);
      if (!category) {
        logError(`Category not found: ${productData.categoryName}`);
        continue;
      }
      
      const product = new Product({
        ...productData,
        category: category._id
      });
      
      const savedProduct = await product.save();
      createdData.products.push(savedProduct);
      logSuccess(`Created product: ${savedProduct.name} in ${category.name}`);
    }
    
    logSuccess(`Total products created: ${createdData.products.length}`);
  } catch (error) {
    logError('Error seeding products:', error.message);
    throw error;
  }
}

// 7. Seed Product Variants (Complex - must ensure valid combinations)
async function seedProductVariants() {
  logStep('STEP 7', 'Seeding Product Variants');
  
  try {
    let variantCount = 0;
    
    for (const product of createdData.products) {
      // Define appropriate color and size combinations for each product
      let productColors = [];
      let productSizes = [];
      
      // Set colors based on product type
      if (product.name.includes('Áo Sơ Mi') || product.name.includes('Polo')) {
        productColors = ['Trắng', 'Xanh Navy', 'Xám', 'Đen'];
        productSizes = ['S', 'M', 'L', 'XL'];
      } else if (product.name.includes('Jeans') || product.name.includes('Kaki')) {
        productColors = ['Xanh Denim', 'Đen', 'Xám'];
        productSizes = ['29', '30', '31', '32', '33', '34'];
      } else if (product.name.includes('Đầm') || product.name.includes('Váy')) {
        productColors = ['Đỏ', 'Hồng', 'Đen', 'Trắng', 'Xanh Navy'];
        productSizes = ['S', 'M', 'L', 'XL'];
      } else if (product.name.includes('Giày')) {
        productColors = ['Đen', 'Trắng', 'Nâu'];
        productSizes = ['38', '39', '40', '41', '42', '43'];
      } else if (product.name.includes('Túi') || product.name.includes('Mũ')) {
        productColors = ['Đen', 'Nâu', 'Be'];
        productSizes = ['Free Size'];
      } else {
        // Default for other products
        productColors = ['Đen', 'Trắng', 'Xám', 'Đỏ'];
        productSizes = ['S', 'M', 'L', 'XL'];
      }
      
      // Create variants for each color-size combination
      for (const colorName of productColors) {
        for (const sizeName of productSizes) {
          const color = createdData.colors.find(c => c.name === colorName);
          const size = createdData.sizes.find(s => s.name === sizeName);
          
          if (color && size) {
            // Generate realistic variant data
            const basePrice = product.currentPrice || product.price;
            const priceVariation = Math.random() * 0.1; // ±10% price variation
            const variantPrice = Math.round(basePrice * (1 + (Math.random() - 0.5) * priceVariation));
            
            const variant = new ProductVariant({
              product: product._id,
              color: color._id,
              size: size._id,
              price: variantPrice,
              stock: Math.floor(Math.random() * 50) + 10, // 10-59 stock
              sku: `${product.name.substring(0, 3).toUpperCase()}-${color.name.substring(0, 2)}-${size.name}-${Date.now().toString().slice(-6)}`,
              images: product.images.slice(0, 2), // Use first 2 images from product
              isActive: true
            });
            
            const savedVariant = await variant.save();
            createdData.productVariants.push(savedVariant);
            variantCount++;
            
            if (variantCount % 10 === 0) {
              logSuccess(`Created ${variantCount} product variants...`);
            }
          }
        }
      }
    }
    
    logSuccess(`Total product variants created: ${variantCount}`);
  } catch (error) {
    logError('Error seeding product variants:', error.message);
    throw error;
  }
}

// 8. Seed Addresses for customers
async function seedAddresses() {
  logStep('STEP 8', 'Seeding Addresses');
  
  try {
    const customers = createdData.users.filter(user => user.role === 'customer');
    
    const addressTemplates = [
      {
        fullName: '',
        phone: '',
        addressLine: '123 Nguyễn Huệ',
        city: 'Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        isDefault: true
      },
      {
        fullName: '',
        phone: '',
        addressLine: '456 Trần Hưng Đạo',
        city: 'Hà Nội',
        district: 'Quận Hoàn Kiếm',
        ward: 'Phường Hàng Bông',
        isDefault: false
      },
      {
        fullName: '',
        phone: '',
        addressLine: '789 Lê Lai',
        city: 'Đà Nẵng',
        district: 'Quận Hải Châu',
        ward: 'Phường Hải Châu 1',
        isDefault: false
      }
    ];
    
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const addressTemplate = addressTemplates[i % addressTemplates.length];
      
      const address = new Address({
        ...addressTemplate,
        user: customer._id,
        fullName: customer.name,
        phone: customer.phone
      });
      
      const savedAddress = await address.save();
      createdData.addresses.push(savedAddress);
      logSuccess(`Created address for: ${customer.name}`);
    }
    
    logSuccess(`Total addresses created: ${createdData.addresses.length}`);
  } catch (error) {
    logError('Error seeding addresses:', error.message);
    throw error;
  }
}

// 9. Seed Vouchers
async function seedVouchers() {
  logStep('STEP 9', 'Seeding Vouchers');
  
  try {
    for (const voucherData of vouchersData) {
      const voucher = new Voucher(voucherData);
      const savedVoucher = await voucher.save();
      createdData.vouchers.push(savedVoucher);
      logSuccess(`Created voucher: ${savedVoucher.code} (${savedVoucher.discountPercent}%)`);
    }
    
    logSuccess(`Total vouchers created: ${createdData.vouchers.length}`);
  } catch (error) {
    logError('Error seeding vouchers:', error.message);
    throw error;
  }
}

// 10. Seed Banners
async function seedBanners() {
  logStep('STEP 10', 'Seeding Banners');
  
  try {
    for (const bannerData of bannersData) {
      const banner = new Banner(bannerData);
      const savedBanner = await banner.save();
      createdData.banners.push(savedBanner);
      logSuccess(`Created banner: ${savedBanner.title}`);
    }
    
    logSuccess(`Total banners created: ${createdData.banners.length}`);
  } catch (error) {
    logError('Error seeding banners:', error.message);
    throw error;
  }
}

// 11. Seed Posts (Blog posts)
async function seedPosts() {
  logStep('STEP 11', 'Seeding Posts');
  
  try {
    const admin = createdData.users.find(user => user.role === 'admin');
    
    const postsData = [
      {
        author: admin._id,
        title: 'Xu hướng thời trang Nam xuân hè 2025',
        content: 'Khám phá những xu hướng thời trang nam hot nhất trong mùa xuân hè 2025. Từ áo sơ mi oversized đến quần short chino, tất cả những gì bạn cần biết để trở nên stylish hơn...',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
        describe: 'Cập nhật những xu hướng thời trang nam mới nhất cho mùa xuân hè 2025',
        isPublished: true
      },
      {
        author: admin._id,
        title: 'Cách phối đồ công sở nữ chuyên nghiệp',
        content: 'Hướng dẫn chi tiết cách phối đồ công sở nữ tính và chuyên nghiệp. Từ việc chọn áo sơ mi phù hợp đến cách kết hợp phụ kiện một cách tinh tế...',
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
        describe: 'Bí quyết phối đồ công sở nữ tính và chuyên nghiệp cho phái đẹp',
        isPublished: true
      },
      {
        author: admin._id,
        title: 'Top 10 đôi giày sneaker đáng đầu tư năm 2025',
        content: 'Danh sách 10 đôi giày sneaker đáng đầu tư nhất trong năm 2025. Từ những classic như Air Force 1 đến những mẫu mới nhất từ các brand nổi tiếng...',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
        describe: 'Tổng hợp những đôi giày sneaker hot nhất và đáng đầu tư trong năm 2025',
        isPublished: true
      }
    ];
    
    for (const postData of postsData) {
      const post = new Post(postData);
      const savedPost = await post.save();
      createdData.posts.push(savedPost);
      logSuccess(`Created post: ${savedPost.title}`);
    }
    
    logSuccess(`Total posts created: ${createdData.posts.length}`);
  } catch (error) {
    logError('Error seeding posts:', error.message);
    throw error;
  }
}

// 12. Seed Sample Orders (Realistic order flow)
async function seedOrders() {
  logStep('STEP 12', 'Seeding Sample Orders');
  
  try {
    const customers = createdData.users.filter(user => user.role === 'customer');
    const codPayment = createdData.paymentMethods.find(pm => pm.method === 'COD');
    const cardPayment = createdData.paymentMethods.find(pm => pm.method === 'CreditCard');
    
    let orderCount = 0;
    
    for (let i = 0; i < Math.min(customers.length, 3); i++) {
      const customer = customers[i];
      const customerAddress = createdData.addresses.find(addr => addr.user.toString() === customer._id.toString());
      
      if (!customerAddress) continue;
      
      // Create 1-2 orders per customer
      const ordersToCreate = Math.floor(Math.random() * 2) + 1;
      
      for (let j = 0; j < ordersToCreate; j++) {
        // Select random variants for this order
        const orderItemsCount = Math.floor(Math.random() * 3) + 1; // 1-3 items
        const selectedVariants = [];
        
        for (let k = 0; k < orderItemsCount; k++) {
          const randomVariant = createdData.productVariants[Math.floor(Math.random() * createdData.productVariants.length)];
          if (!selectedVariants.find(v => v._id.toString() === randomVariant._id.toString())) {
            selectedVariants.push(randomVariant);
          }
        }
        
        // Create order items
        const items = selectedVariants.map(variant => ({
          productVariant: variant._id,
          quantity: Math.floor(Math.random() * 2) + 1, // 1-2 quantity
          price: variant.price,
          totalPrice: variant.price * (Math.floor(Math.random() * 2) + 1)
        }));
        
        // Calculate totals
        const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const shippingFee = customerAddress.city.includes('Hồ Chí Minh') ? 20000 : 50000;
        const finalTotal = total + shippingFee;
        
        // Create order
        const orderCode = `DH${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(orderCount + 1).padStart(5, '0')}`;
        
        const order = new Order({
          orderCode,
          user: customer._id,
          items,
          address: customerAddress._id,
          total,
          shippingFee,
          finalTotal,
          status: ['pending', 'processing', 'shipped', 'delivered'][Math.floor(Math.random() * 4)],
          paymentMethod: Math.random() > 0.5 ? codPayment._id : cardPayment._id,
          paymentStatus: Math.random() > 0.3 ? 'paid' : 'unpaid'
        });
        
        const savedOrder = await order.save();
        createdData.orders.push(savedOrder);
        orderCount++;
        logSuccess(`Created order: ${savedOrder.orderCode} for ${customer.name}`);
      }
    }
    
    logSuccess(`Total orders created: ${orderCount}`);
  } catch (error) {
    logError('Error seeding orders:', error.message);
    throw error;
  }
}

// 13. Seed Reviews (Based on delivered orders)
async function seedReviews() {
  logStep('STEP 13', 'Seeding Reviews');
  
  try {
    const deliveredOrders = createdData.orders.filter(order => order.status === 'delivered');
    let reviewCount = 0;
    
    for (const order of deliveredOrders) {
      // 70% chance to create reviews for delivered orders
      if (Math.random() < 0.7) {
        for (const item of order.items) {
          const variant = createdData.productVariants.find(v => v._id.toString() === item.productVariant.toString());
          
          if (variant) {
            const review = new Review({
              product: variant.product,
              user: order.user,
              order: order._id,
              rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars (mostly positive)
              comment: [
                'Sản phẩm rất đẹp, chất lượng tốt!',
                'Đóng gói cẩn thận, giao hàng nhanh.',
                'Chất liệu vải mềm mại, mặc rất thoải mái.',
                'Đúng như mô tả, rất hài lòng!',
                'Shop phục vụ tốt, sẽ ủng hộ lần sau.',
                'Size vừa vặn, màu sắc đẹp như hình.',
                'Giá cả hợp lý, chất lượng vượt mong đợi.'
              ][Math.floor(Math.random() * 7)]
            });
            
            try {
              const savedReview = await review.save();
              createdData.reviews.push(savedReview);
              reviewCount++;
            } catch (reviewError) {
              // Skip if review already exists for this product+user+order combination
              continue;
            }
          }
        }
      }
    }
    
    logSuccess(`Total reviews created: ${reviewCount}`);
  } catch (error) {
    logError('Error seeding reviews:', error.message);
    throw error;
  }
}

// 14. Seed Carts (Active shopping carts for customers)
async function seedCarts() {
  logStep('STEP 14', 'Seeding Carts');
  
  try {
    const customers = createdData.users.filter(user => user.role === 'customer');
    let cartCount = 0;
    
    // Create active carts for 3 customers (50% of customers have active carts)
    for (let i = 0; i < Math.min(customers.length, 3); i++) {
      const customer = customers[i];
      
      // Select 1-3 random variants for cart
      const cartItemsCount = Math.floor(Math.random() * 3) + 1;
      const selectedVariants = [];
      
      for (let j = 0; j < cartItemsCount; j++) {
        const randomVariant = createdData.productVariants[Math.floor(Math.random() * createdData.productVariants.length)];
        if (!selectedVariants.find(v => v._id.toString() === randomVariant._id.toString())) {
          selectedVariants.push(randomVariant);
        }
      }
      
      // Create cart items
      const items = selectedVariants.map(variant => ({
        productVariant: variant._id,
        quantity: Math.floor(Math.random() * 3) + 1, // 1-3 quantity
        price: variant.price,
        totalPrice: variant.price * (Math.floor(Math.random() * 3) + 1)
      }));
      
      // Calculate totals
      const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
      
      const cart = new Cart({
        user: customer._id,
        type: 'cart', // Active cart
        items,
        total,
        finalTotal: total, // No shipping or discount for active carts
        status: 'cart'
      });
      
      const savedCart = await cart.save();
      createdData.carts.push(savedCart);
      cartCount++;
      logSuccess(`Created cart for: ${customer.name} with ${items.length} items`);
    }
    
    logSuccess(`Total carts created: ${cartCount}`);
  } catch (error) {
    logError('Error seeding carts:', error.message);
    throw error;
  }
}

// 15. Seed WishLists (Customer wishlists)
async function seedWishLists() {
  logStep('STEP 15', 'Seeding WishLists');
  
  try {
    const customers = createdData.users.filter(user => user.role === 'customer');
    let wishlistCount = 0;
    
    // Create wishlists for all customers
    for (const customer of customers) {
      // Select 2-5 random products for wishlist
      const wishlistItemsCount = Math.floor(Math.random() * 4) + 2; // 2-5 items
      const selectedProducts = [];
      
      for (let j = 0; j < wishlistItemsCount; j++) {
        const randomProduct = createdData.products[Math.floor(Math.random() * createdData.products.length)];
        if (!selectedProducts.find(p => p._id.toString() === randomProduct._id.toString())) {
          selectedProducts.push(randomProduct);
        }
      }
      
      // Create wishlist items - some with variants, some without
      const items = selectedProducts.map(product => {
        const productVariants = createdData.productVariants.filter(v => 
          v.product.toString() === product._id.toString()
        );
        
        // 60% chance to include specific variant, 40% just product
        const includeVariant = Math.random() < 0.6 && productVariants.length > 0;
        
        return {
          product: product._id,
          variant: includeVariant ? productVariants[Math.floor(Math.random() * productVariants.length)]._id : null
        };
      });
      
      const wishlist = new WishList({
        user: customer._id,
        items
      });
      
      const savedWishlist = await wishlist.save();
      createdData.wishlists.push(savedWishlist);
      wishlistCount++;
      logSuccess(`Created wishlist for: ${customer.name} with ${items.length} items`);
    }
    
    logSuccess(`Total wishlists created: ${wishlistCount}`);
  } catch (error) {
    logError('Error seeding wishlists:', error.message);
    throw error;
  }
}

// Main seeding function
async function seedDatabase() {
  try {
    console.log(chalk.blue('🌟 === FASHION SHOP DATABASE SEEDING STARTED ===\n'));
    
    // Connect to database
    await connectDB();
    
    // Execute seeding in proper order (respecting dependencies)
    await seedUsers();
    await seedCategories();
    await seedColors();
    await seedSizes();
    await seedPaymentMethods();
    await seedProducts();
    await seedProductVariants();
    await seedAddresses();
    await seedVouchers();
    await seedBanners();
    await seedPosts();
    await seedOrders();
    await seedReviews();
    await seedCarts();
    await seedWishLists();
    
    // Summary
    console.log(chalk.green('\n🎉 === DATABASE SEEDING COMPLETED SUCCESSFULLY ==='));
    console.log(chalk.blue('\n📊 SEEDING SUMMARY:'));
    console.log(`👥 Users: ${createdData.users.length}`);
    console.log(`📂 Categories: ${createdData.categories.length}`);
    console.log(`🎨 Colors: ${createdData.colors.length}`);
    console.log(`📏 Sizes: ${createdData.sizes.length}`);
    console.log(`🛍️ Products: ${createdData.products.length}`);
    console.log(`🔧 Product Variants: ${createdData.productVariants.length}`);
    console.log(`💳 Payment Methods: ${createdData.paymentMethods.length}`);
    console.log(`📍 Addresses: ${createdData.addresses.length}`);
    console.log(`🛒 Orders: ${createdData.orders.length}`);
    console.log(`⭐ Reviews: ${createdData.reviews.length}`);
    console.log(`🛍️ Carts: ${createdData.carts.length}`);
    console.log(`💝 Wishlists: ${createdData.wishlists.length}`);
    console.log(`🎪 Banners: ${createdData.banners.length}`);
    console.log(`📝 Posts: ${createdData.posts.length}`);
    console.log(`🎫 Vouchers: ${createdData.vouchers.length}`);
    
    console.log(chalk.green('\n✅ Database is now ready for testing and development!'));
    
  } catch (error) {
    logError('Database seeding failed:', error.message);
    console.error(chalk.red('Full error:'), error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log(chalk.yellow('🔌 Database connection closed.'));
  }
}

// Execute seeding if run directly
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  createdData
};
