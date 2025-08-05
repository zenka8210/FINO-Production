/**
 * Test updated MoMo payment URL generation with correct order info
 */

const MoMoService = require('./services/momoService');

async function testUpdatedMoMoPayment() {
  try {
    console.log('🔄 Testing updated MoMo payment URL generation...');
    
    const momoService = new MoMoService();
    
    // Test with actual order data format
    const orderInfo = {
      orderId: 'FINO2025080500015', // Real order code format
      amount: 1700000, // 1.7M VND
      orderDescription: 'Thanh toán đơn hàng FINO2025080500015 - FINO Store',
      clientIp: '127.0.0.1'
    };
    
    console.log('📤 Order info being sent to MoMo:', orderInfo);
    
    const paymentUrl = await momoService.createPaymentUrl(orderInfo);
    
    console.log('');
    console.log('✅ Updated MoMo Payment URL Generated:');
    console.log(paymentUrl);
    console.log('');
    console.log('🔍 Expected to show:');
    console.log('- Order ID: FINO2025080500015');
    console.log('- Amount: 1,700,000 VND');
    console.log('- Description: Thanh toán đơn hàng FINO2025080500015 - FINO Store');
    console.log('- Store: FINO Store');
    
  } catch (error) {
    console.error('❌ Error testing updated MoMo payment:', error.message);
  }
}

testUpdatedMoMoPayment();
