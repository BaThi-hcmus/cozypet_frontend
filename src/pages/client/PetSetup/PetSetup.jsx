import React, { useState, useCallback } from 'react';
import PetOnboarding from '../../../components/client/Pet/PetOnboarding';
import PetSummoning from '../../../components/client/Pet/PetSummoning';
import PetReveal from '../../../components/client/Pet/PetReveal';
import { toast } from 'react-toastify';

export default function PetSetup() {
  const [step, setStep] = useState(1);
  const [petFile, setPetFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [petDataResult, setPetDataResult] = useState(null);

  // user chọn ảnh pet rồi bấm tiếp tục để qua summoning pet
  const handleNextFromOnboarding = useCallback((file) => {
    if (!file) {
      toast.error('Vui lòng chọn ảnh pet trước khi tiếp tục!');
      return;
    }
    setPetFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStep(2);
  }, []);

  // gemini phân tích rồi trả ra kết quả => đưa qua bước reveal để show ảnh
  const handleSummonComplete = useCallback((resultData) => {
    setPetDataResult(resultData);
    setStep(3);
  }, []);

  // Lỗi ở bước phân tích của gemini
  const handleSummonError = useCallback((errorMessage) => {
    console.error("Triệu hồi thất bại:", errorMessage);
    toast.error(errorMessage || "Có lỗi xảy ra khi phân tích ảnh. Vui lòng thử lại!");
    setStep(1); // quay lại onboarding
  }, []);

  return (
    <>
      {step === 1 && (
        <PetOnboarding
          onNext={handleNextFromOnboarding}
        />
      )}

      {step === 2 && (
        <PetSummoning
          previewUrl={previewUrl}
          petFile={petFile}
          onSummonComplete={handleSummonComplete}
          onError={handleSummonError}
        />
      )}

      {step === 3 && (
        <PetReveal
          petData={petDataResult}
        />
      )}
    </>
  );
}