import { ErrorPage } from '@/app/components/ui';
import { Button } from '@/app/components/ui';

// Utility để render các lỗi phổ biến
export const ErrorPageVariants = {
  // 404 - Page Not Found
  NotFound: () => (
    <ErrorPage
      title="Không tìm thấy trang"
      message="Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. Đừng lo lắng, chúng tôi sẽ giúp bạn tìm lại đúng hướng!"
      errorCode="404"
      showRefreshButton={false}
      showBackButton={true}
    />
  ),

  // 403 - Forbidden
  Forbidden: () => (
    <ErrorPage
      title="Không có quyền truy cập"
      message="Bạn không có quyền truy cập vào trang này. Vui lòng đăng nhập hoặc liên hệ quản trị viên để được hỗ trợ."
      errorCode="403"
      showRefreshButton={false}
      showBackButton={true}
    />
  ),

  // 500 - Internal Server Error
  ServerError: () => (
    <ErrorPage
      title="Lỗi máy chủ"
      message="Đã xảy ra lỗi bất ngờ từ phía máy chủ. Chúng tôi đang khắc phục sự cố này. Vui lòng thử lại sau ít phút."
      errorCode="500"
      showRefreshButton={true}
      showBackButton={true}
    />
  ),

  // 503 - Service Unavailable
  Maintenance: () => (
    <ErrorPage
      title="Trang đang bảo trì"
      message="Chúng tôi đang cập nhật hệ thống để mang đến trải nghiệm tốt hơn cho bạn. Vui lòng quay lại sau!"
      errorCode="503"
      showRefreshButton={true}
      showBackButton={false}
    />
  ),

  // Network Error
  NetworkError: () => (
    <ErrorPage
      title="Lỗi kết nối"
      message="Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng của bạn và thử lại."
      errorCode="NET"
      showRefreshButton={true}
      showBackButton={true}
    />
  ),

  // Timeout Error
  TimeoutError: () => (
    <ErrorPage
      title="Hết thời gian chờ"
      message="Yêu cầu của bạn đã hết thời gian chờ. Vui lòng thử lại hoặc kiểm tra kết nối mạng."
      errorCode="408"
      showRefreshButton={true}
      showBackButton={true}
    />
  ),

  // Custom error với action buttons tùy chỉnh
  CustomError: ({ 
    title, 
    message, 
    errorCode, 
    onRetry, 
    onGoHome, 
    retryText = "Thử lại",
    homeText = "Về trang chủ" 
  }: {
    title: string;
    message: string;
    errorCode: string;
    onRetry?: () => void;
    onGoHome?: () => void;
    retryText?: string;
    homeText?: string;
  }) => (
    <ErrorPage
      title={title}
      message={message}
      errorCode={errorCode}
      showHomeButton={false}
      showRefreshButton={false}
      showBackButton={false}
      customActions={
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onRetry && (
            <Button variant="primary" size="lg" onClick={onRetry}>
              🔄 {retryText}
            </Button>
          )}
          {onGoHome && (
            <Button variant="outline" size="lg" onClick={onGoHome}>
              🏠 {homeText}
            </Button>
          )}
        </div>
      }
    />
  )
};

// Helper function để render error dựa trên status code
export const renderErrorByStatus = (status: number, customMessage?: string) => {
  switch (status) {
    case 404:
      return <ErrorPageVariants.NotFound />;
    case 403:
      return <ErrorPageVariants.Forbidden />;
    case 500:
      return <ErrorPageVariants.ServerError />;
    case 503:
      return <ErrorPageVariants.Maintenance />;
    case 408:
      return <ErrorPageVariants.TimeoutError />;
    default:
      return (
        <ErrorPage
          title="Đã xảy ra lỗi"
          message={customMessage || "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau."}
          errorCode={status.toString()}
        />
      );
  }
};

// Helper function để render error dựa trên error type
export const renderErrorByType = (errorType: 'network' | 'timeout' | 'server' | 'forbidden' | 'notfound' | 'maintenance') => {
  switch (errorType) {
    case 'network':
      return <ErrorPageVariants.NetworkError />;
    case 'timeout':
      return <ErrorPageVariants.TimeoutError />;
    case 'server':
      return <ErrorPageVariants.ServerError />;
    case 'forbidden':
      return <ErrorPageVariants.Forbidden />;
    case 'notfound':
      return <ErrorPageVariants.NotFound />;
    case 'maintenance':
      return <ErrorPageVariants.Maintenance />;
    default:
      return <ErrorPageVariants.NotFound />;
  }
};
