/**
 * MANUAL TEST DATA CLEANUP SCRIPT
 * 
 * This script provides a comprehensive way to manually clean up test data
 * from your MongoDB database. It removes:
 * 
 * 1. All documents with "test" in their names/titles/descriptions
 * 2. Recent documents created during testing (last 2 hours)
 * 3. Orphaned references (wishlists, reviews without valid products)
 * 4. Specific test users, categories, products, etc.
 * 
 * Usage:
 * - node manualCleanupTestData.js --confirm          # Full cleanup
 * - node manualCleanupTestData.js --confirm --recent # Clean only recent data
 * - node manualCleanupTestData.js --confirm --test   # Clean only test-named data
 * 
 * IMPORTANT: This is a destructive operation. Make sure to backup your data first!
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/asm';
const chalk = require('chalk');

// Configuration
const CLEANUP_CONFIG = {
  // Time threshold for "recent" documents (2 hours by default)
  recentHours: 2,
  
  // Collections to clean up
  collections: [
    'users', 'categories', 'products', 'productvariants', 'colors', 'sizes',
    'orders', 'reviews', 'wishlists', 'addresses', 'banners', 'posts',
    'vouchers', 'paymentmethods'
  ],
  
  // Test data patterns to look for
  testPatterns: [
    /test/i,
    /demo/i,
    /sample/i,
    /dummy/i,
    /temp/i,
    /debug/i
  ],
  
  // Test email patterns
  testEmailPatterns: [
    /test.*@.*\.com/i,
    /demo.*@.*\.com/i,
    /sample.*@.*\.com/i,
    /.*test.*@.*\.com/i
  ]
};

class ManualTestDataCleanup {
  constructor() {
    this.client = new MongoClient(DB_URI);
    this.db = null;
    this.totalCleaned = 0;
    this.cleanupReport = {};
  }

  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db();
      console.log(chalk.green('🔗 Connected to MongoDB'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Failed to connect to MongoDB:'), error.message);
      return false;
    }
  }

  async disconnect() {
    try {
      await this.client.close();
      console.log(chalk.green('🔌 Disconnected from MongoDB'));
    } catch (error) {
      console.error(chalk.red('❌ Error disconnecting:'), error.message);
    }
  }

  // Clean documents with test patterns in various fields
  async cleanTestNamedDocuments() {
    console.log(chalk.blue.bold('\n🔍 === CLEANING TEST-NAMED DOCUMENTS ==='));
    
    for (const collectionName of CLEANUP_CONFIG.collections) {
      try {
        const collection = this.db.collection(collectionName);
        console.log(chalk.yellow(`\n📂 Checking collection: ${collectionName}`));
        
        // Build query for test patterns
        const testQueries = [];
        
        // Common text fields that might contain test data
        const textFields = [
          'name', 'title', 'description', 'code', 'email', 'username',
          'firstName', 'lastName', 'fullName', 'content', 'address',
          'addressLine', 'street', 'city', 'note', 'comment', 'slug',
          'excerpt', 'recipient', 'method', 'type'
        ];
        
        // Add pattern queries for each text field
        for (const field of textFields) {
          for (const pattern of CLEANUP_CONFIG.testPatterns) {
            testQueries.push({ [field]: pattern });
          }
        }
        
        // Add email pattern queries
        for (const emailPattern of CLEANUP_CONFIG.testEmailPatterns) {
          testQueries.push({ email: emailPattern });
        }
        
        // Combine all queries
        const query = testQueries.length > 0 ? { $or: testQueries } : {};
        
        // Find and show matching documents
        const docsToDelete = await collection.find(query).toArray();
        
        if (docsToDelete.length > 0) {
          console.log(chalk.cyan(`   📋 Found ${docsToDelete.length} test documents`));
          
          // Show examples
          this.showDocumentExamples(docsToDelete);
          
          // Delete the documents
          const deleteResult = await collection.deleteMany(query);
          console.log(chalk.green(`   ✅ Deleted ${deleteResult.deletedCount} documents`));
          
          this.totalCleaned += deleteResult.deletedCount;
          this.cleanupReport[collectionName] = {
            testNamed: deleteResult.deletedCount
          };
        } else {
          console.log(chalk.gray(`   ✨ No test-named documents found`));
        }
        
      } catch (error) {
        console.log(chalk.red(`   ❌ Error processing ${collectionName}:`, error.message));
      }
    }
  }

  // Clean recent documents (created in last few hours)
  async cleanRecentDocuments() {
    console.log(chalk.blue.bold('\n⏰ === CLEANING RECENT DOCUMENTS ==='));
    
    const cutoffTime = new Date(Date.now() - CLEANUP_CONFIG.recentHours * 60 * 60 * 1000);
    console.log(chalk.gray(`Cleaning documents created after: ${cutoffTime.toISOString()}`));
    
    for (const collectionName of CLEANUP_CONFIG.collections) {
      try {
        const collection = this.db.collection(collectionName);
        console.log(chalk.yellow(`\n📂 Checking collection: ${collectionName}`));
        
        const recentQuery = {
          $or: [
            { createdAt: { $gte: cutoffTime } },
            { updatedAt: { $gte: cutoffTime } },
            { _id: { $gte: ObjectId.createFromTime(cutoffTime.getTime() / 1000) } }
          ]
        };
        
        const recentDocs = await collection.find(recentQuery).toArray();
        
        if (recentDocs.length > 0) {
          console.log(chalk.cyan(`   📋 Found ${recentDocs.length} recent documents`));
          
          // Show examples
          this.showDocumentExamples(recentDocs);
          
          // Delete recent documents
          const deleteResult = await collection.deleteMany(recentQuery);
          console.log(chalk.green(`   ✅ Deleted ${deleteResult.deletedCount} recent documents`));
          
          this.totalCleaned += deleteResult.deletedCount;
          if (!this.cleanupReport[collectionName]) {
            this.cleanupReport[collectionName] = {};
          }
          this.cleanupReport[collectionName].recent = deleteResult.deletedCount;
        } else {
          console.log(chalk.gray(`   ✨ No recent documents found`));
        }
        
      } catch (error) {
        console.log(chalk.red(`   ❌ Error processing ${collectionName}:`, error.message));
      }
    }
  }

  // Clean orphaned references
  async cleanOrphanedReferences() {
    console.log(chalk.blue.bold('\n🧹 === CLEANING ORPHANED REFERENCES ==='));
    
    try {
      // Get valid product IDs
      const productsCollection = this.db.collection('products');
      const validProducts = await productsCollection.find({}, { _id: 1 }).toArray();
      const validProductIds = validProducts.map(p => p._id);
      
      console.log(chalk.gray(`Found ${validProductIds.length} valid products`));
      
      // Clean orphaned wishlists
      console.log(chalk.yellow('\n📝 Cleaning orphaned wishlists...'));
      const wishlistsCollection = this.db.collection('wishlists');
      
      const orphanedWishlistsQuery = {
        $or: [
          { product: { $nin: validProductIds } },
          { product: { $exists: false } }
        ]
      };
      
      const orphanedWishlists = await wishlistsCollection.find(orphanedWishlistsQuery).toArray();
      if (orphanedWishlists.length > 0) {
        console.log(chalk.cyan(`   📋 Found ${orphanedWishlists.length} orphaned wishlists`));
        const deleteWishlistResult = await wishlistsCollection.deleteMany(orphanedWishlistsQuery);
        console.log(chalk.green(`   ✅ Deleted ${deleteWishlistResult.deletedCount} orphaned wishlists`));
        this.totalCleaned += deleteWishlistResult.deletedCount;
      }
      
      // Clean orphaned reviews
      console.log(chalk.yellow('\n📝 Cleaning orphaned reviews...'));
      const reviewsCollection = this.db.collection('reviews');
      
      const orphanedReviewsQuery = {
        $or: [
          { product: { $nin: validProductIds } },
          { product: { $exists: false } }
        ]
      };
      
      const orphanedReviews = await reviewsCollection.find(orphanedReviewsQuery).toArray();
      if (orphanedReviews.length > 0) {
        console.log(chalk.cyan(`   📋 Found ${orphanedReviews.length} orphaned reviews`));
        const deleteReviewResult = await reviewsCollection.deleteMany(orphanedReviewsQuery);
        console.log(chalk.green(`   ✅ Deleted ${deleteReviewResult.deletedCount} orphaned reviews`));
        this.totalCleaned += deleteReviewResult.deletedCount;
      }
      
      // Clean orphaned product variants
      console.log(chalk.yellow('\n📝 Cleaning orphaned product variants...'));
      const variantsCollection = this.db.collection('productvariants');
      
      const orphanedVariantsQuery = {
        $or: [
          { product: { $nin: validProductIds } },
          { product: { $exists: false } }
        ]
      };
      
      const orphanedVariants = await variantsCollection.find(orphanedVariantsQuery).toArray();
      if (orphanedVariants.length > 0) {
        console.log(chalk.cyan(`   📋 Found ${orphanedVariants.length} orphaned variants`));
        const deleteVariantResult = await variantsCollection.deleteMany(orphanedVariantsQuery);
        console.log(chalk.green(`   ✅ Deleted ${deleteVariantResult.deletedCount} orphaned variants`));
        this.totalCleaned += deleteVariantResult.deletedCount;
      }
      
    } catch (error) {
      console.log(chalk.red('❌ Error cleaning orphaned references:'), error.message);
    }
  }

  // Clean specific test users
  async cleanTestUsers() {
    console.log(chalk.blue.bold('\n👤 === CLEANING TEST USERS ==='));
    
    try {
      const usersCollection = this.db.collection('users');
      
      // Known test user emails
      const testUserEmails = [
        'customer1@shop.com',
        'customer2@shop.com', 
        'customer3@shop.com',
        'admin1@shop.com',
        'admin2@shop.com',
        'test@test.com',
        'demo@demo.com'
      ];
      
      const testUsersQuery = {
        $or: [
          { email: { $in: testUserEmails } },
          { email: { $regex: /test.*@.*\.com/i } },
          { role: 'test' },
          { name: { $regex: /test/i } }
        ]
      };
      
      const testUsers = await usersCollection.find(testUsersQuery).toArray();
      if (testUsers.length > 0) {
        console.log(chalk.cyan(`   📋 Found ${testUsers.length} test users`));
        
        // Show examples
        testUsers.slice(0, 5).forEach((user, index) => {
          console.log(chalk.gray(`   ${index + 1}. ${user.email || user.name || user._id} (${user.role || 'no role'})`));
        });
        
        const deleteResult = await usersCollection.deleteMany(testUsersQuery);
        console.log(chalk.green(`   ✅ Deleted ${deleteResult.deletedCount} test users`));
        this.totalCleaned += deleteResult.deletedCount;
      } else {
        console.log(chalk.gray(`   ✨ No test users found`));
      }
      
    } catch (error) {
      console.log(chalk.red('❌ Error cleaning test users:'), error.message);
    }
  }

  // Show examples of documents to be deleted
  showDocumentExamples(docs) {
    const examples = docs.slice(0, 3);
    examples.forEach((doc, index) => {
      const displayFields = ['name', 'title', 'email', 'code', 'description', '_id'];
      const docInfo = displayFields
        .map(field => doc[field] ? `${field}: ${doc[field]}` : null)
        .filter(Boolean)
        .join(', ');
      console.log(chalk.gray(`   ${index + 1}. ${docInfo}`));
    });
    
    if (docs.length > 3) {
      console.log(chalk.gray(`   ... and ${docs.length - 3} more`));
    }
  }

  // Generate cleanup report
  generateReport() {
    console.log(chalk.blue.bold('\n📊 === CLEANUP REPORT ==='));
    console.log(chalk.cyan(`🎯 Total documents cleaned: ${this.totalCleaned}`));
    
    if (Object.keys(this.cleanupReport).length > 0) {
      console.log(chalk.yellow('\n📋 Breakdown by collection:'));
      for (const [collection, stats] of Object.entries(this.cleanupReport)) {
        let breakdown = [];
        if (stats.testNamed) breakdown.push(`${stats.testNamed} test-named`);
        if (stats.recent) breakdown.push(`${stats.recent} recent`);
        
        if (breakdown.length > 0) {
          console.log(chalk.gray(`   ${collection}: ${breakdown.join(', ')}`));
        }
      }
    }
    
    console.log(chalk.blue.bold('\n💡 === RECOMMENDATIONS ==='));
    if (this.totalCleaned > 0) {
      console.log(chalk.green('✅ Database cleanup completed successfully'));
      console.log(chalk.yellow('💡 Consider running your seed script to restore essential data'));
      console.log(chalk.yellow('💡 Test your application to ensure it works correctly'));
      console.log(chalk.yellow('💡 Monitor application performance after cleanup'));
    } else {
      console.log(chalk.green('✅ No test data found - database is already clean'));
    }
  }

  // Main cleanup function
  async runCleanup(options = {}) {
    const { testOnly = false, recentOnly = false, fullCleanup = true } = options;
    
    if (!await this.connect()) {
      return false;
    }
    
    try {
      console.log(chalk.blue.bold('🧹 === MANUAL TEST DATA CLEANUP ==='));
      console.log(chalk.gray(`🕒 Started at: ${new Date().toISOString()}`));
      
      if (fullCleanup || testOnly) {
        await this.cleanTestNamedDocuments();
        await this.cleanTestUsers();
      }
      
      if (fullCleanup || recentOnly) {
        await this.cleanRecentDocuments();
      }
      
      if (fullCleanup) {
        await this.cleanOrphanedReferences();
      }
      
      this.generateReport();
      
      console.log(chalk.green.bold('\n🎉 === CLEANUP COMPLETED ==='));
      return true;
      
    } catch (error) {
      console.error(chalk.red.bold('\n💥 === CLEANUP ERROR ==='));
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
  const recentOnly = args.includes('--recent');
  const testOnly = args.includes('--test');
  const helpRequested = args.includes('--help') || args.includes('-h');
  
  if (helpRequested) {
    console.log(chalk.blue.bold('📖 MANUAL TEST DATA CLEANUP - HELP'));
    console.log('');
    console.log('This script removes test data from your MongoDB database.');
    console.log('');
    console.log(chalk.yellow('Usage:'));
    console.log('  node manualCleanupTestData.js --confirm          # Full cleanup');
    console.log('  node manualCleanupTestData.js --confirm --recent # Clean only recent data');
    console.log('  node manualCleanupTestData.js --confirm --test   # Clean only test-named data');
    console.log('  node manualCleanupTestData.js --help             # Show this help');
    console.log('');
    console.log(chalk.yellow('Options:'));
    console.log('  --confirm    Required. Confirms you want to run the cleanup');
    console.log('  --recent     Clean only documents created in last 2 hours');
    console.log('  --test       Clean only documents with test patterns in names');
    console.log('  --help, -h   Show this help message');
    console.log('');
    console.log(chalk.red('⚠️  WARNING: This is a destructive operation!'));
    console.log(chalk.yellow('💡 Always backup your database before running cleanup!'));
    return;
  }
  
  if (!isConfirmed) {
    console.log(chalk.red.bold('🚨 MANUAL TEST DATA CLEANUP'));
    console.log('');
    console.log(chalk.yellow('This script will clean up test data from your database:'));
    console.log(chalk.gray('  • Documents with "test", "demo", "sample" in names'));
    console.log(chalk.gray('  • Recent documents (created in last 2 hours)'));
    console.log(chalk.gray('  • Test user accounts'));
    console.log(chalk.gray('  • Orphaned references (wishlists, reviews)'));
    console.log('');
    console.log(chalk.red.bold('⚠️  WARNING: This is a destructive operation!'));
    console.log(chalk.yellow('📱 Make sure to backup your database first!'));
    console.log('');
    console.log(chalk.cyan('Usage examples:'));
    console.log('  npm run cleanup-manual --confirm          # Full cleanup');
    console.log('  npm run cleanup-manual --confirm --recent # Recent data only');
    console.log('  npm run cleanup-manual --confirm --test   # Test-named data only');
    console.log('');
    console.log(chalk.green('To proceed, add --confirm to your command'));
    return;
  }
  
  const cleanup = new ManualTestDataCleanup();
  const options = {
    fullCleanup: !recentOnly && !testOnly,
    recentOnly,
    testOnly
  };
  
  const success = await cleanup.runCleanup(options);
  process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = { ManualTestDataCleanup };

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red.bold('💥 Script execution failed:'), error.message);
    process.exit(1);
  });
}
