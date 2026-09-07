import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import useAuthStore from '../../../stores/useAuthStore';
import styles from './ClientLayout.module.css';

const ClientLayout = () => {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className={styles['client-loading-screen']}>
        <span className={`material-symbols-outlined ${styles['client-loading-icon']}`}>pets</span>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className={styles['client-layout']}>
      <Header />
      <main className={styles['client-main-content']}>
        <Outlet />
      </main>
    </div>
  );
};

export default ClientLayout;
