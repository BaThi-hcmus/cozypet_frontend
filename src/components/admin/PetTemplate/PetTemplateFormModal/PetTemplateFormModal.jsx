import React, { useState, useEffect } from 'react';
import api from '../../../../api/api';
import styles from './PetTemplateFormModal.module.css';
import { toast } from 'react-toastify';
import { useDropzone } from 'react-dropzone';
import PetCanvasEditor from '../PetTemplateCanvasEditor/PetTemplateCanvasEditor';
import PetPartCropperModal from '../PetPartCropperModal/PetPartCropperModal';

function PetTemplateFormModal({ isOpen, onClose, initialData, onSuccess }) {
  const [formData, setFormData] = useState({
    templateId: '',
    species: 'cat',
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quản lý state cho luồng xử lý ảnh qua PetCanvasEditor & PetPartCropperModal
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [rawImageSrc, setRawImageSrc] = useState('');

  // State lưu trữ các phần đã cắt riêng biệt (Head & Body)
  const [headFile, setHeadFile] = useState(null);
  const [bodyFile, setBodyFile] = useState(null);
  const [headPreview, setHeadPreview] = useState('');
  const [bodyPreview, setBodyPreview] = useState('');

  // Quản lý hiển thị các Modal con
  const [isCanvasModalOpen, setIsCanvasModalOpen] = useState(false);
  const [isPartCropperOpen, setIsPartCropperOpen] = useState(false);
  // chứa url ảnh để hiển thị ở modal cropper
  const [processedGeneralImgSrc, setProcessedGeneralImgSrc] = useState('');

  // Hook dropzone để bắt sự kiện chọn file từ máy hoặc kéo thả
  const dropzone = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onload = () => {
          setRawImageSrc(reader.result);
          setIsCanvasModalOpen(true); // Mở modal canvas căn chỉnh ngay sau khi chọn ảnh
        };
        reader.readAsDataURL(file);
      }
    },
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        templateId: initialData.templateId || '',
        species: initialData.species || 'cat',
        name: initialData.name || '',
      });
      setPreviewUrl(initialData.avatar || '');
      setImageFile(null);
      setHeadFile(null);
      setBodyFile(null);
    } else {
      setFormData({
        templateId: '',
        species: 'cat',
        name: '',
      });
      setPreviewUrl('');
      setImageFile(null);
      setHeadFile(null);
      setBodyFile(null);
    }
    setIsSubmitting(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Callback nhận file ảnh đã được đóng gói chuẩn 1000x1000 từ PetCanvasEditor
  // Khi hoàn tất canvas chỉnh sửa tổng thể ➔ Chuyển tiếp sang mở Modal Cắt Đầu/Thân
  const handleCanvasConfirm = (file, newPreviewUrl) => {
    setImageFile(file);
    setPreviewUrl(newPreviewUrl);
    setProcessedGeneralImgSrc(newPreviewUrl);
    setIsCanvasModalOpen(false);

    // Tự động mở ngay modal cắt đầu thân tiếp theo
    setIsPartCropperOpen(true);
  };

  // Khi hoàn tất việc cắt đầu và thân từ PetPartCropperModal
  const handlePartCropperConfirm = ({ headFile, headPreview, bodyFile, bodyPreview }) => {
    setHeadFile(headFile);
    setHeadPreview(headPreview);
    setBodyFile(bodyFile);
    setBodyPreview(bodyPreview);
    toast.success('Đã tách thành công phần Đầu và Thân cho khung chuyển động!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!initialData && !imageFile && !previewUrl) {
      toast.error('Vui lòng tải ảnh avatar cho mẫu pet');
      return;
    }

    try {
      setIsSubmitting(true);
      const formPayload = new FormData();
      formPayload.append('templateId', formData.templateId.trim());
      formPayload.append('species', formData.species);
      formPayload.append('name', formData.name.trim());

      if (imageFile) {
        formPayload.append('avatar', imageFile);
      }

      // Gắn thêm file Đầu và Thân đã cắt vào Payload để backend xử lý Master Rig
      if (headFile) formPayload.append('head', headFile);
      if (bodyFile) formPayload.append('body', bodyFile);

      if (initialData) {
        await api.patch(`/admin/pet-templates/update/${initialData._id}`, formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Cập nhật mẫu pet thành công');
      } else {
        await api.post('/admin/pet-templates/create', formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Tạo mẫu pet thành công — AI đã phân tích đặc điểm từ ảnh');
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || 'Có lỗi xảy ra khi lưu mẫu pet',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>
            <span>🐾</span>
            {initialData ? 'Cập nhật Mẫu Pet' : 'Thêm Mẫu Pet mới'}
          </h3>
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} id="petTemplateForm" className={styles.modalBodyGrid}>
          <div className={styles.modalLeftCol}>
            <div {...dropzone.getRootProps()} className={styles.imageUploadBox}>
              <input {...dropzone.getInputProps()} />
              <div className={styles.imagePlaceholderBox}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar pet" className={styles.previewImg} />
                ) : (
                  <div className={styles.placeholderTextGroup}>
                    <span className={styles.placeholderIcon}>🐶</span>
                    <span className={styles.placeholderText}>Tải ảnh avatar</span>
                  </div>
                )}
              </div>
              <div className={styles.cameraIconBadge}>📸</div>
            </div>
            <p className={styles.uploadHintText}>
              Kéo thả hoặc nhấp để chọn ảnh pet
              <br />
              <strong>Bắt buộc khi tạo mới</strong> (tối đa 5MB)
            </p>

            {/* PHẦN PREVIEW ĐẦU & THÂN MỚI (TO RÕ, CÂN ĐỐI) */}
            {(headPreview || bodyPreview) && (
              <div className={styles.previewPartsSection}>
                <div className={styles.previewPartsTitle}>
                  <span>🧩 Phân vùng đã cắt:</span>
                </div>
                <div className={styles.previewPartsWrapper}>
                  {headPreview && (
                    <div className={styles.partPreviewCard}>
                      <img src={headPreview} alt="Đầu pet" className={styles.partPreviewImage} />
                      <span className={styles.partPreviewLabel}>Phần Đầu</span>
                    </div>
                  )}
                  {bodyPreview && (
                    <div className={styles.partPreviewCard}>
                      <img src={bodyPreview} alt="Thân pet" className={styles.partPreviewImage} />
                      <span className={styles.partPreviewLabel}>Phần Thân</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles.modalRightCol}>
            <div className={styles.formGroup}>
              <label>Mã template *</label>
              <input
                type="text"
                name="templateId"
                value={formData.templateId}
                onChange={handleChange}
                placeholder="VD: cat_orange_tabby, dog_poodle_white"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Tên mẫu pet *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="VD: Mèo Mướp Cam, Poodle Trắng Xù"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Loài *</label>
              <div className={styles.typeSwitchGroup}>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${formData.species === 'cat' ? styles.active : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, species: 'cat' }))}
                >
                  🐱 Mèo
                </button>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${formData.species === 'dog' ? styles.active : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, species: 'dog' }))}
                >
                  🐶 Chó
                </button>
              </div>
            </div>

            <div className={styles.aiHintBox}>
              <strong>✨ Phân tích bằng Gemini AI</strong>
              Các trường đặc điểm (màu lông, họa tiết, độ dài lông, traits...) sẽ được AI tự
              động điền dựa trên ảnh avatar. Bạn chỉ cần nhập 4 thông tin cơ bản ở trên.
            </div>
          </div>
        </form>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            form="petTemplateForm"
            className={styles.btnSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Đang xử lý ảnh & AI...'
              : initialData
                ? 'Lưu cập nhật'
                : 'Tạo mới'}
          </button>
        </div>

        {/* Modal Căn chỉnh Canvas 1000x1000 chuyên dụng cho Pet */}
        <PetCanvasEditor
          isOpen={isCanvasModalOpen}
          onClose={() => setIsCanvasModalOpen(false)}
          imgSrc={rawImageSrc}
          onConfirm={handleCanvasConfirm}
        />

        {/* Modal Cắt khung Đầu và Thân cho Master Rig */}
        <PetPartCropperModal
          isOpen={isPartCropperOpen}
          onClose={() => setIsPartCropperOpen(false)}
          imgSrc={processedGeneralImgSrc}
          onConfirm={handlePartCropperConfirm}
        />
      </div>
    </div>
  );
}

export default PetTemplateFormModal;