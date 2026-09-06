import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // Nhúng Sidebar của bạn vào đây
import Header from './Header';  // Nhúng Header của bạn vào đây
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  return (
    <div className={styles.layoutWrapper}>
      {/* Gọi component Sidebar */}
      <Sidebar />

      {/* Vung chứa Header và Main Content */}
      <main className={styles.layoutMain}>
        {/* Gọi component Header */}
        <Header />

        {/* Nơi chứa nội dung các trang con thay đổi theo URL */}
        <div className={styles.layoutContent}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;