import React, { useState, useEffect } from 'react';
import api from '../../../../api/api';
import styles from './AccountFormModal.module.css';
import { toast } from 'react-toastify';
import ImageCropModal from '../../../../shared/ImageCropModal/ImageCropModal';
import { useDropzone } from 'react-dropzone';
import { useImageCrop } from '../../../../hooks/useImageCrop';

function AccountFormModal({ isOpen, onClose, initialData, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    salary: '',
    role: 'staff',
    avatar: ''
  });

  // Gọi Custom Hook quản lý ảnh
  const {
    previewUrl,
    imageFile,
    rawImageSrc,
    isCropModalOpen,
    setIsCropModalOpen,
    dropzone,
    handleCropComplete,
    resetImage,
  } = useImageCrop();

  useEffect(() => {
    if (initialData) {
      setFormData({
        email: initialData.email || '',
        password: '',
        fullName: initialData.fullName || '',
        phoneNumber: initialData.phoneNumber || '',
        salary: initialData.salary || '',
        role: initialData.role || 'staff',
        avatar: initialData.avatar || '',
        avatarFile: null
      });
      resetImage(initialData.avatar || ''); // Nạp ảnh cũ vào hook
    } else {
      setFormData({
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        salary: '',
        role: 'staff',
        avatar: '',
        avatarFile: null
      });
      resetImage(''); // Reset sạch ảnh
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // vì có file nên dùng form data thay vì json thuần
      const formPayload = new FormData();
      formPayload.append('email', formData.email);
      formPayload.append('password', formData.password);
      formPayload.append('role', formData.role);
      formPayload.append('fullName', formData.fullName);
      formPayload.append('phoneNumber', formData.phoneNumber);
      formPayload.append('salary', Number(formData.salary));
      // Lấy file từ custom hook đính kèm vào payload
      if (imageFile) {
        formPayload.append('avatar', imageFile);
      }

      if (initialData) {
        await api.patch(`/admin/accounts/update/${initialData._id}`, formPayload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Cập nhật tài khoản thành công');
      } else {
        await api.post('/admin/accounts/create', formPayload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Tạo tài khoản thành công');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra khi lưu tài khoản');
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>{initialData ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}</h3>
          <button type="button" onClick={onClose}>×</button>
        </div>

        {/* Form chứa các input và tự động submit khi bấm nút lưu */}
        <form onSubmit={handleSubmit} id="accountForm" className={styles.modalBodyGrid}>
          {/* Khu vực Upload Avatar sử dụng react-dropzone */}
          <div className={styles.modalLeftCol}>
            <div {...dropzone.getRootProps()} className={styles.avatarUploadBox}>
              <input {...dropzone.getInputProps()} />
              <div className={styles.avatarPlaceholderCircle}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar" className={styles.previewImg} />
                ) : (
                  <span className={styles.placeholderText}>Chọn ảnh</span>
                )}
              </div>
              <div className={styles.cameraIconBadge}>📷</div>
            </div>
            <p className={styles.uploadText}>Kéo thả hoặc bấm vào để chọn ảnh<br />(Tối đa 5MB)</p>
          </div>

          {/* Cột phải: Các input thông tin */}
          <div className={styles.modalRightCol}>
            <div className={styles.formGroup}>
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@cozypet.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Mật khẩu *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                required={!initialData}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Họ tên</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className={styles.formRowGroup}>
              <div className={styles.formGroup}>
                <label>Số điện thoại</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="0901234567"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Lương cơ bản</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="VND"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Vai trò</label>
              <div className={styles.roleSwitchButtons}>
                <button
                  type="button"
                  className={formData.role === 'admin' ? styles.active : ''}
                  onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                >
                  Admin
                </button>
                <button
                  type="button"
                  className={formData.role === 'staff' ? styles.active : ''}
                  onClick={() => setFormData(prev => ({ ...prev, role: 'staff' }))}
                >
                  Staff
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Chân modal đặt ngoài form nhưng chung container */}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>Hủy</button>
          <button type="submit" form="accountForm" className={styles.btnSubmit}>Lưu</button>
        </div>

        {/* Modal cắt và căn chỉnh ảnh đại diện */}
        <ImageCropModal
          isOpen={isCropModalOpen}
          onClose={() => setIsCropModalOpen(false)}
          imgSrc={rawImageSrc}
          onCropComplete={handleCropComplete}
        />
      </div>
    </div>
  );
}

export default AccountFormModal;