import React, { useState, useEffect, useMemo } from 'react';
import RoomDisplay from '../../../components/client/Room/RoomDisplay';
import ShopModal from '../../../components/client/Shop/ShopModal';
import api from '../../../api/api';
import styles from './Room.module.css';

const ROOM_CANVAS_SIZE = 1000;

function toId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  return String(value);
}

function buildPlacedItems(currentRoom, currentUserRoom, userItems, items) {
  const itemById = new Map((items || []).map((item) => [toId(item._id), item]));
  const userItemById = new Map((userItems || []).map((userItem) => [toId(userItem._id), userItem]));
  const decorations = currentUserRoom?.decorations || {};
  const placed = [];

  Object.entries(currentRoom?.slots || {}).forEach(([slotKey, slot]) => {
    if (!slot) return;

    let item = null;
    const decorationRef = decorations[slotKey];

    if (decorationRef) {
      const userItem = userItemById.get(toId(decorationRef));
      if (userItem) {
        item = itemById.get(toId(userItem.itemId));
      } else {
        item = itemById.get(toId(decorationRef));
      }
    }

    if (!item && slot.defaultItemId) {
      item = itemById.get(toId(slot.defaultItemId));
    }

    if (!item) return;

    placed.push({
      slotKey,
      slot,
      item,
    });
  });

  return placed.sort((a, b) => (a.slot.zIndex || 0) - (b.slot.zIndex || 0));
}

export default function Room() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShopModal, setShowShopModal] = useState(false);

  const fetchAllInfo = async () => {
    try {
      const response = await api.get('/auth/me');
      setPayload(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải không gian của bạn');
      console.error('Room fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllInfo();
  }, []);

  const scene = useMemo(() => {
    if (!payload) return null;

    const { profile, pets, petTemplates, userRooms, rooms, userItems, items } = payload;

    const currentUserRoom =
      (userRooms || []).find((userRoom) => userRoom.isCurrent) ||
      (userRooms || [])[0] ||
      null;

    const currentRoom = currentUserRoom
      ? (rooms || []).find((room) => toId(room._id) === toId(currentUserRoom.roomId))
      : null;

    const currentPet =
      (pets || []).find((pet) => pet.isCurrent) ||
      (pets || [])[0] ||
      null;

    const petTemplate = currentPet
      ? (petTemplates || []).find(
          (template) =>
            toId(template._id) === toId(currentPet.petTemplateId) ||
            template.templateId === currentPet.petTemplateId
        )
      : null;

    const placedItems = currentRoom
      ? buildPlacedItems(currentRoom, currentUserRoom, userItems, items)
      : [];

    return {
      profile,
      currentRoom,
      currentUserRoom,
      currentPet,
      petTemplate,
      placedItems,
      inventoryCount: (userItems || []).length,
    };
  }, [payload]);

  if (loading) {
    return (
      <div className={styles.stateScreen}>
        <span className={`material-symbols-outlined ${styles.stateIcon}`}>auto_awesome</span>
        <p>Đang chuẩn bị không gian ấm áp...</p>
      </div>
    );
  }

  if (error || !scene?.currentRoom) {
    return (
      <div className={styles.stateScreen}>
        <span className={`material-symbols-outlined ${styles.stateIconError}`}>cottage</span>
        <p>{error || 'Bạn chưa có phòng nào để hiển thị'}</p>
      </div>
    );
  }

  return (
    <>
      <RoomDisplay
        canvasSize={ROOM_CANVAS_SIZE}
        profile={scene.profile}
        room={scene.currentRoom}
        placedItems={scene.placedItems}
        pet={scene.currentPet}
        petTemplate={scene.petTemplate}
        inventoryCount={scene.inventoryCount}
        userInfo={payload}
        onRefresh={fetchAllInfo}
      />

      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}>
        <button
          onClick={() => setShowShopModal(true)}
          style={{
            background: 'linear-gradient(135deg, #6a5acd, #8a2be2)',
            color: '#fff',
            border: 'none',
            borderRadius: '50px',
            padding: '14px 28px',
            fontSize: '1.1em',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(106, 90, 205, 0.4)',
            display: 'flex',
            alignItem: 'center',
            gap: '8px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>storefront</span>
          Shop Cửa Hàng
        </button>
      </div>

      <ShopModal
        isOpen={showShopModal}
        onClose={() => setShowShopModal(false)}
        userInfo={payload}
        currentRoom={scene.currentRoom}
      />
    </>
  );
}
