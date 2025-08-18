'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { User, OrderWithRefs } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button, Modal } from '@/app/components/ui';
import { 
  FaUser, 
  FaChartLine, 
  FaCalendarAlt, 
  FaShoppingBag,
  FaHeart,
  FaStar,
  FaGift,
  FaTrophy,
  FaFire,
  FaCrown,
  FaCamera,
  FaEdit,
  FaBell,
  FaCog,
  FaPalette,
  FaLanguage,
  FaDownload,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaShieldAlt
} from 'react-icons/fa';
import styles from './ProfileEnhancements.module.css';

interface ProfileEnhancementsProps {
  user: User;
  orders?: OrderWithRefs[];
  onUpdateProfile?: (data: any) => Promise<void>;
}

export function ProfileEnhancements({ user, orders = [], onUpdateProfile }: ProfileEnhancementsProps) {
  const router = useRouter();
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Enhanced user analytics
  const userAnalytics = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.finalTotal || 0), 0);
    const completedOrders = orders.filter(order => order.status === 'delivered').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    
    // Calculate membership tier
    let membershipTier = 'Bronze';
    let tierIcon = FaGift;
    let tierColor = '#cd7f32';
    
    if (totalSpent >= 10000000) { // 10M VND
      membershipTier = 'Diamond';
      tierIcon = FaCrown;
      tierColor = '#b9f2ff';
    } else if (totalSpent >= 5000000) { // 5M VND
      membershipTier = 'Gold';
      tierIcon = FaTrophy;
      tierColor = '#ffd700';
    } else if (totalSpent >= 2000000) { // 2M VND
      membershipTier = 'Silver';
      tierIcon = FaStar;
      tierColor = '#c0c0c0';
    }
    
    // Calculate loyalty points (1 point per 1000 VND)
    const loyaltyPoints = Math.floor(totalSpent / 1000);
    
    return {
      totalOrders,
      totalSpent,
      completedOrders,
      cancelledOrders,
      avgOrderValue,
      membershipTier,
      tierIcon,
      tierColor,
      loyaltyPoints,
      successRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
    };
  }, [orders]);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
        // Here you would typically upload to your server
        if (onUpdateProfile) {
          onUpdateProfile({ avatar: e.target?.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportData = () => {
    const userData = {
      profile: user,
      analytics: userAnalytics,
      orders: orders,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profile-data-${user.name || 'user'}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.profileEnhancements}>
      {/* Enhanced Profile Header */}
      <div className={styles.profileHeader}>
        <div className={styles.avatarSection}>
          <div 
            className={styles.avatarContainer}
            onClick={() => setShowAvatarModal(true)}
          >
            {profileImage || (user as any).avatar ? (
              <img 
                src={profileImage || (user as any).avatar} 
                alt="Profile" 
                className={styles.profileAvatar}
              />
            ) : (
              <div className={styles.defaultAvatar}>
                <FaUser />
              </div>
            )}
            <div className={styles.avatarOverlay}>
              <FaCamera />
            </div>
          </div>
          
          <div className={styles.profileInfo}>
            <h2 className={styles.userName}>{user.name}</h2>
            <p className={styles.userEmail}>{user.email}</p>
            
            {/* Membership Badge */}
            <div 
              className={styles.membershipBadge}
              style={{ 
                background: `linear-gradient(135deg, ${userAnalytics.tierColor}20, ${userAnalytics.tierColor}40)`,
                borderColor: userAnalytics.tierColor
              }}
            >
              <userAnalytics.tierIcon className={styles.tierIcon} style={{ color: userAnalytics.tierColor }} />
              <span>{userAnalytics.membershipTier} Member</span>
            </div>
          </div>
        </div>

        <div className={styles.profileActions}>
          <Button variant="outline" size="sm" onClick={() => setShowPreferences(true)}>
            <FaCog />
            Cài đặt
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <FaDownload />
            Xuất dữ liệu
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className={styles.analyticsGrid}>
        <div className={styles.analyticsCard}>
          <div className={styles.cardIcon}>
            <FaShoppingBag />
          </div>
          <div className={styles.cardContent}>
            <h4>Tổng đơn hàng</h4>
            <p className={styles.statValue}>{userAnalytics.totalOrders}</p>
            <span className={styles.statLabel}>đơn hàng</span>
          </div>
        </div>

        <div className={styles.analyticsCard}>
          <div className={styles.cardIcon}>
            <FaChartLine />
          </div>
          <div className={styles.cardContent}>
            <h4>Tổng chi tiêu</h4>
            <p className={styles.statValue}>{formatCurrency(userAnalytics.totalSpent)}</p>
            <span className={styles.statLabel}>đã chi tiêu</span>
          </div>
        </div>

        <div className={styles.analyticsCard}>
          <div className={styles.cardIcon}>
            <FaStar />
          </div>
          <div className={styles.cardContent}>
            <h4>Điểm tích lũy</h4>
            <p className={styles.statValue}>{userAnalytics.loyaltyPoints.toLocaleString()}</p>
            <span className={styles.statLabel}>điểm</span>
          </div>
        </div>

        <div className={styles.analyticsCard}>
          <div className={styles.cardIcon}>
            <FaCheckCircle />
          </div>
          <div className={styles.cardContent}>
            <h4>Tỷ lệ thành công</h4>
            <p className={styles.statValue}>{userAnalytics.successRate.toFixed(1)}%</p>
            <span className={styles.statLabel}>hoàn thành</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h3 className={styles.sectionTitle}>
          <FaFire className={styles.titleIcon} />
          Thao tác nhanh
        </h3>
        
        <div className={styles.actionGrid}>
          <div className={styles.actionCard} onClick={() => router.push('/orders')}>
            <FaShoppingBag className={styles.actionIcon} />
            <span>Đơn hàng</span>
          </div>
          
          <div className={styles.actionCard} onClick={() => router.push('/wishlist')}>
            <FaHeart className={styles.actionIcon} />
            <span>Yêu thích</span>
          </div>
          
          <div className={styles.actionCard} onClick={() => router.push('/reviews')}>
            <FaStar className={styles.actionIcon} />
            <span>Đánh giá</span>
          </div>
          
          <div className={styles.actionCard} onClick={() => router.push('/support')}>
            <FaShieldAlt className={styles.actionIcon} />
            <span>Hỗ trợ</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {orders.length > 0 && (
        <div className={styles.recentActivity}>
          <h3 className={styles.sectionTitle}>
            <FaClock className={styles.titleIcon} />
            Hoạt động gần đây
          </h3>
          
          <div className={styles.activityList}>
            {orders.slice(0, 3).map(order => (
              <div key={order._id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  <FaShoppingBag />
                </div>
                <div className={styles.activityContent}>
                  <p>Đơn hàng #{order.orderCode}</p>
                  <span>{formatCurrency(order.finalTotal || 0)} • {new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className={styles.activityStatus}>
                  {order.status === 'delivered' ? <FaCheckCircle style={{ color: '#10b981' }} /> : 
                   order.status === 'cancelled' ? <FaTimesCircle style={{ color: '#ef4444' }} /> :
                   <FaClock style={{ color: '#f59e0b' }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Avatar Upload Modal */}
      {showAvatarModal && (
        <Modal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          title="Cập nhật ảnh đại diện"
          className={styles.avatarModal}
        >
          <div className={styles.avatarUploadContent}>
            <div className={styles.currentAvatar}>
              {profileImage || (user as any).avatar ? (
                <img 
                  src={profileImage || (user as any).avatar} 
                  alt="Current avatar" 
                />
              ) : (
                <div className={styles.defaultAvatarLarge}>
                  <FaUser />
                </div>
              )}
            </div>
            
            <div className={styles.uploadOptions}>
              <label className={styles.uploadButton}>
                <FaCamera />
                Chọn ảnh mới
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </Modal>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <Modal
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
          title="Cài đặt tài khoản"
          className={styles.preferencesModal}
        >
          <div className={styles.preferencesContent}>
            <div className={styles.preferenceSection}>
              <h4>
                <FaBell className={styles.sectionIcon} />
                Thông báo
              </h4>
              <div className={styles.preferenceItems}>
                <label className={styles.preferenceItem}>
                  <input type="checkbox" defaultChecked />
                  <span>Thông báo đơn hàng</span>
                </label>
                <label className={styles.preferenceItem}>
                  <input type="checkbox" defaultChecked />
                  <span>Khuyến mãi & Ưu đãi</span>
                </label>
                <label className={styles.preferenceItem}>
                  <input type="checkbox" />
                  <span>Sản phẩm mới</span>
                </label>
              </div>
            </div>
            
            <div className={styles.preferenceSection}>
              <h4>
                <FaPalette className={styles.sectionIcon} />
                Giao diện
              </h4>
              <div className={styles.preferenceItems}>
                <label className={styles.preferenceItem}>
                  <input type="radio" name="theme" defaultChecked />
                  <span>Sáng</span>
                </label>
                <label className={styles.preferenceItem}>
                  <input type="radio" name="theme" />
                  <span>Tối</span>
                </label>
                <label className={styles.preferenceItem}>
                  <input type="radio" name="theme" />
                  <span>Tự động</span>
                </label>
              </div>
            </div>
            
            <div className={styles.preferenceSection}>
              <h4>
                <FaLanguage className={styles.sectionIcon} />
                Ngôn ngữ
              </h4>
              <div className={styles.preferenceItems}>
                <label className={styles.preferenceItem}>
                  <input type="radio" name="language" defaultChecked />
                  <span>Tiếng Việt</span>
                </label>
                <label className={styles.preferenceItem}>
                  <input type="radio" name="language" />
                  <span>English</span>
                </label>
              </div>
            </div>
            
            <div className={styles.preferenceActions}>
              <Button onClick={() => setShowPreferences(false)}>
                Lưu cài đặt
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// User Achievement Badge Component
interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: React.ComponentType;
  achieved: boolean;
  progress?: number;
}

export function AchievementBadge({ title, description, icon: Icon, achieved, progress }: AchievementBadgeProps) {
  return (
    <div className={`${styles.achievementBadge} ${achieved ? styles.achieved : ''}`}>
      <div className={styles.badgeIcon}>
        <Icon />
      </div>
      <div className={styles.badgeContent}>
        <h5>{title}</h5>
        <p>{description}</p>
        {!achieved && progress !== undefined && (
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
