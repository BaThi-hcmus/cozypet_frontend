import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './RoomDisplay.module.css';
import { PetAvatarRigLayered } from '../Pet/PetAvatarRigLayered';
import ItemReplaceModal from './ItemReplaceModal';
import api from '../../../api/api';
import useRoomStore from '../../../stores/useRoomStore';
import { toast } from 'react-toastify';
import { useRoomInteraction } from '../../../hooks/useRoomInteraction';

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
}) {
  const [selectedSlotData, setSelectedSlotData] = useState(null);
  const [isReplaceMode, setIsReplaceMode] = useState(false); // Trạng thái bật/tắt chế độ đổi vật phẩm
  const replaceItemInStore = useRoomStore((state) => state.replaceItemInStore);
  // ref lưu click handler của pet — được đăng ký bởi PetAvatarRigLayered
  const petClickHandlerRef = useRef(null);
  const handleRegisterPetClick = useCallback((fn) => { petClickHandlerRef.current = fn; }, []);

  // ── Pixel-perfect hit detection cho items ─────────────────────────────────
  const [hoveredSlotKey, setHoveredSlotKey] = useState(null);
  // { [slotKey]: CanvasRenderingContext2D | null | 'loading' }
  const imageCanvasCache = useRef({});
  const loadedImagesRef = useRef({});
  const placedItemsRef = useRef(placedItems);

  // Preload ảnh vào offscreen canvas cache (vẽ 1 lần, đọc nhiều lần)
  useEffect(() => {
    placedItemsRef.current = placedItems;
    placedItems.forEach(({ slotKey, item }) => {
      if (slotKey in imageCanvasCache.current) return; // đã có hoặc đang load
      imageCanvasCache.current[slotKey] = 'loading';
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = item.image;
      img.onload = () => {
        loadedImagesRef.current[slotKey] = img;
        try {
          const offscreen = document.createElement('canvas');
          offscreen.width = img.naturalWidth;
          offscreen.height = img.naturalHeight;
          const ctx = offscreen.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);
          imageCanvasCache.current[slotKey] = ctx;
        } catch (_) {
          imageCanvasCache.current[slotKey] = null; // CORS fallback
        }
      };
      img.onerror = () => { imageCanvasCache.current[slotKey] = null; };
    });
  }, [placedItems]);

  /**
   * Kiểm tra pixel-perfect: (sceneX, sceneY) trong không gian 0–1000.
   * Trả về item đầu tiên (zIndex cao nhất) có alpha > 10 tại vị trí đó.
   */
  const hitTestItems = useCallback((sceneX, sceneY) => {
    const items = placedItemsRef.current;
    const sorted = [...items].sort((a, b) => (b.slot.zIndex || 1) - (a.slot.zIndex || 1));
    for (const { slotKey, slot, item } of sorted) {
      const sf = slot.scaleFactor || 1;
      const iX = slot.x, iY = slot.y;
      const iW = sf * 1000, iH = sf * 1000;
      if (sceneX < iX || sceneX > iX + iW || sceneY < iY || sceneY > iY + iH) continue;
      const ctx = imageCanvasCache.current[slotKey];
      if (ctx === 'loading' || ctx === undefined) continue; // chưa load
      if (ctx === null) return { slotKey, slot, item }; // CORS fallback
      const img = loadedImagesRef.current[slotKey];
      if (!img) continue;
      const px = Math.floor(((sceneX - iX) / iW) * img.naturalWidth);
      const py = Math.floor(((sceneY - iY) / iH) * img.naturalHeight);
      try {
        const alpha = ctx.getImageData(px, py, 1, 1).data[3];
        if (alpha > 10) return { slotKey, slot, item };
      } catch (_) {
        return { slotKey, slot, item };
      }
    }
    return null;
  }, []);

  const currentUserRoom = userInfo?.userRooms
    ? userInfo.userRooms.find((ur) => toId(ur.roomId) === toId(room?._id) || ur.isCurrent) || userInfo.userRooms[0]
    : null;

  const { isLightOn, handleItemInteraction, isNightlight } = useRoomInteraction({
    room,
    currentUserRoom,
  });

  const handleSceneMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sceneX = ((e.clientX - rect.left) / rect.width) * 1000;
    const sceneY = ((e.clientY - rect.top) / rect.height) * 1000;
    const hit = hitTestItems(sceneX, sceneY);
    setHoveredSlotKey(hit ? hit.slotKey : null);
  }, [hitTestItems]);

  const handleSceneMouseLeave = useCallback(() => { setHoveredSlotKey(null); }, []);

  const handleSceneClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sceneX = ((e.clientX - rect.left) / rect.width) * 1000;
    const sceneY = ((e.clientY - rect.top) / rect.height) * 1000;
    const hit = hitTestItems(sceneX, sceneY);
    if (hit) {
      const { slotKey, slot, item } = hit;
      const handled = handleItemInteraction(item);
      if (!handled && isReplaceMode) {
        setSelectedSlotData({ slotKey, slot, item });
      }
    } else {
      if (petClickHandlerRef.current) petClickHandlerRef.current(e);
    }
  }, [hitTestItems, handleItemInteraction, isReplaceMode]);

  if (!room) return null;

  const petName = pet?.name || petTemplate?.name || 'Bạn nhỏ';
  const petStatus = pet?.status || {};

  // Tìm roomCode hiện tại từ room.code để lấy đúng config layers theo phòng
  const roomCodeMap = {
    'LIVING_ROOM': 'livingRoom',
    'BED_ROOM': 'bedRoom',
    'KITCHEN': 'kitchen',
  };
  const roomConfigKey = roomCodeMap[room?.code] || 'livingRoom';
  const roomConfig = petTemplate?.rooms?.[roomConfigKey];
  const petLayers = roomConfig?.layers;
  const petGlobalZoom = roomConfig?.globalZoom ?? 1;
  const petGlobalOffset = roomConfig?.globalOffset ?? { x: 0, y: 0 };
  const hasLayers = petLayers && Object.keys(petLayers).length > 0;

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
        insertItemId,
      });

      // Cập nhật trực tiếp vào Zustand Store thay vì gọi lại api /auth/me
      replaceItemInStore(userRoomId, slotKey, insertItemId);

      toast.success('Đổi vật phẩm thành công!');
      handleCloseReplaceModal();
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

          <div style={{ marginTop: '20px' }}>
            {!isReplaceMode ? (
              <button
                type="button"
                onClick={() => setIsReplaceMode(true)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #6a5acd, #8a2be2)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '0.95em',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(106, 90, 205, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'transform 0.2s ease',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>swap_horiz</span>
                Đổi vật phẩm
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsReplaceMode(false)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '0.95em',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'transform 0.2s ease',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
                Hoàn tất
              </button>
            )}
          </div>
        </aside>

        <section className={styles.sceneColumn}>
          <div className={styles.sceneFrame}>
        <div
              className={styles.roomScene}
              style={{
                width: `min(${canvasSize}px, 100%)`,
                cursor: hoveredSlotKey ? 'pointer' : 'default',
              }}
              onMouseMove={handleSceneMouseMove}
              onMouseLeave={handleSceneMouseLeave}
              onClick={handleSceneClick}
            >
              <img
                src={room.background_url}
                alt={room.name}
                className={styles.roomBackground}
              />

              {placedItems.map(({ slotKey, slot, item }) => {
                const isSpecialItem = isNightlight(item);
                const isHovered = hoveredSlotKey === slotKey;
                return (
                  <div
                    key={slotKey}
                    className={`${styles.itemSlot} ${isSpecialItem ? styles.specialSlot : ''}`}
                    style={{
                      ...slotStyle(slot, canvasSize),
                      pointerEvents: 'none',
                      transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className={`${styles.itemImage} ${isSpecialItem && isLightOn ? styles.nightlightGlow : ''}`}
                      draggable={false}
                    />
                    {/* Tooltip: hiện khi hover pixel thật sự */}
                    {isHovered && (
                      <div className={`${styles.itemTooltip} ${styles.itemTooltipVisible}`}>
                        <span className={styles.itemName}>{item.name}</span>
                        <span className={styles.itemCategory}>{item.category}</span>
                      </div>
                    )}
                    {/* Overlay: đèn ngủ luôn hiện khi hover; item thường chỉ hiện trong replace mode */}
                    {isHovered && isSpecialItem && (
                      <div className={styles.toggleOverlay} style={{ opacity: 1 }}>
                        <span className="material-symbols-outlined">
                          {isLightOn ? 'light_off' : 'light_mode'}
                        </span>
                        <span>{isLightOn ? 'Tắt đèn' : 'Bật đèn'}</span>
                      </div>
                    )}
                    {isHovered && !isSpecialItem && isReplaceMode && (
                      <div className={styles.replaceOverlay} style={{ opacity: 1 }}>
                        <span className="material-symbols-outlined">swap_horiz</span>
                        <span>Đổi vật phẩm</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pet parts — mỗi canvas riêng với z-index độc lập */}
              {hasLayers && (
                <PetAvatarRigLayered
                  type={petTemplate.species}
                  layers={petLayers}
                  globalZoom={petGlobalZoom}
                  globalOffset={petGlobalOffset}
                  onRegisterClickHandler={handleRegisterPetClick}
                />
              )}

              {/* Fallback avatar khi chưa có layers */}
              {!hasLayers && petTemplate?.avatar && (
                <div className={styles.petAnchor}>
                  <div className={styles.petNameTag}>
                    <span className="material-symbols-outlined">favorite</span>
                    {petName}
                  </div>
                  <img
                    src={petTemplate.avatar}
                    alt={petName}
                    className={styles.petFallback}
                  />
                </div>
              )}
              {/* Đèn ngủ tắt -> phòng sáng bình thường | Đèn ngủ bật -> phòng tối + ánh sáng nhẹ */}
              {room?.code === 'BED_ROOM' && (
                <div
                  className={`${styles.darkOverlay} ${isLightOn ? styles.darkOverlayVisible : ''}`}
                />
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
