import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [businessType, setBusinessType] = useState<BusinessType>('INDIVIDUAL');
  const [businessNumber, setBusinessNumber] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountData | null>(null);

  useEffect(() => {
    if (sellerStatus?.isSeller) {
      showToast({ message: '이미 판매자로 등록되어 있습니다.' });
      navigate('/');
    }
  }, [sellerStatus, navigate, showToast]);

  const hasExistingAccount = !!(accountData?.bankName && accountData?.accountNum);

  if (isLoading || isAccountLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        로딩 중...
      </div>
    );
  }

  if (sellerStatus?.isSeller) {
    return null;
  }

  return (
    <div
      style={{
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '40px',
        paddingBottom: '80px',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '720px' }}>
        <StepIndicator current={currentStep} />
        <hr style={{ borderColor: '#2C2C2E', marginBottom: '40px' }} />

        {currentStep === 1 && (
          <Step1
            onNext={() => setCurrentStep(2)}
            businessType={businessType}
            setBusinessType={setBusinessType}
            bizNumber={businessNumber}
            setBizNumber={setBusinessNumber}
          />
        )}

        {currentStep === 2 && (
          <Step2 onPrev={() => setCurrentStep(1)} onNext={() => setCurrentStep(3)} />
        )}

        {currentStep === 3 && (
          <Step3
            onPrev={() => setCurrentStep(2)}
            onNext={(data) => {
              setAccount(data);
              setCurrentStep(4);
            }}
            hasExistingAccount={hasExistingAccount}
            existingAccount={accountData ?? null}
          />
        )}

        {currentStep === 4 && (
          <Step4
            onPrev={() => setCurrentStep(3)}
            businessType={businessType}
            businessNumber={businessNumber}
            account={account}
          />
        )}
      </div>
    </div>
  );
}
