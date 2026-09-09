import React, { useState, useEffect } from 'react';
import api from '../../../../api/api';
import styles from './RoomFormModal.module.css';
import { toast } from 'react-toastify';
import { useDropzone } from 'react-dropzone';
import RoomCanvasEditor from '../RoomCanvasEditor/RoomCanvasEditor';

function RoomFormModal({ isOpen, onClose, initialData, onSuccess }) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    status: 'active',
    isDefault: false,
    price: 0,
  });

  const [previewUrl, setPreviewUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [slots, setSlots] = useState({});
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [isCanvasEditorOpen, setIsCanvasEditorOpen] = useState(false);

  const slotsCount = Object.keys(slots || {}).length;

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || '',
        name: initialData.name || '',
        description: initialData.description || '',
        status: initialData.status || 'active',
        isDefault: initialData.isDefault ?? false,
        price: initialData.price ?? 0,
      });
      setPreviewUrl(initialData.backgroundUrl || initialData.background_url || '');
      const rawSlots = initialData.slots || {};
      const normalizedSlots = Array.isArray(rawSlots)
        ? rawSlots.reduce((acc, s) => {
            if (s && s.id) acc[s.id] = s;
            return acc;
          }, {})
        : rawSlots && typeof rawSlots === 'object'
        ? rawSlots
        : {};
      setSlots(normalizedSlots);
      setImageFile(null);
      setRawImageSrc(null);
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        status: 'active',
        isDefault: false,
        price: 0,
      });
      setPreviewUrl('');
      setSlots({});
      setImageFile(null);
      setRawImageSrc(null);
    }
  }, [initialData, isOpen]);

  const dropzone = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        toast.error('File không hợp lệ! Vui lòng chọn file ảnh dưới 10MB');
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      const imageUrl = URL.createObjectURL(file);
      setRawImageSrc(imageUrl);
      setIsCanvasEditorOpen(true);
    },
  });

  const handleOpenEditorWithCurrentData = () => {
    setRawImageSrc(previewUrl);
    setIsCanvasEditorOpen(true);
  };

  const handleCanvasConfirm = (croppedFile, croppedPreviewUrl, editedSlots) => {
    if (croppedFile) {
      setPreviewUrl(croppedPreviewUrl);
      setImageFile(croppedFile);
    }
    const slotsObject = (editedSlots || []).reduce((acc, slot) => {
      if (slot && slot.id) {
        acc[slot.id] = slot;
      }
      return acc;
    }, {});
    setSlots(slotsObject);
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'price') {
      const num = value === '' ? 0 : Number(value);
      setFormData((prev) => ({ ...prev, [name]: isNaN(num) ? 0 : num }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formPayload = new FormData();
      formPayload.append('code', formData.code);
      formPayload.append('name', formData.name);
      formPayload.append('description', formData.description);
      formPayload.append('status', formData.status);
      formPayload.append('isDefault', formData.isDefault === true ? 'true' : 'false');
      formPayload.append('price', String(formData.price ?? 0));
      formPayload.append('slots', JSON.stringify(slots || {}));

      if (imageFile) {
        formPayload.append('background_url', imageFile);
      }

      if (initialData) {
        await api.patch(`/admin/rooms/update/${initialData._id}`, formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Cập nhật phòng thành công');
      } else {
        if (!imageFile && !previewUrl) {
          toast.warning('Vui lòng tải lên ảnh nền phòng!');
          return;
        }
        await api.post('/admin/rooms/create', formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Tạo phòng mới thành công');
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi lưu phòng');
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>
            <span className="material-symbols-outlined">bedroom_parent</span>
            {initialData ? 'Cập nhật Phòng' : 'Thêm Phòng mới'}
          </h3>
          <button type="button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} id="roomForm" className={styles.modalBodyGrid}>
          <div className={styles.modalLeftCol}>
            <div className={styles.previewSection}>
              {previewUrl ? (
                <div className={styles.imagePreviewContainer}>
                  <img src={previewUrl} alt="Background" className={styles.previewImg} />
                  <div className={styles.slotsCountBadge}>
                    {slotsCount} slots đã cấu hình
                  </div>
                </div>
              ) : (
                <div {...dropzone.getRootProps()} className={styles.imageUploadBox}>
                  <input {...dropzone.getInputProps()} />
                  <div className={styles.placeholderTextGroup}>
                    <span className={styles.placeholderIcon}>🖼️</span>
                    <span className={styles.placeholderText}>Tải ảnh nền phòng</span>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.actionButtonsCol}>
              {previewUrl && (
                <button type="button" className={styles.btnOpenEditor} onClick={handleOpenEditorWithCurrentData}>
                  <span>🎯</span> {slotsCount > 0 ? 'Sửa cấu hình Slots & Nền' : 'Mở bộ công cụ vẽ Slots'}
                </button>
              )}
              {previewUrl && (
                <div {...dropzone.getRootProps()} className={styles.btnReupload}>
                  <input {...dropzone.getInputProps()} />
                  <span>🔄</span> Tải ảnh nền khác
                </div>
              )}
            </div>
            {!previewUrl && (
              <p className={styles.uploadHintText}>
                Kéo thả hoặc nhấp để tải ảnh nền phòng (khuyến nghị tỷ lệ 1:1)
              </p>
            )}
          </div>

          <div className={styles.modalRightCol}>
            <div className={styles.formGroup}>
              <label>Mã phòng *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="VD: ROOM_LIVING_01"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Tên phòng *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="VD: Phòng khách ấm cúng"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Giá phòng</label>
              <div className={styles.inputGroupWithAffix}>
                <span className={styles.inputGroupPrefix}>
                  <span className="material-symbols-outlined">paid</span>
                </span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0 - Phòng miễn phí"
                  min="0"
                  step="1"
                />
                <span className={styles.inputGroupSuffix}>
                  <span className={`material-symbols-outlined ${styles.inputGroupSuffixCoinIcon}`}>monetization_on</span>
                  <span>Coins</span>
                </span>
              </div>
              {Number(formData.price ?? 0) === 0 && (
                <span style={{ fontSize: '12px', color: '#15803d', marginTop: '6px', display: 'inline-block', fontWeight: 600 }}>
                  🎁 Phòng miễn phí, tất cả người dùng có thể sử dụng
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Mô tả</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả về phòng..."
                rows="3"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Phòng mặc định</label>
              <div className={styles.statusSwitchGroup}>
                <button
                  type="button"
                  className={`${styles.statusBtn} ${formData.isDefault ? styles.activeActive : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, isDefault: true }))}
                >
                  Mặc định
                </button>
                <button
                  type="button"
                  className={`${styles.statusBtn} ${!formData.isDefault ? styles.activeInactive : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, isDefault: false }))}
                >
                  Không
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Trạng thái</label>
              <div className={styles.statusSwitchGroup}>
                <button
                  type="button"
                  className={`${styles.statusBtn} ${formData.status === 'active' ? styles.activeActive : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, status: 'active' }))}
                >
                  Hoạt động
                </button>
                <button
                  type="button"
                  className={`${styles.statusBtn} ${formData.status === 'inactive' ? styles.activeInactive : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, status: 'inactive' }))}
                >
                  Dừng
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" form="roomForm" className={styles.btnSubmit}>
            {initialData ? 'Lưu cập nhật' : 'Tạo mới'}
          </button>
        </div>

        {isCanvasEditorOpen && (
          <RoomCanvasEditor
            isOpen={isCanvasEditorOpen}
            onClose={() => setIsCanvasEditorOpen(false)}
            imgSrc={rawImageSrc}
            initialSlots={Object.values(slots || {})}
            roomCode={formData.code}
            onConfirm={handleCanvasConfirm}
          />
        )}
      </div>
    </div>
  );
}

export default RoomFormModal;
