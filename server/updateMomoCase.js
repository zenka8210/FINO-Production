/**
 * Update MoMo payment method case to match frontend types
 * Fix case sensitivity issue: 'Momo' -> 'MoMo'
 */

const { connectDB } = require('./config/db');
const PaymentMethod = require('./models/PaymentMethodSchema');

async function updateMoMoCase() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    console.log('🔍 Finding MoMo payment method...');
    const momoMethod = await PaymentMethod.findOne({ 
      method: { $regex: /^momo$/i } // Case insensitive search
    });
    
    if (!momoMethod) {
      console.log('❌ MoMo payment method not found');
      process.exit(1);
    }
    
    console.log('📋 Current MoMo method:', {
      id: momoMethod._id,
      method: momoMethod.method,
      isActive: momoMethod.isActive
    });
    
    // Update to correct case
    console.log('🔄 Updating method case from "Momo" to "MoMo"...');
    const result = await PaymentMethod.updateOne(
      { _id: momoMethod._id },
      { method: 'MoMo' }
    );
    
    if (result.modifiedCount === 1) {
      console.log('✅ MoMo payment method updated successfully!');
      
      // Verify update
      const updatedMethod = await PaymentMethod.findById(momoMethod._id);
      console.log('🎯 Updated method:', {
        id: updatedMethod._id,
        method: updatedMethod.method,
        isActive: updatedMethod.isActive
      });
    } else {
      console.log('❌ No documents were modified');
    }
    
    console.log('');
    console.log('🔍 All payment methods after update:');
    const allMethods = await PaymentMethod.find({});
    allMethods.forEach(pm => {
      console.log(`- ${pm.method}: ${pm._id} (Active: ${pm.isActive})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating MoMo case:', error);
    process.exit(1);
  }
}

updateMoMoCase();
