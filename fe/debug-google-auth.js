// Debug script để kiểm tra Google OAuth configuration
console.log('=== Google OAuth Debug Information ===');
console.log('Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
console.log('Current URL:', window.location.origin);
console.log('Current Host:', window.location.host);
console.log('Current Protocol:', window.location.protocol);

// Test Google script loading
if (typeof window !== 'undefined') {
  console.log('Window object exists');
  console.log('Google object:', window.google);
  
  // Try to load Google script manually
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = () => {
    console.log('Google script loaded successfully');
    console.log('Google accounts:', window.google?.accounts);
  };
  script.onerror = () => {
    console.error('Failed to load Google script');
  };
  document.head.appendChild(script);
}
