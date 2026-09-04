import React, { useState } from 'react';
import styles from './PetAvatarRig.module.css'; // Import đúng kiểu CSS Module

export const PetAvatarRig = ({ type, bodyImg, headImg, name }) => {
  const [animationState, setAnimationState] = useState('idle');

  const handlePetClick = (target) => {
    if (animationState !== 'idle') return;

    if (target === 'head') {
      setAnimationState('clicked');
      setTimeout(() => setAnimationState('idle'), 600);
    } else {
      setAnimationState('talking');
      setTimeout(() => setAnimationState('idle'), 1500);
    }
  };

  return (
    <div className={styles['pet-container']}>
      <div className={styles['pet-stage']}>
        {/* --- 1. LỚP THÂN (BODY BASE) --- */}
        <div
          className={`${styles['pet-body']} ${animationState === 'talking' ? styles['is-talking'] : ''}`}
          style={{ backgroundImage: `url(${bodyImg})` }}
          onClick={() => handlePetClick('body')}
        />

        {/* --- 2. LỚP ĐẦU (HEAD BASE) --- */}
        <div
          className={`${styles['pet-head']} ${animationState === 'clicked'
              ? (type === 'cat' ? styles['is-cat-tilted'] : styles['is-dog-shaken'])
              : styles['is-breathing']
            }`}
          style={{ backgroundImage: `url(${headImg})` }}
          onClick={() => handlePetClick('head')}
        />
      </div>

      {/* --- PHẦN HIỂN THỊ THÔNG TIN & HỘI THOẠI (UI DIALOGUE) --- */}
      <div className={styles['pet-info']}>
        <h3 className={styles['pet-name']}>{name}</h3>
        <p className={styles['pet-dialogue']}>
          {animationState === 'clicked' && (type === 'cat' ? "Meo! Đừng chọc vào đầu tớ!" : "Gâu! Đau đầu quá nhả ra đi!")}
          {animationState === 'talking' && "Đói bụng quá sen ơi, cho xin miếng bánh đi!"}
          {animationState === 'idle' && "Đang ngoan ngoãn chờ chơi cùng bạn..."}
        </p>
      </div>
    </div>
  );
};