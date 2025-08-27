/**
 * Test MoMo payment callback và kiểm tra cart clear
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials 
const ADMIN_CREDENTIALS = {
  email: 'huy.nguyen.huu@gmail.com',
  password: 'huuhuy82'
};

async function testMoMoCartClear() {
  try {
    console.log('🔐 Logging in...');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    const token = loginResponse.data.data.token;
    
    console.log('✅ Login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n1️⃣ Adding test item to cart...');
    
    // Add test product to cart
    const addToCartData = {
      productVariantId: '674d7f1e6d87f0d4e6d35b20', // Test product variant ID
      quantity: 1
    };

    try {
      const addResponse = await axios.post(`${BASE_URL}/cart/items`, addToCartData, { headers });
      console.log('✅ Test item added to cart');
    } catch (error) {
      console.log('⚠️ Could not add to cart (may already exist):', error.response?.data?.message);
    }

    // Check cart before payment
    console.log('\n2️⃣ Checking cart before payment...');
    const cartBeforeResponse = await axios.get(`${BASE_URL}/cart`, { headers });
    const cartBeforeItems = cartBeforeResponse.data.data?.items?.length || 0;
    console.log(`📦 Cart items before payment: ${cartBeforeItems}`);

    if (cartBeforeItems === 0) {
      console.log('⚠️ Cart is empty, cannot test cart clear functionality');
      return;
    }

    console.log('\n3️⃣ Creating test order for MoMo...');
    
    // Create checkout to get order
    const checkoutData = {
      addressId: '674df5b86896e45a4ada72a8', // Test address ID  
      paymentMethodId: '689187ff3b29d88c249067f0', // MoMo payment method ID
      voucherId: null
    };

    const checkoutResponse = await axios.post(`${BASE_URL}/payment/momo/checkout`, checkoutData, { headers });
    const orderCode = checkoutResponse.data.data.orderCode;
    
    console.log('✅ Test order created:', orderCode);

    console.log('\n4️⃣ Simulating MoMo callback (SUCCESS)...');
    
    // Simulate successful MoMo callback
    const successCallbackData = {
      orderId: orderCode,
      resultCode: 0, // Success
      message: 'Test successful payment',
      transId: `MOMO_TEST_${Date.now()}`,
      signature: 'test_signature'
    };

    const callbackResponse = await axios.get(`${BASE_URL}/payment/momo/callback`, { 
      params: successCallbackData 
    });
    
    console.log('✅ MoMo success callback processed');
    console.log('📋 Response status:', callbackResponse.status);

    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n5️⃣ Checking cart after successful payment...');
    const cartAfterResponse = await axios.get(`${BASE_URL}/cart`, { headers });
    const cartAfterItems = cartAfterResponse.data.data?.items?.length || 0;
    console.log(`📦 Cart items after payment: ${cartAfterItems}`);

    // Verify cart was cleared
    if (cartAfterItems === 0) {
      console.log('✅ SUCCESS: Cart was cleared after MoMo payment!');
    } else {
      console.log('❌ FAILED: Cart was NOT cleared after MoMo payment!');
      console.log('💡 This indicates the cart clear logic is not working correctly');
    }

    console.log('\n6️⃣ Testing MoMo callback (FAILED payment)...');
    
    // Add item back to cart for failed payment test
    try {
      await axios.post(`${BASE_URL}/cart/items`, addToCartData, { headers });
      console.log('✅ Re-added test item to cart');
    } catch (error) {
      console.log('⚠️ Could not re-add to cart:', error.response?.data?.message);
    }

    // Create another test order
    const checkoutResponse2 = await axios.post(`${BASE_URL}/payment/momo/checkout`, checkoutData, { headers });
    const orderCode2 = checkoutResponse2.data.data.orderCode;
    
    console.log('✅ Second test order created:', orderCode2);

    // Simulate failed MoMo callback
    const failedCallbackData = {
      orderId: orderCode2,
      resultCode: 1, // Failed
      message: 'Test failed payment',
      transId: `MOMO_FAIL_${Date.now()}`,
      signature: 'test_signature'
    };

    const failedCallbackResponse = await axios.get(`${BASE_URL}/payment/momo/callback`, { 
      params: failedCallbackData 
    });
    
    console.log('✅ MoMo failed callback processed');

    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n7️⃣ Checking cart after failed payment...');
    const cartAfterFailedResponse = await axios.get(`${BASE_URL}/cart`, { headers });
    const cartAfterFailedItems = cartAfterFailedResponse.data.data?.items?.length || 0;
    console.log(`📦 Cart items after failed payment: ${cartAfterFailedItems}`);

    // Verify cart was NOT cleared for failed payment
    if (cartAfterFailedItems > 0) {
      console.log('✅ SUCCESS: Cart was preserved after failed MoMo payment!');
    } else {
      console.log('❌ UNEXPECTED: Cart was cleared after failed MoMo payment!');
    }

    console.log('\n🎯 SUMMARY:');
    console.log(`   - Cart before payment: ${cartBeforeItems} items`);
    console.log(`   - Cart after successful payment: ${cartAfterItems} items`);
    console.log(`   - Cart after failed payment: ${cartAfterFailedItems} items`);
    
    if (cartAfterItems === 0 && cartAfterFailedItems > 0) {
      console.log('✅ MoMo cart clear logic is working correctly!');
    } else {
      console.log('❌ MoMo cart clear logic needs fixing!');
    }

  } catch (error) {
    console.error('❌ Test error:', error.response?.data || error.message);
  }
}

testMoMoCartClear();
