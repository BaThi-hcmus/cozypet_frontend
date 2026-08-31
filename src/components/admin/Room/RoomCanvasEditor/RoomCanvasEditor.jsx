import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './RoomCanvasEditor.module.css';
import { toast } from 'react-toastify';

const CANVAS_SIZE = 1000;
const DISPLAY_SIZE = 600; // Khung to hơn item editor (600x600)
const SCALE_RATIO = DISPLAY_SIZE / CANVAS_SIZE;

function RoomCanvasEditor({ isOpen, onClose, imgSrc, initialSlots = [], onConfirm }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Phase 1 (Background)
  const [bgX, setBgX] = useState(0);
  const [bgY, setBgY] = useState(0);
  const [bgZoom, setBgZoom] = useState(1);
  const [isDraggingBg, setIsDraggingBg] = useState(false);
  
  // Trạng thái chuyển đổi phase
  const [isBackgroundLocked, setIsBackgroundLocked] = useState(false);

  // Phase 2 (Slots)
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [isDraggingSlot, setIsDraggingSlot] = useState(false);
  
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0, targetId: null });

  // Load init data
  useEffect(() => {
    if (initialSlots && initialSlots.length > 0) {
      setSlots(initialSlots);
    } else {
      setSlots([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !imgSrc) return;

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);

      const maxDim = Math.max(img.naturalWidth, img.naturalHeight);
      const defaultZoom = maxDim > CANVAS_SIZE 
        ? CANVAS_SIZE / maxDim 
        : 1;
      
      setBgZoom(defaultZoom);
      const scaledW = img.naturalWidth * defaultZoom;
      const scaledH = img.naturalHeight * defaultZoom;
      setBgX((CANVAS_SIZE - scaledW) / 2);
      setBgY((CANVAS_SIZE - scaledH) / 2);
    };
    // xử lý cors nếu load ảnh từ link ngoài (cloudinary)
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;

    return () => {
      imageRef.current = null;
      setImageLoaded(false);
    };
  }, [imgSrc, isOpen]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Xóa nền
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Vẽ Background
    const scaledW = img.naturalWidth * bgZoom;
    const scaledH = img.naturalHeight * bgZoom;
    ctx.drawImage(img, bgX, bgY, scaledW, scaledH);

    // Vẽ guide line (Phase 1)
    if (!isBackgroundLocked) {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';
      ctx.lineWidth = 10;
      ctx.setLineDash([12, 4]);
      ctx.strokeRect(1, 1, CANVAS_SIZE - 2, CANVAS_SIZE - 2);
      ctx.setLineDash([]);
    }

    // Vẽ Slots (Phase 2)
    if (isBackgroundLocked) {
      // Sort theo zIndex để vẽ slot ở dưới trước, trên sau
      const sortedSlots = [...slots].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

      sortedSlots.forEach((slot) => {
        const slotW = CANVAS_SIZE * (slot.scaleFactor || 1);
        const slotH = CANVAS_SIZE * (slot.scaleFactor || 1);
        
        // Màu sắc phân biệt theo type
        let color = 'rgba(59, 130, 246, 0.7)'; // Mặc định xanh dương
        if (slot.type === 'furniture') color = 'rgba(16, 185, 129, 0.7)'; // xanh lá
        if (slot.type === 'decoration') color = 'rgba(236, 72, 153, 0.7)'; // hồng
        if (slot.type === 'food') color = 'rgba(245, 158, 11, 0.7)'; // cam
        if (slot.type === 'toy') color = 'rgba(139, 92, 246, 0.7)'; // tím

        const isSelected = slot.id === selectedSlotId;

        // Vẽ mảng mờ bên trong
        ctx.fillStyle = isSelected ? color.replace('0.7', '0.3') : color.replace('0.7', '0.1');
        ctx.fillRect(slot.x, slot.y, slotW, slotH);

        // Vẽ viền
        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 6 : 3;
        if (isSelected) {
          ctx.setLineDash([8, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.strokeRect(slot.x, slot.y, slotW, slotH);
        ctx.setLineDash([]);

        // Vẽ tâm (điểm anchor nhỏ)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(slot.x + slotW / 2, slot.y + slotH / 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Vẽ tên Type
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        const text = `${slot.type} (${slot.zIndex})`;
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

  // ===== Drag Events =====
  const handleMouseDown = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    // Tọa độ trên canvas 1000x1000
    const canvasClickX = (clickX - rect.left) / SCALE_RATIO;
    const canvasClickY = (clickY - rect.top) / SCALE_RATIO;

    if (!isBackgroundLocked) {
      // Phase 1: Kéo Background
      setIsDraggingBg(true);
      dragStartRef.current = {
        x: clickX,
        y: clickY,
        startX: bgX,
        startY: bgY,
      };
    } else {
      // Phase 2: Click/Kéo Slot
      // Tìm xem click vào slot nào (ưu tiên zIndex cao hơn)
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
        setIsDraggingSlot(true);
        dragStartRef.current = {
          x: clickX,
          y: clickY,
          startX: clickedSlot.x,
          startY: clickedSlot.y,
          targetId: clickedSlot.id,
        };
      } else {
        setSelectedSlotId(null); // click ra ngoài
      }
    }
  };

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

  // ===== Phase 1 Tools =====
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

  // ===== Phase 2 Tools =====
  const handleAddSlot = () => {
    const newSlot = {
      id: `slot_${Date.now()}`,
      x: 250, // giữa canvas
      y: 250,
      type: 'furniture',
      category: '',
      slotType: 'center_floor',
      zIndex: 1,
      scaleFactor: 0.5, // 500x500 mặc định
    };
    setSlots([...slots, newSlot]);
    setSelectedSlotId(newSlot.id);
  };

  const handleDeleteSlot = (id) => {
    setSlots(slots.filter((s) => s.id !== id));
    if (selectedSlotId === id) setSelectedSlotId(null);
  };

  const handleUpdateSelectedSlot = (field, value) => {
    if (!selectedSlotId) return;
    setSlots((prev) =>
      prev.map((s) => (s.id === selectedSlotId ? { ...s, [field]: value } : s))
    );
  };

  // ===== Submit =====
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    // Xuất ảnh background đã crop 1000x1000 (không vẽ slot lên ảnh xuất ra!)
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
        
        // Chuẩn hóa slots trước khi gửi (xóa id tạm)
        // Backend yêu cầu slots là object map: { "slot_1": { x, y... } }
        // Hoặc là mảng, tùy BE. Trong sơ đồ ta định dạng JSON.
        // Giữ lại id để edit, BE không care id lắm, nhưng schema RoomSlot có yêu cầu gì không?
        onConfirm(file, previewUrl, slots);
        onClose();
      },
      'image/png'
    );
  };

  if (!isOpen) return null;

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>
            <span>🎨</span> Trình thiết kế Phòng (Room Editor)
          </h3>
          <div className={styles.headerControls}>
             <button type="button" className={styles.btnClose} onClick={onClose}>×</button>
          </div>
        </div>

        <div className={styles.editorBody}>
          {/* Cột trái: Canvas */}
          <div className={styles.canvasCol}>
            <div className={styles.canvasWrapperArea}>
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

            {/* Tools dưới canvas */}
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
                <button 
                  type="button" 
                  className={styles.btnLock}
                  onClick={() => setIsBackgroundLocked(true)}
                >
                  🔒 Khóa nền & Chuyển sang Cấu hình Slots
                </button>
              </div>
            ) : (
              <div className={styles.canvasToolsRow}>
                <div className={styles.lockStatus}>
                  ✅ Nền đã khóa. Kéo thả các hộp màu để dịch chuyển Slot.
                </div>
                <button 
                  type="button" 
                  className={styles.btnUnlock}
                  onClick={() => setIsBackgroundLocked(false)}
                >
                  🔓 Mở khóa & Sửa nền
                </button>
              </div>
            )}
          </div>

          {/* Cột phải: Slot Configurator */}
          {isBackgroundLocked && (
            <div className={styles.slotsCol}>
              <div className={styles.slotsHeader}>
                <h4>Danh sách Slots ({slots.length})</h4>
                <button type="button" className={styles.btnAddSlot} onClick={handleAddSlot}>
                  + Thêm Slot
                </button>
              </div>

              <div className={styles.slotsList}>
                {slots.map((s) => (
                  <div 
                    key={s.id} 
                    className={`${styles.slotItem} ${s.id === selectedSlotId ? styles.activeSlot : ''}`}
                    onClick={() => setSelectedSlotId(s.id)}
                  >
                    <div className={styles.slotItemInfo}>
                      <strong>{s.type}</strong>
                      <span>z: {s.zIndex} | scale: {s.scaleFactor}</span>
                    </div>
                    <button 
                      type="button" 
                      className={styles.btnDelSlotMin}
                      onClick={(e) => { e.stopPropagation(); handleDeleteSlot(s.id); }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {slots.length === 0 && (
                  <div className={styles.emptySlotMsg}>Chưa có slot nào. Hãy ấn "+ Thêm Slot".</div>
                )}
              </div>

              {selectedSlot && (
                <div className={styles.slotDetailForm}>
                  <h5>Cấu hình chi tiết Slot</h5>
                  
                  <div className={styles.formGroup}>
                    <label>Loại vật phẩm (Type)</label>
                    <select
                      value={selectedSlot.type}
                      onChange={(e) => handleUpdateSelectedSlot('type', e.target.value)}
                    >
                      <option value="furniture">Nội thất (furniture)</option>
                      <option value="decoration">Trang trí (decoration)</option>
                      <option value="food">Thức ăn (food)</option>
                      <option value="toy">Đồ chơi (toy)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Danh mục chi tiết (Category)</label>
                    <input
                      type="text"
                      value={selectedSlot.category}
                      onChange={(e) => handleUpdateSelectedSlot('category', e.target.value)}
                      placeholder="VD: bed, table, picture..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Vị trí trong phòng (Slot Type)</label>
                    <select
                      value={selectedSlot.slotType}
                      onChange={(e) => handleUpdateSelectedSlot('slotType', e.target.value)}
                    >
                      <option value="left_floor">Sàn trái</option>
                      <option value="center_floor">Sàn giữa</option>
                      <option value="right_floor">Sàn phải</option>
                      <option value="left_wall">Tường trái</option>
                      <option value="center_wall">Tường giữa</option>
                      <option value="right_wall">Tường phải</option>
                      <option value="ceiling">Trần nhà</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

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
                  <p className={styles.hintText}>* Mẹo: Có thể dùng chuột kéo thả khối màu trên Canvas thay vì nhập tay tọa độ.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.editorFooter}>
          <button type="button" className={styles.btnCancelMain} onClick={onClose}>Hủy</button>
          <button type="button" className={styles.btnConfirmMain} onClick={handleConfirm} disabled={!isBackgroundLocked}>
            Lưu Nền & Slots
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoomCanvasEditor;
