import { useState } from 'react';
import type { BusinessType } from '@/types';
import StepIndicator from './components/StepIndicator';
import Step1 from './components/Step1';
import Step2 from './components/Step2';
import Step3 from './components/Step3';
import Step4 from './components/Step4';

export default function SellerOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [businessType, setBusinessType] = useState<BusinessType>('individual');
  const [businessNumber, setBusinessNumber] = useState<string | null>(null);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0B0C10',
        color: 'white',
        fontFamily: "'MuseumCulturalFoundationClassic', sans-serif",
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
          <Step2
            onPrev={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 3 && (
          <Step3
            onPrev={() => setCurrentStep(2)}
            onNext={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 4 && (
          <Step4
            onPrev={() => setCurrentStep(3)}
            businessType={businessType}
            businessNumber={businessNumber}
          />
        )}
      </div>
    </div>
  );
}
