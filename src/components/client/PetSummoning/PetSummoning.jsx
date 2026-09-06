import React, { useState, useEffect } from 'react';
import styles from './PetSummoning.module.css';

const statuses = [
  {
    title: "Đang kết nối tần số với bé...",
    subtitle: "Từng nhịp đập yêu thương đang được hòa quyện vào thế giới ảo",
    icon: "wifi_tethering",
    percent: 32
  },
  {
    title: "Lắng nghe câu chuyện ký ức...",
    subtitle: "Phân tích ánh mắt trong veo và dáng vẻ thân quen",
    icon: "hearing",
    percent: 54
  },
  {
    title: "Chuẩn bị không gian riêng cho hai bạn...",
    subtitle: "Rải những vệt nắng ấm và thảm cỏ mềm chào đón",
    icon: "cottage",
    percent: 78
  },
  {
    title: "Người bạn chữa lành sắp xuất hiện!",
    subtitle: "Sẵn sàng đón nhận chiếc ôm dịu dàng và ấm áp",
    icon: "celebration",
    percent: 96
  }
];

export default function PetSummoning({ previewUrl, onSummonComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // Fallback ảnh mẫu nếu chưa có ảnh
  const petImage = previewUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80";

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const nextIndex = prev + 1;
          if (nextIndex >= statuses.length) {
            if (onSummonComplete) onSummonComplete();
            return prev;
          }
          return nextIndex;
        });
        setIsFading(false);
      }, 350);
    }, 3200);

    return () => clearInterval(interval);
  }, [onSummonComplete]);

  const currentStatus = statuses[currentIndex];

  return (
    <div className={styles.pageWrapper}>
      {/* Ambient Decorative Background Blobs */}
      <div className={`${styles.ambientBlob} ${styles.blob1}`}></div>
      <div className={`${styles.ambientBlob} ${styles.blob2}`}></div>

      {/* Main Centered Glass Modal Card */}
      <main className={styles.summoningContainer}>
        {/* Top Healing Badge */}
        <div className={styles.badgeTag}>
          <span className={`material-symbols-rounded ${styles.spinIcon}`}>auto_awesome</span>
          <span>Đang triệu hồi linh hồn thú nhỏ</span>
        </div>

        {/* Central Magical Portal Stage */}
        <div className={styles.portalStage}>
          {/* Expanding Ripple Waves */}
          <div className={`${styles.pulseRing} ${styles.pulseRing1}`}></div>
          <div className={`${styles.pulseRing} ${styles.pulseRing2}`}></div>
          <div className={`${styles.pulseRing} ${styles.pulseRing3}`}></div>

          {/* Rotating Sacred Aura Ring */}
          <div className={styles.magicAuraRing}></div>

          {/* Floating Sparkles around Avatar */}
          <div className={`${styles.sparkleParticle} ${styles.sparkle1}`}>
            <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>auto_awesome</span>
          </div>
          <div className={`${styles.sparkleParticle} ${styles.sparkle2}`}>
            <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>flare</span>
          </div>
          <div className={`${styles.sparkleParticle} ${styles.sparkle3}`}>
            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>star</span>
          </div>
          <div className={`${styles.sparkleParticle} ${styles.sparkle4}`}>
            <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>favorite</span>
          </div>

          {/* Pet Avatar Card */}
          <div className={styles.petAvatarCard}>
            <div className={styles.petAvatarInner}>
              <img
                src={petImage}
                alt="Người bạn nhỏ"
                className={styles.petImage}
              />
            </div>

            {/* Mini Paw Badge */}
            <div className={styles.pawBadge}>
              <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>pets</span>
            </div>
          </div>
        </div>

        {/* Status Message Section */}
        <div className={styles.statusSection}>
          <h2
            className={`${styles.statusTitle} ${styles.fadeText}`}
            style={{
              opacity: isFading ? 0 : 1,
              transform: isFading ? 'translateY(6px)' : 'translateY(0)'
            }}
          >
            <span>{currentStatus.title}</span>
            <span className={`material-symbols-rounded ${styles.statusIcon}`}>{currentStatus.icon}</span>
          </h2>
          <p
            className={`${styles.statusSubtitle} ${styles.fadeText}`}
            style={{
              opacity: isFading ? 0 : 1,
              transform: isFading ? 'translateY(6px)' : 'translateY(0)'
            }}
          >
            {currentStatus.subtitle}
          </p>
        </div>

        {/* Healing Energy Progress Bar */}
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressHeaderLabel}>
              <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>energy_savings_leaf</span>
              <span>Đồng điệu tâm hồn</span>
            </span>
            <span className={styles.progressPercent}>{currentStatus.percent}%</span>
          </div>

          <div className={styles.progressTrack}>
            <div
              className={styles.shimmerProgress}
              style={{ width: `${currentStatus.percent}%` }}
            ></div>
          </div>
        </div>

        {/* Subtitle Safe Note */}
        <div className={styles.safeFooter}>
          <span className={`material-symbols-rounded ${styles.safeFooterIcon}`}>spa</span>
          <span>Hãy hít thở thật sâu trong giây lát bình yên này...</span>
        </div>
      </main>
    </div>
  );
}