'use client';

import { useNotification } from '@/contexts/NotificationContext';
import { useEffect } from 'react';

export default function TestNotifications() {
  const { success, warning, error } = useNotification();

  useEffect(() => {
    console.log('🔍 TestNotifications mounted');
    console.log('🔍 Notification functions:', { success, warning, error });
  }, [success, warning, error]);

  const testWarning = () => {
    console.log('🔍 Testing warning notification');
    warning('Test Warning', 'This is a test warning message');
  };

  const testSuccess = () => {
    console.log('🔍 Testing success notification');
    success('Test Success', 'This is a test success message');
  };

  const testError = () => {
    console.log('🔍 Testing error notification');
    error('Test Error', 'This is a test error message');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Notifications</h1>
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button onClick={testWarning} style={{ padding: '10px 20px', backgroundColor: '#fbbf24', color: 'white', border: 'none', borderRadius: '5px' }}>
          Test Warning
        </button>
        <button onClick={testSuccess} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px' }}>
          Test Success
        </button>
        <button onClick={testError} style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px' }}>
          Test Error
        </button>
      </div>
    </div>
  );
}
