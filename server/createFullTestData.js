const axios = require('axios');

async function createFullTestData() {
  console.log('🚀 Creating complete test data for ProductVariant APIs...');
  
  try {
    // 1. Login admin
    const loginResult = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    const token = loginResult.data?.data?.token;
    if (!token) {
      console.log('❌ Failed to get admin token');
      return null;
    }
    
    console.log('✅ Admin logged in successfully');
    const headers = { Authorization: `Bearer ${token}` };
    
    // 2. Create category
    let categoryId = null;
    try {
      const createCategoryResult = await axios.post('http://localhost:5000/api/categories', {
        name: `TestCategory${Date.now()}`,
        description: 'Test category for variants',
        isActive: true
      }, { headers });
      categoryId = createCategoryResult.data?.data?._id;
      console.log('✅ Created category:', categoryId);
    } catch (error) {
      if (error.response?.status === 409) { // Conflict - already exists
        console.log('ℹ️  Category already exists, using existing one');
        categoryId = '68723e3532329296a48c1d11'; // Use the one we created earlier
      } else {
        console.log('❌ Category creation failed:', error.response?.data?.message);
        return null;
      }
    }
    
    // 3. Create product
    let productId = null;
    try {
      const createProductResult = await axios.post('http://localhost:5000/api/products', {
        name: `TestProduct${Date.now()}`,
        price: 99.99,
        description: 'Test product for variants',
        category: categoryId,
        images: ['test.jpg'],
        isActive: true
      }, { headers });
      productId = createProductResult.data?.data?._id;
      console.log('✅ Created product:', productId);
    } catch (error) {
      console.log('❌ Product creation failed:', error.response?.data?.message);
      return null;
    }
    
    // 4. Create color
    let colorId = null;
    try {
      const createColorResult = await axios.post('http://localhost:5000/api/colors', {
        name: `Red${Date.now()}`,
        value: '#FF0000',
        isActive: true
      }, { headers });
      colorId = createColorResult.data?.data?._id;
      console.log('✅ Created color:', colorId);
    } catch (error) {
      console.log('❌ Color creation failed:', error.response?.data?.message);
      return null;
    }
    
    // 5. Create size
    let sizeId = null;
    try {
      const createSizeResult = await axios.post('http://localhost:5000/api/sizes', {
        name: `L${Date.now().toString().slice(-4)}`,
        value: 'L',
        isActive: true
      }, { headers });
      sizeId = createSizeResult.data?.data?._id;
      console.log('✅ Created size:', sizeId);
    } catch (error) {
      console.log('❌ Size creation failed:', error.response?.data?.message);
      return null;
    }
    
    console.log('\n🎉 All test data created successfully!');
    return {
      token,
      categoryId,
      productId,
      colorId,
      sizeId
    };
    
  } catch (error) {
    console.error('❌ Setup failed:', error.response?.data?.message || error.message);
    return null;
  }
}

if (require.main === module) {
  createFullTestData().then(result => {
    if (result) {
      console.log('\n📊 Test Data IDs:');
      console.log(`Token: ${result.token.substring(0, 20)}...`);
      console.log(`Category: ${result.categoryId}`);
      console.log(`Product: ${result.productId}`);
      console.log(`Color: ${result.colorId}`);
      console.log(`Size: ${result.sizeId}`);
    }
  });
}

module.exports = createFullTestData;
