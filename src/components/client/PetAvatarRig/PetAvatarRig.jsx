import React, { useEffect, useRef, useState, useMemo } from 'react';
import styles from './PetAvatarRig.module.css';
import { getPartAnimationOffsets, clampPartSize, calcOriginOffset, MAX_REACTION_DURATION } from '../../../utils/petAnimations';

export const PetAvatarRig = ({ type, layers, globalZoom = 1, globalOffset = { x: 0, y: 0 }, name }) => {
  const canvasRef = useRef(null);
  const [animationState, setAnimationState] = useState('idle');
  const animStartTimeRef = useRef(0);
  const [loadedImages, setLoadedImages] = useState({});

  // 1. Tải trước toàn bộ hình ảnh của các layers để vẽ lên Canvas
  useEffect(() => {
    if (!layers) return;
    const images = {};
    const keys = Object.keys(layers);

    // Chỉ đếm các part thực sự có URL hợp lệ để so sánh
    const validKeys = keys.filter((key) => layers[key] && layers[key].url);
    if (validKeys.length === 0) return;

    let loadedCount = 0;

    validKeys.forEach((key) => {
      const part = layers[key];

      const img = new Image();
      img.crossOrigin = 'anonymous'; // Hỗ trợ load ảnh từ Cloudinary / cross-origin
      img.src = part.url;
      img.onload = () => {
        images[key] = img;
        loadedCount++;
        // Khi tất cả ảnh có URL hợp lệ đã load xong thì kích hoạt vẽ lại
        if (loadedCount === validKeys.length) {
          setLoadedImages({ ...images });
        }
      };
      img.onerror = () => {
        // Nếu ảnh lỗi vẫn đếm để không bị treo vĩnh viễn
        loadedCount++;
        if (loadedCount === validKeys.length) {
          setLoadedImages({ ...images });
        }
      };
    });
  }, [layers]);

  // 2. Vòng lặp Render Canvas với hiệu ứng Animation thời gian thực
  useEffect(() => {
    let animationFrameId;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // Khung tọa độ chuẩn 1000x1000
      canvas.width = 1000;
      canvas.height = 1000;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!layers) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const now = Date.now() / 1000; // Thời gian tuyệt đối (giây)
      let elapsed = 0; // Thời gian từ lúc bắt đầu state hiện tại (nếu đang tương tác)
      
      if (animationState !== 'idle') {
        elapsed = now - animStartTimeRef.current;
        
        // Tự động kết thúc animation state khi đã vượt qua thời gian tối đa
        if (elapsed > MAX_REACTION_DURATION) {
           setAnimationState('idle');
        }
      }

      // Sắp xếp các part theo zIndex từ thấp lên cao
      const sortedKeys = Object.keys(layers).sort(
        (a, b) => (layers[a].zIndex || 0) - (layers[b].zIndex || 0)
      );

      sortedKeys.forEach((key) => {
        const conf = layers[key];
        const img = loadedImages[key];
        if (!img) return;

        ctx.save();

        // Áp dụng Global Zoom & Offset của toàn bộ con pet
        ctx.translate(globalOffset.x, globalOffset.y);
        ctx.translate(conf.x, conf.y);
        ctx.scale(globalZoom, globalZoom);

        // --- TÍCH HỢP HIỆU ỨNG ANIMATION MƯỢT MÀ TỪ petAnimations.js ---
        // key.replace(/\d+$/, '') giúp map 'head2' -> 'head', 'leftArm' -> 'leftArm'
        const baseKey = key.replace(/[0-9]/g, '');
        const animStateName = animationState === 'clicked' ? 'headClick' : (animationState === 'talking' ? 'bodyClick' : 'idle');
        const animOffsets = getPartAnimationOffsets(baseKey, animStateName, now, elapsed, type);

        const currentRotation = (conf.rotation || 0) + animOffsets.rotation;
        const currentTranslateY = animOffsets.translateY;
        const scaleMultiplier = animOffsets.scaleMultiplier;

        ctx.translate(0, currentTranslateY);
        ctx.rotate((currentRotation * Math.PI) / 180);

        // Kích thước gốc và scale, dùng chung hàm clampPartSize
        const clamped = clampPartSize(img.naturalWidth, img.naturalHeight, 800);
        const w = clamped.w;
        const h = clamped.h;

        const finalW = w * (conf.scale || 1) * scaleMultiplier;
        const finalH = h * (conf.scale || 1) * scaleMultiplier;

        // Xác định tâm neo (transformOrigin) — Dùng hàm calcOriginOffset tính từ kích thước gốc w, h 
        // để đồng bộ 100% với RigEditorModal
        const { ox, oy } = calcOriginOffset(w, h, conf.transformOrigin);

        // Vẽ ảnh — tỷ lệ thay đổi (finalW/finalH) nhưng tâm xoay giữ nguyên
        ctx.drawImage(img, -ox, -oy, finalW, finalH);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [layers, loadedImages, animationState, globalZoom, globalOffset, type]);

  // 3. Xử lý tương tác Click tổng thể lên Stage (Per-Part Pixel-Perfect Hit Detection)
  const handleCanvasClick = (e) => {
    // Chỉ nhận click khi đang ở trạng thái nghỉ
    if (animationState !== 'idle') return;

    const canvas = canvasRef.current;
    if (!canvas || !layers) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Tọa độ click trên hệ quy chiếu 1000x1000 của canvas
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Tạo một canvas ảo (offscreen) để test va chạm cho TỪNG BỘ PHẬN
    const hitCanvas = document.createElement('canvas');
    hitCanvas.width = canvas.width;
    hitCanvas.height = canvas.height;
    const hitCtx = hitCanvas.getContext('2d', { willReadFrequently: true });

    // Sắp xếp các part theo zIndex từ CAO xuống THẤP (bộ phận nằm trên check trước)
    const sortedKeys = Object.keys(layers).sort(
      (a, b) => (layers[b].zIndex || 0) - (layers[a].zIndex || 0)
    );

    let clickedPart = null;
    const now = Date.now() / 1000;

    for (const key of sortedKeys) {
      const conf = layers[key];
      const img = loadedImages[key];
      if (!img) continue;

      // Xóa canvas ảo để vẽ thử bộ phận này
      hitCtx.clearRect(0, 0, hitCanvas.width, hitCanvas.height);
      hitCtx.save();

      // Áp dụng lại ĐÚNG các phép biến đổi như lúc vẽ thật
      hitCtx.translate(globalOffset.x, globalOffset.y);
      hitCtx.translate(conf.x, conf.y);
      hitCtx.scale(globalZoom, globalZoom);

      const baseKey = key.replace(/[0-9]/g, '');
      const animOffsets = getPartAnimationOffsets(baseKey, 'idle', now, 0, type);

      const currentRotation = (conf.rotation || 0) + animOffsets.rotation;
      const currentTranslateY = animOffsets.translateY;
      const scaleMultiplier = animOffsets.scaleMultiplier;

      hitCtx.translate(0, currentTranslateY);
      hitCtx.rotate((currentRotation * Math.PI) / 180);

      const clamped = clampPartSize(img.naturalWidth, img.naturalHeight, 800);
      const w = clamped.w;
      const h = clamped.h;

      const finalW = w * (conf.scale || 1) * scaleMultiplier;
      const finalH = h * (conf.scale || 1) * scaleMultiplier;

      const { ox, oy } = calcOriginOffset(w, h, conf.transformOrigin);

      hitCtx.drawImage(img, -ox, -oy, finalW, finalH);
      hitCtx.restore();

      try {
        // Đọc 1 pixel ngay tại vị trí click trên bộ phận này
        const pixel = hitCtx.getImageData(clickX, clickY, 1, 1).data;
        if (pixel[3] > 10) {
          clickedPart = key; // Tìm thấy bộ phận đầu tiên không trong suốt
          break; // Thoát vòng lặp ngay
        }
      } catch (err) {
        console.warn("Lỗi đọc pixel (CORS)", err);
      }
    }

    // Nếu không click trúng part nào (chỉ trúng không khí)
    if (!clickedPart) return; 

    // Nếu lọt qua được đây tức là đã click trúng thú cưng!
    animStartTimeRef.current = Date.now() / 1000;

    // Kích hoạt hoạt ảnh tùy thuộc vào BỘ PHẬN NÀO bị click
    if (clickedPart.includes('head')) {
      setAnimationState('clicked');
    } else {
      setAnimationState('talking');
    }
  };

  return (
    <div className={styles['pet-container']}>
      {/* Khung chứa Canvas render modular 6+ part */}
      <div className={styles['pet-stage']}>
        <canvas 
          ref={canvasRef} 
          className={styles['pet-canvas']} 
          onClick={handleCanvasClick}
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        />
      </div>

      {/* --- PHẦN HIỂN THỊ THÔNG TIN & HỘI THOẠI (UI DIALOGUE) --- */}
      <div className={styles['pet-info']}>
        <h3 className={styles['pet-name']}>{name}</h3>
        <p className={styles['pet-dialogue']}>
          {animationState === 'clicked' && (type === 'cat' ? "Meo! Đừng chọc vào đầu tớ!" : "Gâu! Đau đầu quá nhả ra đi!")}
          {animationState === 'talking' && "Đói bụng quá sen ơi, cho xin miếng bánh đi!"}
          {animationState === 'idle' && "Đang ngoan ngoãn chờ chơi cùng bạn..."}
        </p>
      </div>
    </div>
  );
};