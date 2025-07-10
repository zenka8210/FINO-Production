const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/asm';

async function comprehensiveCleanupTestData() {
  const client = new MongoClient(DB_URI);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db();
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    let totalCleaned = 0;
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      console.log(`\n🔍 Checking collection: ${collectionName}`);
      
      // Strategy 1: Find documents with any field containing "test" (case insensitive)
      const testKeywordQueries = [
        // Text fields containing "test"
        { name: { $regex: /test/i } },
        { title: { $regex: /test/i } },
        { description: { $regex: /test/i } },
        { code: { $regex: /test/i } },
        { email: { $regex: /test/i } },
        { username: { $regex: /test/i } },
        { firstName: { $regex: /test/i } },
        { lastName: { $regex: /test/i } },
        { content: { $regex: /test/i } },
        { address: { $regex: /test/i } },
        { city: { $regex: /test/i } },
        { note: { $regex: /test/i } },
        { comment: { $regex: /test/i } },
        { slug: { $regex: /test/i } },
        { excerpt: { $regex: /test/i } },
        
        // Array fields containing objects with test data
        { 'tags': { $regex: /test/i } },
        { 'keywords': { $regex: /test/i } },
        
        // Nested object fields
        { 'config.name': { $regex: /test/i } },
        { 'config.description': { $regex: /test/i } },
        { 'settings.title': { $regex: /test/i } },
        { 'meta.title': { $regex: /test/i } },
        { 'meta.description': { $regex: /test/i } }
      ];
      
      // Strategy 2: Find recent documents (last 2 hours) that might be test data
      const recentTestDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      
      const recentQuery = {
        $or: [
          { createdAt: { $gte: recentTestDate } },
          { updatedAt: { $gte: recentTestDate } }
        ]
      };
      
      // Combine all queries
      const combinedQuery = {
        $or: [
          ...testKeywordQueries,
          recentQuery
        ]
      };
      
      try {
        // Find matching documents first
        const docsToDelete = await collection.find(combinedQuery).toArray();
        
        if (docsToDelete.length > 0) {
          console.log(`   📋 Found ${docsToDelete.length} test/recent documents to delete`);
          
          // Show some examples
          docsToDelete.slice(0, 3).forEach((doc, index) => {
            const displayFields = ['name', 'title', 'email', 'code', 'description', '_id'];
            const docInfo = displayFields
              .map(field => doc[field] ? `${field}: ${doc[field]}` : null)
              .filter(Boolean)
              .join(', ');
            console.log(`   ${index + 1}. ${docInfo}`);
          });
          
          if (docsToDelete.length > 3) {
            console.log(`   ... and ${docsToDelete.length - 3} more`);
          }
          
          // Delete the documents
          const deleteResult = await collection.deleteMany(combinedQuery);
          console.log(`   ✅ Deleted ${deleteResult.deletedCount} documents from ${collectionName}`);
          totalCleaned += deleteResult.deletedCount;
          
        } else {
          console.log(`   ✨ No test data found in ${collectionName}`);
        }
        
      } catch (error) {
        console.log(`   ⚠️  Error processing ${collectionName}:`, error.message);
      }
    }
    
    // Strategy 3: Clean up orphaned references
    console.log('\n🧹 Cleaning up orphaned references...');
    
    // Clean up wishlists with invalid product references
    try {
      const wishlistsCollection = db.collection('wishlists');
      const productsCollection = db.collection('products');
      
      // Get all product IDs
      const validProductIds = (await productsCollection.find({}, { _id: 1 }).toArray())
        .map(p => p._id.toString());
      
      // Find wishlists with invalid product references
      const orphanedWishlists = await wishlistsCollection.find({
        'product': { $nin: validProductIds.map(id => new ObjectId(id)) }
      }).toArray();
      
      if (orphanedWishlists.length > 0) {
        console.log(`   📋 Found ${orphanedWishlists.length} orphaned wishlists`);
        const deleteWishlistResult = await wishlistsCollection.deleteMany({
          'product': { $nin: validProductIds.map(id => new ObjectId(id)) }
        });
        console.log(`   ✅ Deleted ${deleteWishlistResult.deletedCount} orphaned wishlists`);
        totalCleaned += deleteWishlistResult.deletedCount;
      }
      
    } catch (error) {
      console.log(`   ⚠️  Error cleaning orphaned wishlists:`, error.message);
    }
    
    // Clean up reviews with invalid product references
    try {
      const reviewsCollection = db.collection('reviews');
      const productsCollection = db.collection('products');
      
      // Get all product IDs
      const validProductIds = (await productsCollection.find({}, { _id: 1 }).toArray())
        .map(p => p._id.toString());
      
      // Find reviews with invalid product references
      const orphanedReviews = await reviewsCollection.find({
        'product': { $nin: validProductIds.map(id => new ObjectId(id)) }
      }).toArray();
      
      if (orphanedReviews.length > 0) {
        console.log(`   📋 Found ${orphanedReviews.length} orphaned reviews`);
        const deleteReviewResult = await reviewsCollection.deleteMany({
          'product': { $nin: validProductIds.map(id => new ObjectId(id)) }
        });
        console.log(`   ✅ Deleted ${deleteReviewResult.deletedCount} orphaned reviews`);
        totalCleaned += deleteReviewResult.deletedCount;
      }
      
    } catch (error) {
      console.log(`   ⚠️  Error cleaning orphaned reviews:`, error.message);
    }
    
    console.log(`\n🎉 Comprehensive cleanup completed!`);
    console.log(`📊 Total documents cleaned: ${totalCleaned}`);
    
    if (totalCleaned > 0) {
      console.log('\n💡 Recommendations:');
      console.log('   - Run seed script to restore essential data if needed');
      console.log('   - Test your application to ensure it works correctly');
      console.log('   - Check database indexes if performance seems slow');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Add command line options
const args = process.argv.slice(2);
const isConfirmMode = args.includes('--confirm');
const isRecentOnly = args.includes('--recent-only');

if (!isConfirmMode) {
  console.log('🚨 COMPREHENSIVE TEST DATA CLEANUP');
  console.log('This script will remove:');
  console.log('  1. All documents containing "test" in any text field');
  console.log('  2. Recent documents created in the last 2 hours');
  console.log('  3. Orphaned references (wishlists, reviews)');
  console.log('');
  console.log('⚠️  WARNING: This is a destructive operation!');
  console.log('');
  console.log('Usage:');
  console.log('  npm run cleanup-comprehensive --confirm        # Run full cleanup');
  console.log('  npm run cleanup-comprehensive --confirm --recent-only # Clean only recent data');
  console.log('');
  console.log('To proceed, run: npm run cleanup-comprehensive --confirm');
  process.exit(0);
}

comprehensiveCleanupTestData();
