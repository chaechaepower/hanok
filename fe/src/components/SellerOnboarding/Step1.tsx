import React, { useState } from 'react';
import { useCheckBusinessStatus } from '@/api/hooks/useGetbusinesspersonVerify';
import type { BusinessType } from '@/types';
import Button from '@/components/common/Button';

function BusinessTypeCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 h-36 rounded-xl text-xl font-bold transition-all duration-200 cursor-pointer border
        ${
          selected
            ? 'bg-warm/10 border-warm text-warm'
            : 'bg-surface border-neutral-700 text-neutral-500 hover:border-neutral-500'
        }
      `}
    >
      {label}
    </button>
  );
}

interface Step1Props {
  onNext: () => void;
  businessType: BusinessType;
  setBusinessType: (type: BusinessType) => void;
  bizNumber: string | null;
  setBizNumber: (num: string) => void;
}

export default function Step1({ onNext, businessType, setBusinessType, bizNumber, setBizNumber }: Step1Props) {
  const [isVerified, setIsVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const formatBizNumber = (value: string, type: BusinessType) => {
    if (type === 'BUSINESS') {
      const digits = value.replace(/\D/g, '').slice(0, 13);
      if (digits.length <= 6) return digits;
      return `${digits.slice(0, 6)}-${digits.slice(6)}`;
    }
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  };

  const handleBizNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBizNumber(e.target.value, businessType);
    setBizNumber(formatted);
    setIsVerified(false);
    setVerifyError('');
  };

  const { mutateAsync: checkBusiness } = useCheckBusinessStatus();

  const handleVerify = async () => {
    const currentBizNum = bizNumber || '';
    const digits = currentBizNum.replace(/\D/g, '');
    const requiredLength = businessType === 'BUSINESS' ? 13 : 10;
    const label = businessType === 'BUSINESS' ? '법인등록번호' : '사업자등록번호';

    if (digits.length !== requiredLength) {
      setVerifyError(`${label} ${requiredLength}자리를 입력해주세요.`);
      return;
    }
    setIsVerifying(true);
    setVerifyError('');
    try {
      const isValid = await checkBusiness({ businessNumber: digits, businessType });

      if (isValid) {
        setIsVerified(true);
      } else {
        setVerifyError('휴폐업 또는 미등록된 사업자 번호입니다.');
      }
    } catch {
      setVerifyError('사업자 인증 통신에 실패했습니다. API 키나 네트워크를 확인해주세요.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNext = () => {
    if (!isVerified) {
      setVerifyError('사업자 인증을 먼저 완료해주세요.');
      return;
    }
    onNext();
  };

  return (
    <>
      <p className="text-lg text-neutral-400 mb-6">개인/법인 사업자 인증을 해주세요</p>

      <div className="flex gap-5 mb-8">
        <BusinessTypeCard
          label="개인 사업자"
          selected={businessType === 'INDIVIDUAL'}
          onClick={() => {
            setBusinessType('INDIVIDUAL');
            setBizNumber('');
            setIsVerified(false);
            setVerifyError('');
          }}
        />
        <BusinessTypeCard
          label="법인 사업자"
          selected={businessType === 'BUSINESS'}
          onClick={() => {
            setBusinessType('BUSINESS');
            setBizNumber('');
            setIsVerified(false);
            setVerifyError('');
          }}
        />
      </div>

      <div className="flex gap-3 mb-3">
        <input
          type="text"
          value={bizNumber || ''}
          onChange={handleBizNumberChange}
          placeholder={
            businessType === 'BUSINESS' ? '법인등록번호 -없이 숫자만 입력' : '사업자등록번호 -없이 숫자만 입력'
          }
          disabled={isVerified}
          className={`flex-1 h-14 bg-surface border rounded-xl text-base px-5 outline-none font-[inherit] placeholder:text-neutral-600 transition-colors ${
            isVerified ? 'border-ember text-ember' : 'border-neutral-700 text-neutral-200 focus:border-warm'
          }`}
        />
        <Button
          variant={isVerified ? 'outline' : 'warm'}
          size="small"
          onClick={handleVerify}
          disabled={
            isVerifying ||
            isVerified ||
            (bizNumber || '').replace(/\D/g, '').length !== (businessType === 'BUSINESS' ? 13 : 10)
          }
          className="h-14! w-auto! px-6 rounded-xl! text-base!"
        >
          {isVerifying ? '인증 중...' : isVerified ? '인증 완료' : '인증 하기'}
        </Button>
      </div>

      {verifyError && <p className="text-accent-light text-sm pl-1 mb-3">{verifyError}</p>}
      {isVerified && <p className="text-ember text-sm pl-1 mb-3">사업자 인증이 완료되었습니다</p>}

      <div className="flex justify-end sticky bottom-0 pt-8 pb-6 bg-background">
        <Button variant="warm" onClick={handleNext} size="small" className="w-32! h-12! rounded-xl! text-base!">
          다음
        </Button>
      </div>
    </>
  );
}
