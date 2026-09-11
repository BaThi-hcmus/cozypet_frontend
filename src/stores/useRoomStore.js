import { create } from 'zustand';
import api from '../api/api';

const useRoomStore = create((set, get) => ({
  payload: null,
  loading: false,
  error: null,

  // Lấy toàn bộ thông tin (gọi /auth/me khi vào trang hoặc F5)
  fetchRoomData: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/auth/me');
      set({ payload: response.data.data, loading: false });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Không thể tải thông tin phòng';
      set({ error: errorMsg, loading: false });
      console.error('RoomStore fetch error:', err);
    }
  },

  // Cập nhật state decorations trong Zustand sau khi replace item thành công (không cần gọi lại /auth/me)
  replaceItemInStore: (userRoomId, slotKey, insertItemId) => {
    const currentPayload = get().payload;
    if (!currentPayload) return;

    const updatedUserRooms = (currentPayload.userRooms || []).map((ur) => {
      if (ur._id === userRoomId || ur.roomId === userRoomId || String(ur._id) === String(userRoomId)) {
        return {
          ...ur,
          decorations: {
            ...(ur.decorations || {}),
            [slotKey]: insertItemId,
          },
        };
      }
      return ur;
    });

    set({
      payload: {
        ...currentPayload,
        userRooms: updatedUserRooms,
      },
    });
  },
}));

export default useRoomStore;
