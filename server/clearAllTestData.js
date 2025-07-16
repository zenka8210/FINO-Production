/**
 * COMPREHENSIVE TEST DATA CLEANUP SCRIPT
 * 
 * Script này được thiết kế đặc biệt để xóa TOÀN BỘ test data trong database
 * dựa trên cấu trúc và schema của dự án hiện tại.
 * 
 * Tính năng:
 * 1. Xóa tất cả documents có pattern test/demo/sample trong name/email/description
 * 2. Xóa tất cả documents được tạo trong khoảng thời gian gần đây (configurable)
 * 3. Xóa các orphaned references (wishlist, review, cart không có product hợp lệ)
 * 4. Xóa test users, test orders, test products
 * 5. Cleanup toàn diện với báo cáo chi tiết
 * 
 * Cách sử dụng:
 * - node clearAllTestData.js --confirm                    # Xóa toàn bộ test data
 * - node clearAllTestData.js --confirm --recent-hours=24  # Xóa data trong 24h gần nhất
 * - node clearAllTestData.js --confirm --patterns-only    # Chỉ xóa theo pattern
 * - node clearAllTestData.js --confirm --nuclear          # Xóa tất cả trừ admin users
 * 
 * ⚠️ CẢNH BÁO: Đây là thao tác phá hủy không thể hoàn tác!
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const DB_URI = process.env.DB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/asm';
const chalk = require('chalk');

// Cấu hình cleanup
const CLEANUP_CONFIG = {
  // Thời gian threshold cho "recent" documents (giờ)
  defaultRecentHours: 48,
  
  // Tất cả collections trong database (cập nhật theo schema mới nhất)
  collections: [
    'users',           // UserSchema
    'categories',      // CategorySchema  
    'products',        // ProductSchema
    'productvariants', // ProductVariantSchema
    'colors',          // ColorSchema (đã đơn giản hóa)
    'sizes',           // SizeSchema
    'orders',          // OrderSchema
    'reviews',         // ReviewSchema
    'wishlists',       // WishListSchema
    'addresses',       // AddressSchema
    'banners',         // BannerSchema
    'posts',           // PostSchema
    'vouchers',        // VoucherSchema
    'paymentmethods',  // PaymentMethodSchema
    'carts'            // CartSchema (unified cart/order system)
  ],
  
  // Test patterns để tìm kiếm
  testPatterns: [
    /test/i,
    /demo/i,
    /sample/i,
    /dummy/i,
    /temp/i,
    /debug/i,
    /fake/i,
    /mock/i,
    /example/i
  ],
  
  // Test email patterns
  testEmailPatterns: [
    /test.*@.*\.com/i,
    /demo.*@.*\.com/i,
    /sample.*@.*\.com/i,
    /.*test.*@.*\.com/i,
    /admin.*@shop\.com/i,
    /customer.*@shop\.com/i
  ],
  
  // Known test user emails (từ createTestUsers.js và similar)
  knownTestEmails: [
    'customer1@shop.com',
    'customer2@shop.com', 
    'customer3@shop.com',
    'admin1@shop.com',
    'admin2@shop.com',
    'test@test.com',
    'demo@demo.com',
    'testuser@example.com',
    'admin@test.com'
  ]
};

class ComprehensiveTestDataCleaner {
  constructor() {
    this.client = new MongoClient(DB_URI);
    this.db = null;
    this.totalCleaned = 0;
    this.cleanupReport = {};
    this.cleanupStartTime = new Date();
  }

  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db();
      console.log(chalk.green('🔗 Kết nối MongoDB thành công'));
      console.log(chalk.gray(`📍 Database: ${this.db.databaseName}`));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Không thể kết nối MongoDB:'), error.message);
      return false;
    }
  }

  async disconnect() {
    try {
      await this.client.close();
      console.log(chalk.green('🔌 Đã ngắt kết nối MongoDB'));
    } catch (error) {
      console.error(chalk.red('❌ Lỗi khi ngắt kết nối:'), error.message);
    }
  }

  // Lấy thống kê database trước khi cleanup
  async getDatabaseStats() {
    console.log(chalk.blue.bold('\n📊 === THỐNG KÊ DATABASE HIỆN TẠI ==='));
    const stats = {};
    
    for (const collectionName of CLEANUP_CONFIG.collections) {
      try {
        const collection = this.db.collection(collectionName);
        const count = await collection.countDocuments();
        stats[collectionName] = count;
        console.log(chalk.gray(`   ${collectionName}: ${count} documents`));
      } catch (error) {
        console.log(chalk.yellow(`   ${collectionName}: Collection không tồn tại`));
        stats[collectionName] = 0;
      }
    }
    
    return stats;
  }

  // Xóa documents theo test patterns
  async cleanTestPatternDocuments() {
    console.log(chalk.blue.bold('\n🔍 === XÓA DOCUMENTS THEO TEST PATTERNS ==='));
    
    for (const collectionName of CLEANUP_CONFIG.collections) {
      try {
        const collection = this.db.collection(collectionName);
        console.log(chalk.yellow(`\n📂 Đang kiểm tra: ${collectionName}`));
        
        // Build query cho test patterns
        const testQueries = [];
        
        // Các trường text có thể chứa test data
        const textFields = [
          'name', 'title', 'description', 'code', 'email', 'username',
          'firstName', 'lastName', 'fullName', 'content', 'address',
          'addressLine', 'street', 'city', 'note', 'comment', 'slug',
          'excerpt', 'recipient', 'method', 'type', 'orderCode'
        ];
        
        // Thêm pattern queries cho mỗi text field
        for (const field of textFields) {
          for (const pattern of CLEANUP_CONFIG.testPatterns) {
            testQueries.push({ [field]: pattern });
          }
        }
        
        // Thêm email pattern queries
        for (const emailPattern of CLEANUP_CONFIG.testEmailPatterns) {
          testQueries.push({ email: emailPattern });
        }
        
        // Thêm known test emails
        if (CLEANUP_CONFIG.knownTestEmails.length > 0) {
          testQueries.push({ email: { $in: CLEANUP_CONFIG.knownTestEmails } });
        }
        
        // Combine tất cả queries
        const query = testQueries.length > 0 ? { $or: testQueries } : {};
        
        // Tìm và hiển thị matching documents
        const docsToDelete = await collection.find(query).toArray();
        
        if (docsToDelete.length > 0) {
          console.log(chalk.cyan(`   📋 Tìm thấy ${docsToDelete.length} test documents`));
          
          // Hiển thị examples
          this.showDocumentExamples(docsToDelete);
          
          // Xóa documents
          const deleteResult = await collection.deleteMany(query);
          console.log(chalk.green(`   ✅ Đã xóa ${deleteResult.deletedCount} documents`));
          
          this.totalCleaned += deleteResult.deletedCount;
          this.cleanupReport[collectionName] = {
            ...this.cleanupReport[collectionName],
            testPatterns: deleteResult.deletedCount
          };
        } else {
          console.log(chalk.gray(`   ✨ Không tìm thấy test documents`));
        }
        
      } catch (error) {
        console.log(chalk.red(`   ❌ Lỗi khi xử lý ${collectionName}:`, error.message));
      }
    }
  }

  // Xóa documents được tạo gần đây
  async cleanRecentDocuments(hours = CLEANUP_CONFIG.defaultRecentHours) {
    console.log(chalk.blue.bold(`\n⏰ === XÓA DOCUMENTS TRONG ${hours} GIỜ GẦN NHẤT ===`));
    
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    console.log(chalk.gray(`Xóa documents tạo sau: ${cutoffTime.toLocaleString('vi-VN')}`));
    
    for (const collectionName of CLEANUP_CONFIG.collections) {
      try {
        const collection = this.db.collection(collectionName);
        console.log(chalk.yellow(`\n📂 Đang kiểm tra: ${collectionName}`));
        
        const recentQuery = {
          $or: [
            { createdAt: { $gte: cutoffTime } },
            { updatedAt: { $gte: cutoffTime } },
            { _id: { $gte: ObjectId.createFromTime(cutoffTime.getTime() / 1000) } }
          ]
        };
        
        // Bảo vệ admin users - KHÔNG xóa admin users trong recent cleanup
        if (collectionName === 'users') {
          recentQuery.role = { $ne: 'admin' };
        }
        
        const recentDocs = await collection.find(recentQuery).toArray();
        
        if (recentDocs.length > 0) {
          console.log(chalk.cyan(`   📋 Tìm thấy ${recentDocs.length} recent documents`));
          
          // Hiển thị examples
          this.showDocumentExamples(recentDocs);
          
          // Xóa recent documents
          const deleteResult = await collection.deleteMany(recentQuery);
          console.log(chalk.green(`   ✅ Đã xóa ${deleteResult.deletedCount} recent documents`));
          
          this.totalCleaned += deleteResult.deletedCount;
          this.cleanupReport[collectionName] = {
            ...this.cleanupReport[collectionName],
            recent: deleteResult.deletedCount
          };
        } else {
          console.log(chalk.gray(`   ✨ Không tìm thấy recent documents`));
        }
        
      } catch (error) {
        console.log(chalk.red(`   ❌ Lỗi khi xử lý ${collectionName}:`, error.message));
      }
    }
  }

  // Xóa orphaned references
  async cleanOrphanedReferences() {
    console.log(chalk.blue.bold('\n🧹 === XÓA ORPHANED REFERENCES ==='));
    
    try {
      // Lấy valid IDs
      const productsCollection = this.db.collection('products');
      const usersCollection = this.db.collection('users');
      const categoriesCollection = this.db.collection('categories');
      
      const validProducts = await productsCollection.find({}, { _id: 1 }).toArray();
      const validUsers = await usersCollection.find({}, { _id: 1 }).toArray();
      const validCategories = await categoriesCollection.find({}, { _id: 1 }).toArray();
      
      const validProductIds = validProducts.map(p => p._id);
      const validUserIds = validUsers.map(u => u._id);
      const validCategoryIds = validCategories.map(c => c._id);
      
      console.log(chalk.gray(`Valid products: ${validProductIds.length}`));
      console.log(chalk.gray(`Valid users: ${validUserIds.length}`));
      console.log(chalk.gray(`Valid categories: ${validCategoryIds.length}`));
      
      // Xóa orphaned wishlists
      await this.cleanOrphanedCollection('wishlists', 'product', validProductIds);
      await this.cleanOrphanedCollection('wishlists', 'user', validUserIds);
      
      // Xóa orphaned reviews
      await this.cleanOrphanedCollection('reviews', 'product', validProductIds);
      await this.cleanOrphanedCollection('reviews', 'user', validUserIds);
      
      // Xóa orphaned product variants
      await this.cleanOrphanedCollection('productvariants', 'product', validProductIds);
      
      // Xóa orphaned orders
      await this.cleanOrphanedCollection('orders', 'user', validUserIds);
      
      // Xóa orphaned addresses
      await this.cleanOrphanedCollection('addresses', 'user', validUserIds);
      
      // Xóa products với invalid categories
      await this.cleanOrphanedCollection('products', 'category', validCategoryIds);
      
    } catch (error) {
      console.log(chalk.red('❌ Lỗi khi xóa orphaned references:'), error.message);
    }
  }

  async cleanOrphanedCollection(collectionName, refField, validIds) {
    try {
      console.log(chalk.yellow(`\n📝 Xóa orphaned ${collectionName} (${refField})...`));
      const collection = this.db.collection(collectionName);
      
      const orphanedQuery = {
        $or: [
          { [refField]: { $nin: validIds } },
          { [refField]: { $exists: false } },
          { [refField]: null }
        ]
      };
      
      const orphanedDocs = await collection.find(orphanedQuery).toArray();
      if (orphanedDocs.length > 0) {
        console.log(chalk.cyan(`   📋 Tìm thấy ${orphanedDocs.length} orphaned documents`));
        const deleteResult = await collection.deleteMany(orphanedQuery);
        console.log(chalk.green(`   ✅ Đã xóa ${deleteResult.deletedCount} orphaned documents`));
        this.totalCleaned += deleteResult.deletedCount;
        
        this.cleanupReport[collectionName] = {
          ...this.cleanupReport[collectionName],
          orphaned: (this.cleanupReport[collectionName]?.orphaned || 0) + deleteResult.deletedCount
        };
      } else {
        console.log(chalk.gray(`   ✨ Không tìm thấy orphaned documents`));
      }
    } catch (error) {
      console.log(chalk.red(`   ❌ Lỗi khi xóa orphaned ${collectionName}:`, error.message));
    }
  }

  // Nuclear option - xóa tất cả trừ admin users
  async nuclearCleanup() {
    console.log(chalk.red.bold('\n☢️  === NUCLEAR CLEANUP MODE ==='));
    console.log(chalk.yellow('⚠️  Xóa TẤT CẢ dữ liệu trừ admin users!'));
    
    for (const collectionName of CLEANUP_CONFIG.collections) {
      try {
        const collection = this.db.collection(collectionName);
        console.log(chalk.yellow(`\n🗑️  Nuclear cleanup: ${collectionName}`));
        
        let query = {};
        
        // Bảo vệ admin users
        if (collectionName === 'users') {
          query = { role: { $ne: 'admin' } };
          console.log(chalk.cyan('   🛡️  Bảo vệ admin users'));
        }
        
        const docsToDelete = await collection.find(query).toArray();
        
        if (docsToDelete.length > 0) {
          console.log(chalk.cyan(`   📋 Sẽ xóa ${docsToDelete.length} documents`));
          
          const deleteResult = await collection.deleteMany(query);
          console.log(chalk.green(`   ✅ Đã xóa ${deleteResult.deletedCount} documents`));
          
          this.totalCleaned += deleteResult.deletedCount;
          this.cleanupReport[collectionName] = {
            ...this.cleanupReport[collectionName],
            nuclear: deleteResult.deletedCount
          };
        } else {
          console.log(chalk.gray(`   ✨ Collection trống hoặc chỉ có protected data`));
        }
        
      } catch (error) {
        console.log(chalk.red(`   ❌ Lỗi nuclear cleanup ${collectionName}:`, error.message));
      }
    }
  }

  // TOTAL WIPE - Xóa hoàn toàn tất cả dữ liệu (kể cả admin)
  async totalWipeDatabase() {
    console.log(chalk.red.bold('\n💥 === TOTAL DATABASE WIPE ==='));
    console.log(chalk.red.bold('⚠️⚠️⚠️  XÓA TOÀN BỘ DATABASE - KHÔNG THỂ KHÔI PHỤC! ⚠️⚠️⚠️'));
    
    for (const collectionName of CLEANUP_CONFIG.collections) {
      try {
        const collection = this.db.collection(collectionName);
        console.log(chalk.red(`\n💥 Total wipe: ${collectionName}`));
        
        const count = await collection.countDocuments();
        
        if (count > 0) {
          console.log(chalk.cyan(`   📋 Sẽ xóa ${count} documents`));
          
          const deleteResult = await collection.deleteMany({});
          console.log(chalk.green(`   ✅ Đã xóa ${deleteResult.deletedCount} documents`));
          
          this.totalCleaned += deleteResult.deletedCount;
          this.cleanupReport[collectionName] = {
            ...this.cleanupReport[collectionName],
            totalWipe: deleteResult.deletedCount
          };
        } else {
          console.log(chalk.gray(`   ✨ Collection đã trống`));
        }
        
      } catch (error) {
        console.log(chalk.red(`   ❌ Lỗi total wipe ${collectionName}:`, error.message));
      }
    }
  }

  // Xóa indexes và reset collection 
  async dropAndRecreateCollections() {
    console.log(chalk.blue.bold('\n🔄 === RESET COLLECTIONS ==='));
    
    for (const collectionName of CLEANUP_CONFIG.collections) {
      try {
        console.log(chalk.yellow(`\n🔄 Reset collection: ${collectionName}`));
        
        // Drop collection hoàn toàn
        await this.db.collection(collectionName).drop();
        console.log(chalk.green(`   ✅ Đã drop collection ${collectionName}`));
        
        // Tạo lại collection rỗng
        await this.db.createCollection(collectionName);
        console.log(chalk.green(`   ✅ Đã tạo lại collection ${collectionName}`));
        
      } catch (error) {
        if (error.message.includes('ns not found')) {
          console.log(chalk.gray(`   ℹ️  Collection ${collectionName} không tồn tại`));
        } else {
          console.log(chalk.red(`   ❌ Lỗi reset ${collectionName}:`, error.message));
        }
      }
    }
  }

  // Hiển thị examples của documents sẽ bị xóa
  showDocumentExamples(docs) {
    const examples = docs.slice(0, 3);
    examples.forEach((doc, index) => {
      const displayFields = ['name', 'title', 'email', 'code', 'orderCode', 'description', '_id'];
      const docInfo = displayFields
        .map(field => doc[field] ? `${field}: ${doc[field]}` : null)
        .filter(Boolean)
        .join(', ');
      console.log(chalk.gray(`   ${index + 1}. ${docInfo}`));
    });
    
    if (docs.length > 3) {
      console.log(chalk.gray(`   ... và ${docs.length - 3} documents khác`));
    }
  }

  // Tạo báo cáo cleanup
  async generateReport() {
    console.log(chalk.blue.bold('\n📊 === BÁO CÁO CLEANUP ==='));
    
    const cleanupDuration = (new Date() - this.cleanupStartTime) / 1000;
    console.log(chalk.cyan(`🎯 Tổng documents đã xóa: ${this.totalCleaned}`));
    console.log(chalk.cyan(`⏱️  Thời gian thực hiện: ${cleanupDuration.toFixed(2)}s`));
    
    if (Object.keys(this.cleanupReport).length > 0) {
      console.log(chalk.yellow('\n📋 Chi tiết theo collection:'));
      for (const [collection, stats] of Object.entries(this.cleanupReport)) {
        let breakdown = [];
        if (stats.testPatterns) breakdown.push(`${stats.testPatterns} test-patterns`);
        if (stats.recent) breakdown.push(`${stats.recent} recent`);
        if (stats.orphaned) breakdown.push(`${stats.orphaned} orphaned`);
        if (stats.nuclear) breakdown.push(`${stats.nuclear} nuclear`);
        if (stats.totalWipe) breakdown.push(`${stats.totalWipe} total-wipe`);
        
        if (breakdown.length > 0) {
          const total = Object.values(stats).reduce((sum, val) => sum + val, 0);
          console.log(chalk.gray(`   ${collection}: ${total} total (${breakdown.join(', ')})`));
        }
      }
    }
    
    // Thống kê database sau cleanup
    console.log(chalk.blue.bold('\n📊 === THỐNG KÊ SAU CLEANUP ==='));
    await this.getDatabaseStats();
    
    console.log(chalk.blue.bold('\n💡 === KHUYẾN NGHỊ ==='));
    if (this.totalCleaned > 0) {
      console.log(chalk.green('✅ Database đã được cleanup thành công'));
      console.log(chalk.yellow('💡 Cân nhắc chạy seed script để khôi phục dữ liệu cần thiết'));
      console.log(chalk.yellow('💡 Kiểm tra ứng dụng để đảm bảo hoạt động bình thường'));
      console.log(chalk.yellow('💡 Theo dõi hiệu suất ứng dụng sau cleanup'));
    } else {
      console.log(chalk.green('✅ Không tìm thấy test data - database đã sạch'));
    }
  }

  // Main cleanup function
  async runCleanup(options = {}) {
    const { 
      patternsOnly = false, 
      recentOnly = false, 
      nuclear = false,
      totalWipe = false,
      resetCollections = false,
      recentHours = CLEANUP_CONFIG.defaultRecentHours
    } = options;
    
    if (!await this.connect()) {
      return false;
    }
    
    try {
      console.log(chalk.blue.bold('🧹 === COMPREHENSIVE TEST DATA CLEANUP ==='));
      console.log(chalk.gray(`🕒 Bắt đầu lúc: ${this.cleanupStartTime.toLocaleString('vi-VN')}`));
      
      // Thống kê trước cleanup
      await this.getDatabaseStats();
      
      // Chọn mode cleanup
      if (resetCollections) {
        await this.dropAndRecreateCollections();
      } else if (totalWipe) {
        await this.totalWipeDatabase();
      } else if (nuclear) {
        await this.nuclearCleanup();
      } else {
        // Normal cleanup mode
        if (!recentOnly) {
          await this.cleanTestPatternDocuments();
        }
        
        if (!patternsOnly) {
          await this.cleanRecentDocuments(recentHours);
          await this.cleanOrphanedReferences();
        }
      }
      
      await this.generateReport();
      
      console.log(chalk.green.bold('\n🎉 === CLEANUP HOÀN THÀNH ==='));
      return true;
      
    } catch (error) {
      console.error(chalk.red.bold('\n💥 === LỖI CLEANUP ==='));
      console.error(chalk.red(error.message));
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const isConfirmed = args.includes('--confirm');
  const patternsOnly = args.includes('--patterns-only');
  const recentOnly = args.includes('--recent-only');
  const nuclear = args.includes('--nuclear');
  const totalWipe = args.includes('--total-wipe');
  const resetCollections = args.includes('--reset-collections');
  const helpRequested = args.includes('--help') || args.includes('-h');
  
  // Parse recent hours
  let recentHours = CLEANUP_CONFIG.defaultRecentHours;
  const recentHoursArg = args.find(arg => arg.startsWith('--recent-hours='));
  if (recentHoursArg) {
    recentHours = parseInt(recentHoursArg.split('=')[1]) || CLEANUP_CONFIG.defaultRecentHours;
  }
  
  if (helpRequested) {
    console.log(chalk.blue.bold('📖 COMPREHENSIVE TEST DATA CLEANUP - HELP'));
    console.log('');
    console.log('Script xóa toàn bộ test data trong MongoDB database với nhiều tùy chọn.');
    console.log('');
    console.log(chalk.yellow('🎯 Các mode cleanup:'));
    console.log('  1. NORMAL     - Xóa test patterns + recent data + orphaned refs');
    console.log('  2. NUCLEAR    - Xóa TẤT CẢ trừ admin users');
    console.log('  3. TOTAL WIPE - Xóa HOÀN TOÀN tất cả dữ liệu (kể cả admin)');
    console.log('  4. RESET      - Drop và tạo lại collections');
    console.log('');
    console.log(chalk.yellow('💡 Cách sử dụng:'));
    console.log('  node clearAllTestData.js --confirm                    # Normal cleanup');
    console.log('  node clearAllTestData.js --confirm --recent-hours=24  # Xóa data trong 24h');
    console.log('  node clearAllTestData.js --confirm --patterns-only    # Chỉ xóa theo pattern');
    console.log('  node clearAllTestData.js --confirm --recent-only      # Chỉ xóa recent data');
    console.log('  node clearAllTestData.js --confirm --nuclear          # Xóa tất cả (trừ admin)');
    console.log('  node clearAllTestData.js --confirm --total-wipe       # XÓA HOÀN TOÀN');
    console.log('  node clearAllTestData.js --confirm --reset-collections # Reset collections');
    console.log('  node clearAllTestData.js --help                       # Hiển thị help');
    console.log('');
    console.log(chalk.yellow('🔧 Tùy chọn:'));
    console.log('  --confirm              Bắt buộc. Xác nhận muốn chạy cleanup');
    console.log('  --patterns-only        Chỉ xóa documents có test patterns');
    console.log('  --recent-only          Chỉ xóa recent documents');
    console.log('  --recent-hours=N       Xóa documents trong N giờ gần nhất');
    console.log('  --nuclear              ☢️  Xóa tất cả trừ admin users');
    console.log('  --total-wipe           💥 XÓA HOÀN TOÀN (NGUY HIỂM!)');
    console.log('  --reset-collections    🔄 Drop và tạo lại collections');
    console.log('');
    console.log(chalk.red.bold('⚠️  CẢNH BÁO:'));
    console.log(chalk.red('  - --nuclear: Không thể hoàn tác, chỉ giữ lại admin users'));
    console.log(chalk.red('  - --total-wipe: NGUY HIỂM! Xóa tất cả kể cả admin'));
    console.log(chalk.red('  - --reset-collections: Xóa structure và data'));
    console.log('');
    console.log(chalk.green('💡 Khuyến nghị sau cleanup:'));
    console.log('  1. Chạy seed script để tạo dữ liệu mới');
    console.log('  2. Kiểm tra ứng dụng hoạt động bình thường');
    console.log('  3. Backup database sau khi đã có dữ liệu mới');
    return;
  }
  
  if (!isConfirmed) {
    console.log(chalk.red.bold('❌ Thiếu --confirm flag'));
    console.log(chalk.yellow('Script này sẽ XÓA dữ liệu không thể hoàn tác!'));
    console.log(chalk.yellow('Sử dụng --confirm để xác nhận, hoặc --help để xem hướng dẫn.'));
    process.exit(1);
  }

  // Cảnh báo đặc biệt cho các mode nguy hiểm
  if (totalWipe) {
    console.log(chalk.red.bold('💥 === TOTAL WIPE MODE ==='));
    console.log(chalk.red.bold('⚠️⚠️⚠️  SẼ XÓA HOÀN TOÀN TẤT CẢ DỮ LIỆU! ⚠️⚠️⚠️'));
    console.log(chalk.red('Bao gồm cả admin users và tất cả collections!'));
    console.log('');
  } else if (resetCollections) {
    console.log(chalk.red.bold('🔄 === RESET COLLECTIONS MODE ==='));
    console.log(chalk.red.bold('⚠️  SẼ DROP VÀ TẠO LẠI TẤT CẢ COLLECTIONS!'));
    console.log(chalk.red('Xóa cả structure và data, indexes sẽ mất!'));
    console.log('');
  } else if (nuclear) {
    console.log(chalk.red.bold('☢️  === NUCLEAR CLEANUP MODE ==='));
    console.log(chalk.yellow('Sẽ xóa TẤT CẢ dữ liệu trừ admin users!'));
    console.log('');
  }
  
  const cleaner = new ComprehensiveTestDataCleaner();
  const options = {
    patternsOnly,
    recentOnly,
    nuclear,
    totalWipe,
    resetCollections,
    recentHours
  };
  
  const success = await cleaner.runCleanup(options);
  process.exit(success ? 0 : 1);
}

// Export cho use as module
module.exports = { ComprehensiveTestDataCleaner };

// Chạy nếu gọi trực tiếp
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red.bold('💥 Script execution failed:'), error.message);
    process.exit(1);
  });
}
