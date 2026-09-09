import React from 'react';
import styles from './RoomDisplay.module.css';
import { PetAvatarRig } from '../Pet/PetAvatarRig';

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

export default function RoomDisplay({
  canvasSize = 1000,
  profile,
  room,
  placedItems = [],
  pet,
  petTemplate,
  inventoryCount = 0,
}) {
  if (!room) return null;

  const petName = pet?.name || petTemplate?.name || 'Bạn nhỏ';
  const petStatus = pet?.status || {};
  const hasLayers = petTemplate?.layers && Object.keys(petTemplate.layers).length > 0;

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
                  className={styles.itemSlot}
                  style={slotStyle(slot, canvasSize)}
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
            Chạm vào bé để chơi · Đồ vật được đặt đúng vị trí và tỷ lệ trong phòng 1000×1000
          </p>
        </section>
      </main>
    </div>
  );
}
