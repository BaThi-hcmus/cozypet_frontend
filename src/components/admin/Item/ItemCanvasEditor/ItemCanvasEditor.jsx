import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ItemCanvasEditor.module.css';

const CANVAS_SIZE = 1000; // Kích thước canvas chuẩn (1000x1000)
const DISPLAY_SIZE = 400; // Kích thước hiển thị trên UI (scale 0.4)
const SCALE_RATIO = DISPLAY_SIZE / CANVAS_SIZE;

/**
 * ItemCanvasEditor - Modal chỉnh sửa ảnh item trên canvas 1000x1000
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - imgSrc: string (URL tạm của ảnh PNG gốc admin vừa upload)
 * - onConfirm: (file: File, previewUrl: string) => void
 */
function ItemCanvasEditor({ isOpen, onClose, imgSrc, onConfirm }) {
  // Giữ tham chiếu trực tiếp đến thẻ HTML <canvas> thực tế trong DOM.
  // Khi Admin kéo thả chuột, thay đổi thanh trượt Zoom, hoặc reset vị trí, 
  // React cần dùng canvasRef để vẽ lại hình ảnh mới lên khung canvas ngay lập tức mà không cần phải reload lại trang.
  const canvasRef = useRef(null);

  // Vai trò: Lưu trữ đối tượng hình ảnh
  // được khởi tạo ngầm trong JavaScript sau khi Admin chọn file ảnh từ máy tính.
  // Khi Admin chọn một file ảnh PNG bất kỳ, đoạn code ngầm tải ảnh vào bộ nhớ thông qua imageRef 
  // để lấy kích thước gốc (naturalWidth, naturalHeight) và dùng đối tượng này để vẽ liên tục lên canvas 
  // mỗi khi có thao tác dịch chuyển.
  const imageRef = useRef(null);

  // Vị trí item trên canvas (tính theo hệ tọa độ 1000x1000)
  // Lưu tọa độ góc trên - trái của item
  const [itemX, setItemX] = useState(0);
  const [itemY, setItemY] = useState(0);

  // Hệ số zoom (1 = kích thước gốc)
  const [zoom, setZoom] = useState(1);
  // Trạng thái kéo thả
  // flag đánh dấu xem Admin có đang giữ chuột trái (hoặc đặt ngón tay lên màn hình) để kéo item hay không.
  const [isDragging, setIsDragging] = useState(false);

  // Vai trò: Lưu lại vị trí tọa độ ban đầu của con trỏ chuột 
  // và vị trí ban đầu của item ngay tại thời điểm Admin bắt đầu bấm chuột xuống để kéo.
  // Giúp hệ thống tính toán chính xác độ lệch (dx, dy) giữa vị trí chuột hiện tại 
  // so với vị trí lúc mới bấm xuống, từ đó dịch chuyển item một cách mượt mà
  const dragStartRef = useRef({ x: 0, y: 0, startItemX: 0, startItemY: 0 });

  // Kiểm tra xem bức ảnh do Admin upload đã được trình duyệt tải xong vào bộ nhớ chưa.
  const [imageLoaded, setImageLoaded] = useState(false);

  // Biến kiểm tra logic xem toàn bộ phần hình ảnh của item hiện tại 
  // có đang nằm hoàn toàn bên trong khung chuẩn $1000 \times 1000$ hay không.
  const [isItemFit, setIsItemFit] = useState(true);

  // Load ảnh khi imgSrc thay đổi
  // được gọi khi admin mở modal canvas hoặc upload ảnh mới
  useEffect(() => {
    if (!isOpen || !imgSrc) return;

    const img = new Image();
    // hàm này chạy ngay khoảnh khắc trình duyệt đã đọc xong toàn bộ file ảnh mà Admin vừa chọn
    img.onload = () => {
      imageRef.current = img; // lưu ảnh vừa load vào imageRef
      setImageLoaded(true); // đánh dấu ảnh đã load xong

      // Tính zoom mặc định để ảnh vừa khít canvas (max 90% canvas)
      const maxDim = Math.max(img.naturalWidth, img.naturalHeight); // lấy ra cạnh lớn nhất của image vừa được upload
      const defaultZoom = maxDim > CANVAS_SIZE * 0.9  // Nếu ảnh to hơn 90% kích thước của khung canvas
        ? (CANVAS_SIZE * 0.9) / maxDim  // điều chỉnh tỉ lệ zoom để image lọt vào khung canvas
        : 1;  // giữ nguyên zoom gốc của item
      setZoom(defaultZoom);

      // Căn giữa ngang, sát đáy
      // bức ảnh tự động nhảy vào vị trí chuẩn khi mở modal canvas
      // tính toán chiều cao và rộng của image dựa theo hộ số zoom đã tính ở trên
      const scaledW = img.naturalWidth * defaultZoom;
      const scaledH = img.naturalHeight * defaultZoom;
      // căn chỉnh theo chiều ngang
      setItemX((CANVAS_SIZE - scaledW) / 2);
      // căn chỉnh chiều dọc sao cho item nằm sát mép đáy của khung canvas
      setItemY(CANVAS_SIZE - scaledH);
    };
    img.src = imgSrc;

    // dọn dẹp bộ nhớ khi admin tắt modal đi
    return () => {
      imageRef.current = null;
      setImageLoaded(false);
    };
  }, [imgSrc, isOpen]);

  // Vẽ canvas mỗi khi state thay đổi
  // khi admin kéo chuột để di chuyển item, hoặc thay đổi kích thước(zoom) 
  // thì gọi vào hàm này để vẽ lại item ngay lập tức, bám sát từng milimet chuyển động => tạo cảm giác mượt
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current; // thẻ html canvas được tham chiếu
    const img = imageRef.current; // thẻ được upload lên
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d'); // xin cấp quyền bút vẽ 2D từ canvas để bắt đầu vẽ hình 
    if (!ctx) return;

    // xóa sạch ảnh cũ trước khi vẽ ảnh mới (xóa từ vị trí (0, 0) => (1000x1000))
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Vẽ viền khung 1000x1000
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';  // Thiết lập màu cho nét vẽ đường viền là màu hồng nhạt (độ mờ 0.3)
    ctx.lineWidth = 15;  // Độ dày của đường viền là 2 pixels
    ctx.setLineDash([12, 4]);  // Thiết lập kiểu nét đứt: cứ vẽ 8px liền rồi lại ngắt 4px trống, lặp lại liên tục
    ctx.strokeRect(1, 1, CANVAS_SIZE - 2, CANVAS_SIZE - 2);
    ctx.setLineDash([]);

    // Vẽ đường gạch ngang đáy (guideline)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_SIZE - 1);
    ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE - 1);
    ctx.stroke();
    // Đường giữa dọc
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE / 2, 0);
    ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE);
    ctx.stroke();
    ctx.setLineDash([]);

    // Vẽ item
    const scaledW = img.naturalWidth * zoom;
    const scaledH = img.naturalHeight * zoom;
    ctx.drawImage(img, itemX, itemY, scaledW, scaledH);

    // Vẽ viền bao quanh item (Bounding box) để dễ căn chỉnh
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)'; // Xanh lục nhạt
    ctx.lineWidth = 4;
    ctx.setLineDash([4, 2]);
    ctx.strokeRect(itemX, itemY, scaledW, scaledH);
    ctx.setLineDash([]);

    // Kiểm tra item có nằm gọn trong khung không
    const fits =
      itemX >= -1 &&
      itemY >= -1 &&
      itemX + scaledW <= CANVAS_SIZE + 1 &&
      itemY + scaledH <= CANVAS_SIZE + 1;
    setIsItemFit(fits);
  }, [itemX, itemY, zoom]);

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [imageLoaded, drawCanvas]);

  // ===== Drag handlers =====
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = canvasRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startItemX: itemX,
      startItemY: itemY,
    };
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const dx = (e.clientX - dragStartRef.current.x) / SCALE_RATIO;
      const dy = (e.clientY - dragStartRef.current.y) / SCALE_RATIO;
      setItemX(dragStartRef.current.startItemX + dx);
      setItemY(dragStartRef.current.startItemY + dy);
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

  // ===== Touch handlers (mobile) =====
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      startItemX: itemX,
      startItemY: itemY,
    };
  };

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const dx = (touch.clientX - dragStartRef.current.x) / SCALE_RATIO;
      const dy = (touch.clientY - dragStartRef.current.y) / SCALE_RATIO;
      setItemX(dragStartRef.current.startItemX + dx);
      setItemY(dragStartRef.current.startItemY + dy);
    },
    [isDragging],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ===== Zoom change =====
  const handleZoomChange = (e) => {
    const img = imageRef.current;
    if (!img) return;

    const newZoom = parseFloat(e.target.value);
    // Giữ item căn giữa khi zoom
    const oldScaledW = img.naturalWidth * zoom;
    const oldScaledH = img.naturalHeight * zoom;
    const newScaledW = img.naturalWidth * newZoom;
    const newScaledH = img.naturalHeight * newZoom;

    // Bù trừ vị trí để giữ tâm item không đổi
    const centerX = itemX + oldScaledW / 2;
    const centerY = itemY + oldScaledH / 2;

    setItemX(centerX - newScaledW / 2);
    setItemY(centerY - newScaledH / 2);
    setZoom(newZoom);
  };

  // ===== Reset position: căn giữa ngang, sát đáy =====
  const handleResetPosition = () => {
    const img = imageRef.current;
    if (!img) return;

    const scaledW = img.naturalWidth * zoom;
    const scaledH = img.naturalHeight * zoom;
    setItemX((CANVAS_SIZE - scaledW) / 2);
    setItemY(CANVAS_SIZE - scaledH);
  };

  // ===== Xuất ảnh PNG 1000x1000 =====
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    // Tạo canvas mới sạch sẽ (không có guideline)
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_SIZE;
    exportCanvas.height = CANVAS_SIZE;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Nền trong suốt
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Vẽ item
    const scaledW = img.naturalWidth * zoom;
    const scaledH = img.naturalHeight * zoom;
    ctx.drawImage(img, itemX, itemY, scaledW, scaledH);

    exportCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'item.png', { type: 'image/png' });
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
            <span>🎯</span> Căn chỉnh vật phẩm (1000 × 1000)
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
              max="3"
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
              ↻ Căn lại vị trí mặc định
            </button>
          </div>

          {/* Validation status */}
          {imageLoaded && (
            <div
              className={`${styles.validationRow} ${isItemFit ? styles.validOk : styles.validError
                }`}
            >
              {isItemFit
                ? '✅ Item nằm gọn trong khung 1000×1000. Sẵn sàng gửi!'
                : '⚠️ Item đang tràn ra ngoài khung! Hãy thu nhỏ hoặc kéo vào trong.'}
            </div>
          )}

          {!imageLoaded && (
            <div className={`${styles.validationRow} ${styles.validInfo}`}>
              ⏳ Đang tải ảnh...
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
            disabled={!imageLoaded || !isItemFit}
          >
            ✓ Xác nhận & Lưu ảnh
          </button>
        </div>
      </div>
    </div>
  );
}

export default ItemCanvasEditor;
