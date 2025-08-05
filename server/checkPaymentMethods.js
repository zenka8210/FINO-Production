const mongoose = require('mongoose');
require('./config/db');
const PaymentMethod = require('./models/PaymentMethodSchema');

async function checkPaymentMethods() {
  try {
    console.log('📋 Checking payment methods in database...');
    
    const methods = await PaymentMethod.find({});
    console.log('💳 Available payment methods:', methods.length);
    
    methods.forEach(method => {
      console.log(`- ${method.method} (ID: ${method._id}) - ${method.isActive ? '✅ Active' : '❌ Inactive'}`);
    });

    // Check specifically for MoMo
    const momoMethod = methods.find(m => m.method.toLowerCase().includes('momo'));
    if (momoMethod) {
      console.log('\n🎯 MoMo method found:', {
        id: momoMethod._id,
        method: momoMethod.method,
        isActive: momoMethod.isActive
      });
    } else {
      console.log('\n⚠️ MoMo method not found!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Wait for DB connection
setTimeout(checkPaymentMethods, 2000);
