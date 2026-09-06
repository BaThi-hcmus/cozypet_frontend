import React, { useState, useRef } from 'react';
import styles from './PetOnboarding.module.css';

export default function PetOnboarding({ onNext, onSkip }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClickDropzone = () => {
    fileInputRef.current?.click();
  };

  const handleContinue = () => {
    if (onNext) {
      onNext(selectedFile);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={`${styles.ambientBlob} ${styles.blob1}`}></div>
      <div className={`${styles.ambientBlob} ${styles.blob2}`}></div>

      <main className={styles.onboardingContainer}>
        {/* Header Section */}
        <header className={styles.headerSection}>
          <div className={styles.badgeTag}>
            <span className="material-symbols-rounded">favorite</span>
            <span>Khoảnh khắc chữa lành</span>
          </div>

          <h1 className={styles.mainTitle}>
            <span>Gặp gỡ bạn nhỏ</span>
            <span className={`material-symbols-rounded ${styles.sparkleIcon}`}>auto_awesome</span>
          </h1>

          <p className={styles.subDescription}>
            Đây là không gian an toàn, dịu dàng và không phán xét. Hãy đưa người bạn nhỏ bốn chân hoặc biểu tượng bình yên của bạn vào thế giới này nhé.
          </p>
        </header>

        {/* Upload Dropzone Center Stage */}
        <section className={styles.uploadZoneWrapper}>
          <input
            type="file"
            ref={fileInputRef}
            className={styles.hiddenFileInput}
            accept="image/*"
            onChange={handleInputChange}
          />

          <div
            className={`${styles.uploadDropzone} ${isDragging ? styles.activeDrag : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClickDropzone}
          >
            {/* Decorative 4 Paw Toe Pads */}
            <div className={styles.pawWrapper}>
              <div className={`${styles.toePad} ${styles.toe1}`}>
                <div className={styles.toeInnerSmall}></div>
              </div>
              <div className={`${styles.toePad} ${styles.toe2}`}>
                <div className={styles.toeInnerLarge}></div>
              </div>
              <div className={`${styles.toePad} ${styles.toe3}`}>
                <div className={styles.toeInnerLarge}></div>
              </div>
              <div className={`${styles.toePad} ${styles.toe4}`}>
                <div className={styles.toeInnerSmall}></div>
              </div>
            </div>

            {/* Main Palm Pad */}
            <div className={styles.palmPad}>
              {previewUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={previewUrl} className={styles.previewImage} alt="Pet preview" />
                  <div className={styles.previewTitle}>Trông thật đáng yêu! ✨</div>
                  <div className={styles.previewFileName}>{selectedFile?.name}</div>
                  <div className={styles.browsePill} style={{ padding: '6px 14px', fontSize: '12px' }}>
                    Đổi ảnh khác
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.iconCircle}>
                    <span className="material-symbols-rounded">photo_camera</span>
                  </div>
                  <div className={styles.uploadPrimaryText}>Tải ảnh bạn nhỏ lên đây</div>
                  <p className={styles.uploadSecondaryText}>
                    Chạm để tải lên hoặc kéo thả bức ảnh đáng yêu nhất của thú cưng
                  </p>
                  <div className={styles.browsePill}>
                    <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>add_photo_alternate</span>
                    <span>Chọn từ thư viện</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Bottom Actions */}
        <footer className={styles.actionSection}>
          <button
            className={styles.continueButton}
            type="button"
            onClick={handleContinue}
          >
            <span>Bước tiếp theo</span>
            <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>arrow_forward</span>
          </button>

          <button
            className={styles.skipButton}
            type="button"
            onClick={onSkip}
          >
            Tạo bạn ảo ngẫu nhiên (để sau)
          </button>

          <div className={styles.safeSpaceFooter}>
            <span className="material-symbols-rounded">shield</span>
            <span>Không gian riêng tư • Mọi hình ảnh chỉ lưu trên máy bạn</span>
          </div>
        </footer>
      </main>
    </div>
  );
}