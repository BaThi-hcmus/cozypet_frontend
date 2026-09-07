import React, { useState, useEffect, useRef } from 'react';
import styles from './Header.module.css';
import ProfileModal from '../ProfileModal/ProfileModal';
import api from '../../../api/api';

const Header = () => {
  const [profile, setProfile] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalPosition, setModalPosition] = useState(null);
  const avatarRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/admin/auth/profile');
        if (response.data) {
          setProfile(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleAvatarClick = () => {
    if (profile && avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
      setIsProfileModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsProfileModalOpen(false);
    setModalPosition(null);
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerGreeting}>
          {loading ? 'Đang tải...' : `Xin chào, ${profile?.name || 'Admin'}! 🐾`}
        </div>

        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
            <input placeholder="Tìm kiếm pet, phòng..." type="text" />
          </div>

          <button className={styles.iconBtn}>
            <span className="material-symbols-outlined">notifications</span>
            <span className={styles.badge}></span>
          </button>

          <button className={styles.iconBtn}>
            <span className="material-symbols-outlined">chat_bubble</span>
          </button>

          <div
            ref={avatarRef}
            className={styles.avatar}
            onClick={handleAvatarClick}
            style={{ cursor: profile ? 'pointer' : 'default' }}
          >
            <img 
              alt={profile?.name || 'Admin'} 
              src={profile?.avatar || 'https://via.placeholder.com/150'} 
            />
          </div>
        </div>
      </header>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseModal}
        profile={profile}
        position={modalPosition}
      />
    </>
  );
};

export default Header;