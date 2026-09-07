import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/useAuthStore';
import styles from './UserDropdown.module.css';

const UserDropdown = ({ user, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const dropdownRef = useRef(null);

  // Xử lý click ra ngoài để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    onClose();
  };

  return (
    <div className={styles['user-dropdown-container']} ref={dropdownRef}>
      <div className={styles['user-dropdown-header']}>
        <img
          src={user?.avatar || 'https://i.pravatar.cc/150'}
          alt="avatar"
          className={styles['user-dropdown-avatar']}
        />
        <div className={styles['user-dropdown-info']}>
          <p className={styles['user-dropdown-name']}>{user?.fullName}</p>
          <p className={styles['user-dropdown-email']}>{user?.email}</p>
        </div>
      </div>
      <div className={styles['user-dropdown-menu']}>
        <button className={styles['user-dropdown-item']}>
          <span className="material-symbols-outlined">person</span>
          Thông tin cá nhân
        </button>
        <button className={styles['user-dropdown-item']}>
          <span className="material-symbols-outlined">settings</span>
          Cài đặt
        </button>
        <div className={styles['user-dropdown-divider']}></div>
        <button className={`${styles['user-dropdown-item']} ${styles.logout}`} onClick={handleLogout}>
          <span className="material-symbols-outlined">logout</span>
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default UserDropdown;
