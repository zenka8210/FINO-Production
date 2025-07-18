/**
 * UNIVERSAL DATABASE CLEANER
 * 
 * Script này cho phép clean test data từ cả MongoDB Cloud và Local
 * Sử dụng:
 * - node cleanAllDatabases.js --confirm --cloud          # Clean cloud only
 * - node cleanAllDatabases.js --confirm --local          # Clean local only
 * - node cleanAllDatabases.js --confirm --both           # Clean both
 * - node cleanAllDatabases.js --confirm --both --hours=24 # Clean both, recent 24h
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const chalk = require('chalk');

const CLOUD_DB_URI = process.env.DB_URI;
const LOCAL_DB_URI = 'mongodb://localhost:27017/asm';

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

class UniversalDatabaseCleaner {
  constructor() {
    this.cloudClient = null;
    this.localClient = null;
    this.cloudDb = null;
    this.localDb = null;
    this.report = { cloud: {}, local: {} };
  }

  async connectCloud() {
    try {
      this.cloudClient = new MongoClient(CLOUD_DB_URI);
      await this.cloudClient.connect();
      this.cloudDb = this.cloudClient.db();
      console.log(chalk.green('🌐 Kết nối MongoDB Cloud thành công'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Lỗi kết nối Cloud:'), error.message);
      return false;
    }
  }

  async connectLocal() {
    try {
      this.localClient = new MongoClient(LOCAL_DB_URI);
      await this.localClient.connect();
      this.localDb = this.localClient.db();
      console.log(chalk.green('🏠 Kết nối MongoDB Local thành công'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Lỗi kết nối Local:'), error.message);
      return false;
    }
  }

  async disconnect() {
    if (this.cloudClient) await this.cloudClient.close();
    if (this.localClient) await this.localClient.close();
    console.log(chalk.green('🔌 Đã ngắt kết nối tất cả databases'));
  }

  async cleanDatabase(db, dbName) {
    console.log(chalk.blue.bold(`\\n🧹 === CLEANING ${dbName.toUpperCase()} ===`));
    
    let totalCleaned = 0;
    const report = {};

    // Clean test patterns
    console.log(chalk.cyan('🔍 Xóa test patterns...'));
    for (const collectionName of CLEANUP_CONFIG.collections) {
      try {
        const collection = db.collection(collectionName);
        
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
        const deleteResult = await collection.deleteMany(query);
        
        if (deleteResult.deletedCount > 0) {
          console.log(chalk.green(`   ${collectionName}: ${deleteResult.deletedCount} test docs`));
          totalCleaned += deleteResult.deletedCount;
          report[collectionName] = { testPatterns: deleteResult.deletedCount };
        }
        
      } catch (error) {
        console.log(chalk.red(`   ❌ ${collectionName}: ${error.message}`));
      }
    }

    // Clean recent documents
    console.log(chalk.cyan('⏰ Xóa recent documents...'));
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    for (const collectionName of CLEANUP_CONFIG.collections) {
      try {
        const collection = db.collection(collectionName);
        
        const recentQuery = {
          $or: [
            { createdAt: { $gte: cutoffTime } },
            { updatedAt: { $gte: cutoffTime } },
            { _id: { $gte: ObjectId.createFromTime(cutoffTime.getTime() / 1000) } }
          ]
        };
        
        if (collectionName === 'users') {
          recentQuery.$and = [
            { role: { $ne: 'admin' } },
            { email: { $ne: 'admin@example.com' } }
          ];
        }
        
        const deleteResult = await collection.deleteMany(recentQuery);
        
        if (deleteResult.deletedCount > 0) {
          console.log(chalk.green(`   ${collectionName}: ${deleteResult.deletedCount} recent docs`));
          totalCleaned += deleteResult.deletedCount;
          report[collectionName] = { 
            ...report[collectionName],
            recent: deleteResult.deletedCount 
          };
        }
        
      } catch (error) {
        console.log(chalk.red(`   ❌ ${collectionName}: ${error.message}`));
      }
    }

    // Clean orphaned references
    console.log(chalk.cyan('🧹 Xóa orphaned references...'));
    try {
      const validProducts = await db.collection('products').find({}).toArray();
      const validProductIds = validProducts.map(p => p._id.toString());
      
      const validUsers = await db.collection('users').find({}).toArray();
      const validUserIds = validUsers.map(u => u._id.toString());
      
      // Clean orphaned wishlists
      const orphanedWishlists = await db.collection('wishlists').deleteMany({
        $or: [
          { 'items.product': { $nin: validProductIds.map(id => ObjectId(id)) } },
          { user: { $nin: validUserIds.map(id => ObjectId(id)) } }
        ]
      });
      
      if (orphanedWishlists.deletedCount > 0) {
        console.log(chalk.green(`   wishlists: ${orphanedWishlists.deletedCount} orphaned`));
        totalCleaned += orphanedWishlists.deletedCount;
        report['wishlists'] = { 
          ...report['wishlists'],
          orphaned: orphanedWishlists.deletedCount 
        };
      }
      
    } catch (error) {
      console.log(chalk.red(`   ❌ Orphaned cleanup: ${error.message}`));
    }

    console.log(chalk.green(`\\n✅ ${dbName} cleanup: ${totalCleaned} documents xóa`));
    return { totalCleaned, report };
  }

  async generateFinalReport() {
    console.log(chalk.blue.bold('\\n📊 === BÁO CÁO TỔNG KẾT ==='));
    
    const cloudTotal = Object.values(this.report.cloud).reduce((sum, details) => {
      return sum + (details.testPatterns || 0) + (details.recent || 0) + (details.orphaned || 0);
    }, 0);
    
    const localTotal = Object.values(this.report.local).reduce((sum, details) => {
      return sum + (details.testPatterns || 0) + (details.recent || 0) + (details.orphaned || 0);
    }, 0);
    
    console.log(chalk.green(`🌐 Cloud cleanup: ${cloudTotal} documents`));
    console.log(chalk.green(`🏠 Local cleanup: ${localTotal} documents`));
    console.log(chalk.green(`🎯 Tổng cộng: ${cloudTotal + localTotal} documents`));
    
    console.log(chalk.blue('\\n💡 === KHUYẾN NGHỊ ==='));
    console.log(chalk.green('✅ Cả cloud và local đã được cleanup'));
    console.log(chalk.yellow('💡 Dữ liệu clean, sẵn sàng cho development'));
    console.log(chalk.yellow('💡 Có thể seed dữ liệu mới nếu cần'));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const confirm = args.includes('--confirm');
  const cleanCloud = args.includes('--cloud') || args.includes('--both');
  const cleanLocal = args.includes('--local') || args.includes('--both');
  const hours = parseInt(args.find(arg => arg.startsWith('--hours='))?.split('=')[1] || '48');
  
  if (!confirm) {
    console.log(chalk.red('❌ Cần --confirm để thực hiện'));
    console.log(chalk.yellow('Sử dụng:'));
    console.log(chalk.yellow('  node cleanAllDatabases.js --confirm --cloud'));
    console.log(chalk.yellow('  node cleanAllDatabases.js --confirm --local'));
    console.log(chalk.yellow('  node cleanAllDatabases.js --confirm --both'));
    console.log(chalk.yellow('  node cleanAllDatabases.js --confirm --both --hours=24'));
    return;
  }
  
  if (!cleanCloud && !cleanLocal) {
    console.log(chalk.red('❌ Cần chọn --cloud, --local, hoặc --both'));
    return;
  }
  
  console.log(chalk.blue.bold('🚀 === UNIVERSAL DATABASE CLEANER ==='));
  console.log(chalk.gray(`🕒 Bắt đầu: ${new Date().toLocaleString('vi-VN')}`));
  
  const cleaner = new UniversalDatabaseCleaner();
  
  try {
    if (cleanCloud) {
      const cloudConnected = await cleaner.connectCloud();
      if (cloudConnected) {
        const result = await cleaner.cleanDatabase(cleaner.cloudDb, 'cloud');
        cleaner.report.cloud = result.report;
      }
    }
    
    if (cleanLocal) {
      const localConnected = await cleaner.connectLocal();
      if (localConnected) {
        const result = await cleaner.cleanDatabase(cleaner.localDb, 'local');
        cleaner.report.local = result.report;
      }
    }
    
    await cleaner.generateFinalReport();
    
  } catch (error) {
    console.error(chalk.red('❌ Lỗi trong quá trình cleanup:'), error.message);
  } finally {
    await cleaner.disconnect();
    console.log(chalk.green('\\n🎉 === CLEANUP HOÀN THÀNH ==='));
  }
}

main().catch(console.error);
