import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getPartAnimationOffsets, clampPartSize, calcOriginOffset, MAX_REACTION_DURATION } from '../../../utils/petAnimations';

/**
 * Render một bộ phận duy nhất lên canvas của riêng nó.
 * Canvas này được đặt absolute trong roomScene với z-index riêng,
 * cho phép cạnh tranh z-index với các item khác trong phòng.
 */
function PartCanvas({ partKey, conf, globalZoom, globalOffset, animationState, type, onLoad, containerStyle }) {
  const canvasRef = useRef(null);
  const [loadedImage, setLoadedImage] = useState(null);
  const animStartTimeRef = useRef(0);

  useEffect(() => {
    if (!conf?.url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = conf.url;
    img.onload = () => {
      setLoadedImage(img);
      onLoad && onLoad(partKey, img);
    };
    img.onerror = () => {
      onLoad && onLoad(partKey, null);
    };
  }, [conf?.url]);

  useEffect(() => {
    if (!loadedImage || !conf) return;
    let animationFrameId;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      canvas.width = 1000;
      canvas.height = 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = Date.now() / 1000;
      let elapsed = 0;
      if (animationState !== 'idle') {
        elapsed = now - animStartTimeRef.current;
      }

      ctx.save();
      ctx.translate(globalOffset.x, globalOffset.y);
      ctx.translate(conf.x, conf.y);
      ctx.scale(globalZoom, globalZoom);

      const baseKey = partKey.replace(/[0-9]/g, '');
      const animStateName = animationState === 'clicked' ? 'headClick'
        : animationState === 'talking' ? 'bodyClick'
        : 'idle';
      const animOffsets = getPartAnimationOffsets(baseKey, animStateName, now, elapsed, type);

      ctx.translate(0, animOffsets.translateY);
      ctx.rotate(((conf.rotation || 0) + animOffsets.rotation) * Math.PI / 180);

      const clamped = clampPartSize(loadedImage.naturalWidth, loadedImage.naturalHeight, 800);
      const finalW = clamped.w * (conf.scale || 1) * animOffsets.scaleMultiplier;
      const finalH = clamped.h * (conf.scale || 1) * animOffsets.scaleMultiplier;
      const { ox, oy } = calcOriginOffset(clamped.w, clamped.h, conf.transformOrigin);

      ctx.drawImage(loadedImage, -ox, -oy, finalW, finalH);
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [loadedImage, conf, globalZoom, globalOffset, animationState, type, partKey]);

  if (!conf?.url) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        ...containerStyle,
        zIndex: conf.zIndex ?? 0,
        pointerEvents: 'none',
      }}
    />
  );
}

/**
 * Phiên bản "layered" của PetAvatarRig:
 * Mỗi bộ phận được render lên canvas riêng, đặt absolute trong roomScene.
 * z-index của từng bộ phận có thể cạnh tranh trực tiếp với DOM items.
 *
 * Props:
 *   - type: 'cat' | 'dog'
 *   - layers: object chứa config từng bộ phận (x, y, scale, rotation, zIndex, url, ...)
 *   - globalZoom: number
 *   - globalOffset: { x, y }
 *   - containerStyle: style áp dụng cho mỗi canvas (thường là position:absolute, inset:0, width/height)
 *   - onPetClick: callback khi click vào pet
 */
export const PetAvatarRigLayered = ({
  type,
  layers,
  globalZoom = 1,
  globalOffset = { x: 0, y: 0 },
  containerStyle = {},
  onPetClick,
}) => {
  const [animationState, setAnimationState] = useState('idle');
  const animStartTimeRef = useRef(0);
  const [loadedImages, setLoadedImages] = useState({});

  const handlePartLoad = useCallback((key, img) => {
    if (img) {
      setLoadedImages(prev => ({ ...prev, [key]: img }));
    }
  }, []);

  // Hit detection: click trên bất kỳ canvas bộ phận nào sẽ được xử lý qua overlay trong-suốt
  const handleOverlayClick = useCallback((e) => {
    if (animationState !== 'idle') return;
    if (!layers) return;

    // Tìm bộ phận được click theo z-index cao nhất có pixel không trong suốt
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = 1000 / rect.width;
    const scaleY = 1000 / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Sắp xếp từ zIndex cao → thấp
    const sortedKeys = Object.keys(layers).sort(
      (a, b) => (layers[b].zIndex || 0) - (layers[a].zIndex || 0)
    );

    const hitCanvas = document.createElement('canvas');
    hitCanvas.width = 1000;
    hitCanvas.height = 1000;
    const hitCtx = hitCanvas.getContext('2d', { willReadFrequently: true });
    const now = Date.now() / 1000;

    let clickedPart = null;
    for (const key of sortedKeys) {
      const conf = layers[key];
      const img = loadedImages[key];
      if (!img) continue;

      hitCtx.clearRect(0, 0, 1000, 1000);
      hitCtx.save();
      hitCtx.translate(globalOffset.x, globalOffset.y);
      hitCtx.translate(conf.x, conf.y);
      hitCtx.scale(globalZoom, globalZoom);

      const baseKey = key.replace(/[0-9]/g, '');
      const animOffsets = getPartAnimationOffsets(baseKey, 'idle', now, 0, type);
      hitCtx.translate(0, animOffsets.translateY);
      hitCtx.rotate(((conf.rotation || 0) + animOffsets.rotation) * Math.PI / 180);

      const clamped = clampPartSize(img.naturalWidth, img.naturalHeight, 800);
      const finalW = clamped.w * (conf.scale || 1) * animOffsets.scaleMultiplier;
      const finalH = clamped.h * (conf.scale || 1) * animOffsets.scaleMultiplier;
      const { ox, oy } = calcOriginOffset(clamped.w, clamped.h, conf.transformOrigin);
      hitCtx.drawImage(img, -ox, -oy, finalW, finalH);
      hitCtx.restore();

      try {
        const pixel = hitCtx.getImageData(clickX, clickY, 1, 1).data;
        if (pixel[3] > 10) {
          clickedPart = key;
          break;
        }
      } catch (err) {
        // CORS - bỏ qua
      }
    }

    if (!clickedPart) return;

    animStartTimeRef.current = Date.now() / 1000;
    if (clickedPart.includes('head')) {
      setAnimationState('clicked');
    } else {
      setAnimationState('talking');
    }

    onPetClick && onPetClick(clickedPart);

    // Tự reset về idle sau MAX_REACTION_DURATION
    setTimeout(() => setAnimationState('idle'), MAX_REACTION_DURATION * 1000);
  }, [animationState, layers, loadedImages, globalOffset, globalZoom, type, onPetClick]);

  if (!layers) return null;

  const partKeys = Object.keys(layers).filter(k => layers[k]?.url);

  const baseContainerStyle = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    ...containerStyle,
  };

  return (
    <>
      {partKeys.map((key) => (
        <PartCanvas
          key={key}
          partKey={key}
          conf={layers[key]}
          globalZoom={globalZoom}
          globalOffset={globalOffset}
          animationState={animationState}
          type={type}
          onLoad={handlePartLoad}
          containerStyle={{ ...baseContainerStyle, position: 'absolute' }}
        />
      ))}

      {/* Overlay trong suốt để bắt click, nằm trên cùng */}
      <div
        style={{
          ...baseContainerStyle,
          zIndex: 9999,
          cursor: 'pointer',
          background: 'transparent',
        }}
        onClick={handleOverlayClick}
      />
    </>
  );
};
