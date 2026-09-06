import React from 'react';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.headerGreeting}>Xin chào, Admin Thi! 🐾</div>

      <div className={styles.headerActions}>
        <div className={styles.searchBox}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
          <input placeholder="Tìm kiếm pet, phòng..." type="text" />
        </div>

        <button className={styles.iconBtn}>
          <span className="material-symbols-outlined">notifications</span>
          <span className={styles.badge}></span>
        </button>

        <button className={styles.iconBtn}>
          <span className="material-symbols-outlined">chat_bubble</span>
        </button>

        <div className={styles.avatar}>
          <img alt="Admin Thi" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3WJ7dIHTJfDa68j44LgyiZ3kt1yWzRooUTHZW6BYBYJqFSQ_D9ueecCPuGQXapeLb-d8-_ZQ3AJjChUIF0zhyxjzuSGh4BP19dA6gQUe1t7f0mVDZt8AkhXSkBe69ujafNnoYLALbM7PsTgrr_0rYu9cvh2-3KTokjTOlTIBG6ae9nibGYG2PHQb0Fypf09CEbTEkRg5KvR_mqDY3BJ2ZcTiPUidimMvIxHdWKVxowXeoJT9S9U_9" />
        </div>
      </div>
    </header>
  );
};

export default Header;