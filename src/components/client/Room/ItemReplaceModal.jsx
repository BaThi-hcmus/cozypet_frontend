import React, { useMemo } from 'react';
import styles from './ItemReplaceModal.module.css';

function toId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  return String(value);
}

const LABELS = {
  left_floor: 'Sàn trái',
  center_floor: 'Sàn giữa',
  right_floor: 'Sàn phải',
  left_wall: 'Tường trái',
  center_wall: 'Tường giữa',
  right_wall: 'Tường phải',
  ceiling: 'Trần nhà',
  other: 'Vị trí khác',
  furniture: 'Nội thất',
  decoration: 'Trang trí',
  food: 'Thức ăn',
  toy: 'Đồ chơi',
};

export default function ItemReplaceModal({
  open,
  onClose,
  slotKey,
  slot,
  room,
  items = [],
  userItems = [],
  currentDecorationItemId,
  onSelectItem,
}) {
  if (!open || !slot) return null;

  const itemById = useMemo(() => {
    const map = new Map();
    items.forEach((item) => map.set(toId(item._id), item));
    return map;
  }, [items]);

  const filteredItems = useMemo(() => {
    const result = [];
    const seen = new Set();

    userItems.forEach((userItem) => {
      if (!userItem || !userItem.quantity || userItem.quantity < 1) return;

      const itemId = toId(userItem.itemId) || toId(userItem._id);
      if (!itemId || seen.has(itemId)) return;

      const item = itemById.get(itemId);
      if (!item) return;
      if (item.deleted || item.status === 'inactive') return;

      // Filter 1: slotType match or item.slotType === 'other'
      const slotMatch =
        !slot.slotType ||
        item.slotType === slot.slotType ||
        item.slotType === 'other';
      if (!slotMatch) return;

      // Filter 2: category match if slot has category
      if (slot.category && item.category !== slot.category) return;

      // Filter 3: type match if slot has type
      if (slot.type && item.type !== slot.type) return;

      // Filter 4: roomCode match or global (empty item.roomCode)
      const roomCode = (room && (room.code || room.roomCode)) || '';
      const itemRoomCode = item.roomCode || '';
      if (roomCode && itemRoomCode && roomCode !== itemRoomCode) return;

      seen.add(itemId);
      result.push({
        userItem,
        item,
        quantity: userItem.quantity || 0,
      });
    });

    return result;
  }, [userItems, itemById, slot, room]);

  const currentDecoId = toId(currentDecorationItemId);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.headerInfo}>
            <h3>
              <span className="material-symbols-outlined">swap_horiz</span>
              Thay đồ vật cho vị trí này
            </h3>
            <div className={styles.subTitle}>
              Slot: <strong>{slotKey}</strong> · Chọn 1 vật phẩm từ kho của bạn
            </div>
          </div>
          <button
            className={styles.btnCloseIcon}
            onClick={onClose}
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className={styles.filterInfoRow}>
          {slot.slotType && (
            <span className={styles.filterChip}>
              <span className={styles.chipKey}>Vị trí</span>
              {LABELS[slot.slotType] || slot.slotType}
            </span>
          )}
          {slot.type && (
            <span className={styles.filterChip}>
              <span className={styles.chipKey}>Loại</span>
              {LABELS[slot.type] || slot.type}
            </span>
          )}
          {slot.category && (
            <span className={styles.filterChip}>
              <span className={styles.chipKey}>Danh mục</span>
              {slot.category}
            </span>
          )}
          {room?.code && (
            <span className={styles.filterChip}>
              <span className={styles.chipKey}>Phòng</span>
              {room.code}
            </span>
          )}
        </div>

        <div className={styles.modalBody}>
          {filteredItems.length === 0 ? (
            <div className={styles.emptyState}>
              <span className="material-symbols-outlined">inventory_2</span>
              <p>
                <strong>Không có vật phẩm phù hợp</strong>
                <br />
                Kho của bạn hiện không có vật phẩm nào thỏa mãn tiêu chí lọc
                cho vị trí này.
              </p>
            </div>
          ) : (
            <div className={styles.itemsGrid}>
              {filteredItems.map(({ userItem, item, quantity }) => {
                const itemId = toId(item._id);
                const isPlaced = currentDecoId && currentDecoId === itemId;
                return (
                  <div
                    key={itemId}
                    className={`${styles.itemCard} ${
                      isPlaced ? styles.isPlaced : ''
                    }`}
                    onClick={() => onSelectItem && onSelectItem(item, userItem)}
                  >
                    <div className={styles.itemImageWrap}>
                      {isPlaced && (
                        <span className={styles.placedBadge}>
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                            check
                          </span>
                          Đang bày
                        </span>
                      )}
                      <span className={styles.quantityBadge}>×{quantity}</span>
                      <img
                        src={item.image || item.image_url}
                        alt={item.name}
                        className={styles.itemImage}
                        draggable={false}
                      />
                    </div>
                    <div className={styles.itemInfo}>
                      <h4 className={styles.itemName}>{item.name}</h4>
                      <div className={styles.itemMeta}>
                        {item.category && (
                          <span
                            className={`${styles.metaBadge} ${styles.metaCategory}`}
                          >
                            {item.category}
                          </span>
                        )}
                        {item.roomCode ? (
                          <span
                            className={`${styles.metaBadge} ${styles.metaRoom}`}
                          >
                            {item.roomCode}
                          </span>
                        ) : (
                          <span
                            className={`${styles.metaBadge} ${styles.metaRoomGlobal}`}
                          >
                            Toàn cục
                          </span>
                        )}
                      </div>
                      {item.price && item.price > 0 && (
                        <div className={styles.priceTag}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            paid
                          </span>
                          {item.price.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnClose} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
