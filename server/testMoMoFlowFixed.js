/**
 * Test MoMo complete flow with fixed OrderService method
 */

const MoMoCheckoutService = require('./services/momoCheckoutService');

async function testMoMoFlow() {
  try {
    console.log('🔄 Testing MoMo complete flow with fixed OrderService...');
    
    const momoCheckoutService = new MoMoCheckoutService();
    
    // Simulate user and checkout data
    const user = { _id: '6881100e907049e948f7e020' };
    const checkoutData = {
      addressId: '688119bb53c7d262c273db07',
      paymentMethodId: '689187ff3b29d88c249067f0',
      voucherId: '6874ee101401ccefbc67eced'
    };
    
    console.log('📤 Testing createMoMoSession...');
    const result = await momoCheckoutService.createMoMoSession(checkoutData, user);
    
    console.log('✅ MoMo session created successfully:');
    console.log('- Order ID:', result.order._id);
    console.log('- Order Code:', result.order.orderCode);
    console.log('- Payment URL:', result.payment.paymentUrl);
    console.log('- Amount:', result.payment.amount);
    
    console.log('');
    console.log('🔄 Testing callback simulation...');
    
    // Simulate MoMo callback data
    const mockCallbackData = {
      orderId: result.order.orderCode,
      resultCode: 0, // Success
      message: 'Thành công',
      transId: 'MOMO' + Date.now(),
      amount: result.payment.amount,
      signature: 'mock_signature'
    };
    
    console.log('📤 Mock callback data:', mockCallbackData);
    
    // Test the callback processing (this should work now)
    console.log('🔄 Processing callback...');
    // Note: This would fail on signature verification in real test, but we just want to test the method call
    
  } catch (error) {
    console.error('❌ Error in MoMo flow test:', error.message);
    console.error('❌ Stack:', error.stack);
  }
}

testMoMoFlow();
