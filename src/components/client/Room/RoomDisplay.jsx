import React from 'react';
import styles from './RoomDisplay.module.css';

export default function RoomDisplay({ room, items }) {
  if (!room) return null;

  return (
    <div className={styles.pageWrapper}>
      {/* Ambient Background Effects */}
      <div className={`${styles.ambientBlob} ${styles.blob1}`}></div>
      <div className={`${styles.ambientBlob} ${styles.blob2}`}></div>
      <div className={`${styles.ambientBlob} ${styles.blob3}`}></div>

      {/* Main Room Container */}
      <main className={styles.roomContainer}>
        {/* Header Section */}
        <header className={styles.headerSection}>
          <div className={styles.roomBadge}>
            <span className="material-symbols-rounded">home</span>
            <span>Không gian của bé</span>
          </div>
          
          <h1 className={styles.roomTitle}>
            <span>{room.name}</span>
            <span className={`material-symbols-rounded ${styles.sparkleIcon}`}>auto_awesome</span>
          </h1>
          
          {room.description && (
            <p className={styles.roomDescription}>{room.description}</p>
          )}
        </header>

        {/* Room Canvas Area */}
        <section className={styles.roomCanvas}>
          {/* Background Image */}
          <div 
            className={styles.roomBackground}
            style={{ backgroundImage: `url(${room.background_url})` }}
          >
            {/* Floating Decorative Elements */}
            <div className={`${styles.floatingElement} ${styles.star1}`}>
              <span className="material-symbols-rounded">star</span>
            </div>
            <div className={`${styles.floatingElement} ${styles.star2}`}>
              <span className="material-symbols-rounded">star</span>
            </div>
            <div className={`${styles.floatingElement} ${styles.heart1}`}>
              <span className="material-symbols-rounded">favorite</span>
            </div>

            {/* Room Slots with Items */}
            {Object.entries(room.slots || {}).map(([slotId, slot]) => {
              const item = items[slotId];
              if (!item) return null;

              return (
                <div
                  key={slotId}
                  className={styles.itemSlot}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    zIndex: slot.zIndex || 1,
                    transform: `scale(${slot.scaleFactor || 1})`,
                  }}
                >
                  <div className={styles.itemContainer}>
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className={styles.itemImage}
                    />
                    <div className={styles.itemTooltip}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemCategory}>{item.category}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Interactive Controls */}
        <footer className={styles.controlsSection}>
          <div className={styles.controlsBadge}>
            <span className="material-symbols-rounded">touch_app</span>
            <span>Chạm vào đồ vật để tương tác</span>
          </div>
          
          <div className={styles.actionButtons}>
            <button className={styles.interactButton}>
              <span className="material-symbols-rounded">pets</span>
              <span>Chơi cùng bé</span>
            </button>
            <button className={styles.customizeButton}>
              <span className="material-symbols-rounded">palette</span>
              <span>Trang trí phòng</span>
            </button>
          </div>
        </footer>

        {/* Safe Space Footer */}
        <div className={styles.safeFooter}>
          <span className="material-symbols-rounded">spa</span>
          <span>Nơi bình yên cho người bạn nhỏ của bạn</span>
        </div>
      </main>
    </div>
  );
}
