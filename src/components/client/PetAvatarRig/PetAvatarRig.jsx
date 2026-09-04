import React, { useEffect, useRef, useState } from 'react';
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

  // 3. Xử lý tương tác Click tổng thể lên Stage
  const handleStageClick = () => {
    // Chỉ nhận click khi đang ở trạng thái nghỉ
    if (animationState !== 'idle') return;

    // Lưu lại thời điểm bắt đầu
    animStartTimeRef.current = Date.now() / 1000;

    // Phân chia ngẫu nhiên hiệu ứng click (hoặc ưu tiên đầu/thân tùy logic bạn muốn)
    const isHeadTarget = Math.random() > 0.5;
    if (isHeadTarget) {
      setAnimationState('clicked');
    } else {
      setAnimationState('talking');
    }
  };

  return (
    <div className={styles['pet-container']}>
      {/* Khung chứa Canvas render modular 6+ part */}
      <div className={styles['pet-stage']} onClick={handleStageClick}>
        <canvas ref={canvasRef} className={styles['pet-canvas']} />
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