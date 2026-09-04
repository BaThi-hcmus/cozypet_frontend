import React from 'react';
import styles from './ItemDetailModal.module.css';
import { FaRegEdit } from 'react-icons/fa';

function ItemDetailModal({ constants, isOpen, onClose, data, onEditClick }) {
  if (!isOpen || !data) return null;

  const typeLabels = {};
  constants?.types?.forEach((type) => {
    typeLabels[type.value] = type.label;
  })

  const slotTypeLabels = {};
  constants?.slotTypes?.forEach((slot) => {
    slotTypeLabels[slot.value] = slot.label;
  })

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(data.price || 0);

  const formattedCreatedAt = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '---';

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>
            <span>🐶</span> Chi tiết Vật phẩm
          </h3>
          <button type="button" className={styles.btnCloseIcon} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Cột trái: Ảnh to sinh động */}
          <div className={styles.imageCardFrame}>
            {data.image ? (
              <img src={data.image} alt={data.name} className={styles.itemDetailImg} />
            ) : (
              <div className={styles.placeholderDetailImage}>
                <span>🧸</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Chưa có ảnh</span>
              </div>
            )}
            <div className={styles.pawBadge}>CozyPet Item</div>
          </div>

          {/* Cột phải: Chi tiết các thuộc tính */}
          <div className={styles.infoContent}>
            <h2 className={styles.itemName}>{data.name}</h2>

            <div className={styles.badgesRow}>
              <span className={styles.badgeType}>
                {typeLabels[data.type] || data.type}
              </span>
              <span className={styles.badgeCategory}>{data.category}</span>
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

            <div className={styles.priceBox}>
              <span className={styles.priceLabel}>Giá bán niêm yết</span>
              <span className={priceValueStyle(data.price)}>{formattedPrice}</span>
            </div>

            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Kích thước (Rộng x Cao)</span>
                <span className={styles.detailValue}>
                  {data.width ?? 1} x {data.height ?? 1} ô
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Vị trí đặt (Slot Type)</span>
                <span className={styles.detailValue}>
                  {slotTypeLabels[data.slotType] || data.slotType || 'Sàn giữa (center_floor)'}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Ngày khởi tạo</span>
                <span className={styles.detailValue}>{formattedCreatedAt}</span>
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
              <FaRegEdit /> Chỉnh sửa vật phẩm
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

function priceValueStyle(price) {
  return price > 0 ? styles.priceValue : `${styles.priceValue} ${styles.freePrice}`;
}

export default ItemDetailModal;
