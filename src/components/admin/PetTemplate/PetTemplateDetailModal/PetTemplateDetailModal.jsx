import React from 'react';
import styles from './PetTemplateDetailModal.module.css';
import { FaRegEdit } from 'react-icons/fa';

const speciesLabels = {
  dog: '🐶 Chó',
  cat: '🐱 Mèo',
};

const catTraitLabels = {
  earShape: 'Hình tai',
  faceShape: 'Khuôn mặt',
  eyeColor: 'Màu mắt',
};

const dogTraitLabels = {
  size: 'Kích thước',
  earType: 'Loại tai',
  muzzleShape: 'Hình mõm',
  tailType: 'Loại đuôi',
};

function formatValue(value) {
  if (!value || value === 'none') return '—';
  return String(value).replace(/_/g, ' ');
}

function PetTemplateDetailModal({ isOpen, onClose, data, onEditClick }) {
  if (!isOpen || !data) return null;

  const traits = data.traits || {};
  const isCat = data.species === 'cat';
  const traitLabels = isCat ? catTraitLabels : dogTraitLabels;

  const formattedCreatedAt = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>
            <span>🐾</span> Chi tiết Mẫu Pet
          </h3>
          <button type="button" className={styles.btnCloseIcon} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.imageCardFrame}>
            {data.avatar ? (
              <img src={data.avatar} alt={data.name} className={styles.detailImg} />
            ) : (
              <div className={styles.placeholderDetailImage}>
                <span>🐾</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Chưa có ảnh</span>
              </div>
            )}
            <div className={styles.aiBadge}>✨ Gemini AI</div>
          </div>

          <div className={styles.infoContent}>
            <h2 className={styles.petName}>{data.name}</h2>

            <div className={styles.badgesRow}>
              <span
                className={`${styles.badgeSpecies} ${
                  data.species === 'dog' ? styles.badgeSpeciesDog : ''
                }`}
              >
                {speciesLabels[data.species] || data.species}
              </span>
              <span className={styles.badgeCode}>{data.templateId}</span>
              <span
                className={
                  data.status === 'active'
                    ? styles.badgeStatusActive
                    : styles.badgeStatusInactive
                }
              >
                {data.status === 'active' ? '● Hoạt động' : '● Dừng hoạt động'}
              </span>
            </div>

            <div>
              <h4 className={styles.sectionTitle}>Đặc điểm lông (AI phân tích)</h4>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Màu chính</span>
                  <span className={styles.detailValue}>{formatValue(data.primaryColor)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Màu phụ</span>
                  <span className={styles.detailValue}>{formatValue(data.secondaryColor)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Họa tiết lông</span>
                  <span className={styles.detailValue}>{formatValue(data.coatPattern)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Độ dài lông</span>
                  <span className={styles.detailValue}>{formatValue(data.coatLength)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className={styles.sectionTitle}>
                Traits {isCat ? 'mèo' : 'chó'} (AI phân tích)
              </h4>
              <div className={styles.detailGrid}>
                {Object.entries(traitLabels).map(([key, label]) => (
                  <div key={key} className={styles.detailItem}>
                    <span className={styles.detailLabel}>{label}</span>
                    <span className={styles.detailValue}>{formatValue(traits[key])}</span>
                  </div>
                ))}
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Ngày tạo</span>
                  <span className={styles.detailValue}>{formattedCreatedAt}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          {onEditClick && (
            <button
              type="button"
              className={styles.btnEdit}
              onClick={() => {
                onClose();
                onEditClick(data);
              }}
            >
              <FaRegEdit /> Chỉnh sửa mẫu pet
            </button>
          )}
          <button type="button" className={styles.btnClose} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default PetTemplateDetailModal;
