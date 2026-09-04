import React, { useState } from 'react';
import './PetAvatarRig.css'; // Chứa các đoạn keyframes animation CSS (thở, ngả đầu, lắc đầu)

// type: Phân loại loài để áp dụng hiệu ứng chuyển động riêng (Mèo hoặc Chó)
// bodyImg: Đường dẫn URL ảnh phần thân của pet
// headImg: Đường dẫn URL ảnh phần đầu của pet
// Tên của con pet hiển thị bên dưới
export const PetAvatarRig = ({ type, bodyImg, headImg, name }) => {
  // Quản lý trạng thái chuyển động hiện tại của pet (idle: đứng yên, clicked: bị chọc đầu, talking: đang nói chuyện/chạm bụng)
  const [animationState, setAnimationState] = useState < 'idle' | 'clicked' | 'talking' > ('idle');

  /**
   * Hàm xử lý tương tác khi User click vào các bộ phận của Pet
   * @param target - Xác định người dùng bấm vào 'head' (đầu) hay 'body' (thân/bụng)
   */
  const handlePetClick = (target) => {
    // Nếu pet đang trong một hoạt ảnh khác, bỏ qua lượt click để tránh xung đột trạng thái
    if (animationState !== 'idle') return;

    if (target === 'head') {
      // Hành động: User chọc vào đầu pet -> Kích hoạt hiệu ứng ngả đầu/lắc đầu
      setAnimationState('clicked');

      // Sau 600ms (khớp với thời gian chạy keyframe CSS), tự động đưa pet về trạng thái đứng yên ban đầu
      setTimeout(() => setAnimationState('idle'), 600);
    } else {
      // Hành động: User chạm vào thân/bụng pet -> Kích hoạt hiệu ứng nhún nhảy (giả lập đang nói/đói)
      setAnimationState('talking');

      // Sau 1500ms, đưa pet về trạng thái bình thường
      setTimeout(() => setAnimationState('idle'), 1500);
    }
  };

  return (
    // Khung chứa tổng thể, vô hiệu hóa việc bôi đen văn bản (select-none) để trải nghiệm giống game thực thụ
    <div className="flex flex-col items-center justify-center p-6 select-none">

      {/* Khung hiển thị đồ họa nhân vật (Canvas container) */}
      <div className="relative w-72 h-72 flex items-center justify-center cursor-pointer">

        {/* --- 1. LỚP THÂN (BODY BASE) --- */}
        <div
          className={`absolute bottom-0 w-48 h-48 bg-cover bg-center transition-transform duration-300 ${
            // Nếu pet ở trạng thái 'talking' (click vào bụng), thân sẽ nhún nhảy liên tục (animate-bounce)
            animationState === 'talking' ? 'animate-bounce' : ''
            }`}
          style={{ backgroundImage: `url(${bodyImg})` }}
          // Khi User click vào vùng thân/bụng của pet
          onClick={() => handlePetClick('body')}
        />

        {/* --- 2. LỚP ĐẦU (HEAD BASE) --- */}
        <div
          // origin-bottom: Đặt tâm xoay của đầu nằm ở vùng cổ dưới để khi ngả đầu trông tự nhiên không bị gãy khúc
          className={`absolute top-4 w-40 h-40 bg-cover bg-center origin-bottom transition-all duration-300 ${animationState === 'clicked'
            ? (type === 'cat' ? 'animate-cat-head-tilt' : 'animate-dog-head-shake') // Nếu bị click đầu: Mèo ngả đầu, Chó lắc đầu
            : 'animate-idle-breathing' // Mặc định khi đứng yên: Thở phập phồng nhẹ
            }`}
          style={{ backgroundImage: `url(${headImg})` }}
          // Khi User click vào vùng đầu của pet
          onClick={() => handlePetClick('head')}
        />

      </div>

      {/* --- PHẦN HIỂN THỊ THÔNG TIN & HỘI THOẠI (UI DIALOGUE) --- */}
      <div className="mt-4 text-center">
        {/* Tên con pet */}
        <h3 className="text-xl font-bold text-gray-800">{name}</h3>

        {/* Hộp trạng thái cảm xúc phản hồi theo hành động của User */}
        <p className="text-sm text-gray-500 h-6">
          {/* Hiển thị khi User vừa click vào đầu pet */}
          {animationState === 'clicked' && (type === 'cat' ? "Meo! Đừng chọc vào đầu tớ!" : "Gâu! Đau đầu quá nhả ra đi!")}

          {/* Hiển thị khi User click vào bụng/thân pet */}
          {animationState === 'talking' && "Đói bụng quá sen ơi, cho xin miếng bánh đi!"}

          {/* Hiển thị trạng thái rảnh rỗi mặc định */}
          {animationState === 'idle' && "Đang ngoan ngoãn chờ chơi cùng bạn..."}
        </p>
      </div>

    </div>
  );
};