import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import styles from './ImageCropModal.module.css';

// Hàm hỗ trợ tạo khung crop mặc định hình vuông hoặc tròn nằm giữa ảnh
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

function ImageCropModal({ isOpen, onClose, imgSrc, onCropComplete }) {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  if (!isOpen) return null;

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    // Tỉ lệ 1:1 cho avatar hình tròn/vuông
    setCrop(centerAspectCrop(width, height, 1));
  }

  // Hàm xử lý cắt ảnh từ Canvas và chuyển thành File object để gửi API
  const handleSaveCrop = async () => {
    const image = imgRef.current;
    if (!image || !completedCrop) return;

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Kích thước chuẩn sau khi xuất ra (ví dụ: 300x300 pixel tối ưu cho avatar)
    canvas.width = 300;
    canvas.height = 300;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    // Chuyển canvas thành dạng Blob/File để chuẩn bị gửi lên server qua FormData
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        return;
      }
      const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);

      // Trả file và link preview về component cha
      onCropComplete(croppedFile, previewUrl);
      onClose();
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>Căn chỉnh ảnh đại diện</h3>
        <div className={styles.cropContainer}>
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1} // Tỉ lệ 1:1 (khung vuông, dùng CSS bo tròn thành tròn)
              circularCrop // Biến khung crop thành hình tròn
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Upload preview"
                onLoad={onImageLoad}
                style={{ maxHeight: '60vh', display: 'block' }}
              />
            </ReactCrop>
          )}
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>Hủy</button>
          <button type="button" className={styles.btnSave} onClick={handleSaveCrop}>Cắt & Lưu ảnh</button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;