import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
        </div>
        <div className={styles.brandText}>
          <h1>CozyPet</h1>
          <p>Pet Care Admin</p>
        </div>
      </div>

      <nav className={styles.navMenu}>
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/accounts"
          className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <span className="material-symbols-outlined">pets</span>
          Accounts
        </NavLink>

        <NavLink
          to="/admin/pets"
          className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <span className="material-symbols-outlined">pets</span>
          Pets
        </NavLink>

        <NavLink
          to="/admin/items"
          className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <span className="material-symbols-outlined">category</span>
          Items
        </NavLink>

        <NavLink
          to="/admin/rooms"
          className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <span className="material-symbols-outlined">bedroom_parent</span>
          Rooms
        </NavLink>

        <NavLink
          to="/admin/settings"
          className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <span className="material-symbols-outlined">settings</span>
          Settings
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;