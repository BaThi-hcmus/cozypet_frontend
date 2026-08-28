import React, { useState, useEffect } from 'react';
import api from '../../../../api/api';
import styles from './AccountFormModal.module.css';

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

  useEffect(() => {
    if (initialData) {
      setFormData({
        email: initialData.email || '',
        password: '',
        fullName: initialData.fullName || '',
        phoneNumber: initialData.phoneNumber || '',
        salary: initialData.salary || '',
        role: initialData.role || 'staff',
        avatar: initialData.avatar || ''
      });
    } else {
      setFormData({
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        salary: '',
        role: 'staff',
        avatar: ''
      });
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
      // Xây dựng payload sạch, loại bỏ các field rỗng và chuyển salary sang number
      const payload = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };
      if (formData.fullName) payload.fullName = formData.fullName;
      if (formData.phoneNumber) payload.phoneNumber = formData.phoneNumber;
      if (formData.avatar) payload.avatar = formData.avatar;
      if (formData.salary !== '' && formData.salary !== undefined) {
        payload.salary = Number(formData.salary);
      }

      if (initialData) {
        await api.patch(`/admin/accounts/update/${initialData._id}`, payload);
      } else {
        await api.post('/admin/accounts/create', payload);
      }
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra khi lưu tài khoản');
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
          {/* Cột trái: Tải lên ảnh đại diện */}
          <div className={styles.modalLeftCol}>
            <div className={styles.avatarUploadBox}>
              <div className={styles.avatarPlaceholderCircle}>
                {formData.avatar ? <img src={formData.avatar} alt="" /> : null}
              </div>
              <div className={styles.cameraIconBadge}>📷</div>
            </div>
            <p>Tải lên ảnh đại diện<br />(Tùy chọn)</p>
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
      </div>
    </div>
  );
}

export default AccountFormModal;