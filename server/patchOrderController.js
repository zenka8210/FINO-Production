const fs = require('fs');
const path = require('path');

// Script to patch orderController.js with address snapshot fallback
function patchOrderController() {
  const controllerPath = path.join(__dirname, 'controllers', 'orderController.js');
  
  console.log('🔧 PATCHING ORDER CONTROLLER');
  console.log('============================');
  console.log(`File: ${controllerPath}`);
  
  try {
    // Read current controller
    let content = fs.readFileSync(controllerPath, 'utf8');
    
    // Check if already patched
    if (content.includes('FALLBACK TO ADDRESS SNAPSHOT')) {
      console.log('✅ Controller already patched');
      return;
    }
    
    // Find the getOrderByIdAdmin method
    const methodStart = content.indexOf('getOrderByIdAdmin = async (req, res, next) => {');
    
    if (methodStart === -1) {
      console.log('❌ getOrderByIdAdmin method not found');
      return;
    }
    
    // Find where to insert fallback logic (after order retrieval, before response)
    const insertPoint = content.indexOf('// Admin có thể xem tất cả đơn hàng, không cần check user ownership', methodStart);
    
    if (insertPoint === -1) {
      console.log('❌ Insert point not found');
      return;
    }
    
    // Fallback logic to insert
    const fallbackLogic = `
      // 🆕 FALLBACK TO ADDRESS SNAPSHOT if address reference is lost
      if (!order.address && order.addressSnapshot) {
        console.log(\`⚠️  Order \${order.orderCode}: Address reference lost, using addressSnapshot fallback\`);
        // Create a mock address object from snapshot for compatibility
        order.address = {
          _id: null, // Indicate this is from snapshot
          fullName: order.addressSnapshot.fullName,
          phone: order.addressSnapshot.phone,
          addressLine: order.addressSnapshot.addressLine,
          ward: order.addressSnapshot.ward,
          district: order.addressSnapshot.district,
          city: order.addressSnapshot.city,
          postalCode: order.addressSnapshot.postalCode,
          isDefault: order.addressSnapshot.isDefault,
          isSnapshot: true, // Flag to indicate this is from snapshot
          snapshotCreatedAt: order.addressSnapshot.snapshotCreatedAt
        };
        console.log(\`✅ Created mock address from snapshot for admin modal\`);
      } else if (!order.address && !order.addressSnapshot) {
        console.log(\`❌ Order \${order.orderCode}: Both address reference and snapshot are missing!\`);
      }

      `;
    
    // Insert the fallback logic
    const newContent = content.slice(0, insertPoint) + fallbackLogic + content.slice(insertPoint);
    
    // Write back to file
    fs.writeFileSync(controllerPath, newContent);
    
    console.log('✅ Order controller patched successfully!');
    console.log('🔄 Please restart the server for changes to take effect');
    
  } catch (error) {
    console.error('❌ Error patching controller:', error.message);
  }
}

// Run patch
patchOrderController();
