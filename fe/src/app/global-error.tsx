'use client';

import { useEffect } from 'react';
import { ErrorPage } from '@/app/components/ui';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <ErrorPage
          title="Đã xảy ra lỗi nghiêm trọng"
          message="Ứng dụng đã gặp phải một lỗi không mong muốn. Chúng tôi đã ghi nhận sự cố này và sẽ khắc phục sớm nhất có thể."
          errorCode="ERR"
          showRefreshButton={false}
          customActions={
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  background: 'var(--color-primary, #1E40AF)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '160px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(30, 64, 175, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                🔄 Thử lại
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  background: 'white',
                  color: 'var(--color-primary, #1E40AF)',
                  border: '2px solid var(--color-primary, #1E40AF)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '160px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--color-primary, #1E40AF)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(30, 64, 175, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = 'var(--color-primary, #1E40AF)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
              >
                🏠 Về trang chủ
              </button>
            </div>
          }
        />
      </body>
    </html>
  );
}
