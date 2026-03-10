import { useState } from 'react';
import Button from '@/components/common/Button';
import { useRegisterAccount } from '@/api/hooks/usePostRegisterAccount';
import { BANKS } from '../../pages/SellerOnboarding/constants';

export default function Step3({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  const { mutateAsync: registerAccount, isPending: isRegistering } = useRegisterAccount();
  const [accountName, setaccountName] = useState('');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState('');

  const inputStyle = {
    height: '48px',
    backgroundColor: '#0B0C10',
    border: '1px solid #2C2C2E',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    padding: '0 16px',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
  } as React.CSSProperties;

  const handleNext = async () => {
    if (!accountName) {
      setError('예금주명을 입력해주세요.');
      return;
    }
    if (!bank) {
      setError('은행을 선택해주세요.');
      return;
    }
    if (!accountNumber) {
      setError('계좌번호를 입력해주세요.');
      return;
    }
    setError('');

    try {
      await registerAccount({
        bankName: bank,
        bankCode: bank,
        accountNum: accountNumber,
        accountName,
      });
      onNext();
    } catch {
      setError('계좌 등록에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
          정산받을 은행 계좌 인증을 진행해주세요.
        </h2>
        <p style={{ fontSize: '14px', color: '#C8C8C8' }}>판매 금액이 정산되는 계좌입니다.</p>
      </div>

      {/* 계좌 정보 입력 */}
      <p style={{ fontSize: '14px', color: '#E5E5EA', marginBottom: '12px', fontWeight: '600' }}>계좌 정보 입력</p>

      {/* 예금주명 */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          value={accountName}
          onChange={(e) => {
            setaccountName(e.target.value);
            setError('');
          }}
          placeholder="예금주명"
          style={inputStyle}
        />
      </div>

      {/* Bank dropdown */}
      <div style={{ marginBottom: '16px', position: 'relative' }}>
        <select
          value={bank}
          onChange={(e) => {
            setBank(e.target.value);
            setError('');
          }}
          style={{
            ...inputStyle,
            appearance: 'none',
            color: bank ? 'white' : '#636366',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
            paddingRight: '40px',
            cursor: 'pointer',
          }}
        >
          <option value="" disabled hidden>
            은행 선택
          </option>
          {BANKS.map((b) => (
            <option key={b} value={b} style={{ backgroundColor: '#1C1C1E' }}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Account number */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => {
            setAccountNumber(e.target.value.replace(/\D/g, ''));
            setError('');
          }}
          placeholder="계좌번호"
          style={inputStyle}
          maxLength={20}
        />
      </div>

      {error && <p style={{ color: '#FF453A', fontSize: '13px', paddingLeft: '4px', marginBottom: '8px' }}>{error}</p>}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
        <Button variant="outline" onClick={onPrev} className="w-30!">
          이전
        </Button>
        <Button onClick={handleNext} disabled={isRegistering} className="w-30!">
          {isRegistering ? '등록 중...' : '다음'}
        </Button>
      </div>
    </>
  );
}
