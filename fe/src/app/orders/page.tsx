'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useCart } from '@/contexts';
import { useApiNotification, useOrders } from '@/hooks';
import { PageHeader, LoadingSpinner, Button, Pagination, OrderCard, OrderReviewModal, AddressSelectionModal } from '@/app/components/ui';
import { orderService } from '@/services/orderService';
import { reviewService } from '@/services/reviewService';
import { OrderWithRefs } from '@/types';
import { 
  FaShoppingBag, 
  FaTimes,
  FaFilter,
  FaSearch
} from 'react-icons/fa';
import styles from './OrdersPage.module.css';

// Order status options for filter
const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đã gửi hàng' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' }
];

interface OrderFilters {
  status: string;
  startDate: string;
  endDate: string;
  search: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { loadCart } = useCart();
  const { showError, showSuccess } = useApiNotification();
  const { cancelOrder } = useOrders();

  // States
  const [orders, setOrders] = useState<OrderWithRefs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [limit] = useState(10);
  
  // Review states
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<OrderWithRefs | null>(null);
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());

  // Address change states
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [selectedOrderForAddress, setSelectedOrderForAddress] = useState<OrderWithRefs | null>(null);

  // Filter states
  const [filters, setFilters] = useState<OrderFilters>({
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/orders');
      return;
    }
  }, [user, router, authLoading]);

  // Load user orders
  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, currentPage, filters]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      
      const queryParams: any = {
        page: currentPage,
        limit,
        ...(filters.status && { status: filters.status as any }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.search && { search: filters.search })
      };

      console.log('📦 Loading orders with params:', queryParams);

      const response = await orderService.getUserOrders(queryParams);
      
      console.log('📋 Raw getUserOrders Response:', response);
      
      let ordersData: OrderWithRefs[] = [];
      let totalCount = 0;
      let totalPagesCount = 1;

      // Handle different response structures - prioritize pagination structure
      if ((response as any)?.data?.documents && Array.isArray((response as any).data.documents)) {
        // Standard paginated response
        ordersData = (response as any).data.documents;
        const pagination = (response as any).data.pagination;
        totalCount = pagination?.total || 0;
        totalPagesCount = pagination?.totalPages || pagination?.pages || 1;
        console.log('📄 Using paginated response:', { documents: ordersData.length, total: totalCount, pages: totalPagesCount });
      } else if ((response as any)?.documents && Array.isArray((response as any).documents)) {
        // Direct documents with pagination
        ordersData = (response as any).documents;
        const pagination = (response as any).pagination;
        totalCount = pagination?.total || 0;
        totalPagesCount = pagination?.totalPages || pagination?.pages || 1;
        console.log('📄 Using direct documents response:', { documents: ordersData.length, total: totalCount, pages: totalPagesCount });
      } else if (Array.isArray(response?.data)) {
        // Array response with pagination metadata
        ordersData = response.data;
        totalCount = response.total || response.data.length;
        totalPagesCount = response.totalPages || Math.ceil((response.total || response.data.length) / limit);
        console.log('📄 Using array response with pagination metadata:', { 
          documents: ordersData.length, 
          total: totalCount, 
          totalPages: totalPagesCount,
          responseTotalPages: response.totalPages,
          responseTotal: response.total
        });
      } else if (Array.isArray(response)) {
        // Direct array response 
        ordersData = response;
        totalCount = response.length;
        totalPagesCount = Math.ceil(response.length / limit);
        console.log('📄 Using direct array response:', { documents: ordersData.length, total: totalCount });
      } else {
        console.warn('⚠️ Unexpected orders response structure:', response);
        ordersData = [];
        totalCount = 0;
        totalPagesCount = 1;
      }
      
      setOrders(ordersData);
      setTotalOrders(totalCount);
      setTotalPages(totalPagesCount);
      
      // Check review status for loaded orders
      await checkOrderReviewStatus(ordersData);
      
      console.log('📊 Final pagination state:', {
        currentPage,
        totalPages: totalPagesCount,
        totalOrders: totalCount,
        orderCount: ordersData.length,
        shouldShowPagination: totalPagesCount > 1
      });
      
    } catch (error: any) {
      console.error('❌ Error loading orders:', error);
      setOrders([]);
      if (error.message && !error.message.includes('Unauthorized')) {
        showError('Không thể tải danh sách đơn hàng', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof OrderFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle cancel order (matching profile page exactly)
  const handleCancelOrder = async (orderId: string) => {
    try {
      setIsLoading(true);
      console.log('Cancel order:', orderId);
      
      // Call the cancel order API using useOrders hook
      await cancelOrder(orderId);
      
      // Show success message
      showSuccess('Đơn hàng đã được hủy thành công');
      
      // Refresh orders list
      await loadOrders();
      
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      showError('Không thể hủy đơn hàng', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reorder functionality (matching profile page exactly)
  const handleReorder = async (order: OrderWithRefs) => {
    try {
      setIsLoading(true);
      
      // Prepare items for batch add to cart
      const items = order.items?.map((item: any) => ({
        // Use productSnapshot data if available, fallback to productVariant reference
        productVariant: item.productSnapshot?.variantId || item.productVariant?._id,
        quantity: item.quantity
      })).filter(item => item.productVariant) || [];

      if (items.length === 0) {
        showError('Không tìm thấy sản phẩm hợp lệ trong đơn hàng');
        return;
      }

      // Use batch add to cart (will update quantities if items already exist)
      const cartService = await import('@/services/cartService');
      const result = await cartService.CartService.getInstance().batchAddToCart(items);
      
      if (result.errorCount > 0) {
        showError(`Đã thêm ${result.successCount} sản phẩm. ${result.errorCount} sản phẩm không thể thêm.`);
      } else {
        showSuccess(`Đã thêm ${result.successCount} sản phẩm vào giỏ hàng`);
      }
      
      // Refresh cart context to ensure data is up to date
      await loadCart();
      
      // Redirect to cart page
      router.push('/cart');
    } catch (error) {
      showError('Không thể thêm sản phẩm vào giỏ hàng', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Review functionality
  const handleReviewOrder = (order: OrderWithRefs) => {
    setSelectedOrderForReview(order);
    setReviewModalOpen(true);
  };

  // Check if order has been reviewed
  const checkOrderReviewStatus = async (orders: OrderWithRefs[]) => {
    try {
      console.log('🔍 Debug: Checking review status for orders:', orders.length);
      
      const reviewPromises = orders
        .filter(order => order.status === 'delivered')
        .map(async (order) => {
          try {
            console.log('🔍 Debug: Processing order:', order._id, 'with items:', order.items?.length);
            
            // Check each product in the order
            const productPromises = order.items?.map(async (item: any, index: number) => {
              try {
                // Debug order item structure
                console.log(`🔍 Debug: Order ${order._id} Item ${index}:`, {
                  hasProductVariant: !!item.productVariant,
                  hasProduct: !!item.productVariant?.product,
                  hasProductSnapshot: !!item.productSnapshot,
                  productId: item.productSnapshot?.productId || item.productVariant?.product?._id,
                  productName: item.productSnapshot?.productName || item.productVariant?.product?.name
                });
                
                // Validate that we have a valid product ID from snapshot or reference
                const productId = item.productSnapshot?.productId || item.productVariant?.product?._id;
                if (!productId) {
                  console.warn('⚠️ Missing product ID for order item:', {
                    orderId: order._id,
                    itemIndex: index,
                    hasProductVariant: !!item.productVariant,
                    hasProduct: !!item.productVariant?.product,
                    hasProductSnapshot: !!item.productSnapshot,
                    item: item
                  });
                  return { orderId: order._id, canReview: false }; // Cannot review if no product ID
                }
                
                const result = await reviewService.canReviewProduct(productId);
                return { orderId: order._id, canReview: result.canReview };
              } catch (error) {
                console.error('❌ Error checking review status for item:', error);
                return { orderId: order._id, canReview: true }; // Default to can review if check fails
              }
            }) || [];
            
            const results = await Promise.all(productPromises);
            // If any product can't be reviewed, consider order as reviewed
            const canReviewOrder = results.some(r => r.canReview);
            return { orderId: order._id, isReviewed: !canReviewOrder };
          } catch {
            return { orderId: order._id, isReviewed: false };
          }
        });

      const reviewStatuses = await Promise.all(reviewPromises);
      const reviewedOrderIds = reviewStatuses
        .filter(status => status.isReviewed)
        .map(status => status.orderId);
      
      setReviewedOrders(new Set(reviewedOrderIds));
    } catch (error) {
      console.error('Error checking review status:', error);
    }
  };

  const isOrderReviewed = (orderId: string): boolean => {
    return reviewedOrders.has(orderId);
  };

  // Address change functionality
  const handleChangeAddress = (order: OrderWithRefs) => {
    setSelectedOrderForAddress(order);
    setAddressModalOpen(true);
  };

  const handleAddressChanged = async () => {
    // Refresh orders list to show updated address
    await loadOrders();
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="container">
        <div className={styles.pageContainer}>
          <div className={styles.loadingSection}>
            <LoadingSpinner size="lg" />
            <p>Đang kiểm tra xác thực...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        <PageHeader
          title="Đơn hàng của tôi"
          subtitle="Theo dõi trạng thái và lịch sử đơn hàng"
          icon={FaShoppingBag}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Đơn hàng', href: '/orders' }
          ]}
        />

        <div className={styles.mainContent}>
          {/* Filters Section */}
          <div className={styles.filtersSection}>
            <div className={styles.filtersGrid}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Tìm kiếm</label>
                <div className={styles.searchInputContainer}>
                  <FaSearch className={styles.searchIcon} />
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Tìm theo mã đơn hàng, tên sản phẩm..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Trạng thái</label>
                <select
                  className={styles.filterSelect}
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  {ORDER_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Từ ngày</label>
                <input
                  type="date"
                  className={styles.filterSelect}
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Đến ngày</label>
                <input
                  type="date"
                  className={styles.filterSelect}
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              <div className={styles.filterActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  disabled={!filters.status && !filters.startDate && !filters.endDate && !filters.search}
                >
                  <FaTimes />
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </div>

          {/* Orders Container */}
          <div className={styles.ordersContainer}>
            <div className={styles.ordersHeader}>
              <div>
                <h2 className={styles.ordersTitle}>
                  <FaShoppingBag />
                  Danh sách đơn hàng
                </h2>
                <p className={styles.ordersCount}>
                  {totalOrders > 0 ? `${totalOrders} đơn hàng` : 'Không có đơn hàng'}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className={styles.loadingSection}>
                <LoadingSpinner size="lg" />
                <p>Đang tải danh sách đơn hàng...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <FaShoppingBag />
                </div>
                <h3>Chưa có đơn hàng nào</h3>
                <p>Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!</p>
                <Button variant="primary" onClick={() => router.push('/products')}>
                  <FaShoppingBag className={styles.buttonIcon} />
                  Bắt đầu mua sắm
                </Button>
              </div>
            ) : (
              <>
                <div className={styles.ordersList}>
                  {orders.map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      maxItems={3}
                      showDetailedInfo={false}
                      showReviewButton={true}
                      onReviewOrder={handleReviewOrder}
                      onCancelOrder={handleCancelOrder}
                      onReorderOrder={handleReorder}
                      onChangeAddress={handleChangeAddress}
                      isOrderReviewed={isOrderReviewed}
                      onReorderComplete={() => loadOrders()}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={styles.paginationWrapper}>
                    <Pagination
                      pagination={{
                        page: currentPage,
                        limit: limit,
                        totalPages: totalPages,
                        totalProducts: totalOrders,
                        hasNextPage: currentPage < totalPages,
                        hasPrevPage: currentPage > 1
                      }}
                      onPageChange={handlePageChange}
                      showInfo={true}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Review Modal */}
      {selectedOrderForReview && (
        <OrderReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedOrderForReview(null);
          }}
          order={selectedOrderForReview}
          onSuccess={() => {
            // Mark order as reviewed
            if (selectedOrderForReview) {
              setReviewedOrders(prev => new Set([...prev, selectedOrderForReview._id]));
            }
            // Close modal
            setReviewModalOpen(false);
            setSelectedOrderForReview(null);
            showSuccess('Đánh giá đã được gửi thành công!');
          }}
        />
      )}

      {/* Address Selection Modal */}
      {selectedOrderForAddress && (
        <AddressSelectionModal
          isOpen={addressModalOpen}
          onClose={() => {
            setAddressModalOpen(false);
            setSelectedOrderForAddress(null);
          }}
          order={selectedOrderForAddress}
          onSuccess={handleAddressChanged}
        />
      )}
    </div>
  );
}
