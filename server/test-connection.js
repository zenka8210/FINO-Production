// Simple test để kiểm tra server connectivity
const http = require('http');

function testConnection(port) {
  console.log(`\n🔍 Testing connection to port ${port}...`);
  
  const options = {
    hostname: 'localhost',
    port: port,
    path: '/',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Connected to port ${port}! Status: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`📄 Response: ${data.substring(0, 100)}...`);
    });
  });

  req.on('error', (err) => {
    console.log(`❌ Failed to connect to port ${port}: ${err.message}`);
  });

  req.on('timeout', () => {
    console.log(`⏰ Connection to port ${port} timed out`);
    req.destroy();
  });

  req.end();
}

// Test common ports
console.log('🧪 Testing server connectivity...');
testConnection(3000);
setTimeout(() => testConnection(5000), 1000);
setTimeout(() => testConnection(8000), 2000);
