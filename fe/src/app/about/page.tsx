'use client';

import { useState } from 'react';
import Image from "next/image";
import { FaStore, FaShieldAlt, FaHeart, FaAward, FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { PageHeader } from '@/app/components/ui';
import postsData from "./posts.json";
import styles from "./about.module.css";

interface Post {
  id: string;
  title: string;
  image?: string;
  content: string;
  related: string[];
}

const posts: Post[] = postsData as any;

// Company information and values
const companyInfo = {
  mainPost: posts[0],
  values: [
    {
      icon: FaShieldAlt,
      title: 'Chất lượng đảm bảo',
      description: 'Cam kết sản phẩm chất lượng cao, nguồn gốc rõ ràng và đảm bảo quyền lợi khách hàng.'
    },
    {
      icon: FaHeart,
      title: 'Phục vụ tận tâm',
      description: 'Đội ngũ nhân viên nhiệt tình, chu đáo, luôn sẵn sàng hỗ trợ khách hàng 24/7.'
    },
    {
      icon: FaAward,
      title: 'Xu hướng thời trang',
      description: 'Cập nhật liên tục các xu hướng mới nhất, mang đến phong cách hiện đại và trendy.'
    }
  ]
};

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('about');

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        {/* Page Header */}
        <PageHeader
          title="Về chúng tôi"
          subtitle="Tìm hiểu câu chuyện và giá trị của Fino Store"
          icon={FaStore}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Về chúng tôi', href: '/about' }
          ]}
        />

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Hero Section */}
          <div className={styles.heroSection}>
            {companyInfo.mainPost.image && (
              <div className={styles.heroImageWrap}>
                <Image
                  src={companyInfo.mainPost.image}
                  alt={companyInfo.mainPost.title}
                  width={1200}
                  height={400}
                  className={styles.heroImage}
                  priority
                />
                <div className={styles.heroOverlay}>
                  <h1 className={styles.heroTitle}>{companyInfo.mainPost.title}</h1>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className={styles.tabNavigation}>
            <button
              className={`${styles.tabButton} ${activeTab === 'about' ? styles.active : ''}`}
              onClick={() => setActiveTab('about')}
            >
              Giới thiệu
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'values' ? styles.active : ''}`}
              onClick={() => setActiveTab('values')}
            >
              Giá trị cốt lõi
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'mission' ? styles.active : ''}`}
              onClick={() => setActiveTab('mission')}
            >
              Sứ mệnh
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === 'about' && (
              <div className={styles.aboutContent}>
                <p className={styles.content}>{companyInfo.mainPost.content}</p>
              </div>
            )}

            {activeTab === 'values' && (
              <div className={styles.valuesContent}>
                <div className={styles.valuesGrid}>
                  {companyInfo.values.map((value, index) => (
                    <div key={index} className={styles.valueCard}>
                      <div className={styles.valueIcon}>
                        <value.icon />
                      </div>
                      <h3 className={styles.valueTitle}>{value.title}</h3>
                      <p className={styles.valueDescription}>{value.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'mission' && (
              <div className={styles.missionContent}>
                <div className={styles.missionCard}>
                  <h3 className={styles.missionTitle}>Sứ mệnh của chúng tôi</h3>
                  <p className={styles.missionText}>
                    Fino Store cam kết mang đến cho khách hàng những sản phẩm thời trang chất lượng cao với giá cả hợp lý, 
                    kết hợp với dịch vụ khách hàng xuất sắc. Chúng tôi không ngừng đổi mới và 
                    phát triển để trở thành thương hiệu thời trang được yêu thích nhất tại Việt Nam.
                  </p>
                </div>
                <div className={styles.visionCard}>
                  <h3 className={styles.visionTitle}>Tầm nhìn</h3>
                  <p className={styles.visionText}>
                    Trở thành nền tảng thương mại điện tử thời trang hàng đầu, nơi mọi người có thể 
                    tìm thấy phong cách riêng của mình và thể hiện cá tính một cách tự tin nhất.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Section - Horizontal at bottom */}
        <div className={styles.contactSection}>
          <div className={styles.contactHeader}>
            <h2 className={styles.contactTitle}>Liên hệ với chúng tôi</h2>
            <p className={styles.contactSubtitle}>Chúng tôi luôn sẵn sàng hỗ trợ bạn!</p>
          </div>
          
          <div className={styles.contactGrid}>
            <div className={styles.contactItem}>
              <div className={styles.contactIcon}>
                <FaEnvelope />
              </div>
              <div className={styles.contactDetails}>
                <h4>Email</h4>
                <p>huynguyenn8297@gmail.com</p>
                <p>support@finostore.vn</p>
              </div>
            </div>

            <div className={styles.contactItem}>
              <div className={styles.contactIcon}>
                <FaPhone />
              </div>
              <div className={styles.contactDetails}>
                <h4>Hotline</h4>
                <p>0901196480</p>
                <p>028-3456-7890</p>
              </div>
            </div>

            <div className={styles.contactItem}>
              <div className={styles.contactIcon}>
                <FaMapMarkerAlt />
              </div>
              <div className={styles.contactDetails}>
                <h4>Địa chỉ</h4>
                <p>Công Viên Phần Mềm Quang Trung</p>
                <p>Quận 12, TP.HCM</p>
              </div>
            </div>

            <div className={styles.contactItem}>
              <div className={styles.contactIcon}>
                <FaClock />
              </div>
              <div className={styles.contactDetails}>
                <h4>Giờ làm việc</h4>
                <p>Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                <p>Thứ 7 - CN: 9:00 - 17:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
