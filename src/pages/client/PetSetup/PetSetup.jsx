import React, { useState } from 'react';
import PetOnboarding from '../../../components/client/PetOnboarding/PetOnboarding';
import PetSummoning from '../../../components/client/PetSummoning/PetSummoning';
import PetReveal from '../../../components/client/PetReveal/PetReveal';

export default function PetSetup() {
  const [step, setStep] = useState(1); // 1: Trang tải ảnh, 2: Trang triệu hồi, 3: Reveal
  const [petFile, setPetFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [petTemplateResult, setPetTemplateResult] = useState(null);

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
    setPetFile(null);
    setPreviewUrl(null); // Dùng ảnh mặc định
    setStep(2); // Chuyển sang Trang 2
  };

  // Khi Trang 2 chạy xong tiến trình triệu hồi
  const handleSummonComplete = (resultData) => {
    console.log("Triệu hồi thành công! Dữ liệu pet:", resultData);
    setPetTemplateResult(resultData);
    setStep(3);
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
          petFile={petFile}
          onSummonComplete={handleSummonComplete}
        />
      )}

      {step === 3 && (
        <PetReveal 
          petTemplate={petTemplateResult} 
        />
      )}
    </>
  );
}