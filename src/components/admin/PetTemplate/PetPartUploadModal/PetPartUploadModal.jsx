import React, { useState } from 'react';
import styles from './PetPartUploadModal.module.css';
import { toast } from 'react-toastify';

const PART_CONFIGS = [
  { key: 'body', label: '1. Phần Thân (Body)', required: true },
  { key: 'head', label: '2. Phần Đầu (Head)', required: true },
  { key: 'leftArm', label: '3. Tay trái (Left Arm)', required: false },
  { key: 'rightArm', label: '4. Tay phải (Right Arm)', required: false },
  { key: 'leftLeg', label: '5. Chân trái (Left Leg)', required: false },
  { key: 'rightLeg', label: '6. Chân phải (Right Leg)', required: false },
  { key: 'tail', label: '7. Đuôi (Tail)', required: false },
];

function PetPartUploadModal({ isOpen, onClose, onConfirm, initialParts = {} }) {
  // Lưu trữ các File gốc và URL preview cho từng bộ phận
  const [partFiles, setPartFiles] = useState(initialParts.files || {});
  const [partPreviews, setPartPreviews] = useState(initialParts.previews || {});

  if (!isOpen) return null;

  // xử lí khi admin upload 1 part
  const handleFileChange = (partKey, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP)');
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setPartFiles((prev) => ({ ...prev, [partKey]: file }));
    setPartPreviews((prev) => ({ ...prev, [partKey]: previewUrl }));
  };

  // xử lí khi admin bấm button x 1 part
  const handleRemovePart = (partKey) => {
    setPartFiles((prev) => {
      const copy = { ...prev };
      delete copy[partKey];
      return copy;
    });
    setPartPreviews((prev) => {
      const copy = { ...prev };
      delete copy[partKey];
      return copy;
    });
  };

  // lưu các part, chỉ có head và body là required, còn lại là optional
  const handleSave = () => {
    // Kiểm tra bắt buộc các phần quan trọng
    if (!partFiles.body && !partPreviews.body) {
      toast.error('Vui lòng tải lên phần Thân (Body) bắt buộc!');
      return;
    }
    if (!partFiles.head && !partPreviews.head) {
      toast.error('Vui lòng tải lên phần Đầu (Head) bắt buộc!');
      return;
    }

    onConfirm({ files: partFiles, previews: partPreviews });
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>🧩 Tải lên các bộ phận tách rời (Modular Parts)</h3>
          <button type="button" onClick={onClose} className={styles.btnClose}>×</button>
        </div>

        <p className={styles.modalDesc}>
          Tải lên các file ảnh PNG trong suốt đã được cắt từ Photopea cho từng bộ phận của thú cưng. Thân và Đầu là bắt buộc.
        </p>

        <div className={styles.partsGrid}>
          {PART_CONFIGS.map((part) => {
            const preview = partPreviews[part.key];
            return (
              <div key={part.key} className={styles.partCard}>
                <div className={styles.partInfo}>
                  <span className={styles.partLabel}>
                    {part.label} {part.required && <span className={styles.required}>*</span>}
                  </span>
                </div>

                <div className={styles.uploadDropZone}>
                  {preview ? (
                    <div className={styles.previewContainer}>
                      <img src={preview} alt={part.key} className={styles.previewImg} />
                      <button
                        type="button"
                        className={styles.btnRemove}
                        onClick={() => handleRemovePart(part.key)}
                        title="Xóa ảnh này"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className={styles.fileInputLabel}>
                      <span>📁 Chọn ảnh</span>
                      <input
                        type="file"
                        accept="image/png, image/webp, image/jpeg"
                        onChange={(e) => handleFileChange(part.key, e)}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.btnCancel}>Hủy</button>
          <button type="button" onClick={handleSave} className={styles.btnConfirm}>Xác nhận & Sang bước Ráp nối ➔</button>
        </div>
      </div>
    </div>
  );
}

export default PetPartUploadModal;