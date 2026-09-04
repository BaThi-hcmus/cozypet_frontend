import React from 'react';
import { PetAvatarRig } from '../../../client/PetAvatarRig/PetAvatarRig';
import styles from './PetTemplatePreviewModal.module.css';

/**
 * Modal dùng riêng cho Admin để xem trước mẫu Pet trước khi lưu
 * @param isOpen - Trạng thái đóng/mở modal
 * @param onClose - Hàm xử lý khi tắt modal
 * @param petData - Dữ liệu của mẫu pet (type, headImg, bodyImg, name)
 */
export const PetTemplatePreviewModal = ({ isOpen, onClose, petData }) => {
  // Nếu modal không mở thì không render gì cả
  if (!isOpen) return null;

  const { type, headImg, bodyImg, name } = petData;

  return (
    // Lớp phủ nền mờ (Overlay) - Bấm ra ngoài là tắt modal
    <div className={styles['admin-modal-overlay']} onClick={onClose}>

      {/* Khung nội dung chính của modal (stopPropagation để click vào trong không bị tắt nhầm) */}
      <div className={styles['admin-modal-container']} onClick={(e) => e.stopPropagation()}>

        {/* Header của Modal */}
        <div className={styles['admin-modal-header']}>
          <h2 className={styles['admin-modal-title']}>Xem trước mẫu Pet</h2>
          {/* Nút đóng modal góc trên bên phải */}
          <button className={styles['admin-close-btn']} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Component pet avatar rig */}
        <div className={styles['admin-modal-body']}>
          <PetAvatarRig
            type={type}
            bodyImg={bodyImg}
            headImg={headImg}
            name={name}
          />
        </div>

        {/* Footer của Modal */}
        <div className={styles['admin-modal-footer']}>
          <button className={styles['admin-btn-secondary']} onClick={onClose}>
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};