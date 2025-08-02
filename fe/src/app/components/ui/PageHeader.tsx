'use client';

import React from 'react';
import Link from 'next/link';
import { IconType } from 'react-icons';
import { FaArrowLeft } from 'react-icons/fa';
import styles from './PageHeader.module.css';

interface Breadcrumb {
  label: string;
  href: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: IconType;
  backLink?: {
    href: string;
    label: string;
  };
  breadcrumbs?: Breadcrumb[];
  showSearch?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  icon: IconComponent,
  backLink,
  breadcrumbs,
  showSearch = false,
  actions,
  className = ''
}: PageHeaderProps) {
  return (
    <div className={`${styles.pageHeader} ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className={styles.breadcrumbs}>
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.href}>
              <Link href={breadcrumb.href} className={styles.breadcrumbLink}>
                {breadcrumb.label}
              </Link>
              {index < breadcrumbs.length - 1 && (
                <span className={styles.breadcrumbSeparator}>{'>'}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Back Link */}
      {backLink && (
        <Link href={backLink.href} className={styles.backLink}>
          <FaArrowLeft />
          <span>{backLink.label}</span>
        </Link>
      )}

      {/* Title Section */}
      <div className={styles.titleSection}>
        <h1 className={styles.pageTitle}>
          {IconComponent && <IconComponent className={styles.titleIcon} />}
          {title}
        </h1>
        {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
      </div>

      {/* Actions Section */}
      {actions && (
        <div className={styles.actionsSection}>
          {actions}
        </div>
      )}

      {/* Search Section - placeholder for future implementation */}
      {showSearch && (
        <div className={styles.searchSection}>
          {/* SearchBar component sẽ được implement sau */}
        </div>
      )}
    </div>
  );
}
