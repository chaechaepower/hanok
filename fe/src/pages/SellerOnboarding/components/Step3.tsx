import { useState } from 'react';
import Button from '@/components/common/Button';
import { BANKS } from '../constants';

export default function Step3({
  onPrev,
  onNext,
}: {
  onPrev: () => void;
  onNext: () => void;
}) {
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const inputStyle = {
    height: '48px',
    backgroundColor: '#1C1C1E',
    border: '1px solid #3A3A3C',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    padding: '0 16px',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
  } as React.CSSProperties;

  const handleSendCode = async () => {
    if (!bank) { setError('은행을 선택해주세요.'); return; }
    if (!accountNumber) { setError('계좌번호를 입력해주세요.'); return; }
    setError('');
    setIsSending(true);
    try {
      // TODO: 계좌 인증번호 전송 API 연동
      await new Promise((r) => setTimeout(r, 800));
      setCodeSent(true);
    } catch {
      setError('인증번호 전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode) { setError('인증 번호를 입력해주세요.'); return; }
    setError('');
    setIsVerifying(true);
    try {
      // TODO: 계좌 인증 확인 API 연동
      await new Promise((r) => setTimeout(r, 800));
      setIsVerified(true);
    } catch {
      setError('인증에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNext = () => {
    if (!isVerified) { setError('계좌 인증을 완료해주세요.'); return; }
    onNext();
  };

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>
          정산받을 은행 계좌 인증을 진행해주세요.
        </h2>
        <p style={{ fontSize: '14px', color: '#C8C8C8' }}>판매 금액이 정산되는 계좌입니다.</p>
      </div>

      {/* 계좌 정보 입력 */}
      <p style={{ fontSize: '14px', color: '#E5E5EA', marginBottom: '12px', fontWeight: '600' }}>계좌 정보 입력</p>

      {/* Bank dropdown */}
      <div style={{ marginBottom: '10px', position: 'relative' }}>
        <select
          value={bank}
          onChange={(e) => { setBank(e.target.value); setError(''); }}
          disabled={isVerified}
          style={{
            ...inputStyle,
            appearance: 'none',
            color: bank ? 'white' : '#636366',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
            paddingRight: '40px',
            cursor: isVerified ? 'default' : 'pointer',
          }}
        >
          <option value="" disabled hidden>은행 선택</option>
          {BANKS.map((b) => (
            <option key={b} value={b} style={{ backgroundColor: '#1C1C1E' }}>{b}</option>
          ))}
        </select>
      </div>

      {/* Account number + send code button */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, '')); setError(''); }}
          placeholder="계좌번호"
          disabled={isVerified}
          style={{ ...inputStyle, flex: 1 }}
          maxLength={20}
        />
        <Button
          variant={codeSent ? 'outline' : 'yellow'}
          size="small"
          onClick={handleSendCode}
          disabled={isSending || codeSent}
          className="!h-[48px] !w-auto px-5"
        >
          {isSending ? '전송 중...' : codeSent ? '전송 완료' : '인증 번호'}
        </Button>
      </div>

      {/* Verify section */}
      {codeSent && (
        <>
          <p style={{ fontSize: '14px', color: '#E5E5EA', marginBottom: '10px', lineHeight: '1.7' }}>
            입력하신 계좌로 1원을 보냈습니다.<br />
            <span style={{ color: '#CEAF82', fontWeight: '600' }}>'한옥'</span> 앞 숫자 3자리를 입력해주세요.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 3)); setError(''); }}
              placeholder="인증 번호 입력"
              disabled={isVerified}
              style={{ ...inputStyle, flex: 1, border: `1px solid ${isVerified ? '#CEAF82' : '#3A3A3C'}`, color: isVerified ? '#CEAF82' : 'white' }}
              maxLength={3}
            />
            <Button
              variant={isVerified ? 'outline' : 'yellow'}
              size="small"
              onClick={handleVerify}
              disabled={isVerifying || isVerified}
              className="!h-[48px] !w-auto px-5"
            >
              {isVerifying ? '인증 중...' : isVerified ? '인증 완료' : '인증 하기'}
            </Button>
          </div>
          <p style={{ fontSize: '12px', color: '#636366', lineHeight: '1.7', marginBottom: '8px' }}>
            인증 번호 전송은 일 최대 3회까지 가능합니다.<br />
            신청이 많은 경우, 최대 5분까지 소요될 수 있습니다.
          </p>
        </>
      )}

      {error && (
        <p style={{ color: '#FF453A', fontSize: '13px', paddingLeft: '4px', marginBottom: '8px' }}>{error}</p>
      )}
      {isVerified && (
        <p style={{ color: '#32D74B', fontSize: '13px', paddingLeft: '4px', marginBottom: '8px' }}>계좌 인증이 완료되었습니다.</p>
      )}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
        <Button variant="outline" size="small" onClick={onPrev} className="!w-[120px]">
          이전
        </Button>
        <Button variant="white" size="small" onClick={handleNext} disabled={!isVerified} className="!w-[120px]">
          다음
        </Button>
      </div>
    </>
  );
}
