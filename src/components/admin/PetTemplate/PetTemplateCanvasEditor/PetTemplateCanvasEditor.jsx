import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './PetTemplateCanvasEditor.module.css';

const CANVAS_SIZE = 1000; // Kích thước chuẩn 1000x1000
const DISPLAY_SIZE = 400; // Kích thước hiển thị trên UI
const SCALE_RATIO = DISPLAY_SIZE / CANVAS_SIZE;

/**
 * PetCanvasEditor - Modal chỉnh sửa ảnh Pet template trên canvas 1000x1000
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - imgSrc: string (URL tạm của ảnh pet gốc)
 * - onConfirm: (file: File, previewUrl: string) => void
 */
function PetCanvasEditor({ isOpen, onClose, imgSrc, onConfirm }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Tọa độ pet trên canvas 1000x1000
  const [petX, setPetX] = useState(0);
  const [petY, setPetY] = useState(0);

  // Hệ số zoom
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startPetX: 0, startPetY: 0 });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPetFit, setIsPetFit] = useState(true);

  // Load ảnh và thiết lập vị trí mặc định
  useEffect(() => {
    if (!isOpen || !imgSrc) return;

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);

      // Tính zoom mặc định vừa khít 80% canvas để pet hiển thị đẹp ở giữa
      const maxDim = Math.max(img.naturalWidth, img.naturalHeight);
      const defaultZoom = maxDim > CANVAS_SIZE * 0.8
        ? (CANVAS_SIZE * 0.8) / maxDim
        : 1;
      setZoom(defaultZoom);

      // Căn giữa tuyệt đối (Cả Ngang & Dọc) cho Pet Template
      const scaledW = img.naturalWidth * defaultZoom;
      const scaledH = img.naturalHeight * defaultZoom;
      setPetX((CANVAS_SIZE - scaledW) / 2);
      setPetY((CANVAS_SIZE - scaledH) / 2);
    };
    img.src = imgSrc;

    return () => {
      imageRef.current = null;
      setImageLoaded(false);
    };
  }, [imgSrc, isOpen]);

  // Vẽ canvas kèm guideline tâm và bounding box nhận diện
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Vẽ viền khung 1000x1000
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 15;
    ctx.setLineDash([12, 4]);
    ctx.strokeRect(1, 1, CANVAS_SIZE - 2, CANVAS_SIZE - 2);
    ctx.setLineDash([]);

    // Vẽ đường Guideline tâm (Ngang & Dọc giúp dễ canh giữa pet)
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);

    // Đường ngang giữa
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_SIZE / 2);
    ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE / 2);
    ctx.stroke();

    // Đường dọc giữa
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE / 2, 0);
    ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE);
    ctx.stroke();
    ctx.setLineDash([]);

    // Vẽ Pet Image
    const scaledW = img.naturalWidth * zoom;
    const scaledH = img.naturalHeight * zoom;
    ctx.drawImage(img, petX, petY, scaledW, scaledH);

    // Vẽ Bounding box viền xanh bao quanh pet
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
    ctx.lineWidth = 4;
    ctx.setLineDash([4, 2]);
    ctx.strokeRect(petX, petY, scaledW, scaledH);
    ctx.setLineDash([]);

    // Check xem Pet có nằm gọn trong khung không
    const fits =
      petX >= -1 &&
      petY >= -1 &&
      petX + scaledW <= CANVAS_SIZE + 1 &&
      petY + scaledH <= CANVAS_SIZE + 1;
    setIsPetFit(fits);
  }, [petX, petY, zoom]);

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [imageLoaded, drawCanvas]);

  // Mouse handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPetX: petX,
      startPetY: petY,
    };
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const dx = (e.clientX - dragStartRef.current.x) / SCALE_RATIO;
      const dy = (e.clientY - dragStartRef.current.y) / SCALE_RATIO;
      setPetX(dragStartRef.current.startPetX + dx);
      setPetY(dragStartRef.current.startPetY + dy);
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch handlers (Mobile)
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      startPetX: petX,
      startPetY: petY,
    };
  };

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const dx = (touch.clientX - dragStartRef.current.x) / SCALE_RATIO;
      const dy = (touch.clientY - dragStartRef.current.y) / SCALE_RATIO;
      setPetX(dragStartRef.current.startPetX + dx);
      setPetY(dragStartRef.current.startPetY + dy);
    },
    [isDragging],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom giữ nguyên tâm
  const handleZoomChange = (e) => {
    const img = imageRef.current;
    if (!img) return;

    const newZoom = parseFloat(e.target.value);
    const oldScaledW = img.naturalWidth * zoom;
    const oldScaledH = img.naturalHeight * zoom;
    const newScaledW = img.naturalWidth * newZoom;
    const newScaledH = img.naturalHeight * newZoom;

    // Bù trừ giữ nguyên tâm pet
    const centerX = petX + oldScaledW / 2;
    const centerY = petY + oldScaledH / 2;

    setPetX(centerX - newScaledW / 2);
    setPetY(centerY - newScaledH / 2);
    setZoom(newZoom);
  };

  // Reset về vị trí chính giữa canvas
  const handleResetPosition = () => {
    const img = imageRef.current;
    if (!img) return;

    const scaledW = img.naturalWidth * zoom;
    const scaledH = img.naturalHeight * zoom;
    setPetX((CANVAS_SIZE - scaledW) / 2);
    setPetY((CANVAS_SIZE - scaledH) / 2);
  };

  // Xuất file ảnh PNG 1000x1000
  const handleConfirm = () => {
    const img = imageRef.current;
    if (!img) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_SIZE;
    exportCanvas.height = CANVAS_SIZE;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const scaledW = img.naturalWidth * zoom;
    const scaledH = img.naturalHeight * zoom;
    ctx.drawImage(img, petX, petY, scaledW, scaledH);

    exportCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'pet-template.png', { type: 'image/png' });
        const previewUrl = URL.createObjectURL(blob);
        onConfirm(file, previewUrl);
        onClose();
      },
      'image/png',
    );
  };

  if (!isOpen) return null;

  return (
    <div className={styles.editorOverlay}>
      <div className={styles.editorContainer}>
        {/* Header */}
        <div className={styles.editorHeader}>
          <h3>
            <span>🐾</span> Căn chỉnh Pet Template
          </h3>
          <button type="button" onClick={onClose}>×</button>
        </div>

        {/* Canvas Area */}
        <div className={styles.canvasArea}>
          <div
            className={styles.canvasWrapper}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
            />
          </div>

          {/* Zoom slider */}
          <div className={styles.controlsRow}>
            <span className={styles.controlLabel}>🔍 Thu/Phóng:</span>
            <input
              type="range"
              min="0.05"
              max="10"
              step="0.01"
              value={zoom}
              onChange={handleZoomChange}
              className={styles.zoomSlider}
            />
            <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>
          </div>

          {/* Reset position */}
          <div className={styles.controlsRow}>
            <button
              type="button"
              className={styles.btnResetPosition}
              onClick={handleResetPosition}
            >
              🎯 Đưa về chính giữa khung
            </button>
          </div>

          {/* Validation Status */}
          {imageLoaded && (
            <div
              className={`${styles.validationRow} ${isPetFit ? styles.validOk : styles.validError
                }`}
            >
              {isPetFit
                ? '✅ Pet nằm gọn trong khung chuẩn. Sẵn sàng lưu!'
                : '⚠️ Pet đang tràn ra ngoài khung!.'}
            </div>
          )}

          {!imageLoaded && (
            <div className={`${styles.validationRow} ${styles.validInfo}`}>
              ⏳ Đang tải ảnh Pet...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.editorFooter}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className={styles.btnConfirm}
            onClick={handleConfirm}
            disabled={!imageLoaded || !isPetFit}
          >
            ✓ Xác nhận & Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

export default PetCanvasEditor;