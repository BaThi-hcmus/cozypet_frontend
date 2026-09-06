import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './RoomCanvasEditor.module.css';
import api from '../../../../api/api';
import { toast } from 'react-toastify';

const CANVAS_SIZE = 1000;
const DISPLAY_SIZE = 600; // Khung to hơn item editor (600x600)
const SCALE_RATIO = DISPLAY_SIZE / CANVAS_SIZE;

const DEFAULT_TYPE_ORDER = ['furniture', 'decoration', 'food', 'toy'];

// Bộ đếm và đặt tên thông minh cho các slot
function buildSlotTypeLabels(slotList, { configuredOnly = true } = {}) {
  const source = configuredOnly ? slotList.filter((s) => s.isConfigured) : slotList;
  const labels = {};
  const typeIndexes = {};
  const typeCounts = {};

  source.forEach((slot) => {
    typeCounts[slot.type] = (typeCounts[slot.type] || 0) + 1;
    typeIndexes[slot.id] = typeCounts[slot.type];
    labels[slot.id] = `${slot.type} (${typeCounts[slot.type]})`;
  });

  return { labels, typeIndexes };
}

function sortConfiguredSlotsForDisplay(configuredSlots, typeIndexes, typeOrder = DEFAULT_TYPE_ORDER) {
  return [...configuredSlots].sort((a, b) => {
    const orderA = typeOrder.indexOf(a.type);
    const orderB = typeOrder.indexOf(b.type);
    const typeCmp = (orderA === -1 ? typeOrder.length : orderA)
      - (orderB === -1 ? typeOrder.length : orderB);
    if (typeCmp !== 0) return typeCmp;
    return (typeIndexes[a.id] || 0) - (typeIndexes[b.id] || 0);
  });
}

function RoomCanvasEditor({ isOpen, onClose, imgSrc, initialSlots = [], onConfirm }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Map lưu trữ các HTMLImageElement của vật phẩm mặc định để vẽ lên canvas
  const itemImagesRef = useRef({});

  // Phase 1 (Background)
  const [bgX, setBgX] = useState(0);
  const [bgY, setBgY] = useState(0);
  const [bgZoom, setBgZoom] = useState(1);
  const [isDraggingBg, setIsDraggingBg] = useState(false);
  const [isBackgroundLocked, setIsBackgroundLocked] = useState(false);

  // Phase 2 (Slots)
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [isDraggingSlot, setIsDraggingSlot] = useState(false);
  const [isSlotFormOpen, setIsSlotFormOpen] = useState(false);
  const [itemConstants, setItemConstants] = useState(null);

  // Item Picker Panel (Cột phụ bên cạnh Canvas khi chọn item mặc định)
  const [isItemPickerOpen, setIsItemPickerOpen] = useState(false);
  const [compatibleItems, setCompatibleItems] = useState([]);
  const [loadingCompatibleItems, setLoadingCompatibleItems] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0, targetId: null });
  const editSnapshotRef = useRef(null);

  // Load init data
  useEffect(() => {
    if (!isOpen) return;

    if (initialSlots && initialSlots.length > 0) {
      setSlots(initialSlots.map((s) => ({ ...s, isConfigured: true })));
      setIsBackgroundLocked(true);
    } else {
      setSlots([]);
      setIsBackgroundLocked(false);
    }
    setSelectedSlotId(null);
    setIsSlotFormOpen(false);
    setIsItemPickerOpen(false);
    editSnapshotRef.current = null;
  }, [isOpen, initialSlots]);

  // Preload ảnh của các item mặc định ban đầu nếu có
  useEffect(() => {
    if (!isOpen || !initialSlots) return;

    initialSlots.forEach(async (slot) => {
      const defaultItemId = slot.defaultItemId?._id || slot.defaultItemId;
      if (defaultItemId && !itemImagesRef.current[defaultItemId]) {
        try {
          let imageUrl = slot.defaultItem?.image;
          if (!imageUrl) {
            const res = await api.get(`/admin/items/detail/${defaultItemId}`);
            const itemData = res.data?.data;
            if (itemData) {
              imageUrl = itemData.image;
              slot.defaultItem = itemData;
            }
          }
          if (imageUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              itemImagesRef.current[defaultItemId] = img;
              drawCanvas();
            };
            img.src = imageUrl;
          }
        } catch (error) {
          console.error('Không tải được ảnh vật phẩm mặc định:', error);
        }
      }
    });
  }, [isOpen, initialSlots]);

  // Fetch Item Constants
  useEffect(() => {
    if (!isOpen) return;

    const fetchItemConstants = async () => {
      try {
        const response = await api.get('/admin/items/constants');
        setItemConstants(response.data.data);
      } catch (error) {
        toast.error(
          error.response?.data?.message || 'Không tải được cấu hình slot từ server'
        );
      }
    };

    fetchItemConstants();
  }, [isOpen]);

  // Load background image
  useEffect(() => {
    if (!isOpen || !imgSrc) return;

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);

      const maxDim = Math.max(img.naturalWidth, img.naturalHeight);
      const defaultZoom = maxDim > CANVAS_SIZE ? CANVAS_SIZE / maxDim : 1;

      setBgZoom(defaultZoom);
      const scaledW = img.naturalWidth * defaultZoom;
      const scaledH = img.naturalHeight * defaultZoom;
      setBgX((CANVAS_SIZE - scaledW) / 2);
      setBgY((CANVAS_SIZE - scaledH) / 2);
    };
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;

    return () => {
      imageRef.current = null;
      setImageLoaded(false);
    };
  }, [imgSrc, isOpen]);

  // Draw Canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 1. Draw Background
    const scaledW = img.naturalWidth * bgZoom;
    const scaledH = img.naturalHeight * bgZoom;
    ctx.drawImage(img, bgX, bgY, scaledW, scaledH);

    // 2. Draw Guide Line (Phase 1)
    if (!isBackgroundLocked) {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';
      ctx.lineWidth = 10;
      ctx.setLineDash([12, 4]);
      ctx.strokeRect(1, 1, CANVAS_SIZE - 2, CANVAS_SIZE - 2);
      ctx.setLineDash([]);
    }

    // 3. Draw Slots (Phase 2)
    if (isBackgroundLocked) {
      const sortedSlots = [...slots].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

      sortedSlots.forEach((slot) => {
        const slotW = CANVAS_SIZE * (slot.scaleFactor || 1);
        const slotH = CANVAS_SIZE * (slot.scaleFactor || 1);

        // Đòn bẩy: Vẽ hình ảnh vật phẩm mặc định lên canvas nếu có
        const defaultItemId = slot.defaultItemId?._id || slot.defaultItemId;
        const loadedItemImg = defaultItemId ? itemImagesRef.current[defaultItemId] : null;
        if (loadedItemImg) {
          ctx.drawImage(loadedItemImg, slot.x, slot.y, slotW, slotH);
        }

        let color = 'rgba(59, 130, 246, 0.7)';
        if (slot.type === 'furniture') color = 'rgba(16, 185, 129, 0.7)';
        if (slot.type === 'decoration') color = 'rgba(236, 72, 153, 0.7)';
        if (slot.type === 'food') color = 'rgba(245, 158, 11, 0.7)';
        if (slot.type === 'toy') color = 'rgba(139, 92, 246, 0.7)';

        const isSelected = slot.id === selectedSlotId;

        ctx.fillStyle = isSelected ? color.replace('0.7', '0.3') : color.replace('0.7', '0.1');
        ctx.fillRect(slot.x, slot.y, slotW, slotH);

        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 6 : 3;
        if (isSelected) {
          ctx.setLineDash([8, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.strokeRect(slot.x, slot.y, slotW, slotH);
        ctx.setLineDash([]);

        // Draw center anchor
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(slot.x + slotW / 2, slot.y + slotH / 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw Label
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        const { labels: labelMap } = buildSlotTypeLabels(slots);
        const text = labelMap[slot.id] || (slot.isConfigured ? slot.type : `${slot.type} (mới)`);
        ctx.strokeText(text, slot.x + 10, slot.y + 30);
        ctx.fillText(text, slot.x + 10, slot.y + 30);
      });
    }
  }, [bgX, bgY, bgZoom, isBackgroundLocked, slots, selectedSlotId]);

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [imageLoaded, drawCanvas]);

  // Mouse Down Event
  const handleMouseDown = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX;
    const clickY = e.clientY;

    const canvasClickX = (clickX - rect.left) / SCALE_RATIO;
    const canvasClickY = (clickY - rect.top) / SCALE_RATIO;

    if (!isBackgroundLocked) {
      setIsDraggingBg(true);
      dragStartRef.current = {
        x: clickX,
        y: clickY,
        startX: bgX,
        startY: bgY,
      };
    } else {
      let clickedSlot = null;
      const sortedSlotsDesc = [...slots].sort((a, b) => (b.zIndex || 1) - (a.zIndex || 1));

      for (const slot of sortedSlotsDesc) {
        const slotW = CANVAS_SIZE * (slot.scaleFactor || 1);
        const slotH = CANVAS_SIZE * (slot.scaleFactor || 1);
        if (
          canvasClickX >= slot.x &&
          canvasClickX <= slot.x + slotW &&
          canvasClickY >= slot.y &&
          canvasClickY <= slot.y + slotH
        ) {
          clickedSlot = slot;
          break;
        }
      }

      if (clickedSlot) {
        setSelectedSlotId(clickedSlot.id);
        if (clickedSlot.isConfigured && !isSlotFormOpen) {
          editSnapshotRef.current = { ...clickedSlot };
          setIsSlotFormOpen(true);
        }
        setIsDraggingSlot(true);
        dragStartRef.current = {
          x: clickX,
          y: clickY,
          startX: clickedSlot.x,
          startY: clickedSlot.y,
          targetId: clickedSlot.id,
        };
      } else {
        setSelectedSlotId(null);
      }
    }
  };

  // Mouse Move
  const handleMouseMove = useCallback(
    (e) => {
      const dx = (e.clientX - dragStartRef.current.x) / SCALE_RATIO;
      const dy = (e.clientY - dragStartRef.current.y) / SCALE_RATIO;

      if (isDraggingBg && !isBackgroundLocked) {
        setBgX(dragStartRef.current.startX + dx);
        setBgY(dragStartRef.current.startY + dy);
      } else if (isDraggingSlot && isBackgroundLocked && dragStartRef.current.targetId) {
        const targetId = dragStartRef.current.targetId;
        const newX = dragStartRef.current.startX + dx;
        const newY = dragStartRef.current.startY + dy;

        setSlots((prev) =>
          prev.map((s) => (s.id === targetId ? { ...s, x: newX, y: newY } : s))
        );
      }
    },
    [isDraggingBg, isBackgroundLocked, isDraggingSlot]
  );

  const handleMouseUp = useCallback(() => {
    setIsDraggingBg(false);
    setIsDraggingSlot(false);
  }, []);

  useEffect(() => {
    if (isDraggingBg || isDraggingSlot) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingBg, isDraggingSlot, handleMouseMove, handleMouseUp]);

  // Phase 1 Tools
  const handleBgZoomChange = (e) => {
    const img = imageRef.current;
    if (!img) return;
    const newZoom = parseFloat(e.target.value);

    const oldScaledW = img.naturalWidth * bgZoom;
    const oldScaledH = img.naturalHeight * bgZoom;
    const newScaledW = img.naturalWidth * newZoom;
    const newScaledH = img.naturalHeight * newZoom;

    const centerX = bgX + oldScaledW / 2;
    const centerY = bgY + oldScaledH / 2;

    setBgX(centerX - newScaledW / 2);
    setBgY(centerY - newScaledH / 2);
    setBgZoom(newZoom);
  };

  // Phase 2 Tools
  const handleAddSlot = () => {
    if (!isBackgroundLocked) return;

    const newSlot = {
      id: `slot_${Date.now()}`,
      x: 250,
      y: 250,
      type: '',
      category: '',
      slotType: '',
      zIndex: slots.filter((s) => s.isConfigured).length + 1,
      scaleFactor: 0.5,
      defaultItemId: null,
      defaultItem: null,
      isConfigured: false,
    };
    setSlots((prev) => {
      const withoutDraft = prev.filter((s) => s.isConfigured);
      return [...withoutDraft, newSlot];
    });
    setSelectedSlotId(newSlot.id);
    editSnapshotRef.current = null;
    setIsSlotFormOpen(true);
    setIsItemPickerOpen(false);
  };

  const handleEditSlot = (id) => {
    const slot = slots.find((s) => s.id === id);
    if (slot) {
      editSnapshotRef.current = { ...slot };
    }
    setSelectedSlotId(id);
    setIsSlotFormOpen(true);
    setIsItemPickerOpen(false);
  };

  const handleCompleteSlot = () => {
    const slot = slots.find((s) => s.id === selectedSlotId);
    if (!slot?.type || !slot?.category || !slot?.slotType) {
      toast.warning('Vui lòng chọn đầy đủ Type, Category và Slot Type');
      return;
    }

    if (selectedSlotId) {
      setSlots((prev) =>
        prev.map((s) => (s.id === selectedSlotId ? { ...s, isConfigured: true } : s))
      );
    }
    editSnapshotRef.current = null;
    setIsSlotFormOpen(false);
    setIsItemPickerOpen(false);
    setSelectedSlotId(null);
  };

  const handleCancelSlot = () => {
    if (!selectedSlotId) return;

    const slot = slots.find((s) => s.id === selectedSlotId);
    if (slot && !slot.isConfigured) {
      setSlots((prev) => prev.filter((s) => s.id !== selectedSlotId));
    } else if (editSnapshotRef.current) {
      setSlots((prev) =>
        prev.map((s) => (s.id === selectedSlotId ? { ...editSnapshotRef.current } : s))
      );
    }

    editSnapshotRef.current = null;
    setIsSlotFormOpen(false);
    setIsItemPickerOpen(false);
    setSelectedSlotId(null);
  };

  const handleDeleteSlot = (id) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    if (selectedSlotId === id) {
      setSelectedSlotId(null);
      setIsSlotFormOpen(false);
      setIsItemPickerOpen(false);
    }
  };

  const handleUpdateSelectedSlot = (field, value) => {
    if (!selectedSlotId) return;
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== selectedSlotId) return s;
        if (field === 'type') {
          return { ...s, type: value, category: '', defaultItemId: null, defaultItem: null };
        }
        if (field === 'category' || field === 'slotType') {
          return { ...s, [field]: value, defaultItemId: null, defaultItem: null };
        }
        return { ...s, [field]: value };
      })
    );
  };

  // Mở Item Picker Panel (Cột phụ 2 trong Cột 1)
  const handleOpenItemPicker = async () => {
    const slot = slots.find((s) => s.id === selectedSlotId);
    if (!slot?.type || !slot?.category || !slot?.slotType) {
      toast.warning('Vui lòng chọn đầy đủ Type, Category và Slot Type trước khi chọn vật phẩm mặc định');
      return;
    }

    setIsItemPickerOpen(true);
    setLoadingCompatibleItems(true);

    try {
      const response = await api.get('/admin/items/compatible', {
        params: {
          type: slot.type,
          category: slot.category,
          slotType: slot.slotType,
        },
      });
      const items = response.data.data || response.data || [];
      setCompatibleItems(items);

      // Preload ảnh của các item trả về
      items.forEach((item) => {
        if (item.image && !itemImagesRef.current[item._id]) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            itemImagesRef.current[item._id] = img;
            drawCanvas();
          };
          img.src = item.image;
        }
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Không tải được danh sách vật phẩm phù hợp'
      );
    } finally {
      setLoadingCompatibleItems(false);
    }
  };

  // Chọn hoặc bỏ chọn vật phẩm mặc định
  const handleSelectItemAsDefault = (item) => {
    if (!selectedSlotId) return;

    if (item) {
      handleUpdateSelectedSlot('defaultItemId', item._id);
      handleUpdateSelectedSlot('defaultItem', item);

      if (item.image && !itemImagesRef.current[item._id]) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          itemImagesRef.current[item._id] = img;
          drawCanvas();
        };
        img.src = item.image;
      }
    } else {
      handleUpdateSelectedSlot('defaultItemId', null);
      handleUpdateSelectedSlot('defaultItem', null);
    }
  };

  // Submit
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_SIZE;
    exportCanvas.height = CANVAS_SIZE;
    const ctx = exportCanvas.getContext('2d');

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const scaledW = img.naturalWidth * bgZoom;
    const scaledH = img.naturalHeight * bgZoom;
    ctx.drawImage(img, bgX, bgY, scaledW, scaledH);

    exportCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'room_bg.png', { type: 'image/png' });
        const previewUrl = URL.createObjectURL(blob);

        const slotsToSave = slots
          .filter((s) => s.isConfigured)
          .map(({ isConfigured, defaultItem, ...rest }) => rest);
        onConfirm(file, previewUrl, slotsToSave);
        onClose();
      },
      'image/png'
    );
  };

  if (!isOpen) return null;

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);
  const configuredSlots = slots.filter((s) => s.isConfigured);
  const { labels: slotDisplayNames, typeIndexes } = buildSlotTypeLabels(slots);
  const typeOrder = itemConstants?.types?.map((t) => t.value) || DEFAULT_TYPE_ORDER;
  const sortedConfiguredSlots = sortConfiguredSlotsForDisplay(
    configuredSlots,
    typeIndexes,
    typeOrder
  );
  const categoryOptions = selectedSlot?.type
    ? itemConstants?.categories?.[selectedSlot.type] || []
    : [];
  const sidePanelMode = isSlotFormOpen ? 'form' : configuredSlots.length > 0 ? 'list' : null;
  const hasTwoColumns = sidePanelMode !== null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3>
            <span>🎨</span> Trình thiết kế Phòng (Room Editor)
          </h3>
          <div className={styles.headerControls}>
            {isBackgroundLocked && !isSlotFormOpen && (
              <button
                type="button"
                className={styles.btnAddSlotHeader}
                onClick={handleAddSlot}
              >
                + Thêm Slot
              </button>
            )}
            <button type="button" className={styles.btnClose} onClick={onClose}>×</button>
          </div>
        </div>

        {/* Body gồm 2 cột chính */}
        <div className={`${styles.editorBody} ${hasTwoColumns ? styles.editorBodyTwoCol : styles.editorBodySingleCol}`}>
          {/* Cột 1: Canvas & Vùng hiển thị Nền */}
          <div className={styles.canvasCol}>
            <div className={styles.canvasColInner}>
              <div className={styles.canvasWrapperArea}>
                {/* Vùng Canvas chính */}
                <div className={styles.canvasMainArea}>
                  <div
                    className={styles.canvasWrapper}
                    onMouseDown={handleMouseDown}
                  >
                    <canvas
                      ref={canvasRef}
                      width={CANVAS_SIZE}
                      height={CANVAS_SIZE}
                    />
                  </div>
                </div>

                {/* Cột phụ trong Cột 1: Danh sách vật phẩm thỏa mãn (Item Picker Panel) */}
                {isItemPickerOpen && (
                  <div className={styles.itemPickerPanel}>
                    <div className={styles.itemPickerHeader}>
                      <h5>Vật phẩm thỏa mãn</h5>
                      <button
                        type="button"
                        className={styles.btnCloseItemPicker}
                        onClick={() => setIsItemPickerOpen(false)}
                        title="Đóng danh sách vật phẩm"
                      >
                        ▶
                      </button>
                    </div>

                    <div className={styles.itemPickerList}>
                      <button
                        type="button"
                        className={`${styles.itemPickerOption} ${!selectedSlot?.defaultItemId ? styles.itemPickerOptionActive : ''}`}
                        onClick={() => handleSelectItemAsDefault(null)}
                      >
                        ❌ Không dùng vật phẩm mặc định
                      </button>

                      {loadingCompatibleItems ? (
                        <div className={styles.itemPickerLoading}>Đang tải vật phẩm...</div>
                      ) : compatibleItems.length === 0 ? (
                        <div className={styles.itemPickerEmpty}>
                          Không có vật phẩm nào phù hợp với bộ lọc (type, category, slotType)
                        </div>
                      ) : (
                        compatibleItems.map((item) => {
                          const isSelected =
                            selectedSlot?.defaultItemId === item._id ||
                            selectedSlot?.defaultItemId?._id === item._id;
                          return (
                            <div
                              key={item._id}
                              className={`${styles.itemPickerCard} ${isSelected ? styles.itemPickerCardSelected : ''}`}
                              onClick={() => handleSelectItemAsDefault(item)}
                            >
                              {item.image ? (
                                <img src={item.image} alt={item.name} className={styles.itemPickerImg} />
                              ) : (
                                <div className={styles.itemPickerNoImg}>🖼️</div>
                              )}
                              <div className={styles.itemPickerCardBody}>
                                <strong className={styles.itemPickerCardTitle}>{item.name}</strong>
                                <span className={styles.itemPickerCardSub}>{item.code}</span>
                              </div>
                              {isSelected && <span className={styles.itemPickerCheck}>✓</span>}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Vùng Zoom & Khóa Nền */}
              {!isBackgroundLocked ? (
                <div className={styles.canvasToolsRow}>
                  <div className={styles.zoomControl}>
                    <label>🔍 Thu phóng Nền:</label>
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.01"
                      value={bgZoom}
                      onChange={handleBgZoomChange}
                    />
                    <span>{Math.round(bgZoom * 100)}%</span>
                  </div>
                  <p className={styles.bgHintText}>
                    Kéo thả để căn chỉnh nền, sau đó bấm &quot;Khóa nền&quot; để có thể thêm slot.
                  </p>
                  <button
                    type="button"
                    className={styles.btnLock}
                    onClick={() => setIsBackgroundLocked(true)}
                  >
                    🔒 Khóa nền
                  </button>
                </div>
              ) : (
                <div className={styles.canvasToolsRow}>
                  <div className={styles.lockStatus}>
                    ✅ Nền đã khóa. Kéo thả các hộp màu trên canvas để dịch chuyển slot.
                  </div>
                  {!isSlotFormOpen && (
                    <button
                      type="button"
                      className={styles.btnUnlock}
                      onClick={() => setIsBackgroundLocked(false)}
                    >
                      🔓 Mở khóa & Sửa nền
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cột 2: Form cấu hình Slot hoặc List Slot */}
          {sidePanelMode === 'form' && selectedSlot && (
            <div className={styles.sideCol}>
              <div className={styles.slotFormHeader}>
                <h4>Cấu hình Slot</h4>
                <div className={styles.slotFormActions}>
                  <button
                    type="button"
                    className={styles.btnCancelSlot}
                    onClick={handleCancelSlot}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className={styles.btnCompleteSlot}
                    onClick={handleCompleteSlot}
                  >
                    Hoàn tất
                  </button>
                </div>
              </div>

              <div className={styles.slotDetailForm}>
                {/* Type */}
                <div className={styles.formGroup}>
                  <label>Loại vật phẩm (Type) *</label>
                  <select
                    value={selectedSlot.type}
                    onChange={(e) => handleUpdateSelectedSlot('type', e.target.value)}
                    required
                    disabled={!itemConstants}
                  >
                    <option value="">-- Chọn loại --</option>
                    {itemConstants?.types?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.value})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div className={styles.formGroup}>
                  <label>Danh mục chi tiết (Category) *</label>
                  <select
                    value={selectedSlot.category}
                    onChange={(e) => handleUpdateSelectedSlot('category', e.target.value)}
                    required
                    disabled={!selectedSlot.type || !itemConstants}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {selectedSlot.category &&
                      !categoryOptions.some((opt) => opt.value === selectedSlot.category) && (
                        <option value={selectedSlot.category}>{selectedSlot.category}</option>
                      )}
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Slot Type */}
                <div className={styles.formGroup}>
                  <label>Vị trí trong phòng (Slot Type) *</label>
                  <select
                    value={selectedSlot.slotType}
                    onChange={(e) => handleUpdateSelectedSlot('slotType', e.target.value)}
                    required
                    disabled={!itemConstants}
                  >
                    <option value="">-- Chọn vị trí --</option>
                    {itemConstants?.slotTypes?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.value})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chọn vật phẩm mặc định tại Slot */}
                <div className={styles.formGroup}>
                  <label>Vật phẩm mặc định (Default Item)</label>
                  {selectedSlot.defaultItem || selectedSlot.defaultItemId ? (
                    <div className={styles.defaultItemPreviewBox}>
                      {selectedSlot.defaultItem?.image && (
                        <img
                          src={selectedSlot.defaultItem.image}
                          alt={selectedSlot.defaultItem.name || 'Default Item'}
                          className={styles.defaultItemThumb}
                        />
                      )}
                      <div className={styles.defaultItemInfo}>
                        <span className={styles.defaultItemName}>
                          {selectedSlot.defaultItem?.name || `ID: ${selectedSlot.defaultItemId}`}
                        </span>
                        <span className={styles.defaultItemMeta}>
                          {selectedSlot.defaultItem?.code || ''}
                        </span>
                      </div>
                      <div className={styles.defaultItemBtnGroup}>
                        <button
                          type="button"
                          className={styles.btnChangeDefaultItem}
                          onClick={handleOpenItemPicker}
                        >
                          Đổi
                        </button>
                        <button
                          type="button"
                          className={styles.btnClearDefaultItem}
                          onClick={() => handleSelectItemAsDefault(null)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.btnSelectDefaultItem}
                      onClick={handleOpenItemPicker}
                    >
                      <span>🎁</span> Chọn vật phẩm mặc định
                    </button>
                  )}
                </div>

                {/* Scale & zIndex */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Hệ số thu phóng (Scale)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="3"
                      value={selectedSlot.scaleFactor}
                      onChange={(e) => handleUpdateSelectedSlot('scaleFactor', Number(e.target.value))}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Thứ tự lớp (zIndex)</label>
                    <input
                      type="number"
                      step="1"
                      value={selectedSlot.zIndex}
                      onChange={(e) => handleUpdateSelectedSlot('zIndex', Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Tọa độ X, Y */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Tọa độ X</label>
                    <input
                      type="number"
                      value={Math.round(selectedSlot.x)}
                      onChange={(e) => handleUpdateSelectedSlot('x', Number(e.target.value))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tọa độ Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedSlot.y)}
                      onChange={(e) => handleUpdateSelectedSlot('y', Number(e.target.value))}
                    />
                  </div>
                </div>
                <p className={styles.hintText}>
                  * Mẹo: Có thể dùng chuột kéo thả khối màu trên Canvas thay vì nhập tay tọa độ.
                </p>
              </div>
            </div>
          )}

          {/* Dạng list hiển thị danh sách slot */}
          {sidePanelMode === 'list' && (
            <div className={styles.sideCol}>
              <div className={styles.slotsHeader}>
                <h4>Slots đã cấu hình ({configuredSlots.length})</h4>
              </div>

              <div className={styles.slotsList}>
                {sortedConfiguredSlots.map((s) => (
                  <div
                    key={s.id}
                    className={styles.slotItem}
                    onClick={() => handleEditSlot(s.id)}
                  >
                    <div className={styles.slotItemInfo}>
                      <strong>{slotDisplayNames[s.id]}</strong>
                      <span>z: {s.zIndex} | scale: {s.scaleFactor}</span>
                      {s.category && <span className={styles.slotCategory}>{s.category}</span>}
                    </div>
                    <button
                      type="button"
                      className={styles.btnDelSlotMin}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSlot(s.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.editorFooter}>
          <button type="button" className={styles.btnCancelMain} onClick={onClose}>Hủy</button>
          <button
            type="button"
            className={styles.btnConfirmMain}
            onClick={handleConfirm}
            disabled={!isBackgroundLocked}
          >
            Lưu Nền & Slots
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoomCanvasEditor;
