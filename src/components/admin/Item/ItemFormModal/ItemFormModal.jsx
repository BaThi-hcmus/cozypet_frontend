import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../../api/api';
import styles from './ItemFormModal.module.css';
import { toast } from 'react-toastify';
import { useDropzone } from 'react-dropzone';
import ItemCanvasEditor from '../ItemCanvasEditor/ItemCanvasEditor';

function ItemFormModal({ constants, isOpen, onClose, initialData, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'furniture',
    category: '',
    price: '',
    width: 1,
    height: 1,
    status: 'active',
    slotType: 'center_floor',
    image: '',
  });

  // Ảnh preview & file gửi server
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);

  // Canvas editor
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [isCanvasEditorOpen, setIsCanvasEditorOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        type: initialData.type || 'furniture',
        category: initialData.category || '',
        price: initialData.price ?? '',
        width: initialData.width ?? 1,
        height: initialData.height ?? 1,
        status: initialData.status || 'active',
        slotType: initialData.slotType || 'center_floor',
        image: initialData.image || '',
      });
      setPreviewUrl(initialData.image || '');
      setImageFile(null);
      setRawImageSrc(null);
    } else {
      setFormData({
        name: '',
        type: 'furniture',
        category: '',
        price: '',
        width: 1,
        height: 1,
        status: 'active',
        slotType: 'center_floor',
        image: '',
      });
      setPreviewUrl('');
      setImageFile(null);
      setRawImageSrc(null);
    }
  }, [initialData, isOpen]);

  // validation
  const validatePngAlpha = useCallback((file) => {
    return new Promise((resolve, reject) => {
      // Chỉ chấp nhận file png
      if (file.type !== 'image/png') {
        reject(new Error('Chỉ chấp nhận file PNG! Vui lòng chọn file .png'));
        return;
      }

      // kiểm tra trong suốt
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(img.naturalWidth, 100); // Chỉ cần check 1 phần nhỏ
        canvas.height = Math.min(img.naturalHeight, 100);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // lấy ra 1 mảng chứa hàng nghìn pixel
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let hasTransparency = false;
        // Cứ 4 phần tử liên tiếp đại diện cho 1 pixel theo thứ tự: [Red, Green, Blue, Alpha]
        // i=3 là giá trị alpha của pixel đầu tiên
        // giá trị đi từ 0 (trong suốt hoàn toàn) tới 255 (đặc kín)
        for (let i = 3; i < data.length; i += 4) {
          // nếu alpha < 250 => có pha chút trong suốt => thỏa mản
          if (data[i] < 250) {  
            hasTransparency = true;
            break;
          }
        }

        if (!hasTransparency) {
          reject(
            new Error(
              'File PNG không có kênh Alpha! Vui lòng sử dụng ảnh PNG có nền trong suốt.',
            ),
          );
          return;
        }

        // báo tín hiệu thành công
        resolve(img);
        // dọn dẹp rác
        URL.revokeObjectURL(img.src);
      };

      // khi không thể bắt được sự kiện onLoad (do file không phải ảnh) thì nó chạy vào đây
      img.onerror = () => {
        reject(new Error('Không thể đọc file ảnh.'));
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  // cấu hình drop zone
  const dropzone = useDropzone({
    accept: { 'image/png': ['.png'] },
    maxSize: 10 * 1024 * 1024, // 10MB cho ảnh PNG chất lượng cao
    onDrop: async (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        toast.error('File không hợp lệ! Chỉ chấp nhận file .png (tối đa 10MB)');
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      try {
        await validatePngAlpha(file);
        // Mở Canvas Editor
        const imageUrl = URL.createObjectURL(file);
        setRawImageSrc(imageUrl);
        setIsCanvasEditorOpen(true);
      } catch (error) {
        toast.error(error.message);
      }
    },
  });

  // Nhận file đã căn chỉnh từ Canvas Editor
  const handleCanvasConfirm = (croppedFile, croppedPreviewUrl) => {
    setPreviewUrl(croppedPreviewUrl);
    setImageFile(croppedFile);
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('type', formData.type);
      formPayload.append('category', formData.category);
      formPayload.append('price', Number(formData.price || 0));
      formPayload.append('width', Number(formData.width || 1));
      formPayload.append('height', Number(formData.height || 1));
      formPayload.append('status', formData.status);
      formPayload.append('slotType', formData.slotType);

      if (imageFile) {
        formPayload.append('image', imageFile);
      }

      if (initialData) {
        await api.patch(`/admin/items/update/${initialData._id}`, formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Cập nhật vật phẩm thành công');
      } else {
        await api.post('/admin/items/create', formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Tạo mới vật phẩm thành công');
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi lưu vật phẩm');
    }
  };  

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>
            <span>🐾</span>
            {initialData ? 'Cập nhật thông tin Vật phẩm' : 'Thêm Vật phẩm mới'}
          </h3>
          <button type="button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} id="itemForm" className={styles.modalBodyGrid}>
          {/* Khu vực Upload Ảnh PNG (chỉ .png có alpha) */}
          <div className={styles.modalLeftCol}>
            <div {...dropzone.getRootProps()} className={styles.imageUploadBox}>
              <input {...dropzone.getInputProps()} />
              <div className={styles.imagePlaceholderBox}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Vật phẩm" className={styles.previewImg} />
                ) : (
                  <div className={styles.placeholderTextGroup}>
                    <span className={styles.placeholderIcon}>🖼️</span>
                    <span className={styles.placeholderText}>Tải ảnh PNG (trong suốt)</span>
                  </div>
                )}
              </div>
              <div className={styles.cameraIconBadge}>📸</div>
            </div>
            <p className={styles.uploadHintText}>
              Kéo thả hoặc nhấp để tải ảnh vật phẩm<br />
              <strong>Chỉ chấp nhận PNG có nền trong suốt</strong> (tối đa 10MB)
            </p>
          </div>

          {/* Cột phải: Các trường thông tin */}
          <div className={styles.modalRightCol}>
            <div className={styles.formGroup}>
              <label>Tên vật phẩm *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="VD: Giường cún công chúa..."
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Loại vật phẩm *</label>
              <div className={styles.typeSwitchGroup}>
                {constants?.types?.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.typeBtn} ${formData.type === opt.value ? styles.active : ''}`}
                    onClick={() => setFormData((prev) => ({ ...prev, type: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Danh mục (Category) *</label>
              <select
                name='category'
                value={formData.category}
                onChange={handleChange}
                className={styles.selectInput}
                required
              >
                <option value=''>-- Chọn danh mục --</option>
                {constants?.categories?.[formData.type]?.map((item, index) => {
                  return (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  )
                })}
              </select>
            </div>

            <div className={styles.formRowGroup}>
              <div className={styles.formGroup}>
                <label>Giá bán (VNĐ)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
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
                    Dừng hoạt động
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.formRowGroup}>
              <div className={styles.formGroup}>
                <label>Chiều rộng (Width)</label>
                <input
                  type="number"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  placeholder="1"
                  min="1"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Chiều cao (Height)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="1"
                  min="1"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Vị trí đặt (Slot Type)</label>
              <select
                name="slotType"
                value={formData.slotType}
                onChange={handleChange}
                className={styles.selectInput}
              >
                {constants?.slotTypes?.map((item) => {
                  return <option
                    value={item.value}
                  >{item.label}</option>
                })}
              </select>
            </div>


          </div>
        </form>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" form="itemForm" className={styles.btnSubmit}>
            {initialData ? 'Lưu cập nhật' : 'Tạo mới'}
          </button>
        </div>

        {/* Canvas Editor 1000x1000 */}
        <ItemCanvasEditor
          isOpen={isCanvasEditorOpen}
          onClose={() => setIsCanvasEditorOpen(false)}
          imgSrc={rawImageSrc}
          onConfirm={handleCanvasConfirm}
        />
      </div>
    </div>
  );
}

export default ItemFormModal;
