import { useEffect, useRef, useState } from "react";
import api from "../../../../api/api";
import { toast } from "react-toastify";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './AccountFormModal.module.css';

function AccountFormModal({
  isOpen,
  onClose,
  initialData,
  onSuccess
}) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    avatar: '',
    role: 'staff',
    salary: ''
  });

  // image
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // liên kết với thẻ input file ở trình duyệt
  const fileInputRef = useRef(null);

  // state dùng cho cắt ảnh
  const [rawImageSrc, setRawImageSrc] = useState('');     // Link ảnh gốc đưa vào modal cắt
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [crop, setCrop] = useState(); // Tọa độ khung crop
  const [completedCrop, setCompletedCrop] = useState(null); // Tọa độ sau khi crop hoàn tất
  const [scale, setScale] = useState(1); // Thanh trượt zoom ảnh
  const imgRefFromCanvas = useRef(null);

  // Xử lý upload file ảnh từ file explorer
  const handleBoxClick = () => {
    fileInputRef.current.click();
  }

  const handleFileSelected = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  }

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setRawImageSrc(imageUrl);
    setScale(1); // Reset zoom khi chọn ảnh mới
    setIsCropModalOpen(true);
  }

  // Xử lý upload file ảnh bằng cách kéo thả
  const handleDragOver = (e) => {
    e.preventDefault();
  }

  const handleDrop = (e) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }

  // Xử lý crop ảnh
  const handleImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    // Tạo khung mặc định ở giữa ảnh
    setCrop(centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    ));
  }

  const handleConfirmCrop = () => {
    if (!completedCrop || !imgRefFromCanvas.current) return;

    const image = imgRefFromCanvas.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Kích thước ảnh kết quả sau khi cắt (300x300 pixel chuẩn avatar)
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

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

        setImageFile(croppedFile);  // file này được gửi sang backend
        setPreviewUrl(URL.createObjectURL(blob));  // hiển thị ngoài modal form
      },
      'image/jpeg',
      0.95
    );
    // đóng modal
    setIsCropModalOpen(false);
  }

  useEffect(() => {
    if (initialData) {
      setFormData({
        email: initialData.email || '',
        password: '',
        fullName: initialData.fullName || '',
        phoneNumber: initialData.phoneNumber || '',
        avatar: initialData.avatar || '',
        role: initialData.role || 'staff',
        salary: initialData.salary || ''
      })
      setPreviewUrl(initialData.avatar || '');
      setImageFile(null);
    } else {
      setFormData({
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        avatar: '',
        role: 'staff',
        salary: ''
      })
      setPreviewUrl('');
      setImageFile(null);
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      return {
        ...prev,
        [name]: value
      }
    })
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = new FormData();
      dataToSend.append('fullName', formData.fullName);
      dataToSend.append('email', formData.email);
      dataToSend.append('password', formData.password);
      dataToSend.append('phoneNumber', formData.phoneNumber);
      dataToSend.append('role', formData.role);
      dataToSend.append('salary', formData.salary);
      
      if (imageFile) {
        dataToSend.append('avatar', imageFile);
      }

      if (initialData) {
        await api.patch(`/admin/accounts/update/${initialData._id}`, dataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Cập nhật thành công');
      } else {
        await api.post(`/admin/accounts/create`, dataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Tạo mới thành công');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Có lỗi khi gọi api');
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3>{!initialData ? 'Thêm tài khoản mới' : 'Cập nhật tài khoản'}</h3>
          <button type="button" onClick={onClose}>×</button>
        </div>

        {/* Form chính chứa các input và tự động submit khi bấm nút lưu */}
        <form onSubmit={handleSubmitForm} id="accountForm" className={styles.modalBodyGrid}>
          {/* Cột trái: Upload Avatar */}
          <div className={styles.modalLeftCol}>
            <div
              className={styles.avatarUploadBox}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleBoxClick}
            >
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

            {/* Thẻ input ẩn */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelected}
              accept="image/*"
            />
          </div>

          {/* Cột phải: Các input thông tin */}
          <div className={styles.modalRightCol}>
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
                value={formData.password || ''}
                onChange={handleChange}
                placeholder="********"
                required={!initialData}
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
          <button type="submit" form="accountForm" className={styles.btnSubmit}>
            {initialData ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>

        {/* Modal Cắt Ảnh (Hiển thị dạng phụ đè lên khi chọn ảnh) */}
        {isCropModalOpen && (
          <div className={styles.cropModalOverlay}>
            <div className={styles.cropModalContent}>
              <h3>Căn chỉnh ảnh đại diện</h3>

              {/* Khung crop */}
              <div className={styles.cropContainer}>
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop={true}
                >
                  <img
                    ref={imgRefFromCanvas}
                    src={rawImageSrc}
                    alt="crop"
                    onLoad={handleImageLoad}
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.05s ease',
                      maxHeight: '50vh',
                      display: 'block'
                    }}
                  />
                </ReactCrop>
              </div>

              {/* Thanh zoom */}
              <div className={styles.zoomControlGroup}>
                <label>Thu phóng:</label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                />
              </div>

              {/* Thanh điều hướng modal crop */}
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setIsCropModalOpen(false)}>Hủy</button>
                <button type="button" className={styles.btnSave} onClick={handleConfirmCrop}>Cắt và sử dụng</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountFormModal;