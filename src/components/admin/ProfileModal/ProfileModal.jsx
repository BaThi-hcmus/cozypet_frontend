import React from 'react';
import styles from './ProfileModal.module.css';

export default function ProfileModal({ isOpen, onClose, profile, position }) {
  if (!isOpen || !profile) return null;

  const modalStyle = position ? {
    position: 'absolute',
    top: position.top,
    right: position.right,
    left: 'auto',
    transform: 'none',
  } : {};

  const overlayStyle = position ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'auto',
    background: 'transparent',
    backdropFilter: 'none',
  } : {};

  return (
    <div className={styles.modalOverlay} onClick={onClose} style={overlayStyle}>
      <div
        className={`${styles.modalContainer} ${position ? styles.positionedModal : ''}`}
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Thông tin tài khoản</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {/* Profile Content */}
        <div className={styles.modalBody}>
          {/* User Info */}
          <div className={styles.infoSection}>
            <div className={styles.infoGroup}>
              <label className={styles.infoLabel}>
                <span className="material-symbols-rounded">person</span>
                Họ tên
              </label>
              <div className={styles.infoValue}>{profile.fullName}</div>
            </div>

            <div className={styles.infoGroup}>
              <label className={styles.infoLabel}>
                <span className="material-symbols-rounded">email</span>
                Email
              </label>
              <div className={styles.infoValue}>{profile.email}</div>
            </div>

            <div className={styles.infoGroup}>
              <label className={styles.infoLabel}>
                <span className="material-symbols-rounded">phone</span>
                Số điện thoại
              </label>
              <div className={styles.infoValue}>{profile.phoneNumber || 'Chưa cập nhật'}</div>
            </div>

            <div className={styles.infoGroup}>
              <label className={styles.infoLabel}>
                <span className="material-symbols-rounded">payments</span>
                Mức lương
              </label>
              <div className={styles.infoValue}>
                {profile.salary ? `${profile.salary.toLocaleString('vi-VN')} VNĐ` : 'Chưa cập nhật'}
              </div>
            </div>

            <div className={styles.infoGroup}>
              <label className={styles.infoLabel}>
                <span className="material-symbols-rounded">admin_panel_settings</span>
                Vai trò
              </label>
              <div className={styles.infoValue}>
                <span className={styles.roleBadge}>{profile.role}</span>
              </div>
            </div>

            <div className={styles.infoGroup}>
              <label className={styles.infoLabel}>
                <span className="material-symbols-rounded">event</span>
                Ngày tạo
              </label>
              <div className={styles.infoValue}>
                {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>

            <div className={styles.infoGroup}>
              <label className={styles.infoLabel}>
                <span className="material-symbols-rounded">schedule</span>
                Cập nhật lần cuối
              </label>
              <div className={styles.infoValue}>
                {new Date(profile.updatedAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.modalFooter}>
          <button className={styles.logoutButton} onClick={onClose}>
            <span className="material-symbols-rounded">logout</span>
            <span>Đóng</span>
          </button>
        </div>
      </div>
    </div>
  );
}
