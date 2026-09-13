import api from '../api/api';

const roomService = {
  /**
   * Gọi API bật/tắt đèn trong phòng ngủ
   * @param {string} userRoomId
   */
  toggleLight: async (userRoomId) => {
    const res = await api.post(`/rooms/${userRoomId}/toggle-light`);
    return res.data;
  },

  /**
   * Gọi API chuyển phòng hiện tại
   * @param {string} userRoomId
   */
  changeIsCurrentRoom: async (userRoomId) => {
    const res = await api.post(`/rooms/${userRoomId}/change-is-current-room`);
    return res.data;
  },
};

export default roomService;
