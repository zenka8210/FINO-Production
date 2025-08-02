import ErrorPage from '@/app/components/ui/ErrorPage';

export default function NotFound() {
  return (
    <ErrorPage
      title="Không tìm thấy trang"
      message="Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. Đừng lo lắng, chúng tôi sẽ giúp bạn tìm lại đúng hướng!"
      errorCode="404"
      showRefreshButton={false}
      showBackButton={true}
    />
  );
}
