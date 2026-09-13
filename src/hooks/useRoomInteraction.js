import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import roomService from '../services/roomService';
import useRoomStore from '../stores/useRoomStore';

/**
 * Custom hook quản lý tương tác vật phẩm trong phòng.
 * Kết nối: dữ liệu phòng (Zustand) ↔ state giao diện (hiệu ứng) ↔ API (roomService)
 *
 * @param {object} params
 * @param {object} params.room           - Room hiện tại
 * @param {object} params.currentUserRoom - UserRoom hiện tại (chứa _id, isLightOn, ...)
 */
export function useRoomInteraction({ room, currentUserRoom }) {
  // ── State giao diện ──────────────────────────────────────────────
  // Trạng thái đèn trong phòng ngủ: lấy giá trị ban đầu từ DB
  const [isLightOn, setIsLightOn] = useState(
    currentUserRoom?.isLightOn ?? false
  );
  const [isTogglingLight, setIsTogglingLight] = useState(false);

  // Zustand action để cập nhật isLightOn về store (giữ đồng bộ)
  const updateLightInStore = useRoomStore((state) => state.updateLightInStore);

  // ── Helpers ──────────────────────────────────────────────────────
  /**
   * Kiểm tra xem item có phải là "đèn ngủ" trong phòng ngủ không
   * Điều kiện: roomCode === 'BED_ROOM', type === 'furniture', category === 'nightlight'
   */
  const isNightlight = useCallback(
    (item) => {
      if (!item) return false;
      return (
        room?.code === 'BED_ROOM' &&
        item.type === 'furniture' &&
        item.category === 'nightlight'
      );
    },
    [room?.code]
  );

  // ── Actions ──────────────────────────────────────────────────────
  /**
   * Xử lý toggle đèn ngủ:
   * - Cập nhật UI ngay lập tức (optimistic)
   * - Gọi API backend
   * - Rollback nếu có lỗi
   */
  const handleToggleLight = useCallback(async () => {
    if (!currentUserRoom?._id) return;
    if (isTogglingLight) return; // tránh click liên tục

    const prevState = isLightOn;
    const nextState = !isLightOn;

    // Optimistic UI update
    setIsLightOn(nextState);
    setIsTogglingLight(true);

    try {
      await roomService.toggleLight(currentUserRoom._id);
      // Cập nhật vào Zustand store để đồng bộ
      if (updateLightInStore) {
        updateLightInStore(currentUserRoom._id, nextState);
      }
    } catch (err) {
      console.error('Lỗi toggle đèn:', err);
      toast.error('Không thể bật/tắt đèn lúc này');
      // Rollback UI
      setIsLightOn(prevState);
    } finally {
      setIsTogglingLight(false);
    }
  }, [currentUserRoom, isLightOn, isTogglingLight, updateLightInStore]);

  const handleItemInteraction = useCallback(
    (item) => {
      console.log('[handleItemInteraction] item:', item?.name, '| isNightlight:', isNightlight(item));
      if (isNightlight(item)) {
        handleToggleLight();
        return true;
      }
      return false;
    },
    [isNightlight, handleToggleLight]
  );


  return {
    // State
    isLightOn,
    isTogglingLight,

    // Actions
    handleItemInteraction,
    handleToggleLight,

    // Helpers
    isNightlight,
  };
}
