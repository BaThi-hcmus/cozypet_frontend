import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PetReveal.module.css';

export default function PetReveal({ petTemplate }) {
  const navigate = useNavigate();
  const [petName, setPetName] = useState('');

  // Lấy ảnh hiển thị: ưu tiên avatar hoặc lấy fallback
  const petImage = petTemplate?.avatar || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

  const handleStartJourney = () => {
    if (!petName.trim()) {
      alert("Vui lòng nhập tên cho bé nha!");
      return;
    }

    // Lưu vào localStorage
    const dataToSave = {
      pet: {
        petTemplateId: petTemplate?._id || petTemplate?.templateId || '',
        name: petName.trim()
      }
    };
    localStorage.setItem('data', JSON.stringify(dataToSave));

    // Chuyển trang sang Room
    // navigate('/room'); // Đảm bảo App.jsx có route này hoặc sẽ thêm sau
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
            {petTemplate?.name || 'Pet Bí Ẩn'}
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
          disabled={!petName.trim()}
        >
          <span className="material-symbols-rounded">favorite</span>
          Bắt đầu cuộc hành trình
        </button>
      </div>
    </div>
  );
}
