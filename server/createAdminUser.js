const axios = require('axios');

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    const adminResult = await axios.post('http://localhost:5000/api/auth/register', {
      email: 'admin@example.com',
      password: 'password123',
      name: 'Admin User',
      role: 'admin'
    });
    
    if (adminResult.data.success) {
      console.log('✅ Admin user created successfully');
      console.log('Email: admin@example.com');
      console.log('Password: password123');
    } else {
      console.log('❌ Admin user creation failed');
    }
    
  } catch (error) {
    if (error.response?.data?.message?.includes('tồn tại')) {
      console.log('ℹ️  Admin user already exists');
    } else {
      console.error('Error:', error.response?.data?.message || error.message);
    }
  }
}

createAdminUser();
