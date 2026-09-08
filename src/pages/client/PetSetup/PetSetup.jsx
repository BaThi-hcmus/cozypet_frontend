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

  const handleNextFromOnboarding = useCallback((file) => {
    if (!file) {
      toast.error('Vui lòng chọn ảnh pet trước khi tiếp tục!');
      return;
    }
    setPetFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStep(2);
  }, []);

  const handleSummonComplete = useCallback((resultData) => {
    setPetDataResult(resultData);
    setStep(3);
  }, []);

  const handleSummonError = useCallback((errorMessage) => {
    console.error("Triệu hồi thất bại:", errorMessage);
    toast.error(errorMessage || "Có lỗi xảy ra khi phân tích ảnh. Vui lòng thử lại!");
    setStep(1);
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