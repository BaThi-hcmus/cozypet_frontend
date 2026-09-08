import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PetReveal.module.css';
import api from '../../../api/api';
import { toast } from 'react-toastify';
import useAuthStore from '../../../stores/useAuthStore';

export default function PetReveal({ petData }) {
  const navigate = useNavigate();
  const { refreshPetData } = useAuthStore();
  const [petName, setPetName] = useState('');
  const [loading, setLoading] = useState(false);

  // petData chứa { pet, templatePet }
  const pet = petData?.pet;
  const templatePet = petData?.templatePet;

  // Lấy ảnh hiển thị: ưu tiên avatar từ template hoặc lấy fallback
  const petImage = templatePet?.avatar || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

  const handleStartJourney = async () => {
    if (!petName.trim()) {
      toast.error("Vui lòng nhập tên cho bé nha!");
      return;
    }

    if (!pet?._id) {
      toast.error("Không tìm thấy thông tin pet!");
      return;
    }

    setLoading(true);

    try {
      // Gọi API update để cập nhật tên pet
      const response = await api.patch(`/pets/update/${pet._id}`, {
        name: petName.trim()
      });

      if (response.data) {
        // Lưu pet data vào localStorage
        const dataToSave = {
          pet: {
            _id: pet._id,
            petTemplateId: pet.petTemplateId,
            name: petName.trim()
          }
        };
        localStorage.setItem('data', JSON.stringify(dataToSave));

        // Refresh pet data trong store
        await refreshPetData();

        toast.success("Đã đặt tên cho pet thành công!");

        // Chuyển trang sang Room
        navigate('/room');
      } else {
        toast.error("Cập nhật tên pet thất bại!");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật tên pet!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Nền phía sau */}
      <div className={styles.confetti}></div>
      <div className={`${styles.blob} ${styles.blob1}`}></div>
      <div className={`${styles.blob} ${styles.blob2}`}></div>

      <div className={styles.revealContainer}>
        <div className={styles.titleSection}>
          <h1 className={styles.mainTitle}>Chào mừng thành viên mới!</h1>
          <p className={styles.subtitle}>Một tâm hồn nhỏ bé đã chọn kết nối với bạn.</p>
        </div>

        {/* Khung hiển thị pet */}
        <div className={styles.petShowcase}>
          <div className={styles.petGlow}></div>
          <img src={petImage} alt="Your new pet" className={styles.petImage} />

          <div className={styles.petInfoBadge}>
            <span className="material-symbols-rounded">stars</span>
            {templatePet?.name || 'Pet Bí Ẩn'}
          </div>
        </div>

        {/* Phần nhập tên */}
        <div className={styles.namingSection}>
          <label className={styles.nameLabel}>Bạn muốn gọi bé là gì?</label>
          <input
            type="text"
            className={styles.nameInput}
            placeholder="Nhập tên..."
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            maxLength={30}
          />
        </div>

        {/* Nút hành động */}
        <button
          className={styles.btnStart}
          onClick={handleStartJourney}
          disabled={!petName.trim() || loading}
        >
          <span className="material-symbols-rounded">favorite</span>
          {loading ? 'Đang lưu...' : 'Bắt đầu cuộc hành trình'}
        </button>
      </div>
    </div>
  );
}
