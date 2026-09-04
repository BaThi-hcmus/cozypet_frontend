import React, { useState, useRef, useEffect } from 'react';
import styles from './PetPartCropperModal.module.css';

function PetPartCropperModal({ isOpen, onClose, imgSrc, onConfirm }) {
  const [step, setStep] = useState('head'); // 'head' hoặc 'body'
  const [headBox, setHeadBox] = useState(null);
  const [bodyBox, setBodyBox] = useState(null);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState(null);

  const imageObjRef = useRef(null);

  useEffect(() => {
    if (isOpen && imgSrc) {
      setStep('head');
      setHeadBox(null);
      setBodyBox(null);
      setCurrentBox(null);

      const img = new Image();
      img.src = imgSrc;
      img.onload = () => {
        imageObjRef.current = img;
        drawCanvas(null);
      };
    }
  }, [isOpen, imgSrc]);

  const drawCanvas = (activeBox) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObjRef.current) return;
    const ctx = canvas.getContext('2d');
    const img = imageObjRef.current;

    canvas.width = 500;
    canvas.height = 500;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Vẽ ảnh gốc vừa khít canvas 500x500
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Vẽ lớp phủ tối bên ngoài vùng chọn để làm nổi bật khung cắt
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vẽ lại phần ảnh bên trong khung chọn cho sáng rõ
    const box = activeBox || (step === 'head' ? headBox : bodyBox);
    if (box) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(box.x, box.y, box.width, box.height);
      ctx.clip();
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Viền khung chữ nhật hướng dẫn (Xanh dương cho đầu, Xanh lá cho thân)
      ctx.strokeStyle = step === 'head' ? '#3b82f6' : '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    }
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = currentX - startPos.x;
    const height = currentY - startPos.y;

    const newBox = {
      x: width < 0 ? currentX : startPos.x,
      y: height < 0 ? currentY : startPos.y,
      width: Math.abs(width),
      height: Math.abs(height),
    };

    setCurrentBox(newBox);
    drawCanvas(newBox);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentBox && currentBox.width > 20 && currentBox.height > 20) {
      if (step === 'head') {
        setHeadBox(currentBox);
      } else {
        setBodyBox(currentBox);
      }
    }
    setCurrentBox(null);
  };

  const handleNextStep = () => {
    if (step === 'head') {
      if (!headBox) {
        alert('Vui lòng kéo khung bao lấy phần đầu pet!');
        return;
      }
      setStep('body');
      drawCanvas(bodyBox);
    } else {
      if (!bodyBox) {
        alert('Vui lòng kéo khung bao lấy phần thân pet!');
        return;
      }
      processCropAndFinish();
    }
  };

  const processCropAndFinish = () => {
    const img = imageObjRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const cropPartToBlob = (box) => {
      return new Promise((resolve) => {
        canvas.width = box.width;
        canvas.height = box.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const scaleX = img.naturalWidth / 500;
        const scaleY = img.naturalHeight / 500;

        ctx.drawImage(
          img,
          box.x * scaleX,
          box.y * scaleY,
          box.width * scaleX,
          box.height * scaleY,
          0,
          0,
          box.width,
          box.height
        );

        canvas.toBlob((blob) => {
          const file = new File([blob], `${step}_part.png`, { type: 'image/png' });
          const previewUrl = URL.createObjectURL(blob);
          resolve({ file, previewUrl });
        }, 'image/png');
      });
    };

    Promise.all([cropPartToBlob(headBox), cropPartToBlob(bodyBox)]).then(([headResult, bodyResult]) => {
      onConfirm({
        headFile: headResult.file,
        headPreview: headResult.previewUrl,
        bodyFile: bodyResult.file,
        bodyPreview: bodyResult.previewUrl,
      });
      onClose();
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>
            ✂️ Cắt phân vùng: {step === 'head' ? '1. Phần Đầu (Head)' : '2. Phần Thân (Body)'}
          </h3>
          <button type="button" onClick={onClose} className={styles.btnClose}>×</button>
        </div>

        <p className={styles.modalDesc}>
          {step === 'head'
            ? 'Kéo chuột tạo khung chữ nhật bao trọn lấy vùng ĐẦU của thú cưng.'
            : 'Kéo chuột tạo khung chữ nhật bao trọn lấy vùng THÂN của thú cưng.'}
        </p>

        <div className={styles.canvasWrapper}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={styles.cropperCanvas}
          />
        </div>

        <div className={styles.modalFooter}>
          {step === 'body' && (
            <button
              type="button"
              onClick={() => { setStep('head'); drawCanvas(headBox); }}
              className={styles.btnBack}
            >
              Quay lại cắt đầu
            </button>
          )}
          <button
            type="button"
            onClick={handleNextStep}
            className={styles.btnNext}
          >
            {step === 'head' ? 'Tiếp tục chọn Thân ➔' : 'Hoàn tất cắt ảnh ✨'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PetPartCropperModal;