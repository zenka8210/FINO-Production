const axios = require('axios');

async function debugSpecificEndpoint() {
    try {
        console.log('Testing connection to server...');
        const testConnection = await axios.get('http://localhost:5000/');
        console.log('Server connection:', testConnection.status);
        
        // Login first
        console.log('\nTesting login...');
        const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@example.com',
            password: 'password123'
        });
        
        const token = adminLogin.data.data.token;
        console.log('Login successful, token received:', !!token);
        
        // Test products pagination
        console.log('\n=== Testing Products Pagination ===');
        try {
            const response = await axios.get('http://localhost:5000/api/products/public?page=1&limit=5');
            console.log('Success:', response.data);
        } catch (error) {
            console.log('Error:', error.response?.data || error.message);
        }
        
        // Test orders pagination
        console.log('\n=== Testing Orders Pagination ===');
        try {
            const response = await axios.get('http://localhost:5000/api/orders?page=1&limit=5', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Success:', response.data);
        } catch (error) {
            console.log('Error:', error.response?.data || error.message);
        }
        
    } catch (error) {
        console.log('Login error:', error.response?.data || error.message);
    }
}

debugSpecificEndpoint();
