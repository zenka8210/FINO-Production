const axios = require('axios');

async function createTestUsers() {
    try {
        console.log('Creating test users...');
        
        // Create customer user
        try {
            const customerResult = await axios.post('http://localhost:5000/api/auth/register', {
                email: 'customer@example.com',
                password: 'password123',
                name: 'Customer User',
                phone: '0123456789',
                address: 'Customer Address'
            });
            
            if (customerResult.data.success) {
                console.log('✅ Customer user created successfully');
            }
        } catch (error) {
            if (error.response?.data?.message?.includes('tồn tại')) {
                console.log('ℹ️  Customer user already exists');
            } else {
                console.log('❌ Customer user creation failed:', error.response?.data?.message || error.message);
            }
        }
        
        // Test login for both users
        console.log('\n Testing logins...');
        
        // Test admin login
        try {
            const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'admin@example.com',
                password: 'password123'
            });
            console.log('✅ Admin login successful');
        } catch (error) {
            console.log('❌ Admin login failed:', error.response?.data?.message || error.message);
        }
        
        // Test customer login
        try {
            const customerLogin = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'customer@example.com',
                password: 'password123'
            });
            console.log('✅ Customer login successful');
        } catch (error) {
            console.log('❌ Customer login failed:', error.response?.data?.message || error.message);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

createTestUsers();
