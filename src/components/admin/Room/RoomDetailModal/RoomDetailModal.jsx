import React from 'react';
import styles from './RoomDetailModal.module.css';

function RoomDetailModal({ isOpen, onClose, data, onEditClick }) {
  if (!isOpen || !data) return null;

  const handleEdit = () => {
    onClose();
    if (onEditClick) onEditClick(data);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>
            <span className="material-symbols-outlined">bedroom_parent</span>
            Chi tiết Phòng
          </h3>
          <button type="button" onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.imageSection}>
            <img 
              src={data.backgroundUrl || data.background_url || 'https://via.placeholder.com/400?text=Room'} 
              alt={data.name} 
              className={styles.roomImage} 
            />
          </div>
          <div className={styles.infoSection}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Mã phòng:</span>
              <span className={styles.infoValue}>{data.code}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Tên phòng:</span>
              <span className={styles.infoValue}>{data.name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Trạng thái:</span>
              <span className={styles.infoValue}>
                {data.status === 'active' ? (
                  <span className={styles.statusActive}>Hoạt động</span>
                ) : (
                  <span className={styles.statusInactive}>Dừng hoạt động</span>
                )}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Số lượng slots:</span>
              <span className={styles.infoValue}>{data.slots?.length || 0}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Mô tả:</span>
              <span className={styles.infoValue}>{data.description || 'Không có mô tả'}</span>
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            Đóng
          </button>
          <button type="button" className={styles.btnEdit} onClick={handleEdit}>
            Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoomDetailModal;
