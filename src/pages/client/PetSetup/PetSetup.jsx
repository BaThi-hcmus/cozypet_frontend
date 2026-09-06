import React, { useState } from 'react';
import PetOnboarding from '../../../components/client/PetOnboarding/PetOnboarding';
import PetSummoning from '../../../components/client/PetSummoning/PetSummoning';

export default function PetSetup() {
  const [step, setStep] = useState(1); // 1: Trang tải ảnh, 2: Trang triệu hồi
  const [petFile, setPetFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Khi người dùng bấm nút "Bước tiếp theo" ở Trang 1
  const handleNextFromOnboarding = (file) => {
    setPetFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
    setStep(2); // Chuyển sang Trang 2
  };

  // Khi người dùng bấm "Tạo bạn ảo ngẫu nhiên" ở Trang 1
  const handleSkipOnboarding = () => {
    setPreviewUrl(null); // Dùng ảnh mặc định
    setStep(2); // Chuyển sang Trang 2
  };

  // Khi Trang 2 chạy xong tiến trình triệu hồi
  const handleSummonComplete = () => {
    console.log("Triệu hồi thành công! Chuyển sang màn hình chính của thú cưng...");
    // Ví dụ: chuyển sang step 3 hoặc chuyển trang router ở đây
  };

  return (
    <>
      {step === 1 && (
        <PetOnboarding
          onNext={handleNextFromOnboarding}
          onSkip={handleSkipOnboarding}
        />
      )}

      {step === 2 && (
        <PetSummoning
          previewUrl={previewUrl}
          onSummonComplete={handleSummonComplete}
        />
      )}
    </>
  );
}