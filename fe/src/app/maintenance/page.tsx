'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ErrorPage from '@/app/components/ui/ErrorPage';

function MaintenanceContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  // Check if this is access denied case
  if (reason === 'access-denied') {
    return (
      <ErrorPage
        title="Không có quyền truy cập"
        message="Bạn không có quyền truy cập vào trang quản trị. Chỉ có tài khoản quản trị viên mới có thể sử dụng tính năng này."
        errorCode="403"
        showRefreshButton={false}
        showBackButton={true}
      />
    );
  }

  // Default maintenance message
  return (
    <ErrorPage
      title="Trang đang bảo trì"
      message="Chúng tôi đang cập nhật hệ thống để mang đến trải nghiệm tốt hơn cho bạn. Vui lòng quay lại sau!"
      errorCode="503"
      showRefreshButton={true}
      showBackButton={false}
    />
  );
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={
      <ErrorPage
        title="Đang tải..."
        message="Vui lòng chờ trong giây lát..."
        errorCode=""
        showRefreshButton={false}
        showBackButton={false}
      />
    }>
      <MaintenanceContent />
    </Suspense>
  );
}