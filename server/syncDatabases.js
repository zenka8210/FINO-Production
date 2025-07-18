/**
 * DATABASE SYNCHRONIZATION TOOL
 * 
 * Script đồng bộ dữ liệu giữa MongoDB Local và Cloud
 * Đảm bảo không thừa thiếu dữ liệu giữa 2 databases
 * 
 * Sử dụng:
 * - node syncDatabases.js --analyze                    # Phân tích khác biệt
 * - node syncDatabases.js --confirm --local-to-cloud  # Đồng bộ local → cloud
 * - node syncDatabases.js --confirm --cloud-to-local  # Đồng bộ cloud → local
 * - node syncDatabases.js --confirm --bidirectional   # Đồng bộ 2 chiều (merge)
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const CLOUD_DB_URI = process.env.DB_URI;
const LOCAL_DB_URI = 'mongodb://localhost:27017/asm';

const SYNC_CONFIG = {
  collections: [
    'users', 'categories', 'products', 'productvariants', 'colors', 'sizes',
    'orders', 'reviews', 'wishlists', 'addresses', 'banners', 'posts',
    'vouchers', 'paymentmethods', 'carts'
  ],
  // Các trường dùng để so sánh document uniqueness
  uniqueFields: {
    users: ['email'],
    categories: ['name', 'parent'],
    products: ['name', 'category'],
    productvariants: ['product', 'color', 'size'],
    colors: ['name'],
    sizes: ['name'],
    orders: ['orderCode'],
    reviews: ['user', 'product'],
    wishlists: ['user'],
    addresses: ['user', 'fullName', 'phone', 'addressLine'],
    banners: ['name'],
    posts: ['title', 'slug'],
    vouchers: ['code'],
    paymentmethods: ['name'],
    carts: ['user']
  },
  // Các trường không đồng bộ (system fields)
  excludeFields: ['_id', 'createdAt', 'updatedAt', '__v']
};

class DatabaseSynchronizer {
  constructor() {
    this.cloudClient = null;
    this.localClient = null;
    this.cloudDb = null;
    this.localDb = null;
    this.syncReport = {
      analyzed: {},
      synced: {},
      errors: [],
      startTime: new Date(),
      endTime: null
    };
  }

  async connectBoth() {
    try {
      // Connect to cloud
      this.cloudClient = new MongoClient(CLOUD_DB_URI);
      await this.cloudClient.connect();
      this.cloudDb = this.cloudClient.db();
      console.log(chalk.green('🌐 Kết nối MongoDB Cloud thành công'));

      // Connect to local
      this.localClient = new MongoClient(LOCAL_DB_URI);
      await this.localClient.connect();
      this.localDb = this.localClient.db();
      console.log(chalk.green('🏠 Kết nối MongoDB Local thành công'));

      return true;
    } catch (error) {
      console.error(chalk.red('❌ Lỗi kết nối databases:'), error.message);
      return false;
    }
  }

  async disconnect() {
    if (this.cloudClient) await this.cloudClient.close();
    if (this.localClient) await this.localClient.close();
    console.log(chalk.green('🔌 Đã ngắt kết nối tất cả databases'));
  }

  // Tạo hash để so sánh document uniqueness
  createDocumentHash(doc, uniqueFields) {
    const hashData = {};
    for (const field of uniqueFields) {
      if (doc[field] !== undefined) {
        hashData[field] = doc[field];
      }
    }
    return JSON.stringify(hashData);
  }

  // Làm sạch document trước khi so sánh
  cleanDocument(doc) {
    const cleaned = { ...doc };
    for (const field of SYNC_CONFIG.excludeFields) {
      delete cleaned[field];
    }
    return cleaned;
  }

  // Phân tích khác biệt giữa 2 collections
  async analyzeCollection(collectionName) {
    console.log(chalk.yellow(`\n📊 Phân tích collection: ${collectionName}`));

    try {
      const cloudCollection = this.cloudDb.collection(collectionName);
      const localCollection = this.localDb.collection(collectionName);

      const cloudDocs = await cloudCollection.find({}).toArray();
      const localDocs = await localCollection.find({}).toArray();

      console.log(chalk.gray(`   Cloud: ${cloudDocs.length} documents`));
      console.log(chalk.gray(`   Local: ${localDocs.length} documents`));

      const uniqueFields = SYNC_CONFIG.uniqueFields[collectionName] || ['_id'];
      
      // Tạo hash maps
      const cloudHashMap = new Map();
      const localHashMap = new Map();

      for (const doc of cloudDocs) {
        const hash = this.createDocumentHash(doc, uniqueFields);
        cloudHashMap.set(hash, doc);
      }

      for (const doc of localDocs) {
        const hash = this.createDocumentHash(doc, uniqueFields);
        localHashMap.set(hash, doc);
      }

      // Tìm khác biệt
      const onlyInCloud = [];
      const onlyInLocal = [];
      const different = [];

      // Documents chỉ có trong cloud
      for (const [hash, doc] of cloudHashMap) {
        if (!localHashMap.has(hash)) {
          onlyInCloud.push(doc);
        }
      }

      // Documents chỉ có trong local
      for (const [hash, doc] of localHashMap) {
        if (!cloudHashMap.has(hash)) {
          onlyInLocal.push(doc);
        } else {
          // So sánh nội dung
          const cloudDoc = cloudHashMap.get(hash);
          const cleanLocal = this.cleanDocument(doc);
          const cleanCloud = this.cleanDocument(cloudDoc);
          
          if (JSON.stringify(cleanLocal) !== JSON.stringify(cleanCloud)) {
            different.push({
              local: doc,
              cloud: cloudDoc,
              hash: hash
            });
          }
        }
      }

      const analysis = {
        cloudCount: cloudDocs.length,
        localCount: localDocs.length,
        onlyInCloud: onlyInCloud.length,
        onlyInLocal: onlyInLocal.length,
        different: different.length,
        onlyInCloudDocs: onlyInCloud,
        onlyInLocalDocs: onlyInLocal,
        differentDocs: different
      };

      this.syncReport.analyzed[collectionName] = analysis;

      // Hiển thị kết quả
      if (onlyInCloud.length > 0) {
        console.log(chalk.red(`   ⚠️  ${onlyInCloud.length} docs chỉ có trong Cloud`));
      }
      if (onlyInLocal.length > 0) {
        console.log(chalk.red(`   ⚠️  ${onlyInLocal.length} docs chỉ có trong Local`));
      }
      if (different.length > 0) {
        console.log(chalk.yellow(`   ⚠️  ${different.length} docs khác nhau`));
      }
      if (onlyInCloud.length === 0 && onlyInLocal.length === 0 && different.length === 0) {
        console.log(chalk.green(`   ✅ Đã đồng bộ hoàn hảo`));
      }

      return analysis;

    } catch (error) {
      console.error(chalk.red(`   ❌ Lỗi phân tích ${collectionName}:`, error.message));
      this.syncReport.errors.push({
        collection: collectionName,
        action: 'analyze',
        error: error.message
      });
      return null;
    }
  }

  // Đồng bộ từ local sang cloud
  async syncLocalToCloud(collectionName, analysis) {
    console.log(chalk.cyan(`\n📤 Đồng bộ ${collectionName}: Local → Cloud`));

    try {
      const cloudCollection = this.cloudDb.collection(collectionName);
      let inserted = 0;
      let updated = 0;

      // Insert documents chỉ có trong local
      if (analysis.onlyInLocalDocs.length > 0) {
        const docsToInsert = analysis.onlyInLocalDocs.map(doc => {
          const cleanDoc = { ...doc };
          delete cleanDoc._id; // Để MongoDB tự tạo _id mới
          return cleanDoc;
        });

        const insertResult = await cloudCollection.insertMany(docsToInsert);
        inserted = insertResult.insertedCount;
        console.log(chalk.green(`   ✅ Thêm ${inserted} documents mới`));
      }

      // Update documents khác nhau
      if (analysis.differentDocs.length > 0) {
        for (const diff of analysis.differentDocs) {
          const uniqueFields = SYNC_CONFIG.uniqueFields[collectionName] || ['_id'];
          const query = {};
          for (const field of uniqueFields) {
            if (diff.local[field] !== undefined) {
              query[field] = diff.local[field];
            }
          }

          const updateDoc = this.cleanDocument(diff.local);
          delete updateDoc._id;

          await cloudCollection.updateOne(query, { $set: updateDoc });
          updated++;
        }
        console.log(chalk.green(`   ✅ Cập nhật ${updated} documents`));
      }

      this.syncReport.synced[collectionName] = {
        direction: 'local-to-cloud',
        inserted,
        updated,
        deleted: 0
      };

      return { inserted, updated };

    } catch (error) {
      console.error(chalk.red(`   ❌ Lỗi đồng bộ ${collectionName}:`, error.message));
      this.syncReport.errors.push({
        collection: collectionName,
        action: 'sync-local-to-cloud',
        error: error.message
      });
      return null;
    }
  }

  // Đồng bộ từ cloud sang local
  async syncCloudToLocal(collectionName, analysis) {
    console.log(chalk.cyan(`\n📥 Đồng bộ ${collectionName}: Cloud → Local`));

    try {
      const localCollection = this.localDb.collection(collectionName);
      let inserted = 0;
      let updated = 0;

      // Insert documents chỉ có trong cloud
      if (analysis.onlyInCloudDocs.length > 0) {
        const docsToInsert = analysis.onlyInCloudDocs.map(doc => {
          const cleanDoc = { ...doc };
          delete cleanDoc._id;
          return cleanDoc;
        });

        const insertResult = await localCollection.insertMany(docsToInsert);
        inserted = insertResult.insertedCount;
        console.log(chalk.green(`   ✅ Thêm ${inserted} documents mới`));
      }

      // Update documents khác nhau
      if (analysis.differentDocs.length > 0) {
        for (const diff of analysis.differentDocs) {
          const uniqueFields = SYNC_CONFIG.uniqueFields[collectionName] || ['_id'];
          const query = {};
          for (const field of uniqueFields) {
            if (diff.cloud[field] !== undefined) {
              query[field] = diff.cloud[field];
            }
          }

          const updateDoc = this.cleanDocument(diff.cloud);
          delete updateDoc._id;

          await localCollection.updateOne(query, { $set: updateDoc });
          updated++;
        }
        console.log(chalk.green(`   ✅ Cập nhật ${updated} documents`));
      }

      this.syncReport.synced[collectionName] = {
        direction: 'cloud-to-local',
        inserted,
        updated,
        deleted: 0
      };

      return { inserted, updated };

    } catch (error) {
      console.error(chalk.red(`   ❌ Lỗi đồng bộ ${collectionName}:`, error.message));
      this.syncReport.errors.push({
        collection: collectionName,
        action: 'sync-cloud-to-local',
        error: error.message
      });
      return null;
    }
  }

  // Đồng bộ 2 chiều (merge)
  async syncBidirectional(collectionName, analysis) {
    console.log(chalk.cyan(`\n🔄 Đồng bộ ${collectionName}: Bidirectional Merge`));

    try {
      // Sync local → cloud
      const localToCloud = await this.syncLocalToCloud(collectionName, analysis);
      
      // Sync cloud → local
      const cloudToLocal = await this.syncCloudToLocal(collectionName, analysis);

      this.syncReport.synced[collectionName] = {
        direction: 'bidirectional',
        localToCloud,
        cloudToLocal
      };

      return { localToCloud, cloudToLocal };

    } catch (error) {
      console.error(chalk.red(`   ❌ Lỗi đồng bộ 2 chiều ${collectionName}:`, error.message));
      this.syncReport.errors.push({
        collection: collectionName,
        action: 'sync-bidirectional',
        error: error.message
      });
      return null;
    }
  }

  // Tạo báo cáo tổng kết
  async generateSyncReport() {
    this.syncReport.endTime = new Date();
    const duration = (this.syncReport.endTime - this.syncReport.startTime) / 1000;

    console.log(chalk.blue.bold('\n📊 === BÁO CÁO ĐỒNG BỘ ==='));
    console.log(chalk.gray(`⏱️  Thời gian: ${duration.toFixed(2)} giây`));
    console.log(chalk.gray(`📅 Bắt đầu: ${this.syncReport.startTime.toLocaleString('vi-VN')}`));
    console.log(chalk.gray(`📅 Kết thúc: ${this.syncReport.endTime.toLocaleString('vi-VN')}`));

    // Tổng kết phân tích
    console.log(chalk.cyan('\n🔍 PHÂN TÍCH:'));
    let totalDifferences = 0;
    for (const [collection, analysis] of Object.entries(this.syncReport.analyzed)) {
      const differences = (analysis.onlyInCloud || 0) + (analysis.onlyInLocal || 0) + (analysis.different || 0);
      totalDifferences += differences;
      
      if (differences > 0) {
        console.log(chalk.yellow(`   ${collection}: ${differences} khác biệt`));
      } else {
        console.log(chalk.green(`   ${collection}: ✅ Đồng bộ`));
      }
    }

    // Tổng kết đồng bộ
    if (Object.keys(this.syncReport.synced).length > 0) {
      console.log(chalk.cyan('\n🔄 ĐỒNG BỘ:'));
      let totalSynced = 0;
      for (const [collection, sync] of Object.entries(this.syncReport.synced)) {
        if (sync.direction === 'bidirectional') {
          const localToCloud = (sync.localToCloud?.inserted || 0) + (sync.localToCloud?.updated || 0);
          const cloudToLocal = (sync.cloudToLocal?.inserted || 0) + (sync.cloudToLocal?.updated || 0);
          totalSynced += localToCloud + cloudToLocal;
          console.log(chalk.green(`   ${collection}: ${localToCloud + cloudToLocal} thay đổi`));
        } else {
          const changes = (sync.inserted || 0) + (sync.updated || 0);
          totalSynced += changes;
          console.log(chalk.green(`   ${collection}: ${changes} thay đổi`));
        }
      }
      console.log(chalk.green(`\n✅ Tổng cộng: ${totalSynced} thay đổi`));
    }

    // Lỗi
    if (this.syncReport.errors.length > 0) {
      console.log(chalk.red('\n❌ LỖI:'));
      for (const error of this.syncReport.errors) {
        console.log(chalk.red(`   ${error.collection}: ${error.error}`));
      }
    }

    // Lưu báo cáo
    const reportPath = path.join(__dirname, 'sync_reports');
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const reportFile = path.join(reportPath, `sync_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(this.syncReport, null, 2));
    console.log(chalk.gray(`\n💾 Báo cáo đã lưu: ${reportFile}`));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const confirm = args.includes('--confirm');
  const analyze = args.includes('--analyze');
  const localToCloud = args.includes('--local-to-cloud');
  const cloudToLocal = args.includes('--cloud-to-local');
  const bidirectional = args.includes('--bidirectional');

  console.log(chalk.blue.bold('🔄 === DATABASE SYNCHRONIZER ==='));
  console.log(chalk.gray(`🕒 Bắt đầu: ${new Date().toLocaleString('vi-VN')}`));

  const syncer = new DatabaseSynchronizer();

  try {
    const connected = await syncer.connectBoth();
    if (!connected) {
      console.log(chalk.red('❌ Không thể kết nối databases'));
      return;
    }

    // Phân tích tất cả collections
    console.log(chalk.blue.bold('\n🔍 === PHÂN TÍCH KHÁC BIỆT ==='));
    for (const collectionName of SYNC_CONFIG.collections) {
      await syncer.analyzeCollection(collectionName);
    }

    // Nếu chỉ analyze
    if (analyze) {
      await syncer.generateSyncReport();
      return;
    }

    // Kiểm tra xác nhận
    if (!confirm) {
      console.log(chalk.yellow('\n💡 Để thực hiện đồng bộ, thêm --confirm'));
      console.log(chalk.yellow('Sử dụng:'));
      console.log(chalk.yellow('  node syncDatabases.js --confirm --local-to-cloud'));
      console.log(chalk.yellow('  node syncDatabases.js --confirm --cloud-to-local'));
      console.log(chalk.yellow('  node syncDatabases.js --confirm --bidirectional'));
      return;
    }

    // Thực hiện đồng bộ
    if (localToCloud || cloudToLocal || bidirectional) {
      console.log(chalk.blue.bold('\n🔄 === THỰC HIỆN ĐỒNG BỘ ==='));
      
      for (const collectionName of SYNC_CONFIG.collections) {
        const analysis = syncer.syncReport.analyzed[collectionName];
        if (!analysis) continue;

        const hasDifferences = analysis.onlyInCloud > 0 || analysis.onlyInLocal > 0 || analysis.different > 0;
        if (!hasDifferences) {
          console.log(chalk.green(`\n✅ ${collectionName}: Đã đồng bộ, bỏ qua`));
          continue;
        }

        if (localToCloud) {
          await syncer.syncLocalToCloud(collectionName, analysis);
        } else if (cloudToLocal) {
          await syncer.syncCloudToLocal(collectionName, analysis);
        } else if (bidirectional) {
          await syncer.syncBidirectional(collectionName, analysis);
        }
      }
    }

    await syncer.generateSyncReport();

  } catch (error) {
    console.error(chalk.red('❌ Lỗi trong quá trình đồng bộ:'), error.message);
  } finally {
    await syncer.disconnect();
    console.log(chalk.green('\n🎉 === ĐỒNG BỘ HOÀN THÀNH ==='));
  }
}

main().catch(console.error);
