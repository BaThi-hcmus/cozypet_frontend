/**
 * petAnimations.js — Hệ thống Spring Animation cho Virtual Pet
 *
 * Cung cấp vật lý lò xo tắt dần (damped spring oscillation) để tạo
 * hiệu ứng chuyển động tự nhiên cho tất cả 7 bộ phận của pet.
 *
 * Công thức cốt lõi:
 *   value(t) = amplitude × e^(-decay × t) × sin(frequency × t)
 */

// ============================================================================
// CORE PHYSICS
// ============================================================================

/**
 * Hàm dao động lò xo tắt dần — Trả về giá trị từ -amplitude đến +amplitude,
 * biên độ giảm dần theo thời gian và tự nhiên dừng lại.
 *
 * @param {number} elapsed  - Thời gian đã trôi qua (giây)
 * @param {number} amplitude - Biên độ ban đầu (mạnh nhất lúc t=0)
 * @param {number} frequency - Tần số dao động (rad/s)
 * @param {number} decay     - Hệ số tắt dần (càng lớn → dừng càng nhanh)
 * @returns {number}
 */
export function dampedSpring(elapsed, amplitude, frequency, decay) {
  if (elapsed < 0) return 0;
  return amplitude * Math.exp(-decay * elapsed) * Math.sin(frequency * elapsed);
}

/**
 * Hàm dao động lò xo tắt dần (phiên bản cos — bắt đầu từ đỉnh thay vì 0)
 */
export function dampedSpringCos(elapsed, amplitude, frequency, decay) {
  if (elapsed < 0) return 0;
  return amplitude * Math.exp(-decay * elapsed) * Math.cos(frequency * elapsed);
}

/**
 * Kiểm tra xem spring đã gần tắt hết chưa (biên độ < ngưỡng)
 * → Dùng để tự kết thúc animation state mà không cần setTimeout cứng
 */
export function isSpringSettled(elapsed, amplitude, decay, threshold = 0.5) {
  return amplitude * Math.exp(-decay * elapsed) < threshold;
}

// ============================================================================
// IDLE ANIMATION — Hiệu ứng "sống" khi pet đứng yên
// ============================================================================

/**
 * Tính toán offset idle cho từng bộ phận.
 * Mỗi part có pha (phase) khác nhau để trông tự nhiên, không đồng bộ máy móc.
 *
 * @param {string} partKey - Tên bộ phận (head, body, leftArm, ...)
 * @param {number} time    - Date.now() / 1000 (giây tuyệt đối)
 * @param {string} petType - 'cat' hoặc 'dog'
 * @returns {{ rotation: number, translateY: number, scaleMultiplier: number }}
 */
export function getIdleOffsets(partKey, time, petType) {
  const result = { rotation: 0, translateY: 0, scaleMultiplier: 1 };

  // Tốc độ cơ bản (chó hơi nhanh hơn mèo — hiếu động hơn)
  const speed = petType === 'dog' ? 1.15 : 1.0;

  switch (partKey) {
    case 'head':
      // Đầu hơi gật lên xuống nhẹ nhàng, hơi nghiêng
      result.translateY = Math.sin(time * 1.8 * speed) * 1.5;
      result.rotation = Math.sin(time * 0.9 * speed + 0.5) * 0.8;
      break;

    case 'body':
      // Thân thở phập phồng — dao động scale rất nhẹ + bob lên xuống
      result.translateY = Math.sin(time * 1.8 * speed + 0.3) * 1.0;
      result.scaleMultiplier = 1 + Math.sin(time * 1.8 * speed) * 0.005;
      break;

    case 'leftArm':
      // Tay trái lắc nhẹ ngược pha với tay phải
      result.rotation = Math.sin(time * 1.2 * speed + 1.0) * 1.5;
      result.translateY = Math.sin(time * 1.8 * speed + 0.5) * 0.8;
      break;

    case 'rightArm':
      // Tay phải lắc nhẹ ngược pha tay trái
      result.rotation = Math.sin(time * 1.2 * speed + 4.0) * 1.5;
      result.translateY = Math.sin(time * 1.8 * speed + 0.5) * 0.8;
      break;

    case 'leftLeg':
      // Chân gần như đứng yên, chỉ hơi rung theo thân
      result.translateY = Math.sin(time * 1.8 * speed + 0.3) * 0.3;
      break;

    case 'rightLeg':
      result.translateY = Math.sin(time * 1.8 * speed + 0.3) * 0.3;
      break;

    case 'tail':
      // Đuôi ve vẩy liên tục — hiệu ứng đặc trưng nhất
      if (petType === 'dog') {
        // Chó vẫy đuôi nhanh và rộng hơn
        result.rotation = Math.sin(time * 4.5) * 8 + Math.sin(time * 7) * 2;
      } else {
        // Mèo nhẹ nhàng, uốn éo hơn
        result.rotation = Math.sin(time * 2.0) * 5 + Math.sin(time * 3.5) * 1.5;
      }
      break;
  }

  return result;
}

// ============================================================================
// REACTION ANIMATIONS — Hiệu ứng khi tương tác (click)
// ============================================================================

/**
 * Tính offset phản ứng khi click vào ĐẦU pet.
 * Sử dụng damped spring để lắc mạnh rồi tắt dần tự nhiên.
 *
 * @param {string} partKey  - Tên bộ phận
 * @param {number} elapsed  - Thời gian kể từ lúc click (giây)
 * @param {string} petType  - 'cat' hoặc 'dog'
 * @returns {{ rotation: number, translateY: number, scaleMultiplier: number }}
 */
export function getHeadClickOffsets(partKey, elapsed, petType) {
  const result = { rotation: 0, translateY: 0, scaleMultiplier: 1 };

  switch (partKey) {
    case 'head':
      if (petType === 'cat') {
        // Mèo: ngả đầu sang bên rồi quay về — mềm mại, kiêu kỳ
        result.rotation = dampedSpring(elapsed, 12, 10, 3.5);
        result.translateY = dampedSpring(elapsed, -3, 8, 4);
      } else {
        // Chó: lắc đầu nhanh hơn, phấn khích hơn
        result.rotation = dampedSpring(elapsed, 15, 14, 3.0);
        result.translateY = dampedSpring(elapsed, -2, 10, 3.5);
        result.scaleMultiplier = 1 + dampedSpringCos(elapsed, 0.03, 12, 4);
      }
      break;

    case 'body':
      // Thân rung nhẹ phản lực từ đầu
      result.translateY = dampedSpring(elapsed - 0.04, 1.5, 8, 5);
      break;

    case 'leftArm':
      // Tay giơ lên phản xạ (trễ một chút so với đầu)
      result.rotation = dampedSpring(elapsed - 0.06, -6, 8, 4);
      result.translateY = dampedSpring(elapsed - 0.06, -2.5, 6, 4);
      break;

    case 'rightArm':
      result.rotation = dampedSpring(elapsed - 0.06, 6, 8, 4);
      result.translateY = dampedSpring(elapsed - 0.06, -2.5, 6, 4);
      break;

    case 'leftLeg':
    case 'rightLeg':
      // Chân rung rất nhẹ — cảm giác truyền lực qua cơ thể
      result.translateY = dampedSpring(elapsed - 0.08, 0.8, 6, 6);
      break;

    case 'tail':
      // Đuôi quẫy nhanh khi bị chọc đầu
      if (petType === 'dog') {
        result.rotation = dampedSpring(elapsed, 18, 16, 2.5);
      } else {
        result.rotation = dampedSpring(elapsed, 10, 10, 3);
      }
      break;
  }

  return result;
}

/**
 * Tính offset phản ứng khi click vào THÂN pet (talking/đói bụng).
 * Hiệu ứng nhún nhảy phấn khích rồi lắng xuống.
 */
export function getBodyClickOffsets(partKey, elapsed, petType) {
  const result = { rotation: 0, translateY: 0, scaleMultiplier: 1 };

  switch (partKey) {
    case 'head':
      // Đầu gật theo nhịp nhún
      result.translateY = dampedSpring(elapsed, -5, 9, 2.0);
      result.rotation = dampedSpring(elapsed, 3, 6, 2.5);
      break;

    case 'body':
      // Thân nhún mạnh rồi tắt dần — hiệu ứng chính
      result.translateY = dampedSpring(elapsed, -10, 10, 1.8);
      result.scaleMultiplier = 1 + dampedSpringCos(elapsed, 0.02, 10, 2.5);
      break;

    case 'leftArm':
      // Tay vung theo nhịp nhún (trễ pha)
      result.rotation = dampedSpring(elapsed - 0.05, -8, 9, 2.5);
      result.translateY = dampedSpring(elapsed - 0.03, -4, 9, 2.0);
      break;

    case 'rightArm':
      result.rotation = dampedSpring(elapsed - 0.05, 8, 9, 2.5);
      result.translateY = dampedSpring(elapsed - 0.03, -4, 9, 2.0);
      break;

    case 'leftLeg':
      // Chân co nhẹ theo nhún
      result.translateY = dampedSpring(elapsed - 0.06, -2, 8, 3);
      break;

    case 'rightLeg':
      result.translateY = dampedSpring(elapsed - 0.06, -2, 8, 3);
      break;

    case 'tail':
      // Đuôi quẫy vui
      if (petType === 'dog') {
        result.rotation = dampedSpring(elapsed, 20, 14, 1.8);
      } else {
        result.rotation = dampedSpring(elapsed, 12, 8, 2.0);
      }
      break;
  }

  return result;
}

// ============================================================================
// MAIN DISPATCHER
// ============================================================================

/**
 * Hàm tổng hợp: Trả về offset animation hoàn chỉnh cho một bộ phận,
 * bao gồm cả idle + reaction nếu đang trong trạng thái tương tác.
 *
 * @param {string} partKey    - Tên bộ phận
 * @param {string} animState  - 'idle' | 'headClick' | 'bodyClick'
 * @param {number} time       - Date.now() / 1000
 * @param {number} elapsed    - Thời gian từ lúc bắt đầu reaction (giây), 0 nếu idle
 * @param {string} petType    - 'cat' | 'dog'
 * @returns {{ rotation: number, translateY: number, scaleMultiplier: number }}
 */
export function getPartAnimationOffsets(partKey, animState, time, elapsed, petType) {
  // Luôn có idle (nền)
  const idle = getIdleOffsets(partKey, time, petType);

  if (animState === 'headClick') {
    const reaction = getHeadClickOffsets(partKey, elapsed, petType);
    return {
      rotation: idle.rotation + reaction.rotation,
      translateY: idle.translateY + reaction.translateY,
      scaleMultiplier: idle.scaleMultiplier * reaction.scaleMultiplier,
    };
  }

  if (animState === 'bodyClick') {
    const reaction = getBodyClickOffsets(partKey, elapsed, petType);
    return {
      rotation: idle.rotation + reaction.rotation,
      translateY: idle.translateY + reaction.translateY,
      scaleMultiplier: idle.scaleMultiplier * reaction.scaleMultiplier,
    };
  }

  // Default: chỉ idle
  return idle;
}

// ============================================================================
// RENDERING HELPERS — Đồng bộ logic vẽ giữa RigEditor & PetAvatarRig
// ============================================================================

/**
 * Chuẩn hoá kích thước bộ phận với giới hạn MAX_PART_SIZE.
 * Dùng chung cho cả RigEditor và PetAvatarRig để đảm bảo khớp tọa độ.
 */
export function clampPartSize(naturalWidth, naturalHeight, maxSize = 800) {
  let w = naturalWidth || 200;
  let h = naturalHeight || 200;
  if (w > maxSize || h > maxSize) {
    const ratio = Math.max(w / maxSize, h / maxSize);
    w = w / ratio;
    h = h / ratio;
  }
  return { w, h };
}

/**
 * Tính tâm neo (origin offset) dựa trên transformOrigin string.
 * Tính từ kích thước GỐC (chưa scale) để khớp với RigEditor.
 *
 * @param {number} w      - Chiều rộng (đã clamp, CHƯA scale)
 * @param {number} h      - Chiều cao (đã clamp, CHƯA scale)
 * @param {string} origin - Ví dụ: 'center', 'bottom center', 'top left'
 * @returns {{ ox: number, oy: number }}
 */
export function calcOriginOffset(w, h, origin = 'center') {
  let ox = w / 2;
  let oy = h / 2;
  if (origin.includes('top')) oy = 0;
  if (origin.includes('bottom')) oy = h;
  if (origin.includes('left')) ox = 0;
  if (origin.includes('right')) ox = w;
  return { ox, oy };
}

/**
 * Thời gian tối đa (giây) mà các reaction animation cần để tắt hết.
 * Dùng làm fallback timeout.
 */
export const MAX_REACTION_DURATION = 2.5;
