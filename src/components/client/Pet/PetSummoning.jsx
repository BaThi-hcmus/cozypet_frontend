import React, { useState, useEffect, useRef } from 'react';
import styles from './PetSummoning.module.css';
import api from '../../../api/api';
import useAuthStore from '../../../stores/useAuthStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const statuses = [
  {
    title: "Đang kết nối tần số với bé...",
    subtitle: "Từng nhịp đập yêu thương đang được hòa quyện vào thế giới ảo",
    icon: "wifi_tethering",
    percent: 32
  },
  {
    title: "Lắng nghe câu chuyện ký ức...",
    subtitle: "Phân tích ánh mắt trong veo và dáng vẻ thân quen",
    icon: "hearing",
    percent: 54
  },
  {
    title: "Chuẩn bị không gian riêng cho hai bạn...",
    subtitle: "Rải những vệt nắng ấm và thảm cỏ mềm chào đón",
    icon: "cottage",
    percent: 78
  },
  {
    title: "Người bạn chữa lành sắp xuất hiện!",
    subtitle: "Sẵn sàng đón nhận chiếc ôm dịu dàng và ấm áp",
    icon: "celebration",
    percent: 96
  }
];

export default function PetSummoning({ previewUrl, petFile, onSummonComplete, onError }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [apiResult, setApiResult] = useState(null);
  const [apiDone, setApiDone] = useState(false);
  const [toastShown, setToastShown] = useState(false);
  const { accessToken } = useAuthStore();
  const navigate = useNavigate();
  const hasFiredCallback = useRef(false);
  const animationTimerRef = useRef(null);
  const finalStepRef = useRef(null);
  const watchdogRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const petImage = previewUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80";

  // ====== Gọi API phân tích ảnh ======
  // Chiến lược React 18 Safe: KHÔNG dùng Set/Ref "chặn 2 lần gọi", mà
  // để Strict Mode mount-unmount-mount bình thường. Lần đầu mount cleanup sẽ abort().
  // Lần mount thứ 2 (thực sự) mới chạy API thực và hoàn tất.
  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();

    // Check lỗi trước
    if (!accessToken) {
      toast.error('Bạn cần đăng nhập để tạo pet!');
      setTimeout(() => navigate('/login'), 1500);
      setApiResult({ error: 'Bạn cần đăng nhập để tạo pet!' });
      setApiDone(true);
      return;
    }
    if (!petFile) {
      setApiResult({ error: 'Vui lòng tải lên ảnh pet của bạn!' });
      setApiDone(true);
      return;
    }

    // Toast chỉ hiển thị 1 lần, thông báo đã bắt đầu gửi ảnh lên AI
    if (!toastShown) {
      toast.info('Đang gửi ảnh lên AI phân tích, xin vui lòng chờ...', { autoClose: 3000 });
      setToastShown(true);
    }

    const apiTimeoutId = setTimeout(() => {
      if (!cancelled && !apiDone) {
        abortController.abort();
      }
    }, 40000);

    const fetchReveal = async () => {
      try {
        const formData = new FormData();
        formData.append('image', petFile);

        const response = await api.post(`/pets/user-reveal`, formData, {
          signal: abortController.signal
        });

        if (cancelled) return;

        if (response.data) {
          setApiResult(response.data);
        } else {
          setApiResult({ error: response.data?.message || 'Có lỗi xảy ra khi phân tích ảnh' });
        }
      } catch (error) {
        // Bỏ qua lỗi abort (do StrictMode hoặc timeout)
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || error.name === 'AbortError') {
          return;
        }
        if (cancelled) return;

        let errorMessage = 'Có lỗi xảy ra khi phân tích ảnh';
        if (error.response?.status === 401) {
          errorMessage = 'Bạn cần đăng nhập để tạo pet!';
          toast.error(errorMessage);
          setTimeout(() => navigate('/login'), 1500);
        } else if (error.response?.status === 400) {
          errorMessage = error.response?.data?.message || 'Dữ liệu không hợp lệ (ảnh có thể không phải chó/mèo)';
          toast.error(errorMessage);
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
          toast.error(errorMessage);
        } else if (error.message) {
          errorMessage = error.message;
          toast.error(errorMessage);
        }

        setApiResult({ error: errorMessage });
      } finally {
        if (!cancelled) {
          clearTimeout(apiTimeoutId);
          setApiDone(true);
        }
      }
    };

    fetchReveal();

    return () => {
      cancelled = true;
      clearTimeout(apiTimeoutId);
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petFile]);

  // ====== WATCHDOG an toàn: nếu >50s apiDone vẫn false, bảo người dùng có lỗi ======
  useEffect(() => {
    startTimeRef.current = Date.now();
    watchdogRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      if (!apiDone && elapsed > 50) {
        clearInterval(watchdogRef.current);
        watchdogRef.current = null;
        if (!hasFiredCallback.current) {
          hasFiredCallback.current = true;
          toast.error('Hệ thống phản hồi quá lâu. Vui lòng F5 tải lại trang và thử lại!', { autoClose: 8000 });
          setApiResult({ error: 'Quá thời gian chờ' });
          if (onError) onError('Quá thời gian chờ, vui lòng tải lại trang và thử lại!');
        }
      } else if (!apiDone && elapsed > 25 && elapsed < 26) {
        toast.info('Đang phân tích chuyên sâu, xin hãy kiên nhẫn thêm chút nữa...', { autoClose: 4000 });
      }
    }, 2000);

    return () => {
      if (watchdogRef.current) {
        clearInterval(watchdogRef.current);
        watchdogRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== Vòng lặp animation status ======
  useEffect(() => {
    const runAnimationStep = () => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const nextIndex = prev + 1;
          if (nextIndex >= statuses.length) return prev;
          return nextIndex;
        });
        setIsFading(false);
      }, 350);
    };

    animationTimerRef.current = setInterval(runAnimationStep, 3200);

    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, []);

  // ====== Khi API xong -> nhảy nhanh đến step cuối ======
  useEffect(() => {
    if (!apiDone) return;

    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }

    const remainingSteps = (statuses.length - 1) - currentIndex;
    if (remainingSteps <= 0) return;

    let step = 0;
    finalStepRef.current = setInterval(() => {
      step++;
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next >= statuses.length) return statuses.length - 1;
          return next;
        });
        setIsFading(false);
      }, 200);

      if (step >= remainingSteps) {
        clearInterval(finalStepRef.current);
        finalStepRef.current = null;
      }
    }, 400);
  }, [apiDone, currentIndex]);

  // ====== Khi cả hai xong -> gọi callback component cha ======
  useEffect(() => {
    if (!(apiDone && currentIndex === statuses.length - 1)) return;
    if (hasFiredCallback.current) return;

    hasFiredCallback.current = true;

    setTimeout(() => {
      if (apiResult?.error) {
        if (onError) {
          onError(apiResult.error);
        }
      } else if (onSummonComplete) {
        toast.success('Phân tích thành công!', { autoClose: 1500 });
        onSummonComplete(apiResult);
      }
    }, 600);
  }, [apiDone, currentIndex, apiResult, onSummonComplete, onError]);

  const currentStatus = statuses[currentIndex];

  return (
    <div className={styles.pageWrapper}>
      <div className={`${styles.ambientBlob} ${styles.blob1}`}></div>
      <div className={`${styles.ambientBlob} ${styles.blob2}`}></div>

      <main className={styles.summoningContainer}>
        <div className={styles.badgeTag}>
          <span className={`material-symbols-rounded ${styles.spinIcon}`}>auto_awesome</span>
          <span>Đang triệu hồi linh hồn thú nhỏ</span>
        </div>

        <div className={styles.portalStage}>
          <div className={`${styles.pulseRing} ${styles.pulseRing1}`}></div>
          <div className={`${styles.pulseRing} ${styles.pulseRing2}`}></div>
          <div className={`${styles.pulseRing} ${styles.pulseRing3}`}></div>

          <div className={styles.magicAuraRing}></div>

          <div className={`${styles.sparkleParticle} ${styles.sparkle1}`}>
            <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>auto_awesome</span>
          </div>
          <div className={`${styles.sparkleParticle} ${styles.sparkle2}`}>
            <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>flare</span>
          </div>
          <div className={`${styles.sparkleParticle} ${styles.sparkle3}`}>
            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>star</span>
          </div>
          <div className={`${styles.sparkleParticle} ${styles.sparkle4}`}>
            <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>favorite</span>
          </div>

          <div className={styles.petAvatarCard}>
            <div className={styles.petAvatarInner}>
              <img src={petImage} alt="Người bạn nhỏ" className={styles.petImage} />
            </div>
            <div className={styles.pawBadge}>
              <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>pets</span>
            </div>
          </div>
        </div>

        <div className={styles.statusSection}>
          <h2
            className={`${styles.statusTitle} ${styles.fadeText}`}
            style={{
              opacity: isFading ? 0 : 1,
              transform: isFading ? 'translateY(6px)' : 'translateY(0)'
            }}
          >
            <span>{currentStatus.title}</span>
            <span className={`material-symbols-rounded ${styles.statusIcon}`}>{currentStatus.icon}</span>
          </h2>
          <p
            className={`${styles.statusSubtitle} ${styles.fadeText}`}
            style={{
              opacity: isFading ? 0 : 1,
              transform: isFading ? 'translateY(6px)' : 'translateY(0)'
            }}
          >
            {currentStatus.subtitle}
          </p>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressHeaderLabel}>
              <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>energy_savings_leaf</span>
              <span>Đồng điệu tâm hồn</span>
            </span>
            <span className={styles.progressPercent}>{currentStatus.percent}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.shimmerProgress}
              style={{ width: `${currentStatus.percent}%` }}
            ></div>
          </div>
        </div>

        <div className={styles.safeFooter}>
          <span className={`material-symbols-rounded ${styles.safeFooterIcon}`}>spa</span>
          <span>Hãy hít thở thật sâu trong giây lát bình yên này...</span>
        </div>
      </main>
    </div>
  );
}
