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

  // Chuyển đổi phòng
  switchRoom: async (roomCode) => {
    const currentPayload = get().payload;
    if (!currentPayload) return;

    const existingRoom = (currentPayload.rooms || []).find((r) => r.code === roomCode);

    if (existingRoom) {
      // Đã có room, chỉ cần cập nhật isCurrent
      const updatedUserRooms = (currentPayload.userRooms || []).map((ur) => ({
        ...ur,
        isCurrent: String(ur.roomId) === String(existingRoom._id)
      }));

      // Gọi API cập nhật DB
      const targetUserRoom = (currentPayload.userRooms || []).find((ur) => String(ur.roomId) === String(existingRoom._id));
      if (targetUserRoom) {
        api.post(`/rooms/${targetUserRoom._id}/change-is-current-room`).catch(err => {
          console.error('Lỗi khi lưu trạng thái phòng hiện tại:', err);
        });
      }

      set({
        payload: {
          ...currentPayload,
          userRooms: updatedUserRooms,
        },
      });
    } else {
      // Chưa có room, gọi api để lấy và tạo
      try {
        set({ loading: true });
        const res = await api.get(`/rooms/${roomCode}`);
        const { room, userRoom, items, userItems } = res.data.data;

        // Merge dữ liệu mới vào payload
        const updatedRooms = [...(currentPayload.rooms || []), room];
        
        // Cập nhật isCurrent cho userRoom mới và set false cho các userRoom cũ
        const updatedUserRooms = (currentPayload.userRooms || []).map((ur) => ({
          ...ur,
          isCurrent: false
        }));
        updatedUserRooms.push({ ...userRoom, isCurrent: true });

        // Cập nhật items và userItems nếu có item mới
        const currentItemIds = new Set((currentPayload.items || []).map(i => String(i._id)));
        const newItemsToAdd = (items || []).filter(i => !currentItemIds.has(String(i._id)));
        const updatedItems = [...(currentPayload.items || []), ...newItemsToAdd];

        const currentUserItemIds = new Set((currentPayload.userItems || []).map(ui => String(ui._id)));
        const newUserItemsToAdd = (userItems || []).filter(ui => !currentUserItemIds.has(String(ui._id)));
        const updatedUserItems = [...(currentPayload.userItems || []), ...newUserItemsToAdd];

        set({
          loading: false,
          payload: {
            ...currentPayload,
            rooms: updatedRooms,
            userRooms: updatedUserRooms,
            items: updatedItems,
            userItems: updatedUserItems,
          }
        });
      } catch (err) {
        console.error('Lỗi khi chuyển phòng:', err);
        set({ loading: false });
      }
    }
  },
}));

export default useRoomStore;
