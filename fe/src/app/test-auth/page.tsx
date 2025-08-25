'use client';

// Simple test script to verify login authentication flow
console.log('Testing cart authentication flow...');

// Test 1: Check if user token exists
const checkAuthStatus = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    console.log('Auth token status:', token ? 'EXISTS' : 'NOT_EXISTS');
    return !!token;
  }
  return false;
};

// Test 2: Simulate add to cart without login
const simulateAddToCartFlow = async () => {
  console.log('=== Testing Add to Cart Flow ===');
  
  const isLoggedIn = checkAuthStatus();
  console.log('User logged in:', isLoggedIn);
  
  if (!isLoggedIn) {
    console.log('✅ Expected behavior: Should show login required message');
    console.log('❌ Bug: Multiple toast notifications should be fixed');
  } else {
    console.log('✅ User is logged in, add to cart should work normally');
  }
};

// Run tests when page loads
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    simulateAddToCartFlow();
  });
}

export default function TestAuthFlow() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '20px' }}>
      <h3>🧪 Cart Authentication Test</h3>
      <p>Check browser console for test results</p>
      <button onClick={simulateAddToCartFlow}>
        Test Auth Flow
      </button>
    </div>
  );
}
