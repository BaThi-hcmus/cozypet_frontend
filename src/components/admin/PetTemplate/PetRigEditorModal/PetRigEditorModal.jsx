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
  // kiểm tra xem ảnh có vượt ngoài khung canvas không
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

    // áp dụng các biến đổi toàn cục
    ctx.save();
    ctx.translate(globalOffset.x, globalOffset.y); // Dịch chuyển cả con pet khi kéo chuột
    ctx.scale(globalZoom, globalZoom); // Zoom toàn bộ canvas/con pet

    // Sắp xếp các bộ phận theo zIndex để vẽ lớp nào lên trước/sau
    const sortedParts = Object.keys(partsConfig).sort(
      (a, b) => (partsConfig[a].zIndex || 0) - (partsConfig[b].zIndex || 0)
    );

    // vẽ từng bộ phận
    sortedParts.forEach((key) => {
      const img = loadedImages[key];
      const config = partsConfig[key];
      if (!img) return;

      ctx.save();

      // Dịch chuyển đến vị trí bộ phận + áp dụng zoom global
      const drawX = config.x;
      const drawY = config.y;
      ctx.translate(drawX, drawY);

      // xoay part (đổi sang đơn vị radian)
      ctx.rotate((config.rotation * Math.PI) / 180);

      // Lấy kích thước gốc của bộ phận và chuẩn hoá, mỗi bộ phận tối đa 800px
      const clamped = clampPartSize(img.naturalWidth, img.naturalHeight, 800);
      const w = clamped.w;
      const h = clamped.h;

      // Căn chỉnh tâm vẽ dựa theo transformOrigin mô phỏng (dùng để rotate)
      const { ox, oy } = calcOriginOffset(w, h, config.transformOrigin);

      // vẽ theo rotate và chiều cao/ chiều rộng (đã scale)
      ctx.drawImage(img, -ox, -oy, w * config.scale, h * config.scale);

      // Vẽ khung chữ nhật nhận diện (Bounding box) nếu được chọn hoặc đang mở khóa
      if (!isLocked) {
        ctx.strokeStyle = key === selectedPart ? '#3b82f6' : '#cbd5e1'; // màu
        ctx.lineWidth = key === selectedPart ? 3 : 1.5; // độ đậm của nét vẽ
        ctx.strokeRect(-ox, -oy, w * config.scale, h * config.scale); // vẽ mép khung chữ nhật (có rotate)

        // Vẽ tên bộ phận nhỏ trên đầu khung
        ctx.fillStyle = key === selectedPart ? '#1d4ed8' : '#64748b';
        ctx.font = '14px sans-serif';
        ctx.fillText(PART_LABELS[key] || key, -ox, -oy - 8);
      }

      ctx.restore();
    });
    ctx.restore();
  };

  // Kiểm tra tràn viền khung canvas 1000x1000
  // Kiểm tra tràn viền chuẩn xác dựa trên kích thước thực tế của part (Bounding Box)
  const checkBoundaries = () => {
    let outOfBounds = [];

    Object.keys(partsConfig).forEach((key) => {
      const config = partsConfig[key];
      const img = loadedImages[key];
      if (!img) return;

      // Tính kích thước thực tế sau khi scale
      const clamped = clampPartSize(img.naturalWidth, img.naturalHeight, 800);
      const finalW = clamped.w * config.scale;
      const finalH = clamped.h * config.scale;

      // Lấy khoảng cách từ điểm neo đến các mép của ảnh gốc
      const { ox, oy } = calcOriginOffset(finalW, finalH, config.transformOrigin);

      // Tọa độ tuyệt đối của điểm neo trên canvas 1000x1000
      const absX = config.x + globalOffset.x;
      const absY = config.y + globalOffset.y;

      // góc của hình chữ nhật tính tương đối so với điểm neo (ox, oy)
      // Góc trái-trên, phải-trên, trái-dưới, phải-dưới
      // xét trong hệ qui chiếu tấm ảnh với góc tọa độ (0,0) là điểm neo
      const localCorners = [
        { x: -ox, y: -oy },                    // Top-Left
        { x: -ox + finalW, y: -oy },          // Top-Right
        { x: -ox, y: -oy + finalH },          // Bottom-Left
        { x: -ox + finalW, y: -oy + finalH }  // Bottom-Right
      ];

      // Đổi góc rotation sang Radian
      const rad = (config.rotation * Math.PI) / 180;
      // tính cos và sin ứng với rotation hiện tại
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;

      // Xoay từng góc và dịch chuyển về tọa độ canvas để tìm biên min/max thực tế
      localCorners.forEach(corner => {
        // Công thức xoay 2D quanh điểm neo (0,0)
        const rx = corner.x * cos - corner.y * sin;
        const ry = corner.x * sin + corner.y * cos;

        // Cộng thêm vị trí tuyệt đối trên canvas
        const canvasX = absX + rx;
        const canvasY = absY + ry;

        // lấy bouding box bao quanh 4 góc
        if (canvasX < minX) minX = canvasX;
        if (canvasX > maxX) maxX = canvasX;
        if (canvasY < minY) minY = canvasY;
        if (canvasY > maxY) maxY = canvasY;
      });

      // Kiểm tra xem 4 biên thực tế có bị lấn ra ngoài [0, 1000] của canvas không
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
  // const handleMouseDown = (e) => {
  //   const canvas = canvasRef.current;
  //   if (!canvas) return;
  //   // lấy thông tin khung canvas hiển thị trên UI (trong hệ quy chiếu viewport)
  //   const rect = canvas.getBoundingClientRect();

  //   // Chuyển đổi tọa độ client sang tọa độ canvas 1000x1000
  //   const scaleX = canvas.width / rect.width;
  //   const scaleY = canvas.height / rect.height;
  //   // tọa độ click xét trong hệ quy chiếu pet
  //   const rawX = (e.clientX - rect.left) * scaleX;
  //   const rawY = (e.clientY - rect.top) * scaleY;

  //   setIsDragging(true);
  //   setDragStart({ x: rawX, y: rawY }); // tọa độ trong khung canvas 1000x1000

  //   if (!isLocked) {
  //     // Khi isLocked = false, hệ thống vẽ có áp dụng globalOffset, 
  //     // nên tọa độ check click cũng phải quy đổi ngược lại về hệ quy chiếu nội bộ của pet.
  //     const x = rawX - globalOffset.x;
  //     const y = rawY - globalOffset.y;

  //     // Tìm xem click vào bộ phận nào (quét từ lớp trên cùng xuống dưới nhờ .reverse())
  //     const clickedKey = Object.keys(partsConfig).reverse().find((key) => {
  //       const conf = partsConfig[key];
  //       const img = loadedImages[key];
  //       if (!img) return false;

  //       // Tính kích thước sau khi scale (đồng bộ giới hạn MAX_PART_SIZE như hàm vẽ)
  //       const clamped = clampPartSize(img.naturalWidth, img.naturalHeight, 800);
  //       const finalW = clamped.w * conf.scale;
  //       const finalH = clamped.h * conf.scale;

  //       // Xác định tâm neo
  //       const { ox, oy } = calcOriginOffset(finalW, finalH, conf.transformOrigin);

  //       // Xác định bounding box chuẩn xác theo tâm neo đã tính
  //       const minX = conf.x - ox;
  //       const maxX = conf.x - ox + finalW;
  //       const minY = conf.y - oy;
  //       const maxY = conf.y - oy + finalH;

  //       return x >= minX && x <= maxX && y >= minY && y <= maxY;
  //     });

  //     if (clickedKey) {
  //       setSelectedPart(clickedKey);
  //     }
  //   }
  // };

  // lưu tọa độ click chuột và kiểm tra xem có click vào part nào không
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
      const x = rawX - globalOffset.x;
      const y = rawY - globalOffset.y;

      // Tìm xem click vào bộ phận nào (ưu tiên lớp trên cùng trước)
      const sortedKeys = Object.keys(partsConfig).sort(
        (a, b) => (partsConfig[b].zIndex || 0) - (partsConfig[a].zIndex || 0)
      );

      let clickedKey = null;
      let hitCanvas = null;
      let hitCtx = null;

      for (const key of sortedKeys) {
        const conf = partsConfig[key];
        const img = loadedImages[key];
        if (!img) continue;

        const clamped = clampPartSize(img.naturalWidth, img.naturalHeight, 800);
        const finalW = clamped.w * conf.scale;
        const finalH = clamped.h * conf.scale;
        const { ox, oy } = calcOriginOffset(finalW, finalH, conf.transformOrigin);

        // --- BƯỚC 1: TÍNH TOÁN HIT TEST BOUNDING BOX (nhanh & an toàn) ---
        const absX = conf.x;
        const absY = conf.y;

        const localCorners = [
          { x: -ox, y: -oy },
          { x: -ox + finalW, y: -oy },
          { x: -ox, y: -oy + finalH },
          { x: -ox + finalW, y: -oy + finalH }
        ];

        const rad = (conf.rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        localCorners.forEach(corner => {
          const rx = corner.x * cos - corner.y * sin;
          const ry = corner.x * sin + corner.y * cos;
          const cornerX = absX + rx;
          const cornerY = absY + ry;
          if (cornerX < minX) minX = cornerX;
          if (cornerX > maxX) maxX = cornerX;
          if (cornerY < minY) minY = cornerY;
          if (cornerY > maxY) maxY = cornerY;
        });

        const inBox = x >= minX && x <= maxX && y >= minY && y <= maxY;
        if (!inBox) continue; // Bỏ qua ngay nếu không nằm trong Box

        // --- BƯỚC 2: PIXEL-PERFECT TEST (chính xác) ---
        if (!hitCanvas) {
          hitCanvas = document.createElement('canvas');
          hitCanvas.width = canvas.width;
          hitCanvas.height = canvas.height;
          hitCtx = hitCanvas.getContext('2d', { willReadFrequently: true });
        } else {
          hitCtx.clearRect(0, 0, hitCanvas.width, hitCanvas.height);
        }

        hitCtx.save();
        hitCtx.translate(globalOffset.x, globalOffset.y);
        hitCtx.translate(conf.x, conf.y);
        hitCtx.scale(globalZoom, globalZoom);
        hitCtx.rotate((conf.rotation * Math.PI) / 180);

        hitCtx.drawImage(img, -ox, -oy, clamped.w * conf.scale, clamped.h * conf.scale);
        hitCtx.restore();

        try {
          const pixel = hitCtx.getImageData(rawX, rawY, 1, 1).data;
          // Kiểm tra kênh Alpha (độ mờ), > 10 là click trúng phần nhìn thấy
          if (pixel[3] > 10) {
            clickedKey = key;
            break;
          }
        } catch (err) {
          // Bị lỗi CORS (trình duyệt chặn đọc pixel từ ảnh cross-origin)
          // -> Chấp nhận luôn hit bằng Bounding Box
          clickedKey = key;
          break;
        }
      }

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
    // Bổ sung thêm url cho từng part dựa trên imgSrcs ban đầu truyền vào
    const enrichedLayers = {};
    Object.keys(partsConfig).forEach((key) => {
      enrichedLayers[key] = {
        ...partsConfig[key],
        url: imgSrcs[key] || partsConfig[key].url || '', // Gắn trực tiếp url ảnh
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
              {warningMessage && <div className={styles.warningBanner}>{warningMessage}</div>}
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