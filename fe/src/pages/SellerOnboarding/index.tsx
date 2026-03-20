import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/components/common/Toast';
import type { AccountData, BusinessType } from '@/types';
import { useGetSellerStatus } from '@/api/hooks/useGetSellerStatus';
import { useGetAccount } from '@/api/hooks/useGetAccount';
import Step1 from '@/components/SellerOnboarding/Step1';
import StepIndicator from '@/components/SellerOnboarding/StepIndicator';
import Step2 from '@/components/SellerOnboarding/Step2';
import Step3 from '@/components/SellerOnboarding/Step3';
import Step4 from '@/components/SellerOnboarding/Step4';

export default function SellerOnboardingPage() {
  const navigate = useNavigate();
  const { data: sellerStatus, isLoading } = useGetSellerStatus();
  const { data: accountData, isLoading: isAccountLoading } = useGetAccount();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [businessType, setBusinessType] = useState<BusinessType>('INDIVIDUAL');
  const [businessNumber, setBusinessNumber] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountData | null>(null);

  const goToStep = (next: number) => {
    setDirection(next > currentStep ? 1 : -1);
    setCurrentStep(next);
  };

  useEffect(() => {
    if (sellerStatus?.isSeller) {
      showToast({ message: '이미 판매자로 등록되어 있습니다.' });
      navigate('/');
    }
  }, [sellerStatus, navigate, showToast]);

  const hasExistingAccount = !!(accountData?.bankName && accountData?.accountNum);

  if (isLoading || isAccountLoading) {
    return (
      <div className="flex items-center justify-center text-neutral-200">
        로딩 중...
      </div>
    );
  }

  if (sellerStatus?.isSeller) {
    return null;
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1
            onNext={() => goToStep(2)}
            businessType={businessType}
            setBusinessType={setBusinessType}
            bizNumber={businessNumber}
            setBizNumber={setBusinessNumber}
          />
        );
      case 2:
        return <Step2 onPrev={() => goToStep(1)} onNext={() => goToStep(3)} />;
      case 3:
        return (
          <Step3
            onPrev={() => goToStep(2)}
            onNext={(data) => {
              setAccount(data);
              goToStep(4);
            }}
            hasExistingAccount={hasExistingAccount}
            existingAccount={accountData ?? null}
          />
        );
      case 4:
        return (
          <Step4
            onPrev={() => goToStep(3)}
            businessType={businessType}
            businessNumber={businessNumber}
            account={account}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="text-neutral-200 flex flex-col items-center pt-16 pb-20 px-6">
      <div className="w-full max-w-[1100px]">
        <StepIndicator current={currentStep} />
        <hr className="border-neutral-800 mb-12" />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
