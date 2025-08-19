'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function VNPayCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to processing page with all VNPay parameters
    const allParams = searchParams.toString();
    console.log('🔔 VNPay callback - redirecting to processing with params:', allParams);
    
    router.replace(`/payment/vnpay/processing?${allParams}`);
  }, [searchParams, router]);

  // Show minimal loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600 text-sm">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}

export default function VNPayCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Đang tải...</p>
        </div>
      </div>
    }>
      <VNPayCallbackContent />
    </Suspense>
  );
}
