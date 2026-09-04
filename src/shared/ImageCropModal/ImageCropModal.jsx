import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import styles from './ImageCropModal.module.css';

// Hàm hỗ trợ tạo khung crop mặc định hình vuông hoặc tròn nằm giữa ảnh
// Hàm này trả về: unit, tọa độ điểm bắt đầu (tính từ mép trên bên trái) và chiều cao, rộng của khung
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  // sau khi có kích thước khung từ hàm makeAspectCrop
  // hàm này đặt khung vào chính giữa tâm của bức ảnh
  return centerCrop(
    // hàm này dựa vào width và aspect để tự động tính toàn ra 1 cái khung hợp lí
    makeAspectCrop(
      {
        unit: '%',  // dùng đơn vị % để linh hoạt chỉnh theo kích thước ảnh
        width: 80,  // khung crop ban đầu chiếm 80% chiều rộng ảnh
      },
      aspect, // Tỉ lệ khung (1 cho hình vuông, 16/9 cho hình chữ nhật )
      mediaWidth, // chiều rộng thực tế của bức ảnh
      mediaHeight,  // Chiều cao thực tế của bức ảnh
    ),
    // dùng xác định tâm
    mediaWidth,
    mediaHeight,
  );
}

// imgSrc là link ảnh tạm thời của ảnh mà admin vừa upload
function ImageCropModal({ isOpen, onClose, imgSrc, onCropComplete }) {
  // crop: lưu trữ tọa độ và kích thước hiện tại của cái khung khi admin kéo thả
  const [crop, setCrop] = useState();
  // cập nhật khi admin thả chuột ra  (cũng lưu tọa độ và kích thước của khung)
  const [completedCrop, setCompletedCrop] = useState(null);
  // tham chiếu trực tiếp tới thẻ img ở giao diện
  const imgRef = useRef(null);

  if (!isOpen) return null;

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    // Tỉ lệ 1:1 cho avatar hình tròn/vuông
    setCrop(centerAspectCrop(width, height, 1));
  }

  // Hàm xử lý cắt ảnh từ Canvas và chuyển thành File object để gửi API
  const handleSaveCrop = async () => {
    // lấy ra thẻ image thực tế trên giao diện
    const image = imgRef.current;
    if (!image || !completedCrop) return;

    // tạo 1 thẻ canvas ảo
    const canvas = document.createElement('canvas');
    // natural là kích thước thực tế
    // còn width với height là kích thước hiển thị trên màn hình
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Kích thước chuẩn sau khi xuất ra (ví dụ: 300x300 pixel tối ưu cho avatar)
    canvas.width = 300;
    canvas.height = 300;

    // context
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX, // điểm bắt đầu cắt theo chiều ngang
      completedCrop.y * scaleY, // điểm bắt đầu cắt theo chiều dọc
      completedCrop.width * scaleX, // cắt rỗng sang phải bao nhiêu pixel
      completedCrop.height * scaleY,  // cắt rộng xuống dưới bao nhiêu pixel
      // đặt góc trên cùng bên trái của phần ảnh cắt vào vị trí (0, 0) của canvas mới
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
      // tạo 1 đường dẫn tạm thời để preview
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