import React from 'react';
import styles from './AccountDetailModal.module.css';

function AccountDetailModal({ isOpen, onClose, data, onEditClick }) {
  if (!isOpen || !data) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalContainer} ${styles.detailModalContainer}`}>
        <div className={styles.modalHeader}>
          <h3>Chi tiết tài khoản</h3>
          <button type="button" onClick={onClose}>×</button>
        </div>

        <div className={styles.detailModalBody}>
          <div className={styles.detailTopProfile}>
            <div className={styles.detailAvatarCircle}>
              <img src={data.avatar || ''} alt="Avatar" />
            </div>
            <h2>{data.fullName}</h2>
            <span className={styles.roleTag}>
              🛡️ {data.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
            </span>
          </div>

          <div className={styles.detailInfoGrid}>
            <div className={styles.infoCard}>
              <span>✉️ Email</span>
              <p>{data.email}</p>
            </div>
            <div className={styles.infoCard}>
              <span>📞 Số điện thoại</span>
              <p>{data.phoneNumber || 'Chưa cập nhật'}</p>
            </div>
            <div className={styles.infoCard}>
              <span>💵 Mức lương</span>
              <p>{data.salary ? `${Number(data.salary).toLocaleString()} VND` : 'Chưa có'}</p>
            </div>
            <div className={styles.infoCard}>
              <span>📊 Trạng thái</span>
              <p className={data.status === 'active' ? styles.textActive : styles.textInactive}>
                ● {data.status === 'active' ? 'Hoạt động' : 'Dừng hoạt động'}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnClose} onClick={onClose}>Đóng</button>
          <button
            type="button"
            className={styles.btnEdit}
            onClick={() => {
              onClose();
              onEditClick(data);
            }}
          >
            ✏️ Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccountDetailModal;