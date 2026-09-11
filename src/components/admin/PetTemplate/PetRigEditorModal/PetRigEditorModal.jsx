import React, { useState, useRef, useEffect } from 'react';
import styles from './PetRigEditorModal.module.css';
import { clampPartSize, calcOriginOffset } from '../../../../utils/petAnimations';
import api from '../../../../api/api';
import { toast } from 'react-toastify';
import { useDropzone } from 'react-dropzone';

const PART_LABELS = {
  body: 'Thân',
  head: 'Đầu',
  leftArm: 'Tay trái',
  rightArm: 'Tay phải',
  leftLeg: 'Chân trái',
  rightLeg: 'Chân phải',
  tail: 'Đuôi',
};

const DEFAULT_ORIGINS = [
  { label: 'Chính giữa (Center)', value: 'center' },
  { label: 'Đáy giữa (Bottom Center)', value: 'bottom center' },
  { label: 'Đỉnh giữa (Top Center)', value: 'top center' },
  { label: 'Trên trái (Top Left)', value: 'top left' },
  { label: 'Trên phải (Top Right)', value: 'top right' },
];

const ROOM_TABS = [
  { code: 'LIVING_ROOM', label: '🛋️ Phòng khách' },
  { code: 'BED_ROOM', label: '🛏️ Phòng ngủ' },
  { code: 'KITCHEN', label: '🍳 Nhà bếp' },
];

function toId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  return String(value);
}

function PartUploadRow({ partKey, previewUrl, isSelected, onSelectPart, onUpdatePart, onDeletePart }) {
  const dropzone = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    onDrop: (files) => {
      if (files && files.length > 0) {
        onUpdatePart(partKey, files[0]);
      }
    },
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className={`${styles.partUploadRow} ${isSelected ? styles.activeRow : ''}`}>
      <div
        className={styles.partRowInfo}
        onClick={() => {
          onSelectPart(partKey);
        }}
      >
        <div className={styles.partThumbWrap}>
          {previewUrl ? (
            <img src={previewUrl} alt={partKey} className={styles.partThumbImg} />
          ) : (
            <span className={styles.emptyThumb}>📷</span>
          )}
        </div>
        <span className={styles.partRowName}>{PART_LABELS[partKey] || partKey}</span>
        <button
          type="button"
          className={styles.dropdownToggleBtn}
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen(!dropdownOpen);
          }}
          title="Tùy chọn ảnh"
        >
          ⚙️
        </button>
      </div>

      {dropdownOpen && (
        <div className={styles.partDropdownActions}>
          <div {...dropzone.getRootProps()} className={styles.dropdownActionItem}>
            <input {...dropzone.getInputProps()} />
            <span>🔄 Thay thế ảnh</span>
          </div>
          {previewUrl && (
            <div
              className={`${styles.dropdownActionItem} ${styles.deleteAction}`}
              onClick={(e) => {
                e.stopPropagation();
                onDeletePart(partKey);
                setDropdownOpen(false);
              }}
            >
              <span>🗑️ Xóa ảnh</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PetRigEditorModal({ isOpen, onClose, imgSrcs = {}, roomConfigsInitial = {}, onConfirm }) {
  const canvasRef = useRef(null);

  // Tab phòng hiện tại: LIVING_ROOM, BED_ROOM, KITCHEN
  const [activeRoomCode, setActiveRoomCode] = useState('LIVING_ROOM');
  const [roomDataMap, setRoomDataMap] = useState({}); // { LIVING_ROOM: { room, items }, ... }
  const [loadingRoom, setLoadingRoom] = useState(false);

  // Cấu hình layers cho từng phòng riêng biệt
  const [roomLayers, setRoomLayers] = useState({
    LIVING_ROOM: {
      body: { x: 350, y: 350, scale: 1, rotation: 0, zIndex: 2, transformOrigin: 'center', url: imgSrcs.body || '' },
      head: { x: 350, y: 150, scale: 1, rotation: 0, zIndex: 3, transformOrigin: 'bottom center', url: imgSrcs.head || '' },
      leftArm: { x: 250, y: 320, scale: 1, rotation: 0, zIndex: 1, transformOrigin: 'top center', url: imgSrcs.leftArm || '' },
      rightArm: { x: 480, y: 320, scale: 1, rotation: 0, zIndex: 4, transformOrigin: 'top center', url: imgSrcs.rightArm || '' },
      leftLeg: { x: 300, y: 580, scale: 1, rotation: 0, zIndex: 0, transformOrigin: 'top center', url: imgSrcs.leftLeg || '' },
      rightLeg: { x: 450, y: 580, scale: 1, rotation: 0, zIndex: 0, transformOrigin: 'top center', url: imgSrcs.rightLeg || '' },
      tail: { x: 550, y: 400, scale: 1, rotation: 0, zIndex: -1, transformOrigin: 'left center', url: imgSrcs.tail || '' },
    },
    BED_ROOM: {
      body: { x: 350, y: 350, scale: 1, rotation: 0, zIndex: 2, transformOrigin: 'center', url: imgSrcs.body || '' },
      head: { x: 350, y: 150, scale: 1, rotation: 0, zIndex: 3, transformOrigin: 'bottom center', url: imgSrcs.head || '' },
      leftArm: { x: 250, y: 320, scale: 1, rotation: 0, zIndex: 1, transformOrigin: 'top center', url: imgSrcs.leftArm || '' },
      rightArm: { x: 480, y: 320, scale: 1, rotation: 0, zIndex: 4, transformOrigin: 'top center', url: imgSrcs.rightArm || '' },
      leftLeg: { x: 300, y: 580, scale: 1, rotation: 0, zIndex: 0, transformOrigin: 'top center', url: imgSrcs.leftLeg || '' },
      rightLeg: { x: 450, y: 580, scale: 1, rotation: 0, zIndex: 0, transformOrigin: 'top center', url: imgSrcs.rightLeg || '' },
      tail: { x: 550, y: 400, scale: 1, rotation: 0, zIndex: -1, transformOrigin: 'left center', url: imgSrcs.tail || '' },
    },
    KITCHEN: {
      body: { x: 350, y: 350, scale: 1, rotation: 0, zIndex: 2, transformOrigin: 'center', url: imgSrcs.body || '' },
      head: { x: 350, y: 150, scale: 1, rotation: 0, zIndex: 3, transformOrigin: 'bottom center', url: imgSrcs.head || '' },
      leftArm: { x: 250, y: 320, scale: 1, rotation: 0, zIndex: 1, transformOrigin: 'top center', url: imgSrcs.leftArm || '' },
      rightArm: { x: 480, y: 320, scale: 1, rotation: 0, zIndex: 4, transformOrigin: 'top center', url: imgSrcs.rightArm || '' },
      leftLeg: { x: 300, y: 580, scale: 1, rotation: 0, zIndex: 0, transformOrigin: 'top center', url: imgSrcs.leftLeg || '' },
      rightLeg: { x: 450, y: 580, scale: 1, rotation: 0, zIndex: 0, transformOrigin: 'top center', url: imgSrcs.rightLeg || '' },
      tail: { x: 550, y: 400, scale: 1, rotation: 0, zIndex: -1, transformOrigin: 'left center', url: imgSrcs.tail || '' },
    },
  });

  // Lưu trữ các file bộ phận mới upload theo phòng: { LIVING_ROOM: { head: File, ... }, ... }
  const [roomPartFiles, setRoomPartFiles] = useState({
    LIVING_ROOM: {},
    BED_ROOM: {},
    KITCHEN: {},
  });

  // Zoom và offset tổng thể cho từng phòng
  const [roomGlobalSettings, setRoomGlobalSettings] = useState({
    LIVING_ROOM: { zoom: 1, offset: { x: 0, y: 0 } },
    BED_ROOM: { zoom: 1, offset: { x: 0, y: 0 } },
    KITCHEN: { zoom: 1, offset: { x: 0, y: 0 } },
  });

  const [loadedImages, setLoadedImages] = useState({});
  const [selectedPart, setSelectedPart] = useState(null);
  const [isLocked, setIsLocked] = useState(false); // Khóa chỉnh từng part để kéo toàn con pet

  // Trạng thái kéo thả chuột trên Canvas
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Khởi tạo dữ liệu từ props khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    if (roomConfigsInitial && Object.keys(roomConfigsInitial).length > 0) {
      const newLayersMap = { ...roomLayers };
      const newSettingsMap = { ...roomGlobalSettings };

      Object.entries(roomConfigsInitial).forEach(([code, cfg]) => {
        if (cfg.layers) {
          newLayersMap[code] = { ...cfg.layers };
        }
        if (cfg.globalZoom !== undefined || cfg.globalOffset !== undefined) {
          newSettingsMap[code] = {
            zoom: cfg.globalZoom ?? 1,
            offset: cfg.globalOffset ?? { x: 0, y: 0 },
          };
        }
      });

      setRoomLayers(newLayersMap);
      setRoomGlobalSettings(newSettingsMap);
    } else if (imgSrcs && Object.keys(imgSrcs).length > 0) {
      setRoomLayers((prev) => {
        const updated = { ...prev };
        ['LIVING_ROOM', 'BED_ROOM', 'KITCHEN'].forEach((code) => {
          const roomPart = { ...updated[code] };
          Object.keys(imgSrcs).forEach((k) => {
            if (roomPart[k]) {
              roomPart[k] = { ...roomPart[k], url: imgSrcs[k] };
            }
          });
          updated[code] = roomPart;
        });
        return updated;
      });
    }
  }, [isOpen, roomConfigsInitial, imgSrcs]);

  // Load thông tin phòng và item default qua API /admin/rooms/:roomCode
  useEffect(() => {
    if (!isOpen) return;
    if (roomDataMap[activeRoomCode]) return;

    const fetchRoom = async () => {
      try {
        setLoadingRoom(true);
        const res = await api.get(`/admin/rooms/${activeRoomCode}`);
        setRoomDataMap((prev) => ({
          ...prev,
          [activeRoomCode]: res.data.data, // { room, items }
        }));
      } catch (err) {
        console.error('Fetch room error:', err);
        toast.error(`Không thể tải thông tin phòng ${activeRoomCode}`);
      } finally {
        setLoadingRoom(false);
      }
    };

    fetchRoom();
  }, [isOpen, activeRoomCode]);

  const currentPartsConfig = roomLayers[activeRoomCode] || {};
  const currentGlobal = roomGlobalSettings[activeRoomCode] || { zoom: 1, offset: { x: 0, y: 0 } };
  const currentRoomInfo = roomDataMap[activeRoomCode];
  const room = currentRoomInfo?.room;
  const items = currentRoomInfo?.items || [];

  // Load tất cả hình ảnh bộ phận của phòng hiện tại vào Image object
  useEffect(() => {
    if (!isOpen) return;
    const images = {};
    let loadedCount = 0;
    const parts = currentPartsConfig;
    const keys = Object.keys(parts).filter((k) => parts[k]?.url);

    if (keys.length === 0) {
      setLoadedImages({});
      return;
    }

    keys.forEach((key) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = parts[key].url;
      img.onload = () => {
        images[key] = img;
        loadedCount++;
        if (loadedCount === keys.length) setLoadedImages({ ...images });
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === keys.length) setLoadedImages({ ...images });
      };
    });
  }, [isOpen, activeRoomCode, roomLayers]);

  // Vẽ Canvas mỗi khi thay đổi
  useEffect(() => {
    drawCanvas();
  }, [currentPartsConfig, loadedImages, selectedPart, isLocked, currentGlobal, roomDataMap]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = 1000;
    canvas.height = 1000;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(currentGlobal.offset.x, currentGlobal.offset.y);
    ctx.scale(currentGlobal.zoom, currentGlobal.zoom);

    const sortedParts = Object.keys(currentPartsConfig).sort(
      (a, b) => (currentPartsConfig[a].zIndex || 0) - (currentPartsConfig[b].zIndex || 0)
    );

    sortedParts.forEach((key) => {
      const img = loadedImages[key];
      const config = currentPartsConfig[key];
      if (!img || !config) return;

      ctx.save();
      ctx.translate(config.x, config.y);
      ctx.rotate((config.rotation * Math.PI) / 180);

      const clamped = clampPartSize(img.naturalWidth, img.naturalHeight, 800);
      const w = clamped.w;
      const h = clamped.h;
      const { ox, oy } = calcOriginOffset(w, h, config.transformOrigin);

      ctx.drawImage(img, -ox, -oy, w * config.scale, h * config.scale);

      if (!isLocked) {
        ctx.strokeStyle = key === selectedPart ? '#2563eb' : '#cbd5e1';
        ctx.lineWidth = key === selectedPart ? 3 : 1.5;
        ctx.strokeRect(-ox, -oy, w * config.scale, h * config.scale);

        ctx.fillStyle = key === selectedPart ? '#1d4ed8' : '#64748b';
        ctx.font = '14px sans-serif';
        ctx.fillText(PART_LABELS[key] || key, -ox, -oy - 8);
      }

      ctx.restore();
    });
    ctx.restore();
  };

  // Xử lý cập nhật / thay thế / xóa ảnh bộ phận
  const handleUpdatePartImage = (partKey, file) => {
    const previewUrl = URL.createObjectURL(file);
    setRoomPartFiles((prev) => ({
      ...prev,
      [activeRoomCode]: {
        ...prev[activeRoomCode],
        [partKey]: file,
      },
    }));

    setRoomLayers((prev) => {
      const roomPart = prev[activeRoomCode];
      return {
        ...prev,
        [activeRoomCode]: {
          ...roomPart,
          [partKey]: {
            ...roomPart[partKey],
            url: previewUrl,
          },
        },
      };
    });
    setSelectedPart(partKey); // Focus ngay vào part vừa cập nhật
    toast.success(`Đã cập nhật ảnh bộ phận [${PART_LABELS[partKey]}] cho phòng ${activeRoomCode}`);
  };

  const handleDeletePartImage = (partKey) => {
    setRoomLayers((prev) => {
      const roomPart = prev[activeRoomCode];
      return {
        ...prev,
        [activeRoomCode]: {
          ...roomPart,
          [partKey]: {
            ...roomPart[partKey],
            url: '',
          },
        },
      };
    });
    if (selectedPart === partKey) setSelectedPart(null);
    toast.success(`Đã xóa ảnh bộ phận [${PART_LABELS[partKey]}]`);
  };

  // Kéo thả chuột
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const rawX = (e.clientX - rect.left) * scaleX;
    const rawY = (e.clientY - rect.top) * scaleY;

    setIsDragging(true);
    setDragStart({ x: rawX, y: rawY });

    if (!isLocked) {
      const x = rawX - currentGlobal.offset.x;
      const y = rawY - currentGlobal.offset.y;

      const sortedKeys = Object.keys(currentPartsConfig).sort(
        (a, b) => (currentPartsConfig[b].zIndex || 0) - (currentPartsConfig[a].zIndex || 0)
      );

      let clickedKey = null;
      for (const key of sortedKeys) {
        const conf = currentPartsConfig[key];
        const img = loadedImages[key];
        if (!img || !conf?.url) continue;

        const clamped = clampPartSize(img.naturalWidth, img.naturalHeight, 800);
        const finalW = clamped.w * conf.scale;
        const finalH = clamped.h * conf.scale;
        const { ox, oy } = calcOriginOffset(finalW, finalH, conf.transformOrigin);

        const minX = conf.x - ox;
        const maxX = conf.x - ox + finalW;
        const minY = conf.y - oy;
        const maxY = conf.y - oy + finalH;

        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          clickedKey = key;
          break;
        }
      }

      if (clickedKey) setSelectedPart(clickedKey);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const dx = x - dragStart.x;
    const dy = y - dragStart.y;

    if (isLocked) {
      setRoomGlobalSettings((prev) => ({
        ...prev,
        [activeRoomCode]: {
          ...currentGlobal,
          offset: { x: currentGlobal.offset.x + dx, y: currentGlobal.offset.y + dy },
        },
      }));
    } else if (selectedPart) {
      setRoomLayers((prev) => {
        const roomPart = prev[activeRoomCode];
        return {
          ...prev,
          [activeRoomCode]: {
            ...roomPart,
            [selectedPart]: {
              ...roomPart[selectedPart],
              x: roomPart[selectedPart].x + dx,
              y: roomPart[selectedPart].y + dy,
            },
          },
        };
      });
    }

    setDragStart({ x, y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleParamChange = (field, value) => {
    if (!selectedPart) return;
    setRoomLayers((prev) => {
      const roomPart = prev[activeRoomCode];
      return {
        ...prev,
        [activeRoomCode]: {
          ...roomPart,
          [selectedPart]: {
            ...roomPart[selectedPart],
            [field]: Number(value) || value,
          },
        },
      };
    });
  };

  const handleSave = () => {
    const finalRoomConfigs = {};
    ['LIVING_ROOM', 'BED_ROOM', 'KITCHEN'].forEach((code) => {
      finalRoomConfigs[code] = {
        layers: roomLayers[code],
        globalZoom: roomGlobalSettings[code].zoom,
        globalOffset: roomGlobalSettings[code].offset,
      };
    });

    onConfirm({
      roomConfigs: finalRoomConfigs,
      roomPartFiles,
    });
    onClose();
    toast.success('Đã lưu cấu hình pet hoàn chỉnh cho tất cả các phòng!');
  };

  if (!isOpen) return null;

  const placedItems = (() => {
    if (!room || !room.slots) return [];
    const itemMap = new Map(items.map((item) => [toId(item._id), item]));
    const placed = [];
    Object.entries(room.slots).forEach(([slotKey, slot]) => {
      if (!slot) return;
      let item = null;
      if (slot.defaultItemId) item = itemMap.get(toId(slot.defaultItemId));
      if (!item) return;
      placed.push({ slotKey, slot, item });
    });
    return placed.sort((a, b) => (a.slot.zIndex || 0) - (b.slot.zIndex || 0));
  })();

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3>🎨 Trình Ráp nối & Cấu hình Pet theo Phòng (Visual Rigging Editor)</h3>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${styles.btnLock} ${isLocked ? styles.locked : ''}`}
              onClick={() => setIsLocked(!isLocked)}
            >
              {isLocked ? '🔒 Khóa từng bộ phận (Đang di chuyển cả con)' : '🔓 Mở khóa (Chỉnh từng bộ phận)'}
            </button>
            <button type="button" onClick={onClose} className={styles.btnClose}>×</button>
          </div>
        </div>

        {/* Tab chọn phòng */}
        <div className={styles.roomTabs}>
          {ROOM_TABS.map((tab) => (
            <button
              key={tab.code}
              type="button"
              className={`${styles.roomTabButton} ${activeRoomCode === tab.code ? styles.active : ''}`}
              onClick={() => {
                setActiveRoomCode(tab.code);
                setSelectedPart(null); // Reset focus khi đổi phòng
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Body */}
        <div className={styles.modalBody}>
          {/* Cột trái: Canvas hiển thị Room trực quan + Pet */}
          <div className={styles.canvasColumn}>
            <div className={styles.canvasToolbar}>
              <span>💡 Mẹo: Click vào part trên danh sách bên phải hoặc trực tiếp trên canvas để focus và chỉnh thông số.</span>
              <div className={styles.zoomControl}>
                <label>Zoom:</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={currentGlobal.zoom}
                  onChange={(e) =>
                    setRoomGlobalSettings((prev) => ({
                      ...prev,
                      [activeRoomCode]: { ...currentGlobal, zoom: parseFloat(e.target.value) },
                    }))
                  }
                />
                <span>{currentGlobal.zoom.toFixed(1)}x</span>
              </div>
            </div>

            <div className={styles.canvasWrapper}>
              <div className={styles.roomCanvasContainer}>
                {room && room.background_url && (
                  <img src={room.background_url} alt={room.name} className={styles.roomBgImage} draggable={false} />
                )}
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
                        pointerEvents: 'none',
                      }}
                    >
                      <img src={item.image} alt={item.name} className={styles.itemSlotImg} draggable={false} />
                    </div>
                  );
                })}

                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className={styles.rigCanvasOverlay}
                  style={{ zIndex: 100 }}
                />
              </div>
            </div>
          </div>

          {/* Cột phải: Quản lý 7 bộ phận (dropdown thay thế/xóa) + Bảng thông số */}
          <div className={styles.sidebarColumn}>
            <div className={styles.partsManagementSection}>
              <h4>🧩 Quản lý bộ phận ({room?.name || activeRoomCode})</h4>
              <p className={styles.sectionDesc}>Click vào dòng bộ phận để chọn/focus chỉnh sửa hoặc mở cấu hình ảnh.</p>

              <div className={styles.partsListDropdown}>
                {['head', 'body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'tail'].map((partKey) => (
                  <PartUploadRow
                    key={partKey}
                    partKey={partKey}
                    previewUrl={currentPartsConfig[partKey]?.url}
                    isSelected={selectedPart === partKey}
                    onSelectPart={(key) => {
                      setSelectedPart(key);
                      setIsLocked(false);
                    }}
                    onUpdatePart={handleUpdatePartImage}
                    onDeletePart={handleDeletePartImage}
                  />
                ))}
              </div>
            </div>

            {selectedPart && !isLocked ? (
              <div className={styles.inspectorPanel}>
                <div className={styles.inspectorHeader}>
                  <h4>⚙️ Tinh chỉnh: {PART_LABELS[selectedPart]}</h4>
                  <button
                    type="button"
                    className={styles.btnBackToList}
                    onClick={() => setSelectedPart(null)}
                  >
                    ⬅ Đóng
                  </button>
                </div>

                <div className={styles.formGroup}>
                  <label>Tọa độ X:</label>
                  <input
                    type="number"
                    value={Math.round(currentPartsConfig[selectedPart]?.x || 0)}
                    onChange={(e) => handleParamChange('x', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tọa độ Y:</label>
                  <input
                    type="number"
                    value={Math.round(currentPartsConfig[selectedPart]?.y || 0)}
                    onChange={(e) => handleParamChange('y', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Phóng đại (Scale):</label>
                  <input
                    type="range"
                    min="0.2"
                    max="3"
                    step="0.05"
                    value={currentPartsConfig[selectedPart]?.scale || 1}
                    onChange={(e) => handleParamChange('scale', e.target.value)}
                  />
                  <span>{currentPartsConfig[selectedPart]?.scale}</span>
                </div>

                <div className={styles.formGroup}>
                  <label>Góc xoay (Rotation):</label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={currentPartsConfig[selectedPart]?.rotation || 0}
                    onChange={(e) => handleParamChange('rotation', e.target.value)}
                  />
                  <span>{currentPartsConfig[selectedPart]?.rotation}°</span>
                </div>

                <div className={styles.formGroup}>
                  <label>Thứ tự lớp (zIndex):</label>
                  <input
                    type="number"
                    value={currentPartsConfig[selectedPart]?.zIndex || 0}
                    onChange={(e) => handleParamChange('zIndex', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tâm xoay (Transform Origin):</label>
                  <select
                    value={currentPartsConfig[selectedPart]?.transformOrigin || 'center'}
                    onChange={(e) => handleParamChange('transformOrigin', e.target.value)}
                  >
                    {DEFAULT_ORIGINS.map((orig) => (
                      <option key={orig.value} value={orig.value}>
                        {orig.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className={styles.inspectorHint}>
                <p>👉 Click vào một bộ phận bất kỳ trên danh sách bên trên hoặc hình vẽ con pet để tinh chỉnh thông số chi tiết (tọa độ, scale, xoay, zIndex...).</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.btnCancel}>Hủy bỏ</button>
          <button type="button" onClick={handleSave} className={styles.btnSave}>💾 Hoàn tất Cấu hình Pet & Phòng</button>
        </div>
      </div>
    </div>
  );
}
