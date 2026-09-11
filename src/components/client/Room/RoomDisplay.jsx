import React, { useState } from 'react';
import styles from './RoomDisplay.module.css';
import { PetAvatarRig } from '../Pet/PetAvatarRig';
import ItemReplaceModal from './ItemReplaceModal';
import api from '../../../api/api';
import { toast } from 'react-toastify';

const STATUS_META = [
  { key: 'hunger', label: 'Đói', icon: 'restaurant', color: '#ff9a62' },
  { key: 'energy', label: 'Năng lượng', icon: 'bolt', color: '#7ec8e3' },
  { key: 'happiness', label: 'Vui vẻ', icon: 'favorite', color: '#ff8fa3' },
];

function slotStyle(slot, canvasSize) {
  const scaleFactor = slot.scaleFactor || 1;

  return {
    left: `${(slot.x / canvasSize) * 100}%`,
    top: `${(slot.y / canvasSize) * 100}%`,
    width: `${scaleFactor * 100}%`,
    height: `${scaleFactor * 100}%`,
    zIndex: slot.zIndex || 1,
  };
}

function toId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  return String(value);
}

export default function RoomDisplay({
  canvasSize = 1000,
  profile,
  room,
  placedItems = [],
  pet,
  petTemplate,
  inventoryCount = 0,
  userInfo = null,
  onRefresh = () => {},
}) {
  const [selectedSlotData, setSelectedSlotData] = useState(null);

  if (!room) return null;

  const petName = pet?.name || petTemplate?.name || 'Bạn nhỏ';
  const petStatus = pet?.status || {};
  const hasLayers = petTemplate?.layers && Object.keys(petTemplate.layers).length > 0;

  const currentUserRoom = userInfo?.userRooms
    ? userInfo.userRooms.find((ur) => toId(ur.roomId) === toId(room._id) || ur.isCurrent) || userInfo.userRooms[0]
    : null;

  const userItems = userInfo?.userItems || [];
  const allItems = userInfo?.items || [];

  const handleOpenReplaceModal = (slotKey, slot, item) => {
    setSelectedSlotData({ slotKey, slot, item });
  };

  const handleCloseReplaceModal = () => {
    setSelectedSlotData(null);
  };

  const handleSelectItem = async (newItem, newUserItem) => {
    if (!currentUserRoom) {
      toast.error('Không tìm thấy thông tin phòng của bạn');
      return;
    }

    try {
      const userRoomId = toId(currentUserRoom._id);
      const slotKey = selectedSlotData.slotKey;
      const insertItemId = toId(newUserItem._id);

      await api.post(`/rooms/${userRoomId}/replace-item`, {
        slotKey,
        insertItemId: toId(newUserItem._id),
      });

      toast.success('Đổi vật phẩm thành công!');
      handleCloseReplaceModal();
      onRefresh(); // Gọi hàm fetch lại dữ liệu ngầm mà không reload trang
    } catch (err) {
      console.error('Replace item error:', err);
      toast.error(err.response?.data?.message || 'Không thể thay thế vật phẩm');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={`${styles.ambientBlob} ${styles.blob1}`} />
      <div className={`${styles.ambientBlob} ${styles.blob2}`} />
      <div className={`${styles.ambientBlob} ${styles.blob3}`} />

      <main className={styles.layout}>
        <aside className={styles.sideCard}>
          <div className={styles.roomBadge}>
            <span className="material-symbols-outlined">cottage</span>
            <span>Phòng của {profile?.fullName?.split(' ')[0] || 'bạn'}</span>
          </div>

          <h1 className={styles.roomTitle}>{room.name}</h1>
          {room.description && <p className={styles.roomDescription}>{room.description}</p>}

          <div className={styles.petCard}>
            <div className={styles.petCardHeader}>
              <span className="material-symbols-outlined">pets</span>
              <div>
                <strong>{petName}</strong>
                <p>
                  Lv. {pet?.level || 1} · {petTemplate?.species === 'cat' ? 'Mèo' : 'Chó'}
                </p>
              </div>
            </div>

            <div className={styles.statusList}>
              {STATUS_META.map((stat) => {
                const value = Math.max(0, Math.min(100, Number(petStatus[stat.key] ?? 100)));
                return (
                  <div key={stat.key} className={styles.statusRow}>
                    <div className={styles.statusLabel}>
                      <span className="material-symbols-outlined">{stat.icon}</span>
                      {stat.label}
                      <em>{value}</em>
                    </div>
                    <div className={styles.statusTrack}>
                      <span
                        className={styles.statusFill}
                        style={{ width: `${value}%`, background: stat.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.metaChips}>
            <div className={styles.chip}>
              <span className="material-symbols-outlined">inventory_2</span>
              {inventoryCount} vật phẩm
            </div>
            <div className={styles.chip}>
              <span className="material-symbols-outlined">chair</span>
              {placedItems.length} đang bày
            </div>
          </div>
        </aside>

        <section className={styles.sceneColumn}>
          <div className={styles.sceneFrame}>
            <div
              className={styles.roomScene}
              style={{
                width: `min(${canvasSize}px, 100%)`,
              }}
            >
              <img
                src={room.background_url}
                alt={room.name}
                className={styles.roomBackground}
              />

              {placedItems.map(({ slotKey, slot, item }) => (
                <div
                  key={slotKey}
                  className={`${styles.itemSlot} ${styles.interactiveSlot}`}
                  style={slotStyle(slot, canvasSize)}
                  onClick={() => handleOpenReplaceModal(slotKey, slot, item)}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className={styles.itemImage}
                    draggable={false}
                  />
                  <div className={styles.itemTooltip}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemCategory}>{item.category}</span>
                  </div>
                  <div className={styles.replaceOverlay}>
                    <span className="material-symbols-outlined">swap_horiz</span>
                    <span>Đổi vật phẩm</span>
                  </div>
                </div>
              ))}

              {(hasLayers || petTemplate?.avatar) && (
                <div className={styles.petAnchor}>
                  <div className={styles.petNameTag}>
                    <span className="material-symbols-outlined">favorite</span>
                    {petName}
                  </div>
                  {hasLayers ? (
                    <PetAvatarRig
                      type={petTemplate.species}
                      layers={petTemplate.layers}
                      globalZoom={petTemplate.globalZoom}
                      globalOffset={petTemplate.globalOffset || { x: 0, y: 0 }}
                      name={petName}
                      compact
                      showInfo={false}
                    />
                  ) : (
                    <img
                      src={petTemplate.avatar}
                      alt={petName}
                      className={styles.petFallback}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <p className={styles.hint}>
            Chạm vào bé để chơi · Click vào vật phẩm trong phòng để đổi vật phẩm khác
          </p>
        </section>
      </main>

      {selectedSlotData && (
        <ItemReplaceModal
          open={!!selectedSlotData}
          onClose={handleCloseReplaceModal}
          slotKey={selectedSlotData.slotKey}
          slot={selectedSlotData.slot}
          room={room}
          items={allItems}
          userItems={userItems}
          currentDecorationItemId={selectedSlotData.item._id}
          currentPlacedItem={selectedSlotData.item}
          onSelectItem={handleSelectItem}
        />
      )}
    </div>
  );
}
