import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../../stores/useAuthStore';
import UserDropdown from '../UserDropdown/UserDropdown';
import styles from './Header.module.css';

const Header = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className={styles['client-header']}>
      <div className={styles['client-header-container']}>
        <Link to="/" className={styles['client-logo']}>
          <span className={`material-symbols-outlined ${styles['logo-icon']}`}>pets</span>
          <span className={styles['logo-text']}>CozyPet</span>
        </Link>

        <div className={styles['client-header-actions']}>
          {!isAuthenticated ? (
            <div className={styles['auth-buttons']}>
              <Link to="/login" className={styles['btn-login']}>Đăng nhập</Link>
              <Link to="/register" className={styles['btn-register']}>Đăng ký</Link>
            </div>
          ) : (
            <div className={styles['user-profile-section']}>
              <button 
                className={styles['user-avatar-btn']}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <img 
                  src={user?.avatar || 'https://i.pravatar.cc/150'} 
                  alt="Avatar" 
                  className={styles['avatar-img']}
                />
              </button>
              {showDropdown && (
                <UserDropdown user={user} onClose={() => setShowDropdown(false)} />
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
