import React, { useState, useEffect, useRef } from 'react';
import styles from './PetRoomConfigModal.module.css';
import api from '../../../../api/api';
import { toast } from 'react-toastify';
import { PetAvatarRig } from '../../../../components/client/Pet/PetAvatarRig';
import { useDropzone } from 'react-dropzone';

const ROOM_TABS = [
  { code: 'LIVING_ROOM', label: '🛋️ Phòng khách (LIVING_ROOM)' },
  { code: 'BED_ROOM', label: '🛏️ Phòng ngủ (BED_ROOM)' },
  { code: 'KITCHEN', label: '🍳 Nhà bếp (KITCHEN)' },
];

function toId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  return String(value);
}

function PartDropzoneItem({ partKey, currentPreview, onDropFile }) {
  const dropzone = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    onDrop: (files) => onDropFile(partKey, files),
  });

  return (
    <div {...dropzone.getRootProps()} className={styles.partDropzone}>
      <input {...dropzone.getInputProps()} />
      <span>{partKey.toUpperCase()}</span>
      {currentPreview ? (
        <img src={currentPreview} alt={partKey} className={styles.partThumb} />
      ) : (
        <span className={styles.uploadPlus}>+ Thêm</span>
      )}
    </div>
  );
}

export default function PetRoomConfigModal({ isOpen, onClose, petTemplateData, onSaveConfigs }) {
  const [activeRoomCode, setActiveRoomCode] = useState('LIVING_ROOM');
  const [roomDataMap, setRoomDataMap] = useState({}); // { LIVING_ROOM: { room, items }, ... }
  const [loading, setLoading] = useState(false);

  // Lưu trữ cấu hình phòng cho từng roomCode: { LIVING_ROOM: { x, y, scale, zIndex, layers }, ... }
  const [roomConfigs, setRoomConfigs] = useState({});

  // Lưu trữ ảnh bộ phận riêng cho từng phòng: { LIVING_ROOM: { head: File, ... }, BED_ROOM: {...}, ... }
  const [roomPartFiles, setRoomPartFiles] = useState({
    LIVING_ROOM: {},
    BED_ROOM: {},
    KITCHEN: {},
  });
  const [roomPartPreviews, setRoomPartPreviews] = useState({
    LIVING_ROOM: {},
    BED_ROOM: {},
    KITCHEN: {},
  });

  // Kéo thả pet trên canvas phòng
  const [draggingPet, setDraggingPet] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);

  // Khởi tạo roomConfigs và previews từ initial data khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    if (petTemplateData?.roomConfigs) {
      const initialMap = {};
      const initialPreviews = { LIVING_ROOM: {}, BED_ROOM: {}, KITCHEN: {} };

      Object.entries(petTemplateData.roomConfigs).forEach(([code, cfg]) => {
        initialMap[code] = {
          x: cfg.x ?? 500,
          y: cfg.y ?? 600,
          scale: cfg.scale ?? 1,
          zIndex: cfg.zIndex ?? 50,
          layers: cfg.layers || {},
        };
        if (cfg.layers) {
          Object.entries(cfg.layers).forEach(([partKey, partVal]) => {
            if (partVal?.url) {
              initialPreviews[code][partKey] = partVal.url;
            }
          });
        }
      });

      setRoomConfigs(initialMap);
      setRoomPartPreviews((prev) => ({ ...prev, ...initialPreviews }));
    }
  }, [isOpen, petTemplateData]);

  // Load thông tin phòng và items mặc định cho tab đang active
  useEffect(() => {
    if (!isOpen) return;
    if (roomDataMap[activeRoomCode]) return;

    const fetchRoomInfo = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/rooms/${activeRoomCode}`);
        setRoomDataMap((prev) => ({
          ...prev,
          [activeRoomCode]: res.data.data, // { room, items }
        }));

        setRoomConfigs((prev) => {
          if (prev[activeRoomCode]) return prev;
          return {
            ...prev,
            [activeRoomCode]: {
              x: 500,
              y: 600,
              scale: 1,
              zIndex: 50,
              layers: petTemplateData?.layers || {},
            },
          };
        });
      } catch (err) {
        console.error('Fetch room config error:', err);
        toast.error(`Không thể tải thông tin phòng ${activeRoomCode}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomInfo();
  }, [isOpen, activeRoomCode, petTemplateData]);

  if (!isOpen) return null;

  const currentRoomInfo = roomDataMap[activeRoomCode];
  const room = currentRoomInfo?.room;
  const items = currentRoomInfo?.items || [];
  const currentConfig = roomConfigs[activeRoomCode] || { x: 500, y: 600, scale: 1, zIndex: 50, layers: {} };
  const currentPreviews = roomPartPreviews[activeRoomCode] || {};

  // Xây dựng placed items theo chuẩn canvas 1000x1000
  const placedItems = (() => {
    if (!room || !room.slots) return [];
    const itemMap = new Map(items.map((item) => [toId(item._id), item]));
    const placed = [];

    Object.entries(room.slots).forEach(([slotKey, slot]) => {
      if (!slot) return;
      let item = null;
      if (slot.defaultItemId) {
        item = itemMap.get(toId(slot.defaultItemId));
      }
      if (!item) return;
      placed.push({ slotKey, slot, item });
    });

    return placed.sort((a, b) => (a.slot.zIndex || 0) - (b.slot.zIndex || 0));
  })();

  const handlePartFileDrop = (partKey, acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const previewUrl = URL.createObjectURL(file);

    setRoomPartFiles((prev) => ({
      ...prev,
      [activeRoomCode]: {
        ...prev[activeRoomCode],
        [partKey]: file,
      },
    }));

    setRoomPartPreviews((prev) => {
      const updatedPreviews = {
        ...prev[activeRoomCode],
        [partKey]: previewUrl,
      };
      return {
        ...prev,
        [activeRoomCode]: updatedPreviews,
      };
    });

    // Cập nhật layers cho phòng hiện tại
    setRoomConfigs((prev) => {
      const roomCfg = prev[activeRoomCode] || { x: 500, y: 600, scale: 1, zIndex: 50, layers: {} };
      const existingLayers = roomCfg.layers || {};
      const partConfig = existingLayers[partKey] || {
        x: 350 + Object.keys(existingLayers).length * 20,
        y: 350,
        scale: 1,
        rotation: 0,
        zIndex: Object.keys(existingLayers).length + 1,
        transformOrigin: 'center',
      };

      return {
        ...prev,
        [activeRoomCode]: {
          ...roomCfg,
          layers: {
            ...existingLayers,
            [partKey]: {
              ...partConfig,
              url: previewUrl,
            },
          },
        },
      };
    });

    toast.success(`Đã tải lên bộ phận [${partKey}] cho ${activeRoomCode}`);
  };

  const handleMouseDown = (e) => {
    setDraggingPet(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!draggingPet) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const scaleX = 1000 / rect.width;
    const scaleY = 1000 / rect.height;

    const dx = (e.clientX - dragStart.x) * scaleX;
    const dy = (e.clientY - dragStart.y) * scaleY;

    setRoomConfigs((prev) => {
      const cfg = prev[activeRoomCode] || currentConfig;
      return {
        ...prev,
        [activeRoomCode]: {
          ...cfg,
          x: Math.max(0, Math.min(1000, cfg.x + dx)),
          y: Math.max(0, Math.min(1000, cfg.y + dy)),
        },
      };
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setDraggingPet(false);
  };

  const handleParamChange = (field, val) => {
    setRoomConfigs((prev) => ({
      ...prev,
      [activeRoomCode]: {
        ...currentConfig,
        [field]: Number(val) || val,
      },
    }));
  };

  const handleSaveAll = () => {
    onSaveConfigs({
      roomConfigs,
      roomPartFiles,
    });
    onClose();
    toast.success('Đã lưu cấu hình pet và bộ phận cho các phòng!');
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>🏠 Cấu hình bộ phận & Vị trí Pet cho từng Phòng</h3>
          <button type="button" onClick={onClose} className={styles.btnClose}>×</button>
        </div>

        {/* Tab chuyển đổi phòng */}
        <div className={styles.roomTabs}>
          {ROOM_TABS.map((tab) => (
            <button
              key={tab.code}
              type="button"
              className={`${styles.roomTabBtn} ${activeRoomCode === tab.code ? styles.active : ''}`}
              onClick={() => setActiveRoomCode(tab.code)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.modalBody}>
          {loading || !room ? (
            <div className={styles.loadingState}>Đang tải không gian phòng và nội thất...</div>
          ) : (
            <div className={styles.workspace}>
              {/* Canvas phòng 1000x1000 */}
              <div className={styles.canvasContainer}>
                <div
                  ref={canvasRef}
                  className={styles.roomCanvas}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    src={room.background_url}
                    alt={room.name}
                    className={styles.roomBg}
                    draggable={false}
                  />

                  {placedItems.map(({ slotKey, slot, item }) => {
                    const scaleFactor = slot.scaleFactor || 1;
                    return (
                      <div
                        key={slotKey}
                        className={styles.itemSlot}
                        style={{
                          left: `${(slot.x / 1000) * 100}%`,
                          top: `${(slot.y / 1000) * 100}%`,
                          width: `${scaleFactor * 100}%`,
                          height: `${scaleFactor * 100}%`,
                          zIndex: slot.zIndex || 1,
                        }}
                      >
                        <img src={item.image} alt={item.name} className={styles.itemImage} draggable={false} />
                      </div>
                    );
                  })}

                  <div
                    className={styles.petDraggableAnchor}
                    style={{
                      left: `${(currentConfig.x / 1000) * 100}%`,
                      top: `${(currentConfig.y / 1000) * 100}%`,
                      zIndex: currentConfig.zIndex || 50,
                      transform: `translate(-50%, -100%) scale(${currentConfig.scale || 1})`,
                    }}
                    onMouseDown={handleMouseDown}
                  >
                    <div className={styles.dragHandleTooltip}>🐾 Kéo để di chuyển pet trong {room.name}</div>
                    <PetAvatarRig
                      type={petTemplateData?.species || 'cat'}
                      layers={currentConfig.layers || {}}
                      globalZoom={petTemplateData?.globalZoom || 1}
                      globalOffset={petTemplateData?.globalOffset || { x: 0, y: 0 }}
                      name={petTemplateData?.name || 'Pet'}
                      compact
                      showInfo={false}
                    />
                  </div>
                </div>
              </div>

              {/* Bảng điều khiển bộ phận upload riêng & tọa độ cho phòng hiện tại */}
              <div className={styles.sidebarPanel}>
                <h4>⚙️ Cấu hình cho: {room.name}</h4>
                <p className={styles.panelDesc}>
                  Upload các bộ phận riêng cho phòng này và kéo pet trên màn hình phòng để căn chỉnh vị trí.
                </p>

                <div className={styles.partsUploadSection}>
                  <h5>🧩 Tải ảnh bộ phận riêng cho phòng này</h5>
                  {['head', 'body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'tail'].map((partKey) => (
                    <PartDropzoneItem
                      key={partKey}
                      partKey={partKey}
                      currentPreview={currentPreviews[partKey]}
                      onDropFile={handlePartFileDrop}
                    />
                  ))}
                </div>

                <div className={styles.formGroup}>
                  <label>Tọa độ X ({Math.round(currentConfig.x)}):</label>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={currentConfig.x}
                    onChange={(e) => handleParamChange('x', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tọa độ Y ({Math.round(currentConfig.y)}):</label>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={currentConfig.y}
                    onChange={(e) => handleParamChange('y', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tỷ lệ phóng đại ({currentConfig.scale}x):</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={currentConfig.scale}
                    onChange={(e) => handleParamChange('scale', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Thứ tự hiển thị (zIndex):</label>
                  <input
                    type="number"
                    value={currentConfig.zIndex}
                    onChange={(e) => handleParamChange('zIndex', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.btnCancel}>Hủy bỏ</button>
          <button type="button" onClick={handleSaveAll} className={styles.btnSave}>💾 Hoàn tất cấu hình các phòng</button>
        </div>
      </div>
    </div>
  );
}
