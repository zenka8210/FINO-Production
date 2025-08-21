const mongoose = require('mongoose');
require('./config/db');

const Product = require('./models/ProductSchema');

// Test function to check product sale logic
async function testProductSale() {
    try {
        console.log('🔍 Testing product sale logic...');
        
        // Wait for database connection
        setTimeout(async () => {
            try {
                const product = await Product.findById('6874ee0f1401ccefbc67e88d').lean();
                
                if (!product) {
                    console.log('❌ Product not found');
                    process.exit(1);
                }
                
                console.log('\n📊 Raw product data from database:');
                console.log('- Name:', product.name);
                console.log('- Price:', product.price);
                console.log('- SalePrice:', product.salePrice);
                console.log('- SaleStartDate:', product.saleStartDate);
                console.log('- SaleEndDate:', product.saleEndDate);
                console.log('- Current Date:', new Date());
                
                // Test virtual fields by getting the document (not lean)
                const productWithVirtuals = await Product.findById('6874ee0f1401ccefbc67e88d');
                console.log('\n💡 Virtual fields:');
                console.log('- currentPrice (virtual):', productWithVirtuals.currentPrice);
                console.log('- isOnSale (virtual):', productWithVirtuals.isOnSale);
                
                // Manual sale logic check
                console.log('\n🔧 Manual sale logic check:');
                const now = new Date();
                const hasSalePrice = product.salePrice && 
                                  product.salePrice > 0 && 
                                  product.salePrice < product.price;
                
                console.log('- Has valid salePrice?', hasSalePrice);
                
                if (hasSalePrice) {
                    let isCurrentlyOnSale = true;
                    
                    if (product.saleStartDate && product.saleEndDate) {
                        const startDate = new Date(product.saleStartDate);
                        const endDate = new Date(product.saleEndDate);
                        isCurrentlyOnSale = now >= startDate && now <= endDate;
                        
                        console.log('- Sale start date:', startDate);
                        console.log('- Sale end date:', endDate);
                        console.log('- Is within sale period?', isCurrentlyOnSale);
                    } else {
                        console.log('- No date restrictions, permanent sale');
                    }
                    
                    console.log('- Should be on sale?', isCurrentlyOnSale);
                    
                    if (isCurrentlyOnSale) {
                        const discountPercent = Math.round((1 - product.salePrice / product.price) * 100);
                        console.log('- Discount percentage:', discountPercent + '%');
                        console.log('- Effective price should be:', product.salePrice);
                    } else {
                        console.log('- Effective price should be:', product.price);
                    }
                }
                
            } catch (error) {
                console.error('❌ Error:', error.message);
            } finally {
                mongoose.connection.close();
                process.exit(0);
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Connection error:', error.message);
        process.exit(1);
    }
}

testProductSale();
