import React, { useState, useEffect } from 'react';
import RoomDisplay from '../../../components/client/Room/RoomDisplay';
import api from '../../../api/api';

export default function Room() {
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await api.get('/room/default');
        setRoomData(response.data.data);
      } catch (err) {
        setError('Không thể tải dữ liệu phòng');
        console.error('Room fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-sparkle">
          <span className="material-symbols-rounded">auto_awesome</span>
        </div>
        <p>Đang chuẩn bị không gian ấm áp...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <span className="material-symbols-rounded">error</span>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="room-page">
      <RoomDisplay 
        room={roomData.roomDefault}
        items={roomData.itemsDefault}
      />
    </div>
  );
}
