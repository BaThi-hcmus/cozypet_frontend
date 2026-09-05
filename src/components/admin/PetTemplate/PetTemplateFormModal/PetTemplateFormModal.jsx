import React, { useState, useEffect } from 'react';
import api from '../../../../api/api';
import styles from './PetTemplateFormModal.module.css';
import { toast } from 'react-toastify';
import { useDropzone } from 'react-dropzone';
import PetCanvasEditor from '../PetTemplateCanvasEditor/PetTemplateCanvasEditor';
import { PetTemplatePreviewModal } from '../PetTemplatePreviewModal/PetTemplatePreviewModal';
import PetPartUploadModal from '../PetPartUploadModal/PetPartUploadModal';
import PetRigEditorModal from '../PetRigEditorModal/PetRigEditorModal';

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

  // Quản lý state cho các bộ phận rời và cấu hình Rigging Layers JSON
  const [partFiles, setPartFiles] = useState({}); // { head: File, body: File, ... }
  const [partPreviews, setPartPreviews] = useState({}); // { head: 'url', body: 'url', ... }
  const [riggingLayersConfig, setRiggingLayersConfig] = useState(null);
  const [globalZoom, setGlobalZoom] = useState(1);
  const [globalOffset, setGlobalOffset] = useState({ x: 0, y: 0 });

  // Quản lý hiển thị các Modal con
  const [isCanvasModalOpen, setIsCanvasModalOpen] = useState(false);
  const [isPartUploadOpen, setIsPartUploadOpen] = useState(false);
  const [isRigEditorOpen, setIsRigEditorOpen] = useState(false);

  // hoạt ảnh
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const petPreviewData = {
    species: formData?.species || 'cat',
    name: formData.name || 'Pet mới',
    layers: riggingLayersConfig || initialData?.layers || {},
    globalZoom: globalZoom !== 1 ? globalZoom : (initialData?.globalZoom || 1),
    globalOffset: (globalOffset.x !== 0 || globalOffset.y !== 0) ? globalOffset : (initialData?.globalOffset || { x: 0, y: 0 })
  };

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

  // tải dữ liệu
  useEffect(() => {
    if (initialData) {
      setFormData({
        templateId: initialData.templateId || '',
        species: initialData.species || 'cat',
        name: initialData.name || '',
      });
      setPreviewUrl(initialData.avatar || '');
      setImageFile(null);
      setRiggingLayersConfig(initialData?.layers || null);

      // Nếu có sẵn layers từ DB, nạp preview url vào
      if (initialData.layers) {
        const initialPreviews = {};
        Object.entries(initialData.layers).forEach(([key, val]) => {
          if (val.url) initialPreviews[key] = val.url;
        });
        setPartPreviews(initialPreviews);
      }
    } else {
      setFormData({
        templateId: '',
        species: 'cat',
        name: '',
      });
      setPreviewUrl('');
      setImageFile(null);
      setPartPreviews({});
      setRiggingLayersConfig(null);
    }
    setIsSubmitting(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Callback nhận các file ảnh đã được đóng gói chuẩn 1000x1000 từ PetCanvasEditor
  const handleCanvasConfirm = (file, newPreviewUrl) => {
    setImageFile(file);
    setPreviewUrl(newPreviewUrl);
    setIsCanvasModalOpen(false);

    // Mở tiếp modal upload các bộ phận chi tiết
    setIsPartUploadOpen(true);
  };

  // Sau khi upload đủ các bộ phận rời ở PetPartUploadModal
  const handlePartUploadConfirm = ({ files, previews }) => {
    setPartFiles(files);
    setPartPreviews(previews);
    toast.success('Đã tải lên các bộ phận thành công! Hãy tiến hành ráp nối.');

    // Mở ngay Visual Rigging Editor để Admin căn chỉnh tọa độ
    setIsRigEditorOpen(true);
  };

  // Sau khi Admin hoàn tất kéo thả và bấm lưu cấu hình trong RigEditorModal
  const handleRigEditorConfirm = ({ layers, globalZoom: z, globalOffset: off }) => {
    setRiggingLayersConfig(layers);
    if (z !== undefined) setGlobalZoom(z);
    if (off !== undefined) setGlobalOffset(off);
    toast.success('Đã lưu cấu hình Rigging tọa độ các bộ phận!');
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
      // 2 trường hỗ trợ vẽ giao diện preview
      formPayload.append('globalZoom', globalZoom);
      formPayload.append('globalOffset', globalOffset);

      if (imageFile) {
        formPayload.append('avatar', imageFile);
      }

      // Đính kèm các file bộ phận nếu có thay đổi mới
      Object.keys(partFiles).forEach((key) => {
        if (partFiles[key]) {
          formPayload.append(`${key}`, partFiles[key]);
        }
      });

      // Đính kèm chuỗi JSON cấu hình tọa độ layers vào payload
      if (riggingLayersConfig) {
        formPayload.append('layers', JSON.stringify(riggingLayersConfig));
      }

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

            {/* Nút mở lại bảng upload/ráp nối thủ công nếu cần */}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={styles['btn-preview-trigger']}
                onClick={() => setIsPartUploadOpen(true)}
              >
                🧩 Quản lý / Tải bộ phận
              </button>

              {Object.keys(partPreviews).length > 0 && (
                <button
                  type="button"
                  className={styles['btn-preview-trigger']}
                  style={{ background: '#059669' }}
                  onClick={() => setIsRigEditorOpen(true)}
                >
                  📐 Mở Ráp nối (Rig Editor)
                </button>
              )}
            </div>

            {/* preview hoạt ảnh */}
            {(riggingLayersConfig || Object.keys(partPreviews).length > 0) && <div style={{ margin: '1rem 0' }}>
              <button
                type="button"
                className={styles['btn-preview-trigger']}
                onClick={() => setIsPreviewOpen(true)}
              >
                👀 Xem trước Pet
              </button>
            </div>}
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

        {/* Modal tải lên các bộ phận rời */}
        <PetPartUploadModal
          isOpen={isPartUploadOpen}
          onClose={() => setIsPartUploadOpen(false)}
          initialParts={{ files: partFiles, previews: partPreviews }}
          onConfirm={handlePartUploadConfirm}
        />

        {/* Modal kéo thả và ráp nối */}
        <PetRigEditorModal
          isOpen={isRigEditorOpen}
          onClose={() => setIsRigEditorOpen(false)}
          imgSrcs={partPreviews}
          onConfirm={handleRigEditorConfirm}
        />
      </div>

      {/* preview hoạt ảnh */}
      <PetTemplatePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        petData={petPreviewData}
      />
    </div>
  );
}

export default PetTemplateFormModal;