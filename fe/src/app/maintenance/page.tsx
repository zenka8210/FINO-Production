import ErrorPage from '@/app/components/ui/ErrorPage';

export default function MaintenancePage() {
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