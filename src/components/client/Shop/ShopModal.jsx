import React, { useState, useEffect } from 'react';
import styles from './ShopModal.module.css';
import api from '../../../api/api';

function toId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  return String(value);
}

export default function ShopModal({ isOpen, onClose, userInfo, currentRoom }) {
  const [activeTab, setActiveTab] = useState('rooms');
  const [allRooms, setAllRooms] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchShopData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [roomsRes, itemsRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/items'),
        ]);
        setAllRooms(roomsRes.data.data || []);
        setAllItems(itemsRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch shop data:', err);
        setError('Không thể tải dữ liệu shop');
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [isOpen]);

  if (!isOpen) return null;

  const userRooms = userInfo?.userRooms || [];
  const userItems = userInfo?.userItems || [];

  // Helper function to check room status
  const getRoomStatus = (room) => {
    const roomIdStr = toId(room._id);
    const isOwned = userRooms.some((ur) => toId(ur.roomId) === roomIdStr);
    const isEquipped =
      currentRoom && toId(currentRoom._id) === roomIdStr;

    if (isEquipped) {
      return 'equipped'; // Loại 3: sở hữu và đang trang bị
    } else if (isOwned) {
      return 'owned-unequipped'; // Loại 2: sở hữu nhưng không trang bị
    } else {
      return 'not-owned'; // Loại 1: chưa sở hữu
    }
  };

  // Helper function to check item status
  const getItemStatus = (item) => {
    const itemIdStr = toId(item._id);
    const isOwned = userItems.some((ui) => toId(ui.itemId) === itemIdStr);

    let isEquipped = false;
    const currentUserRoom =
      userRooms.find((ur) => ur.isCurrent) || userRooms[0];

    if (currentUserRoom && currentUserRoom.decorations) {
      isEquipped = Object.values(currentUserRoom.decorations).some((decRef) => {
        const decRefStr = toId(decRef);
        if (decRefStr === itemIdStr) return true;
        const matchedUserItem = userItems.find(
          (ui) => toId(ui._id) === decRefStr
        );
        if (matchedUserItem && toId(matchedUserItem.itemId) === itemIdStr)
          return true;
        return false;
      });
    }

    if (isEquipped) {
      return 'equipped'; // Loại 3: sở hữu và đang trang bị
    } else if (isOwned) {
      return 'owned-unequipped'; // Loại 2: sở hữu nhưng không trang bị
    } else {
      return 'not-owned'; // Loại 1: chưa sở hữu
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${
              activeTab === 'rooms' ? styles.active : ''
            }`}
            onClick={() => setActiveTab('rooms')}
          >
            Phòng
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === 'items' ? styles.active : ''
            }`}
            onClick={() => setActiveTab('items')}
          >
            Vật phẩm
          </button>
        </div>

        <div className={styles.tabContent}>
          {loading && (
            <div className={styles.stateMessage}>Đang tải danh sách...</div>
          )}
          {error && <div className={styles.stateError}>{error}</div>}

          {!loading && !error && activeTab === 'rooms' && (
            <div className={styles.grid}>
              {allRooms.map((room) => {
                const status = getRoomStatus(room);
                return (
                  <div
                    key={room._id}
                    className={`${styles.card} ${styles[status]}`}
                  >
                    <img
                      src={room.background_url}
                      alt={room.name}
                      className={styles.cardImage}
                    />
                    <div className={styles.cardInfo}>
                      <h3>{room.name}</h3>
                      <p>{room.description}</p>
                      {room.price !== undefined && (
                        <span className={styles.priceTag}>
                          💰 {room.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {status === 'not-owned' && (
                      <div className={styles.hoverAction}>
                        <span>Mua</span>
                      </div>
                    )}
                    {status === 'owned-unequipped' && (
                      <div className={styles.hoverAction}>
                        <span>Trang bị</span>
                      </div>
                    )}
                    {status === 'equipped' && (
                      <div className={styles.statusBadge}>
                        <span>Đang trang bị</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!loading && !error && activeTab === 'items' && (
            <div className={styles.grid}>
              {allItems.map((item) => {
                const status = getItemStatus(item);
                return (
                  <div
                    key={item._id}
                    className={`${styles.card} ${styles[status]}`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className={styles.cardImage}
                    />
                    <div className={styles.cardInfo}>
                      <h3>{item.name}</h3>
                      <p>{item.category || item.type || 'Vật phẩm'}</p>
                      {item.price !== undefined && (
                        <span className={styles.priceTag}>
                          💰 {item.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {status === 'not-owned' && (
                      <div className={styles.hoverAction}>
                        <span>Mua</span>
                      </div>
                    )}
                    {/* Loại 2 và 3: sở hữu nhưng không trang bị hoặc đang trang bị -> hover không hiện gì cả */}
                    {status === 'owned-unequipped' && (
                      <div className={styles.hoverAction} style={{ display: 'none' }}></div>
                    )}
                    {status === 'equipped' && (
                      <div className={styles.statusBadge}>
                        <span>Đang trang bị</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
