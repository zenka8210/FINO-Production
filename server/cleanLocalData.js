/**
 * CLEAN LOCAL MONGODB COMPASS DATA
 * 
 * Script này sẽ xóa test data trên MongoDB local (Compass)
 * sử dụng kết nối local trong khi giữ nguyên kết nối cloud
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const chalk = require('chalk');

// Kết nối MongoDB local
const LOCAL_DB_URI = 'mongodb://localhost:27017/asm';
const CLOUD_DB_URI = process.env.DB_URI;

// Import config từ clearAllTestData.js
const CLEANUP_CONFIG = {
  defaultRecentHours: 48,
  collections: [
    'users', 'categories', 'products', 'productvariants', 'colors', 'sizes',
    'orders', 'reviews', 'wishlists', 'addresses', 'banners', 'posts',
    'vouchers', 'paymentmethods', 'carts'
  ],
  testPatterns: [
    /test/i, /demo/i, /sample/i, /dummy/i, /temp/i, /debug/i, /fake/i, /mock/i, /example/i
  ],
  testEmailPatterns: [
    /test.*@.*\.com/i, /demo.*@.*\.com/i, /sample.*@.*\.com/i, /.*test.*@.*\.com/i,
    /admin.*@shop\.com/i, /customer.*@shop\.com/i
  ],
  knownTestEmails: [
    'customer1@shop.com', 'customer2@shop.com', 'customer3@shop.com',
    'admin1@shop.com', 'admin2@shop.com', 'test@test.com',
    'demo@demo.com', 'testuser@example.com', 'admin@test.com'
  ]
};

class LocalDatabaseCleaner {
  constructor() {
    this.localClient = new MongoClient(LOCAL_DB_URI);
    this.localDb = null;
    this.totalCleaned = 0;
    this.cleanupReport = {};
  }

  async connectLocal() {
    try {
      await this.localClient.connect();
      this.localDb = this.localClient.db();
      console.log(chalk.green('🔗 Kết nối MongoDB Local thành công'));
      console.log(chalk.gray(`📍 Database: ${this.localDb.databaseName}`));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Không thể kết nối MongoDB Local:'), error.message);
      return false;
    }
  }

  async disconnectLocal() {
    try {
      await this.localClient.close();
      console.log(chalk.green('🔌 Đã ngắt kết nối MongoDB Local'));
    } catch (error) {
      console.error(chalk.red('❌ Lỗi khi ngắt kết nối:'), error.message);
    }
  }

  async getDatabaseStats() {
    console.log(chalk.blue.bold('\\n📊 === THỐNG KÊ LOCAL DATABASE ==='));
    const stats = {};
    
    for (const collectionName of CLEANUP_CONFIG.collections) {
      try {
        const collection = this.localDb.collection(collectionName);
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

  async cleanTestPatternDocuments() {
    console.log(chalk.blue.bold('\\n🔍 === XÓA LOCAL TEST DOCUMENTS ==='));
    
    for (const collectionName of CLEANUP_CONFIG.collections) {
      try {
        const collection = this.localDb.collection(collectionName);
        console.log(chalk.yellow(`\\n📂 Đang kiểm tra: ${collectionName}`));
        
        const testQueries = [];
        const textFields = [
          'name', 'title', 'description', 'code', 'email', 'username',
          'firstName', 'lastName', 'fullName', 'content', 'address',
          'addressLine', 'street', 'city', 'note', 'comment', 'slug',
          'excerpt', 'recipient', 'method', 'type', 'orderCode'
        ];
        
        for (const field of textFields) {
          for (const pattern of CLEANUP_CONFIG.testPatterns) {
            testQueries.push({ [field]: pattern });
          }
        }
        
        for (const emailPattern of CLEANUP_CONFIG.testEmailPatterns) {
          testQueries.push({ email: emailPattern });
        }
        
        if (CLEANUP_CONFIG.knownTestEmails.length > 0) {
          testQueries.push({ email: { $in: CLEANUP_CONFIG.knownTestEmails } });
        }
        
        const query = testQueries.length > 0 ? { $or: testQueries } : {};
        const docsToDelete = await collection.find(query).toArray();
        
        if (docsToDelete.length > 0) {
          console.log(chalk.cyan(`   📋 Tìm thấy ${docsToDelete.length} test documents`));
          
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

  async cleanRecentDocuments(hours = 48) {
    console.log(chalk.blue.bold(`\\n⏰ === XÓA LOCAL RECENT DOCUMENTS (${hours}h) ===`));
    
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    console.log(chalk.gray(`Xóa documents tạo sau: ${cutoffTime.toLocaleString('vi-VN')}`));
    
    for (const collectionName of CLEANUP_CONFIG.collections) {
      try {
        const collection = this.localDb.collection(collectionName);
        console.log(chalk.yellow(`\\n📂 Đang kiểm tra: ${collectionName}`));
        
        const recentQuery = {
          $or: [
            { createdAt: { $gte: cutoffTime } },
            { updatedAt: { $gte: cutoffTime } },
            { _id: { $gte: ObjectId.createFromTime(cutoffTime.getTime() / 1000) } }
          ]
        };
        
        // Bảo vệ admin users
        if (collectionName === 'users') {
          recentQuery.$and = [
            { role: { $ne: 'admin' } },
            { email: { $ne: 'admin@example.com' } }
          ];
        }
        
        const recentDocs = await collection.find(recentQuery).toArray();
        
        if (recentDocs.length > 0) {
          console.log(chalk.cyan(`   📋 Tìm thấy ${recentDocs.length} recent documents`));
          
          const deleteResult = await collection.deleteMany(recentQuery);
          console.log(chalk.green(`   ✅ Đã xóa ${deleteResult.deletedCount} documents`));
          
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

  async generateReport() {
    console.log(chalk.blue.bold('\\n📊 === BÁO CÁO LOCAL CLEANUP ==='));
    console.log(chalk.green(`🎯 Tổng documents đã xóa: ${this.totalCleaned}`));
    console.log(chalk.cyan('📋 Chi tiết theo collection:'));
    
    for (const [collection, details] of Object.entries(this.cleanupReport)) {
      const total = (details.testPatterns || 0) + (details.recent || 0);
      if (total > 0) {
        console.log(chalk.gray(`   ${collection}: ${total} total`));
      }
    }
    
    console.log(chalk.blue.bold('\\n📊 === THỐNG KÊ SAU LOCAL CLEANUP ==='));
    await this.getDatabaseStats();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const confirm = args.includes('--confirm');
  const recentHours = parseInt(args.find(arg => arg.startsWith('--recent-hours='))?.split('=')[1] || '48');
  
  if (!confirm) {
    console.log(chalk.red('❌ Cần thêm --confirm để thực hiện cleanup'));
    console.log(chalk.yellow('Ví dụ: node cleanLocalData.js --confirm'));
    console.log(chalk.yellow('Hoặc: node cleanLocalData.js --confirm --recent-hours=24'));
    return;
  }
  
  console.log(chalk.blue.bold('🧹 === LOCAL MONGODB COMPASS CLEANUP ==='));
  console.log(chalk.gray(`🕒 Bắt đầu lúc: ${new Date().toLocaleTimeString('vi-VN')} ${new Date().toLocaleDateString('vi-VN')}`));
  
  const cleaner = new LocalDatabaseCleaner();
  
  try {
    const connected = await cleaner.connectLocal();
    if (!connected) {
      console.log(chalk.red('❌ Không thể kết nối MongoDB Local. Kiểm tra MongoDB Compass có đang chạy?'));
      return;
    }
    
    await cleaner.getDatabaseStats();
    await cleaner.cleanTestPatternDocuments();
    await cleaner.cleanRecentDocuments(recentHours);
    await cleaner.generateReport();
    
    console.log(chalk.green('\\n💡 === KHUYẾN NGHỊ ==='));
    console.log(chalk.green('✅ Local database đã được cleanup thành công'));
    console.log(chalk.yellow('💡 Bây giờ cả cloud và local đều đã clean'));
    console.log(chalk.yellow('💡 Có thể chạy seed script nếu cần dữ liệu mới'));
    
  } catch (error) {
    console.error(chalk.red('❌ Lỗi trong quá trình cleanup:'), error.message);
  } finally {
    await cleaner.disconnectLocal();
    console.log(chalk.green('\\n🎉 === LOCAL CLEANUP HOÀN THÀNH ==='));
  }
}

// Chạy script
main().catch(console.error);
