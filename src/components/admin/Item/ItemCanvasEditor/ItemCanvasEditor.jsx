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
    ctx.strokeRect(1, 1, CANVAS_SIZE - 2, CANVAS_SIZE - 2); // // Vẽ khung hình chữ nhật rỗng bám sát mép canvas (cách lề 1px để không bị tràn mất nét)
    ctx.setLineDash([]);  // // Xóa thiết lập nét đứt, trả bút vẽ về trạng thái nét liền bình thường cho các đoạn sau

    // Vẽ đường gạch ngang đáy (guideline)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';  // Đặt màu nét vẽ là xanh dương nhạt (độ mờ 0.4)
    ctx.lineWidth = 1;  // Độ dày nét vẽ là 1 pixel
    ctx.setLineDash([6, 3]);  // Thiết lập nét đứt: vẽ 6px, ngắt 3px
    ctx.beginPath();  // Ra lệnh bắt đầu một đường thẳng mới
    ctx.moveTo(0, CANVAS_SIZE - 1);  // Đặt bút tại góc trái sát đáy (x = 0, y = 999)
    ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE - 1); // Kéo đường thẳng ngang sang tận góc phải đáy (x = 1000, y = 999)
    ctx.stroke(); // Tiến hành hiển thị đường gạch ngang đáy lên canvas

    // Đường giữa dọc
    ctx.beginPath();  // Bắt đầu đường thẳng mới  
    ctx.moveTo(CANVAS_SIZE / 2, 0); // Đặt bút ở điểm giữa phía trên đỉnh (x = 500, y = 0)
    ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE); // Kéo thẳng tuột xuống đến đáy (x = 500, y = 1000)
    ctx.stroke(); // Hiển thị đường dọc lên canvas
    ctx.setLineDash([]);  // Reset lại nét đứt về mặc định

    // Vẽ item
    const scaledW = img.naturalWidth * zoom;  // Tính chiều rộng thực tế của ảnh nhân với hệ số zoom hiện tại
    const scaledH = img.naturalHeight * zoom; // Tính chiều cao thực tế của ảnh nhân với hệ số zoom hiện tại
    ctx.drawImage(img, itemX, itemY, scaledW, scaledH); // Dán hình ảnh item lên canvas tại tọa độ (itemX, itemY) với kích thước đã co giãn

    // Vẽ viền bao quanh item (Bounding box) để dễ căn chỉnh
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)'; // Xanh lục nhạt
    ctx.lineWidth = 4;
    ctx.setLineDash([4, 2]);
    ctx.strokeRect(itemX, itemY, scaledW, scaledH); // Vẽ một khung hình chữ nhật bọc khít lấy item theo đúng tọa độ và kích thước hiện tại
    ctx.setLineDash([]);

    // Kiểm tra item có nằm gọn trong khung không
    const fits =
      itemX >= -1 &&  // Kiểm tra mép trái item không vượt quá biên trái quá 1px
      itemY >= -1 &&  // Kiểm tra mép trên item không vượt quá biên trên quá 1px
      itemX + scaledW <= CANVAS_SIZE + 1 && // Kiểm tra mép phải item không vượt quá giới hạn 1000px quá 1px
      itemY + scaledH <= CANVAS_SIZE + 1; // Kiểm tra mép dưới item không vượt quá giới hạn 1000px quá 1px
    setIsItemFit(fits);
  }, [itemX, itemY, zoom]);

  // khi admin kéo thả item hoặc zoom thì hàm này được thực thi => vẽ lại item ra giao diện
  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [imageLoaded, drawCanvas]);

  // ===== Drag handlers =====
  // hàm này được thực thi ngay khi admin đè chuột trái xuống để bắt đầu di chuyển item
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);  // đánh dấu bắt đầu hành động kéo thả
    const rect = canvasRef.current.getBoundingClientRect();

    // lưu trữ toàn bộ mốc khởi điểm
    dragStartRef.current = {
      // ghi lại tọa độ con trỏ chuột ngay khi vừa bấm xuống
      x: e.clientX,
      y: e.clientY,
      // ghi lại tọa độ của item trên canvas ngay trước khi bắt đầu kéo
      startItemX: itemX,
      startItemY: itemY,
    };
  };

  // hàm này liên tục được kích hoạt mỗi khi con trỏ chuột di chuyển
  // Nó làm nhiệm vụ đo đạc xem con trỏ chuột đã dịch chuyển đi bao nhiêu khoảng cách 
  // so với lúc mới bấm chuột xuống, từ đó tính toán và cập nhật lại tọa độ mới 
  // cho item theo thời gian thực.
  // Nó chỉ được khởi tạo lại khi trạng thái kéo (isDragging) thả được thay đổi
  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      // tính toán khoảng cách di chuyển của item
      // hệ số SCALE_RATIO giúp quy đổi chính xác số pixel chuột dịch chuyển 
      // trên màn hình thành số pixel tương ứng bên trong không gian tọa độ thực của canvas.
      const dx = (e.clientX - dragStartRef.current.x) / SCALE_RATIO;
      const dy = (e.clientY - dragStartRef.current.y) / SCALE_RATIO;

      // Cập nhật vị trí mới của item
      // từ đó kích hoạt hàm drawCanvas giúp vẻ lại hình ảnh ngay lập tức
      setItemX(dragStartRef.current.startItemX + dx);
      setItemY(dragStartRef.current.startItemY + dy);
    },
    [isDragging],
  );

  // Khi admin nhất chuột lên (tức là hoàn thành quá trình kéo thả)
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    // khi admin thực hiện kéo thả
    if (isDragging) {
      // Lắng nghe mọi chuyển động của chuột trên toàn màn hình để gọi hàm handleMouseMove cập nhật tọa độ item.
      window.addEventListener('mousemove', handleMouseMove);
      // Lắng nghe hành động thả tay ra khỏi chuột ở bất cứ đâu.
      window.addEventListener('mouseup', handleMouseUp);
    }
    // khi admin kéo xong và thả tay ra => dọn dẹp  
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
  // Khi phóng to hay thu nhỏ item bằng thanh trượt (slider), 
  // item sẽ luôn đứng im tại chỗ (giữ nguyên tâm) chứ không bị giật lùi hay lệch đi đâu mất
  const handleZoomChange = (e) => {
    const img = imageRef.current;
    if (!img) return;

    // lấy ra hệ số zoom mới (khi admin kéo thanh trượt)
    const newZoom = parseFloat(e.target.value);
    // Giữ item căn giữa khi zoom
    // kích thước cũ trước khi zoom
    const oldScaledW = img.naturalWidth * zoom;
    const oldScaledH = img.naturalHeight * zoom;
    // kích thước mới sau khi zoom
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
  // hàm này thực hiện khi admin bấm nút reset lại vị trí
  const handleResetPosition = () => {
    const img = imageRef.current;
    if (!img) return;

    const scaledW = img.naturalWidth * zoom;
    const scaledH = img.naturalHeight * zoom;
    setItemX((CANVAS_SIZE - scaledW) / 2);
    setItemY(CANVAS_SIZE - scaledH);
  };

  // ===== Xuất ảnh PNG 1000x1000 =====
  // hàm này được gọi khi admin bấm xác nhận và lưu ảnh
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    // Tạo canvas mới sạch sẽ (không có guideline)
    // tạo ra thẻ canvas ảo với kích thước 1000x1000
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_SIZE;
    exportCanvas.height = CANVAS_SIZE;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Nền trong suốt
    // xóa trống canvas ảo để đảm bảo nền của nó trong suốt
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Vẽ item
    const scaledW = img.naturalWidth * zoom;
    const scaledH = img.naturalHeight * zoom;
    ctx.drawImage(img, itemX, itemY, scaledW, scaledH);

    // nén toàn bộ nội dung hình ảnh trên canvas thành dữ liệu nhị phân (blob) dưới dạng ảnh PNG
    exportCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        // đóng gói bolb thành đối tượng File hoàn chỉnh, file này sẵn sàng để gửi sang server
        const file = new File([blob], 'item.png', { type: 'image/png' });
        // tạo url tạm thời để preview ảnh
        const previewUrl = URL.createObjectURL(blob);
        // truyền dữ liệu ra component cha
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
            <span>🎯</span> Căn chỉnh vật phẩm
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
              max="5"
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
