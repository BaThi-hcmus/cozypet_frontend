import React, { useState, useRef, useEffect } from 'react';
import styles from './PetRigEditorModal.module.css';
import { clampPartSize, calcOriginOffset } from '../../../../utils/petAnimations';

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

function PetRigEditorModal({ isOpen, onClose, imgSrcs = {}, onConfirm }) {
  // imgSrcs nhận vào object chứa url: { head: '...', body: '...', leftArm: '...', ... }
  const canvasRef = useRef(null);

  // Trạng thái cấu hình cho từng bộ phận (Tọa độ x, y tính trên khung logical 1000x1000)
  const [partsConfig, setPartsConfig] = useState({
    body: { x: 350, y: 350, scale: 1, rotation: 0, zIndex: 2, transformOrigin: 'center' },
    head: { x: 350, y: 150, scale: 1, rotation: 0, zIndex: 3, transformOrigin: 'bottom center' },
    leftArm: { x: 250, y: 320, scale: 1, rotation: 0, zIndex: 1, transformOrigin: 'top center' },
    rightArm: { x: 480, y: 320, scale: 1, rotation: 0, zIndex: 4, transformOrigin: 'top center' },
    leftLeg: { x: 300, y: 580, scale: 1, rotation: 0, zIndex: 0, transformOrigin: 'top center' },
    rightLeg: { x: 450, y: 580, scale: 1, rotation: 0, zIndex: 0, transformOrigin: 'top center' },
    tail: { x: 550, y: 400, scale: 1, rotation: 0, zIndex: -1, transformOrigin: 'left center' },
  });

  const [loadedImages, setLoadedImages] = useState({});
  // bộ phận đang được chọn
  const [selectedPart, setSelectedPart] = useState(null);
  // có khóa toàn bộ các bộ phận hay không
  const [isLocked, setIsLocked] = useState(false);
  // zoom tổng thể
  const [globalZoom, setGlobalZoom] = useState(1);
  // độ dịch chuyển tổng thể
  const [globalOffset, setGlobalOffset] = useState({ x: 0, y: 0 });
  const [warningMessage, setWarningMessage] = useState('');

  // Trạng thái kéo thả chuột
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load tất cả hình ảnh từ imgSrcs khi mở modal
  useEffect(() => {
    if (!isOpen) return;
    const images = {};
    let loadedCount = 0;
    const keys = Object.keys(imgSrcs).filter((key) => imgSrcs[key]); // Chỉ load các part có URL hợp lệ

    if (keys.length === 0) return;

    keys.forEach((key) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgSrcs[key];
      img.onload = () => {
        images[key] = img;
        loadedCount++;
        if (loadedCount === keys.length) {
          setLoadedImages({ ...images });
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === keys.length) {
          setLoadedImages({ ...images });
        }
      };
    });
  }, [isOpen, imgSrcs]);

  // Vẽ lại Canvas mỗi khi config, ảnh hoặc lựa chọn thay đổi
  useEffect(() => {
    drawCanvas();
    checkBoundaries();
  }, [partsConfig, loadedImages, selectedPart, isLocked, globalZoom, globalOffset]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Logical size: 1000x1000
    canvas.width = 1000;
    canvas.height = 1000;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ nền dạng lưới caro nhẹ hoặc trắng sáng
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sắp xếp các bộ phận theo zIndex để vẽ lớp nào lên trước/sau
    const sortedParts = Object.keys(partsConfig).sort(
      (a, b) => (partsConfig[a].zIndex || 0) - (partsConfig[b].zIndex || 0)
    );

    sortedParts.forEach((key) => {
      const img = loadedImages[key];
      const config = partsConfig[key];
      if (!img) return;

      ctx.save();

      // Áp dụng biến đổi toàn cục (khi locked & zoom/pan cả con pet)
      // dịch chuyển gốc tọa độ (0,0) tới vị trí này
      // giúp toàn con pet di chuyển khi admin di chuột
      ctx.translate(globalOffset.x, globalOffset.y);

      // Dịch chuyển đến vị trí bộ phận + áp dụng zoom global
      const drawX = config.x;
      const drawY = config.y;

      ctx.translate(drawX, drawY);
      // zoom toàn bộ canvas (làm tổng thể cũng thay đổi theo)
      ctx.scale(globalZoom, globalZoom);
      // xoay part (đổi sang đơn vị radian)
      ctx.rotate((config.rotation * Math.PI) / 180);

      // Lấy kích thước gốc của bộ phận và chuẩn hoá
      const clamped = clampPartSize(img.naturalWidth, img.naturalHeight, 800);
      const w = clamped.w;
      const h = clamped.h;

      // Căn chỉnh tâm vẽ dựa theo transformOrigin mô phỏng
      const { ox, oy } = calcOriginOffset(w, h, config.transformOrigin);

      ctx.drawImage(img, -ox, -oy, w * config.scale, h * config.scale);

      // Vẽ khung chữ nhật nhận diện (Bounding box) nếu được chọn hoặc đang mở khóa
      if (!isLocked) {
        ctx.strokeStyle = key === selectedPart ? '#3b82f6' : '#cbd5e1';
        ctx.lineWidth = key === selectedPart ? 3 : 1.5;
        ctx.strokeRect(-ox, -oy, w * config.scale, h * config.scale);

        // Vẽ tên bộ phận nhỏ trên đầu khung
        ctx.fillStyle = key === selectedPart ? '#1d4ed8' : '#64748b';
        ctx.font = '14px sans-serif';
        ctx.fillText(PART_LABELS[key] || key, -ox, -oy - 8);
      }

      ctx.restore();
    });
  };

  // Kiểm tra tràn viền khung canvas 1000x1000
  // Kiểm tra tràn viền chuẩn xác dựa trên kích thước thực tế của part (Bounding Box)
  const checkBoundaries = () => {
    let outOfBounds = [];

    Object.keys(partsConfig).forEach((key) => {
      const config = partsConfig[key];
      const img = loadedImages[key];
      if (!img) return;

      // 1. Tính kích thước thực tế sau khi scale
      const clamped = clampPartSize(img.naturalWidth, img.naturalHeight, 800);
      const finalW = clamped.w * config.scale;
      const finalH = clamped.h * config.scale;

      // 2. Tính toán tâm neo (transformOrigin) y hệt như hàm drawCanvas
      const { ox, oy } = calcOriginOffset(finalW, finalH, config.transformOrigin);

      // 3. Tính tọa độ tuyệt đối của toàn bộ khung chữ nhật chứa bộ phận trên canvas 1000x1000
      // (Bao gồm cả globalOffset nếu đang dịch chuyển cả con pet)
      const absX = config.x + globalOffset.x;
      const absY = config.y + globalOffset.y;

      const minX = absX - ox;
      const maxX = absX - ox + finalW;
      const minY = absY - oy;
      const maxY = absY - oy + finalH;

      // 4. Kiểm tra xem 4 cạnh của part có bị lấn ra ngoài biên [0, 1000] của canvas không
      // (Ngưỡng canvas là từ 0 đến 1000)
      const isOutOfBounds = minX < 0 || maxX > 1000 || minY < 0 || maxY > 1000;

      if (isOutOfBounds) {
        outOfBounds.push(PART_LABELS[key] || key);
      }
    });

    if (outOfBounds.length > 0) {
      setWarningMessage(`⚠️ Cảnh báo: Các bộ phận sau đang bị tràn ra ngoài khung canvas: ${outOfBounds.join(', ')}`);
    } else {
      setWarningMessage('');
    }
  };

  // Kiểm tra sự kiện chuột trên Canvas để kéo thả bộ phận hoặc kéo toàn con pet
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // Chuyển đổi tọa độ client sang tọa độ canvas 1000x1000
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const rawX = (e.clientX - rect.left) * scaleX;
    const rawY = (e.clientY - rect.top) * scaleY;

    setIsDragging(true);
    setDragStart({ x: rawX, y: rawY });

    if (!isLocked) {
      // 💡 QUAN TRỌNG: Khi isLocked = false, hệ thống vẽ có áp dụng globalOffset, 
      // nên tọa độ check click cũng phải quy đổi ngược lại về hệ quy chiếu nội bộ của pet.
      const x = rawX - globalOffset.x;
      const y = rawY - globalOffset.y;

      // Tìm xem click vào bộ phận nào (quét từ lớp trên cùng xuống dưới nhờ .reverse())
      const clickedKey = Object.keys(partsConfig).reverse().find((key) => {
        const conf = partsConfig[key];
        const img = loadedImages[key];
        if (!img) return false;

        // Tính kích thước sau khi scale (đồng bộ giới hạn MAX_PART_SIZE như hàm vẽ)
        const clamped = clampPartSize(img.naturalWidth, img.naturalHeight, 800);
        const finalW = clamped.w * conf.scale;
        const finalH = clamped.h * conf.scale;

        // Xác định tâm neo
        const { ox, oy } = calcOriginOffset(finalW, finalH, conf.transformOrigin);

        // Xác định bounding box chuẩn xác theo tâm neo đã tính
        const minX = conf.x - ox;
        const maxX = conf.x - ox + finalW;
        const minY = conf.y - oy;
        const maxY = conf.y - oy + finalH;

        return x >= minX && x <= maxX && y >= minY && y <= maxY;
      });

      if (clickedKey) {
        setSelectedPart(clickedKey);
      }
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
      // Kéo dịch toàn con pet
      setGlobalOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (selectedPart) {
      // Kéo dịch riêng bộ phận đang chọn
      setPartsConfig((prev) => ({
        ...prev,
        [selectedPart]: {
          ...prev[selectedPart],
          x: prev[selectedPart].x + dx,
          y: prev[selectedPart].y + dy,
        },
      }));
    }

    setDragStart({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Cập nhật thông số của bộ phận đang chọn từ bảng điều khiển bên phải
  const handleParamChange = (field, value) => {
    if (!selectedPart) return;
    setPartsConfig((prev) => ({
      ...prev,
      [selectedPart]: {
        ...prev[selectedPart],
        [field]: Number(value) || value,
      },
    }));
  };

  const handleSave = () => {
    // 🛠️ Bổ sung thêm url cho từng part dựa trên imgSrcs ban đầu truyền vào
    const enrichedLayers = {};
    Object.keys(partsConfig).forEach((key) => {
      enrichedLayers[key] = {
        ...partsConfig[key],
        url: imgSrcs[key] || partsConfig[key].url || '', // Gắn trực tiếp url ảnh vào đây
      };
    });

    onConfirm({
      layers: enrichedLayers,
      globalZoom,
      globalOffset,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3>🎨 Trình chỉnh sửa lắp ráp Rigging 2D (Visual Rigging Editor)</h3>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${styles.btnLock} ${isLocked ? styles.locked : ''}`}
              onClick={() => setIsLocked(!isLocked)}
            >
              {isLocked ? '🔒 Đã khóa bộ phận (Đang dịch chuyển cả con)' : '🔓 Đang mở khóa (Chỉnh từng bộ phận)'}
            </button>
            <button type="button" onClick={onClose} className={styles.btnClose}>×</button>
          </div>
        </div>

        {warningMessage && <div className={styles.warningBanner}>{warningMessage}</div>}

        {/* Layout 2 cột: 3/5 và 2/5 */}
        <div className={styles.modalBody}>
          {/* Cột trái (3/5): Canvas Workspace */}
          <div className={styles.canvasColumn}>
            <div className={styles.canvasToolbar}>
              <span>💡 Mẹo: Click chọn bộ phận trên khung hoặc danh sách để tinh chỉnh. Kéo thả chuột để dịch chuyển.</span>
              <div className={styles.zoomControl}>
                <label>Zoom toàn cục:</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={globalZoom}
                  onChange={(e) => setGlobalZoom(parseFloat(e.target.value))}
                />
                <span>{globalZoom.toFixed(1)}x</span>
              </div>
            </div>

            <div className={styles.canvasWrapper}>
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className={styles.rigCanvas}
              />
            </div>
          </div>

          {/* Cột phải (2/5): Danh sách bộ phận hoặc Bảng thông số (Inspector) */}
          <div className={styles.sidebarColumn}>
            {selectedPart && !isLocked ? (
              <div className={styles.inspectorPanel}>
                <div className={styles.inspectorHeader}>
                  <h4>⚙️ Tùy chỉnh: {PART_LABELS[selectedPart]}</h4>
                  <button
                    type="button"
                    className={styles.btnBackToList}
                    onClick={() => setSelectedPart(null)}
                  >
                    ⬅ Về danh sách
                  </button>
                </div>

                <div className={styles.formGroup}>
                  <label>Tọa độ X:</label>
                  <input
                    type="number"
                    value={Math.round(partsConfig[selectedPart]?.x || 0)}
                    onChange={(e) => handleParamChange('x', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tọa độ Y:</label>
                  <input
                    type="number"
                    value={Math.round(partsConfig[selectedPart]?.y || 0)}
                    onChange={(e) => handleParamChange('y', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Độ phóng đại (Scale):</label>
                  <input
                    type="range"
                    min="0.2"
                    max="3"
                    step="0.05"
                    value={partsConfig[selectedPart]?.scale || 1}
                    onChange={(e) => handleParamChange('scale', e.target.value)}
                  />
                  <span>{partsConfig[selectedPart]?.scale}</span>
                </div>

                <div className={styles.formGroup}>
                  <label>Góc xoay (Rotation):</label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={partsConfig[selectedPart]?.rotation || 0}
                    onChange={(e) => handleParamChange('rotation', e.target.value)}
                  />
                  <span>{partsConfig[selectedPart]?.rotation}°</span>
                </div>

                <div className={styles.formGroup}>
                  <label>Thứ tự lớp (zIndex):</label>
                  <input
                    type="number"
                    value={partsConfig[selectedPart]?.zIndex || 0}
                    onChange={(e) => handleParamChange('zIndex', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tâm xoay (Transform Origin):</label>
                  <select
                    value={partsConfig[selectedPart]?.transformOrigin || 'center'}
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
              <div className={styles.partsListPanel}>
                <h4>📋 Danh sách các bộ phận Rigging</h4>
                <p className={styles.listDesc}>
                  {isLocked
                    ? 'Đang khóa chỉnh sửa từng phần. Bạn có thể kéo toàn bộ khung canvas để dịch chuyển tổng thể.'
                    : 'Click vào tên bộ phận dưới đây hoặc click trực tiếp vào ảnh trên khung canvas để chỉnh sửa thông số.'}
                </p>

                <div className={styles.partsList}>
                  {Object.keys(partsConfig).map((key) => (
                    <div
                      key={key}
                      className={`${styles.partItem} ${selectedPart === key ? styles.active : ''}`}
                      onClick={() => !isLocked && setSelectedPart(key)}
                    >
                      <span className={styles.partDot} style={{ opacity: loadedImages[key] ? 1 : 0.4 }}>🟢</span>
                      <span className={styles.partName}>{PART_LABELS[key] || key}</span>
                      <span className={styles.partCoords}>
                        (X: {Math.round(partsConfig[key].x)}, Y: {Math.round(partsConfig[key].y)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.btnCancel}>Hủy bỏ</button>
          <button type="button" onClick={handleSave} className={styles.btnSave}>💾 Lưu cấu hình Template</button>
        </div>
      </div>
    </div>
  );
}

export default PetRigEditorModal;