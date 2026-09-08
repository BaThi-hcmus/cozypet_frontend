import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from '../Header/Header';
import useAuthStore from '../../../stores/useAuthStore';
import styles from './ClientLayout.module.css';

const ClientLayout = () => {
  const { checkAuth, isLoading, isAuthenticated, hasPet } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Nếu đã login và có pet, đang ở trang onboarding thì redirect sang room
    if (isAuthenticated && hasPet && location.pathname === '/') {
      navigate('/room', { replace: true });
    }
    // Nếu đã login nhưng chưa có pet, đang ở trang room thì redirect về onboarding
    if (isAuthenticated && !hasPet && location.pathname === '/room') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, hasPet, location.pathname, navigate]);

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
