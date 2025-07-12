const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function setupCustomerData() {
    try {
        // Login as customer
        console.log('🔐 Logging in as customer...');
        const customerLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'customer1@shop.com',
            password: 'customer123'
        });
        
        const customerToken = customerLogin.data.data.token;
        console.log('✅ Customer login successful');
        
        // Get valid cities first
        console.log('🏙️ Getting valid cities...');
        const cities = await axios.get(`${BASE_URL}/addresses/cities`, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        console.log('✅ Valid cities:', cities.data.data.slice(0, 5)); // Show first 5
        
        // Create address
        console.log('📍 Creating customer address...');
        console.log('🏙️ Using city:', cities.data.data[0]);
        const addressData = {
            fullName: 'Nguyễn Văn An', // Use fullName instead of recipientName
            phone: '0901234567',
            city: cities.data.data[0].trim(), // Use city instead of province
            district: 'Quận 1',
            ward: 'Phường Bến Nghé',
            addressLine: '123 Đường Lê Lợi', // Use addressLine instead of detailAddress
            isDefault: true
        };
        console.log('📋 Address data:', JSON.stringify(addressData, null, 2));
        
        const address = await axios.post(`${BASE_URL}/addresses`, addressData, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        console.log('✅ Address created:', address.data.data._id);
        
        // Login as admin to create payment method
        console.log('🔐 Logging in as admin...');
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin1@shop.com',
            password: 'admin123456'
        });
        
        const adminToken = adminLogin.data.data.token;
        console.log('✅ Admin login successful');
        
        // Create payment method
        console.log('💳 Creating payment method...');
        const paymentMethodData = {
            name: 'Thanh toán khi nhận hàng',
            method: 'COD', // Add method field
            description: 'Thanh toán bằng tiền mặt khi nhận hàng',
            isActive: true
        };
        
        const paymentMethod = await axios.post(`${BASE_URL}/payment-methods`, paymentMethodData, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Payment method created:', paymentMethod.data.data._id);
        
        console.log('🎉 Customer data setup completed!');
        
    } catch (error) {
        console.error('❌ Setup error:', error.response?.data?.message || error.message);
    }
}

setupCustomerData();
