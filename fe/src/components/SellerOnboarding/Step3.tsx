import { useState } from 'react';
import Button from '@/components/common/Button';
import { BANKS } from '../../pages/SellerOnboarding/constants';
import type { AccountData } from '../../pages/SellerOnboarding';

type Step3Props = {
  onPrev: () => void;
  onNext: (data: AccountData) => void;
  hasExistingAccount: boolean;
};

const BANK_LIST = BANKS.filter((b) => Number(b.code) < 200);
const STOCK_LIST = BANKS.filter((b) => Number(b.code) >= 200);

export default function Step3({ onPrev, onNext }: Step3Props) {
  const [accountName, setaccountName] = useState('');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState('');
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankTab, setBankTab] = useState<'bank' | 'stock'>('bank');

  const selectedBankName = BANKS.find((b) => b.code === bank)?.name || '';

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

  const handleNext = () => {
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
    onNext({ bankCode: bank, accountNum: accountNumber, accountName });
  };

  const handleSelectBank = (code: string) => {
    setBank(code);
    setError('');
    setShowBankModal(false);
  };

  const currentList = bankTab === 'bank' ? BANK_LIST : STOCK_LIST;

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

      {/* 은행 선택 버튼 */}
      <div style={{ marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setShowBankModal(true)}
          style={{
            ...inputStyle,
            textAlign: 'left',
            color: bank ? 'white' : '#636366',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{bank ? selectedBankName : '은행/증권사 선택'}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* 은행 선택 모달 */}
      {showBankModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowBankModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '430px',
              maxHeight: '70vh',
              backgroundColor: '#1C1C1E',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'white' }}>은행/증권사 선택</h3>
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  style={{ background: 'none', border: 'none', color: '#8E8E93', fontSize: '24px', cursor: 'pointer', padding: '0' }}
                >
                  &times;
                </button>
              </div>

              {/* 탭 */}
              <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #2C2C2E' }}>
                {(['bank', 'stock'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setBankTab(tab)}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      background: 'none',
                      border: 'none',
                      borderBottom: bankTab === tab ? '2px solid #CEAF82' : '2px solid transparent',
                      color: bankTab === tab ? '#CEAF82' : '#8E8E93',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {tab === 'bank' ? '은행' : '증권사'}
                  </button>
                ))}
              </div>
            </div>

            {/* 목록 */}
            <div style={{ overflowY: 'auto', padding: '8px 20px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {currentList.map((b) => (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => handleSelectBank(b.code)}
                    style={{
                      padding: '12px 4px',
                      backgroundColor: bank === b.code ? '#CEAF82' : '#2C2C2E',
                      color: bank === b.code ? '#0B0C10' : '#E5E5EA',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: bank === b.code ? '700' : '400',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
        <Button onClick={handleNext} className="w-30!">
          다음
        </Button>
      </div>
    </>
  );
}
