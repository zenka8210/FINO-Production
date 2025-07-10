require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/UserSchema');

// Sample users data
const usersData = [
  // 3 Customer Users
  {
    email: 'customer1@shop.com',
    password: 'customer123',
    name: 'Nguyễn Văn An',
    phone: '0901234567',
    address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    role: 'customer',
    isActive: true
  },
  {
    email: 'customer2@shop.com', 
    password: 'customer123',
    name: 'Trần Thị Bình',
    phone: '0902345678',
    address: '456 Lê Lợi, Quận 3, TP.HCM',
    role: 'customer',
    isActive: true
  },
  {
    email: 'customer3@shop.com',
    password: 'customer123', 
    name: 'Lê Hoàng Cường',
    phone: '0903456789',
    address: '789 Trần Hưng Đạo, Quận 5, TP.HCM',
    role: 'customer',
    isActive: true
  },
  
  // 2 Admin Users
  {
    email: 'admin1@shop.com',
    password: 'admin123456',
    name: 'Phạm Minh Đức',
    phone: '0904567890',
    address: '101 Võ Văn Tần, Quận 3, TP.HCM',
    role: 'admin',
    isActive: true
  },
  {
    email: 'admin2@shop.com',
    password: 'admin123456',
    name: 'Hoàng Thị Linh',
    phone: '0905678901', 
    address: '202 Pasteur, Quận 1, TP.HCM',
    role: 'admin',
    isActive: true
  }
];

async function seedUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Connected to MongoDB successfully');
    
    // Clear existing users (optional - comment out if you want to keep existing users)
    console.log('🗑️  Clearing existing users...');
    await User.deleteMany({});
    console.log('✅ Existing users cleared');
    
    console.log('👥 Creating users...');
    const createdUsers = [];
    
    for (const userData of usersData) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(`⚠️  User ${userData.email} already exists, skipping...`);
          continue;
        }
        
        // Create new user (password will be hashed by pre-save hook)
        const user = new User(userData);
        const savedUser = await user.save();
        
        // Remove password from output
        const userOutput = savedUser.toObject();
        delete userOutput.password;
        createdUsers.push(userOutput);
        
        console.log(`✅ Created ${userData.role}: ${userData.email} - ${userData.name}`);
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`Total users created: ${createdUsers.length}`);
    console.log(`Customers: ${createdUsers.filter(u => u.role === 'customer').length}`);
    console.log(`Admins: ${createdUsers.filter(u => u.role === 'admin').length}`);
    
    console.log('\n👥 Created Users:');
    createdUsers.forEach(user => {
      console.log(`- ${user.role.toUpperCase()}: ${user.email} | ${user.name} | ${user.phone}`);
    });
    
    console.log('\n🔑 Login Credentials:');
    console.log('Customer Accounts:');
    console.log('- customer1@shop.com : customer123');
    console.log('- customer2@shop.com : customer123'); 
    console.log('- customer3@shop.com : customer123');
    console.log('Admin Accounts:');
    console.log('- admin1@shop.com : admin123456');
    console.log('- admin2@shop.com : admin123456');
    
    console.log('\n✅ User seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding function
if (require.main === module) {
  console.log('🌱 Starting user seeding process...');
  seedUsers();
}

module.exports = { seedUsers, usersData };